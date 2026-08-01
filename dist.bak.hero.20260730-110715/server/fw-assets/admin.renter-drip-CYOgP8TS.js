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
const getRenterDripStats = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("64d1b9724b52363c0c9e704af2dc508be1bd0de12332f0add16958d200d0b3e5"));
const runPollNow = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("176ef6087ced490f189541f2aef8c7864c1c8160a95b0020bed18a856e5fabbc"));
const runSendNow = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("4e451ce5c630005e8b740159d06ae4c17becf1790a22bd7506759961fa195442"));
const runBackfillAll = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("28f46cc2d7c87c7f94dcfbc4c7f251e6730af076d6e5c76265185a10115056d2"));
function Page() {
  const fetcher = useServerFn(getRenterDripStats);
  const poll = useServerFn(runPollNow);
  const send = useServerFn(runSendNow);
  const backfill = useServerFn(runBackfillAll);
  const {
    data,
    refetch,
    isLoading
  } = useQuery({
    queryKey: ["renter-drip-stats"],
    queryFn: () => fetcher()
  });
  return /* @__PURE__ */ jsxs("main", { className: "max-w-5xl mx-auto p-6 space-y-6", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Renter drip" }),
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
        if (!confirm("Pull ALL existing Sharetribe customers and queue the 3-day sequence for any not already scheduled?")) return;
        const r = await backfill();
        alert(`Fetched ${r.fetched} across ${r.pages} pages. Inserted ${r.inserted}, scheduled ${r.scheduled}, skipped ${r.skipped}.`);
        refetch();
      }, children: "Backfill ALL existing Sharetribe customers" }),
      /* @__PURE__ */ jsx("button", { className: "px-4 py-2 rounded border", onClick: () => refetch(), children: "Refresh" })
    ] }),
    isLoading || !data ? /* @__PURE__ */ jsx("p", { children: "Loading…" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("section", { className: "grid grid-cols-3 gap-4", children: [
        /* @__PURE__ */ jsx(Stat, { label: "Subscribers", value: data.counts.subs }),
        /* @__PURE__ */ jsx(Stat, { label: "Active", value: data.counts.active }),
        /* @__PURE__ */ jsx(Stat, { label: "Unsubscribed", value: data.counts.unsubscribed })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "text-sm text-slate-600", children: [
        "Last polled: ",
        data.state?.last_polled_at || "never",
        /* @__PURE__ */ jsx("br", {}),
        "Cursor: ",
        data.state?.last_st_created_at || "—"
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold mb-2", children: "Recent subscribers" }),
        /* @__PURE__ */ jsxs("table", { className: "w-full text-sm border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-left border-b", children: [
            /* @__PURE__ */ jsx("th", { children: "Email" }),
            /* @__PURE__ */ jsx("th", { children: "Name" }),
            /* @__PURE__ */ jsx("th", { children: "Location" }),
            /* @__PURE__ */ jsx("th", { children: "ZIP" }),
            /* @__PURE__ */ jsx("th", { children: "Status" }),
            /* @__PURE__ */ jsx("th", { children: "Joined" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: data.recent.map((r, i) => /* @__PURE__ */ jsxs("tr", { className: "border-b", children: [
            /* @__PURE__ */ jsx("td", { children: r.email }),
            /* @__PURE__ */ jsx("td", { children: r.name }),
            /* @__PURE__ */ jsx("td", { children: r.city ? `${r.city}, ${r.state_code || ""}` : "—" }),
            /* @__PURE__ */ jsx("td", { children: r.zip || "—" }),
            /* @__PURE__ */ jsx("td", { children: r.status }),
            /* @__PURE__ */ jsx("td", { children: new Date(r.created_at).toLocaleString() })
          ] }, i)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold mb-2", children: "Next 30 queued/recent emails" }),
        /* @__PURE__ */ jsxs("table", { className: "w-full text-sm border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-left border-b", children: [
            /* @__PURE__ */ jsx("th", { children: "Kind" }),
            /* @__PURE__ */ jsx("th", { children: "Status" }),
            /* @__PURE__ */ jsx("th", { children: "Subject" }),
            /* @__PURE__ */ jsx("th", { children: "Scheduled" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: data.pending.map((r, i) => /* @__PURE__ */ jsxs("tr", { className: "border-b", children: [
            /* @__PURE__ */ jsx("td", { children: r.kind }),
            /* @__PURE__ */ jsx("td", { children: r.status }),
            /* @__PURE__ */ jsx("td", { children: r.subject || "—" }),
            /* @__PURE__ */ jsx("td", { children: new Date(r.scheduled_at).toLocaleString() })
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
