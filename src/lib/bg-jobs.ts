// Lightweight background-job registry for admin AI work (e.g. bulk SEO fix
// queues). Persisted to localStorage so jobs continue even when the admin
// navigates between pages — a small driver mounted in AdminLayout keeps
// pumping the server queue and writing progress here.

export type BgJobKind = "seo_fix";

export type BgJob = {
  id: string;            // batchId on the server
  kind: BgJobKind;
  label: string;         // human label e.g. "Auto-fix everything"
  total: number;
  done: number;
  failed: number;
  cancelled: number;
  status: "running" | "done" | "cancelled" | "error";
  startedAt: number;
  finishedAt?: number;
  error?: string;
};

const KEY = "prnm_bg_jobs_v1";
const EVT = "prnm:bg-jobs-changed";

function safeParse(raw: string | null): BgJob[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as BgJob[]) : [];
  } catch { return []; }
}

export function loadJobs(): BgJob[] {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(KEY));
}

function writeJobs(jobs: BgJob[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(jobs));
  window.dispatchEvent(new CustomEvent(EVT));
}

export function upsertJob(job: BgJob) {
  const jobs = loadJobs();
  const idx = jobs.findIndex((j) => j.id === job.id);
  if (idx >= 0) jobs[idx] = job;
  else jobs.unshift(job);
  // Keep at most 10 jobs
  writeJobs(jobs.slice(0, 10));
}

export function removeJob(id: string) {
  writeJobs(loadJobs().filter((j) => j.id !== id));
}

export function clearFinishedJobs() {
  writeJobs(loadJobs().filter((j) => j.status === "running"));
}

export function subscribe(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onEvt = () => cb();
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) cb(); };
  window.addEventListener(EVT, onEvt);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVT, onEvt);
    window.removeEventListener("storage", onStorage);
  };
}

export function useBgJobs(): BgJob[] {
  // Lightweight hook without bringing in a store lib.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require("react") as typeof import("react");
  const [jobs, setJobs] = React.useState<BgJob[]>(() => loadJobs());
  React.useEffect(() => subscribe(() => setJobs(loadJobs())), []);
  return jobs;
}
