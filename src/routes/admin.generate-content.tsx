import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { checkAdminRole } from "@/server/admin-auth.functions";
import { generateContentBatch } from "@/server/generate-content-batch.functions";
import { AdminLayout } from "@/components/admin-layout";

export const Route = createFileRoute("/admin/generate-content")({
  component: GenerateContentPage,
});

function useAdminGate() {
  const navigate = useNavigate();
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!data.user) {
        navigate({
          to: "/auth",
          search: { redirect: "/admin/generate-content", mode: "signin" },
        });
        return;
      }
      const { isAdmin } = await checkAdminRole();
      if (cancelled) return;
      if (!isAdmin) {
        navigate({ to: "/admin/no-access" });
        return;
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);
  return ready;
}

function GenerateContentPage() {
  const ready = useAdminGate();
  if (!ready) {
    return (
      <AdminLayout>
          <p className="text-sm text-muted-foreground">Checking admin access…</p>
        </AdminLayout>
    );
  }
  return <GenerateContentPageInner />;
}

function GenerateContentPageInner() {
  type PageSummary = { slug: string; url_path?: string; title?: string | null };
  type GenerateResponse = {
    ok?: boolean;
    queued?: boolean;
    inserted?: number;
    attempted?: number;
    pendingSlugs?: string[];
    validationErrors?: string[];
    pages?: PageSummary[];
    edgeFunction?: string;
    adminAuth?: string;
    lovableApiKey?: string;
    aiGateway?: string;
    aiError?: string | null;
    pendingPlanRows?: number;
    error?: string;
  };
  const getErrorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e));
  const [count, setCount] = React.useState(10);
  const [tier, setTier] = React.useState<string>("T1 (200k+)");
  const [stateCode, setStateCode] = React.useState("");
  const [warmOnly, setWarmOnly] = React.useState(false);
  const [model, setModel] = React.useState("google/gemini-3-flash-preview");
  const [busy, setBusy] = React.useState(false);
  const [dryRun, setDryRun] = React.useState(false);
  const [autoLoop, setAutoLoop] = React.useState(true);
  const [maxBatches, setMaxBatches] = React.useState(10);
  const [result, setResult] = React.useState<GenerateResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [preflight, setPreflight] = React.useState<{
    status: "idle" | "checking" | "ok" | "failed";
    details: GenerateResponse | null;
  }>({ status: "idle", details: null });
  const [progress, setProgress] = React.useState<{
    batch: number;
    inserted: number;
    failed: number;
    pages: PageSummary[];
  }>({ batch: 0, inserted: 0, failed: 0, pages: [] });
  const pollTimerRef = React.useRef<number | null>(null);
  const stopRef = React.useRef(false);
  const autoRunRef = React.useRef<{
    active: boolean;
    nextBatch: number;
    maxBatches: number;
    totalInserted: number;
    totalFailed: number;
    pages: PageSummary[];
  }>({ active: false, nextBatch: 1, maxBatches: 0, totalInserted: 0, totalFailed: 0, pages: [] });

  type LogEntry = {
    id: number;
    at: string;
    action: "preflight" | "start" | "status";
    endpoint: string;
    durationMs: number;
    ok: boolean;
    httpStatus?: number;
    summary: string;
    response?: unknown;
    error?: string;
  };
  const [log, setLog] = React.useState<LogEntry[]>([]);
  const logIdRef = React.useRef(0);
  const ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL ?? ""}/functions/v1/generate-content-batch`;

  const appendLog = React.useCallback((entry: Omit<LogEntry, "id" | "at">) => {
    setLog((prev) =>
      [
        {
          ...entry,
          id: ++logIdRef.current,
          at: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 50),
    );
  }, []);

  const callEdge = React.useCallback(
    async (
      action: "preflight" | "start" | "status",
      extra?: { slugs?: string[] },
    ): Promise<GenerateResponse> => {
      const started = performance.now();
      try {
        const res = await generateContentBatch({
          data: {
            action,
            count,
            tier: tier || undefined,
            stateCode: stateCode.trim() || undefined,
            warmOnly,
            model,
            dryRun,
            slugs: extra?.slugs,
          },
        });
        const response = res as GenerateResponse;
        const durationMs = Math.round(performance.now() - started);
        const summary =
          action === "preflight"
            ? response.ok
              ? "Setup verified"
              : `Preflight failed: ${response.aiError ?? "see details"}`
            : action === "status"
              ? `Status: ${response.pendingSlugs?.length ?? 0} pending, ${response.inserted ?? 0} inserted`
              : response.queued
                ? `Queued ${response.attempted ?? 0} page(s) for background generation`
                : `Returned ${response.inserted ?? 0}/${response.attempted ?? 0} inserted`;
        appendLog({
          action,
          endpoint: ENDPOINT,
          durationMs,
          ok: Boolean(response.ok ?? response.queued),
          httpStatus: 200,
          summary,
          response,
        });
        return response;
      } catch (e: unknown) {
        const durationMs = Math.round(performance.now() - started);
        const message = getErrorMessage(e);
        const statusMatch = message.match(/(\b[45]\d{2}\b)/);
        appendLog({
          action,
          endpoint: ENDPOINT,
          durationMs,
          ok: false,
          httpStatus: statusMatch ? Number(statusMatch[1]) : undefined,
          summary: `Failure: ${message.slice(0, 200)}`,
          error: message,
        });
        throw e;
      }
    },
    [ENDPOINT, appendLog, count, dryRun, model, stateCode, tier, warmOnly],
  );
  React.useEffect(() => {
    return () => {
      if (pollTimerRef.current) window.clearTimeout(pollTimerRef.current);
    };
  }, []);

  const runOnce = async (action: "start" | "status" = "start", slugs?: string[]) => {
    return await callEdge(action, { slugs });
  };

  const finishAutoBatch = async (status: GenerateResponse) => {
    const runState = autoRunRef.current;
    const inserted = status?.inserted ?? 0;
    const attempted = status?.attempted ?? 0;
    const failed = Math.max(0, attempted - inserted);
    const nextPages = [...runState.pages, ...(status?.pages ?? [])].slice(-100);
    runState.totalInserted += inserted;
    runState.totalFailed += failed;
    runState.pages = nextPages;
    setProgress({
      batch: Math.max(0, runState.nextBatch - 1),
      inserted: runState.totalInserted,
      failed: runState.totalFailed,
      pages: nextPages,
    });

    if (stopRef.current || runState.nextBatch > runState.maxBatches || attempted === 0) {
      runState.active = false;
      setBusy(false);
      return;
    }

    const res = await runOnce("start");
    setResult(res);
    runState.nextBatch += 1;
    if (res?.queued && res?.pendingSlugs?.length) {
      scheduleStatusPoll(res.pendingSlugs);
      return;
    }
    await finishAutoBatch(res);
  };

  const scheduleStatusPoll = (slugs: string[]) => {
    if (pollTimerRef.current) window.clearTimeout(pollTimerRef.current);
    pollTimerRef.current = window.setTimeout(async () => {
      try {
        const status = await runOnce("status", slugs);
        setResult(status);
        const pending = status?.pendingSlugs ?? [];
        if (pending.length > 0 && !stopRef.current) {
          scheduleStatusPoll(pending);
        } else if (autoRunRef.current.active) {
          await finishAutoBatch(status);
        } else {
          setBusy(false);
        }
      } catch (e: unknown) {
        setError(getErrorMessage(e));
        setBusy(false);
      }
    }, 5000);
  };

  const runPreflight = React.useCallback(async () => {
    setPreflight({ status: "checking", details: null });
    setError(null);
    try {
      const res = await callEdge("preflight");
      setPreflight({ status: res?.ok ? "ok" : "failed", details: res });
      return Boolean(res?.ok);
    } catch (e: unknown) {
      setPreflight({
        status: "failed",
        details: { error: getErrorMessage(e) },
      });
      setError(getErrorMessage(e));
      return false;
    }
  }, [callEdge]);

  React.useEffect(() => {
    runPreflight();
  }, [runPreflight]);

  const run = async () => {
    if (preflight.status !== "ok") {
      const ok = await runPreflight();
      if (!ok) return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    setProgress({ batch: 0, inserted: 0, failed: 0, pages: [] });
    stopRef.current = false;
    autoRunRef.current = {
      active: autoLoop,
      nextBatch: 1,
      maxBatches,
      totalInserted: 0,
      totalFailed: 0,
      pages: [],
    };
    let keepsPolling = false;
    try {
      if (!autoLoop) {
        const res = await runOnce();
        setResult(res);
        if (res?.queued && res?.pendingSlugs?.length) {
          keepsPolling = true;
          scheduleStatusPoll(res.pendingSlugs);
          return;
        }
      } else {
        const res = await runOnce();
        setResult(res);
        autoRunRef.current.nextBatch = 2;
        if (res?.queued && res?.pendingSlugs?.length) {
          keepsPolling = true;
          scheduleStatusPoll(res.pendingSlugs);
          return;
        }
        keepsPolling = true;
        await finishAutoBatch(res);
      }
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      if (!keepsPolling) setBusy(false);
    }
  };

  const stop = () => {
    stopRef.current = true;
  };

  return (
    <AdminLayout>
        <h1 className="text-3xl font-bold">Generate from Content Plan</h1>
        <p className="mt-2 text-muted-foreground">
          Pulls pending rows from <code>content_plan</code> (3,286 prioritized pages), generates
          each one with Gemini using its own H1, keywords, and uniqueness angle, validates internal
          links + FAQ, then inserts into <code>content_pages</code>. No SQL copy-paste, no doorway
          pages.
        </p>

        <div className="mt-6 space-y-4 rounded-lg border border-border bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Pages this run</label>
              <input
                type="number"
                min={1}
                max={10}
                value={count}
                onChange={(e) => setCount(Math.min(10, Math.max(1, Number(e.target.value) || 1)))}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Priority tier</label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Any</option>
                <option value="T1 (200k+)">T1 — 200k+ (128 pending)</option>
                <option value="T2 (75k–199k)">T2 — 75k–199k</option>
                <option value="T3 (25k–74k)">T3 — 25k–74k</option>
                <option value="T4 (10k–24k)">T4 — 10k–24k</option>
                <option value="longtail">Long-tails (host/trust)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">State code (optional)</label>
              <input
                type="text"
                maxLength={2}
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value.toUpperCase())}
                placeholder="TX"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm uppercase"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="google/gemini-3-flash-preview">Gemini 3 Flash Preview</option>
                <option value="google/gemini-2.5-pro">Gemini 2.5 Pro</option>
                <option value="google/gemini-3.1-pro-preview">Gemini 3.1 Pro Preview</option>
                <option value="google/gemini-2.5-flash">Gemini 2.5 Flash</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={warmOnly}
                onChange={(e) => setWarmOnly(e.target.checked)}
              />
              Warm-climate cities only
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
              />
              Dry run (validate only)
            </label>
          </div>

          <div className="flex flex-wrap items-end gap-4 border-t border-border pt-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={autoLoop}
                onChange={(e) => setAutoLoop(e.target.checked)}
              />
              Auto-loop up to 100 pages
            </label>
            {autoLoop && (
              <div>
                <label className="block text-xs text-muted-foreground">Max batches</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={maxBatches}
                  onChange={(e) =>
                    setMaxBatches(Math.min(10, Math.max(1, Number(e.target.value) || 1)))
                  }
                  className="mt-1 w-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            )}
          </div>

          <div className="rounded-md border border-border bg-muted/30 p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium">
                Setup check:{" "}
                {preflight.status === "checking" && (
                  <span className="text-muted-foreground">Verifying backend…</span>
                )}
                {preflight.status === "ok" && (
                  <span className="text-green-600">✓ Ready to generate</span>
                )}
                {preflight.status === "failed" && (
                  <span className="text-destructive">✗ Not ready</span>
                )}
                {preflight.status === "idle" && (
                  <span className="text-muted-foreground">Not run yet</span>
                )}
              </div>
              <button
                onClick={runPreflight}
                disabled={preflight.status === "checking" || busy}
                className="rounded-md border border-input px-3 py-1.5 text-xs font-medium disabled:opacity-50"
              >
                {preflight.status === "checking" ? "Checking…" : "Re-check setup"}
              </button>
            </div>
            {preflight.details && (
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                <li>
                  Edge function:{" "}
                  <span className="font-mono">
                    {preflight.details.edgeFunction ?? "unreachable"}
                  </span>
                </li>
                <li>
                  Admin auth:{" "}
                  <span className="font-mono">{preflight.details.adminAuth ?? "unknown"}</span>
                </li>
                <li>
                  LOVABLE_API_KEY:{" "}
                  <span className="font-mono">{preflight.details.lovableApiKey ?? "missing"}</span>
                </li>
                <li>
                  AI gateway:{" "}
                  <span className="font-mono">{preflight.details.aiGateway ?? "unknown"}</span>
                  {preflight.details.aiError && (
                    <span className="ml-1 text-destructive">— {preflight.details.aiError}</span>
                  )}
                </li>
                <li>
                  Pending plan rows:{" "}
                  <span className="font-mono">{preflight.details.pendingPlanRows ?? "?"}</span>
                </li>
                {preflight.details.error && (
                  <li className="text-destructive">{preflight.details.error}</li>
                )}
              </ul>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={run}
              disabled={busy || preflight.status !== "ok"}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              title={preflight.status !== "ok" ? "Run the setup check first" : undefined}
            >
              {busy
                ? autoLoop
                  ? `Looping… batch ${progress.batch}/${maxBatches}`
                  : result?.queued
                    ? "Generating in background…"
                    : "Starting generation…"
                : autoLoop
                  ? `Auto-generate up to ${count * maxBatches} pages`
                  : dryRun
                    ? `Generate & Validate ${count} page(s)`
                    : `Generate & Insert ${count} page(s)`}
            </button>
            {busy && autoLoop && (
              <button
                onClick={stop}
                className="rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive"
              >
                Stop after this batch
              </button>
            )}
          </div>

          {error && (
            <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        {autoLoop && progress.batch > 0 && (
          <div className="mt-6 rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Auto-loop progress</h2>
              <div className="text-sm text-muted-foreground">
                Batch {progress.batch} · {progress.inserted} inserted · {progress.failed} failed
              </div>
            </div>
            <ul className="mt-4 max-h-96 space-y-1 overflow-auto text-xs">
              {progress.pages.map((p) => (
                <li key={p.slug}>
                  <a
                    href={`/p/${p.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    /p/{p.slug}
                  </a>
                  <span className="ml-2 text-muted-foreground">{p.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Run log</h2>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>
                {log.length} entr{log.length === 1 ? "y" : "ies"}
              </span>
              <button
                onClick={() => setLog([])}
                disabled={log.length === 0}
                className="rounded-md border border-input px-2 py-1 disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground break-all">
            Endpoint: <code>{ENDPOINT}</code>
          </p>
          {log.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No calls yet. Run the setup check or start a generation to see entries here.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {log.map((e) => (
                <li
                  key={e.id}
                  className={`rounded-md border p-3 text-sm ${
                    e.ok ? "border-border bg-background" : "border-destructive/40 bg-destructive/5"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-mono ${
                        e.ok
                          ? "bg-green-500/10 text-green-700"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {e.ok ? "OK" : "FAIL"}
                    </span>
                    <span className="rounded bg-muted px-2 py-0.5 text-xs font-mono uppercase">
                      {e.action}
                    </span>
                    {typeof e.httpStatus === "number" && (
                      <span className="rounded bg-muted px-2 py-0.5 text-xs font-mono">
                        HTTP {e.httpStatus}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(e.at).toLocaleTimeString()} · {e.durationMs}ms
                    </span>
                  </div>
                  <p className="mt-2">{e.summary}</p>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-muted-foreground">
                      {e.error ? "Error details" : "Response payload"}
                    </summary>
                    <pre className="mt-2 max-h-64 overflow-auto rounded bg-muted/50 p-2 text-xs">
                      {e.error ? e.error : JSON.stringify(e.response ?? null, null, 2)}
                    </pre>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </div>

        {result &&
          (() => {
            const validationErrors = result.validationErrors ?? [];
            const pages = result.pages ?? [];
            return (
              <div className="mt-6 rounded-lg border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{result.ok ? "✓ Success" : "✗ Issues"}</h2>
                  <div className="text-sm text-muted-foreground">
                    {result.inserted ?? 0} inserted / {result.attempted} attempted
                  </div>
                </div>
                {validationErrors.length > 0 && (
                  <details className="mt-3" open>
                    <summary className="cursor-pointer text-sm font-medium text-destructive">
                      {validationErrors.length} validation note(s) — click to see per-slug failure reason
                    </summary>
                    <ul className="mt-2 space-y-1 rounded border border-destructive/30 bg-destructive/5 p-3 text-xs text-foreground">
                      {validationErrors.map((e, i) => (
                        <li key={i} className="font-mono">• {e}</li>
                      ))}
                    </ul>
                  </details>
                )}
                <ul className="mt-4 space-y-2">
                  {pages.map((p) => (
                    <li key={p.slug} className="text-sm">
                      <a
                        href={`/p/${p.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        /p/{p.slug}
                      </a>
                      <span className="ml-2 text-muted-foreground">{p.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}
      </AdminLayout>
  );
}
