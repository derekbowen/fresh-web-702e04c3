import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ChevronDown, ChevronRight, CheckCircle2, XCircle, Clock, Ban, RefreshCw, ExternalLink } from "lucide-react";
import { listSeoBatches, getSeoBatchDetails, type SeoBatchSummary, type SeoBatchJobDetail } from "@/server/admin-tools.functions";

export const Route = createFileRoute("/admin/job-history")({
  head: () => ({ meta: [{ title: "Job history — Admin" }] }),
  component: JobHistoryPage,
});

const RANGES = [
  { label: "24h", hours: 24 },
  { label: "3d", hours: 72 },
  { label: "7d", hours: 168 },
  { label: "30d", hours: 720 },
];

const STATUS_OPTS = ["all", "running", "done", "failed", "cancelled"] as const;
type StatusFilter = (typeof STATUS_OPTS)[number];

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function fmtDuration(start: string, end: string | null): string {
  if (!end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  if (m < 60) return `${m}m ${rs}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function batchStatus(b: SeoBatchSummary): "running" | "done" | "failed" | "cancelled" {
  if (b.queued + b.processing > 0) return "running";
  if (b.failed > 0 && b.done === 0) return "failed";
  if (b.cancelled > 0 && b.done === 0) return "cancelled";
  return "done";
}

function StatusPill({ s }: { s: ReturnType<typeof batchStatus> }) {
  const map: Record<string, { cls: string; Icon: typeof Clock; label: string }> = {
    running: { cls: "bg-blue-500/15 text-blue-700 dark:text-blue-300", Icon: Loader2, label: "Running" },
    done: { cls: "bg-green-500/15 text-green-700 dark:text-green-300", Icon: CheckCircle2, label: "Done" },
    failed: { cls: "bg-red-500/15 text-red-700 dark:text-red-300", Icon: XCircle, label: "Failed" },
    cancelled: { cls: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300", Icon: Ban, label: "Cancelled" },
  };
  const { cls, Icon, label } = map[s];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      <Icon className={`h-3 w-3 ${s === "running" ? "animate-spin" : ""}`} />
      {label}
    </span>
  );
}

function JobHistoryPage() {
  const [hours, setHours] = React.useState(168);
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [search, setSearch] = React.useState("");
  const list = useServerFn(listSeoBatches);
  const qc = useQueryClient();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["seo-batches", hours],
    queryFn: () => list({ data: { sinceHours: hours } }),
    refetchInterval: 15000,
  });

  const batches = (data?.batches || []) as SeoBatchSummary[];
  const filtered = batches.filter((b) => {
    if (status !== "all" && batchStatus(b) !== status) return false;
    if (search && !b.batchId.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = React.useMemo(() => {
    const c = { all: batches.length, running: 0, done: 0, failed: 0, cancelled: 0 } as Record<StatusFilter, number>;
    for (const b of batches) c[batchStatus(b)] += 1;
    return c;
  }, [batches]);

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Job history</h1>
          <p className="text-sm text-muted-foreground">Background AI runs (bulk SEO fixes) — completed and failed.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-muted"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.hours}
              onClick={() => setHours(r.hours)}
              className={`rounded px-2 py-1 text-xs ${hours === r.hours ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
          {STATUS_OPTS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded px-2 py-1 text-xs capitalize ${status === s ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              {s} <span className="ml-1 text-muted-foreground">({counts[s] || 0})</span>
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by batch ID…"
          className="ml-auto w-56 rounded-md border border-border bg-background px-2 py-1 text-sm"
        />
      </div>

      <div className="rounded-lg border border-border bg-card">
        {isLoading ? (
          <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading job history…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No jobs found in this window. Kick off a bulk run from{" "}
            <Link to="/admin/content-pages" className="text-primary hover:underline">Bulk page editor</Link>.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="w-8 px-3 py-2"></th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Started</th>
                <th className="px-3 py-2">Duration</th>
                <th className="px-3 py-2">Mode</th>
                <th className="px-3 py-2">Progress</th>
                <th className="px-3 py-2">Batch</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <BatchRow key={b.batchId} batch={b} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function BatchRow({ batch }: { batch: SeoBatchSummary }) {
  const [open, setOpen] = React.useState(false);
  const s = batchStatus(batch);
  const completed = batch.done + batch.failed + batch.cancelled;
  const pct = batch.total === 0 ? 0 : Math.round((completed / batch.total) * 100);

  return (
    <>
      <tr className="border-b border-border/60 hover:bg-muted/30">
        <td className="px-3 py-2">
          <button onClick={() => setOpen((v) => !v)} className="rounded p-0.5 hover:bg-muted" aria-label="Expand">
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </td>
        <td className="px-3 py-2"><StatusPill s={s} /></td>
        <td className="px-3 py-2 whitespace-nowrap">{fmtDate(batch.startedAt)}</td>
        <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{fmtDuration(batch.startedAt, batch.finishedAt)}</td>
        <td className="px-3 py-2 capitalize">{batch.mode.replace("_", " ")}</td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted">
              <div className={`h-full ${s === "failed" ? "bg-red-500" : s === "cancelled" ? "bg-yellow-500" : s === "done" ? "bg-green-500" : "bg-primary"}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="tabular-nums text-xs text-muted-foreground">
              {batch.done}✓ {batch.failed > 0 ? `${batch.failed}✗ ` : ""}{batch.cancelled > 0 ? `${batch.cancelled}⊘ ` : ""}/ {batch.total}
            </span>
          </div>
        </td>
        <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">{batch.batchId.slice(0, 8)}…</td>
      </tr>
      {open && (
        <tr>
          <td colSpan={7} className="bg-muted/20 px-3 py-3">
            <BatchDetails batchId={batch.batchId} />
          </td>
        </tr>
      )}
    </>
  );
}

function BatchDetails({ batchId }: { batchId: string }) {
  const get = useServerFn(getSeoBatchDetails);
  const { data, isLoading } = useQuery({
    queryKey: ["seo-batch-details", batchId],
    queryFn: () => get({ data: { batchId } }),
  });

  if (isLoading) {
    return <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading details…</div>;
  }
  const jobs = (data?.jobs || []) as SeoBatchJobDetail[];
  if (jobs.length === 0) return <div className="text-xs text-muted-foreground">No jobs in this batch.</div>;

  return (
    <div className="overflow-x-auto rounded-md border border-border bg-card">
      <table className="w-full text-xs">
        <thead className="bg-muted/50 text-left uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-2 py-1.5">Status</th>
            <th className="px-2 py-1.5">Page</th>
            <th className="px-2 py-1.5">Mode</th>
            <th className="px-2 py-1.5">Attempts</th>
            <th className="px-2 py-1.5">Started</th>
            <th className="px-2 py-1.5">Finished</th>
            <th className="px-2 py-1.5">Duration</th>
            <th className="px-2 py-1.5">Notes</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((j) => (
            <tr key={j.id} className="border-t border-border/60 align-top">
              <td className="px-2 py-1.5"><JobStatusPill s={j.status} /></td>
              <td className="px-2 py-1.5">
                <div className="font-medium">{j.title || "(untitled)"}</div>
                {j.url_path && (
                  <a href={j.url_path} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline">
                    {j.url_path} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </td>
              <td className="px-2 py-1.5 capitalize">{j.mode.replace("_", " ")}</td>
              <td className="px-2 py-1.5 tabular-nums">{j.attempts}</td>
              <td className="px-2 py-1.5 whitespace-nowrap text-muted-foreground">{fmtDate(j.created_at)}</td>
              <td className="px-2 py-1.5 whitespace-nowrap text-muted-foreground">{fmtDate(j.finished_at)}</td>
              <td className="px-2 py-1.5 whitespace-nowrap text-muted-foreground">{fmtDuration(j.created_at, j.finished_at)}</td>
              <td className="px-2 py-1.5">
                {j.error ? (
                  <span className="text-red-600" title={j.error}>{j.error.length > 80 ? j.error.slice(0, 80) + "…" : j.error}</span>
                ) : j.result?.summary ? (
                  <span className="text-muted-foreground">{String(j.result.summary).slice(0, 80)}</span>
                ) : (
                  <span className="text-muted-foreground/60">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function JobStatusPill({ s }: { s: string }) {
  const map: Record<string, string> = {
    queued: "bg-muted text-foreground",
    processing: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    done: "bg-green-500/15 text-green-700 dark:text-green-300",
    failed: "bg-red-500/15 text-red-700 dark:text-red-300",
    cancelled: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300",
  };
  return <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize ${map[s] || "bg-muted"}`}>{s}</span>;
}
