import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { A as AdminLayout } from "./admin-layout-BNp_05PW.js";
import { c as createSsrRpc } from "./cities.functions-XBYRqf13.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-rMMNsPLB.js";
import { c as createServerFn } from "../server.js";
import { Mail, CheckCircle2, XCircle, Loader2, Play, RefreshCw } from "lucide-react";
import "@tanstack/react-router";
import "./router-BvRNdW25.js";
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
import "./renter-drip.server-CBcoOJUi.js";
import "./emailit-DRsipvVx.js";
import "node:fs";
import "node:path";
import "./host-drip.server-LDeZNUHd.js";
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
const getEmailVerifyBalance = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("0e199a31686823a745e07fad9b717c60b8ea24a01088ddc2fa9f161a39d22c80"));
const getEmailVerifyStats = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("1cd2279de169d725f82cbb992e95dbbc500811fe24aee9efc8f3e173aae2d18c"));
const verifyHostLeadBatch = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator(z.object({
  limit: z.number().min(1).max(100).default(25)
}).parse).handler(createSsrRpc("70c63b88de77e94ff0369a104d532e357bf6aff7a591587b212edda6bdb61edd"));
const listVerifiedLeads = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator(z.object({
  filter: z.enum(["all", "sendable", "invalid", "unverified"]).default("all")
}).parse).handler(createSsrRpc("6340da91574d15a251a5bec78865c862bf9ec79fcf2e2798f8476063e9c0a0f8"));
function EmailVerifyPage() {
  const [balance, setBalance] = React.useState(null);
  const [stats, setStats] = React.useState(null);
  const [rows, setRows] = React.useState([]);
  const [filter, setFilter] = React.useState("unverified");
  const [batchSize, setBatchSize] = React.useState(25);
  const [running, setRunning] = React.useState(false);
  const [msg, setMsg] = React.useState(null);
  const [lastResults, setLastResults] = React.useState([]);
  async function load() {
    const [b, s, l] = await Promise.all([getEmailVerifyBalance(), getEmailVerifyStats(), listVerifiedLeads({
      data: {
        filter
      }
    })]);
    if (b.ok) setBalance({
      credits: b.credits,
      status: b.status
    });
    else setMsg(b.error || "Balance error");
    if (s.ok) setStats(s);
    if (l.ok) setRows(l.rows);
  }
  React.useEffect(() => {
    load();
  }, [filter]);
  async function runBatch() {
    setRunning(true);
    setMsg(null);
    setLastResults([]);
    try {
      const r = await verifyHostLeadBatch({
        data: {
          limit: batchSize
        }
      });
      if (!r.ok) {
        setMsg(r.error);
        return;
      }
      setLastResults(r.results || []);
      setMsg(`Verified ${r.processed} email${r.processed === 1 ? "" : "s"}.${r.message ? " " + r.message : ""}`);
      await load();
    } finally {
      setRunning(false);
    }
  }
  return /* @__PURE__ */ jsx(AdminLayout, { title: "Email verify", children: /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsx(Card, { label: "API credits", value: balance ? balance.credits.toLocaleString() : "—", icon: /* @__PURE__ */ jsx(Mail, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsx(Card, { label: "Total leads", value: stats?.total ?? "—" }),
      /* @__PURE__ */ jsx(Card, { label: "Sendable", value: stats?.sendable ?? "—", tone: "good", icon: /* @__PURE__ */ jsx(CheckCircle2, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsx(Card, { label: "Invalid / risky", value: stats?.invalid ?? "—", tone: "bad", icon: /* @__PURE__ */ jsx(XCircle, { className: "h-5 w-5" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-card border rounded-lg p-4 flex flex-wrap items-center gap-3", children: [
      /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: "Verify next" }),
      /* @__PURE__ */ jsx("select", { value: batchSize, onChange: (e) => setBatchSize(Number(e.target.value)), className: "border rounded px-2 py-1.5 text-sm bg-background", children: [10, 25, 50, 100].map((n) => /* @__PURE__ */ jsx("option", { value: n, children: n }, n)) }),
      /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: "unverified leads" }),
      /* @__PURE__ */ jsxs("button", { onClick: runBatch, disabled: running || !balance || balance.credits < batchSize, className: "ml-auto inline-flex items-center gap-2 px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50", children: [
        running ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Play, { className: "h-4 w-4" }),
        running ? "Verifying..." : "Run batch"
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: load, className: "inline-flex items-center gap-2 px-3 py-2 rounded border text-sm", children: [
        /* @__PURE__ */ jsx(RefreshCw, { className: "h-4 w-4" }),
        " Refresh"
      ] })
    ] }),
    msg && /* @__PURE__ */ jsx("div", { className: "text-sm bg-muted px-3 py-2 rounded", children: msg }),
    lastResults.length > 0 && /* @__PURE__ */ jsxs("div", { className: "bg-card border rounded-lg p-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold mb-2 text-sm", children: "Last batch results" }),
      /* @__PURE__ */ jsx("div", { className: "space-y-1 text-xs font-mono max-h-60 overflow-auto", children: lastResults.map((r) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between gap-2 border-b py-1", children: [
        /* @__PURE__ */ jsx("span", { className: "truncate", children: r.email }),
        /* @__PURE__ */ jsxs("span", { className: r.sendable ? "text-emerald-600" : "text-rose-600", children: [
          r.status,
          r.sub_status ? ` / ${r.sub_status}` : "",
          r.error ? ` — ${r.error}` : ""
        ] })
      ] }, r.id)) })
    ] }),
    stats?.byStatus && Object.keys(stats.byStatus).length > 0 && /* @__PURE__ */ jsxs("div", { className: "bg-card border rounded-lg p-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold mb-2 text-sm", children: "Verified breakdown" }),
      /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: Object.entries(stats.byStatus).map(([k, v]) => /* @__PURE__ */ jsxs("span", { className: "text-xs bg-muted px-2 py-1 rounded", children: [
        k,
        ": ",
        /* @__PURE__ */ jsx("strong", { children: v })
      ] }, k)) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: ["unverified", "sendable", "invalid", "all"].map((f) => /* @__PURE__ */ jsx("button", { onClick: () => setFilter(f), className: `px-3 py-1.5 text-sm rounded border ${filter === f ? "bg-primary text-primary-foreground" : ""}`, children: f }, f)) }),
    /* @__PURE__ */ jsx("div", { className: "bg-card border rounded-lg overflow-hidden", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-muted text-xs", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "text-left px-3 py-2", children: "Email" }),
        /* @__PURE__ */ jsx("th", { className: "text-left px-3 py-2", children: "Name" }),
        /* @__PURE__ */ jsx("th", { className: "text-left px-3 py-2", children: "City" }),
        /* @__PURE__ */ jsx("th", { className: "text-left px-3 py-2", children: "Status" }),
        /* @__PURE__ */ jsx("th", { className: "text-left px-3 py-2", children: "Sendable" }),
        /* @__PURE__ */ jsx("th", { className: "text-left px-3 py-2", children: "Verified" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        rows.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "px-3 py-8 text-center text-muted-foreground", children: "No leads" }) }),
        rows.map((r) => /* @__PURE__ */ jsxs("tr", { className: "border-t", children: [
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2 font-mono text-xs", children: r.email }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: r.name }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-muted-foreground", children: r.city || "—" }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: r.email_status ? /* @__PURE__ */ jsxs("span", { className: "text-xs", children: [
            r.email_status,
            r.email_sub_status ? ` / ${r.email_sub_status}` : ""
          ] }) : /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-xs", children: "—" }) }),
          /* @__PURE__ */ jsxs("td", { className: "px-3 py-2", children: [
            r.email_sendable === true && /* @__PURE__ */ jsx("span", { className: "text-emerald-600 text-xs font-medium", children: "✓ yes" }),
            r.email_sendable === false && /* @__PURE__ */ jsx("span", { className: "text-rose-600 text-xs font-medium", children: "✗ no" }),
            r.email_sendable === null && /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-xs", children: "—" })
          ] }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-xs text-muted-foreground", children: r.email_verified_at ? new Date(r.email_verified_at).toLocaleDateString() : "—" })
        ] }, r.id))
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: 'Sendable = status "valid". "Risky", "unknown", "catch-all", and invalid are auto-excluded from any future email sends. Verified leads are skipped on subsequent batches.' })
  ] }) });
}
function Card({
  label,
  value,
  icon,
  tone
}) {
  const toneCls = tone === "good" ? "text-emerald-600" : tone === "bad" ? "text-rose-600" : "";
  return /* @__PURE__ */ jsxs("div", { className: "bg-card border rounded-lg p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs text-muted-foreground", children: [
      /* @__PURE__ */ jsx("span", { children: label }),
      icon && /* @__PURE__ */ jsx("span", { className: toneCls, children: icon })
    ] }),
    /* @__PURE__ */ jsx("div", { className: `text-2xl font-bold mt-1 ${toneCls}`, children: value })
  ] });
}
export {
  EmailVerifyPage as component
};
