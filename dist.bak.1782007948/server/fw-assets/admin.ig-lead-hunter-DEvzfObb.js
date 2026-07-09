import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import * as React from "react";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { c as createServerFn } from "../server.js";
import { A as AdminLayout } from "./admin-layout-DvQlFbdd.js";
import { Instagram, Loader2, RefreshCw, Search, CheckSquare, Square, ExternalLink, Trash2 } from "lucide-react";
import "./client.server-D5ro3rAQ.js";
import "@supabase/supabase-js";
import "./createMiddleware-BvN2ghIY.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router";
import "@tanstack/react-router/ssr/server";
import "./router-Bk6RtsuF.js";
import "@tanstack/react-query";
import "./site-footer-defaults-C7gHxS5b.js";
import "./states-UIdvqlKs.js";
import "./site-origin-DK0yY0Ip.js";
import "./city-slug-Bqls2qOy.js";
import "@tanstack/zod-adapter";
import "./client-Dh5RMKgP.js";
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
import "./renter-drip.server-DkMf2kRj.js";
import "./emailit-DRsipvVx.js";
import "node:fs";
import "node:path";
import "./host-drip.server-Dv1yKbNa.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
const listIgLeads = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  filter: z.enum(["all", "new", "contacted"]).default("new"),
  limit: z.number().min(1).max(500).default(200)
}).parse(d ?? {})).handler(createSsrRpc("1e7a8b6ad873de2e4e1c36c76f0deaa1c924de555f202c68099381143f88de11"));
const runIgLeadHuntNow = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("a110cb2a99bbf25540f65a06642e788891c65352a0468f5475d618412c555405"));
const setIgLeadContacted = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  contacted: z.boolean()
}).parse(d)).handler(createSsrRpc("2af8b5443ded64125d23f482856644fd7759202783056f09d0f988c028dc90d8"));
const bulkSetIgLeadsContacted = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  ids: z.array(z.string().uuid()).min(1).max(500),
  contacted: z.boolean()
}).parse(d)).handler(createSsrRpc("d0e07d87bbfda18d86aa02b648650c53fc62eb085c836a164d7e8763c893bcb1"));
const updateIgLeadNotes = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  notes: z.string().max(2e3)
}).parse(d)).handler(createSsrRpc("28ce74133d9ad1cbf62f8cae49e9aaf6c31b9917e6ee532e49d7a48e99c328fe"));
const deleteIgLead = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(createSsrRpc("00537e5b134af5e7b1d1f0d9511711a195b97a22988758852916f731777d13ca"));
function IgLeadHunter() {
  const [rows, setRows] = React.useState([]);
  const [filter, setFilter] = React.useState("new");
  const [loading, setLoading] = React.useState(true);
  const [running, setRunning] = React.useState(false);
  const [msg, setMsg] = React.useState(null);
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState(/* @__PURE__ */ new Set());
  const [bulking, setBulking] = React.useState(false);
  async function load() {
    setLoading(true);
    try {
      const r = await listIgLeads({
        data: {
          filter,
          limit: 300
        }
      });
      if (r.ok) setRows(r.rows);
      else setMsg(r.error || "Failed to load");
    } finally {
      setLoading(false);
    }
  }
  React.useEffect(() => {
    load();
  }, [filter]);
  async function runHunt() {
    setRunning(true);
    setMsg(null);
    try {
      const r = await runIgLeadHuntNow();
      setMsg(`Scanned ${r.results_seen} results, added ${r.inserted} new leads, refreshed ${r.refreshed}.`);
      await load();
    } catch (e) {
      setMsg(`Failed: ${e?.message || "unknown"}`);
    } finally {
      setRunning(false);
    }
  }
  async function toggle(row) {
    const next = !row.contacted;
    setRows((r) => r.map((x) => x.id === row.id ? {
      ...x,
      contacted: next
    } : x));
    await setIgLeadContacted({
      data: {
        id: row.id,
        contacted: next
      }
    });
    if (filter !== "all") load();
  }
  async function remove(row) {
    if (!confirm(`Delete @${row.profile_handle}?`)) return;
    await deleteIgLead({
      data: {
        id: row.id
      }
    });
    setRows((r) => r.filter((x) => x.id !== row.id));
  }
  async function saveNotes(row, notes) {
    setRows((r) => r.map((x) => x.id === row.id ? {
      ...x,
      notes
    } : x));
    await updateIgLeadNotes({
      data: {
        id: row.id,
        notes
      }
    });
  }
  const filtered = search.trim() ? rows.filter((r) => (r.profile_handle || "").toLowerCase().includes(search.toLowerCase()) || (r.profile_name || "").toLowerCase().includes(search.toLowerCase()) || (r.snippet || "").toLowerCase().includes(search.toLowerCase())) : rows;
  const totalNew = rows.filter((r) => !r.contacted).length;
  const visibleIds = filtered.map((r) => r.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  visibleIds.some((id) => selected.has(id));
  function toggleSelect(id) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  function toggleSelectAllVisible() {
    setSelected((s) => {
      const n = new Set(s);
      if (allVisibleSelected) visibleIds.forEach((id) => n.delete(id));
      else visibleIds.forEach((id) => n.add(id));
      return n;
    });
  }
  function clearSelection() {
    setSelected(/* @__PURE__ */ new Set());
  }
  async function bulkMark(contacted) {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBulking(true);
    setMsg(null);
    try {
      const r = await bulkSetIgLeadsContacted({
        data: {
          ids,
          contacted
        }
      });
      if (r.ok) {
        const nowIso = (/* @__PURE__ */ new Date()).toISOString();
        setRows((rs) => rs.map((x) => ids.includes(x.id) ? {
          ...x,
          contacted,
          contacted_at: contacted ? nowIso : null
        } : x));
        setMsg(`Marked ${r.updated} lead${r.updated === 1 ? "" : "s"} as ${contacted ? "contacted" : "not contacted"}.`);
        clearSelection();
        if (filter !== "all") load();
      } else {
        setMsg(r.error || "Bulk update failed");
      }
    } finally {
      setBulking(false);
    }
  }
  return /* @__PURE__ */ jsx(AdminLayout, { children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl space-y-6 p-6", children: [
    /* @__PURE__ */ jsxs("header", { className: "flex flex-wrap items-end justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "flex items-center gap-2 text-2xl font-semibold", children: [
          /* @__PURE__ */ jsx(Instagram, { className: "h-6 w-6" }),
          " IG Lead Hunter"
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [
          "Daily Google search across ",
          /* @__PURE__ */ jsx("code", { children: "site:instagram.com" }),
          " for pool-rental keywords. Click each profile to DM the owner."
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxs("button", { onClick: runHunt, disabled: running, className: "inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60", children: [
        running ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "h-4 w-4" }),
        "Run hunt now"
      ] }) })
    ] }),
    msg && /* @__PURE__ */ jsx("div", { className: "rounded-md border bg-muted/50 px-3 py-2 text-sm", children: msg }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
      /* @__PURE__ */ jsx("div", { className: "inline-flex rounded-md border p-1", children: ["new", "contacted", "all"].map((f) => /* @__PURE__ */ jsxs("button", { onClick: () => setFilter(f), className: `rounded px-3 py-1 text-sm capitalize ${filter === f ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`, children: [
        f,
        f === "new" ? ` (${totalNew})` : ""
      ] }, f)) }),
      /* @__PURE__ */ jsxs("div", { className: "relative ml-auto", children: [
        /* @__PURE__ */ jsx(Search, { className: "pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
        /* @__PURE__ */ jsx("input", { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Filter by handle, name, snippet…", className: "w-72 rounded-md border bg-background py-2 pl-8 pr-3 text-sm" })
      ] })
    ] }),
    loading ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
      " Loading leads…"
    ] }) : filtered.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground", children: [
      "No leads ",
      filter !== "all" ? `in "${filter}"` : "",
      ". Click ",
      /* @__PURE__ */ jsx("strong", { children: "Run hunt now" }),
      " to fetch fresh results from Google."
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3 rounded-md border bg-muted/30 px-3 py-2 text-sm", children: [
        /* @__PURE__ */ jsxs("button", { onClick: toggleSelectAllVisible, className: "inline-flex items-center gap-2 hover:text-primary", title: allVisibleSelected ? "Deselect all visible" : "Select all visible", children: [
          allVisibleSelected ? /* @__PURE__ */ jsx(CheckSquare, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(Square, { className: "h-4 w-4" }),
          allVisibleSelected ? "Deselect all" : "Select all",
          " (",
          filtered.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
          selected.size,
          " selected"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "ml-auto flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("button", { onClick: () => bulkMark(true), disabled: selected.size === 0 || bulking, className: "inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50", children: [
            bulking ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(CheckSquare, { className: "h-4 w-4" }),
            "Mark contacted"
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: () => bulkMark(false), disabled: selected.size === 0 || bulking, className: "rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50", children: "Mark not contacted" }),
          selected.size > 0 && /* @__PURE__ */ jsx("button", { onClick: clearSelection, className: "text-xs text-muted-foreground hover:underline", children: "Clear" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("ul", { className: "divide-y rounded-md border", children: filtered.map((row) => /* @__PURE__ */ jsxs("li", { className: `flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-4 ${selected.has(row.id) ? "bg-primary/5" : ""}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "flex shrink-0 items-center gap-3 pt-1", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", checked: selected.has(row.id), onChange: () => toggleSelect(row.id), className: "h-4 w-4 cursor-pointer accent-primary", title: "Select for bulk action" }),
          /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1 text-xs text-muted-foreground", title: "Contacted", children: [
            /* @__PURE__ */ jsx("input", { type: "checkbox", checked: row.contacted, onChange: () => toggle(row), className: "h-4 w-4 cursor-pointer accent-primary" }),
            /* @__PURE__ */ jsx("span", { className: "sm:hidden", children: "Contacted" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-baseline gap-x-2 gap-y-1", children: [
            /* @__PURE__ */ jsxs("a", { href: row.source_url || row.instagram_url, target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center gap-1 font-medium text-primary hover:underline", title: row.source_url ? "Open the exact post" : "Open the profile", children: [
              "@",
              row.profile_handle,
              row.source_url && /\/(p|reel|reels|tv)\//.test(row.source_url) && /* @__PURE__ */ jsx("span", { className: "rounded bg-primary/10 px-1 text-[10px] font-semibold uppercase tracking-wide text-primary", children: "post" }),
              /* @__PURE__ */ jsx(ExternalLink, { className: "h-3 w-3" })
            ] }),
            row.source_url && row.source_url !== row.instagram_url && /* @__PURE__ */ jsx("a", { href: row.instagram_url, target: "_blank", rel: "noopener noreferrer", className: "text-xs text-muted-foreground hover:underline", children: "profile" }),
            row.profile_name && row.profile_name !== row.profile_handle && /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: row.profile_name }),
            row.contacted && row.contacted_at && /* @__PURE__ */ jsxs("span", { className: "ml-auto text-xs text-muted-foreground", children: [
              "Contacted ",
              new Date(row.contacted_at).toLocaleDateString()
            ] })
          ] }),
          row.snippet && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground line-clamp-3", children: row.snippet }),
          /* @__PURE__ */ jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground", children: [
            row.query && /* @__PURE__ */ jsx("span", { className: "rounded bg-muted px-1.5 py-0.5 font-mono", children: row.query }),
            /* @__PURE__ */ jsxs("span", { children: [
              "seen ",
              new Date(row.last_seen_at).toLocaleDateString()
            ] })
          ] }),
          /* @__PURE__ */ jsx("textarea", { defaultValue: row.notes || "", onBlur: (e) => {
            if (e.target.value !== (row.notes || "")) saveNotes(row, e.target.value);
          }, placeholder: "Outreach notes…", className: "mt-2 w-full rounded border bg-background px-2 py-1 text-xs", rows: 1 })
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => remove(row), className: "shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive", title: "Delete lead", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) })
      ] }, row.id)) })
    ] })
  ] }) });
}
export {
  IgLeadHunter as component
};
