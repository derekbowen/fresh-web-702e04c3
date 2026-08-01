import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import * as React from "react";
import { u as useBgJobs, A as AdminLayout, a as upsertJob } from "./admin-layout-BAYjOizo.js";
import { bk as listContentPages, aX as enqueueSeoFixJobs, bl as bulkUpdateContentPages, bm as updateContentPage, bn as getContentPage, bo as listSectionPresets, bp as SECTION_PRESETS, bq as generateFullPageContent, br as improvePageContent, bs as generateSeoMeta, bt as generateSectionPreset, bu as appendAiContentToPage, bv as generateCustomSection, bw as deleteSectionPreset, bx as saveSectionPreset, by as autoFixSeo } from "./router-DnjagyeS.js";
import "@tanstack/react-router";
import "lucide-react";
import "./client-Dh5RMKgP.js";
import "@supabase/supabase-js";
import "@tanstack/react-query";
import "./site-footer-defaults-asWdr-hi.js";
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
import "./auth-middleware-Bd-cw3tB.js";
import "./createMiddleware-BvN2ghIY.js";
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
import "./renter-drip.server-D2A63B6b.js";
import "node:fs";
import "node:path";
import "./host-drip.server-CML6Wr0O.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
const INSIGHTS = [{
  key: "all",
  label: "All",
  test: () => true
}, {
  key: "missing_meta",
  label: "Missing meta",
  test: (r) => r.seo_title_len === 0 || r.seo_desc_len === 0
}, {
  key: "no_keyword",
  label: "No focus keyword",
  test: (r) => !r.has_keyword
}, {
  key: "thin",
  label: "Thin (<400w)",
  test: (r) => r.words < 400
}, {
  key: "no_hero",
  label: "No hero image",
  test: (r) => !r.has_hero
}, {
  key: "low_score",
  label: "Low SEO score (<60)",
  test: (r) => r.score < 60
}];
function ScorePill({
  score
}) {
  const tone = score >= 80 ? "bg-green-500/20 text-green-700 dark:text-green-300" : score >= 60 ? "bg-amber-500/20 text-amber-700 dark:text-amber-300" : "bg-red-500/20 text-red-700 dark:text-red-300";
  return /* @__PURE__ */ jsx("span", { className: `inline-block min-w-[2.25rem] rounded px-1.5 py-0.5 text-center text-xs font-semibold tabular-nums ${tone}`, children: score });
}
function BulkEditor() {
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [template, setTemplate] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(50);
  const [rows, setRows] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState(/* @__PURE__ */ new Set());
  const [busy, setBusy] = React.useState(false);
  const [editingId, setEditingId] = React.useState(null);
  const [insight, setInsight] = React.useState("all");
  const [sortKey, setSortKey] = React.useState("updated");
  const [sortDir, setSortDir] = React.useState("desc");
  const [cursor, setCursor] = React.useState(0);
  const [inlineEditing, setInlineEditing] = React.useState(null);
  const searchRef = React.useRef(null);
  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await listContentPages({
        data: {
          q,
          status,
          template,
          page,
          pageSize
        }
      });
      setRows(r.rows);
      setTotal(r.total);
    } finally {
      setLoading(false);
    }
  }, [q, status, template, page, pageSize]);
  React.useEffect(() => {
    void load();
  }, [load]);
  const visibleRows = React.useMemo(() => {
    const ins = INSIGHTS.find((i) => i.key === insight).test;
    const filtered = rows.filter(ins);
    const dir = sortDir === "asc" ? 1 : -1;
    const key = sortKey;
    const sorted = [...filtered].sort((a, b) => {
      const av = key === "url" ? a.url_path || "" : key === "title" ? a.title || "" : key === "template" ? a.template_type || "" : key === "status" ? a.status : key === "words" ? a.words : key === "score" ? a.score : new Date(a.updated_at).getTime();
      const bv = key === "url" ? b.url_path || "" : key === "title" ? b.title || "" : key === "template" ? b.template_type || "" : key === "status" ? b.status : key === "words" ? b.words : key === "score" ? b.score : new Date(b.updated_at).getTime();
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return sorted;
  }, [rows, insight, sortKey, sortDir]);
  React.useEffect(() => {
    if (cursor >= visibleRows.length) setCursor(Math.max(0, visibleRows.length - 1));
  }, [visibleRows.length, cursor]);
  function toggle(id) {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }
  function toggleAllVisible() {
    setSelected((s) => {
      const allOn = visibleRows.length > 0 && visibleRows.every((r) => s.has(r.id));
      const n = new Set(s);
      if (allOn) visibleRows.forEach((r) => n.delete(r.id));
      else visibleRows.forEach((r) => n.add(r.id));
      return n;
    });
  }
  function selectAllOnPage() {
    setSelected((s) => {
      const n = new Set(s);
      rows.forEach((r) => n.add(r.id));
      return n;
    });
  }
  function changeSort(k) {
    setSortKey((cur) => {
      if (cur === k) {
        setSortDir((d) => d === "asc" ? "desc" : "asc");
        return cur;
      }
      setSortDir(k === "updated" || k === "words" || k === "score" ? "desc" : "asc");
      return k;
    });
  }
  React.useEffect(() => {
    function onKey(e) {
      const tag = e.target?.tagName;
      if (editingId || inlineEditing) return;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        if (e.key === "Escape") e.target.blur();
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (e.key === "j") {
        e.preventDefault();
        setCursor((c) => Math.min(visibleRows.length - 1, c + 1));
        return;
      }
      if (e.key === "k") {
        e.preventDefault();
        setCursor((c) => Math.max(0, c - 1));
        return;
      }
      if (e.key === "x") {
        e.preventDefault();
        const r = visibleRows[cursor];
        if (r) toggle(r.id);
        return;
      }
      if (e.key === "e" || e.key === "Enter") {
        e.preventDefault();
        const r = visibleRows[cursor];
        if (r) setEditingId(r.id);
        return;
      }
      if (e.key === "a" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleAllVisible();
        return;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visibleRows, cursor, editingId, inlineEditing]);
  const bgJobs = useBgJobs();
  const activeBgJob = bgJobs.find((j) => j.status === "running");
  async function bulkAi(mode) {
    if (!selected.size) return;
    const ids = Array.from(selected);
    const label = mode === "full" ? "Auto-fix everything (meta + body if thin)" : mode === "meta_only" ? "Generate SEO meta only" : "Rewrite title only";
    if (!confirm(`${label} on ${ids.length} page${ids.length > 1 ? "s" : ""}? Runs in the background — you can navigate freely while it works. Uses AI credits.`)) return;
    setBusy(true);
    try {
      let batchId;
      for (let i = 0; i < ids.length; i += 500) {
        const chunk = ids.slice(i, i + 500);
        const r = await enqueueSeoFixJobs({
          data: {
            pageIds: chunk,
            mode
          }
        });
        if (!r?.ok) throw new Error(r?.error || "Failed to enqueue");
        if (!batchId) batchId = r.batchId;
      }
      if (!batchId) throw new Error("No batch created");
      upsertJob({
        id: batchId,
        kind: "seo_fix",
        label,
        total: ids.length,
        done: 0,
        failed: 0,
        cancelled: 0,
        status: "running",
        startedAt: Date.now()
      });
      setSelected(/* @__PURE__ */ new Set());
    } catch (e) {
      alert(`Bulk AI error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }
  async function bulk(action) {
    if (!selected.size) return;
    if (action === "delete" && !confirm(`Delete ${selected.size} pages?`)) return;
    setBusy(true);
    try {
      const r = await bulkUpdateContentPages({
        data: {
          ids: Array.from(selected),
          action
        }
      });
      if (action === "publish" && r?.ok) {
        const skipped = r.skipped ?? 0;
        const count = r.count ?? 0;
        if (skipped > 0) {
          const sample = (r.skippedSlugs || []).slice(0, 5).join(", ");
          const more = (r.skippedSlugs || []).length > 5 ? ` (+${r.skippedSlugs.length - 5} more)` : "";
          alert(`Published ${count}. Kept ${skipped} as draft (fewer than 300 words):
${sample}${more}`);
        }
      }
      setSelected(/* @__PURE__ */ new Set());
      await load();
    } finally {
      setBusy(false);
    }
  }
  async function commitInlineTitle() {
    if (!inlineEditing) return;
    const {
      id,
      value
    } = inlineEditing;
    setInlineEditing(null);
    if (!value.trim()) return;
    const original = rows.find((r) => r.id === id);
    if (original?.title === value) return;
    setRows((rs) => rs.map((r) => r.id === id ? {
      ...r,
      title: value
    } : r));
    try {
      await updateContentPage({
        data: {
          id,
          title: value
        }
      });
    } catch (e) {
      await load();
      alert(`Title save failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  function HeaderCell({
    k,
    label,
    className
  }) {
    const active = sortKey === k;
    return /* @__PURE__ */ jsx("th", { className: `px-3 py-2 ${className || ""}`, children: /* @__PURE__ */ jsxs("button", { onClick: () => changeSort(k), className: `inline-flex items-center gap-1 hover:text-foreground ${active ? "text-foreground" : ""}`, children: [
      label,
      /* @__PURE__ */ jsx("span", { className: "text-[10px] opacity-60", children: active ? sortDir === "asc" ? "▲" : "▼" : "↕" })
    ] }) });
  }
  return /* @__PURE__ */ jsxs(AdminLayout, { title: "Bulk page editor", children: [
    /* @__PURE__ */ jsx("div", { className: "flex items-baseline justify-between gap-4", children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Bulk page editor" }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
        "Filter, sort, select, and bulk-fix /p/* pages. Press ",
        /* @__PURE__ */ jsx("kbd", { className: "rounded border border-border bg-muted px-1 text-[10px]", children: "/" }),
        " to search, ",
        /* @__PURE__ */ jsx("kbd", { className: "rounded border border-border bg-muted px-1 text-[10px]", children: "j" }),
        "/",
        /* @__PURE__ */ jsx("kbd", { className: "rounded border border-border bg-muted px-1 text-[10px]", children: "k" }),
        " to move, ",
        /* @__PURE__ */ jsx("kbd", { className: "rounded border border-border bg-muted px-1 text-[10px]", children: "x" }),
        " to select, ",
        /* @__PURE__ */ jsx("kbd", { className: "rounded border border-border bg-muted px-1 text-[10px]", children: "e" }),
        " to edit."
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap items-center gap-2", children: [
      /* @__PURE__ */ jsx("input", { ref: searchRef, value: q, onChange: (e) => {
        setQ(e.target.value);
        setPage(1);
      }, placeholder: "Search url or title… (/)", className: "w-64 rounded-md border border-border bg-background px-3 py-1.5 text-sm" }),
      /* @__PURE__ */ jsxs("select", { value: status, onChange: (e) => {
        setStatus(e.target.value);
        setPage(1);
      }, className: "rounded-md border border-border bg-background px-3 py-1.5 text-sm", children: [
        /* @__PURE__ */ jsx("option", { value: "all", children: "All status" }),
        /* @__PURE__ */ jsx("option", { value: "published", children: "Published" }),
        /* @__PURE__ */ jsx("option", { value: "draft", children: "Unpublished (draft)" }),
        /* @__PURE__ */ jsx("option", { value: "pending", children: "Pending" }),
        /* @__PURE__ */ jsx("option", { value: "scraped", children: "Scraped" })
      ] }),
      /* @__PURE__ */ jsx("input", { value: template, onChange: (e) => {
        setTemplate(e.target.value);
        setPage(1);
      }, placeholder: "Template type…", className: "w-48 rounded-md border border-border bg-background px-3 py-1.5 text-sm" }),
      /* @__PURE__ */ jsx("select", { value: pageSize, onChange: (e) => {
        setPageSize(Number(e.target.value));
        setPage(1);
      }, title: "Rows per page", className: "rounded-md border border-border bg-background px-3 py-1.5 text-sm", children: [50, 100, 250, 500, 1e3].map((n) => /* @__PURE__ */ jsxs("option", { value: n, children: [
        n,
        " / page"
      ] }, n)) }),
      /* @__PURE__ */ jsxs("span", { className: "ml-auto text-sm text-muted-foreground", children: [
        visibleRows.length.toLocaleString(),
        " shown · ",
        total.toLocaleString(),
        " total"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-1.5", children: [
      /* @__PURE__ */ jsx("span", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: "Insights:" }),
      INSIGHTS.map((i) => {
        const count = i.key === "all" ? rows.length : rows.filter(i.test).length;
        const active = insight === i.key;
        return /* @__PURE__ */ jsxs("button", { onClick: () => setInsight(i.key), className: `rounded-full border px-3 py-1 text-xs transition ${active ? "border-primary bg-primary/10 text-primary" : "border-border bg-background hover:border-primary/40"}`, children: [
          i.label,
          " ",
          /* @__PURE__ */ jsx("span", { className: "ml-1 tabular-nums opacity-70", children: count })
        ] }, i.key);
      })
    ] }),
    selected.size > 0 && /* @__PURE__ */ jsxs("div", { className: "sticky top-0 z-30 mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 p-3 backdrop-blur", children: [
      /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium", children: [
        selected.size,
        " selected"
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: selectAllOnPage, className: "rounded border border-border bg-background px-2 py-1 text-xs hover:bg-muted", children: [
        "+ all on page (",
        rows.length,
        ")"
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: () => setSelected(/* @__PURE__ */ new Set()), className: "rounded border border-border bg-background px-2 py-1 text-xs hover:bg-muted", children: "Clear" }),
      /* @__PURE__ */ jsxs("div", { className: "ml-auto flex flex-wrap items-center gap-2", children: [
        activeBgJob && /* @__PURE__ */ jsxs("span", { className: "text-xs tabular-nums text-muted-foreground", children: [
          "Background: ",
          activeBgJob.done + activeBgJob.failed,
          "/",
          activeBgJob.total
        ] }),
        /* @__PURE__ */ jsx(BulkAiMenu, { disabled: busy, onPick: bulkAi, count: selected.size }),
        /* @__PURE__ */ jsx("button", { disabled: busy, onClick: () => bulk("publish"), className: "rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50", children: "Publish" }),
        /* @__PURE__ */ jsx("button", { disabled: busy, onClick: () => bulk("unpublish"), className: "rounded bg-yellow-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50", children: "Unpublish" }),
        /* @__PURE__ */ jsx("button", { disabled: busy, onClick: () => bulk("delete"), className: "rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50", children: "Delete" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-4 overflow-x-auto rounded-xl border border-border", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "sticky top-0 z-10 bg-muted/80 text-left text-xs uppercase backdrop-blur", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: /* @__PURE__ */ jsx("input", { type: "checkbox", checked: visibleRows.length > 0 && visibleRows.every((r) => selected.has(r.id)), onChange: toggleAllVisible }) }),
        /* @__PURE__ */ jsx(HeaderCell, { k: "url", label: "URL" }),
        /* @__PURE__ */ jsx(HeaderCell, { k: "title", label: "Title" }),
        /* @__PURE__ */ jsx(HeaderCell, { k: "template", label: "Template" }),
        /* @__PURE__ */ jsx(HeaderCell, { k: "status", label: "Status" }),
        /* @__PURE__ */ jsx(HeaderCell, { k: "words", label: "Words", className: "text-right" }),
        /* @__PURE__ */ jsx(HeaderCell, { k: "score", label: "SEO", className: "text-right" }),
        /* @__PURE__ */ jsx(HeaderCell, { k: "updated", label: "Updated", className: "text-right" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-right", children: "Actions" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        visibleRows.map((r, idx) => {
          const isCursor = idx === cursor;
          const isSelected = selected.has(r.id);
          const issues = [];
          if (r.seo_title_len === 0) issues.push("no SEO title");
          else if (r.seo_title_len < 40 || r.seo_title_len > 65) issues.push(`title len ${r.seo_title_len}`);
          if (r.seo_desc_len === 0) issues.push("no SEO desc");
          else if (r.seo_desc_len < 120 || r.seo_desc_len > 165) issues.push(`desc len ${r.seo_desc_len}`);
          if (!r.has_keyword) issues.push("no focus kw");
          if (!r.has_hero) issues.push("no hero");
          if (r.words < 400) issues.push(`thin (${r.words}w)`);
          if (r.internal_links < 3) issues.push(`${r.internal_links} internal links`);
          return /* @__PURE__ */ jsxs("tr", { onClick: () => setCursor(idx), className: `border-t border-border ${isSelected ? "bg-primary/5" : ""} ${isCursor ? "ring-1 ring-inset ring-primary/40" : ""} hover:bg-muted/40`, children: [
            /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsx("input", { type: "checkbox", checked: isSelected, onChange: () => toggle(r.id), onClick: (e) => e.stopPropagation() }) }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-2 font-mono text-xs", children: /* @__PURE__ */ jsx("a", { href: r.url_path || "#", target: "_blank", rel: "noreferrer", className: "hover:underline", onClick: (e) => e.stopPropagation(), children: r.url_path }) }),
            /* @__PURE__ */ jsx("td", { className: "max-w-xs truncate px-3 py-2", onDoubleClick: (e) => {
              e.stopPropagation();
              setInlineEditing({
                id: r.id,
                field: "title",
                value: r.title || ""
              });
            }, title: "Double-click to edit title inline", children: inlineEditing?.id === r.id ? /* @__PURE__ */ jsx("input", { autoFocus: true, value: inlineEditing.value, onChange: (e) => setInlineEditing({
              ...inlineEditing,
              value: e.target.value
            }), onBlur: commitInlineTitle, onKeyDown: (e) => {
              if (e.key === "Enter") commitInlineTitle();
              if (e.key === "Escape") setInlineEditing(null);
            }, onClick: (e) => e.stopPropagation(), className: "w-full rounded border border-primary/50 bg-background px-2 py-1 text-sm" }) : /* @__PURE__ */ jsx("span", { children: r.title || /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "—" }) }) }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-xs text-muted-foreground", children: r.template_type || "—" }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsx("span", { className: `rounded px-1.5 py-0.5 text-xs ${r.status === "published" ? "bg-green-500/20 text-green-700 dark:text-green-300" : "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300"}`, children: r.status }) }),
            /* @__PURE__ */ jsx("td", { className: `px-3 py-2 text-right tabular-nums ${r.words < 400 ? "text-amber-600" : ""}`, children: r.words }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right", children: /* @__PURE__ */ jsx("span", { title: issues.length ? issues.join(" · ") : "Looks good", children: /* @__PURE__ */ jsx(ScorePill, { score: r.score }) }) }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right text-xs text-muted-foreground", children: new Date(r.updated_at).toLocaleDateString() }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right", children: /* @__PURE__ */ jsx("button", { onClick: (e) => {
              e.stopPropagation();
              setEditingId(r.id);
            }, className: "rounded border border-border px-2 py-1 text-xs hover:bg-muted", children: "Edit" }) })
          ] }, r.id);
        }),
        !loading && visibleRows.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsxs("td", { colSpan: 9, className: "px-3 py-8 text-center text-muted-foreground", children: [
          "No matches",
          insight !== "all" ? ` for "${INSIGHTS.find((i) => i.key === insight)?.label}"` : "",
          "."
        ] }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center justify-between text-sm", children: [
      /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
        "Page ",
        page,
        " of ",
        totalPages
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx("button", { disabled: page <= 1, onClick: () => setPage((p) => p - 1), className: "rounded border border-border px-3 py-1 disabled:opacity-50", children: "← Prev" }),
        /* @__PURE__ */ jsx("button", { disabled: page >= totalPages, onClick: () => setPage((p) => p + 1), className: "rounded border border-border px-3 py-1 disabled:opacity-50", children: "Next →" })
      ] })
    ] }),
    editingId && /* @__PURE__ */ jsx(PageEditorModal, { id: editingId, onClose: () => setEditingId(null), onSaved: () => {
      void load();
    } })
  ] });
}
function BulkAiMenu({
  disabled,
  onPick,
  count
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);
  return /* @__PURE__ */ jsxs("div", { ref, className: "relative", children: [
    /* @__PURE__ */ jsxs("button", { disabled, onClick: () => setOpen((v) => !v), className: "rounded bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground disabled:opacity-50", children: [
      "✨ AI fix ",
      count,
      " ▾"
    ] }),
    open && /* @__PURE__ */ jsxs("div", { className: "absolute right-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-md border border-border bg-popover shadow-lg", children: [
      /* @__PURE__ */ jsxs("button", { onClick: () => {
        setOpen(false);
        onPick("full");
      }, className: "block w-full px-3 py-2 text-left text-xs hover:bg-muted", children: [
        /* @__PURE__ */ jsx("div", { className: "font-semibold", children: "Auto-fix everything" }),
        /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: "Meta + body if thin or under-linked" })
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: () => {
        setOpen(false);
        onPick("meta_only");
      }, className: "block w-full px-3 py-2 text-left text-xs hover:bg-muted", children: [
        /* @__PURE__ */ jsx("div", { className: "font-semibold", children: "Generate SEO meta only" }),
        /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: "SEO title, description, OG fields" })
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: () => {
        setOpen(false);
        onPick("title_only");
      }, className: "block w-full px-3 py-2 text-left text-xs hover:bg-muted", children: [
        /* @__PURE__ */ jsx("div", { className: "font-semibold", children: "Rewrite title only" }),
        /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: "Page H1 / SEO title" })
      ] })
    ] })
  ] });
}
function PageEditorModal({
  id,
  onClose,
  onSaved
}) {
  const [page, setPage] = React.useState(null);
  const [original, setOriginal] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [aiBusy, setAiBusy] = React.useState(null);
  const [aiPrompt, setAiPrompt] = React.useState("");
  const [aiAppend, setAiAppend] = React.useState(true);
  const [msg, setMsg] = React.useState(null);
  const [err, setErr] = React.useState(null);
  const [bodyView, setBodyView] = React.useState("edit");
  const [preview, setPreview] = React.useState(null);
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await getContentPage({
          data: {
            id
          }
        });
        if (cancelled) return;
        if (r.ok) {
          setPage(r.page);
          setOriginal(r.page);
        } else setErr(r.error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);
  React.useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && !preview) onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        void save();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [preview, page]);
  async function save() {
    if (!page) return;
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      const r = await updateContentPage({
        data: {
          id: page.id,
          title: page.title ?? void 0,
          seo_title: page.seo_title ?? void 0,
          seo_description: page.seo_description ?? void 0,
          og_title: page.og_title ?? null,
          og_description: page.og_description ?? null,
          focus_keyword: page.focus_keyword ?? null,
          canonical_override: page.canonical_override ?? null,
          hero_image_url: page.hero_image_url ?? null,
          body_markdown: page.body_markdown ?? void 0,
          status: page.status
        }
      });
      if (r.ok) {
        setMsg("Saved.");
        setOriginal(page);
        onSaved();
      } else setErr(r.error || "Save failed");
    } finally {
      setSaving(false);
    }
  }
  async function runSection(presetKeyOrPrompt) {
    if (!page) return;
    setAiBusy("section");
    setMsg(null);
    setErr(null);
    setPreview(null);
    try {
      if ("presetKey" in presetKeyOrPrompt) {
        const r = await generateSectionPreset({
          data: {
            id: page.id,
            preset_key: presetKeyOrPrompt.presetKey
          }
        });
        if (r.ok) {
          const label = SECTION_PRESETS.find((p) => p.key === presetKeyOrPrompt.presetKey)?.label ?? "Section";
          setPreview({
            kind: "section",
            markdown: r.markdown,
            label
          });
        } else setErr(r.error);
      } else {
        const r = await appendAiContentToPage({
          data: {
            id: page.id,
            prompt: presetKeyOrPrompt.prompt,
            append: aiAppend
          }
        });
        if (r.ok) {
          setPage({
            ...page,
            body_markdown: r.body_markdown
          });
          setAiPrompt("");
          setMsg(aiAppend ? "Section appended and saved." : "Body replaced and saved.");
          onSaved();
        } else setErr(r.error);
      }
    } finally {
      setAiBusy(null);
    }
  }
  async function runFullPage() {
    if (!page) return;
    setAiBusy("full");
    setMsg(null);
    setErr(null);
    setPreview(null);
    try {
      const r = await generateFullPageContent({
        data: {
          id: page.id
        }
      });
      if (r.ok) setPreview({
        kind: "body",
        markdown: r.body_markdown,
        label: "Generated full page",
        before: page.body_markdown || ""
      });
      else setErr(r.error);
    } finally {
      setAiBusy(null);
    }
  }
  async function runImprove() {
    if (!page) return;
    setAiBusy("improve");
    setMsg(null);
    setErr(null);
    setPreview(null);
    try {
      const r = await improvePageContent({
        data: {
          id: page.id
        }
      });
      if (r.ok) setPreview({
        kind: "body",
        markdown: r.body_markdown,
        label: "Improved page",
        before: page.body_markdown || ""
      });
      else setErr(r.error);
    } finally {
      setAiBusy(null);
    }
  }
  async function runMeta() {
    if (!page) return;
    setAiBusy("meta");
    setMsg(null);
    setErr(null);
    setPreview(null);
    try {
      const r = await generateSeoMeta({
        data: {
          id: page.id
        }
      });
      if (r.ok) setPreview({
        kind: "meta",
        seo_title: r.seo_title,
        seo_description: r.seo_description,
        og_title: r.og_title,
        og_description: r.og_description,
        before: {
          seo_title: page.seo_title || "",
          seo_description: page.seo_description || "",
          og_title: page.og_title || "",
          og_description: page.og_description || ""
        }
      });
      else setErr(r.error);
    } finally {
      setAiBusy(null);
    }
  }
  async function runAutoFix() {
    if (!page) return;
    if (!confirm("Auto-fix SEO will overwrite focus keyword, SEO title/description, OG fields — and may rewrite the body if it's thin or under-linked. Continue?")) return;
    setAiBusy("autofix");
    setMsg(null);
    setErr(null);
    setPreview(null);
    try {
      const r = await autoFixSeo({
        data: {
          id: page.id
        }
      });
      if (r.ok) {
        setPage({
          ...page,
          ...r.page
        });
        setOriginal({
          ...page,
          ...r.page
        });
        setMsg(`Auto-fix saved. Updated: ${r.changed.join(", ")}.`);
        onSaved();
      } else setErr(r.error);
    } finally {
      setAiBusy(null);
    }
  }
  const [customPresets, setCustomPresets] = React.useState([]);
  const [presetMgrOpen, setPresetMgrOpen] = React.useState(false);
  const [editingPreset, setEditingPreset] = React.useState({
    label: "",
    prompt: ""
  });
  const loadPresets = React.useCallback(async () => {
    try {
      const r = await listSectionPresets();
      setCustomPresets(r.rows);
    } catch {
    }
  }, []);
  React.useEffect(() => {
    void loadPresets();
  }, [loadPresets]);
  async function runCustomPreset(presetId) {
    if (!page) return;
    setAiBusy("section");
    setMsg(null);
    setErr(null);
    setPreview(null);
    try {
      const r = await generateCustomSection({
        data: {
          id: page.id,
          preset_id: presetId
        }
      });
      if (r.ok) setPreview({
        kind: "section",
        markdown: r.markdown,
        label: r.label
      });
      else setErr(r.error);
    } finally {
      setAiBusy(null);
    }
  }
  async function savePreset() {
    if (!editingPreset.label.trim() || editingPreset.prompt.trim().length < 5) {
      setErr("Label and prompt are required (prompt at least 5 chars).");
      return;
    }
    const r = await saveSectionPreset({
      data: {
        id: editingPreset.id,
        label: editingPreset.label.trim(),
        prompt: editingPreset.prompt.trim(),
        sort_order: 0
      }
    });
    if (r.ok) {
      setEditingPreset({
        label: "",
        prompt: ""
      });
      await loadPresets();
    } else setErr(r.error);
  }
  async function removePreset(id2) {
    if (!confirm("Delete this custom prompt?")) return;
    const r = await deleteSectionPreset({
      data: {
        id: id2
      }
    });
    if (r.ok) await loadPresets();
    else setErr(r.error);
  }
  function acceptPreview() {
    if (!page || !preview) return;
    if (preview.kind === "body") {
      setPage({
        ...page,
        body_markdown: preview.markdown
      });
    } else if (preview.kind === "section") {
      const next = aiAppend ? `${(page.body_markdown ?? "").trimEnd()}

${preview.markdown}
` : preview.markdown;
      setPage({
        ...page,
        body_markdown: next
      });
    } else if (preview.kind === "meta") {
      setPage({
        ...page,
        seo_title: preview.seo_title,
        seo_description: preview.seo_description,
        og_title: preview.og_title,
        og_description: preview.og_description
      });
    }
    setPreview(null);
    setMsg("Applied. Press ⌘S to save.");
  }
  const score = React.useMemo(() => {
    if (!page) return null;
    const body = page.body_markdown ?? "";
    const wordCount = body.split(/\s+/).filter(Boolean).length;
    const titleLen = (page.seo_title ?? "").length;
    const descLen = (page.seo_description ?? "").length;
    const fk = (page.focus_keyword ?? "").trim().toLowerCase();
    const hasH1 = !!(page.title && page.title.trim());
    const internalLinks = (body.match(/\]\(\/[^)]+\)/g) ?? []).length;
    const fkInTitle = !!fk && (page.seo_title ?? "").toLowerCase().includes(fk);
    const fkInDesc = !!fk && (page.seo_description ?? "").toLowerCase().includes(fk);
    const fkInBody = !!fk && body.slice(0, 800).toLowerCase().includes(fk);
    return {
      wordCount,
      titleLen,
      descLen,
      fk,
      hasH1,
      internalLinks,
      fkInTitle,
      fkInDesc,
      fkInBody
    };
  }, [page]);
  function ScoreRow({
    ok,
    warn,
    label
  }) {
    const cls = ok ? "text-green-600" : warn ? "text-amber-600" : "text-red-600";
    const icon = ok ? "✓" : warn ? "⚠" : "✗";
    return /* @__PURE__ */ jsxs("div", { className: `flex items-start gap-1.5 text-xs ${cls}`, children: [
      /* @__PURE__ */ jsx("span", { className: "font-bold", children: icon }),
      /* @__PURE__ */ jsx("span", { children: label })
    ] });
  }
  const dirty = !!(page && original && (page.title !== original.title || page.seo_title !== original.seo_title || page.seo_description !== original.seo_description || page.og_title !== original.og_title || page.og_description !== original.og_description || page.focus_keyword !== original.focus_keyword || page.canonical_override !== original.canonical_override || page.hero_image_url !== original.hero_image_url || page.body_markdown !== original.body_markdown || page.status !== original.status));
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4", onClick: () => {
    if (!dirty || confirm("Discard unsaved changes?")) onClose();
  }, children: /* @__PURE__ */ jsxs("div", { className: "flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-border bg-background shadow-xl", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-border px-5 py-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h2", { className: "flex items-center gap-2 text-lg font-semibold", children: [
          "Edit page",
          dirty && /* @__PURE__ */ jsx("span", { className: "rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-700 dark:text-amber-300", children: "unsaved" })
        ] }),
        page && /* @__PURE__ */ jsx("p", { className: "font-mono text-xs text-muted-foreground", children: page.url_path })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        page?.url_path && /* @__PURE__ */ jsx("a", { href: page.url_path, target: "_blank", rel: "noreferrer", className: "rounded border border-border px-3 py-1 text-xs hover:bg-muted", children: "Open page ↗" }),
        /* @__PURE__ */ jsx("button", { onClick: () => {
          if (!dirty || confirm("Discard unsaved changes?")) onClose();
        }, className: "rounded border border-border px-3 py-1 text-xs hover:bg-muted", children: "Close (esc)" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto px-5 py-4", children: [
      loading && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Loading…" }),
      err && /* @__PURE__ */ jsx("div", { className: "mb-3 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300", children: err }),
      msg && /* @__PURE__ */ jsx("div", { className: "mb-3 rounded border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-300", children: msg }),
      page && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-5 lg:grid-cols-[1fr_240px]", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-2", children: [
            /* @__PURE__ */ jsx(Field, { label: "Title (H1)", value: page.title || "", onChange: (v) => setPage({
              ...page,
              title: v
            }) }),
            /* @__PURE__ */ jsxs("label", { className: "text-sm", children: [
              /* @__PURE__ */ jsx("span", { className: "mb-1 block font-medium", children: "Status" }),
              /* @__PURE__ */ jsxs("select", { value: page.status, onChange: (e) => setPage({
                ...page,
                status: e.target.value
              }), className: "w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm", children: [
                /* @__PURE__ */ jsx("option", { value: "draft", children: "draft" }),
                /* @__PURE__ */ jsx("option", { value: "pending", children: "pending" }),
                /* @__PURE__ */ jsx("option", { value: "published", children: "published" })
              ] })
            ] }),
            /* @__PURE__ */ jsx(Field, { label: `SEO title (${(page.seo_title || "").length}/60)`, value: page.seo_title || "", onChange: (v) => setPage({
              ...page,
              seo_title: v
            }) }),
            /* @__PURE__ */ jsx(Field, { label: `SEO description (${(page.seo_description || "").length}/155)`, value: page.seo_description || "", onChange: (v) => setPage({
              ...page,
              seo_description: v
            }) }),
            /* @__PURE__ */ jsx(Field, { label: "OG title", value: page.og_title || "", onChange: (v) => setPage({
              ...page,
              og_title: v
            }), placeholder: "Falls back to SEO title" }),
            /* @__PURE__ */ jsx(Field, { label: "OG description", value: page.og_description || "", onChange: (v) => setPage({
              ...page,
              og_description: v
            }), placeholder: "Falls back to SEO description" }),
            /* @__PURE__ */ jsx(Field, { label: "Hero / OG image URL", value: page.hero_image_url || "", onChange: (v) => setPage({
              ...page,
              hero_image_url: v
            }), placeholder: "https://…/image.jpg" }),
            /* @__PURE__ */ jsx(Field, { label: "Focus keyword", value: page.focus_keyword || "", onChange: (v) => setPage({
              ...page,
              focus_keyword: v
            }), placeholder: "e.g. pool rental Los Angeles" }),
            /* @__PURE__ */ jsx("div", { className: "md:col-span-2", children: /* @__PURE__ */ jsx(Field, { label: "Canonical URL override (rare)", value: page.canonical_override || "", onChange: (v) => setPage({
              ...page,
              canonical_override: v
            }), placeholder: "Leave empty unless this page should canonical to a different URL" }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-primary/40 bg-primary/5 p-3", children: [
            /* @__PURE__ */ jsx("div", { className: "mb-2 text-sm font-semibold", children: "AI tools" }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
              /* @__PURE__ */ jsx("button", { disabled: !!aiBusy, onClick: runFullPage, className: "rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50", children: aiBusy === "full" ? "Generating…" : "✨ Generate full page" }),
              /* @__PURE__ */ jsx("button", { disabled: !!aiBusy, onClick: runImprove, className: "rounded border border-primary px-3 py-1.5 text-xs font-semibold text-primary disabled:opacity-50", children: aiBusy === "improve" ? "Improving…" : "🪄 Improve this page" }),
              /* @__PURE__ */ jsx("button", { disabled: !!aiBusy, onClick: runMeta, className: "rounded border border-primary px-3 py-1.5 text-xs font-semibold text-primary disabled:opacity-50", children: aiBusy === "meta" ? "Generating…" : "🏷️ Generate SEO meta" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 text-[11px] text-muted-foreground", children: "Each shows a side-by-side diff before changing your page." })
          ] }),
          preview && page && /* @__PURE__ */ jsx(DiffPreview, { preview, currentBody: page.body_markdown || "", onAccept: acceptPreview, onReject: () => setPreview(null) }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card p-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "mb-2 flex items-center justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: "Add a section with AI" }),
              /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1 text-xs text-muted-foreground", children: [
                /* @__PURE__ */ jsx("input", { type: "checkbox", checked: aiAppend, onChange: (e) => setAiAppend(e.target.checked) }),
                "Append (uncheck to replace body)"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mb-3 flex flex-wrap gap-1.5", children: [
              SECTION_PRESETS.map((p) => /* @__PURE__ */ jsxs("button", { disabled: !!aiBusy, onClick: () => runSection({
                presetKey: p.key
              }), className: "rounded-full border border-border bg-background px-3 py-1 text-xs hover:border-primary hover:bg-primary/10 disabled:opacity-50", children: [
                "+ ",
                p.label
              ] }, p.key)),
              customPresets.map((cp) => /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/5 pr-1 text-xs", children: [
                /* @__PURE__ */ jsxs("button", { disabled: !!aiBusy, onClick: () => runCustomPreset(cp.id), className: "rounded-l-full px-3 py-1 hover:bg-primary/10 disabled:opacity-50", children: [
                  "★ ",
                  cp.label
                ] }),
                /* @__PURE__ */ jsx("button", { title: "Edit", onClick: () => {
                  setEditingPreset({
                    id: cp.id,
                    label: cp.label,
                    prompt: cp.prompt
                  });
                  setPresetMgrOpen(true);
                }, className: "px-1 text-muted-foreground hover:text-foreground", children: "✎" }),
                /* @__PURE__ */ jsx("button", { title: "Delete", onClick: () => removePreset(cp.id), className: "px-1 text-muted-foreground hover:text-red-600", children: "✕" })
              ] }, cp.id)),
              /* @__PURE__ */ jsxs("button", { onClick: () => {
                setPresetMgrOpen((v) => !v);
                setEditingPreset({
                  label: "",
                  prompt: ""
                });
              }, className: "rounded-full border border-dashed border-border bg-background px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary", children: [
                "⚙ ",
                presetMgrOpen ? "Close manager" : "Manage prompts"
              ] })
            ] }),
            presetMgrOpen && /* @__PURE__ */ jsxs("div", { className: "mb-3 space-y-2 rounded-md border border-border bg-muted/30 p-2", children: [
              /* @__PURE__ */ jsx("div", { className: "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground", children: editingPreset.id ? "Edit custom prompt" : "New custom prompt" }),
              /* @__PURE__ */ jsx("input", { value: editingPreset.label, onChange: (e) => setEditingPreset({
                ...editingPreset,
                label: e.target.value
              }), placeholder: "Button label (e.g. Local SEO block)", className: "w-full rounded-md border border-border bg-background px-2 py-1 text-xs" }),
              /* @__PURE__ */ jsx("textarea", { value: editingPreset.prompt, onChange: (e) => setEditingPreset({
                ...editingPreset,
                prompt: e.target.value
              }), placeholder: "Prompt sent to AI. e.g. 'Add a section listing 5 local pool-permit rules with citations.'", rows: 3, className: "w-full rounded-md border border-border bg-background px-2 py-1 text-xs" }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
                editingPreset.id && /* @__PURE__ */ jsx("button", { onClick: () => setEditingPreset({
                  label: "",
                  prompt: ""
                }), className: "rounded border border-border px-2 py-1 text-[11px]", children: "Cancel edit" }),
                /* @__PURE__ */ jsx("button", { onClick: savePreset, className: "rounded bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground", children: editingPreset.id ? "Update prompt" : "Save prompt" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("textarea", { value: aiPrompt, onChange: (e) => setAiPrompt(e.target.value), placeholder: "Or write a one-off prompt. e.g. Add an FAQ about pool rental insurance in this city.", rows: 3, className: "w-full rounded-md border border-border bg-background px-3 py-2 text-sm" }),
            /* @__PURE__ */ jsx("div", { className: "mt-2 flex justify-end", children: /* @__PURE__ */ jsx("button", { disabled: !!aiBusy || !aiPrompt.trim(), onClick: () => runSection({
              prompt: aiPrompt.trim()
            }), className: "rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50", children: aiBusy === "section" ? "Generating…" : "Generate & save" }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "mb-1 flex items-center justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: "Body (Markdown)" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
                  (page.body_markdown || "").split(/\s+/).filter(Boolean).length,
                  " words"
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "inline-flex overflow-hidden rounded border border-border text-xs", children: [
                  /* @__PURE__ */ jsx("button", { onClick: () => setBodyView("edit"), className: `px-2 py-0.5 ${bodyView === "edit" ? "bg-muted" : ""}`, children: "Edit" }),
                  /* @__PURE__ */ jsx("button", { onClick: () => setBodyView("preview"), className: `px-2 py-0.5 ${bodyView === "preview" ? "bg-muted" : ""}`, children: "Preview" })
                ] })
              ] })
            ] }),
            bodyView === "edit" ? /* @__PURE__ */ jsx("textarea", { value: page.body_markdown || "", onChange: (e) => setPage({
              ...page,
              body_markdown: e.target.value
            }), rows: 20, className: "w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs" }) : /* @__PURE__ */ jsx("div", { className: "prose prose-sm max-w-none rounded-md border border-border bg-card px-4 py-3 text-sm dark:prose-invert", dangerouslySetInnerHTML: {
              __html: renderMarkdown(page.body_markdown || "")
            } }),
            /* @__PURE__ */ jsxs("span", { className: "mt-1 block text-[11px] text-muted-foreground", children: [
              "Markdown: ",
              /* @__PURE__ */ jsx("code", { children: "##" }),
              " H2, ",
              /* @__PURE__ */ jsx("code", { children: "**bold**" }),
              ", ",
              /* @__PURE__ */ jsx("code", { children: "- item" }),
              ", ",
              /* @__PURE__ */ jsx("code", { children: "[text](/p/slug)" }),
              "."
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("aside", { className: "hidden lg:block", children: /* @__PURE__ */ jsxs("div", { className: "sticky top-0 space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card p-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "mb-2 flex items-center justify-between", children: [
              /* @__PURE__ */ jsx("div", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "SEO score" }),
              /* @__PURE__ */ jsx("button", { disabled: !!aiBusy, onClick: runAutoFix, title: "Use AI to set focus keyword, perfect-length meta, and (if needed) rewrite the body so every check passes.", className: "rounded bg-green-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-green-700 disabled:opacity-50", children: aiBusy === "autofix" ? "Fixing…" : "✨ Auto-fix all" })
            ] }),
            score && /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsx(ScoreRow, { ok: score.titleLen >= 50 && score.titleLen <= 60, warn: score.titleLen >= 40 && score.titleLen < 50, label: `Title length: ${score.titleLen}/60` }),
              /* @__PURE__ */ jsx(ScoreRow, { ok: score.descLen >= 140 && score.descLen <= 155, warn: score.descLen >= 120 && score.descLen < 140, label: `Description: ${score.descLen}/155` }),
              /* @__PURE__ */ jsx(ScoreRow, { ok: score.hasH1, label: "H1 present" }),
              /* @__PURE__ */ jsx(ScoreRow, { ok: score.wordCount >= 800, warn: score.wordCount >= 400 && score.wordCount < 800, label: `Word count: ${score.wordCount}` }),
              /* @__PURE__ */ jsx(ScoreRow, { ok: score.internalLinks >= 3, warn: score.internalLinks >= 1 && score.internalLinks < 3, label: `Internal links: ${score.internalLinks}` }),
              score.fk ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(ScoreRow, { ok: score.fkInTitle, label: "Keyword in SEO title" }),
                /* @__PURE__ */ jsx(ScoreRow, { ok: score.fkInDesc, label: "Keyword in description" }),
                /* @__PURE__ */ jsx(ScoreRow, { ok: score.fkInBody, label: "Keyword in first 800 chars" })
              ] }) : /* @__PURE__ */ jsx(ScoreRow, { ok: false, warn: true, label: "No focus keyword set" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              "Last edited: ",
              new Date(page.updated_at).toLocaleDateString()
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              "Created: ",
              new Date(page.created_at).toLocaleDateString()
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-2 break-all font-mono text-[10px]", children: page.url_path })
          ] })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3", children: [
      /* @__PURE__ */ jsx("span", { className: "mr-auto text-[11px] text-muted-foreground", children: "⌘S to save · esc to close" }),
      /* @__PURE__ */ jsx("button", { onClick: () => {
        if (!dirty || confirm("Discard unsaved changes?")) onClose();
      }, className: "rounded border border-border px-4 py-1.5 text-sm", children: "Cancel" }),
      /* @__PURE__ */ jsx("button", { disabled: saving || !page || !dirty, onClick: save, className: "rounded bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50", children: saving ? "Saving…" : "Save changes" })
    ] })
  ] }) });
}
function Field({
  label,
  value,
  onChange,
  placeholder
}) {
  return /* @__PURE__ */ jsxs("label", { className: "text-sm", children: [
    /* @__PURE__ */ jsx("span", { className: "mb-1 block font-medium", children: label }),
    /* @__PURE__ */ jsx("input", { value, onChange: (e) => onChange(e.target.value), placeholder, className: "w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm" })
  ] });
}
function DiffPreview({
  preview,
  currentBody,
  onAccept,
  onReject
}) {
  const heading = preview.kind === "meta" ? "SEO metadata" : preview.kind === "body" ? preview.label : `Section — ${preview.label}`;
  return /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-amber-500/50 bg-amber-50 p-3 dark:bg-amber-950/30", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-2 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("span", { className: "text-sm font-semibold", children: [
        "Preview: ",
        heading
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx("button", { onClick: onAccept, className: "rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700", children: "Accept" }),
        /* @__PURE__ */ jsx("button", { onClick: onReject, className: "rounded border border-border bg-background px-3 py-1 text-xs hover:bg-muted", children: "Reject" })
      ] })
    ] }),
    preview.kind === "meta" ? /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-2 text-xs md:grid-cols-2", children: [
      /* @__PURE__ */ jsx(DiffField, { label: "SEO title", before: preview.before.seo_title, after: preview.seo_title }),
      /* @__PURE__ */ jsx(DiffField, { label: "SEO description", before: preview.before.seo_description, after: preview.seo_description }),
      /* @__PURE__ */ jsx(DiffField, { label: "OG title", before: preview.before.og_title, after: preview.og_title }),
      /* @__PURE__ */ jsx(DiffField, { label: "OG description", before: preview.before.og_description, after: preview.og_description })
    ] }) : preview.kind === "body" ? /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-2 md:grid-cols-2", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-1 text-[10px] font-semibold uppercase text-muted-foreground", children: [
          "Current (",
          preview.before.split(/\s+/).filter(Boolean).length,
          "w)"
        ] }),
        /* @__PURE__ */ jsx("pre", { className: "max-h-72 overflow-auto whitespace-pre-wrap rounded bg-background p-2 font-mono text-[11px]", children: preview.before || "(empty)" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-1 text-[10px] font-semibold uppercase text-muted-foreground", children: [
          "Proposed (",
          preview.markdown.split(/\s+/).filter(Boolean).length,
          "w)"
        ] }),
        /* @__PURE__ */ jsx("pre", { className: "max-h-72 overflow-auto whitespace-pre-wrap rounded bg-background p-2 font-mono text-[11px]", children: preview.markdown })
      ] })
    ] }) : /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-1 text-[10px] font-semibold uppercase text-muted-foreground", children: [
        "New section to append (current body: ",
        currentBody.split(/\s+/).filter(Boolean).length,
        "w)"
      ] }),
      /* @__PURE__ */ jsx("pre", { className: "max-h-72 overflow-auto whitespace-pre-wrap rounded bg-background p-2 font-mono text-[11px]", children: preview.markdown })
    ] })
  ] });
}
function DiffField({
  label,
  before,
  after
}) {
  const changed = before !== after;
  return /* @__PURE__ */ jsxs("div", { className: `rounded border p-2 ${changed ? "border-amber-400/60" : "border-border"}`, children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-1 text-[10px] font-semibold uppercase text-muted-foreground", children: [
      label,
      " ",
      changed && /* @__PURE__ */ jsx("span", { className: "text-amber-600", children: "(changed)" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx("div", { className: "rounded bg-red-500/10 px-1.5 py-1 text-[11px] line-through opacity-80", children: before || /* @__PURE__ */ jsx("span", { className: "opacity-50", children: "(empty)" }) }),
      /* @__PURE__ */ jsx("div", { className: "rounded bg-green-500/10 px-1.5 py-1 text-[11px]", children: after || /* @__PURE__ */ jsx("span", { className: "opacity-50", children: "(empty)" }) })
    ] })
  ] });
}
function renderMarkdown(src) {
  const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = src.split(/\r?\n/);
  let html = "";
  let inList = false;
  let inPara = false;
  const close = () => {
    if (inList) {
      html += "</ul>";
      inList = false;
    }
    if (inPara) {
      html += "</p>";
      inPara = false;
    }
  };
  const inline = (s) => escape(s).replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline">$1</a>').replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\*([^*]+)\*/g, "<em>$1</em>").replace(/`([^`]+)`/g, "<code>$1</code>");
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      close();
      continue;
    }
    let m;
    if (m = line.match(/^######\s+(.*)$/)) {
      close();
      html += `<h6>${inline(m[1])}</h6>`;
    } else if (m = line.match(/^#####\s+(.*)$/)) {
      close();
      html += `<h5>${inline(m[1])}</h5>`;
    } else if (m = line.match(/^####\s+(.*)$/)) {
      close();
      html += `<h4>${inline(m[1])}</h4>`;
    } else if (m = line.match(/^###\s+(.*)$/)) {
      close();
      html += `<h3>${inline(m[1])}</h3>`;
    } else if (m = line.match(/^##\s+(.*)$/)) {
      close();
      html += `<h2>${inline(m[1])}</h2>`;
    } else if (m = line.match(/^#\s+(.*)$/)) {
      close();
      html += `<h1>${inline(m[1])}</h1>`;
    } else if (m = line.match(/^[-*]\s+(.*)$/)) {
      if (inPara) {
        html += "</p>";
        inPara = false;
      }
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      html += `<li>${inline(m[1])}</li>`;
    } else {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      if (!inPara) {
        html += "<p>";
        inPara = true;
      } else html += " ";
      html += inline(line);
    }
  }
  close();
  return html;
}
export {
  BulkEditor as component
};
