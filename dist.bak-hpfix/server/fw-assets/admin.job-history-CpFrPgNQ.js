import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import * as React from "react";
import { Link } from "@tanstack/react-router";
import { QueryClientProvider, QueryClient, useQuery } from "@tanstack/react-query";
import { u as useServerFn } from "./useServerFn-DL2oePlL.js";
import { RefreshCw, Loader2, ChevronDown, ChevronRight, Ban, XCircle, CheckCircle2, ExternalLink } from "lucide-react";
import { aQ as listSeoBatches, b9 as getSeoBatchDetails } from "./router-BPpbotmS.js";
import "./site-footer-defaults-Brwu0BKb.js";
import "./cities.functions-DKA5O9eJ.js";
import "../server.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
import "zod";
import "./client.server-D5ro3rAQ.js";
import "@supabase/supabase-js";
import "./auth-middleware-C3cX-s7a.js";
import "./createMiddleware-BvN2ghIY.js";
import "./site-origin-DalDu5p3.js";
import "./city-slug-Bqls2qOy.js";
import "@tanstack/zod-adapter";
import "./client-Dh5RMKgP.js";
import "./transactional-email.server-BoL6nxoQ.js";
import "@react-email/components";
import "./_unsubscribe-footer-DXp0Y_3B.js";
import "./states-UIdvqlKs.js";
import "./courses.server-Bfz1suZ4.js";
import "@lovable.dev/webhooks-js";
import "crypto";
import "./emailit-DRsipvVx.js";
import "@lovable.dev/email-js";
import "./reauthentication-CCohUDQL.js";
import "node:crypto";
import "./sms.server-BJah3xxU.js";
import "./sharetribe-mirror.server-D8Jwl9-L.js";
import "./sharetribe.server-BZ7y3aGI.js";
import "./listing-sync.server-C2GpYdIM.js";
import "./renter-drip.server-CFIkIdnw.js";
import "node:fs";
import "node:path";
import "./host-drip.server-BAToYGOj.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
const queryClient = new QueryClient();
function JobHistoryRoute() {
  return /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsx(JobHistoryPage, {}) });
}
const RANGES = [{
  label: "24h",
  hours: 24
}, {
  label: "3d",
  hours: 72
}, {
  label: "7d",
  hours: 168
}, {
  label: "30d",
  hours: 720
}];
const STATUS_OPTS = ["all", "running", "done", "failed", "cancelled"];
function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(void 0, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}
function fmtDuration(start, end) {
  if (!end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1e3) return `${ms}ms`;
  const s = Math.round(ms / 1e3);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  if (m < 60) return `${m}m ${rs}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
function batchStatus(b) {
  if (b.queued + b.processing > 0) return "running";
  if (b.failed > 0 && b.done === 0) return "failed";
  if (b.cancelled > 0 && b.done === 0) return "cancelled";
  return "done";
}
function StatusPill({
  s
}) {
  const map = {
    running: {
      cls: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
      Icon: Loader2,
      label: "Running"
    },
    done: {
      cls: "bg-green-500/15 text-green-700 dark:text-green-300",
      Icon: CheckCircle2,
      label: "Done"
    },
    failed: {
      cls: "bg-red-500/15 text-red-700 dark:text-red-300",
      Icon: XCircle,
      label: "Failed"
    },
    cancelled: {
      cls: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300",
      Icon: Ban,
      label: "Cancelled"
    }
  };
  const {
    cls,
    Icon,
    label
  } = map[s];
  return /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`, children: [
    /* @__PURE__ */ jsx(Icon, { className: `h-3 w-3 ${s === "running" ? "animate-spin" : ""}` }),
    label
  ] });
}
function JobHistoryPage() {
  const [hours, setHours] = React.useState(168);
  const [status, setStatus] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const list = useServerFn(listSeoBatches);
  const {
    data,
    isLoading,
    isFetching,
    refetch
  } = useQuery({
    queryKey: ["seo-batches", hours],
    queryFn: () => list({
      data: {
        sinceHours: hours
      }
    }),
    refetchInterval: 15e3
  });
  const batches = data?.batches || [];
  const filtered = batches.filter((b) => {
    if (status !== "all" && batchStatus(b) !== status) return false;
    if (search && !b.batchId.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const counts = React.useMemo(() => {
    const c = {
      all: batches.length,
      running: 0,
      done: 0,
      failed: 0,
      cancelled: 0
    };
    for (const b of batches) c[batchStatus(b)] += 1;
    return c;
  }, [batches]);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4 p-4 md:p-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold", children: "Job history" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Background AI runs (bulk SEO fixes) — completed and failed." })
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: () => refetch(), className: "inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-muted", children: [
        /* @__PURE__ */ jsx(RefreshCw, { className: `h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}` }),
        " Refresh"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2 text-sm", children: [
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1 rounded-md border border-border p-0.5", children: RANGES.map((r) => /* @__PURE__ */ jsx("button", { onClick: () => setHours(r.hours), className: `rounded px-2 py-1 text-xs ${hours === r.hours ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`, children: r.label }, r.hours)) }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1 rounded-md border border-border p-0.5", children: STATUS_OPTS.map((s) => /* @__PURE__ */ jsxs("button", { onClick: () => setStatus(s), className: `rounded px-2 py-1 text-xs capitalize ${status === s ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`, children: [
        s,
        " ",
        /* @__PURE__ */ jsxs("span", { className: "ml-1 text-muted-foreground", children: [
          "(",
          counts[s] || 0,
          ")"
        ] })
      ] }, s)) }),
      /* @__PURE__ */ jsx("input", { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Search by batch ID…", className: "ml-auto w-56 rounded-md border border-border bg-background px-2 py-1 text-sm" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "rounded-lg border border-border bg-card", children: isLoading ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 p-6 text-sm text-muted-foreground", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
      " Loading job history…"
    ] }) : filtered.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "p-8 text-center text-sm text-muted-foreground", children: [
      "No jobs found in this window. Kick off a bulk run from",
      " ",
      /* @__PURE__ */ jsx(Link, { to: "/admin/content-pages", className: "text-primary hover:underline", children: "Bulk page editor" }),
      "."
    ] }) : /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "w-8 px-3 py-2" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Status" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Started" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Duration" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Mode" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Progress" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Batch" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: filtered.map((b) => /* @__PURE__ */ jsx(BatchRow, { batch: b }, b.batchId)) })
    ] }) })
  ] });
}
function BatchRow({
  batch
}) {
  const [open, setOpen] = React.useState(false);
  const s = batchStatus(batch);
  const completed = batch.done + batch.failed + batch.cancelled;
  const pct = batch.total === 0 ? 0 : Math.round(completed / batch.total * 100);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("tr", { className: "border-b border-border/60 hover:bg-muted/30", children: [
      /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsx("button", { onClick: () => setOpen((v) => !v), className: "rounded p-0.5 hover:bg-muted", "aria-label": "Expand", children: open ? /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4" }) }) }),
      /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsx(StatusPill, { s }) }),
      /* @__PURE__ */ jsx("td", { className: "px-3 py-2 whitespace-nowrap", children: fmtDate(batch.startedAt) }),
      /* @__PURE__ */ jsx("td", { className: "px-3 py-2 whitespace-nowrap text-muted-foreground", children: fmtDuration(batch.startedAt, batch.finishedAt) }),
      /* @__PURE__ */ jsx("td", { className: "px-3 py-2 capitalize", children: batch.mode.replace("_", " ") }),
      /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("div", { className: "h-1.5 w-28 overflow-hidden rounded-full bg-muted", children: /* @__PURE__ */ jsx("div", { className: `h-full ${s === "failed" ? "bg-red-500" : s === "cancelled" ? "bg-yellow-500" : s === "done" ? "bg-green-500" : "bg-primary"}`, style: {
          width: `${pct}%`
        } }) }),
        /* @__PURE__ */ jsxs("span", { className: "tabular-nums text-xs text-muted-foreground", children: [
          batch.done,
          "✓ ",
          batch.failed > 0 ? `${batch.failed}✗ ` : "",
          batch.cancelled > 0 ? `${batch.cancelled}⊘ ` : "",
          "/ ",
          batch.total
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("td", { className: "px-3 py-2 font-mono text-[11px] text-muted-foreground", children: [
        batch.batchId.slice(0, 8),
        "…"
      ] })
    ] }),
    open && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 7, className: "bg-muted/20 px-3 py-3", children: /* @__PURE__ */ jsx(BatchDetails, { batchId: batch.batchId }) }) })
  ] });
}
function BatchDetails({
  batchId
}) {
  const get = useServerFn(getSeoBatchDetails);
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["seo-batch-details", batchId],
    queryFn: () => get({
      data: {
        batchId
      }
    })
  });
  if (isLoading) {
    return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "h-3.5 w-3.5 animate-spin" }),
      " Loading details…"
    ] });
  }
  const jobs = data?.jobs || [];
  if (jobs.length === 0) return /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "No jobs in this batch." });
  return /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded-md border border-border bg-card", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs", children: [
    /* @__PURE__ */ jsx("thead", { className: "bg-muted/50 text-left uppercase tracking-wide text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
      /* @__PURE__ */ jsx("th", { className: "px-2 py-1.5", children: "Status" }),
      /* @__PURE__ */ jsx("th", { className: "px-2 py-1.5", children: "Page" }),
      /* @__PURE__ */ jsx("th", { className: "px-2 py-1.5", children: "Mode" }),
      /* @__PURE__ */ jsx("th", { className: "px-2 py-1.5", children: "Attempts" }),
      /* @__PURE__ */ jsx("th", { className: "px-2 py-1.5", children: "Started" }),
      /* @__PURE__ */ jsx("th", { className: "px-2 py-1.5", children: "Finished" }),
      /* @__PURE__ */ jsx("th", { className: "px-2 py-1.5", children: "Duration" }),
      /* @__PURE__ */ jsx("th", { className: "px-2 py-1.5", children: "Notes" })
    ] }) }),
    /* @__PURE__ */ jsx("tbody", { children: jobs.map((j) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border/60 align-top", children: [
      /* @__PURE__ */ jsx("td", { className: "px-2 py-1.5", children: /* @__PURE__ */ jsx(JobStatusPill, { s: j.status }) }),
      /* @__PURE__ */ jsxs("td", { className: "px-2 py-1.5", children: [
        /* @__PURE__ */ jsx("div", { className: "font-medium", children: j.title || "(untitled)" }),
        j.url_path && /* @__PURE__ */ jsxs("a", { href: j.url_path, target: "_blank", rel: "noreferrer", className: "inline-flex items-center gap-1 text-[11px] text-primary hover:underline", children: [
          j.url_path,
          " ",
          /* @__PURE__ */ jsx(ExternalLink, { className: "h-3 w-3" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("td", { className: "px-2 py-1.5 capitalize", children: j.mode.replace("_", " ") }),
      /* @__PURE__ */ jsx("td", { className: "px-2 py-1.5 tabular-nums", children: j.attempts }),
      /* @__PURE__ */ jsx("td", { className: "px-2 py-1.5 whitespace-nowrap text-muted-foreground", children: fmtDate(j.created_at) }),
      /* @__PURE__ */ jsx("td", { className: "px-2 py-1.5 whitespace-nowrap text-muted-foreground", children: fmtDate(j.finished_at) }),
      /* @__PURE__ */ jsx("td", { className: "px-2 py-1.5 whitespace-nowrap text-muted-foreground", children: fmtDuration(j.created_at, j.finished_at) }),
      /* @__PURE__ */ jsx("td", { className: "px-2 py-1.5", children: j.error ? /* @__PURE__ */ jsx("span", { className: "text-red-600", title: j.error, children: j.error.length > 80 ? j.error.slice(0, 80) + "…" : j.error }) : j.result?.summary ? /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: String(j.result.summary).slice(0, 80) }) : /* @__PURE__ */ jsx("span", { className: "text-muted-foreground/60", children: "—" }) })
    ] }, j.id)) })
  ] }) });
}
function JobStatusPill({
  s
}) {
  const map = {
    queued: "bg-muted text-foreground",
    processing: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    done: "bg-green-500/15 text-green-700 dark:text-green-300",
    failed: "bg-red-500/15 text-red-700 dark:text-red-300",
    cancelled: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300"
  };
  return /* @__PURE__ */ jsx("span", { className: `inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize ${map[s] || "bg-muted"}`, children: s });
}
export {
  JobHistoryRoute as component
};
