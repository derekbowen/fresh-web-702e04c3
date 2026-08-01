import { jsxs, jsx } from "react/jsx-runtime";
import * as React from "react";
import { A as AdminLayout } from "./admin-layout-B2eMXHXP.js";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { z } from "zod";
import { c as createServerFn } from "../server.js";
import "@tanstack/react-router";
import "lucide-react";
import "./router-BEu57YoG.js";
import "@tanstack/react-query";
import "./site-footer-defaults-C7gHxS5b.js";
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
import "./renter-drip.server-DJqUcyMM.js";
import "node:fs";
import "node:path";
import "./host-drip.server-BfIDzqiI.js";
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
const scanBrokenLinks = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  offset: z.number().int().min(0).default(0),
  batchSize: z.number().int().min(10).max(500).default(200),
  urlPrefix: z.string().trim().max(200).optional(),
  urlContains: z.string().trim().max(200).optional(),
  pageIds: z.array(z.string().uuid()).max(2e3).optional(),
  onlyMissingPPage: z.boolean().optional(),
  rangeStart: z.string().trim().max(200).optional(),
  rangeEnd: z.string().trim().max(200).optional()
}).parse(d ?? {})).handler(createSsrRpc("f8bffb0d6856fb8be710642b6569dbbca019484cfcc96ba6b0fb919b00808934"));
const fixBrokenLink = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  pageId: z.string().uuid(),
  href: z.string().min(1).max(2e3),
  action: z.enum(["replace", "unlink", "remove"]),
  newHref: z.string().min(1).max(2e3).optional()
}).parse(d)).handler(createSsrRpc("2d737fa8e538df6edc9c0188c2bbbdaddfbd82e04a912316858a140c0ff3b784"));
const bulkFixBrokenLinks = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  action: z.enum(["replace", "unlink", "remove"]),
  items: z.array(z.object({
    pageId: z.string().uuid(),
    href: z.string().min(1).max(2e3),
    newHref: z.string().min(1).max(2e3).optional()
  })).min(1).max(2e3)
}).parse(d)).handler(createSsrRpc("21a82b9573813de1d2b222dd58ef6921744c7d3b6a377d87dccd99ec34dabfe6"));
const getRecentLinkHealthRuns = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("961f52e15c3b37f70f67bf125b194a1e2076180aa053894db3e71c8df5b7bc33"));
const REASON_LABEL = {
  missing_p_page: "Missing /p/ page",
  unknown_internal_path: "Unknown internal path",
  malformed: "Malformed URL"
};
function LinkChecker() {
  const [rows, setRows] = React.useState([]);
  const [scanning, setScanning] = React.useState(false);
  const [progress, setProgress] = React.useState({
    done: 0,
    total: 0
  });
  const [filter, setFilter] = React.useState("all");
  const [state, setState] = React.useState({});
  const [editHref, setEditHref] = React.useState({});
  const [healthRuns, setHealthRuns] = React.useState([]);
  const abortRef = React.useRef(false);
  React.useEffect(() => {
    getRecentLinkHealthRuns().then(setHealthRuns).catch(() => setHealthRuns([]));
  }, []);
  const [showFilters, setShowFilters] = React.useState(false);
  const [fUrlPrefix, setFUrlPrefix] = React.useState("/p/");
  const [fUrlContains, setFUrlContains] = React.useState("");
  const [fRangeStart, setFRangeStart] = React.useState("");
  const [fRangeEnd, setFRangeEnd] = React.useState("");
  const [fPageIdsRaw, setFPageIdsRaw] = React.useState("");
  const [fOnlyMissing, setFOnlyMissing] = React.useState(false);
  function key(b) {
    return `${b.page_id}::${b.href}`;
  }
  function buildScanFilters() {
    const pageIds = fPageIdsRaw.split(/[\s,]+/).map((s) => s.trim()).filter((s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s));
    return {
      urlPrefix: fUrlPrefix.trim() || void 0,
      urlContains: fUrlContains.trim() || void 0,
      rangeStart: fRangeStart.trim() || void 0,
      rangeEnd: fRangeEnd.trim() || void 0,
      pageIds: pageIds.length ? pageIds : void 0,
      onlyMissingPPage: fOnlyMissing || void 0
    };
  }
  function resetFilters() {
    setFUrlPrefix("/p/");
    setFUrlContains("");
    setFRangeStart("");
    setFRangeEnd("");
    setFPageIdsRaw("");
    setFOnlyMissing(false);
  }
  const activeFilterCount = (fUrlPrefix.trim() && fUrlPrefix.trim() !== "/p/" ? 1 : 0) + (fUrlContains.trim() ? 1 : 0) + (fRangeStart.trim() ? 1 : 0) + (fRangeEnd.trim() ? 1 : 0) + (fPageIdsRaw.trim() ? 1 : 0) + (fOnlyMissing ? 1 : 0);
  const [scanCompletedAt, setScanCompletedAt] = React.useState(null);
  const [scanDurationMs, setScanDurationMs] = React.useState(null);
  async function startScan() {
    setRows([]);
    setState({});
    setEditHref({});
    setScanning(true);
    abortRef.current = false;
    setScanCompletedAt(null);
    setScanDurationMs(null);
    let offset = 0;
    const batchSize = 200;
    const filters = buildScanFilters();
    if (fOnlyMissing) setFilter("missing_p_page");
    const startedAt = Date.now();
    try {
      while (!abortRef.current) {
        const r = await scanBrokenLinks({
          data: {
            offset,
            batchSize,
            ...filters
          }
        });
        setRows((prev) => [...prev, ...r.broken]);
        setProgress({
          done: r.nextOffset,
          total: r.total
        });
        if (r.done) break;
        offset = r.nextOffset;
      }
    } finally {
      setScanning(false);
      setScanCompletedAt(/* @__PURE__ */ new Date());
      setScanDurationMs(Date.now() - startedAt);
    }
  }
  async function applyFix(b, action, newHref) {
    const k = key(b);
    setState((s) => ({
      ...s,
      [k]: {
        status: "fixing"
      }
    }));
    try {
      const res = await fixBrokenLink({
        data: {
          pageId: b.page_id,
          href: b.href,
          action,
          newHref
        }
      });
      if (res.ok) setState((s) => ({
        ...s,
        [k]: {
          status: "fixed",
          msg: action === "replace" ? `→ ${newHref}` : action
        }
      }));
      else setState((s) => ({
        ...s,
        [k]: {
          status: "error",
          msg: res.error || "Failed"
        }
      }));
    } catch (e) {
      setState((s) => ({
        ...s,
        [k]: {
          status: "error",
          msg: e?.message || "Failed"
        }
      }));
    }
  }
  const [bulkRunning, setBulkRunning] = React.useState(false);
  const [bulkResult, setBulkResult] = React.useState(null);
  async function applyBulk(action) {
    setBulkResult(null);
    const targets = filtered;
    if (!targets.length) return;
    if (action === "replace") {
      const missingSuggestion = targets.filter((b) => !((editHref[key(b)] ?? b.suggestion?.href) || "").trim());
      if (missingSuggestion.length === targets.length) {
        setBulkResult("No suggestions/edits available to replace with. Use Unlink or Remove instead.");
        return;
      }
    }
    const verb = action === "replace" ? "replace" : action;
    if (!confirm(`Apply "${verb}" to ${targets.length} link${targets.length === 1 ? "" : "s"}?${action === "replace" ? " Only links with a suggested or edited URL will be changed." : ""}`)) return;
    setBulkRunning(true);
    try {
      const items = targets.map((b) => {
        const newHref = (editHref[key(b)] ?? b.suggestion?.href ?? "").trim();
        if (action === "replace" && !newHref) return null;
        return {
          pageId: b.page_id,
          href: b.href,
          newHref: action === "replace" ? newHref : void 0
        };
      }).filter(Boolean);
      const res = await bulkFixBrokenLinks({
        data: {
          action,
          items
        }
      });
      setState((prev) => {
        const next = {
          ...prev
        };
        for (const it of items) {
          const k = `${it.pageId}::${it.href}`;
          next[k] = {
            status: "fixed",
            msg: action === "replace" ? `→ ${it.newHref}` : action
          };
        }
        return next;
      });
      setBulkResult(`Updated ${res.pagesUpdated} page${res.pagesUpdated === 1 ? "" : "s"} · fixed ${res.linksFixed} link${res.linksFixed === 1 ? "" : "s"}${res.linksSkipped ? ` · skipped ${res.linksSkipped}` : ""}${res.errors.length ? ` · ${res.errors.length} errors` : ""}.`);
    } catch (e) {
      setBulkResult(`Bulk fix failed: ${e?.message || "unknown error"}`);
    } finally {
      setBulkRunning(false);
    }
  }
  const filtered = rows.filter((r) => filter === "all" || r.reason === filter);
  const counts = {
    all: rows.length,
    missing_p_page: rows.filter((r) => r.reason === "missing_p_page").length,
    unknown_internal_path: rows.filter((r) => r.reason === "unknown_internal_path").length,
    malformed: rows.filter((r) => r.reason === "malformed").length
  };
  const pct = progress.total ? Math.round(progress.done / progress.total * 100) : 0;
  const report = React.useMemo(() => {
    if (!rows.length) return null;
    const byTarget = /* @__PURE__ */ new Map();
    for (const r of rows) {
      const e = byTarget.get(r.href) || {
        href: r.href,
        count: 0,
        pages: /* @__PURE__ */ new Set(),
        reason: r.reason,
        suggestion: r.suggestion?.href || null
      };
      e.count++;
      e.pages.add(r.page_url);
      if (!e.suggestion && r.suggestion?.href) e.suggestion = r.suggestion.href;
      byTarget.set(r.href, e);
    }
    const targets = Array.from(byTarget.values()).map((t) => ({
      ...t,
      pageCount: t.pages.size
    }));
    const topTargets = [...targets].sort((a, b) => b.count - a.count).slice(0, 10);
    const fastestFixes = targets.filter((t) => t.suggestion).sort((a, b) => b.count - a.count).slice(0, 8);
    const affectedPages = new Set(rows.map((r) => r.page_url)).size;
    return {
      topTargets,
      fastestFixes,
      affectedPages,
      withSuggestions: rows.filter((r) => r.suggestion?.href).length
    };
  }, [rows]);
  async function fixAllOf(href, newHref) {
    const items = rows.filter((r) => r.href === href).map((r) => ({
      pageId: r.page_id,
      href: r.href,
      newHref
    }));
    if (!items.length) return;
    if (!confirm(`Replace ${items.length} occurrence${items.length === 1 ? "" : "s"} of ${href} → ${newHref}?`)) return;
    setBulkRunning(true);
    try {
      const res = await bulkFixBrokenLinks({
        data: {
          action: "replace",
          items
        }
      });
      setState((prev) => {
        const next = {
          ...prev
        };
        for (const it of items) next[`${it.pageId}::${it.href}`] = {
          status: "fixed",
          msg: `→ ${newHref}`
        };
        return next;
      });
      setBulkResult(`Updated ${res.pagesUpdated} page${res.pagesUpdated === 1 ? "" : "s"} · fixed ${res.linksFixed} link${res.linksFixed === 1 ? "" : "s"}.`);
    } catch (e) {
      setBulkResult(`Failed: ${e?.message || "unknown"}`);
    } finally {
      setBulkRunning(false);
    }
  }
  return /* @__PURE__ */ jsxs(AdminLayout, { title: "Link checker", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Internal link checker" }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
          "Scans every published ",
          /* @__PURE__ */ jsx("code", { children: "/p/*" }),
          " page for broken internal links and offers one-click fixes."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxs("button", { onClick: () => setShowFilters((v) => !v), className: `rounded-full border px-4 py-2 text-sm font-semibold ${activeFilterCount ? "border-primary text-primary" : "border-border"}`, children: [
          "Filters",
          activeFilterCount ? ` (${activeFilterCount})` : ""
        ] }),
        scanning ? /* @__PURE__ */ jsx("button", { onClick: () => {
          abortRef.current = true;
        }, className: "rounded-full border border-border px-4 py-2 text-sm font-semibold", children: "Stop" }) : /* @__PURE__ */ jsx("button", { onClick: startScan, className: "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground", children: rows.length ? "Re-scan" : "Start scan" })
      ] }),
      healthRuns.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-lg border border-border bg-card p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-sm font-semibold", children: "Scheduled link-health runs" }),
          /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
            "Latest ",
            healthRuns.length,
            " of cron-driven /api/public/link-health calls"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-3 max-h-48 overflow-y-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs", children: [
          /* @__PURE__ */ jsx("thead", { className: "text-left text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "py-1 pr-3", children: "When" }),
            /* @__PURE__ */ jsx("th", { className: "py-1 pr-3", children: "Source" }),
            /* @__PURE__ */ jsx("th", { className: "py-1 pr-3", children: "Checked" }),
            /* @__PURE__ */ jsx("th", { className: "py-1 pr-3", children: "Broken" }),
            /* @__PURE__ */ jsx("th", { className: "py-1 pr-3", children: "Duration" }),
            /* @__PURE__ */ jsx("th", { className: "py-1", children: "Status" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: healthRuns.map((r) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border/50", children: [
            /* @__PURE__ */ jsx("td", { className: "py-1 pr-3 whitespace-nowrap", children: new Date(r.ran_at).toLocaleString() }),
            /* @__PURE__ */ jsx("td", { className: "py-1 pr-3", children: r.source }),
            /* @__PURE__ */ jsx("td", { className: "py-1 pr-3", children: r.checked }),
            /* @__PURE__ */ jsx("td", { className: `py-1 pr-3 ${r.broken_count ? "font-semibold text-destructive" : ""}`, children: r.broken_count }),
            /* @__PURE__ */ jsx("td", { className: "py-1 pr-3", children: r.duration_ms ? `${(r.duration_ms / 1e3).toFixed(1)}s` : "—" }),
            /* @__PURE__ */ jsx("td", { className: "py-1", children: r.ok ? "✓" : "✗" })
          ] }, r.id)) })
        ] }) })
      ] })
    ] }),
    showFilters && /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-lg border border-border bg-card p-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("label", { className: "block text-xs", children: [
          /* @__PURE__ */ jsx("span", { className: "mb-1 block font-medium text-muted-foreground", children: "URL prefix" }),
          /* @__PURE__ */ jsx("input", { value: fUrlPrefix, onChange: (e) => setFUrlPrefix(e.target.value), placeholder: "/p/ or /p/austin-tx-", className: "w-full rounded border border-border bg-background px-2 py-1.5 text-sm" }),
          /* @__PURE__ */ jsxs("span", { className: "mt-1 block text-[11px] text-muted-foreground", children: [
            "Must start with ",
            /* @__PURE__ */ jsx("code", { children: "/p/" }),
            ". Limits scan to URLs starting with this."
          ] })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "block text-xs", children: [
          /* @__PURE__ */ jsx("span", { className: "mb-1 block font-medium text-muted-foreground", children: "URL contains" }),
          /* @__PURE__ */ jsx("input", { value: fUrlContains, onChange: (e) => setFUrlContains(e.target.value), placeholder: "austin", className: "w-full rounded border border-border bg-background px-2 py-1.5 text-sm" }),
          /* @__PURE__ */ jsx("span", { className: "mt-1 block text-[11px] text-muted-foreground", children: "Substring match on the URL path (case-insensitive)." })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "block text-xs", children: [
          /* @__PURE__ */ jsx("span", { className: "mb-1 block font-medium text-muted-foreground", children: "Range start" }),
          /* @__PURE__ */ jsx("input", { value: fRangeStart, onChange: (e) => setFRangeStart(e.target.value), placeholder: "/p/a", className: "w-full rounded border border-border bg-background px-2 py-1.5 text-sm" })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "block text-xs", children: [
          /* @__PURE__ */ jsx("span", { className: "mb-1 block font-medium text-muted-foreground", children: "Range end" }),
          /* @__PURE__ */ jsx("input", { value: fRangeEnd, onChange: (e) => setFRangeEnd(e.target.value), placeholder: "/p/m", className: "w-full rounded border border-border bg-background px-2 py-1.5 text-sm" })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "block text-xs sm:col-span-2", children: [
          /* @__PURE__ */ jsx("span", { className: "mb-1 block font-medium text-muted-foreground", children: "Page IDs (overrides URL filters)" }),
          /* @__PURE__ */ jsx("textarea", { value: fPageIdsRaw, onChange: (e) => setFPageIdsRaw(e.target.value), rows: 2, placeholder: "UUIDs separated by spaces, commas, or newlines", className: "w-full rounded border border-border bg-background px-2 py-1.5 font-mono text-xs" })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 sm:col-span-2", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", checked: fOnlyMissing, onChange: (e) => setFOnlyMissing(e.target.checked), className: "h-4 w-4" }),
          /* @__PURE__ */ jsxs("span", { className: "text-sm", children: [
            "Only report ",
            /* @__PURE__ */ jsx("code", { children: "/p/" }),
            " missing-target issues"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-3 flex justify-end gap-2", children: /* @__PURE__ */ jsx("button", { onClick: resetFilters, className: "rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted", children: "Reset" }) })
    ] }),
    (scanning || progress.total > 0) && /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsx("span", { children: scanning ? "Scanning…" : "Scan complete" }),
        /* @__PURE__ */ jsxs("span", { children: [
          progress.done,
          " / ",
          progress.total,
          " pages · ",
          rows.length,
          " broken links"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-1 h-2 overflow-hidden rounded-full bg-muted", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-primary transition-all", style: {
        width: `${pct}%`
      } }) })
    ] }),
    !scanning && report && /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-lg border border-border bg-card p-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-baseline justify-between gap-2", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Scan summary" }),
        /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
          scanCompletedAt ? scanCompletedAt.toLocaleString() : "",
          scanDurationMs != null ? ` · ${(scanDurationMs / 1e3).toFixed(1)}s` : ""
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5", children: [["Pages scanned", progress.done.toLocaleString()], ["Broken links", rows.length.toLocaleString()], ["Affected pages", report.affectedPages.toLocaleString()], ["With suggestion", report.withSuggestions.toLocaleString()], ["Missing /p/", counts.missing_p_page.toLocaleString()]].map(([label, val]) => /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border bg-background p-3", children: [
        /* @__PURE__ */ jsx("div", { className: "text-[11px] uppercase tracking-wide text-muted-foreground", children: label }),
        /* @__PURE__ */ jsx("div", { className: "mt-1 text-xl font-semibold", children: val })
      ] }, label)) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-5 grid gap-4 lg:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold", children: "Top broken targets" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Links broken in the most places." }),
          /* @__PURE__ */ jsxs("ol", { className: "mt-2 space-y-1.5", children: [
            report.topTargets.length === 0 && /* @__PURE__ */ jsx("li", { className: "text-xs text-muted-foreground", children: "None." }),
            report.topTargets.map((t) => /* @__PURE__ */ jsxs("li", { className: "flex items-center justify-between gap-2 rounded border border-border bg-background px-2 py-1.5", children: [
              /* @__PURE__ */ jsx("code", { className: "truncate text-xs", title: t.href, children: t.href }),
              /* @__PURE__ */ jsxs("span", { className: "shrink-0 text-xs text-muted-foreground", children: [
                t.count,
                "× · ",
                t.pageCount,
                " page",
                t.pageCount === 1 ? "" : "s"
              ] })
            ] }, t.href))
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold", children: "Fastest fixes by impact" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Targets with a suggested replacement, ordered by occurrences fixed." }),
          /* @__PURE__ */ jsxs("ol", { className: "mt-2 space-y-1.5", children: [
            report.fastestFixes.length === 0 && /* @__PURE__ */ jsx("li", { className: "text-xs text-muted-foreground", children: "No suggestions available yet." }),
            report.fastestFixes.map((t) => /* @__PURE__ */ jsxs("li", { className: "rounded border border-border bg-background px-2 py-1.5", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                /* @__PURE__ */ jsx("code", { className: "truncate text-xs", title: t.href, children: t.href }),
                /* @__PURE__ */ jsxs("span", { className: "shrink-0 text-xs text-muted-foreground", children: [
                  t.count,
                  "× · ",
                  t.pageCount,
                  " pg"
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-center justify-between gap-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "truncate text-[11px] text-muted-foreground", children: [
                  "→ ",
                  /* @__PURE__ */ jsx("code", { children: t.suggestion })
                ] }),
                /* @__PURE__ */ jsx("button", { disabled: bulkRunning, onClick: () => fixAllOf(t.href, t.suggestion), className: "shrink-0 rounded bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground disabled:opacity-50", children: "Fix all" })
              ] })
            ] }, t.href))
          ] })
        ] })
      ] })
    ] }),
    rows.length > 0 && /* @__PURE__ */ jsx("div", { className: "mt-6 flex flex-wrap gap-2", children: [["all", "All"], ["missing_p_page", "Missing /p/"], ["unknown_internal_path", "Unknown internal"], ["malformed", "Malformed"]].map(([id, label]) => /* @__PURE__ */ jsxs("button", { onClick: () => setFilter(id), className: `rounded-full border px-3 py-1 text-xs font-medium ${filter === id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`, children: [
      label,
      " (",
      counts[id],
      ")"
    ] }, id)) }),
    filtered.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3", children: [
      /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium", children: [
        "Bulk action on ",
        filtered.length,
        " filtered link",
        filtered.length === 1 ? "" : "s",
        ":"
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: () => applyBulk("replace"), disabled: bulkRunning, className: "rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50", title: "Replaces each link with its suggested or edited URL. Links without a target are skipped.", children: "⚡ Replace all (using suggestions)" }),
      /* @__PURE__ */ jsx("button", { onClick: () => applyBulk("unlink"), disabled: bulkRunning, className: "rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50", children: "Unlink all" }),
      /* @__PURE__ */ jsx("button", { onClick: () => applyBulk("remove"), disabled: bulkRunning, className: "rounded-md border border-red-500 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-500/10 disabled:opacity-50", children: "Remove all" }),
      bulkRunning && /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "Working…" }),
      bulkResult && /* @__PURE__ */ jsx("span", { className: "ml-auto text-xs text-muted-foreground", children: bulkResult })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-4 overflow-x-auto rounded-lg border border-border", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-left", children: "Page" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-left", children: "Broken link" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-left", children: "Reason" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-left", children: "Fix" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        filtered.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "px-3 py-8 text-center text-muted-foreground", children: scanning ? "Scanning…" : rows.length ? "No links match this filter." : "Run a scan to find broken links." }) }),
        filtered.map((b) => {
          const k = key(b);
          const st = state[k];
          const suggested = b.suggestion?.href || "";
          const editVal = editHref[k] ?? suggested;
          return /* @__PURE__ */ jsxs("tr", { className: "border-t border-border align-top", children: [
            /* @__PURE__ */ jsxs("td", { className: "px-3 py-2", children: [
              /* @__PURE__ */ jsx("a", { href: b.page_url, target: "_blank", rel: "noreferrer", className: "font-medium text-primary hover:underline", children: b.page_url }),
              /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground line-clamp-1", children: b.page_title || "" })
            ] }),
            /* @__PURE__ */ jsxs("td", { className: "px-3 py-2", children: [
              /* @__PURE__ */ jsx("code", { className: "rounded bg-muted px-1.5 py-0.5 text-xs", children: b.href }),
              /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
                'label: "',
                b.label,
                '"'
              ] })
            ] }),
            /* @__PURE__ */ jsxs("td", { className: "px-3 py-2", children: [
              /* @__PURE__ */ jsx("span", { className: "rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:text-yellow-400", children: REASON_LABEL[b.reason] }),
              b.suggestion && /* @__PURE__ */ jsxs("div", { className: "mt-1 text-xs text-muted-foreground", children: [
                "Suggested: ",
                /* @__PURE__ */ jsx("code", { className: "rounded bg-muted px-1 py-0.5", children: b.suggestion.href }),
                " (",
                b.suggestion.reason,
                ")"
              ] })
            ] }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: st?.status === "fixed" ? /* @__PURE__ */ jsxs("span", { className: "text-xs font-medium text-green-600 dark:text-green-400", children: [
              "✓ Fixed ",
              st.msg
            ] }) : st?.status === "error" ? /* @__PURE__ */ jsxs("span", { className: "text-xs font-medium text-red-600 dark:text-red-400", children: [
              "✗ ",
              st.msg
            ] }) : /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-1.5", children: [
              /* @__PURE__ */ jsx("input", { value: editVal, onChange: (e) => setEditHref((m) => ({
                ...m,
                [k]: e.target.value
              })), placeholder: "/p/replacement", className: "w-44 rounded border border-border bg-background px-2 py-1 text-xs" }),
              /* @__PURE__ */ jsx("button", { disabled: st?.status === "fixing" || !editVal.trim(), onClick: () => applyFix(b, "replace", editVal.trim()), className: "rounded bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground disabled:opacity-50", children: "Replace" }),
              /* @__PURE__ */ jsx("button", { disabled: st?.status === "fixing", onClick: () => applyFix(b, "unlink"), className: "rounded border border-border px-2 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50", children: "Unlink" }),
              /* @__PURE__ */ jsx("button", { disabled: st?.status === "fixing", onClick: () => applyFix(b, "remove"), className: "rounded border border-border px-2 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50", children: "Remove" })
            ] }) })
          ] }, k + Math.random());
        })
      ] })
    ] }) })
  ] });
}
export {
  LinkChecker as component
};
