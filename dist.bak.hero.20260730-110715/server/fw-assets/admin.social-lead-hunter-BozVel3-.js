import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { c as createServerFn } from "../server.js";
import { A as AdminLayout } from "./admin-layout-Ck0iqDJo.js";
import { Radar, Loader2, RefreshCw, Search, ExternalLink, Trash2 } from "lucide-react";
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
import "./router-BTf4C8qB.js";
import "@tanstack/react-query";
import "./site-footer-defaults-asWdr-hi.js";
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
const SOURCES$1 = ["ig", "fb", "tiktok", "nextdoor", "craigslist", "youtube"];
const listSocialLeads = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  source: z.enum(["all", ...SOURCES$1]).default("all"),
  filter: z.enum(["all", "new", "contacted"]).default("new"),
  limit: z.number().min(1).max(500).default(300)
}).parse(d ?? {})).handler(createSsrRpc("bbb58db06f3141ce9d5f836cd65a98d85569efe618d8490734acc925e1cad298"));
const runSocialLeadHuntNow = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  sources: z.array(z.enum(SOURCES$1)).optional()
}).parse(d ?? {})).handler(createSsrRpc("6cc88656dca947f1fa5b25d51f134bb94b23a54ce65751d49130b0aab75a8e76"));
const setSocialLeadContacted = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  contacted: z.boolean()
}).parse(d)).handler(createSsrRpc("7d7f77a365423c8b0b40125b18fb4ddf04d0cfe76e8f7ee5a3df96e5ede02bd0"));
const updateSocialLeadNotes = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  notes: z.string().max(2e3)
}).parse(d)).handler(createSsrRpc("737c1c94cf3fc28a9b564d810eda9abb03d7fb498f162f61f3fb32271e3ac236"));
const deleteSocialLead = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(createSsrRpc("61e069fbe5504ed4989aa77bde7f1dbd5b3934986eb96cb9faa9b66d14f072e8"));
const SOURCES = ["all", "ig", "fb", "tiktok", "nextdoor", "craigslist", "youtube"];
const SOURCE_LABELS = {
  all: "All",
  ig: "Instagram",
  fb: "Facebook",
  tiktok: "TikTok",
  nextdoor: "Nextdoor",
  craigslist: "Craigslist",
  youtube: "YouTube"
};
function SocialLeadHunter() {
  const [rows, setRows] = React.useState([]);
  const [source, setSource] = React.useState("all");
  const [filter, setFilter] = React.useState("new");
  const [loading, setLoading] = React.useState(true);
  const [running, setRunning] = React.useState(false);
  const [msg, setMsg] = React.useState(null);
  const [search, setSearch] = React.useState("");
  async function load() {
    setLoading(true);
    try {
      const r = await listSocialLeads({
        data: {
          source,
          filter,
          limit: 400
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
  }, [source, filter]);
  async function runHunt(only) {
    setRunning(true);
    setMsg(null);
    try {
      const sources = only ? [only] : source === "all" ? void 0 : [source];
      const r = await runSocialLeadHuntNow({
        data: {
          sources
        }
      });
      const summary = Object.entries(r.by_source || {}).map(([s, v]) => `${s}: +${v.inserted}/~${v.refreshed}`).join(" · ");
      setMsg(`Done. ${r.inserted} new, ${r.refreshed} refreshed. ${summary}`);
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
    await setSocialLeadContacted({
      data: {
        id: row.id,
        contacted: next
      }
    });
    if (filter !== "all") load();
  }
  async function remove(row) {
    if (!confirm(`Delete ${row.handle ? "@" + row.handle : "this lead"}?`)) return;
    await deleteSocialLead({
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
    await updateSocialLeadNotes({
      data: {
        id: row.id,
        notes
      }
    });
  }
  const filtered = search.trim() ? rows.filter((r) => (r.handle || "").toLowerCase().includes(search.toLowerCase()) || (r.display_name || "").toLowerCase().includes(search.toLowerCase()) || (r.title || "").toLowerCase().includes(search.toLowerCase()) || (r.snippet || "").toLowerCase().includes(search.toLowerCase())) : rows;
  const totalNew = rows.filter((r) => !r.contacted).length;
  return /* @__PURE__ */ jsx(AdminLayout, { children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl space-y-6 p-6", children: [
    /* @__PURE__ */ jsxs("header", { className: "flex flex-wrap items-end justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "flex items-center gap-2 text-2xl font-semibold", children: [
          /* @__PURE__ */ jsx(Radar, { className: "h-6 w-6" }),
          " Social Lead Hunter"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Google search across Instagram, Facebook, TikTok, Nextdoor, Craigslist, and YouTube for pool-rental signals." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxs("button", { onClick: () => runHunt(), disabled: running, className: "inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60", children: [
        running ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "h-4 w-4" }),
        source === "all" ? "Run all sources" : `Run ${SOURCE_LABELS[source]}`
      ] }) })
    ] }),
    msg && /* @__PURE__ */ jsx("div", { className: "rounded-md border bg-muted/50 px-3 py-2 text-sm", children: msg }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
      /* @__PURE__ */ jsx("div", { className: "inline-flex flex-wrap rounded-md border p-1", children: SOURCES.map((s) => /* @__PURE__ */ jsx("button", { onClick: () => setSource(s), className: `rounded px-3 py-1 text-sm ${source === s ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`, children: SOURCE_LABELS[s] }, s)) }),
      /* @__PURE__ */ jsx("div", { className: "inline-flex rounded-md border p-1", children: ["new", "contacted", "all"].map((f) => /* @__PURE__ */ jsxs("button", { onClick: () => setFilter(f), className: `rounded px-3 py-1 text-sm capitalize ${filter === f ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`, children: [
        f,
        f === "new" ? ` (${totalNew})` : ""
      ] }, f)) }),
      /* @__PURE__ */ jsxs("div", { className: "relative ml-auto", children: [
        /* @__PURE__ */ jsx(Search, { className: "pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
        /* @__PURE__ */ jsx("input", { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Filter by handle, name, title, snippet…", className: "w-72 rounded-md border bg-background py-2 pl-8 pr-3 text-sm" })
      ] })
    ] }),
    loading ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
      " Loading leads…"
    ] }) : filtered.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground", children: [
      "No leads. Click ",
      /* @__PURE__ */ jsx("strong", { children: "Run" }),
      " to fetch fresh results."
    ] }) : /* @__PURE__ */ jsx("ul", { className: "divide-y rounded-md border", children: filtered.map((row) => /* @__PURE__ */ jsxs("li", { className: "flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-4", children: [
      /* @__PURE__ */ jsx("label", { className: "flex shrink-0 items-center gap-2 pt-1", children: /* @__PURE__ */ jsx("input", { type: "checkbox", checked: row.contacted, onChange: () => toggle(row), className: "h-4 w-4 cursor-pointer accent-primary" }) }),
      /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-baseline gap-x-2 gap-y-1", children: [
          /* @__PURE__ */ jsx("span", { className: "rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", children: row.source }),
          /* @__PURE__ */ jsxs("a", { href: row.source_url, target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center gap-1 font-medium text-primary hover:underline", children: [
            row.handle ? `@${row.handle}` : row.title || row.source_url,
            /* @__PURE__ */ jsx(ExternalLink, { className: "h-3 w-3" })
          ] }),
          row.profile_url && row.profile_url !== row.source_url && /* @__PURE__ */ jsx("a", { href: row.profile_url, target: "_blank", rel: "noopener noreferrer", className: "text-xs text-muted-foreground hover:underline", children: "profile" }),
          row.display_name && row.display_name !== row.handle && /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground line-clamp-1", children: row.display_name }),
          row.contacted && row.contacted_at && /* @__PURE__ */ jsxs("span", { className: "ml-auto text-xs text-muted-foreground", children: [
            "Contacted ",
            new Date(row.contacted_at).toLocaleDateString()
          ] })
        ] }),
        row.snippet && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground line-clamp-3", children: row.snippet }),
        /* @__PURE__ */ jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground", children: [
          row.location_hint && /* @__PURE__ */ jsx("span", { className: "rounded bg-muted px-1.5 py-0.5", children: row.location_hint }),
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
  ] }) });
}
export {
  SocialLeadHunter as component
};
