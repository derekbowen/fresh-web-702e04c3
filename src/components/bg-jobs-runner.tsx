import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Loader2, X, CheckCircle2, AlertCircle } from "lucide-react";
import { processSeoFixQueue, getSeoJobStatus, cancelQueuedSeoJobs } from "@/server/admin-tools.functions";
import { loadJobs, upsertJob, removeJob, useBgJobs, type BgJob } from "@/lib/bg-jobs";

// Single tab leader election: only one tab pumps the queue at a time.
// Uses BroadcastChannel + localStorage heartbeat. Other tabs still display
// progress (read from localStorage) but stay idle as workers.
const LEADER_KEY = "prnm_bg_jobs_leader";
const HEARTBEAT_MS = 4000;
const STALE_MS = 12000;

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

    async function tick() {
      if (stopped) return;
      const isLeader = claimLeader();
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
          <button onClick={() => removeJob(job.id)} className="shrink-0 rounded p-0.5 hover:bg-muted" aria-label="Dismiss">
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
