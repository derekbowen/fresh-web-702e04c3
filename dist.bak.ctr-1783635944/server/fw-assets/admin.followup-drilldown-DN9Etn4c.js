import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { u as useServerFn } from "./useServerFn-DL2oePlL.js";
import { useQuery } from "@tanstack/react-query";
import { A as AdminLayout } from "./admin-layout-B2eMXHXP.js";
import { a as getFollowupDrilldown } from "./followup-analytics.functions-imQ3yqJg.js";
import { bc as Route } from "./router-BEu57YoG.js";
import "react";
import "lucide-react";
import "./client-Dh5RMKgP.js";
import "@supabase/supabase-js";
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
import "./auth-middleware-C3cX-s7a.js";
import "./createMiddleware-BvN2ghIY.js";
import "./site-footer-defaults-C7gHxS5b.js";
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
import "./renter-drip.server-DJqUcyMM.js";
import "node:fs";
import "node:path";
import "./host-drip.server-BfIDzqiI.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
function fmtDate(s) {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleDateString(void 0, {
    month: "short",
    day: "numeric",
    year: "2-digit"
  });
}
function statusColor(status) {
  switch (status) {
    case "converted":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case "connected":
      return "bg-blue-500/15 text-blue-700 dark:text-blue-300";
    case "attempting":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
    case "not_interested":
    case "do_not_contact":
      return "bg-red-500/15 text-red-700 dark:text-red-300";
    case "no_response":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-foreground";
  }
}
function FollowupDrilldownPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({
    from: "/admin/followup-drilldown"
  });
  const fetchDrill = useServerFn(getFollowupDrilldown);
  const {
    data,
    isLoading,
    error
  } = useQuery({
    queryKey: ["followup-drilldown", search],
    queryFn: () => fetchDrill({
      data: {
        source: search.source ?? null,
        city: search.city ?? null,
        region: search.region ?? null,
        rangeDays: search.rangeDays,
        page: search.page,
        pageSize: search.pageSize
      }
    })
  });
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const filterChips = [];
  if (search.source) filterChips.push({
    key: "source",
    label: `Source: ${search.source}`
  });
  if (search.city) filterChips.push({
    key: "city",
    label: `City: ${search.city}`
  });
  if (search.region) filterChips.push({
    key: "region",
    label: `Region: ${search.region}`
  });
  return /* @__PURE__ */ jsx(AdminLayout, { title: "Follow-up drilldown", children: /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold", children: "Follow-up drilldown" }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
          "Filtered list of follow-ups with status, outcome, and AI score. Last ",
          search.rangeDays,
          " days."
        ] })
      ] }),
      /* @__PURE__ */ jsx(Link, { to: "/admin/followup-performance", className: "text-sm text-primary hover:underline", children: "← Back to performance" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
      filterChips.length === 0 && /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "All follow-ups" }),
      filterChips.map((c) => /* @__PURE__ */ jsxs("button", { onClick: () => navigate({
        search: (p) => ({
          ...p,
          [c.key]: void 0,
          page: 1
        })
      }), className: "rounded-full border border-border bg-card px-3 py-1 text-xs hover:bg-muted", children: [
        c.label,
        " ✕"
      ] }, c.key))
    ] }),
    error && /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive", children: [
      "Failed to load: ",
      error.message
    ] }),
    isLoading && /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Loading…" }),
    data && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded-lg border border-border bg-card", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-muted/40 text-xs uppercase text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-left", children: "Lead" }),
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-left", children: "Source" }),
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-left", children: "City" }),
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-left", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-left", children: "Last outcome" }),
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-right", children: "AI score" }),
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-right", children: "Touches" }),
          /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-right", children: "Last touch" })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { children: [
          data.items.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 8, className: "px-3 py-8 text-center text-muted-foreground", children: "No follow-ups match." }) }),
          data.items.map((it) => /* @__PURE__ */ jsx(Row, { it }, it.id))
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
          data.total.toLocaleString(),
          " total • page ",
          data.page,
          " of ",
          totalPages
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
          /* @__PURE__ */ jsx("button", { disabled: data.page <= 1, onClick: () => navigate({
            search: (p) => ({
              ...p,
              page: Math.max(1, p.page - 1)
            })
          }), className: "rounded border border-border bg-card px-3 py-1 text-xs disabled:opacity-50 hover:bg-muted", children: "← Prev" }),
          /* @__PURE__ */ jsx("button", { disabled: data.page >= totalPages, onClick: () => navigate({
            search: (p) => ({
              ...p,
              page: p.page + 1
            })
          }), className: "rounded border border-border bg-card px-3 py-1 text-xs disabled:opacity-50 hover:bg-muted", children: "Next →" })
        ] })
      ] })
    ] })
  ] }) });
}
function Row({
  it
}) {
  return /* @__PURE__ */ jsxs("tr", { className: "border-t border-border hover:bg-muted/30", children: [
    /* @__PURE__ */ jsxs("td", { className: "px-3 py-2", children: [
      /* @__PURE__ */ jsx(Link, { to: "/admin/follow-ups", search: {
        q: it.display_name ?? it.lead_id
      }, className: "font-medium text-primary hover:underline", children: it.display_name ?? it.lead_id.slice(0, 8) }),
      it.display_subtitle && /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: it.display_subtitle })
    ] }),
    /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-xs", children: it.source }),
    /* @__PURE__ */ jsxs("td", { className: "px-3 py-2 text-xs", children: [
      it.city ?? "—",
      it.region ? `, ${it.region}` : ""
    ] }),
    /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsx("span", { className: `rounded px-2 py-0.5 text-xs ${statusColor(it.status)}`, children: it.status }) }),
    /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-xs text-muted-foreground", children: it.last_outcome ?? "—" }),
    /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right tabular-nums", children: it.ai_score == null ? "—" : it.ai_score.toFixed(0) }),
    /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right tabular-nums", children: it.touch_count }),
    /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right text-xs text-muted-foreground", children: fmtDate(it.last_touch_at) })
  ] });
}
export {
  FollowupDrilldownPage as component
};
