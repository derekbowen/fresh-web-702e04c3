import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { A as AdminLayout } from "./admin-layout-7nNRKAex.js";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { c as createServerFn } from "../server.js";
import "@tanstack/react-router";
import "lucide-react";
import "./router-OI82CwOi.js";
import "@tanstack/react-query";
import "./site-footer-defaults-C7gHxS5b.js";
import "./client.server-D5ro3rAQ.js";
import "@supabase/supabase-js";
import "./site-origin-DalDu5p3.js";
import "./city-slug-Bqls2qOy.js";
import "@tanstack/zod-adapter";
import "./client-Dh5RMKgP.js";
import "./states-UIdvqlKs.js";
import "./courses.server-Bfz1suZ4.js";
import "@lovable.dev/webhooks-js";
import "crypto";
import "@react-email/components";
import "./registry-Dn-QpeYo.js";
import "./_unsubscribe-footer-DXp0Y_3B.js";
import "@lovable.dev/email-js";
import "./reauthentication-CCohUDQL.js";
import "node:crypto";
import "./sms.server-BJah3xxU.js";
import "./sharetribe-mirror.server-D8Jwl9-L.js";
import "./sharetribe.server-BZ7y3aGI.js";
import "./listing-sync.server-C2GpYdIM.js";
import "./renter-drip.server-CZnPPh9d.js";
import "./emailit-DRsipvVx.js";
import "node:fs";
import "node:path";
import "./host-drip.server-Cdm15px5.js";
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
const getPageHealthReport = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((data) => z.object({
  limit: z.number().int().min(1).max(5e3).optional()
}).parse(data ?? {})).handler(createSsrRpc("c18a39484f43ede3060f6d09ae1e903aa32aa236b3330d6d931416e2019d4c81"));
const getCannibalizationReport = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((data) => z.object({
  minImpressions: z.number().int().min(1).max(1e5).optional(),
  minPagesPerQuery: z.number().int().min(2).max(10).optional(),
  limit: z.number().int().min(1).max(500).optional()
}).parse(data ?? {})).handler(createSsrRpc("1a21d16d9e7fc1fed1e381906178ff4a366fb21764bfd1c871ca0673330d2dcc"));
const FILTERS = [{
  key: "all",
  label: "All"
}, {
  key: "decaying",
  label: "Decaying"
}, {
  key: "striking-distance",
  label: "Striking distance (8-20)"
}, {
  key: "zero-click",
  label: "Zero click"
}, {
  key: "stale",
  label: "Stale (90d+)"
}, {
  key: "thin",
  label: "Thin (<500w)"
}, {
  key: "no-hero",
  label: "No hero"
}, {
  key: "missing-meta",
  label: "Missing meta"
}, {
  key: "not-in-sitemap",
  label: "Not in sitemap"
}];
function PageHealthPage() {
  const [tab, setTab] = useState("pages");
  const [report, setReport] = useState(null);
  const [cannibal, setCannibal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("health_score");
  const [sortAsc, setSortAsc] = useState(true);
  const [templateFilter, setTemplateFilter] = useState("all");
  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [r, c] = await Promise.all([getPageHealthReport({
        data: {
          limit: 3e3
        }
      }), getCannibalizationReport({
        data: {
          minImpressions: 50,
          minPagesPerQuery: 2,
          limit: 200
        }
      })]);
      setReport(r);
      setCannibal(c);
      if (r.error) setErr(r.error);
    } catch (e) {
      setErr(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  const templates = useMemo(() => {
    const set = /* @__PURE__ */ new Set();
    report?.rows.forEach((r) => r.template_type && set.add(r.template_type));
    return Array.from(set).sort();
  }, [report]);
  const visible = useMemo(() => {
    if (!report) return [];
    let rows = report.rows.slice();
    if (filter !== "all") rows = rows.filter((r) => r.badges.includes(filter));
    if (templateFilter !== "all") rows = rows.filter((r) => r.template_type === templateFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((r) => r.url_path.toLowerCase().includes(q));
    }
    rows.sort((a, b) => {
      const av = a[sortKey] ?? -Infinity;
      const bv = b[sortKey] ?? -Infinity;
      return sortAsc ? av - bv : bv - av;
    });
    return rows.slice(0, 500);
  }, [report, filter, templateFilter, search, sortKey, sortAsc]);
  const totals = useMemo(() => {
    if (!report) return null;
    const r = report.rows;
    return {
      pages: r.length,
      avgScore: r.length > 0 ? Math.round(r.reduce((s, x) => s + x.health_score, 0) / r.length) : 0,
      stale: r.filter((x) => x.badges.includes("stale")).length,
      decaying: r.filter((x) => x.badges.includes("decaying")).length,
      striking: r.filter((x) => x.badges.includes("striking-distance")).length,
      thin: r.filter((x) => x.badges.includes("thin")).length,
      noHero: r.filter((x) => x.badges.includes("no-hero")).length,
      missingMeta: r.filter((x) => x.badges.includes("missing-meta")).length,
      totalClicks: r.reduce((s, x) => s + x.clicks_28d, 0),
      totalImpressions: r.reduce((s, x) => s + x.impressions_28d, 0)
    };
  }, [report]);
  const exportCsv = () => {
    if (!report) return;
    const cols = ["url_path", "template_type", "health_score", "clicks_28d", "impressions_28d", "ctr_28d", "position_28d", "clicks_delta_pct", "word_count", "days_since_refresh", "in_sitemap"];
    const esc = (v) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [cols.join(","), ...report.rows.map((r) => cols.map((c) => esc(r[c])).join(","))];
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `page-health-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  function sortBtn(label, key) {
    const active = sortKey === key;
    return /* @__PURE__ */ jsxs("button", { onClick: () => {
      if (active) setSortAsc(!sortAsc);
      else {
        setSortKey(key);
        setSortAsc(false);
      }
    }, className: `text-left ${active ? "font-semibold text-primary" : ""}`, children: [
      label,
      active ? sortAsc ? " ↑" : " ↓" : ""
    ] });
  }
  return /* @__PURE__ */ jsx(AdminLayout, { title: "Page health", children: /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4 flex-wrap", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx("button", { onClick: () => setTab("pages"), className: `px-3 py-1.5 rounded-md text-sm border ${tab === "pages" ? "bg-primary text-primary-foreground" : "bg-background"}`, children: "Pages" }),
        /* @__PURE__ */ jsxs("button", { onClick: () => setTab("cannibal"), className: `px-3 py-1.5 rounded-md text-sm border ${tab === "cannibal" ? "bg-primary text-primary-foreground" : "bg-background"}`, children: [
          "Cannibalization",
          cannibal ? /* @__PURE__ */ jsxs("span", { className: "ml-2 opacity-70", children: [
            "(",
            cannibal.groups.length,
            ")"
          ] }) : null
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx("button", { onClick: load, disabled: loading, className: "px-3 py-1.5 rounded-md text-sm border", children: loading ? "Loading…" : "Refresh" }),
        tab === "pages" ? /* @__PURE__ */ jsx("button", { onClick: exportCsv, disabled: !report, className: "px-3 py-1.5 rounded-md text-sm border", children: "Export CSV" }) : null
      ] })
    ] }),
    err ? /* @__PURE__ */ jsx("div", { className: "p-3 rounded-md border border-destructive text-destructive text-sm", children: err }) : null,
    tab === "pages" ? /* @__PURE__ */ jsxs(Fragment, { children: [
      totals ? /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
        /* @__PURE__ */ jsx(Stat, { label: "Pages", value: totals.pages }),
        /* @__PURE__ */ jsx(Stat, { label: "Avg health score", value: `${totals.avgScore}/100` }),
        /* @__PURE__ */ jsx(Stat, { label: "Clicks (28d)", value: totals.totalClicks.toLocaleString() }),
        /* @__PURE__ */ jsx(Stat, { label: "Impressions (28d)", value: totals.totalImpressions.toLocaleString() }),
        /* @__PURE__ */ jsx(Stat, { label: "Decaying", value: totals.decaying, tone: "warn" }),
        /* @__PURE__ */ jsx(Stat, { label: "Striking distance", value: totals.striking, tone: "ok" }),
        /* @__PURE__ */ jsx(Stat, { label: "Stale (90d+)", value: totals.stale, tone: "warn" }),
        /* @__PURE__ */ jsx(Stat, { label: "Thin (<500w)", value: totals.thin, tone: "warn" })
      ] }) : null,
      /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: FILTERS.map((f) => /* @__PURE__ */ jsx("button", { onClick: () => setFilter(f.key), className: `px-2.5 py-1 rounded-md text-xs border ${filter === f.key ? "bg-primary text-primary-foreground" : "bg-background"}`, children: f.label }, f.key)) }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsx("input", { type: "text", placeholder: "Filter by URL path…", value: search, onChange: (e) => setSearch(e.target.value), className: "px-3 py-1.5 rounded-md border text-sm flex-1 min-w-[200px]" }),
        /* @__PURE__ */ jsxs("select", { value: templateFilter, onChange: (e) => setTemplateFilter(e.target.value), className: "px-3 py-1.5 rounded-md border text-sm", children: [
          /* @__PURE__ */ jsx("option", { value: "all", children: "All templates" }),
          templates.map((t) => /* @__PURE__ */ jsx("option", { value: t, children: t }, t))
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "overflow-x-auto border rounded-md", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-muted/50", children: /* @__PURE__ */ jsxs("tr", { className: "text-left", children: [
          /* @__PURE__ */ jsx("th", { className: "p-2", children: sortBtn("Score", "health_score") }),
          /* @__PURE__ */ jsx("th", { className: "p-2", children: "URL" }),
          /* @__PURE__ */ jsx("th", { className: "p-2 text-right", children: sortBtn("Clicks 28d", "clicks_28d") }),
          /* @__PURE__ */ jsx("th", { className: "p-2 text-right", children: sortBtn("Impr 28d", "impressions_28d") }),
          /* @__PURE__ */ jsx("th", { className: "p-2 text-right", children: sortBtn("Pos", "position_28d") }),
          /* @__PURE__ */ jsx("th", { className: "p-2 text-right", children: sortBtn("Δ clicks", "clicks_delta_pct") }),
          /* @__PURE__ */ jsx("th", { className: "p-2 text-right", children: sortBtn("Words", "word_count") }),
          /* @__PURE__ */ jsx("th", { className: "p-2 text-right", children: sortBtn("Age", "days_since_refresh") }),
          /* @__PURE__ */ jsx("th", { className: "p-2", children: "Issues" })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { children: [
          visible.map((r) => /* @__PURE__ */ jsxs("tr", { className: "border-t", children: [
            /* @__PURE__ */ jsx("td", { className: "p-2", children: /* @__PURE__ */ jsx(ScoreBadge, { score: r.health_score }) }),
            /* @__PURE__ */ jsxs("td", { className: "p-2 max-w-[320px]", children: [
              /* @__PURE__ */ jsx("a", { href: r.url_path, target: "_blank", rel: "noreferrer", className: "text-primary underline-offset-2 hover:underline truncate block", children: r.url_path }),
              /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
                r.template_type ?? "—",
                " · ",
                r.locale
              ] })
            ] }),
            /* @__PURE__ */ jsx("td", { className: "p-2 text-right tabular-nums", children: r.clicks_28d.toLocaleString() }),
            /* @__PURE__ */ jsx("td", { className: "p-2 text-right tabular-nums", children: r.impressions_28d.toLocaleString() }),
            /* @__PURE__ */ jsx("td", { className: "p-2 text-right tabular-nums", children: r.position_28d != null ? r.position_28d.toFixed(1) : "—" }),
            /* @__PURE__ */ jsx("td", { className: `p-2 text-right tabular-nums ${r.clicks_delta_pct != null && r.clicks_delta_pct < 0 ? "text-destructive" : r.clicks_delta_pct != null && r.clicks_delta_pct > 0 ? "text-emerald-600" : ""}`, children: r.clicks_delta_pct != null ? `${r.clicks_delta_pct > 0 ? "+" : ""}${r.clicks_delta_pct.toFixed(0)}%` : "—" }),
            /* @__PURE__ */ jsx("td", { className: "p-2 text-right tabular-nums", children: r.word_count }),
            /* @__PURE__ */ jsx("td", { className: "p-2 text-right tabular-nums", children: r.days_since_refresh != null ? `${r.days_since_refresh}d` : "—" }),
            /* @__PURE__ */ jsx("td", { className: "p-2", children: /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1", children: r.badges.map((b) => /* @__PURE__ */ jsx("span", { className: "text-[10px] px-1.5 py-0.5 rounded bg-muted border", children: b }, b)) }) })
          ] }, r.url_path)),
          visible.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 9, className: "p-6 text-center text-muted-foreground", children: "No pages match these filters." }) }) : null
        ] })
      ] }) }),
      report && report.rows.length > 500 ? /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
        "Showing top 500 of ",
        report.rows.length,
        " pages. Tighten filters to see more."
      ] }) : null
    ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Queries with multiple URLs ranking in the last 28 days. Consider merging, redirecting, or differentiating intent." }),
      cannibal?.groups.map((g) => /* @__PURE__ */ jsxs("div", { className: "border rounded-md", children: [
        /* @__PURE__ */ jsx("div", { className: "p-3 flex items-center justify-between bg-muted/30", children: /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "font-medium", children: g.query }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
            g.pages.length,
            " pages · ",
            g.total_impressions.toLocaleString(),
            " ",
            "impressions · ",
            g.total_clicks.toLocaleString(),
            " clicks"
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("table", { className: "w-full text-sm", children: /* @__PURE__ */ jsx("tbody", { children: g.pages.map((p) => /* @__PURE__ */ jsxs("tr", { className: "border-t", children: [
          /* @__PURE__ */ jsx("td", { className: "p-2", children: /* @__PURE__ */ jsx("a", { href: p.url_path, target: "_blank", rel: "noreferrer", className: "text-primary underline-offset-2 hover:underline", children: p.url_path }) }),
          /* @__PURE__ */ jsxs("td", { className: "p-2 text-right tabular-nums w-24", children: [
            p.clicks,
            " clicks"
          ] }),
          /* @__PURE__ */ jsxs("td", { className: "p-2 text-right tabular-nums w-32", children: [
            p.impressions.toLocaleString(),
            " impr"
          ] }),
          /* @__PURE__ */ jsxs("td", { className: "p-2 text-right tabular-nums w-20", children: [
            "pos ",
            p.position != null ? p.position.toFixed(1) : "—"
          ] })
        ] }, p.url_path)) }) })
      ] }, g.query)),
      cannibal && cannibal.groups.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-6 text-center text-muted-foreground border rounded-md", children: "No cannibalization groups detected. (Needs GSC query data — run the GSC sync first.)" }) : null
    ] })
  ] }) });
}
function Stat({
  label,
  value,
  tone
}) {
  return /* @__PURE__ */ jsxs("div", { className: "border rounded-md p-3", children: [
    /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: `text-xl font-semibold ${tone === "warn" ? "text-amber-600" : tone === "ok" ? "text-emerald-600" : ""}`, children: value })
  ] });
}
function ScoreBadge({
  score
}) {
  const tone = score >= 80 ? "bg-emerald-100 text-emerald-800 border-emerald-300" : score >= 60 ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-red-100 text-red-800 border-red-300";
  return /* @__PURE__ */ jsx("span", { className: `inline-flex items-center justify-center w-12 h-7 rounded text-xs font-semibold border ${tone}`, children: score });
}
export {
  PageHealthPage as component
};
