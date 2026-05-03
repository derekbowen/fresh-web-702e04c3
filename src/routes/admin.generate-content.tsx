import * as React from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { checkAdminRole } from "@/server/admin-auth.functions";
import { generateContentBatch } from "@/server/generate-content-batch.functions";
import { SiteHeader, SiteFooter } from "@/components/site-layout";

export const Route = createFileRoute("/admin/generate-content")({
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user)
      throw redirect({
        to: "/auth",
        search: { redirect: "/admin/generate-content", mode: "signin" },
      });
    const { isAdmin } = await checkAdminRole();
    if (!isAdmin) throw redirect({ to: "/" });
  },
  component: GenerateContentPage,
});

function GenerateContentPage() {
  const [count, setCount] = React.useState(10);
  const [tier, setTier] = React.useState<string>("T1 (200k+)");
  const [stateCode, setStateCode] = React.useState("");
  const [warmOnly, setWarmOnly] = React.useState(false);
  const [model, setModel] = React.useState("google/gemini-2.5-pro");
  const [busy, setBusy] = React.useState(false);
  const [dryRun, setDryRun] = React.useState(false);
  const [autoLoop, setAutoLoop] = React.useState(false);
  const [maxBatches, setMaxBatches] = React.useState(20);
  const [result, setResult] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState<{
    batch: number;
    inserted: number;
    failed: number;
    pages: Array<{ slug: string; title: string }>;
  }>({ batch: 0, inserted: 0, failed: 0, pages: [] });
  const stopRef = React.useRef(false);

  const runOnce = async () => {
    return await generateContentBatch({
      data: {
        count,
        tier: tier || undefined,
        stateCode: stateCode.trim() || undefined,
        warmOnly,
        model,
        dryRun,
      } as any,
    });
  };

  const run = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    setProgress({ batch: 0, inserted: 0, failed: 0, pages: [] });
    stopRef.current = false;
    try {
      if (!autoLoop) {
        const res = await runOnce();
        setResult(res);
      } else {
        let totalInserted = 0;
        let totalFailed = 0;
        const allPages: Array<{ slug: string; title: string }> = [];
        for (let i = 1; i <= maxBatches; i++) {
          if (stopRef.current) break;
          const res: any = await runOnce();
          totalInserted += res?.inserted ?? 0;
          totalFailed += (res?.attempted ?? 0) - (res?.inserted ?? 0);
          if (res?.pages) allPages.push(...res.pages);
          setProgress({
            batch: i,
            inserted: totalInserted,
            failed: totalFailed,
            pages: allPages.slice(-50),
          });
          if (!res?.attempted) break; // queue empty
        }
      }
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  const stop = () => {
    stopRef.current = true;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-bold">Generate from Content Plan</h1>
        <p className="mt-2 text-muted-foreground">
          Pulls pending rows from <code>content_plan</code> (3,286 prioritized
          pages), generates each one with Gemini using its own H1, keywords, and
          uniqueness angle, validates internal links + FAQ, then inserts into{" "}
          <code>content_pages</code>. No SQL copy-paste, no doorway pages.
        </p>

        <div className="mt-6 space-y-4 rounded-lg border border-border bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Pages this run</label>
              <input
                type="number"
                min={1}
                max={25}
                value={count}
                onChange={(e) => setCount(Number(e.target.value) || 1)}
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
              <label className="block text-sm font-medium">
                State code (optional)
              </label>
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
                <option value="google/gemini-2.5-pro">Gemini 2.5 Pro</option>
                <option value="google/gemini-3.1-pro-preview">
                  Gemini 3.1 Pro Preview
                </option>
                <option value="google/gemini-2.5-flash">
                  Gemini 2.5 Flash
                </option>
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
              Auto-loop until queue empty
            </label>
            {autoLoop && (
              <div>
                <label className="block text-xs text-muted-foreground">Max batches</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={maxBatches}
                  onChange={(e) => setMaxBatches(Number(e.target.value) || 1)}
                  className="mt-1 w-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={run}
              disabled={busy}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {busy
                ? autoLoop
                  ? `Looping… batch ${progress.batch}/${maxBatches}`
                  : "Generating… (60–120s)"
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
                Batch {progress.batch} · {progress.inserted} inserted ·{" "}
                {progress.failed} failed
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

        {result && (
          <div className="mt-6 rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {result.ok ? "✓ Success" : "✗ Issues"}
              </h2>
              <div className="text-sm text-muted-foreground">
                {result.inserted ?? 0} inserted / {result.attempted} attempted
              </div>
            </div>
            {result.validationErrors?.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium">
                  {result.validationErrors.length} validation note(s)
                </summary>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {result.validationErrors.map((e: string, i: number) => (
                    <li key={i}>• {e}</li>
                  ))}
                </ul>
              </details>
            )}
            <ul className="mt-4 space-y-2">
              {result.pages?.map((p: any) => (
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
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
