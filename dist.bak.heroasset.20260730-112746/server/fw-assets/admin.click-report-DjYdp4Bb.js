import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { A as AdminLayout } from "./admin-layout-BAYjOizo.js";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-Bd-cw3tB.js";
import { c as createServerFn } from "../server.js";
import "@tanstack/react-router";
import "lucide-react";
import "./router-DnjagyeS.js";
import "@tanstack/react-query";
import "./site-footer-defaults-asWdr-hi.js";
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
import "./createMiddleware-BvN2ghIY.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
const InputSchema = z.object({
  days: z.number().int().min(1).max(365).default(30),
  limit: z.number().int().min(1).max(500).default(50)
});
const getCityClickReport = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => InputSchema.parse(input)).handler(createSsrRpc("b9b6d5f3972bec018d1fab730b1717012f1308bc954ffcfd2c9aee6fb8d912e4"));
function ClickReportPage() {
  const [days, setDays] = useState(30);
  const [limit, setLimit] = useState(50);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const out = await getCityClickReport({
        data: {
          days,
          limit
        }
      });
      setReport(out);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  function downloadCsv() {
    if (!report) return;
    const header = "rank,to_city_slug,city_name,state_code,total_clicks,unique_visitors,last_clicked_at\n";
    const body = report.rows.map((r, i) => [i + 1, r.to_city_slug, JSON.stringify(r.city_name ?? ""), r.state_code ?? "", r.total_clicks, r.unique_visitors, r.last_clicked_at].join(",")).join("\n");
    const blob = new Blob([header + body + "\n"], {
      type: "text/csv"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nearby-city-clicks-top${report.rows.length}-${report.windowDays}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return /* @__PURE__ */ jsxs(AdminLayout, { children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight text-foreground", children: "Top destinations from nearby-city links" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: 'Aggregates clicks on the "Nearby pool rentals" links across every city page. Admin only.' }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap items-end gap-4 rounded-2xl border border-border bg-card p-4", children: [
      /* @__PURE__ */ jsxs("label", { className: "text-sm", children: [
        /* @__PURE__ */ jsx("span", { className: "mr-2 text-muted-foreground", children: "Window (days)" }),
        /* @__PURE__ */ jsx("input", { type: "number", min: 1, max: 365, value: days, onChange: (e) => setDays(Math.max(1, Math.min(365, Number(e.target.value) || 1))), className: "w-24 rounded-md border border-input bg-background px-2 py-1 text-foreground" })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "text-sm", children: [
        /* @__PURE__ */ jsx("span", { className: "mr-2 text-muted-foreground", children: "Limit" }),
        /* @__PURE__ */ jsx("input", { type: "number", min: 1, max: 500, value: limit, onChange: (e) => setLimit(Math.max(1, Math.min(500, Number(e.target.value) || 1))), className: "w-24 rounded-md border border-input bg-background px-2 py-1 text-foreground" })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: load, disabled: loading, className: "inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-glow disabled:opacity-50", children: loading ? "Loading…" : "Refresh" }),
      /* @__PURE__ */ jsx("button", { onClick: downloadCsv, disabled: !report || report.rows.length === 0, className: "inline-flex h-9 items-center rounded-full border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-secondary disabled:opacity-50", children: "Download CSV" }),
      report && /* @__PURE__ */ jsxs("span", { className: "ml-auto text-xs text-muted-foreground", children: [
        "Generated ",
        new Date(report.generatedAt).toLocaleString()
      ] })
    ] }),
    err && /* @__PURE__ */ jsx("div", { className: "mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive", children: err }),
    /* @__PURE__ */ jsx("div", { className: "mt-6 overflow-x-auto rounded-2xl border border-border bg-card", children: /* @__PURE__ */ jsxs("table", { className: "min-w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "#" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "City" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Slug" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right", children: "Clicks" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right", children: "Unique visitors" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Last click" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        (report?.rows ?? []).map((r, i) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2 text-muted-foreground", children: i + 1 }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2 font-medium text-foreground", children: r.city_name ? `${r.city_name}, ${r.state_code ?? ""}` : "—" }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2 text-muted-foreground", children: /* @__PURE__ */ jsx("a", { href: `/s?address=${encodeURIComponent(r.to_city_slug)}`, target: "_blank", rel: "noreferrer", className: "hover:text-primary hover:underline", children: r.to_city_slug }) }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2 text-right tabular-nums text-foreground", children: r.total_clicks }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2 text-right tabular-nums text-foreground", children: r.unique_visitors }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2 text-muted-foreground", children: new Date(r.last_clicked_at).toLocaleString() })
        ] }, r.to_city_slug)),
        report && report.rows.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "px-4 py-8 text-center text-sm text-muted-foreground", children: "No clicks recorded in this window yet." }) })
      ] })
    ] }) })
  ] });
}
export {
  ClickReportPage as component
};
