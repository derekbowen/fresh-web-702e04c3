import { jsxs, jsx } from "react/jsx-runtime";
import * as React from "react";
import { Link } from "@tanstack/react-router";
import { s as supabase } from "./client-Dh5RMKgP.js";
import { g as getKeywordStats, f as findKeywordOpportunities, i as importGscQueries } from "./admin-seo-tools.functions-DA1S_pz9.js";
import { aY as aiFixContentPage } from "./router-Bw8GQi9C.js";
import { A as AdminLayout } from "./admin-layout-fwIJkCGX.js";
import { Search, TrendingUp, Sparkles, Upload, Loader2 } from "lucide-react";
import "@supabase/supabase-js";
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
import "./auth-middleware-C3cX-s7a.js";
import "./createMiddleware-BvN2ghIY.js";
import "@tanstack/react-query";
import "./site-footer-defaults-C7gHxS5b.js";
import "./site-origin-DalDu5p3.js";
import "./city-slug-Bqls2qOy.js";
import "@tanstack/zod-adapter";
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
import "./renter-drip.server-CMz_M9Zp.js";
import "node:fs";
import "node:path";
import "./host-drip.server-nBw4NS9X.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
function parseGscCsv(csv) {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const sep = lines[0].includes("	") ? "	" : ",";
  const header = lines[0].toLowerCase().split(sep).map((h) => h.trim().replace(/^"|"$/g, ""));
  const idx = {
    page: header.findIndex((h) => h === "page" || h === "url" || h.includes("landing page") || h.includes("top page")),
    query: header.findIndex((h) => h.includes("quer") || h.includes("search term") || h.includes("keyword")),
    impr: header.findIndex((h) => h.includes("impression")),
    clicks: header.findIndex((h) => h.includes("click")),
    pos: header.findIndex((h) => h.includes("position")),
    ctr: header.findIndex((h) => h.includes("ctr"))
  };
  if (idx.query < 0 || idx.impr < 0) return [];
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(sep === "	" ? "	" : /,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((c) => c.trim().replace(/^"|"$/g, ""));
    const rawUrl = idx.page >= 0 ? cells[idx.page] : "";
    let url_path = "";
    try {
      url_path = rawUrl.startsWith("http") ? new URL(rawUrl).pathname : rawUrl;
    } catch {
      url_path = rawUrl;
    }
    const query = cells[idx.query] || "";
    if (!query) continue;
    rows.push({
      url_path: url_path || "(unknown)",
      query,
      clicks: idx.clicks >= 0 ? Number(cells[idx.clicks]?.replace(/[,]/g, "")) || 0 : 0,
      impressions: Number(cells[idx.impr]?.replace(/[,]/g, "")) || 0,
      ctr: idx.ctr >= 0 ? (Number(cells[idx.ctr]?.replace(/[%,]/g, "")) || 0) / 100 : null,
      position: idx.pos >= 0 ? Number(cells[idx.pos]?.replace(/[,]/g, "")) || null : null
    });
  }
  return rows;
}
function KeywordOpportunities() {
  const [csv, setCsv] = React.useState("");
  const [importing, setImporting] = React.useState(false);
  const [importResult, setImportResult] = React.useState(null);
  const [stats, setStats] = React.useState(null);
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [filters, setFilters] = React.useState({
    minPosition: 5,
    maxPosition: 20,
    minImpressions: 50,
    pathLike: ""
  });
  const [fixing, setFixing] = React.useState(null);
  const [fixResults, setFixResults] = React.useState({});
  const loadStats = React.useCallback(async () => {
    try {
      setStats(await getKeywordStats());
    } catch {
    }
  }, []);
  const loadRows = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await findKeywordOpportunities({
        data: {
          ...filters,
          limit: 200
        }
      });
      setRows(r.rows);
    } finally {
      setLoading(false);
    }
  }, [filters]);
  React.useEffect(() => {
    loadStats();
    loadRows();
  }, [loadStats, loadRows]);
  async function handleImport() {
    const parsed = parseGscCsv(csv);
    if (!parsed.length) {
      setImportResult("Could not parse CSV. Need a header row with at least Query and Impressions columns (Page, Clicks, Position, CTR optional).");
      return;
    }
    const hasPage = parsed.some((r) => r.url_path && r.url_path !== "(unknown)");
    setImporting(true);
    try {
      const r = await importGscQueries({
        data: {
          rows: parsed
        }
      });
      const pageWarn = hasPage ? "" : " ⚠️ No Page column detected — keywords imported but can't be mapped to pages. In GSC, export from Performance → Pages tab (or Queries with 'Page' filter applied) to enable AI rewrite.";
      setImportResult(r.ok ? `Imported ${r.upserted} of ${r.total} queries.${pageWarn}` : `Error: ${r.error}`);
      await loadStats();
      await loadRows();
    } catch (e) {
      setImportResult(`Error: ${e?.message || "import failed"}`);
    } finally {
      setImporting(false);
    }
  }
  async function handleAiFix(pageId) {
    setFixing(pageId);
    try {
      const r = await aiFixContentPage({
        data: {
          id: pageId,
          mode: "full"
        }
      });
      setFixResults((p) => ({
        ...p,
        [pageId]: r.ok ? `✓ Rewritten (${r.newWords} words)` : `Error: ${r.error}`
      }));
    } catch (e) {
      setFixResults((p) => ({
        ...p,
        [pageId]: `Error: ${e?.message || "failed"}`
      }));
    } finally {
      setFixing(null);
    }
  }
  const grouped = React.useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const r of rows) {
      if (!map.has(r.url_path)) map.set(r.url_path, []);
      map.get(r.url_path).push(r);
    }
    return Array.from(map.entries()).map(([url_path, queries]) => ({
      url_path,
      queries: queries.sort((a, b) => b.impressions - a.impressions),
      totalImpressions: queries.reduce((s, q) => s + q.impressions, 0),
      totalClicks: queries.reduce((s, q) => s + q.clicks, 0),
      avgPosition: queries.reduce((s, q) => s + (q.position || 0), 0) / queries.length
    })).sort((a, b) => b.totalImpressions - a.totalImpressions);
  }, [rows]);
  return /* @__PURE__ */ jsxs(AdminLayout, { title: "Keyword opportunities", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold sm:text-3xl", children: "Keyword opportunities" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Find queries where you rank on page 2 (positions 5-20) — these are quick wins. Import GSC queries, then one-click rewrite the page with AI." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-3 sm:grid-cols-3", children: [
      /* @__PURE__ */ jsx(StatCard, { label: "Total queries tracked", value: stats?.totalQueries ?? "—", icon: Search }),
      /* @__PURE__ */ jsx(StatCard, { label: "Opportunities (pos 5-20)", value: stats?.opportunities ?? "—", icon: TrendingUp, highlight: true }),
      /* @__PURE__ */ jsx(StatCard, { label: "Already in top 3", value: stats?.top3 ?? "—", icon: Sparkles })
    ] }),
    /* @__PURE__ */ jsxs("details", { open: true, className: "mt-6 rounded-2xl border border-border bg-card p-4", children: [
      /* @__PURE__ */ jsxs("summary", { className: "cursor-pointer text-sm font-semibold", children: [
        /* @__PURE__ */ jsx(Upload, { className: "mr-2 inline h-4 w-4" }),
        " Import GSC queries (Performance → Queries → Export → CSV)"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg border-2 border-dashed border-border bg-muted/30 p-4 text-center", children: [
          /* @__PURE__ */ jsx("input", { id: "gsc-csv-file", type: "file", accept: ".csv,.tsv,text/csv,text/tab-separated-values,text/plain", className: "hidden", onChange: async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const text = await file.text();
            setCsv(text);
            setImportResult(`Loaded ${file.name} (${(file.size / 1024).toFixed(1)} KB) — click Import to upload.`);
            e.target.value = "";
          } }),
          /* @__PURE__ */ jsxs("label", { htmlFor: "gsc-csv-file", className: "inline-flex cursor-pointer items-center gap-2 rounded-full bg-secondary px-5 py-2 text-sm font-semibold hover:bg-secondary/80", children: [
            /* @__PURE__ */ jsx(Upload, { className: "h-4 w-4" }),
            " Choose CSV file"
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "mt-2 text-xs text-muted-foreground", children: [
            'Or paste CSV/TSV content into the box below. Accepts the GSC "Queries" export with columns',
            /* @__PURE__ */ jsx("span", { className: "mx-1 font-mono", children: "Page, Query, Clicks, Impressions, CTR, Position" }),
            "."
          ] })
        ] }),
        /* @__PURE__ */ jsx("textarea", { value: csv, onChange: (e) => setCsv(e.target.value), placeholder: "Page,Query,Clicks,Impressions,CTR,Position", rows: 6, className: "w-full rounded-lg border border-border bg-background p-3 font-mono text-xs" }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
          /* @__PURE__ */ jsxs("button", { onClick: handleImport, disabled: importing || !csv.trim(), className: "inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50", children: [
            importing && /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
            importing ? "Importing…" : "Import"
          ] }),
          csv.trim() && /* @__PURE__ */ jsx("button", { onClick: () => {
            setCsv("");
            setImportResult(null);
          }, className: "rounded-full border border-border px-4 py-2 text-xs", children: "Clear" }),
          importResult && /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: importResult })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-4", children: [
      /* @__PURE__ */ jsx(FilterInput, { label: "Min position", type: "number", value: filters.minPosition, onChange: (v) => setFilters((f) => ({
        ...f,
        minPosition: Number(v) || 5
      })) }),
      /* @__PURE__ */ jsx(FilterInput, { label: "Max position", type: "number", value: filters.maxPosition, onChange: (v) => setFilters((f) => ({
        ...f,
        maxPosition: Number(v) || 20
      })) }),
      /* @__PURE__ */ jsx(FilterInput, { label: "Min impressions", type: "number", value: filters.minImpressions, onChange: (v) => setFilters((f) => ({
        ...f,
        minImpressions: Number(v) || 0
      })) }),
      /* @__PURE__ */ jsx(FilterInput, { label: "URL contains", type: "text", value: filters.pathLike, onChange: (v) => setFilters((f) => ({
        ...f,
        pathLike: v
      })), placeholder: "/p/los-angeles" }),
      /* @__PURE__ */ jsx("button", { onClick: loadRows, className: "col-span-full rounded-lg bg-secondary px-4 py-2 text-sm font-semibold sm:col-span-1 sm:col-start-4", children: "Apply filters" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-3", children: [
      loading && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Loading…" }),
      !loading && grouped.length === 0 && /* @__PURE__ */ jsx("p", { className: "rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground", children: "No opportunities found. Import GSC query data first." }),
      grouped.map((g) => /* @__PURE__ */ jsx(PageOpportunityCard, { urlPath: g.url_path, queries: g.queries, totalImpressions: g.totalImpressions, totalClicks: g.totalClicks, avgPosition: g.avgPosition, onFix: handleAiFix, fixing, fixResult: fixResults[g.url_path] }, g.url_path))
    ] })
  ] });
}
function StatCard({
  label,
  value,
  icon: Icon,
  highlight
}) {
  return /* @__PURE__ */ jsxs("div", { className: `rounded-2xl border p-4 ${highlight ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`, children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground", children: [
      /* @__PURE__ */ jsx(Icon, { className: "h-3.5 w-3.5" }),
      " ",
      label
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-1 text-2xl font-bold", children: value })
  ] });
}
function FilterInput({
  label,
  value,
  onChange,
  type,
  placeholder
}) {
  return /* @__PURE__ */ jsxs("label", { className: "text-xs", children: [
    /* @__PURE__ */ jsx("span", { className: "block text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("input", { type, value, onChange: (e) => onChange(e.target.value), placeholder, className: "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" })
  ] });
}
function PageOpportunityCard({
  urlPath,
  queries,
  totalImpressions,
  totalClicks,
  avgPosition,
  onFix,
  fixing,
  fixResult
}) {
  const [pageId, setPageId] = React.useState(null);
  const [loadingId, setLoadingId] = React.useState(false);
  async function loadAndFix() {
    setLoadingId(true);
    try {
      const {
        data
      } = await supabase.from("content_pages").select("id").eq("url_path", urlPath).maybeSingle();
      if (data?.id) {
        setPageId(data.id);
        onFix(data.id);
      }
    } finally {
      setLoadingId(false);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", children: [
      /* @__PURE__ */ jsx("div", { className: "min-w-0 flex-1", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsx(Link, { to: urlPath, className: "font-mono text-sm font-semibold text-primary hover:underline", children: urlPath }),
        /* @__PURE__ */ jsxs("span", { className: "rounded-full bg-secondary px-2 py-0.5 text-xs font-medium", children: [
          "avg pos ",
          avgPosition.toFixed(1)
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "rounded-full bg-secondary px-2 py-0.5 text-xs font-medium", children: [
          totalImpressions.toLocaleString(),
          " impr"
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "rounded-full bg-secondary px-2 py-0.5 text-xs font-medium", children: [
          totalClicks,
          " clicks"
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxs("button", { onClick: loadAndFix, disabled: loadingId || fixing === pageId, className: "inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50", children: [
        loadingId || fixing === pageId ? /* @__PURE__ */ jsx(Loader2, { className: "h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ jsx(Sparkles, { className: "h-3.5 w-3.5" }),
        "AI rewrite"
      ] }) })
    ] }),
    fixResult && pageId && /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: fixResult }),
    /* @__PURE__ */ jsxs("div", { className: "mt-3 overflow-x-auto", children: [
      /* @__PURE__ */ jsxs("table", { className: "w-full text-xs", children: [
        /* @__PURE__ */ jsx("thead", { className: "text-left text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "py-1.5 pr-2 font-medium", children: "Query" }),
          /* @__PURE__ */ jsx("th", { className: "py-1.5 px-2 text-right font-medium", children: "Pos" }),
          /* @__PURE__ */ jsx("th", { className: "py-1.5 px-2 text-right font-medium", children: "Impr" }),
          /* @__PURE__ */ jsx("th", { className: "py-1.5 px-2 text-right font-medium", children: "Clicks" }),
          /* @__PURE__ */ jsx("th", { className: "py-1.5 pl-2 text-right font-medium", children: "CTR" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: queries.slice(0, 10).map((q) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border/60", children: [
          /* @__PURE__ */ jsx("td", { className: "py-1.5 pr-2", children: q.query }),
          /* @__PURE__ */ jsx("td", { className: "py-1.5 px-2 text-right tabular-nums", children: q.position?.toFixed(1) ?? "—" }),
          /* @__PURE__ */ jsx("td", { className: "py-1.5 px-2 text-right tabular-nums", children: q.impressions.toLocaleString() }),
          /* @__PURE__ */ jsx("td", { className: "py-1.5 px-2 text-right tabular-nums", children: q.clicks }),
          /* @__PURE__ */ jsx("td", { className: "py-1.5 pl-2 text-right tabular-nums", children: q.ctr ? `${(q.ctr * 100).toFixed(1)}%` : "—" })
        ] }, q.id)) })
      ] }),
      queries.length > 10 && /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: [
        "…and ",
        queries.length - 10,
        " more queries"
      ] })
    ] })
  ] });
}
export {
  KeywordOpportunities as component
};
