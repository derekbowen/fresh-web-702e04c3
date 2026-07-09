import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { u as useServerFn } from "./useServerFn-DL2oePlL.js";
import { useQuery } from "@tanstack/react-query";
import { c as createSsrRpc } from "./cities.functions-XBYRqf13.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-rMMNsPLB.js";
import { c as createServerFn } from "../server.js";
import { BarChart3, Users, Package, Network, Receipt, DollarSign, Star, Beaker, Globe, FlaskConical, LogOut, RefreshCw } from "lucide-react";
import { s as supabase } from "./client-Dh5RMKgP.js";
import { useNavigate } from "@tanstack/react-router";
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
const EnvSchema = z.enum(["live", "test"]);
const getMarketplaceOverview = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  env: EnvSchema
}).parse(d)).handler(createSsrRpc("768ac784ec8e9da92d8be65face66da6227f8301000ae55ccc9931b2457d9945"));
const listMarketplaceResource = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  env: EnvSchema,
  resource: z.enum(["users", "listings", "transactions", "reviews"]),
  page: z.number().int().min(1).max(500).default(1),
  perPage: z.number().int().min(1).max(100).default(25),
  keywords: z.string().max(200).optional(),
  state: z.string().max(50).optional(),
  // listings state filter
  lastTransition: z.string().max(100).optional()
  // transactions
}).parse(d)).handler(createSsrRpc("9f87402ed2cefe652d0bfbe21bdaabbe39d4fecda09d9ef09d1bde32a3865174"));
const sdkTestPing = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("3220eb433800b25c5f810959f64879d73d18cfeb19d9818ea64c407c59da931c"));
createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  keywords: z.string().max(200).optional(),
  page: z.number().int().min(1).max(50).optional(),
  perPage: z.number().int().min(1).max(50).optional()
}).parse(d)).handler(createSsrRpc("6e4608bf43dd702cc180a74cf069bb720bf52a845530541f7254f38a4bcd4cc6"));
const sdkTestSyncListings = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("6b3775c9075af404e7422ce4ee23e6a3ac9867e895ae2e4a9c80cd68d478c21f"));
const sdkTestLatestSyncRun = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("a2cd98b5ad2648e15b0286a148f663249099824e5f4b0949bc5dd0c09c97b584"));
const sdkTestListListings = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  search: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  heated: z.enum(["yes", "no", "any"]).optional(),
  minGuests: z.number().int().min(0).max(1e3).optional(),
  page: z.number().int().min(1).max(500).optional(),
  perPage: z.number().int().min(1).max(100).optional()
}).parse(d)).handler(createSsrRpc("7c3f919066b044439f7f2c68b3098e9b82179ed6b72e2e5cbd4d1a78217e2af0"));
const NAV = [{
  id: "overview",
  label: "Overview",
  icon: BarChart3
}, {
  id: "users",
  label: "Users",
  icon: Users
}, {
  id: "listings",
  label: "Listings",
  icon: Package
}, {
  id: "catalog",
  label: "Catalog",
  icon: Network
}, {
  id: "transactions",
  label: "Transactions",
  icon: Receipt
}, {
  id: "gmv",
  label: "GMV",
  icon: DollarSign
}, {
  id: "reviews",
  label: "Reviews",
  icon: Star
}, {
  id: "sdk_test",
  label: "SDK Test (cardbay)",
  icon: Beaker
}];
function fmtMoney(cents, currency = "USD") {
  return `$${(cents / 100).toLocaleString(void 0, {
    maximumFractionDigits: 0
  })} ${currency}`;
}
function MarketplaceConsole() {
  const navigate = useNavigate();
  const [view, setView] = useState(() => {
    if (typeof window === "undefined") return "overview";
    return localStorage.getItem("mc.view") || "overview";
  });
  const [env, setEnv] = useState(() => {
    if (typeof window === "undefined") return "live";
    return localStorage.getItem("mc.env") || "live";
  });
  const [email, setEmail] = useState(null);
  useEffect(() => {
    supabase.auth.getUser().then(({
      data
    }) => setEmail(data.user?.email ?? null));
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("mc.view", view);
  }, [view]);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("mc.env", env);
  }, [env]);
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({
      to: "/auth",
      search: {
        mode: "signin",
        redirect: "/admin/marketplace"
      }
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen bg-slate-50 text-slate-900", children: [
    /* @__PURE__ */ jsxs("aside", { className: "w-72 shrink-0 bg-slate-950 text-slate-100 flex flex-col", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-5 border-b border-slate-800 flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center", children: /* @__PURE__ */ jsx(BarChart3, { className: "w-6 h-6" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "font-bold leading-tight", children: "Marketplace" }),
          /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-400", children: "Dashboard" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("nav", { className: "flex-1 p-3 space-y-1", children: NAV.map((n) => {
        const Icon = n.icon;
        const active = view === n.id;
        return /* @__PURE__ */ jsxs("button", { onClick: () => setView(n.id), className: `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${active ? "bg-blue-600/20 text-white ring-1 ring-blue-500/40" : "text-slate-300 hover:bg-slate-800/60 hover:text-white"}`, children: [
          /* @__PURE__ */ jsx(Icon, { className: "w-4 h-4 opacity-80" }),
          n.label
        ] }, n.id);
      }) }),
      /* @__PURE__ */ jsxs("div", { className: "p-4 border-t border-slate-800 space-y-3", children: [
        /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-wider text-slate-500", children: "Sharetribe env" }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-1 rounded-lg bg-slate-800/60 p-1", children: [
          /* @__PURE__ */ jsxs("button", { onClick: () => setEnv("live"), className: `flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition ${env === "live" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`, children: [
            /* @__PURE__ */ jsx(Globe, { className: "w-3.5 h-3.5" }),
            " Live"
          ] }),
          /* @__PURE__ */ jsxs("button", { onClick: () => setEnv("test"), className: `flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition ${env === "test" ? "bg-amber-500/90 text-slate-900" : "text-slate-400 hover:text-white"}`, children: [
            /* @__PURE__ */ jsx(FlaskConical, { className: "w-3.5 h-3.5" }),
            " Test"
          ] })
        ] }),
        email && /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-400 truncate", children: email }),
        /* @__PURE__ */ jsxs("button", { onClick: signOut, className: "w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm text-slate-300 hover:bg-slate-800 hover:text-white", children: [
          /* @__PURE__ */ jsx(LogOut, { className: "w-4 h-4" }),
          " Sign out"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 p-8 overflow-x-auto", children: [
      /* @__PURE__ */ jsx(ViewHeader, { view, env }),
      /* @__PURE__ */ jsx(ViewBody, { view, env })
    ] })
  ] });
}
function ViewHeader({
  view,
  env
}) {
  const title = NAV.find((n) => n.id === view)?.label ?? "";
  return /* @__PURE__ */ jsxs("div", { className: "flex items-end justify-between mb-6", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold tracking-tight", children: title }),
    /* @__PURE__ */ jsxs("span", { className: `text-xs font-semibold px-2.5 py-1 rounded-full ${env === "live" ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200" : "bg-amber-100 text-amber-800 ring-1 ring-amber-200"}`, children: [
      env.toUpperCase(),
      " marketplace"
    ] })
  ] });
}
function ViewBody({
  view,
  env
}) {
  if (view === "overview") return /* @__PURE__ */ jsx(OverviewView, { env });
  if (view === "gmv") return /* @__PURE__ */ jsx(GmvView, { env });
  if (view === "users") return /* @__PURE__ */ jsx(ResourceView, { env, resource: "users" });
  if (view === "listings") return /* @__PURE__ */ jsx(ResourceView, { env, resource: "listings" });
  if (view === "transactions") return /* @__PURE__ */ jsx(ResourceView, { env, resource: "transactions" });
  if (view === "reviews") return /* @__PURE__ */ jsx(ResourceView, { env, resource: "reviews" });
  if (view === "catalog") return /* @__PURE__ */ jsx(CatalogView, { env });
  if (view === "sdk_test") return /* @__PURE__ */ jsx(SdkTestView, { env });
  return /* @__PURE__ */ jsx(PlaceholderView, { view });
}
function SdkTestView({
  env
}) {
  const pingFn = useServerFn(sdkTestPing);
  const syncFn = useServerFn(sdkTestSyncListings);
  const latestRunFn = useServerFn(sdkTestLatestSyncRun);
  const listFn = useServerFn(sdkTestListListings);
  const [pingTriggered, setPingTriggered] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [heated, setHeated] = useState("any");
  const [minGuests, setMinGuests] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 25;
  const ping = useQuery({
    queryKey: ["mc.sdk_test.ping"],
    queryFn: () => pingFn(),
    enabled: pingTriggered
  });
  const latestRun = useQuery({
    queryKey: ["mc.sdk_test.latest_run"],
    queryFn: () => latestRunFn()
  });
  const listings = useQuery({
    queryKey: ["mc.sdk_test.list", search, city, heated, minGuests, page],
    queryFn: () => listFn({
      data: {
        search: search || void 0,
        city: city || void 0,
        heated,
        minGuests: minGuests ? Number(minGuests) : void 0,
        page,
        perPage
      }
    })
  });
  useEffect(() => {
    setPingTriggered(false);
  }, [env]);
  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await syncFn();
      setSyncResult(res);
      await Promise.all([latestRun.refetch(), listings.refetch()]);
    } finally {
      setSyncing(false);
    }
  }
  if (env !== "test") {
    return /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900", children: [
      "The cardbay Marketplace API SDK is only wired against the ",
      /* @__PURE__ */ jsx("b", { children: "TEST" }),
      " marketplace. Switch the env toggle in the sidebar to ",
      /* @__PURE__ */ jsx("b", { children: "Test" }),
      " to use it."
    ] });
  }
  const totalPages = listings.data ? Math.max(1, Math.ceil(listings.data.total / perPage)) : 1;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxs("section", { className: "rounded-xl border bg-white p-6 shadow-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center", children: /* @__PURE__ */ jsx(Beaker, { className: "w-5 h-5 text-white" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "SDK Connection Test" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: "Verify the Sharetribe TEST marketplace SDK is reachable." })
        ] })
      ] }),
      !pingTriggered && !ping.isLoading && /* @__PURE__ */ jsxs("button", { onClick: () => setPingTriggered(true), className: "inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition shadow-sm", children: [
        /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4" }),
        " Ping SDK"
      ] }),
      ping.isLoading && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-sm text-slate-600", children: [
        /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4 animate-spin" }),
        " Pinging test marketplace…"
      ] }),
      ping.data && /* @__PURE__ */ jsx(SdkPingCard, { data: ping.data, onRetry: () => ping.refetch() })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "rounded-xl border bg-white p-6 shadow-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4 mb-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Sync TEST listings to database" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: "Pulls all pool listings from the TEST marketplace and upserts them into the local database for fast browsing, filtering, and audit history." })
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: handleSync, disabled: syncing, className: "inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition shadow-sm disabled:opacity-60", children: [
          /* @__PURE__ */ jsx(RefreshCw, { className: `w-4 h-4 ${syncing ? "animate-spin" : ""}` }),
          syncing ? "Syncing…" : "Sync now"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("dl", { className: "grid grid-cols-2 md:grid-cols-4 gap-3 text-sm", children: [
        /* @__PURE__ */ jsx(Field, { label: "Rows in DB", value: String(latestRun.data?.rowCount ?? "—") }),
        /* @__PURE__ */ jsx(Field, { label: "Last sync", value: latestRun.data?.run?.finishedAt ? new Date(latestRun.data.run.finishedAt).toLocaleString() : latestRun.data?.run?.startedAt ? `started ${new Date(latestRun.data.run.startedAt).toLocaleString()}` : "never" }),
        /* @__PURE__ */ jsx(Field, { label: "Last fetched", value: String(latestRun.data?.run?.totalFetched ?? "—") }),
        /* @__PURE__ */ jsx(Field, { label: "Last result", value: latestRun.data?.run?.error ? `error: ${latestRun.data.run.error}` : latestRun.data?.run ? `+${latestRun.data.run.inserted} / ~${latestRun.data.run.updated}` : "—", className: latestRun.data?.run?.error ? "text-rose-700" : "" })
      ] }),
      syncResult && /* @__PURE__ */ jsx("div", { className: `mt-4 rounded-lg border p-3 text-sm ${syncResult.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-700"}`, children: syncResult.ok ? `Sync complete — fetched ${syncResult.totalFetched}, ${syncResult.inserted} new, ${syncResult.updated} updated.` : `Sync failed: ${syncResult.error}` })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "rounded-lg border bg-white p-5 shadow-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3 flex-wrap gap-2", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Synced pool listings" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsx("input", { value: search, onChange: (e) => {
            setPage(1);
            setSearch(e.target.value);
          }, placeholder: "Search title…", className: "text-sm border rounded px-2.5 py-1.5 w-48" }),
          /* @__PURE__ */ jsx("input", { value: city, onChange: (e) => {
            setPage(1);
            setCity(e.target.value);
          }, placeholder: "City", className: "text-sm border rounded px-2.5 py-1.5 w-36" }),
          /* @__PURE__ */ jsxs("select", { value: heated, onChange: (e) => {
            setPage(1);
            setHeated(e.target.value);
          }, className: "text-sm border rounded px-2 py-1.5", children: [
            /* @__PURE__ */ jsx("option", { value: "any", children: "Heated: any" }),
            /* @__PURE__ */ jsx("option", { value: "yes", children: "Heated: yes" }),
            /* @__PURE__ */ jsx("option", { value: "no", children: "Heated: no" })
          ] }),
          /* @__PURE__ */ jsx("input", { type: "number", min: 0, value: minGuests, onChange: (e) => {
            setPage(1);
            setMinGuests(e.target.value);
          }, placeholder: "Min guests", className: "text-sm border rounded px-2.5 py-1.5 w-28" })
        ] })
      ] }),
      listings.isLoading && /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-sm", children: "Loading…" }),
      listings.data?.error && /* @__PURE__ */ jsxs("p", { className: "text-rose-600 text-sm", children: [
        "Error: ",
        listings.data.error
      ] }),
      listings.data && !listings.data.error && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500 mb-2", children: [
          listings.data.total,
          " matching listing",
          listings.data.total === 1 ? "" : "s",
          latestRun.data?.rowCount != null && ` of ${latestRun.data.rowCount} synced`
        ] }),
        /* @__PURE__ */ jsx(SdkListingsTable, { items: listings.data.items }),
        totalPages > 1 && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mt-3 text-sm", children: [
          /* @__PURE__ */ jsx("button", { onClick: () => setPage((p) => Math.max(1, p - 1)), disabled: page === 1, className: "px-3 py-1.5 rounded border hover:bg-slate-50 disabled:opacity-50", children: "← Prev" }),
          /* @__PURE__ */ jsxs("span", { className: "text-slate-500", children: [
            "Page ",
            page,
            " of ",
            totalPages
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: () => setPage((p) => Math.min(totalPages, p + 1)), disabled: page >= totalPages, className: "px-3 py-1.5 rounded border hover:bg-slate-50 disabled:opacity-50", children: "Next →" })
        ] })
      ] })
    ] })
  ] });
}
function SdkPingCard({
  data,
  onRetry
}) {
  const ok = data.ok;
  return /* @__PURE__ */ jsxs("div", { className: `rounded-lg border p-4 ${ok ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`, children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: `inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-bold ${ok ? "bg-emerald-200 text-emerald-800" : "bg-rose-200 text-rose-800"}`, children: ok ? "✓" : "✕" }),
        /* @__PURE__ */ jsx("span", { className: `font-semibold text-sm ${ok ? "text-emerald-800" : "text-rose-800"}`, children: ok ? "SDK ping successful" : "SDK ping failed" })
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: onRetry, className: "text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded border hover:bg-white/60 transition", children: [
        /* @__PURE__ */ jsx(RefreshCw, { className: "w-3.5 h-3.5" }),
        " Retry"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("dl", { className: "grid grid-cols-2 md:grid-cols-3 gap-3 text-sm", children: [
      /* @__PURE__ */ jsx(Field, { label: "Marketplace name", value: data.marketplaceName ?? "—" }),
      /* @__PURE__ */ jsx(Field, { label: "Marketplace ID", value: data.marketplaceId ?? "—" }),
      /* @__PURE__ */ jsx(Field, { label: "Marketplace URL", value: data.marketplaceUrl ?? "—" }),
      /* @__PURE__ */ jsx(Field, { label: "Client ID suffix", value: `…${data.clientIdSuffix || "?"}` }),
      data.error && /* @__PURE__ */ jsx(Field, { label: "Error", value: data.error, className: "col-span-2 md:col-span-3 text-rose-700" })
    ] })
  ] });
}
function Field({
  label,
  value,
  className = ""
}) {
  return /* @__PURE__ */ jsxs("div", { className, children: [
    /* @__PURE__ */ jsx("dt", { className: "text-xs uppercase tracking-wider text-slate-500", children: label }),
    /* @__PURE__ */ jsx("dd", { className: "font-medium break-all", children: value })
  ] });
}
function SdkListingsTable({
  items
}) {
  if (items.length === 0) return /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-sm", children: "No pool listings." });
  return /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
    /* @__PURE__ */ jsx("thead", { className: "text-left text-xs uppercase tracking-wider text-slate-500 border-b", children: /* @__PURE__ */ jsxs("tr", { children: [
      /* @__PURE__ */ jsx("th", { className: "py-2 pr-3", children: "Title" }),
      /* @__PURE__ */ jsx("th", { className: "py-2 pr-3", children: "State" }),
      /* @__PURE__ */ jsx("th", { className: "py-2 pr-3", children: "City" }),
      /* @__PURE__ */ jsx("th", { className: "py-2 pr-3", children: "Pool type" }),
      /* @__PURE__ */ jsx("th", { className: "py-2 pr-3", children: "Size" }),
      /* @__PURE__ */ jsx("th", { className: "py-2 pr-3", children: "Depth" }),
      /* @__PURE__ */ jsx("th", { className: "py-2 pr-3", children: "Guests" }),
      /* @__PURE__ */ jsx("th", { className: "py-2 pr-3", children: "Heated" }),
      /* @__PURE__ */ jsx("th", { className: "py-2 pr-3", children: "Amenities" }),
      /* @__PURE__ */ jsx("th", { className: "py-2 pr-3", children: "Price / hr" }),
      /* @__PURE__ */ jsx("th", { className: "py-2 pr-3", children: "Type" }),
      /* @__PURE__ */ jsx("th", { className: "py-2 pr-3", children: "ID" })
    ] }) }),
    /* @__PURE__ */ jsx("tbody", { children: items.map((l) => /* @__PURE__ */ jsxs("tr", { className: "border-b last:border-0 align-top", children: [
      /* @__PURE__ */ jsx("td", { className: "py-2 pr-3 font-medium", children: l.title }),
      /* @__PURE__ */ jsx("td", { className: "py-2 pr-3 text-slate-600", children: l.state }),
      /* @__PURE__ */ jsx("td", { className: "py-2 pr-3 text-slate-600", children: l.city ?? "—" }),
      /* @__PURE__ */ jsx("td", { className: "py-2 pr-3 text-slate-600", children: l.poolType ?? "—" }),
      /* @__PURE__ */ jsx("td", { className: "py-2 pr-3 text-slate-600", children: l.poolSize ?? "—" }),
      /* @__PURE__ */ jsx("td", { className: "py-2 pr-3 text-slate-600", children: l.poolDepth ?? "—" }),
      /* @__PURE__ */ jsx("td", { className: "py-2 pr-3 text-slate-600", children: l.maxGuests ?? "—" }),
      /* @__PURE__ */ jsx("td", { className: "py-2 pr-3 text-slate-600", children: l.isHeated == null ? "—" : l.isHeated ? "Yes" : "No" }),
      /* @__PURE__ */ jsx("td", { className: "py-2 pr-3 text-slate-600 max-w-[14rem]", children: l.amenities.length ? l.amenities.join(", ") : "—" }),
      /* @__PURE__ */ jsx("td", { className: "py-2 pr-3", children: l.priceCents != null ? `$${(l.priceCents / 100).toFixed(0)}/hr ${l.priceCurrency ?? ""}` : "—" }),
      /* @__PURE__ */ jsx("td", { className: "py-2 pr-3 text-xs text-slate-500", children: l.listingType ?? "—" }),
      /* @__PURE__ */ jsxs("td", { className: "py-2 pr-3 text-xs text-slate-400 font-mono", children: [
        l.id.slice(0, 8),
        "…"
      ] })
    ] }, l.id)) })
  ] }) });
}
function OverviewView({
  env
}) {
  const fn = useServerFn(getMarketplaceOverview);
  const q = useQuery({
    queryKey: ["mc.overview", env],
    queryFn: () => fn({
      data: {
        env
      }
    })
  });
  if (q.isLoading) return /* @__PURE__ */ jsx("p", { className: "text-slate-500", children: "Loading overview…" });
  if (q.error) return /* @__PURE__ */ jsx(ErrorCard, { title: "Could not load overview", message: q.error.message, onRetry: () => q.refetch() });
  const d = q.data;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsx(Stat, { label: "Users", value: d.counts.users.toLocaleString() }),
      /* @__PURE__ */ jsx(Stat, { label: "Listings", value: d.counts.listings.toLocaleString() }),
      /* @__PURE__ */ jsx(Stat, { label: "Transactions", value: d.counts.transactions.toLocaleString() }),
      /* @__PURE__ */ jsx(Stat, { label: "Reviews", value: d.counts.reviews.toLocaleString() })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsx(Stat, { label: "GMV (30d)", value: fmtMoney(d.gmv.last30dCents, d.gmv.currency), sub: "mirror data, live only" }),
      /* @__PURE__ */ jsx(Stat, { label: "GMV (all time)", value: fmtMoney(d.gmv.allTimeCents, d.gmv.currency), sub: "mirror data, live only" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "text-xs text-slate-400", children: [
      "Fetched ",
      new Date(d.fetchedAt).toLocaleString(),
      " from ",
      env,
      " Integration API."
    ] })
  ] });
}
function GmvView({
  env
}) {
  const fn = useServerFn(getMarketplaceOverview);
  const q = useQuery({
    queryKey: ["mc.gmv", env],
    queryFn: () => fn({
      data: {
        env
      }
    })
  });
  if (q.isLoading) return /* @__PURE__ */ jsx("p", { className: "text-slate-500", children: "Loading GMV…" });
  if (q.error) return /* @__PURE__ */ jsx(ErrorCard, { title: "GMV failed", message: q.error.message, onRetry: () => q.refetch() });
  const d = q.data;
  return /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl", children: [
    /* @__PURE__ */ jsx(Stat, { label: "Last 30 days", value: fmtMoney(d.gmv.last30dCents, d.gmv.currency) }),
    /* @__PURE__ */ jsx(Stat, { label: "All time", value: fmtMoney(d.gmv.allTimeCents, d.gmv.currency) }),
    /* @__PURE__ */ jsx("div", { className: "md:col-span-2 text-sm text-slate-500 bg-white rounded-lg border border-slate-200 p-4", children: "GMV is computed from the Supabase Sharetribe mirror, which syncs Live transactions every 15 minutes. Test environment shows $0 — wire up a test mirror if you want it." })
  ] });
}
const LISTING_STATES = ["", "published", "pendingApproval", "draft", "closed"];
const TX_TRANSITIONS = ["", "transition/confirm-payment", "transition/complete", "transition/cancel"];
function ResourceView({
  env,
  resource
}) {
  const fn = useServerFn(listMarketplaceResource);
  const [page, setPage] = useState(1);
  const [keywords, setKeywords] = useState("");
  const [debounced, setDebounced] = useState("");
  const [state, setState] = useState("");
  const [lastTransition, setLastTransition] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(keywords.trim()), 350);
    return () => clearTimeout(t);
  }, [keywords]);
  useEffect(() => {
    setPage(1);
  }, [env, resource, debounced, state, lastTransition]);
  const q = useQuery({
    queryKey: ["mc.resource", env, resource, page, debounced, state, lastTransition],
    queryFn: () => fn({
      data: {
        env,
        resource,
        page,
        perPage: 25,
        keywords: debounced || void 0,
        state: state || void 0,
        lastTransition: lastTransition || void 0
      }
    })
  });
  const data = q.data;
  const totalPages = data?.meta?.totalPages ?? 1;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3 items-center", children: [
      /* @__PURE__ */ jsx("input", { value: keywords, onChange: (e) => setKeywords(e.target.value), placeholder: `Search ${resource}…`, className: "px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm w-64" }),
      resource === "listings" && /* @__PURE__ */ jsx("select", { value: state, onChange: (e) => setState(e.target.value), className: "px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm", children: LISTING_STATES.map((s) => /* @__PURE__ */ jsx("option", { value: s, children: s || "all states" }, s)) }),
      resource === "transactions" && /* @__PURE__ */ jsx("select", { value: lastTransition, onChange: (e) => setLastTransition(e.target.value), className: "px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm", children: TX_TRANSITIONS.map((s) => /* @__PURE__ */ jsx("option", { value: s, children: s || "all transitions" }, s)) }),
      /* @__PURE__ */ jsxs("button", { onClick: () => q.refetch(), className: "px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm flex items-center gap-1.5 hover:bg-slate-50", children: [
        /* @__PURE__ */ jsx(RefreshCw, { className: "w-3.5 h-3.5" }),
        " Refresh"
      ] }),
      data?.meta?.totalItems != null && /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-500 ml-auto", children: [
        data.meta.totalItems.toLocaleString(),
        " total"
      ] })
    ] }),
    q.isLoading && /* @__PURE__ */ jsxs("p", { className: "text-slate-500", children: [
      "Loading ",
      resource,
      "…"
    ] }),
    q.error && /* @__PURE__ */ jsx(ErrorCard, { title: `Could not load ${resource}`, message: q.error.message, onRetry: () => q.refetch() }),
    data && data.data.length === 0 && !q.isLoading && /* @__PURE__ */ jsxs("p", { className: "text-slate-500 text-sm", children: [
      "No ",
      resource,
      " found."
    ] }),
    data && data.data.length > 0 && /* @__PURE__ */ jsx("div", { className: "bg-white rounded-xl border border-slate-200 overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 text-slate-600 text-xs uppercase tracking-wider", children: /* @__PURE__ */ jsx("tr", { children: columnHeaders(resource).map((h) => /* @__PURE__ */ jsx("th", { className: "text-left px-4 py-3 font-medium", children: h }, h)) }) }),
      /* @__PURE__ */ jsx("tbody", { children: data.data.map((row) => /* @__PURE__ */ jsx(ResourceRow, { row, resource }, row.id)) })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm", children: [
      /* @__PURE__ */ jsx("button", { disabled: page <= 1, onClick: () => setPage((p) => Math.max(1, p - 1)), className: "px-3 py-1.5 rounded border border-slate-300 bg-white disabled:opacity-40", children: "← Prev" }),
      /* @__PURE__ */ jsxs("span", { className: "text-slate-500", children: [
        "Page ",
        page,
        " / ",
        totalPages
      ] }),
      /* @__PURE__ */ jsx("button", { disabled: page >= totalPages, onClick: () => setPage((p) => p + 1), className: "px-3 py-1.5 rounded border border-slate-300 bg-white disabled:opacity-40", children: "Next →" })
    ] })
  ] });
}
function columnHeaders(resource) {
  if (resource === "users") return ["Email", "Name", "Created", "Banned"];
  if (resource === "listings") return ["Title", "State", "Price", "Created"];
  if (resource === "transactions") return ["ID", "Last transition", "Total", "Booking", "Updated"];
  if (resource === "reviews") return ["Rating", "Type", "Content", "Created"];
  return ["ID"];
}
function ResourceRow({
  row,
  resource
}) {
  const a = row.attributes || {};
  if (resource === "users") {
    return /* @__PURE__ */ jsxs("tr", { className: "border-t border-slate-100 hover:bg-slate-50/60", children: [
      /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5 font-mono text-xs", children: a.email || "—" }),
      /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5", children: a.profile?.displayName || `${a.profile?.firstName || ""} ${a.profile?.lastName || ""}`.trim() || "—" }),
      /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5 text-slate-500 text-xs", children: a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "—" }),
      /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5", children: a.banned ? /* @__PURE__ */ jsx("span", { className: "text-red-600 font-medium", children: "yes" }) : /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "no" }) })
    ] });
  }
  if (resource === "listings") {
    const price = a.price ? `$${(a.price.amount / 100).toFixed(0)} ${a.price.currency}` : "—";
    return /* @__PURE__ */ jsxs("tr", { className: "border-t border-slate-100 hover:bg-slate-50/60", children: [
      /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5 max-w-md truncate", children: a.title || "—" }),
      /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5", children: /* @__PURE__ */ jsx("span", { className: "text-xs px-2 py-0.5 rounded-full bg-slate-100", children: a.state || "—" }) }),
      /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5", children: price }),
      /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5 text-slate-500 text-xs", children: a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "—" })
    ] });
  }
  if (resource === "transactions") {
    const total = a.payinTotal ? `$${(a.payinTotal.amount / 100).toFixed(2)} ${a.payinTotal.currency}` : "—";
    const booking = a.bookingStart ? `${new Date(a.bookingStart).toLocaleDateString()}` : "—";
    return /* @__PURE__ */ jsxs("tr", { className: "border-t border-slate-100 hover:bg-slate-50/60", children: [
      /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5 font-mono text-xs", children: row.id.slice(0, 8) }),
      /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5 text-xs", children: a.lastTransition || "—" }),
      /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5", children: total }),
      /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5 text-xs", children: booking }),
      /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5 text-slate-500 text-xs", children: a.lastTransitionedAt ? new Date(a.lastTransitionedAt).toLocaleString() : "—" })
    ] });
  }
  if (resource === "reviews") {
    return /* @__PURE__ */ jsxs("tr", { className: "border-t border-slate-100 hover:bg-slate-50/60", children: [
      /* @__PURE__ */ jsxs("td", { className: "px-4 py-2.5", children: [
        /* @__PURE__ */ jsx("span", { className: "text-amber-500 font-medium", children: "★".repeat(a.rating || 0) }),
        /* @__PURE__ */ jsx("span", { className: "text-slate-300", children: "★".repeat(Math.max(0, 5 - (a.rating || 0))) })
      ] }),
      /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5 text-xs", children: a.type || "—" }),
      /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5 max-w-lg truncate", children: a.content || "—" }),
      /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5 text-slate-500 text-xs", children: a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "—" })
    ] });
  }
  return null;
}
function CatalogView({
  env
}) {
  const fn = useServerFn(listMarketplaceResource);
  const q = useQuery({
    queryKey: ["mc.catalog", env],
    queryFn: () => fn({
      data: {
        env,
        resource: "listings",
        page: 1,
        perPage: 100,
        state: "published"
      }
    })
  });
  const tree = useMemo(() => {
    if (!q.data) return null;
    const byCity = /* @__PURE__ */ new Map();
    for (const r of q.data.data) {
      const city = r.attributes?.publicData?.city || "Unknown";
      byCity.set(city, (byCity.get(city) || 0) + 1);
    }
    return [...byCity.entries()].sort((a, b) => b[1] - a[1]);
  }, [q.data]);
  if (q.isLoading) return /* @__PURE__ */ jsxs("p", { className: "text-slate-500", children: [
    "Loading hierarchy…",
    /* @__PURE__ */ jsx("br", {}),
    "Fetching all listings…"
  ] });
  if (q.error) return /* @__PURE__ */ jsx(ErrorCard, { title: "Catalog failed", message: q.error.message, onRetry: () => q.refetch() });
  if (!tree) return null;
  return /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl border border-slate-200 max-w-xl", children: [
    /* @__PURE__ */ jsx("div", { className: "px-4 py-3 border-b border-slate-100 text-sm font-medium text-slate-600", children: "Published listings by city" }),
    /* @__PURE__ */ jsx("ul", { className: "divide-y divide-slate-100", children: tree.map(([city, n]) => /* @__PURE__ */ jsxs("li", { className: "px-4 py-2.5 flex items-center justify-between text-sm", children: [
      /* @__PURE__ */ jsx("span", { children: city }),
      /* @__PURE__ */ jsxs("span", { className: "text-slate-400 text-xs", children: [
        n,
        " listing",
        n === 1 ? "" : "s"
      ] })
    ] }, city)) })
  ] });
}
function PlaceholderView({
  view
}) {
  return /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center max-w-xl", children: [
    /* @__PURE__ */ jsx("p", { className: "text-slate-600 font-medium capitalize", children: view }),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400 mt-1", children: "Coming next. Tell me what you want to see here and I'll wire it up." })
  ] });
}
function Stat({
  label,
  value,
  sub
}) {
  return /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl border border-slate-200 p-5", children: [
    /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-500 uppercase tracking-wider", children: label }),
    /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold mt-1", children: value }),
    sub && /* @__PURE__ */ jsx("div", { className: "text-[11px] text-slate-400 mt-1", children: sub })
  ] });
}
function ErrorCard({
  title,
  message,
  onRetry
}) {
  return /* @__PURE__ */ jsxs("div", { className: "bg-red-50 border border-red-200 rounded-xl p-4 max-w-2xl", children: [
    /* @__PURE__ */ jsx("div", { className: "font-medium text-red-800", children: title }),
    /* @__PURE__ */ jsx("div", { className: "text-sm text-red-700 mt-1 font-mono break-words", children: message }),
    /* @__PURE__ */ jsx("button", { onClick: onRetry, className: "mt-3 text-sm px-3 py-1.5 rounded-md bg-white border border-red-300 text-red-700 hover:bg-red-100", children: "Retry" })
  ] });
}
export {
  MarketplaceConsole as component
};
