import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import * as React from "react";
import { Link } from "@tanstack/react-router";
import { u as useServerFn } from "./useServerFn-DL2oePlL.js";
import { useQuery } from "@tanstack/react-query";
import { A as AdminLayout } from "./admin-layout-DvQlFbdd.js";
import { g as getFollowupDashboard } from "./followup-analytics.functions-imQ3yqJg.js";
import "lucide-react";
import "./router-Bk6RtsuF.js";
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
const RANGES = [{
  label: "7d",
  value: 7
}, {
  label: "30d",
  value: 30
}, {
  label: "90d",
  value: 90
}, {
  label: "1y",
  value: 365
}];
function pct(n) {
  return `${(n * 100).toFixed(1)}%`;
}
function FollowupPerformancePage() {
  const [rangeDays, setRangeDays] = React.useState(30);
  const fetchDashboard = useServerFn(getFollowupDashboard);
  const {
    data,
    isLoading,
    error
  } = useQuery({
    queryKey: ["followup-dashboard", rangeDays],
    queryFn: () => fetchDashboard({
      data: {
        rangeDays
      }
    })
  });
  return /* @__PURE__ */ jsx(AdminLayout, { title: "Follow-up performance", children: /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold", children: "Follow-up performance" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Response rate, conversion, time-to-reply, and AI score distribution by source and city." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex gap-1 rounded-md border border-border bg-card p-1", children: RANGES.map((r) => /* @__PURE__ */ jsx("button", { onClick: () => setRangeDays(r.value), className: `rounded px-3 py-1 text-xs font-medium ${rangeDays === r.value ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`, children: r.label }, r.value)) })
    ] }),
    error && /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive", children: [
      "Failed to load dashboard: ",
      error.message
    ] }),
    isLoading && /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Loading…" }),
    data && /* @__PURE__ */ jsx(DashboardBody, { data, rangeDays })
  ] }) });
}
function StatCard({
  label,
  value,
  sub
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card p-4", children: [
    /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: "mt-1 text-2xl font-semibold", children: value }),
    sub && /* @__PURE__ */ jsx("div", { className: "mt-0.5 text-xs text-muted-foreground", children: sub })
  ] });
}
function DashboardBody({
  data,
  rangeDays
}) {
  const {
    summary,
    bySource,
    byCity,
    scoreDist
  } = data;
  const maxScore = Math.max(1, ...scoreDist.map((b) => b.count));
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 md:grid-cols-4", children: [
      /* @__PURE__ */ jsx(StatCard, { label: "Leads", value: summary.total.toLocaleString(), sub: `${summary.contacted} contacted` }),
      /* @__PURE__ */ jsx(StatCard, { label: "Response rate", value: pct(summary.responseRate), sub: `${summary.responded} of ${summary.contacted}` }),
      /* @__PURE__ */ jsx(StatCard, { label: "Conversion rate", value: pct(summary.conversionRate), sub: `${summary.converted} converted` }),
      /* @__PURE__ */ jsx(StatCard, { label: "Median time to reply", value: summary.medianHoursToReply == null ? "—" : `${summary.medianHoursToReply.toFixed(1)} h`, sub: summary.avgScore != null ? `Avg AI score ${summary.avgScore.toFixed(0)}` : "No scores yet" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-4 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsx(Section, { title: "By source", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "text-xs uppercase text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "py-1 text-left", children: "Source" }),
          /* @__PURE__ */ jsx("th", { className: "text-right", children: "Total" }),
          /* @__PURE__ */ jsx("th", { className: "text-right", children: "Resp." }),
          /* @__PURE__ */ jsx("th", { className: "text-right", children: "Conv." }),
          /* @__PURE__ */ jsx("th", { className: "text-right", children: "Avg score" })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { children: [
          bySource.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "py-4 text-center text-muted-foreground", children: "No data." }) }),
          bySource.map((b) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border hover:bg-muted/30", children: [
            /* @__PURE__ */ jsx("td", { className: "py-2 font-medium", children: /* @__PURE__ */ jsx(Link, { to: "/admin/followup-drilldown", search: {
              source: b.source,
              rangeDays,
              page: 1,
              pageSize: 25
            }, className: "text-primary hover:underline", children: b.source }) }),
            /* @__PURE__ */ jsx("td", { className: "text-right", children: b.total }),
            /* @__PURE__ */ jsx("td", { className: "text-right", children: pct(b.responseRate) }),
            /* @__PURE__ */ jsx("td", { className: "text-right", children: pct(b.conversionRate) }),
            /* @__PURE__ */ jsx("td", { className: "text-right", children: b.avgScore == null ? "—" : b.avgScore.toFixed(0) })
          ] }, b.source))
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(Section, { title: "AI score distribution", children: /* @__PURE__ */ jsx("div", { className: "space-y-2", children: scoreDist.map((b) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "w-20 text-xs text-muted-foreground", children: b.bucket }),
        /* @__PURE__ */ jsx("div", { className: "h-3 flex-1 overflow-hidden rounded bg-muted", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-primary", style: {
          width: `${b.count / maxScore * 100}%`
        } }) }),
        /* @__PURE__ */ jsx("div", { className: "w-10 text-right text-xs tabular-nums", children: b.count })
      ] }, b.bucket)) }) })
    ] }),
    /* @__PURE__ */ jsx(Section, { title: "Top cities", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "text-xs uppercase text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "py-1 text-left", children: "City" }),
        /* @__PURE__ */ jsx("th", { className: "text-left", children: "Region" }),
        /* @__PURE__ */ jsx("th", { className: "text-right", children: "Leads" }),
        /* @__PURE__ */ jsx("th", { className: "text-right", children: "Responded" }),
        /* @__PURE__ */ jsx("th", { className: "text-right", children: "Resp. rate" }),
        /* @__PURE__ */ jsx("th", { className: "text-right", children: "Converted" }),
        /* @__PURE__ */ jsx("th", { className: "text-right", children: "Conv. rate" }),
        /* @__PURE__ */ jsx("th", { className: "text-right", children: "Avg score" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        byCity.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 8, className: "py-4 text-center text-muted-foreground", children: "No data." }) }),
        byCity.map((c) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border hover:bg-muted/30", children: [
          /* @__PURE__ */ jsx("td", { className: "py-2 font-medium", children: /* @__PURE__ */ jsx(Link, { to: "/admin/followup-drilldown", search: {
            city: c.city,
            rangeDays,
            page: 1,
            pageSize: 25
          }, className: "text-primary hover:underline", children: c.city }) }),
          /* @__PURE__ */ jsx("td", { className: "text-muted-foreground", children: c.region ?? "—" }),
          /* @__PURE__ */ jsx("td", { className: "text-right", children: c.total }),
          /* @__PURE__ */ jsx("td", { className: "text-right", children: c.responded }),
          /* @__PURE__ */ jsx("td", { className: "text-right", children: pct(c.responseRate) }),
          /* @__PURE__ */ jsx("td", { className: "text-right", children: c.converted }),
          /* @__PURE__ */ jsx("td", { className: "text-right", children: pct(c.conversionRate) }),
          /* @__PURE__ */ jsx("td", { className: "text-right", children: c.avgScore == null ? "—" : c.avgScore.toFixed(0) })
        ] }, `${c.city}-${c.region}`))
      ] })
    ] }) }) })
  ] });
}
function Section({
  title,
  children
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card p-4", children: [
    /* @__PURE__ */ jsx("h2", { className: "mb-3 text-sm font-semibold", children: title }),
    children
  ] });
}
export {
  FollowupPerformancePage as component
};
