import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { A as AdminLayout } from "./admin-layout-Ck0iqDJo.js";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { c as createServerFn } from "../server.js";
import "lucide-react";
import "./router-BTf4C8qB.js";
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
import "./renter-drip.server-C0Ma8t5O.js";
import "node:fs";
import "node:path";
import "./host-drip.server-DDQBE_qt.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
import "./createMiddleware-BvN2ghIY.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
const getRefreshQueue = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((data) => z.object({
  limit: z.number().int().min(1).max(500).optional()
}).parse(data ?? {})).handler(createSsrRpc("d8b7b03ade15534674efaa0a810cc4b996e32f014e19fc3d662ec34ec191cdd1"));
const getRefreshHistory = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((data) => z.object({
  url_path: z.string().optional(),
  limit: z.number().int().min(1).max(200).optional()
}).parse(data ?? {})).handler(createSsrRpc("4c789ad7a80a6c759b6fa0d9794963bc37825c5715cd049617b115585c102342"));
const runAiRefresh = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => z.object({
  url_path: z.string().min(1),
  reason: z.enum(["decaying", "stale", "zero-click", "manual"]).optional(),
  dry_run: z.boolean().optional()
}).parse(data)).handler(createSsrRpc("479f689e48f906c5a65875c0a6e416be26816eadc47e2f3193b546c3140d4f7c"));
function reasonBadge(r) {
  const map = {
    decaying: {
      label: "Decaying",
      cls: "bg-red-100 text-red-800"
    },
    "zero-click": {
      label: "Zero-click",
      cls: "bg-orange-100 text-orange-800"
    },
    stale: {
      label: "Stale",
      cls: "bg-amber-100 text-amber-800"
    },
    manual: {
      label: "Manual",
      cls: "bg-slate-100 text-slate-800"
    }
  };
  return map[r] ?? map.manual;
}
function AutoRefreshPage() {
  const [tab, setTab] = useState("queue");
  const [queue, setQueue] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [reasonFilter, setReasonFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [running, setRunning] = useState(/* @__PURE__ */ new Set());
  const [results, setResults] = useState({});
  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [q, h] = await Promise.all([getRefreshQueue({
        data: {
          limit: 300
        }
      }), getRefreshHistory({
        data: {
          limit: 50
        }
      })]);
      setQueue(q.candidates);
      setHistory(h.jobs);
      if (q.error) setErr(q.error);
    } catch (e) {
      setErr(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  const visible = useMemo(() => {
    if (!queue) return [];
    let rows = queue;
    if (reasonFilter !== "all") rows = rows.filter((r) => r.reason === reasonFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((r) => r.url_path.toLowerCase().includes(q));
    }
    return rows;
  }, [queue, reasonFilter, search]);
  async function refreshOne(c) {
    setRunning((s) => new Set(s).add(c.url_path));
    try {
      const res = await runAiRefresh({
        data: {
          url_path: c.url_path,
          reason: c.reason
        }
      });
      setResults((m) => ({
        ...m,
        [c.url_path]: {
          ok: res.success,
          msg: res.success ? res.diff_summary ?? "Refreshed" : res.error ?? "Failed",
          before: res.before_word_count,
          after: res.after_word_count
        }
      }));
      if (res.success) {
        setQueue((q) => q ? q.map((x) => x.url_path === c.url_path ? {
          ...x,
          has_recent_job: true
        } : x) : q);
      }
    } catch (e) {
      setResults((m) => ({
        ...m,
        [c.url_path]: {
          ok: false,
          msg: e?.message ?? "Failed",
          before: 0,
          after: 0
        }
      }));
    } finally {
      setRunning((s) => {
        const n = new Set(s);
        n.delete(c.url_path);
        return n;
      });
    }
  }
  async function refreshTopN(n) {
    const top = visible.filter((c) => !c.has_recent_job).slice(0, n);
    for (const c of top) {
      await refreshOne(c);
    }
    try {
      const h = await getRefreshHistory({
        data: {
          limit: 50
        }
      });
      setHistory(h.jobs);
    } catch {
    }
  }
  const counts = useMemo(() => {
    if (!queue) return {
      all: 0,
      decaying: 0,
      stale: 0,
      zero: 0
    };
    return {
      all: queue.length,
      decaying: queue.filter((q) => q.reason === "decaying").length,
      stale: queue.filter((q) => q.reason === "stale").length,
      zero: queue.filter((q) => q.reason === "zero-click").length
    };
  }, [queue]);
  return /* @__PURE__ */ jsx(AdminLayout, { children: /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4 flex-wrap", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold", children: "Auto-refresh queue" }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground mt-1", children: [
          "Pages flagged for AI rewrite based on GSC trends. One click rewrites the body, meta title, and meta description, then stamps",
          " ",
          /* @__PURE__ */ jsx("code", { children: "content_refreshed_at" }),
          "."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx("button", { onClick: load, disabled: loading, className: "px-3 py-1.5 text-sm border rounded hover:bg-muted disabled:opacity-50", children: loading ? "Loading…" : "Reload" }),
        /* @__PURE__ */ jsx("button", { onClick: () => refreshTopN(5), disabled: loading || !queue || running.size > 0, className: "px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50", children: "Refresh top 5" }),
        /* @__PURE__ */ jsx(Link, { to: "/admin/page-health", className: "px-3 py-1.5 text-sm border rounded hover:bg-muted", children: "Page health →" })
      ] })
    ] }),
    err && /* @__PURE__ */ jsx("div", { className: "bg-red-50 text-red-800 text-sm p-3 rounded border border-red-200", children: err }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2 border-b", children: [
      /* @__PURE__ */ jsxs("button", { onClick: () => setTab("queue"), className: `px-3 py-2 text-sm border-b-2 -mb-px ${tab === "queue" ? "border-primary font-medium" : "border-transparent text-muted-foreground"}`, children: [
        "Queue (",
        counts.all,
        ")"
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: () => setTab("history"), className: `px-3 py-2 text-sm border-b-2 -mb-px ${tab === "history" ? "border-primary font-medium" : "border-transparent text-muted-foreground"}`, children: [
        "History (",
        history?.length ?? 0,
        ")"
      ] })
    ] }),
    tab === "queue" && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 items-center", children: [
        [{
          k: "all",
          label: `All (${counts.all})`
        }, {
          k: "decaying",
          label: `Decaying (${counts.decaying})`
        }, {
          k: "zero-click",
          label: `Zero-click (${counts.zero})`
        }, {
          k: "stale",
          label: `Stale (${counts.stale})`
        }].map((f) => /* @__PURE__ */ jsx("button", { onClick: () => setReasonFilter(f.k), className: `px-3 py-1 text-xs rounded border ${reasonFilter === f.k ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`, children: f.label }, f.k)),
        /* @__PURE__ */ jsx("input", { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Filter by URL…", className: "ml-auto px-3 py-1 text-sm border rounded w-64" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "border rounded overflow-hidden", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-muted text-left", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "URL" }),
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Reason" }),
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-right", children: "Clicks 28d" }),
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-right", children: "Δ vs prev" }),
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-right", children: "Impr" }),
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-right", children: "Pos" }),
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-right", children: "Words" }),
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-right", children: "Days" }),
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2" })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { children: [
          visible.length === 0 && !loading && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 9, className: "px-3 py-6 text-center text-muted-foreground", children: "No pages flagged. Either everything is healthy or GSC data hasn't synced." }) }),
          visible.map((c) => {
            const b = reasonBadge(c.reason);
            const isRunning = running.has(c.url_path);
            const result = results[c.url_path];
            return /* @__PURE__ */ jsxs("tr", { className: "border-t align-top", children: [
              /* @__PURE__ */ jsxs("td", { className: "px-3 py-2", children: [
                /* @__PURE__ */ jsx("a", { href: c.url_path, target: "_blank", rel: "noreferrer", className: "font-mono text-xs hover:underline", children: c.url_path }),
                c.template_type && /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: c.template_type }),
                result && /* @__PURE__ */ jsxs("div", { className: `text-xs mt-1 ${result.ok ? "text-green-700" : "text-red-700"}`, children: [
                  result.ok ? "✓ " : "✗ ",
                  result.msg,
                  result.ok && /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
                    " ",
                    "(",
                    result.before,
                    "→",
                    result.after,
                    " words)"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("td", { className: "px-3 py-2", children: [
                /* @__PURE__ */ jsx("span", { className: `text-xs px-2 py-0.5 rounded ${b.cls}`, children: b.label }),
                /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground mt-1", children: c.reason_label })
              ] }),
              /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right tabular-nums", children: c.clicks_28d }),
              /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right tabular-nums", children: c.clicks_delta_pct == null ? "—" : `${c.clicks_delta_pct > 0 ? "+" : ""}${Math.round(c.clicks_delta_pct)}%` }),
              /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right tabular-nums", children: c.impressions_28d }),
              /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right tabular-nums", children: c.position_28d == null ? "—" : c.position_28d.toFixed(1) }),
              /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right tabular-nums", children: c.word_count }),
              /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right tabular-nums", children: c.days_since_refresh }),
              /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right", children: /* @__PURE__ */ jsx("button", { onClick: () => refreshOne(c), disabled: isRunning, className: "px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50", children: isRunning ? "Rewriting…" : c.has_recent_job ? "Refresh again" : "AI refresh" }) })
            ] }, c.url_path);
          })
        ] })
      ] }) })
    ] }),
    tab === "history" && /* @__PURE__ */ jsx("div", { className: "border rounded overflow-hidden", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-muted text-left", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "URL" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Status" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Reason" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-right", children: "Words" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Summary" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "When" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        (history ?? []).length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "px-3 py-6 text-center text-muted-foreground", children: "No refresh runs yet." }) }),
        (history ?? []).map((j) => /* @__PURE__ */ jsxs("tr", { className: "border-t align-top", children: [
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2 font-mono text-xs", children: j.url_path }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsx("span", { className: `text-xs px-2 py-0.5 rounded ${j.status === "success" ? "bg-green-100 text-green-800" : j.status === "error" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-800"}`, children: j.status }) }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-xs", children: j.reason ?? "—" }),
          /* @__PURE__ */ jsxs("td", { className: "px-3 py-2 text-right tabular-nums text-xs", children: [
            j.before_word_count ?? "—",
            " → ",
            j.after_word_count ?? "—"
          ] }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-xs max-w-md", children: j.diff_summary ?? j.error_message ?? "—" }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-xs text-muted-foreground whitespace-nowrap", children: new Date(j.created_at).toLocaleString() })
        ] }, j.id))
      ] })
    ] }) })
  ] }) });
}
export {
  AutoRefreshPage as component
};
