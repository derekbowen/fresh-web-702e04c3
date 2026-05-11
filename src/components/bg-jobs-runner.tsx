import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Loader2, X, CheckCircle2, AlertCircle } from "lucide-react";
import { processSeoFixQueue, getSeoJobStatus, cancelQueuedSeoJobs, listSeoBatches } from "@/server/admin-tools.functions";
import { loadJobs, upsertJob, removeJob, useBgJobs, type BgJob } from "@/lib/bg-jobs";

// Single tab leader election: only one tab pumps the queue at a time.
// Uses BroadcastChannel + localStorage heartbeat. Other tabs still display
// progress (read from localStorage) but stay idle as workers.
const LEADER_KEY = "prnm_bg_jobs_leader";
const DISMISS_KEY = "prnm_bg_jobs_dismissed_v1";
const HEARTBEAT_MS = 4000;
const STALE_MS = 12000;

function readDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch { return new Set(); }
}
function wasDismissed(id: string): boolean {
  if (typeof window === "undefined") return false;
  return readDismissed().has(id);
}
function markDismissed(id: string) {
  if (typeof window === "undefined") return;
  const s = readDismissed(); s.add(id);
  // Cap at 200 ids to avoid unbounded growth
  const arr = Array.from(s).slice(-200);
  localStorage.setItem(DISMISS_KEY, JSON.stringify(arr));
}
function labelFor(mode: string, total: number): string {
  const m = mode === "meta_only" ? "Meta fix" : mode === "title_only" ? "Title fix" : mode === "mixed" ? "Bulk fix" : "Auto-fix";
  return `${m} · ${total} page${total === 1 ? "" : "s"}`;
}

function tabId(): string {
  if (typeof window === "undefined") return "ssr";
  const w = window as unknown as { __prnm_tab?: string };
  if (!w.__prnm_tab) w.__prnm_tab = Math.random().toString(36).slice(2);
  return w.__prnm_tab;
}

function readLeader(): { id: string; ts: number } | null {
  try {
    const raw = localStorage.getItem(LEADER_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    return v && typeof v.id === "string" ? v : null;
  } catch { return null; }
}

function claimLeader() {
  const me = tabId();
  const cur = readLeader();
  const now = Date.now();
  if (!cur || now - cur.ts > STALE_MS || cur.id === me) {
    localStorage.setItem(LEADER_KEY, JSON.stringify({ id: me, ts: now }));
    return true;
  }
  return false;
}

export function BgJobsRunner() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const inAdmin = path.startsWith("/admin");

  // Pump loop — only mounts in admin
  React.useEffect(() => {
    if (!inAdmin || typeof window === "undefined") return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let sinceReconcile = 0;

    async function reconcileFromServer() {
      try {
        const { batches } = await listSeoBatches({ data: { sinceHours: 72 } });
        const local = new Map(loadJobs().map((j) => [j.id, j] as const));
        for (const b of batches) {
          const queued = b.queued + b.processing;
          const status: BgJob["status"] = queued > 0
            ? "running"
            : b.cancelled > 0 && b.done === 0 ? "cancelled" : "done";
          const existing = local.get(b.batchId);
          // Hide finished jobs the user already dismissed locally? No — server is
          // truth across browsers. We only skip if local already shows finished
          // matching state (avoids re-adding dismissed jobs). Track dismissals
          // separately so they don't pop back.
          if (!existing && status !== "running" && wasDismissed(b.batchId)) continue;
          const merged: BgJob = {
            id: b.batchId,
            kind: "seo_fix",
            label: existing?.label || labelFor(b.mode, b.total),
            total: b.total,
            done: b.done,
            failed: b.failed,
            cancelled: b.cancelled,
            status,
            startedAt: existing?.startedAt ?? new Date(b.startedAt).getTime(),
            finishedAt: status !== "running"
              ? (b.finishedAt ? new Date(b.finishedAt).getTime() : Date.now())
              : undefined,
          };
          upsertJob(merged);
        }
      } catch { /* ignore */ }
    }

    async function tick() {
      if (stopped) return;
      const isLeader = claimLeader();

      // Periodically reconcile with server (every ~15s, and immediately on first
      // tick) so jobs surface even if localStorage was cleared or the user is on
      // a different browser.
      if (Date.now() - sinceReconcile > 15000) {
        sinceReconcile = Date.now();
        await reconcileFromServer();
      }

      const jobs = loadJobs().filter((j) => j.status === "running");
      if (jobs.length === 0 || !isLeader) {
        timer = setTimeout(tick, 3000);
        return;
      }
      for (const job of jobs) {
        if (stopped) return;
        try {
          // Pump up to 10 queued items, then re-check status.
          await processSeoFixQueue({ data: { batchId: job.id, max: 10 } });
          const status: any = await getSeoJobStatus({ data: { batchId: job.id } });
          const s = status?.summary || {};
          const queued = (s.queued || 0) + (s.processing || 0);
          const updated: BgJob = {
            ...job,
            done: s.done || 0,
            failed: s.failed || 0,
            cancelled: s.cancelled || 0,
            status: queued === 0 ? (s.cancelled > 0 && s.done === 0 ? "cancelled" : "done") : "running",
            finishedAt: queued === 0 ? Date.now() : undefined,
          };
          upsertJob(updated);
        } catch (e) {
          upsertJob({ ...job, status: "error", error: e instanceof Error ? e.message : String(e), finishedAt: Date.now() });
        }
      }
      timer = setTimeout(tick, 1500);
    }

    void tick();
    return () => { stopped = true; if (timer) clearTimeout(timer); };
  }, [inAdmin]);

  if (!inAdmin) return null;
  return <BgJobsWidget />;
}

function BgJobsWidget() {
  const jobs = useBgJobs();
  const [collapsed, setCollapsed] = React.useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  if (jobs.length === 0) return null;
  const running = jobs.filter((j) => j.status === "running");
  const finished = jobs.filter((j) => j.status !== "running");

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card shadow-2xl">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center justify-between gap-2 rounded-t-xl bg-muted px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide"
      >
        <span className="flex items-center gap-2">
          {running.length > 0 ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}
          Background jobs ({running.length} running, {finished.length} done)
        </span>
        <span className="text-muted-foreground">{collapsed ? "▲" : "▼"}</span>
      </button>
      {!collapsed && (
        <div className="max-h-80 overflow-y-auto">
          {jobs.map((j) => (
            <JobRow key={j.id} job={j} onCurrentPage={path === "/admin/content-pages"} />
          ))}
        </div>
      )}
    </div>
  );
}

function JobRow({ job, onCurrentPage }: { job: BgJob; onCurrentPage: boolean }) {
  const total = Math.max(1, job.total);
  const completed = job.done + job.failed + job.cancelled;
  const pct = Math.round((completed / total) * 100);
  const cancelling = React.useRef(false);

  async function cancel() {
    if (cancelling.current) return;
    cancelling.current = true;
    try { await cancelQueuedSeoJobs({ data: { batchId: job.id } }); }
    catch { /* ignore */ }
  }

  return (
    <div className="border-t border-border px-3 py-2 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-medium">{job.label}</span>
        {job.status === "running" ? (
          <button onClick={cancel} className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] hover:bg-muted">Cancel</button>
        ) : job.status === "error" ? (
          <AlertCircle className="h-3.5 w-3.5 text-red-500" />
        ) : (
          <button onClick={() => { markDismissed(job.id); removeJob(job.id); }} className="shrink-0 rounded p-0.5 hover:bg-muted" aria-label="Dismiss">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full transition-all ${job.status === "error" ? "bg-red-500" : job.status === "cancelled" ? "bg-yellow-500" : job.status === "done" ? "bg-green-500" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] tabular-nums text-muted-foreground">
        <span>
          {job.done} done · {job.failed} failed{job.cancelled ? ` · ${job.cancelled} cancelled` : ""} / {job.total}
        </span>
        {!onCurrentPage && job.status === "running" && (
          <Link to="/admin/content-pages" className="text-primary hover:underline">Open editor</Link>
        )}
      </div>
      {job.error && <div className="mt-1 truncate text-[10px] text-red-600" title={job.error}>{job.error}</div>}
    </div>
  );
}
