import { jsxs, jsx } from "react/jsx-runtime";
import { u as useServerFn } from "./useServerFn-DL2oePlL.js";
import { useQuery } from "@tanstack/react-query";
import { A as AdminLayout } from "./admin-layout-BNp_05PW.js";
import { c as createSsrRpc } from "./cities.functions-XBYRqf13.js";
import { r as requireSupabaseAuth } from "./auth-middleware-rMMNsPLB.js";
import { c as createServerFn } from "../server.js";
import "react";
import "@tanstack/react-router";
import "lucide-react";
import "./router-BvRNdW25.js";
import "./site-footer-defaults-C7gHxS5b.js";
import "zod";
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
const listQueuedEmails = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("d1f6d9d80aa685de7a58e391a2f9844c5fbccdefb29a723cdd4f48b3729661a7"));
function fmtWhen(iso) {
  const d = new Date(iso);
  const now = Date.now();
  const diffMs = d.getTime() - now;
  const mins = Math.round(diffMs / 6e4);
  const rel = mins < 60 ? `in ${mins}m` : mins < 60 * 24 ? `in ${Math.round(mins / 60)}h` : `in ${Math.round(mins / (60 * 24))}d`;
  return `${d.toLocaleString()} (${rel})`;
}
function EmailQueuePage() {
  const fetchQueue = useServerFn(listQueuedEmails);
  const {
    data,
    isLoading,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ["email-queue"],
    queryFn: () => fetchQueue(),
    staleTime: 3e4
  });
  const emails = data?.emails ?? [];
  const hostCount = emails.filter((e) => e.source === "host_drip").length;
  const renterCount = emails.filter((e) => e.source === "renter_drip").length;
  return /* @__PURE__ */ jsxs(AdminLayout, { title: "Email queue", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Email queue" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Pending drip emails scheduled for a future date." })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: () => refetch(), className: "rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted", children: isFetching ? "Refreshing…" : "Refresh" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 grid grid-cols-3 gap-3 text-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border bg-card p-3", children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Total queued" }),
        /* @__PURE__ */ jsx("div", { className: "text-xl font-semibold", children: emails.length })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border bg-card p-3", children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Host drip" }),
        /* @__PURE__ */ jsx("div", { className: "text-xl font-semibold", children: hostCount })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border bg-card p-3", children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Renter drip" }),
        /* @__PURE__ */ jsx("div", { className: "text-xl font-semibold", children: renterCount })
      ] })
    ] }),
    data && !data.ok && /* @__PURE__ */ jsx("div", { className: "mt-4 rounded-md border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-700", children: data.error }),
    /* @__PURE__ */ jsx("div", { className: "mt-4 overflow-x-auto rounded-md border border-border", children: /* @__PURE__ */ jsxs("table", { className: "min-w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-muted/50 text-xs uppercase text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-left", children: "Scheduled" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-left", children: "List" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-left", children: "Recipient" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-left", children: "Step" }),
        /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-left", children: "Subject / kind" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        isLoading && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "px-3 py-4 text-center text-muted-foreground", children: "Loading…" }) }),
        !isLoading && emails.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "px-3 py-4 text-center text-muted-foreground", children: "No future-scheduled emails." }) }),
        emails.map((e) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
          /* @__PURE__ */ jsx("td", { className: "whitespace-nowrap px-3 py-2 text-xs", children: fmtWhen(e.scheduled_at) }),
          /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-0.5 text-xs ${e.source === "host_drip" ? "bg-blue-500/10 text-blue-700" : "bg-emerald-500/10 text-emerald-700"}`, children: e.source === "host_drip" ? "Host" : "Renter" }) }),
          /* @__PURE__ */ jsxs("td", { className: "px-3 py-2", children: [
            /* @__PURE__ */ jsx("div", { className: "font-medium", children: e.email }),
            e.name && /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: e.name })
          ] }),
          /* @__PURE__ */ jsxs("td", { className: "px-3 py-2", children: [
            "#",
            e.step
          ] }),
          /* @__PURE__ */ jsxs("td", { className: "px-3 py-2", children: [
            /* @__PURE__ */ jsx("div", { className: "font-medium", children: e.subject ?? "—" }),
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: e.kind })
          ] })
        ] }, `${e.source}-${e.id}`))
      ] })
    ] }) })
  ] });
}
export {
  EmailQueuePage as component
};
