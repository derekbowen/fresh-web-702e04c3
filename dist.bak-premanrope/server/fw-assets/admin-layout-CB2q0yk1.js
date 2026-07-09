import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import * as React from "react";
import { useRouterState, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, CheckCircle2, AlertCircle, X, LayoutDashboard, Sparkles, Activity, FileText, Wand2, Bot, Database, Newspaper, GraduationCap, Image, Radar, TrendingUp, Swords, Network, AlertTriangle, Search, MousePointerClick, LinkIcon, Mail, Instagram, Bell, Share2, Building2, ShieldCheck, CreditCard, Menu, Home, LogOut, ChevronLeft, ChevronDown } from "lucide-react";
import { aO as processSeoFixQueue, aP as getSeoJobStatus, aQ as listSeoBatches, aR as cancelQueuedSeoJobs, aS as ShowChromeOverride, S as SiteHeader } from "./router-B7ZiUt1j.js";
import { s as supabase } from "./client-TSMcDHCK.js";
const KEY = "prnm_bg_jobs_v1";
const EVT = "prnm:bg-jobs-changed";
function safeParse(raw) {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function loadJobs() {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(KEY));
}
function writeJobs(jobs) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(jobs));
  window.dispatchEvent(new CustomEvent(EVT));
}
function upsertJob(job) {
  const jobs = loadJobs();
  const idx = jobs.findIndex((j) => j.id === job.id);
  if (idx >= 0) jobs[idx] = job;
  else jobs.unshift(job);
  writeJobs(jobs.slice(0, 10));
}
function removeJob(id) {
  writeJobs(loadJobs().filter((j) => j.id !== id));
}
function subscribe(cb) {
  if (typeof window === "undefined") return () => {
  };
  const onEvt = () => cb();
  const onStorage = (e) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener(EVT, onEvt);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVT, onEvt);
    window.removeEventListener("storage", onStorage);
  };
}
function useBgJobs() {
  const [jobs, setJobs] = React.useState(() => typeof window === "undefined" ? [] : loadJobs());
  React.useEffect(() => subscribe(() => setJobs(loadJobs())), []);
  return jobs;
}
const LEADER_KEY = "prnm_bg_jobs_leader";
const DISMISS_KEY = "prnm_bg_jobs_dismissed_v1";
const STALE_MS = 12e3;
function readDismissed() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return /* @__PURE__ */ new Set();
  }
}
function wasDismissed(id) {
  if (typeof window === "undefined") return false;
  return readDismissed().has(id);
}
function markDismissed(id) {
  if (typeof window === "undefined") return;
  const s = readDismissed();
  s.add(id);
  const arr = Array.from(s).slice(-200);
  localStorage.setItem(DISMISS_KEY, JSON.stringify(arr));
}
function labelFor(mode, total) {
  const m = mode === "meta_only" ? "Meta fix" : mode === "title_only" ? "Title fix" : mode === "mixed" ? "Bulk fix" : "Auto-fix";
  return `${m} · ${total} page${total === 1 ? "" : "s"}`;
}
function tabId() {
  if (typeof window === "undefined") return "ssr";
  const w = window;
  if (!w.__prnm_tab) w.__prnm_tab = Math.random().toString(36).slice(2);
  return w.__prnm_tab;
}
function readLeader() {
  try {
    const raw = localStorage.getItem(LEADER_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    return v && typeof v.id === "string" ? v : null;
  } catch {
    return null;
  }
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
function BgJobsRunner() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const inAdmin = path.startsWith("/admin");
  React.useEffect(() => {
    if (!inAdmin || typeof window === "undefined") return;
    let stopped = false;
    let timer = null;
    let sinceReconcile = 0;
    async function reconcileFromServer() {
      try {
        const { data: sess } = await supabase.auth.getSession();
        if (!sess.session?.access_token) return;
        const { batches } = await listSeoBatches({ data: { sinceHours: 72 } });
        const local = new Map(loadJobs().map((j) => [j.id, j]));
        for (const b of batches) {
          const queued = b.queued + b.processing;
          const status = queued > 0 ? "running" : b.cancelled > 0 && b.done === 0 ? "cancelled" : "done";
          const existing = local.get(b.batchId);
          if (!existing && status !== "running" && wasDismissed(b.batchId)) continue;
          const merged = {
            id: b.batchId,
            kind: "seo_fix",
            label: existing?.label || labelFor(b.mode, b.total),
            total: b.total,
            done: b.done,
            failed: b.failed,
            cancelled: b.cancelled,
            status,
            startedAt: existing?.startedAt ?? new Date(b.startedAt).getTime(),
            finishedAt: status !== "running" ? b.finishedAt ? new Date(b.finishedAt).getTime() : Date.now() : void 0
          };
          upsertJob(merged);
        }
      } catch {
      }
    }
    async function tick() {
      if (stopped) return;
      const isLeader = claimLeader();
      if (Date.now() - sinceReconcile > 15e3) {
        sinceReconcile = Date.now();
        await reconcileFromServer();
      }
      const jobs = loadJobs().filter((j) => j.status === "running");
      if (jobs.length === 0 || !isLeader) {
        timer = setTimeout(tick, 3e3);
        return;
      }
      const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      for (const job of jobs) {
        if (stopped) return;
        if (!UUID_RE.test(job.id)) {
          upsertJob({ ...job, status: "cancelled", finishedAt: Date.now(), error: "Stale local job (not a server batch)" });
          continue;
        }
        try {
          await processSeoFixQueue({ data: { batchId: job.id, max: 10 } });
          const status = await getSeoJobStatus({ data: { batchId: job.id } });
          const s = status?.summary || {};
          const queued = (s.queued || 0) + (s.processing || 0);
          const updated = {
            ...job,
            done: s.done || 0,
            failed: s.failed || 0,
            cancelled: s.cancelled || 0,
            status: queued === 0 ? s.cancelled > 0 && s.done === 0 ? "cancelled" : "done" : "running",
            finishedAt: queued === 0 ? Date.now() : void 0
          };
          upsertJob(updated);
        } catch (e) {
          upsertJob({ ...job, status: "error", error: e instanceof Error ? e.message : String(e), finishedAt: Date.now() });
        }
      }
      timer = setTimeout(tick, 1500);
    }
    void tick();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [inAdmin]);
  if (!inAdmin) return null;
  return /* @__PURE__ */ jsx(BgJobsWidget, {});
}
function BgJobsWidget() {
  const jobs = useBgJobs();
  const [collapsed, setCollapsed] = React.useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (jobs.length === 0) return null;
  const running = jobs.filter((j) => j.status === "running");
  const finished = jobs.filter((j) => j.status !== "running");
  return /* @__PURE__ */ jsxs("div", { className: "fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card shadow-2xl", children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => setCollapsed((c) => !c),
        className: "flex w-full items-center justify-between gap-2 rounded-t-xl bg-muted px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide",
        children: [
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
            running.length > 0 ? /* @__PURE__ */ jsx(Loader2, { className: "h-3.5 w-3.5 animate-spin text-primary" }) : /* @__PURE__ */ jsx(CheckCircle2, { className: "h-3.5 w-3.5 text-green-600" }),
            "Background jobs (",
            running.length,
            " running, ",
            finished.length,
            " done)"
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: collapsed ? "▲" : "▼" })
        ]
      }
    ),
    !collapsed && /* @__PURE__ */ jsx("div", { className: "max-h-80 overflow-y-auto", children: jobs.map((j) => /* @__PURE__ */ jsx(JobRow, { job: j, onCurrentPage: path === "/admin/content-pages" }, j.id)) })
  ] });
}
function JobRow({ job, onCurrentPage }) {
  const total = Math.max(1, job.total);
  const completed = job.done + job.failed + job.cancelled;
  const pct = Math.round(completed / total * 100);
  const cancelling = React.useRef(false);
  async function cancel() {
    if (cancelling.current) return;
    cancelling.current = true;
    try {
      await cancelQueuedSeoJobs({ data: { batchId: job.id } });
    } catch {
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "border-t border-border px-3 py-2 text-xs", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsx("span", { className: "truncate font-medium", children: job.label }),
      job.status === "running" ? /* @__PURE__ */ jsx("button", { onClick: cancel, className: "shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] hover:bg-muted", children: "Cancel" }) : job.status === "error" ? /* @__PURE__ */ jsx(AlertCircle, { className: "h-3.5 w-3.5 text-red-500" }) : /* @__PURE__ */ jsx("button", { onClick: () => {
        markDismissed(job.id);
        removeJob(job.id);
      }, className: "shrink-0 rounded p-0.5 hover:bg-muted", "aria-label": "Dismiss", children: /* @__PURE__ */ jsx(X, { className: "h-3 w-3" }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted", children: /* @__PURE__ */ jsx(
      "div",
      {
        className: `h-full transition-all ${job.status === "error" ? "bg-red-500" : job.status === "cancelled" ? "bg-yellow-500" : job.status === "done" ? "bg-green-500" : "bg-primary"}`,
        style: { width: `${pct}%` }
      }
    ) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-center justify-between text-[10px] tabular-nums text-muted-foreground", children: [
      /* @__PURE__ */ jsxs("span", { children: [
        job.done,
        " done · ",
        job.failed,
        " failed",
        job.cancelled ? ` · ${job.cancelled} cancelled` : "",
        " / ",
        job.total
      ] }),
      !onCurrentPage && job.status === "running" && /* @__PURE__ */ jsx(Link, { to: "/admin/content-pages", className: "text-primary hover:underline", children: "Open editor" })
    ] }),
    job.error && /* @__PURE__ */ jsx("div", { className: "mt-1 truncate text-[10px] text-red-600", title: job.error, children: job.error })
  ] });
}
async function adminSignOut() {
  try {
    await supabase.auth.signOut();
  } catch {
  }
  if (typeof window !== "undefined") window.location.replace("/auth");
}
const DEMO_KEY = "prnm_demo_mode";
const DEMO_ALLOWED_PATHS = /* @__PURE__ */ new Set([
  "/admin/quick-page",
  "/admin/generate-content",
  "/admin/content-pages",
  "/admin/seo-health",
  "/admin/link-checker"
]);
function filterGroupsForDemo(groups) {
  return groups.map((g) => ({
    ...g,
    items: g.items.filter((it) => DEMO_ALLOWED_PATHS.has(it.to))
  })).filter((g) => g.items.length > 0);
}
const GROUPS = [
  {
    label: "Overview",
    items: [
      { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/admin/prnm-coach", label: "PRNM Coach 🤖", icon: Sparkles },
      { to: "/admin/opportunities", label: "Opportunities", icon: CheckCircle2 },
      { to: "/admin/job-history", label: "Job history", icon: Activity },
      { to: "/admin/tech-docs", label: "Technical docs", icon: FileText }
    ]
  },
  {
    label: "Content",
    items: [
      { to: "/admin/quick-page", label: "Quick page builder", icon: Wand2 },
      { to: "/admin/generate-content", label: "Generate content", icon: Bot },
      { to: "/admin/content-pages", label: "Bulk page editor", icon: FileText },
      { to: "/admin/content-migration", label: "Content migration", icon: Database },
      { to: "/admin/blog", label: "Blog admin", icon: Newspaper },
      { to: "/admin/learning", label: "Learning admin", icon: GraduationCap },
      { to: "/admin/cities-heroes", label: "City heroes", icon: Image },
      { to: "/admin/data-export", label: "Data export", icon: Database },
      { to: "/admin/data-import", label: "Data import", icon: Database }
    ]
  },
  {
    label: "SEO",
    items: [
      { to: "/admin/competitor-radar", label: "Competitor radar 🚨", icon: Radar },
      { to: "/admin/rank-tracker", label: "Rank tracker", icon: TrendingUp },
      { to: "/admin/page-auditor", label: "AI page auditor", icon: Sparkles },
      { to: "/admin/seo-critic", label: "AI SEO critic 🔍", icon: Sparkles },
      { to: "/admin/faq-generator", label: "FAQ generator ✨", icon: Sparkles },
      { to: "/admin/listing-auditor", label: "Listing auditor", icon: Sparkles },
      { to: "/admin/keyword-opportunities", label: "Keyword opportunities", icon: TrendingUp },
      { to: "/admin/competitors", label: "Competitor tracker", icon: Swords },
      { to: "/admin/internal-links", label: "Internal link recommender", icon: Network },
      { to: "/admin/seo-health", label: "SEO health", icon: Activity },
      { to: "/admin/auto-refresh", label: "Auto-refresh queue 🔄", icon: Sparkles },
      { to: "/admin/missing-pages", label: "Missing pages (404s)", icon: AlertTriangle },
      { to: "/admin/indexing", label: "Sitemap & indexing", icon: Search },
      { to: "/admin/gsc-import", label: "GSC import", icon: Search },
      { to: "/admin/scrape-import", label: "Scrape import", icon: Database },
      { to: "/admin/click-report", label: "Click report", icon: MousePointerClick }
    ]
  },
  {
    label: "Links",
    items: [
      { to: "/admin/link-checker", label: "Link checker", icon: LinkIcon },
      { to: "/admin/link-audit", label: "Link audit dashboard", icon: LinkIcon },
      { to: "/admin/link-auto-repair", label: "Link auto-repair 🪄", icon: Wand2 }
    ]
  },
  {
    label: "Email",
    items: [
      { to: "/admin/email-composer", label: "Email composer ✨", icon: Sparkles },
      { to: "/admin/host-drip", label: "Host drip", icon: Mail },
      { to: "/admin/renter-drip", label: "Renter drip", icon: Mail },
      { to: "/admin/drip-subscribers", label: "Subscribers ⏯", icon: Mail },
      { to: "/admin/add-contacts", label: "Add contacts ➕", icon: Mail },
      { to: "/admin/email-queue", label: "Email queue", icon: Mail },
      { to: "/admin/email-deliverability", label: "Deliverability", icon: Activity },
      { to: "/admin/email-branding", label: "Email branding", icon: Image },
      { to: "/admin/email-verify", label: "Email verify", icon: CheckCircle2 }
    ]
  },
  {
    label: "Social",
    items: [
      { to: "/admin/ig-lead-hunter", label: "IG lead hunter", icon: Instagram },
      { to: "/admin/social-lead-hunter", label: "Social lead hunter", icon: Radar },
      { to: "/admin/sms-blast", label: "SMS blast", icon: Bell }
    ]
  },
  {
    label: "Leads & CRM",
    items: [
      { to: "/admin/leads", label: "Lead inbox", icon: Mail },
      { to: "/admin/follow-ups", label: "Follow-ups 📞", icon: Activity },
      { to: "/admin/followup-performance", label: "Follow-up performance 📊", icon: TrendingUp },
      { to: "/admin/followup-reminders", label: "Follow-up reminders 🔔", icon: Bell },
      { to: "/admin/auto-outreach", label: "Auto-outreach 🤖", icon: Bot }
    ]
  },
  {
    label: "Marketplace",
    items: [
      { to: "/admin/marketplace", label: "Marketplace console 🏛", icon: Database },
      { to: "/admin/sharetribe", label: "Sharetribe mirror 🛰", icon: Database },
      { to: "/admin/affiliates", label: "Affiliates 💸", icon: Share2 }
    ]
  },
  {
    label: "Site & Ops",
    items: [
      { to: "/admin/site-footer", label: "Site footer", icon: LinkIcon },
      { to: "/admin/directory", label: "Directory moderation", icon: Building2 },
      { to: "/admin/claims", label: "Listing claims", icon: ShieldCheck },
      { to: "/admin/plan-requests", label: "Plan requests", icon: CreditCard },
      { to: "/admin/team", label: "Admin team", icon: ShieldCheck }
    ]
  }
];
const ALL_ITEMS = GROUPS.flatMap((g) => g.items);
function useCurrentPath() {
  return useRouterState({ select: (s) => s.location.pathname });
}
const OPEN_GROUPS_KEY = "prnm_admin_open_groups";
function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose, demoMode, onToggleDemo }) {
  const path = useCurrentPath();
  const navigate = useNavigate();
  const groups = demoMode ? filterGroupsForDemo(GROUPS) : GROUPS;
  const activeGroupLabel = React.useMemo(
    () => groups.find((g) => g.items.some((it) => path === it.to || path.startsWith(it.to + "/")))?.label,
    [groups, path]
  );
  const [openMap, setOpenMap] = React.useState({});
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(OPEN_GROUPS_KEY);
      setOpenMap(raw ? JSON.parse(raw) : { Overview: true });
    } catch {
      setOpenMap({ Overview: true });
    }
  }, []);
  const toggleGroup = (label) => {
    setOpenMap((prev) => {
      const next = { ...prev, [label]: !prev[label] };
      try {
        localStorage.setItem(OPEN_GROUPS_KEY, JSON.stringify(next));
      } catch {
      }
      return next;
    });
  };
  const isOpen = (label) => collapsed || label === activeGroupLabel || openMap[label] === true;
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef(null);
  const [highlight, setHighlight] = React.useState(0);
  const flatItems = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return groups.flatMap((g) => g.items.map((it) => ({ group: g.label, ...it }))).filter((it) => it.label.toLowerCase().includes(q) || it.to.toLowerCase().includes(q));
  }, [groups, query]);
  React.useEffect(() => {
    setHighlight(0);
  }, [flatItems.length]);
  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = flatItems[highlight];
      if (it) {
        navigate({ to: it.to });
        setQuery("");
        onMobileClose();
      }
    } else if (e.key === "Escape") {
      setQuery("");
      inputRef.current?.blur();
    }
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    mobileOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-40 bg-black/50 lg:hidden", onClick: onMobileClose }),
    /* @__PURE__ */ jsxs(
      "aside",
      {
        className: [
          "z-50 shrink-0 border-r border-border bg-card transition-all flex flex-col",
          "lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:block",
          collapsed ? "lg:w-14" : "lg:w-60",
          "fixed inset-y-0 left-0 w-64 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        ].join(" "),
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex h-12 items-center justify-between gap-2 border-b border-border px-3", children: [
            !collapsed && /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: demoMode ? "PRNM CMS" : "Admin" }),
            /* @__PURE__ */ jsx("button", { onClick: onToggle, className: "hidden rounded p-1 hover:bg-muted lg:inline-flex", "aria-label": "Toggle sidebar", children: /* @__PURE__ */ jsx(ChevronLeft, { className: `h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}` }) }),
            /* @__PURE__ */ jsx("button", { onClick: onMobileClose, className: "rounded p-1 hover:bg-muted lg:hidden", "aria-label": "Close menu", children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }) })
          ] }),
          !collapsed && /* @__PURE__ */ jsxs("div", { className: "relative border-b border-border px-3 py-2", children: [
            /* @__PURE__ */ jsx(Search, { className: "pointer-events-none absolute left-[1.15rem] top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                ref: inputRef,
                value: query,
                onChange: (e) => setQuery(e.target.value),
                onKeyDown,
                placeholder: "Jump to…",
                className: "w-full rounded-md border border-border bg-background py-1.5 pl-7 pr-2 text-xs text-foreground outline-none ring-0 placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
              }
            ),
            query && flatItems.length > 0 && /* @__PURE__ */ jsx("div", { className: "absolute left-0 right-0 top-full z-50 border-b border-x border-border bg-popover shadow-lg", children: /* @__PURE__ */ jsx("ul", { className: "max-h-64 overflow-y-auto py-1", children: flatItems.map((it, idx) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
              Link,
              {
                to: it.to,
                onClick: () => {
                  setQuery("");
                  onMobileClose();
                },
                className: [
                  "flex items-center gap-2 px-3 py-1.5 text-sm",
                  idx === highlight ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                ].join(" "),
                onMouseEnter: () => setHighlight(idx),
                children: [
                  /* @__PURE__ */ jsx(it.icon, { className: "h-3.5 w-3.5 shrink-0 opacity-70" }),
                  /* @__PURE__ */ jsx("span", { className: "flex-1 truncate", children: it.label }),
                  /* @__PURE__ */ jsx("span", { className: "shrink-0 text-[10px] opacity-60", children: it.group })
                ]
              }
            ) }, `${it.to}-${idx}`)) }) }),
            query && flatItems.length === 0 && /* @__PURE__ */ jsx("div", { className: "absolute left-0 right-0 top-full z-50 border-b border-x border-border bg-popover px-3 py-2 text-xs text-muted-foreground shadow-lg", children: "No results" })
          ] }),
          /* @__PURE__ */ jsxs("nav", { className: "flex flex-1 flex-col overflow-y-auto p-2", children: [
            /* @__PURE__ */ jsx("div", { className: "flex-1", children: groups.map((g) => {
              const open = isOpen(g.label);
              const groupActive = g.label === activeGroupLabel;
              return /* @__PURE__ */ jsxs("div", { className: "mb-1", children: [
                !collapsed ? /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => toggleGroup(g.label),
                    className: [
                      "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider",
                      groupActive ? "text-foreground" : "text-muted-foreground hover:bg-muted"
                    ].join(" "),
                    "aria-expanded": open,
                    children: [
                      /* @__PURE__ */ jsx("span", { children: g.label }),
                      /* @__PURE__ */ jsx(ChevronDown, { className: `h-3 w-3 transition-transform ${open ? "" : "-rotate-90"}` })
                    ]
                  }
                ) : null,
                open && /* @__PURE__ */ jsx("ul", { className: "space-y-0.5 pt-0.5", children: g.items.map((it) => {
                  const active = path === it.to || path.startsWith(it.to + "/");
                  return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
                    Link,
                    {
                      to: it.to,
                      onClick: onMobileClose,
                      title: collapsed ? it.label : void 0,
                      className: [
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                        active ? "bg-primary text-primary-foreground font-medium" : "text-foreground hover:bg-muted"
                      ].join(" "),
                      children: [
                        /* @__PURE__ */ jsx(it.icon, { className: "h-4 w-4 shrink-0" }),
                        !collapsed && /* @__PURE__ */ jsx("span", { className: "truncate", children: it.label })
                      ]
                    }
                  ) }, it.to);
                }) })
              ] }, g.label);
            }) }),
            /* @__PURE__ */ jsxs("div", { className: "mt-2 space-y-1 border-t border-border pt-2", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: onToggleDemo,
                  title: collapsed ? demoMode ? "Exit demo mode" : "Enter demo mode" : void 0,
                  className: [
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs",
                    demoMode ? "bg-amber-500/15 text-amber-700 dark:text-amber-400" : "text-muted-foreground hover:bg-muted"
                  ].join(" "),
                  children: [
                    /* @__PURE__ */ jsx(Sparkles, { className: "h-3.5 w-3.5 shrink-0" }),
                    !collapsed && /* @__PURE__ */ jsx("span", { className: "truncate", children: demoMode ? "Demo mode: ON" : "Demo mode" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: adminSignOut,
                  title: collapsed ? "Sign out" : void 0,
                  className: "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted",
                  children: [
                    /* @__PURE__ */ jsx(LogOut, { className: "h-3.5 w-3.5 shrink-0" }),
                    !collapsed && /* @__PURE__ */ jsx("span", { className: "truncate", children: "Sign out" })
                  ]
                }
              )
            ] })
          ] })
        ]
      }
    )
  ] });
}
function AdminLayout({ title, children, maxWidth = "max-w-7xl" }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [demoMode, setDemoMode] = React.useState(false);
  const path = useCurrentPath();
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get("demo");
    if (q === "1") {
      setDemoMode(true);
      try {
        localStorage.setItem(DEMO_KEY, "1");
      } catch {
      }
    } else if (q === "0") {
      setDemoMode(false);
      try {
        localStorage.removeItem(DEMO_KEY);
      } catch {
      }
    } else {
      try {
        setDemoMode(localStorage.getItem(DEMO_KEY) === "1");
      } catch {
      }
    }
  }, []);
  const toggleDemo = React.useCallback(() => {
    setDemoMode((prev) => {
      const next = !prev;
      try {
        if (next) localStorage.setItem(DEMO_KEY, "1");
        else localStorage.removeItem(DEMO_KEY);
      } catch {
      }
      return next;
    });
  }, []);
  const visibleItems = demoMode ? ALL_ITEMS.filter((i) => DEMO_ALLOWED_PATHS.has(i.to)) : ALL_ITEMS;
  const current = visibleItems.find((i) => path === i.to || path.startsWith(i.to + "/")) ?? ALL_ITEMS.find((i) => path === i.to || path.startsWith(i.to + "/"));
  const isDashboard = path === "/admin/dashboard";
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col bg-background", children: [
    /* @__PURE__ */ jsx("div", { className: "hidden lg:block", children: /* @__PURE__ */ jsx(ShowChromeOverride, { children: /* @__PURE__ */ jsx(SiteHeader, {}) }) }),
    /* @__PURE__ */ jsxs("div", { className: "sticky top-0 z-40 flex h-12 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur lg:hidden", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setMobileOpen(true),
          className: "-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted active:bg-muted",
          "aria-label": "Open menu",
          children: /* @__PURE__ */ jsx(Menu, { className: "h-5 w-5" })
        }
      ),
      /* @__PURE__ */ jsx("span", { className: "truncate text-sm font-semibold", children: current?.label ?? title ?? "Admin" }),
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/",
          className: "ml-auto inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted",
          "aria-label": "Go to site",
          children: /* @__PURE__ */ jsx(Home, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: adminSignOut,
          className: "inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted",
          "aria-label": "Sign out",
          title: "Sign out",
          children: /* @__PURE__ */ jsx(LogOut, { className: "h-4 w-4" })
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-1", children: [
      /* @__PURE__ */ jsx(
        Sidebar,
        {
          collapsed,
          onToggle: () => setCollapsed((c) => !c),
          mobileOpen,
          onMobileClose: () => setMobileOpen(false),
          demoMode,
          onToggleDemo: toggleDemo
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 flex-1 flex-col", children: [
        /* @__PURE__ */ jsxs("div", { className: "sticky top-16 z-30 hidden h-12 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur lg:flex lg:px-8", children: [
          !isDashboard && /* @__PURE__ */ jsxs(Link, { to: "/admin/dashboard", className: "inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground", children: [
            /* @__PURE__ */ jsx(ChevronLeft, { className: "h-3.5 w-3.5" }),
            " Dashboard"
          ] }),
          /* @__PURE__ */ jsxs("nav", { className: "flex items-center gap-1.5 text-xs text-muted-foreground", "aria-label": "Breadcrumb", children: [
            /* @__PURE__ */ jsx(Link, { to: "/", className: "hover:text-foreground", children: /* @__PURE__ */ jsx(Home, { className: "h-3.5 w-3.5" }) }),
            /* @__PURE__ */ jsx("span", { children: "/" }),
            /* @__PURE__ */ jsx(Link, { to: "/admin/dashboard", className: "hover:text-foreground", children: "Admin" }),
            current && !isDashboard && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("span", { children: "/" }),
              /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground", children: current.label })
            ] })
          ] }),
          title && /* @__PURE__ */ jsx("span", { className: "ml-auto truncate text-sm font-semibold text-foreground/80", children: title })
        ] }),
        /* @__PURE__ */ jsx("main", { className: `mx-auto w-full flex-1 px-3 py-4 sm:px-6 lg:px-8 lg:py-6 ${maxWidth}`, children })
      ] })
    ] }),
    /* @__PURE__ */ jsx(BgJobsRunner, {})
  ] });
}
export {
  AdminLayout as A,
  GROUPS as G,
  upsertJob as a,
  useBgJobs as u
};
