import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import * as React from "react";
import { Link } from "@tanstack/react-router";
import { l as listLinkSuggestions, u as updateLinkSuggestionStatus, a as generateLinkSuggestions, b as applyLinkSuggestionsBulk, c as applyLinkSuggestion } from "./admin-seo-tools.functions-DA1S_pz9.js";
import { A as AdminLayout } from "./admin-layout-D-GLXJwf.js";
import { Loader2, Sparkles, Check, X, ArrowRight, LinkIcon } from "lucide-react";
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
import "./router-B2eXowiP.js";
import "@tanstack/react-query";
import "./site-footer-defaults-C7gHxS5b.js";
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
import "./renter-drip.server-JSvbm2ii.js";
import "node:fs";
import "node:path";
import "./host-drip.server-b0u8F2OF.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
function InternalLinks() {
  const [rows, setRows] = React.useState([]);
  const [status, setStatus] = React.useState("pending");
  const [q, setQ] = React.useState("");
  const [generating, setGenerating] = React.useState(false);
  const [genMsg, setGenMsg] = React.useState(null);
  const [busyIds, setBusyIds] = React.useState(/* @__PURE__ */ new Set());
  const [selected, setSelected] = React.useState(/* @__PURE__ */ new Set());
  const load = React.useCallback(async () => {
    const r = await listLinkSuggestions({
      data: {
        status,
        q,
        limit: 300
      }
    });
    setRows(r.rows);
    setSelected(/* @__PURE__ */ new Set());
  }, [status, q]);
  React.useEffect(() => {
    load();
  }, [load]);
  async function generate() {
    setGenerating(true);
    setGenMsg(null);
    try {
      const r = await generateLinkSuggestions({
        data: {
          sampleSize: 500,
          minScore: 0.18,
          perPage: 5
        }
      });
      setGenMsg(r.ok ? `Generated ${r.count} suggestions` : `Error: ${r.error}`);
      await load();
    } finally {
      setGenerating(false);
    }
  }
  async function apply(id) {
    setBusyIds((s) => new Set(s).add(id));
    try {
      const r = await applyLinkSuggestion({
        data: {
          id
        }
      });
      if (!r.ok) alert(r.error || "Failed");
      await load();
    } finally {
      setBusyIds((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  }
  async function bulkUpdate(newStatus) {
    if (!selected.size) return;
    await updateLinkSuggestionStatus({
      data: {
        ids: Array.from(selected),
        status: newStatus
      }
    });
    await load();
  }
  const [bulkApplying, setBulkApplying] = React.useState(false);
  async function bulkApply(ids) {
    if (!ids.length) return;
    if (!confirm(`Insert ${ids.length} link${ids.length === 1 ? "" : "s"} into the page bodies? This edits content_pages.`)) return;
    setBulkApplying(true);
    try {
      const r = await applyLinkSuggestionsBulk({
        data: {
          ids
        }
      });
      if (!r.ok) alert(r.error || "Bulk apply failed");
      else setGenMsg(`Inserted ${r.applied} new links, ${r.skipped} already linked, ${r.failed} failed (of ${r.total}).`);
      await load();
    } finally {
      setBulkApplying(false);
    }
  }
  function toggleSelect(id) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  const visiblePendingIds = React.useMemo(() => rows.filter((r) => r.status === "pending").map((r) => r.id), [rows]);
  const allVisibleSelected = visiblePendingIds.length > 0 && visiblePendingIds.every((id) => selected.has(id));
  function toggleSelectAllVisible() {
    setSelected((s) => {
      const n = new Set(s);
      if (allVisibleSelected) visiblePendingIds.forEach((id) => n.delete(id));
      else visiblePendingIds.forEach((id) => n.add(id));
      return n;
    });
  }
  return /* @__PURE__ */ jsxs(AdminLayout, { title: "Internal links", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold sm:text-3xl", children: "Internal link recommender" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Finds pages that should link to each other based on topic overlap. One-click apply to add the link to your page body." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold", children: "Generate fresh suggestions" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Analyzes your latest 500 published pages." })
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: generate, disabled: generating, className: "inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50", children: [
          generating ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4" }),
          generating ? "Analyzing…" : "Generate"
        ] })
      ] }),
      genMsg && /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: genMsg })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-col gap-2 sm:flex-row sm:items-center", children: [
      /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5", children: ["pending", "applied", "dismissed", "all"].map((s) => /* @__PURE__ */ jsx("button", { onClick: () => setStatus(s), className: `rounded-full px-3 py-1 text-xs font-semibold ${status === s ? "bg-primary text-primary-foreground" : "bg-secondary"}`, children: s }, s)) }),
      /* @__PURE__ */ jsx("input", { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Filter by URL or anchor…", className: "flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm sm:max-w-sm" })
    ] }),
    visiblePendingIds.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2", children: [
      /* @__PURE__ */ jsxs("label", { className: "inline-flex items-center gap-2 text-xs font-semibold", children: [
        /* @__PURE__ */ jsx("input", { type: "checkbox", checked: allVisibleSelected, onChange: toggleSelectAllVisible, className: "h-4 w-4" }),
        "Select all ",
        visiblePendingIds.length,
        " pending"
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: () => bulkApply(visiblePendingIds), disabled: bulkApplying, className: "ml-auto inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground disabled:opacity-50", children: [
        bulkApplying ? /* @__PURE__ */ jsx(Loader2, { className: "h-3 w-3 animate-spin" }) : /* @__PURE__ */ jsx(Check, { className: "h-3 w-3" }),
        "Apply all ",
        visiblePendingIds.length
      ] })
    ] }),
    selected.size > 0 && /* @__PURE__ */ jsxs("div", { className: "sticky top-12 z-20 mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2 shadow lg:top-28", children: [
      /* @__PURE__ */ jsxs("span", { className: "text-xs font-semibold", children: [
        selected.size,
        " selected"
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: () => bulkUpdate("dismissed"), className: "ml-auto inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-semibold", children: [
        /* @__PURE__ */ jsx(X, { className: "h-3 w-3" }),
        " Dismiss"
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: () => bulkApply(Array.from(selected)), disabled: bulkApplying, className: "inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground disabled:opacity-50", children: [
        bulkApplying ? /* @__PURE__ */ jsx(Loader2, { className: "h-3 w-3 animate-spin" }) : /* @__PURE__ */ jsx(Check, { className: "h-3 w-3" }),
        "Apply ",
        selected.size
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-3 space-y-2", children: [
      rows.length === 0 && /* @__PURE__ */ jsx("p", { className: "rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground", children: 'No suggestions. Click "Generate" to create some.' }),
      rows.map((r) => /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-border bg-card p-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
        /* @__PURE__ */ jsx("input", { type: "checkbox", checked: selected.has(r.id), onChange: () => toggleSelect(r.id), className: "mt-1 h-4 w-4 shrink-0" }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-1.5 text-xs", children: [
            /* @__PURE__ */ jsx(Link, { to: r.from_url, className: "rounded bg-muted px-1.5 py-0.5 font-mono hover:underline", children: r.from_url }),
            /* @__PURE__ */ jsx(ArrowRight, { className: "h-3 w-3 text-muted-foreground" }),
            /* @__PURE__ */ jsx(Link, { to: r.to_url, className: "rounded bg-muted px-1.5 py-0.5 font-mono hover:underline", children: r.to_url }),
            /* @__PURE__ */ jsxs("span", { className: "ml-auto rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary", children: [
              (r.score * 100).toFixed(0),
              "%"
            ] })
          ] }),
          r.anchor_text && /* @__PURE__ */ jsxs("p", { className: "mt-1.5 text-sm", children: [
            /* @__PURE__ */ jsx(LinkIcon, { className: "mr-1 inline h-3 w-3 text-muted-foreground" }),
            "Anchor: ",
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: r.anchor_text })
          ] }),
          r.reason && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: r.reason })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex shrink-0 flex-col gap-1.5 sm:flex-row", children: [
          r.status === "pending" && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("button", { onClick: () => apply(r.id), disabled: busyIds.has(r.id), className: "inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground disabled:opacity-50", children: [
              busyIds.has(r.id) ? /* @__PURE__ */ jsx(Loader2, { className: "h-3 w-3 animate-spin" }) : /* @__PURE__ */ jsx(Check, { className: "h-3 w-3" }),
              "Apply"
            ] }),
            /* @__PURE__ */ jsx("button", { onClick: () => updateLinkSuggestionStatus({
              data: {
                ids: [r.id],
                status: "dismissed"
              }
            }).then(load), className: "inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-semibold", children: /* @__PURE__ */ jsx(X, { className: "h-3 w-3" }) })
          ] }),
          r.status !== "pending" && /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-semibold ${r.status === "applied" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`, children: r.status })
        ] })
      ] }) }, r.id))
    ] })
  ] });
}
export {
  InternalLinks as component
};
