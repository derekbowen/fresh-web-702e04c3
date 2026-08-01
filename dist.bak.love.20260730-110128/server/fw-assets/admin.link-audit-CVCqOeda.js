import { jsxs, jsx } from "react/jsx-runtime";
import * as React from "react";
import { A as AdminLayout } from "./admin-layout-CDM94Hwn.js";
import { B as Button } from "./button-TjZkfKyC.js";
import { C as Card, a as CardHeader, b as CardTitle, c as CardContent } from "./card-DK4TJU2r.js";
import { B as Badge } from "./badge-DyfXZgLs.js";
import { toast } from "sonner";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-Bd-cw3tB.js";
import { c as createServerFn } from "../server.js";
import "@tanstack/react-router";
import "lucide-react";
import "./router-CKC3KRbd.js";
import "@tanstack/react-query";
import "./site-footer-defaults-asWdr-hi.js";
import "./client.server-D5ro3rAQ.js";
import "@supabase/supabase-js";
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
import "./renter-drip.server-BojrhpHE.js";
import "node:fs";
import "node:path";
import "./host-drip.server-BKqTDlWn.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
import "./createMiddleware-BvN2ghIY.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
const InputSchema = z.object({
  limit: z.number().int().min(10).max(500).default(100),
  /** how many recent runs to aggregate */
  runs: z.number().int().min(1).max(50).default(10),
  /** only return rows that have at least one source page of this template_type */
  templateType: z.string().min(1).max(60).optional(),
  /** filter by classification */
  klass: z.enum(["all", "broken", "redirected"]).default("all")
});
const getLinkAuditDashboard = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => InputSchema.parse(d ?? {})).handler(createSsrRpc("50977da0f56beed28dafab7675260dffbcccd997227b6b5c63f5828fa60a86ee"));
function secondsAgo(at) {
  const s = Math.max(0, Math.round((Date.now() - at) / 1e3));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  return `${Math.round(s / 3600)}h`;
}
function LinkAuditPage() {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [klass, setKlass] = React.useState("all");
  const [templateType, setTemplateType] = React.useState("");
  const [runs, setRuns] = React.useState(10);
  const [limit, setLimit] = React.useState(100);
  const [maxToCheck, setMaxToCheck] = React.useState(60);
  const [phase, setPhase] = React.useState("idle");
  const [elapsed, setElapsed] = React.useState(0);
  const [lastRun, setLastRun] = React.useState(null);
  const [autoRefresh, setAutoRefresh] = React.useState(false);
  const [, forceTick] = React.useReducer((x) => x + 1, 0);
  const load = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getLinkAuditDashboard({
        data: {
          limit,
          runs,
          klass,
          templateType: templateType || void 0
        }
      });
      setData(res);
    } catch (e) {
      if (!silent) toast.error(e.message ?? "Failed to load audit");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [klass, templateType, runs, limit]);
  React.useEffect(() => {
    void load();
  }, [load]);
  React.useEffect(() => {
    if (phase !== "crawling") return;
    const start = Date.now();
    setElapsed(0);
    const id = setInterval(() => setElapsed(Math.round((Date.now() - start) / 100) / 10), 100);
    return () => clearInterval(id);
  }, [phase]);
  React.useEffect(() => {
    if (!lastRun) return;
    const id = setInterval(forceTick, 5e3);
    return () => clearInterval(id);
  }, [lastRun]);
  React.useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      void load(true);
    }, 3e4);
    return () => clearInterval(id);
  }, [autoRefresh, load]);
  async function runCheck() {
    setPhase("crawling");
    try {
      const r = await fetch(`/api/public/link-health?persist=1&source=manual&max=${maxToCheck}`, {
        method: "POST"
      });
      const j = await r.json();
      const at = Date.now();
      setLastRun({
        checked: j.checked,
        brokenCount: j.brokenCount,
        durationMs: j.durationMs,
        at
      });
      toast.success(`Checked ${j.checked} URLs · ${j.brokenCount} broken · ${(j.durationMs / 1e3).toFixed(1)}s`);
      setPhase("refreshing");
      await load(true);
    } catch (e) {
      toast.error(e?.message || "Check failed");
    } finally {
      setPhase("idle");
    }
  }
  const phaseLabel = phase === "crawling" ? `Crawling… ${elapsed.toFixed(1)}s · up to ${maxToCheck} URLs` : phase === "refreshing" ? "Refreshing results…" : lastRun ? `Last run ${secondsAgo(lastRun.at)} ago · ${lastRun.checked} checked · ${lastRun.brokenCount} broken · ${(lastRun.durationMs / 1e3).toFixed(1)}s` : "Idle — click Run check now to start a crawl";
  return /* @__PURE__ */ jsxs(AdminLayout, { title: "Link Audit", children: [
    /* @__PURE__ */ jsx("style", { children: `@keyframes la_progress { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }` }),
    /* @__PURE__ */ jsxs("div", { className: "mb-6 grid gap-4 md:grid-cols-[1fr_1fr_auto_auto_auto_auto]", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-xs text-muted-foreground", children: "Status" }),
        /* @__PURE__ */ jsxs("select", { className: "mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm", value: klass, onChange: (e) => setKlass(e.target.value), children: [
          /* @__PURE__ */ jsx("option", { value: "all", children: "All" }),
          /* @__PURE__ */ jsx("option", { value: "broken", children: "Broken (4xx/5xx/timeout)" }),
          /* @__PURE__ */ jsx("option", { value: "redirected", children: "Redirected (3xx)" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-xs text-muted-foreground", children: "Page type (template_type)" }),
        /* @__PURE__ */ jsxs("select", { className: "mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm", value: templateType, onChange: (e) => setTemplateType(e.target.value), children: [
          /* @__PURE__ */ jsx("option", { value: "", children: "All page types" }),
          (data?.templateTypes || []).map((t) => /* @__PURE__ */ jsx("option", { value: t, children: t }, t))
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-xs text-muted-foreground", children: "Runs" }),
        /* @__PURE__ */ jsx("input", { type: "number", min: 1, max: 50, className: "mt-1 h-10 w-20 rounded-md border border-input bg-background px-3 text-sm", value: runs, onChange: (e) => setRuns(Number(e.target.value) || 10) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-xs text-muted-foreground", children: "Limit" }),
        /* @__PURE__ */ jsx("input", { type: "number", min: 10, max: 500, className: "mt-1 h-10 w-20 rounded-md border border-input bg-background px-3 text-sm", value: limit, onChange: (e) => setLimit(Number(e.target.value) || 100) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-xs text-muted-foreground", children: "Crawl max" }),
        /* @__PURE__ */ jsx("input", { type: "number", min: 10, max: 150, className: "mt-1 h-10 w-20 rounded-md border border-input bg-background px-3 text-sm", value: maxToCheck, onChange: (e) => setMaxToCheck(Number(e.target.value) || 60) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-end gap-2", children: [
        /* @__PURE__ */ jsx(Button, { onClick: () => load(), disabled: loading || phase !== "idle", variant: "outline", children: loading ? "Loading…" : "Refresh" }),
        /* @__PURE__ */ jsx(Button, { onClick: runCheck, disabled: phase !== "idle", children: phase === "crawling" ? `Crawling ${elapsed.toFixed(1)}s…` : phase === "refreshing" ? "Refreshing…" : "▶ Run check now" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mb-4 rounded-md border border-border bg-card p-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: `inline-block h-2 w-2 rounded-full ${phase === "crawling" ? "animate-pulse bg-amber-500" : phase === "refreshing" ? "animate-pulse bg-blue-500" : "bg-emerald-500"}` }),
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: phaseLabel })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", checked: autoRefresh, onChange: (e) => setAutoRefresh(e.target.checked) }),
          "Auto-refresh dashboard every 30s"
        ] })
      ] }),
      phase !== "idle" && /* @__PURE__ */ jsx("div", { className: "mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted", children: /* @__PURE__ */ jsx("div", { className: "h-full w-1/3 bg-primary", style: {
        animation: "la_progress 1.2s ease-in-out infinite"
      } }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mb-6 grid gap-4 sm:grid-cols-3", children: [
      /* @__PURE__ */ jsx(StatCard, { label: "Runs aggregated", value: data?.runsConsidered ?? "—" }),
      /* @__PURE__ */ jsx(StatCard, { label: "Broken entries (raw)", value: data?.totalBrokenEntries ?? "—" }),
      /* @__PURE__ */ jsx(StatCard, { label: "Distinct paths shown", value: data?.rows.length ?? "—" })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Top problem links" }) }),
      /* @__PURE__ */ jsx(CardContent, { className: "overflow-x-auto p-0", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-muted/50", children: /* @__PURE__ */ jsxs("tr", { className: "text-left", children: [
          /* @__PURE__ */ jsx(Th, { children: "Status" }),
          /* @__PURE__ */ jsx(Th, { children: "Path" }),
          /* @__PURE__ */ jsx(Th, { className: "text-right", children: "Hits" }),
          /* @__PURE__ */ jsx(Th, { children: "HTTP" }),
          /* @__PURE__ */ jsx(Th, { children: "Reason" }),
          /* @__PURE__ */ jsx(Th, { children: "Source pages" }),
          /* @__PURE__ */ jsx(Th, { children: "" })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { children: [
          (data?.rows || []).map((r) => /* @__PURE__ */ jsx(Row, { row: r }, r.path)),
          !loading && data && data.rows.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 7, className: "px-4 py-8 text-center text-muted-foreground", children: "No problem links match the current filters." }) })
        ] })
      ] }) })
    ] })
  ] });
}
function Th({
  children,
  className
}) {
  return /* @__PURE__ */ jsx("th", { className: `px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground ${className ?? ""}`, children });
}
function StatCard({
  label,
  value
}) {
  return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
    /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: "mt-1 text-2xl font-semibold", children: value })
  ] }) });
}
function Row({
  row
}) {
  const [recheck, setRecheck] = React.useState(null);
  const tone = row.klass === "broken" ? "destructive" : row.klass === "redirected" ? "secondary" : "outline";
  async function doRecheck() {
    setRecheck({
      status: 0,
      ok: false,
      loading: true
    });
    try {
      const r2 = await fetch(`/api/public/link-health?seeds=${encodeURIComponent(row.path)}&max=1&persist=0`, {
        method: "POST"
      });
      if (!r2.ok) throw new Error(`Health endpoint returned HTTP ${r2.status}`);
      const j = await r2.json();
      const entry = (j.broken || []).find((b) => b.path === row.path);
      const status = entry ? entry.status : 200;
      const ok = !entry;
      setRecheck({
        status,
        ok,
        loading: false
      });
      toast[ok ? "success" : "error"](`${row.path}: ${ok ? "200 OK" : entry?.reason || `HTTP ${status}`}`);
    } catch (e) {
      setRecheck({
        status: 0,
        ok: false,
        loading: false
      });
      toast.error(e?.message || "Recheck failed");
    }
  }
  return /* @__PURE__ */ jsxs("tr", { className: "border-t border-border align-top", children: [
    /* @__PURE__ */ jsxs("td", { className: "px-3 py-2", children: [
      /* @__PURE__ */ jsx(Badge, { variant: tone, children: row.klass }),
      recheck && !recheck.loading && /* @__PURE__ */ jsxs(Badge, { variant: recheck.ok ? "secondary" : "destructive", className: "ml-1 text-[10px]", children: [
        "now: ",
        recheck.ok ? "200" : recheck.status || "fail"
      ] })
    ] }),
    /* @__PURE__ */ jsx("td", { className: "px-3 py-2 font-mono text-xs break-all", children: /* @__PURE__ */ jsx("a", { href: "https://www.poolrentalnearme.com" + row.path, target: "_blank", rel: "noreferrer", className: "hover:underline", children: row.path }) }),
    /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right tabular-nums", children: row.hits }),
    /* @__PURE__ */ jsx("td", { className: "px-3 py-2 tabular-nums", children: row.status ?? "—" }),
    /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-xs text-muted-foreground max-w-[280px] break-words", children: row.reason || "—" }),
    /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-xs", children: row.sources.length === 0 ? /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "(seed)" }) : /* @__PURE__ */ jsxs("ul", { className: "space-y-1", children: [
      row.sources.slice(0, 8).map((s) => /* @__PURE__ */ jsxs("li", { className: "flex flex-wrap items-center gap-1.5", children: [
        /* @__PURE__ */ jsx("span", { className: "font-mono", children: s.path }),
        s.templateType && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px]", children: s.templateType })
      ] }, s.path)),
      row.sources.length > 8 && /* @__PURE__ */ jsxs("li", { className: "text-muted-foreground", children: [
        "+",
        row.sources.length - 8,
        " more"
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right", children: /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: doRecheck, disabled: recheck?.loading, children: recheck?.loading ? "…" : "Recheck" }) })
  ] });
}
export {
  LinkAuditPage as component
};
