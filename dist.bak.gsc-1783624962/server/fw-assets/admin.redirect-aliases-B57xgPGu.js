import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { c as createServerFn } from "../server.js";
import { A as AdminLayout } from "./admin-layout-fwIJkCGX.js";
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
import "@tanstack/react-router/ssr/server";
import "lucide-react";
import "./router-Bw8GQi9C.js";
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
const inputSchema = z.object({
  limit: z.number().int().positive().max(2e3).optional(),
  dryRun: z.boolean().optional()
});
const runAliasBackfillFn = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => inputSchema.parse(data)).handler(createSsrRpc("6a4f9d68461af7001d413a407fb7d497b6fa132f8bcd382fd6be56cc057ff354"));
function AdminAliasBackfillPage() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [errMsg, setErrMsg] = useState(null);
  async function run(dryRun) {
    if (running) return;
    setRunning(true);
    setErrMsg(null);
    setResults([]);
    setSummary(null);
    try {
      const out = await runAliasBackfillFn({
        data: {
          dryRun,
          limit: 500
        }
      });
      setResults(out.results);
      setSummary(out.summary);
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  }
  return /* @__PURE__ */ jsxs(AdminLayout, { children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsx(Link, { to: "/", className: "text-sm text-muted-foreground hover:underline", children: "← Home" }),
      /* @__PURE__ */ jsx("h1", { className: "mt-2 text-3xl font-bold tracking-tight", children: "Redirect aliases" }),
      /* @__PURE__ */ jsxs("p", { className: "mt-2 text-muted-foreground", children: [
        "Scans the 404 log, resolves missing slugs to a canonical",
        " ",
        /* @__PURE__ */ jsx("code", { className: "rounded bg-secondary px-1.5 py-0.5 text-xs", children: "/p/..." }),
        " ",
        "page, and adds them to that page's",
        " ",
        /* @__PURE__ */ jsx("code", { className: "rounded bg-secondary px-1.5 py-0.5 text-xs", children: "legacy_slugs" }),
        " ",
        "so future visits 301 instead of 404. Admin only."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3", children: [
      /* @__PURE__ */ jsx("button", { disabled: running, onClick: () => run(true), className: "inline-flex items-center justify-center rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary disabled:opacity-50", children: running ? "Running…" : "Preview (dry run)" }),
      /* @__PURE__ */ jsx("button", { disabled: running, onClick: () => run(false), className: "inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50", children: running ? "Running…" : "Run backfill" })
    ] }),
    errMsg && /* @__PURE__ */ jsx("div", { className: "mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive", children: errMsg }),
    summary && /* @__PURE__ */ jsx("div", { className: "mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4", children: Object.entries(summary).map(([k, v]) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card p-4 text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold", children: v }),
      /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: k.replace(/_/g, " ") })
    ] }, k)) }),
    results.length > 0 && /* @__PURE__ */ jsx("div", { className: "mt-8 overflow-hidden rounded-lg border border-border", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-secondary/40 text-xs uppercase text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Status" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Hits" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Legacy slug" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "→ canonical" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Reason" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border", children: results.map((r) => /* @__PURE__ */ jsxs("tr", { className: "align-top", children: [
        /* @__PURE__ */ jsx("td", { className: "px-3 py-2 font-mono text-xs", children: /* @__PURE__ */ jsx("span", { className: r.status === "resolved" ? "text-emerald-600" : "text-muted-foreground", children: r.status }) }),
        /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-xs tabular-nums", children: r.hit_count }),
        /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-xs", children: /* @__PURE__ */ jsxs("code", { children: [
          "/p/",
          r.legacy_slug
        ] }) }),
        /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-xs", children: r.canonical_slug ? /* @__PURE__ */ jsxs("a", { href: `/p/${r.canonical_slug}`, target: "_blank", rel: "noreferrer", className: "text-primary hover:underline", children: [
          "/p/",
          r.canonical_slug
        ] }) : /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "—" }) }),
        /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-xs text-muted-foreground", children: r.reason })
      ] }, r.legacy_slug)) })
    ] }) })
  ] });
}
export {
  AdminAliasBackfillPage as component
};
