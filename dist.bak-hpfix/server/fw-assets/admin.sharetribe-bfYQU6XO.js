import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { u as useServerFn } from "./useServerFn-DL2oePlL.js";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { A as AdminLayout } from "./admin-layout-Ql_EyRxP.js";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import { c as createServerFn } from "../server.js";
import { B as Button } from "./button-TjZkfKyC.js";
import { C as Card, a as CardHeader, b as CardTitle, c as CardContent } from "./card-DK4TJU2r.js";
import { B as Badge } from "./badge-DyfXZgLs.js";
import { toast } from "sonner";
import "react";
import "@tanstack/react-router";
import "lucide-react";
import "./router-BPpbotmS.js";
import "./site-footer-defaults-Brwu0BKb.js";
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
import "./renter-drip.server-CFIkIdnw.js";
import "node:fs";
import "node:path";
import "./host-drip.server-BAToYGOj.js";
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
import "@radix-ui/react-slot";
import "class-variance-authority";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
const getSharetribeDashboard = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("18fc7ec8f596387b612cbc87b727812c6aa7557c5310ec22e417151cb74cc050"));
const setAlertStatus = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid(),
  status: z.enum(["open", "reviewed", "dismissed", "escalated"]),
  notes: z.string().max(1e3).optional()
}).parse(d)).handler(createSsrRpc("4d0cd24e723ec6ba43931cce9161ed84be4f762f608196f5b4f9567de9bb6ddf"));
const triggerSharetribeSyncNow = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("a58c7d9c7ff62162cf6acd63db7ec7fbab6f9ba46d2c06470835084aa6602782"));
function fmtMoney(cents, currency) {
  if (cents == null) return "—";
  return `${(cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: currency || "USD"
  })}`;
}
function fmtTime(s) {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleString();
}
function ago(s) {
  if (!s) return "never";
  const diff = Date.now() - new Date(s).getTime();
  const m = Math.round(diff / 6e4);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
function SharetribeMirrorPage() {
  const fetchDash = useServerFn(getSharetribeDashboard);
  const triggerSync = useServerFn(triggerSharetribeSyncNow);
  const updateAlert = useServerFn(setAlertStatus);
  const qc = useQueryClient();
  const {
    data,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["st-dashboard"],
    queryFn: () => fetchDash(),
    refetchInterval: 6e4
  });
  const syncMut = useMutation({
    mutationFn: () => triggerSync(),
    onSuccess: (r) => {
      if (r?.ok) {
        toast.success(`Synced: ${r.result?.transactions ?? 0} tx, ${r.result?.messages ?? 0} msgs, ${r.result?.alerts ?? 0} alerts`);
      } else {
        toast.error(`Sync failed: ${r?.error ?? "unknown"}`);
      }
      qc.invalidateQueries({
        queryKey: ["st-dashboard"]
      });
    }
  });
  const alertMut = useMutation({
    mutationFn: (v) => updateAlert({
      data: v
    }),
    onSuccess: () => qc.invalidateQueries({
      queryKey: ["st-dashboard"]
    })
  });
  return /* @__PURE__ */ jsx(AdminLayout, { children: /* @__PURE__ */ jsxs("div", { className: "space-y-6 p-4 md:p-6 max-w-7xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4 flex-wrap", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold", children: "Sharetribe data mirror" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Local copy of users, listings, transactions, and messages. Auto-syncs every 15 minutes." })
      ] }),
      /* @__PURE__ */ jsx(Button, { onClick: () => syncMut.mutate(), disabled: syncMut.isPending, children: syncMut.isPending ? "Syncing…" : "Sync now" })
    ] }),
    isLoading || !data ? /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Loading…" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-5 gap-3", children: [
        /* @__PURE__ */ jsx(Stat, { label: "Users", value: data.counts.users }),
        /* @__PURE__ */ jsx(Stat, { label: "Listings", value: data.counts.listings }),
        /* @__PURE__ */ jsx(Stat, { label: "Transactions", value: data.counts.transactions }),
        /* @__PURE__ */ jsx(Stat, { label: "Messages", value: data.counts.messages }),
        /* @__PURE__ */ jsx(Stat, { label: "Open alerts", value: data.counts.open_alerts, tone: data.counts.open_alerts > 0 ? "danger" : "ok" })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Sync state" }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3 text-sm", children: data.syncState.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-muted-foreground col-span-3", children: 'No sync has run yet. Hit "Sync now".' }) : data.syncState.map((s) => /* @__PURE__ */ jsxs("div", { className: "border rounded-md p-3", children: [
          /* @__PURE__ */ jsx("div", { className: "font-medium capitalize", children: s.resource }),
          /* @__PURE__ */ jsxs("div", { className: "text-muted-foreground text-xs mt-1", children: [
            "Last run: ",
            ago(s.last_run_at),
            " · ",
            s.last_run_status ?? "—"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-muted-foreground text-xs", children: [
            "Synced through: ",
            fmtTime(s.last_synced_at)
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-muted-foreground text-xs", children: [
            "Last batch: ",
            s.last_run_rows,
            " rows"
          ] }),
          s.last_run_error ? /* @__PURE__ */ jsx("div", { className: "text-destructive text-xs mt-1 break-all", children: s.last_run_error }) : null
        ] }, s.resource)) }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Funnel: message → booking" }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-3 text-sm", children: [
          /* @__PURE__ */ jsx(Stat, { label: "Total transactions", value: data.funnel.tx_with_messages }),
          /* @__PURE__ */ jsx(Stat, { label: "Confirmed / completed", value: data.funnel.tx_confirmed }),
          /* @__PURE__ */ jsx(Stat, { label: "Conversion rate", value: `${(data.funnel.rate * 100).toFixed(1)}%` })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Security alerts" }) }),
        /* @__PURE__ */ jsx(CardContent, { children: data.alerts.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: "No alerts. Healthy." }) : /* @__PURE__ */ jsx("div", { className: "space-y-2", children: data.alerts.map((a) => /* @__PURE__ */ jsxs("div", { className: "border rounded-md p-3 text-sm flex items-start gap-3 flex-wrap", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1 flex-wrap", children: [
              /* @__PURE__ */ jsx(Badge, { variant: a.severity === "high" ? "destructive" : a.severity === "medium" ? "default" : "secondary", children: a.category }),
              /* @__PURE__ */ jsx(Badge, { variant: "outline", children: a.severity }),
              /* @__PURE__ */ jsx(Badge, { variant: "outline", children: a.status }),
              /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: ago(a.created_at) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "text-foreground break-words", children: a.snippet }),
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground mt-1 break-all", children: [
              "Tx: ",
              a.transaction_st_id ?? "—",
              " · Sender: ",
              a.sender_st_id ?? "—",
              a.matched_terms.length ? ` · Matched: ${a.matched_terms.join(", ")}` : ""
            ] })
          ] }),
          a.status === "open" ? /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: () => alertMut.mutate({
              id: a.id,
              status: "reviewed"
            }), children: "Mark reviewed" }),
            /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: () => alertMut.mutate({
              id: a.id,
              status: "dismissed"
            }), children: "Dismiss" })
          ] }) : null
        ] }, a.id)) }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Recent transactions" }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "text-sm w-full", children: [
          /* @__PURE__ */ jsx("thead", { className: "text-left text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "py-1 pr-3", children: "When" }),
            /* @__PURE__ */ jsx("th", { className: "py-1 pr-3", children: "State" }),
            /* @__PURE__ */ jsx("th", { className: "py-1 pr-3", children: "Listing" }),
            /* @__PURE__ */ jsx("th", { className: "py-1 pr-3", children: "Gross" }),
            /* @__PURE__ */ jsx("th", { className: "py-1 pr-3", children: "Tx ID" })
          ] }) }),
          /* @__PURE__ */ jsxs("tbody", { children: [
            data.recent_transactions.map((t) => /* @__PURE__ */ jsxs("tr", { className: "border-t", children: [
              /* @__PURE__ */ jsx("td", { className: "py-1 pr-3 whitespace-nowrap", children: ago(t.last_transitioned_at) }),
              /* @__PURE__ */ jsx("td", { className: "py-1 pr-3", children: t.state ?? "—" }),
              /* @__PURE__ */ jsx("td", { className: "py-1 pr-3", children: t.listing_title ?? "—" }),
              /* @__PURE__ */ jsx("td", { className: "py-1 pr-3", children: fmtMoney(t.payin_total_cents, t.currency) }),
              /* @__PURE__ */ jsxs("td", { className: "py-1 pr-3 text-xs text-muted-foreground", children: [
                t.sharetribe_id.slice(0, 8),
                "…"
              ] })
            ] }, t.sharetribe_id)),
            data.recent_transactions.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "py-3 text-muted-foreground", children: "No transactions yet." }) }) : null
          ] })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Recent messages" }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "space-y-2", children: data.recent_messages.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: "No messages yet." }) : data.recent_messages.map((m) => /* @__PURE__ */ jsxs("div", { className: "border rounded-md p-2 text-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground mb-1", children: [
            fmtTime(m.created_at_st),
            " · sender ",
            m.sender_st_id?.slice(0, 8) ?? "—",
            " · tx",
            " ",
            m.transaction_st_id?.slice(0, 8) ?? "—"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "break-words", children: m.content })
        ] }, m.id)) }) })
      ] }),
      /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => refetch(), children: "Refresh" })
    ] })
  ] }) });
}
function Stat({
  label,
  value,
  tone
}) {
  return /* @__PURE__ */ jsxs("div", { className: `border rounded-md p-3 ${tone === "danger" ? "border-destructive/40 bg-destructive/5" : ""}`, children: [
    /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: "text-xl font-semibold", children: value })
  ] });
}
export {
  SharetribeMirrorPage as component
};
