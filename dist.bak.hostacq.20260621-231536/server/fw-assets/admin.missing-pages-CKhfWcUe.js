import { jsxs, jsx } from "react/jsx-runtime";
import * as React from "react";
import { b1 as list404s, b2 as createPageFor404, b3 as redirect404, b4 as resolve404 } from "./router-OI82CwOi.js";
import { A as AdminLayout } from "./admin-layout-7nNRKAex.js";
import "@tanstack/react-router";
import "@tanstack/react-query";
import "./site-footer-defaults-C7gHxS5b.js";
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
import "lucide-react";
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
function AdminMissingPages() {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [unresolvedOnly, setUnresolvedOnly] = React.useState(true);
  const [pPathsOnly, setPPathsOnly] = React.useState(true);
  const [error, setError] = React.useState(null);
  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await list404s({
        data: {
          unresolvedOnly,
          pPathsOnly,
          limit: 200
        }
      });
      setRows(res.rows);
    } catch (e) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [unresolvedOnly, pPathsOnly]);
  React.useEffect(() => {
    void load();
  }, [load]);
  const [busyId, setBusyId] = React.useState(null);
  const [selected, setSelected] = React.useState(/* @__PURE__ */ new Set());
  const [bulkRunning, setBulkRunning] = React.useState(false);
  const [bulkProgress, setBulkProgress] = React.useState(null);
  const openRows = React.useMemo(() => rows.filter((r) => !r.resolved_at), [rows]);
  const allSelected = openRows.length > 0 && openRows.every((r) => selected.has(r.id));
  const toggleOne = (id) => setSelected((s) => {
    const next = new Set(s);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  const toggleAll = () => setSelected(allSelected ? /* @__PURE__ */ new Set() : new Set(openRows.map((r) => r.id)));
  const dismiss = async (id) => {
    if (!confirm("Dismiss this 404? It just hides the row — the URL will still 404 for visitors.")) return;
    setBusyId(id);
    try {
      await resolve404({
        data: {
          id,
          notes: "dismissed by admin"
        }
      });
      await load();
    } finally {
      setBusyId(null);
    }
  };
  const doRedirect = async (id, currentPath) => {
    const target = prompt(`Redirect ${currentPath} to which path? (e.g. /p/hosting)`, "/p/all-locations");
    if (!target) return;
    setBusyId(id);
    try {
      const r = await redirect404({
        data: {
          id,
          target
        }
      });
      if (!r.ok) alert(r.error || "Redirect failed");
      else alert(`Redirect saved: ${currentPath} → ${r.target}`);
      await load();
    } finally {
      setBusyId(null);
    }
  };
  const doCreate = async (id, currentPath) => {
    if (!confirm(`Generate a real page at ${currentPath} with AI? This takes ~30s and will publish to the live site.`)) return;
    setBusyId(id);
    try {
      const r = await createPageFor404({
        data: {
          id
        }
      });
      if (!r.ok) alert(r.error || "Create failed");
      else if (r.alreadyExists) alert("A page already exists at that URL — marked resolved.");
      else alert(`Created /p/${r.slug} (${r.words} words). It's live now.`);
      await load();
    } finally {
      setBusyId(null);
    }
  };
  const bulkCreate = async () => {
    const ids = openRows.filter((r) => selected.has(r.id));
    if (ids.length === 0) return;
    if (!confirm(`Generate ${ids.length} pages with AI sequentially? Roughly ~30s each. They will publish live as they finish.`)) return;
    setBulkRunning(true);
    let ok = 0, skipped = 0, failed = 0;
    for (let i = 0; i < ids.length; i++) {
      const row = ids[i];
      setBulkProgress({
        done: i,
        total: ids.length,
        current: row.url_path
      });
      try {
        const r = await createPageFor404({
          data: {
            id: row.id
          }
        });
        if (!r.ok) failed++;
        else if (r.alreadyExists) skipped++;
        else ok++;
      } catch {
        failed++;
      }
    }
    setBulkProgress(null);
    setBulkRunning(false);
    setSelected(/* @__PURE__ */ new Set());
    alert(`Bulk create finished — ${ok} created, ${skipped} already existed, ${failed} failed.`);
    await load();
  };
  const bulkRedirect = async () => {
    const ids = openRows.filter((r) => selected.has(r.id));
    if (ids.length === 0) return;
    const target = prompt(`Redirect ${ids.length} URLs to which path? (e.g. /p/all-locations)`, "/p/all-locations");
    if (!target) return;
    setBulkRunning(true);
    let ok = 0, failed = 0;
    for (let i = 0; i < ids.length; i++) {
      const row = ids[i];
      setBulkProgress({
        done: i,
        total: ids.length,
        current: row.url_path
      });
      try {
        const r = await redirect404({
          data: {
            id: row.id,
            target
          }
        });
        if (r.ok) ok++;
        else failed++;
      } catch {
        failed++;
      }
    }
    setBulkProgress(null);
    setBulkRunning(false);
    setSelected(/* @__PURE__ */ new Set());
    alert(`Bulk redirect finished — ${ok} saved, ${failed} failed (→ ${target}).`);
    await load();
  };
  const bulkDismiss = async () => {
    const ids = openRows.filter((r) => selected.has(r.id));
    if (ids.length === 0) return;
    if (!confirm(`Dismiss ${ids.length} rows? This only hides them — URLs still 404 for visitors.`)) return;
    setBulkRunning(true);
    for (let i = 0; i < ids.length; i++) {
      const row = ids[i];
      setBulkProgress({
        done: i,
        total: ids.length,
        current: row.url_path
      });
      try {
        await resolve404({
          data: {
            id: row.id,
            notes: "bulk dismissed"
          }
        });
      } catch {
      }
    }
    setBulkProgress(null);
    setBulkRunning(false);
    setSelected(/* @__PURE__ */ new Set());
    await load();
  };
  const totalHits = rows.reduce((acc, r) => acc + (r.hit_count ?? 0), 0);
  const selectedCount = selected.size;
  return /* @__PURE__ */ jsxs(AdminLayout, { children: [
    /* @__PURE__ */ jsxs("header", { className: "flex flex-wrap items-end justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Missing /p/* pages" }),
        /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [
          rows.length,
          " unique URL",
          rows.length === 1 ? "" : "s",
          " ·",
          " ",
          totalHits,
          " total 404 hit",
          totalHits === 1 ? "" : "s"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", checked: unresolvedOnly, onChange: (e) => setUnresolvedOnly(e.target.checked) }),
          "Unresolved only"
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", checked: pPathsOnly, onChange: (e) => setPPathsOnly(e.target.checked) }),
          "/p/* only (buildable)"
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: load, className: "rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted", children: "Refresh" })
      ] })
    ] }),
    error && /* @__PURE__ */ jsx("div", { className: "mt-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive", children: error }),
    (selectedCount > 0 || bulkRunning) && /* @__PURE__ */ jsxs("div", { className: "sticky top-2 z-10 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/5 px-4 py-3 text-sm", children: [
      /* @__PURE__ */ jsx("div", { className: "font-medium", children: bulkRunning && bulkProgress ? `Working ${bulkProgress.done + 1} / ${bulkProgress.total} — ${bulkProgress.current}` : `${selectedCount} selected` }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsxs("button", { onClick: bulkCreate, disabled: bulkRunning || selectedCount === 0, className: "rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50", children: [
          "✨ Create ",
          selectedCount,
          " page",
          selectedCount === 1 ? "" : "s"
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: bulkRedirect, disabled: bulkRunning || selectedCount === 0, className: "rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-50", children: [
          "↪ Redirect ",
          selectedCount,
          " to…"
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: bulkDismiss, disabled: bulkRunning || selectedCount === 0, className: "rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted disabled:opacity-50", children: [
          "Dismiss ",
          selectedCount
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => setSelected(/* @__PURE__ */ new Set()), disabled: bulkRunning, className: "rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted disabled:opacity-50", children: "Clear" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-6 overflow-x-auto rounded-2xl border border-border", children: /* @__PURE__ */ jsxs("table", { className: "min-w-full divide-y divide-border text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "px-3 py-3 w-8", children: /* @__PURE__ */ jsx("input", { type: "checkbox", checked: allSelected, onChange: toggleAll, "aria-label": "Select all open rows", disabled: openRows.length === 0 || bulkRunning }) }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "URL" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Hits" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Last seen" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Referrer" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Status" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right", children: "Actions" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-border bg-background", children: [
        loading && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 7, className: "px-4 py-6 text-center text-muted-foreground", children: "Loading…" }) }),
        !loading && rows.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 7, className: "px-4 py-6 text-center text-muted-foreground", children: "No 404s logged. Nice." }) }),
        !loading && rows.map((r) => /* @__PURE__ */ jsxs("tr", { className: "align-top", children: [
          /* @__PURE__ */ jsx("td", { className: "px-3 py-3", children: !r.resolved_at && /* @__PURE__ */ jsx("input", { type: "checkbox", checked: selected.has(r.id), onChange: () => toggleOne(r.id), disabled: bulkRunning, "aria-label": `Select ${r.url_path}` }) }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-mono text-xs", children: /* @__PURE__ */ jsx("a", { href: r.url_path, target: "_blank", rel: "noreferrer", className: "text-primary underline-offset-2 hover:underline", children: r.url_path }) }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-semibold", children: r.hit_count }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-muted-foreground", children: new Date(r.last_seen_at).toLocaleString() }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-xs text-muted-foreground break-all", children: r.referrer || "—" }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: r.resolved_at ? /* @__PURE__ */ jsx("span", { className: "inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300", children: "Resolved" }) : /* @__PURE__ */ jsx("span", { className: "inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300", children: "Open" }) }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right", children: !r.resolved_at && /* @__PURE__ */ jsxs("div", { className: "inline-flex flex-wrap justify-end gap-1.5", children: [
            /* @__PURE__ */ jsx("button", { onClick: () => doCreate(r.id, r.url_path), disabled: busyId === r.id, className: "rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50", title: "Generate a real page with AI and publish it", children: "✨ Create page" }),
            /* @__PURE__ */ jsx("button", { onClick: () => doRedirect(r.id, r.url_path), disabled: busyId === r.id, className: "rounded-full border border-border px-3 py-1 text-xs font-semibold hover:bg-muted disabled:opacity-50", title: "Send this URL to an existing page (301 redirect)", children: "↪ Redirect" }),
            /* @__PURE__ */ jsx("button", { onClick: () => dismiss(r.id), disabled: busyId === r.id, className: "rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted disabled:opacity-50", title: "Just hide this row — does NOT fix the 404", children: "Dismiss" })
          ] }) })
        ] }, r.id))
      ] })
    ] }) })
  ] });
}
export {
  AdminMissingPages as component
};
