import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { buildMeta } from "@/lib/seo";
import {
  founderBlastDryRunFn,
  founderBlastLiveBatchFn,
  founderBlastSummaryFn,
} from "@/server/founder-blast.functions";

export const Route = createFileRoute("/admin/founder-blast")({
  head: () =>
    buildMeta({
      title: "Founder Blast | Admin",
      description: "One-shot founder update blast",
      path: "/admin/founder-blast",
      noindex: true,
    }),
  component: Page,
});

function Page() {
  const [dryResult, setDryResult] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [autoLoop, setAutoLoop] = useState(false);

  async function doDryRun() {
    setBusy("dryrun");
    setError("");
    try {
      const r = await founderBlastDryRunFn();
      setDryResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Dry-run failed");
    } finally {
      setBusy(null);
    }
  }

  async function doOneBatch(): Promise<number> {
    const r = await founderBlastLiveBatchFn({ data: { batchSize: 6, delayMs: 3000 } });
    setBatches((b) => [...b, r]);
    return r.remaining as number;
  }

  async function doLiveLoop() {
    if (!confirm("Send live emails to ALL pending providers? This cannot be undone.")) return;
    setBusy("live");
    setError("");
    setAutoLoop(true);
    try {
      // Loop until remaining=0 or stopped.
      let safety = 60;
      while (safety-- > 0) {
        const remaining = await doOneBatch();
        if (remaining <= 0) break;
        // small pause between batches to give the UI a chance to render
        await new Promise((res) => setTimeout(res, 500));
      }
      const s = await founderBlastSummaryFn();
      setSummary(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Live send failed");
    } finally {
      setBusy(null);
      setAutoLoop(false);
    }
  }

  async function doSummary() {
    setBusy("summary");
    setError("");
    try {
      const s = await founderBlastSummaryFn();
      setSummary(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Summary failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold">Founder update blast (2026-05-28)</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Template: <code>founder-update-2026-05-28</code> · From:{" "}
        <code>derek@poolrentalnearme.com</code> · Subject: "Pool Rental Near Me update"
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-900">{error}</div>
      )}

      <section className="mt-8 rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">1. Dry-run</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pulls Sharetribe audience, shows counts + first 10 recipients, and sends ONE preview
          to derek@poolrentalnearme.com with firstName="Derek".
        </p>
        <button
          onClick={doDryRun}
          disabled={busy !== null}
          className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {busy === "dryrun" ? "Running…" : "Run dry-run"}
        </button>
        {dryResult && (
          <div className="mt-4 space-y-2 text-sm">
            <div>
              <strong>Audience:</strong> {dryResult.audienceCount} ·{" "}
              <strong>With firstName:</strong> {dryResult.withFirstName} ·{" "}
              <strong>Falling back to "there":</strong> {dryResult.withoutFirstName}
            </div>
            <div>
              <strong>Preview to derek@:</strong>{" "}
              {dryResult.preview.ok ? "✓ sent" : `✗ ${dryResult.preview.error}`}
            </div>
            <details className="rounded border bg-muted/40 p-3">
              <summary className="cursor-pointer font-semibold">First 10 recipients</summary>
              <table className="mt-2 w-full text-xs">
                <thead>
                  <tr className="text-left">
                    <th className="pr-3">Email</th>
                    <th className="pr-3">firstName</th>
                    <th>Has name?</th>
                  </tr>
                </thead>
                <tbody>
                  {dryResult.sample.map((s: any) => (
                    <tr key={s.email}>
                      <td className="pr-3">{s.email}</td>
                      <td className="pr-3">{s.firstName ?? "—"}</td>
                      <td>{s.hasFirstName ? "yes" : "no (fallback)"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">2. Live send</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Throttled at 1 send / 3 seconds. Runs in batches of 6 per server call; this page
          loops automatically until all pending recipients are sent. Idempotent: rerunning
          skips any address already logged for this template.
        </p>
        <button
          onClick={doLiveLoop}
          disabled={busy !== null || !dryResult}
          className="mt-4 rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy === "live" ? `Sending… (${batches.length} batches)` : "Fire live send"}
        </button>
        {!dryResult && (
          <p className="mt-2 text-xs text-muted-foreground">Run the dry-run first.</p>
        )}

        {batches.length > 0 && (
          <div className="mt-4 space-y-2 text-sm">
            <div>
              <strong>Batches run:</strong> {batches.length} ·{" "}
              <strong>Remaining:</strong> {batches[batches.length - 1]?.remaining ?? "?"} ·{" "}
              {autoLoop && <span className="text-amber-700">looping…</span>}
            </div>
            <details className="rounded border bg-muted/40 p-3">
              <summary className="cursor-pointer font-semibold">Batch details</summary>
              {batches.map((b, i) => (
                <div key={i} className="mt-3 border-t pt-2 text-xs">
                  <div>
                    Batch {i + 1}: {b.processed} sent, {b.remaining} remaining ·{" "}
                    {b.startedAt} → {b.finishedAt}
                  </div>
                  <ul className="ml-4 list-disc">
                    {b.results.map((r: any) => (
                      <li key={r.email}>
                        {r.email} ({r.firstName ?? "there"}) — {r.status}
                        {r.error ? ` · ${r.error}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </details>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">3. Final summary</h2>
        <button
          onClick={doSummary}
          disabled={busy !== null}
          className="mt-4 rounded-full border px-5 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {busy === "summary" ? "Loading…" : "Refresh summary"}
        </button>
        {summary && (
          <div className="mt-4 space-y-2 text-sm">
            <div>
              <strong>Sent:</strong> {summary.totalSent} ·{" "}
              <strong>Suppressed:</strong> {summary.totalSuppressed} ·{" "}
              <strong>Failed:</strong> {summary.totalFailed}
            </div>
            <div>
              <strong>First send:</strong> {summary.firstSendAt ?? "—"} ·{" "}
              <strong>Last send:</strong> {summary.lastSendAt ?? "—"}
            </div>
            {summary.suppressed.length > 0 && (
              <details className="rounded border bg-muted/40 p-3">
                <summary className="cursor-pointer font-semibold">
                  Suppressed ({summary.suppressed.length})
                </summary>
                <ul className="ml-4 list-disc text-xs">
                  {summary.suppressed.map((e: string) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </details>
            )}
            {summary.failed.length > 0 && (
              <details className="rounded border bg-rose-50 p-3">
                <summary className="cursor-pointer font-semibold text-rose-900">
                  Failed ({summary.failed.length})
                </summary>
                <ul className="ml-4 list-disc text-xs text-rose-900">
                  {summary.failed.map((f: any) => (
                    <li key={f.email}>
                      {f.email} — {f.error ?? "unknown"}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </section>
    </AdminLayout>
  );
}
