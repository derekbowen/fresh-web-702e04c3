import { jsx, jsxs } from "react/jsx-runtime";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { u as useServerFn } from "./useServerFn-DL2oePlL.js";
import { c as createServerFn } from "../server.js";
import { useQuery } from "@tanstack/react-query";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { useState } from "react";
import { A as AdminLayout } from "./admin-layout-7nNRKAex.js";
import "zod";
import "./client.server-D5ro3rAQ.js";
import "@supabase/supabase-js";
import "@tanstack/react-router";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
import "./createMiddleware-BvN2ghIY.js";
import "lucide-react";
import "./router-OI82CwOi.js";
import "./site-footer-defaults-C7gHxS5b.js";
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
const fetchSubs = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(createSsrRpc("459e0bd50d3ce0d0a627c617ce8c0cb057f785c693a37b4f12037d719b2cefb1"));
const updateStatus = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(createSsrRpc("7928dadb38fd9bbecad4c57ba3ad924c5b97be7d77d5fec49a51f964d928a69a"));
const bulkUpdate = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(createSsrRpc("e0211a9d106b99a30402bad62409cd3c4bea284d35c8e29c4d46d23462c9f376"));
function Page() {
  const list = useServerFn(fetchSubs);
  const update = useServerFn(updateStatus);
  const bulk = useServerFn(bulkUpdate);
  const [kind, setKind] = useState("host");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(/* @__PURE__ */ new Set());
  const q = useQuery({
    queryKey: ["drip-subs", kind, status, search],
    queryFn: () => list({
      data: {
        kind,
        status,
        search,
        limit: 200
      }
    })
  });
  function toggle(id) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }
  function toggleAll() {
    if (!q.data) return;
    if (selected.size === q.data.rows.length) setSelected(/* @__PURE__ */ new Set());
    else setSelected(new Set(q.data.rows.map((r) => r.id)));
  }
  async function setOne(id, s) {
    await update({
      data: {
        kind,
        id,
        status: s
      }
    });
    q.refetch();
  }
  async function setBulk(s) {
    const ids = Array.from(selected);
    if (ids.length === 0) {
      alert("Select rows first");
      return;
    }
    const verb = s === "active" ? "resume" : s === "paused" ? "pause" : "unsubscribe";
    if (!confirm(`${verb} ${ids.length} subscriber${ids.length === 1 ? "" : "s"}?`)) return;
    await bulk({
      data: {
        kind,
        ids,
        status: s
      }
    });
    setSelected(/* @__PURE__ */ new Set());
    q.refetch();
  }
  const rows = q.data?.rows ?? [];
  const counts = q.data?.counts ?? {
    active: 0,
    paused: 0,
    unsubscribed: 0
  };
  return /* @__PURE__ */ jsx(AdminLayout, { title: "Drip subscribers", children: /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-600", children: "Pause individual recipients so their drip emails stop (e.g. when they reply, book, or ask). Paused subscribers stay on the list but get skipped by the sender. Resume to put them back in rotation." }),
    /* @__PURE__ */ jsxs("section", { className: "border rounded-lg p-4 bg-card space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2 flex-wrap items-center", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
          /* @__PURE__ */ jsx(Tab, { active: kind === "host", onClick: () => {
            setKind("host");
            setSelected(/* @__PURE__ */ new Set());
          }, children: "Hosts" }),
          /* @__PURE__ */ jsx(Tab, { active: kind === "renter", onClick: () => {
            setKind("renter");
            setSelected(/* @__PURE__ */ new Set());
          }, children: "Renters" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex-1" }),
        /* @__PURE__ */ jsx("input", { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Search email…", className: "border rounded p-2 text-sm w-64" }),
        /* @__PURE__ */ jsxs("select", { value: status, onChange: (e) => setStatus(e.target.value), className: "border rounded p-2 text-sm", children: [
          /* @__PURE__ */ jsx("option", { value: "all", children: "All statuses" }),
          /* @__PURE__ */ jsxs("option", { value: "active", children: [
            "Active (",
            counts.active,
            ")"
          ] }),
          /* @__PURE__ */ jsxs("option", { value: "paused", children: [
            "Paused (",
            counts.paused,
            ")"
          ] }),
          /* @__PURE__ */ jsxs("option", { value: "unsubscribed", children: [
            "Unsubscribed (",
            counts.unsubscribed,
            ")"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2 text-xs", children: [
        /* @__PURE__ */ jsxs(Pill, { color: "emerald", children: [
          "Active: ",
          counts.active
        ] }),
        /* @__PURE__ */ jsxs(Pill, { color: "amber", children: [
          "Paused: ",
          counts.paused
        ] }),
        /* @__PURE__ */ jsxs(Pill, { color: "rose", children: [
          "Unsubscribed: ",
          counts.unsubscribed
        ] })
      ] }),
      selected.size > 0 && /* @__PURE__ */ jsxs("div", { className: "border rounded p-2 bg-sky-50 flex gap-2 items-center text-sm", children: [
        /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
          selected.size,
          " selected"
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => setBulk("paused"), className: "px-2 py-1 border rounded bg-white hover:bg-amber-50", children: "⏸ Pause" }),
        /* @__PURE__ */ jsx("button", { onClick: () => setBulk("active"), className: "px-2 py-1 border rounded bg-white hover:bg-emerald-50", children: "▶ Resume" }),
        /* @__PURE__ */ jsx("button", { onClick: () => setBulk("unsubscribed"), className: "px-2 py-1 border rounded bg-white hover:bg-rose-50 text-rose-700", children: "🚫 Unsubscribe" }),
        /* @__PURE__ */ jsx("button", { onClick: () => setSelected(/* @__PURE__ */ new Set()), className: "text-xs underline text-slate-600 ml-auto", children: "Clear" })
      ] }),
      q.isLoading ? /* @__PURE__ */ jsx("p", { className: "text-sm", children: "Loading…" }) : /* @__PURE__ */ jsx("div", { className: "overflow-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-left border-b", children: [
          /* @__PURE__ */ jsx("th", { className: "p-2 w-8", children: /* @__PURE__ */ jsx("input", { type: "checkbox", checked: rows.length > 0 && selected.size === rows.length, onChange: toggleAll }) }),
          /* @__PURE__ */ jsx("th", { className: "p-2", children: "Email" }),
          /* @__PURE__ */ jsx("th", { className: "p-2", children: "Name" }),
          /* @__PURE__ */ jsx("th", { className: "p-2", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "p-2", children: "Seq scheduled" }),
          /* @__PURE__ */ jsx("th", { className: "p-2", children: "Created" }),
          /* @__PURE__ */ jsx("th", { className: "p-2", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { children: [
          rows.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 7, className: "p-4 text-slate-500 italic", children: "No subscribers match." }) }),
          rows.map((r) => /* @__PURE__ */ jsxs("tr", { className: "border-b hover:bg-slate-50", children: [
            /* @__PURE__ */ jsx("td", { className: "p-2", children: /* @__PURE__ */ jsx("input", { type: "checkbox", checked: selected.has(r.id), onChange: () => toggle(r.id) }) }),
            /* @__PURE__ */ jsx("td", { className: "p-2 font-mono text-xs", children: r.email }),
            /* @__PURE__ */ jsx("td", { className: "p-2 text-xs", children: r.name || "—" }),
            /* @__PURE__ */ jsx("td", { className: "p-2", children: /* @__PURE__ */ jsx(StatusBadge, { s: r.status }) }),
            /* @__PURE__ */ jsx("td", { className: "p-2 text-xs", children: r.sequence_scheduled ? "✓" : "—" }),
            /* @__PURE__ */ jsx("td", { className: "p-2 text-xs whitespace-nowrap", children: new Date(r.created_at).toLocaleDateString() }),
            /* @__PURE__ */ jsxs("td", { className: "p-2 space-x-1 whitespace-nowrap", children: [
              r.status !== "paused" && r.status !== "unsubscribed" && /* @__PURE__ */ jsx("button", { onClick: () => setOne(r.id, "paused"), className: "text-xs px-2 py-1 border rounded hover:bg-amber-50", children: "⏸ Pause" }),
              r.status !== "active" && /* @__PURE__ */ jsx("button", { onClick: () => setOne(r.id, "active"), className: "text-xs px-2 py-1 border rounded hover:bg-emerald-50", children: "▶ Resume" }),
              r.status !== "unsubscribed" && /* @__PURE__ */ jsx("button", { onClick: () => setOne(r.id, "unsubscribed"), className: "text-xs px-2 py-1 text-rose-600 hover:underline", children: "Unsub" })
            ] })
          ] }, r.id))
        ] })
      ] }) })
    ] })
  ] }) });
}
function Tab({
  active,
  onClick,
  children
}) {
  return /* @__PURE__ */ jsx("button", { onClick, className: `px-3 py-2 text-sm rounded border ${active ? "bg-sky-600 text-white border-sky-600" : "bg-white hover:bg-slate-50"}`, children });
}
function Pill({
  color,
  children
}) {
  const cls = color === "emerald" ? "bg-emerald-100 text-emerald-700" : color === "amber" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700";
  return /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded ${cls}`, children });
}
function StatusBadge({
  s
}) {
  const map = {
    active: "bg-emerald-100 text-emerald-700",
    paused: "bg-amber-100 text-amber-700",
    unsubscribed: "bg-rose-100 text-rose-700"
  };
  return /* @__PURE__ */ jsx("span", { className: `text-xs px-2 py-0.5 rounded ${map[s] || "bg-slate-100 text-slate-700"}`, children: s });
}
export {
  Page as component
};
