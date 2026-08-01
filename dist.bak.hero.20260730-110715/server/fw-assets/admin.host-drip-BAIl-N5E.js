import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { c as createSsrRpc } from "./cities.functions-DKA5O9eJ.js";
import { u as useServerFn } from "./useServerFn-DL2oePlL.js";
import { c as createServerFn } from "../server.js";
import { useQuery } from "@tanstack/react-query";
import { r as requireSupabaseAuth } from "./auth-middleware-C3cX-s7a.js";
import "zod";
import "./client.server-D5ro3rAQ.js";
import "@supabase/supabase-js";
import "react";
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
const getHostDripStats = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("419f7deee03a76702e51abbc66e02377056ac5fe32a2a7913144effb4762cdd4"));
const runPollNow = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("2f96e28ab0cab80fb423363e2fc82d7a7cd1e2b2a4032f5e6f3a78b19fa8c75d"));
const runSendNow = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("52b7ea1eb8607930f2ec1ff76325a2262d69193f5d6b39cf7c3e048bfab8886b"));
const runBroadcastShareLink = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("1641fc6aaa81dd89297aae0b6c529dec914ca7858d43d0f98d6c0f5dd16003a8"));
function Page() {
  const fetcher = useServerFn(getHostDripStats);
  const poll = useServerFn(runPollNow);
  const send = useServerFn(runSendNow);
  const broadcast = useServerFn(runBroadcastShareLink);
  const {
    data,
    refetch,
    isLoading
  } = useQuery({
    queryKey: ["host-drip-stats"],
    queryFn: () => fetcher()
  });
  return /* @__PURE__ */ jsxs("main", { className: "max-w-5xl mx-auto p-6 space-y-6", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Host drip (7-week sequence)" }),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-600", children: "Hosts are pulled from Sharetribe (any user with at least one listing in any state). New hosts get a 7-touch weekly sequence starting ~5 min after the poller picks them up." }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-3 flex-wrap", children: [
      /* @__PURE__ */ jsx("button", { className: "px-4 py-2 rounded bg-sky-600 text-white", onClick: async () => {
        await poll();
        refetch();
      }, children: "Poll Sharetribe now" }),
      /* @__PURE__ */ jsx("button", { className: "px-4 py-2 rounded bg-slate-700 text-white", onClick: async () => {
        await send();
        refetch();
      }, children: "Drain send queue now" }),
      /* @__PURE__ */ jsx("button", { className: "px-4 py-2 rounded bg-blue-700 text-white", onClick: async () => {
        if (!confirm("Queue the 'keep more of your profits' broadcast to ALL active hosts?")) return;
        const r = await broadcast();
        alert(`Queued ${r.queued} (skipped ${r.skipped} already sent, of ${r.total} active).`);
        refetch();
      }, children: "Broadcast: share-link profits" }),
      /* @__PURE__ */ jsx("button", { className: "px-4 py-2 rounded border", onClick: () => refetch(), children: "Refresh" })
    ] }),
    isLoading || !data ? /* @__PURE__ */ jsx("p", { children: "Loading…" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("section", { className: "grid grid-cols-2 md:grid-cols-6 gap-3", children: [
        /* @__PURE__ */ jsx(Stat, { label: "Subscribers", value: data.counts.subs }),
        /* @__PURE__ */ jsx(Stat, { label: "Active", value: data.counts.active }),
        /* @__PURE__ */ jsx(Stat, { label: "Unsubscribed", value: data.counts.unsubscribed }),
        /* @__PURE__ */ jsx(Stat, { label: "Sent", value: data.counts.sent }),
        /* @__PURE__ */ jsx(Stat, { label: "Pending", value: data.counts.pending }),
        /* @__PURE__ */ jsx(Stat, { label: "Failed", value: data.counts.failed })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "text-sm text-slate-600", children: [
        "Last polled: ",
        data.state?.last_polled_at || "never"
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold mb-2", children: "Recent hosts" }),
        /* @__PURE__ */ jsxs("table", { className: "w-full text-sm border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-left border-b", children: [
            /* @__PURE__ */ jsx("th", { children: "Email" }),
            /* @__PURE__ */ jsx("th", { children: "Name" }),
            /* @__PURE__ */ jsx("th", { children: "Status" }),
            /* @__PURE__ */ jsx("th", { children: "Scheduled?" }),
            /* @__PURE__ */ jsx("th", { children: "Added" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: data.recent.map((r, i) => /* @__PURE__ */ jsxs("tr", { className: "border-b", children: [
            /* @__PURE__ */ jsx("td", { children: r.email }),
            /* @__PURE__ */ jsx("td", { children: r.name || "—" }),
            /* @__PURE__ */ jsx("td", { children: r.status }),
            /* @__PURE__ */ jsx("td", { children: r.sequence_scheduled ? "yes" : "no" }),
            /* @__PURE__ */ jsx("td", { children: new Date(r.created_at).toLocaleString() })
          ] }, i)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold mb-2", children: "Next 40 queued / recent emails" }),
        /* @__PURE__ */ jsxs("table", { className: "w-full text-sm border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-left border-b", children: [
            /* @__PURE__ */ jsx("th", { children: "Kind" }),
            /* @__PURE__ */ jsx("th", { children: "Status" }),
            /* @__PURE__ */ jsx("th", { children: "Subject" }),
            /* @__PURE__ */ jsx("th", { children: "Scheduled" }),
            /* @__PURE__ */ jsx("th", { children: "Sent" }),
            /* @__PURE__ */ jsx("th", { children: "Error" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: data.upcoming.map((r, i) => /* @__PURE__ */ jsxs("tr", { className: "border-b", children: [
            /* @__PURE__ */ jsx("td", { children: r.kind }),
            /* @__PURE__ */ jsx("td", { children: r.status }),
            /* @__PURE__ */ jsx("td", { className: "truncate max-w-xs", children: r.subject || "—" }),
            /* @__PURE__ */ jsx("td", { children: new Date(r.scheduled_at).toLocaleString() }),
            /* @__PURE__ */ jsx("td", { children: r.sent_at ? new Date(r.sent_at).toLocaleString() : "—" }),
            /* @__PURE__ */ jsx("td", { className: "text-red-600 text-xs", children: r.error || "" })
          ] }, i)) })
        ] })
      ] })
    ] })
  ] });
}
function Stat({
  label,
  value
}) {
  return /* @__PURE__ */ jsxs("div", { className: "border rounded p-4", children: [
    /* @__PURE__ */ jsx("div", { className: "text-xs uppercase text-slate-500", children: label }),
    /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold", children: value })
  ] });
}
export {
  Page as component
};
