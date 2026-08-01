import { jsxs, jsx } from "react/jsx-runtime";
import { X as Route, S as SiteHeader, e as SiteFooter } from "./router-DnjagyeS.js";
import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { I as Input } from "./input-C0QjszdI.js";
import "@tanstack/react-query";
import "./site-footer-defaults-asWdr-hi.js";
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
import "./auth-middleware-Bd-cw3tB.js";
import "./createMiddleware-BvN2ghIY.js";
import "./site-origin-DalDu5p3.js";
import "./city-slug-Bqls2qOy.js";
import "@tanstack/zod-adapter";
import "./client-Dh5RMKgP.js";
import "./transactional-email.server-BoL6nxoQ.js";
import "@react-email/components";
import "./_unsubscribe-footer-DXp0Y_3B.js";
import "lucide-react";
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
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
const RATING_OPTIONS = [
  { value: "0", label: "Any rating" },
  { value: "3", label: "3.0+ stars" },
  { value: "4", label: "4.0+ stars" },
  { value: "4.5", label: "4.5+ stars" }
];
function BuildersFilter({ providers, showCityFilter = false, fallbackStateCode }) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("all");
  const [minRating, setMinRating] = useState("0");
  const [category, setCategory] = useState("all");
  const cities = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const p of providers) {
      if (p.city && p.city_slug) map.set(p.city_slug, p.city);
    }
    return Array.from(map.entries()).map(([slug, name]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [providers]);
  const categories = useMemo(() => {
    const set = /* @__PURE__ */ new Set();
    for (const p of providers) {
      if (p.business_type) set.add(p.business_type);
    }
    return Array.from(set).sort();
  }, [providers]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const minR = Number(minRating);
    return providers.filter((p) => {
      if (q) {
        const hay = `${p.name} ${p.city ?? ""} ${p.business_type ?? ""} ${p.address ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (city !== "all" && p.city_slug !== city) return false;
      if (category !== "all" && p.business_type !== category) return false;
      if (minR > 0 && (typeof p.rating !== "number" || p.rating < minR)) return false;
      return true;
    });
  }, [providers, query, city, category, minRating]);
  const reset = () => {
    setQuery("");
    setCity("all");
    setMinRating("0");
    setCategory("all");
  };
  const hasFilters = query !== "" || city !== "all" || minRating !== "0" || category !== "all";
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card/50 p-4 sm:p-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid gap-3 md:grid-cols-12", children: [
        /* @__PURE__ */ jsxs("div", { className: "md:col-span-5", children: [
          /* @__PURE__ */ jsx("label", { className: "sr-only", htmlFor: "builders-q", children: "Search builders" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "builders-q",
              type: "search",
              placeholder: "Search by name, address, or service…",
              value: query,
              onChange: (e) => setQuery(e.target.value)
            }
          )
        ] }),
        showCityFilter && /* @__PURE__ */ jsx("div", { className: "md:col-span-3", children: /* @__PURE__ */ jsxs(
          "select",
          {
            "aria-label": "Filter by city",
            value: city,
            onChange: (e) => setCity(e.target.value),
            className: "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            children: [
              /* @__PURE__ */ jsxs("option", { value: "all", children: [
                "All cities (",
                cities.length,
                ")"
              ] }),
              cities.map((c) => /* @__PURE__ */ jsx("option", { value: c.slug, children: c.name }, c.slug))
            ]
          }
        ) }),
        /* @__PURE__ */ jsx("div", { className: showCityFilter ? "md:col-span-2" : "md:col-span-3", children: /* @__PURE__ */ jsx(
          "select",
          {
            "aria-label": "Filter by minimum rating",
            value: minRating,
            onChange: (e) => setMinRating(e.target.value),
            className: "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            children: RATING_OPTIONS.map((o) => /* @__PURE__ */ jsx("option", { value: o.value, children: o.label }, o.value))
          }
        ) }),
        /* @__PURE__ */ jsx("div", { className: showCityFilter ? "md:col-span-2" : "md:col-span-4", children: /* @__PURE__ */ jsxs(
          "select",
          {
            "aria-label": "Filter by category",
            value: category,
            onChange: (e) => setCategory(e.target.value),
            className: "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            children: [
              /* @__PURE__ */ jsxs("option", { value: "all", children: [
                "All categories (",
                categories.length,
                ")"
              ] }),
              categories.map((c) => /* @__PURE__ */ jsx("option", { value: c, children: c }, c))
            ]
          }
        ) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center justify-between gap-3 text-sm", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", children: [
          "Showing ",
          /* @__PURE__ */ jsx("span", { className: "font-semibold text-foreground", children: filtered.length }),
          " of ",
          providers.length,
          " builders"
        ] }),
        hasFilters && /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: reset,
            className: "text-sm font-medium text-primary hover:underline",
            children: "Clear filters"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-6", children: filtered.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-dashed border-border p-10 text-center", children: [
      /* @__PURE__ */ jsx("p", { className: "text-foreground", children: "No builders match your filters." }),
      /* @__PURE__ */ jsx("button", { onClick: reset, className: "mt-3 text-sm font-medium text-primary hover:underline", children: "Reset filters" })
    ] }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: filtered.map((p) => /* @__PURE__ */ jsxs(
      Link,
      {
        to: "/p/pool-pros/$slug",
        params: { slug: p.slug },
        className: "flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md",
        children: [
          p.logo_url ? /* @__PURE__ */ jsx("img", { src: p.logo_url, alt: "", className: "h-14 w-14 rounded-lg object-cover", loading: "lazy" }) : /* @__PURE__ */ jsx("div", { className: "flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary", children: p.name.charAt(0) }),
          /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsx("h3", { className: "truncate font-semibold text-foreground", children: p.name }),
            p.city && /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
              p.city,
              p.state_code || fallbackStateCode ? `, ${p.state_code ?? fallbackStateCode}` : ""
            ] }),
            typeof p.rating === "number" && /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: [
              "★ ",
              p.rating,
              " ",
              p.rating_count ? `(${p.rating_count})` : ""
            ] }),
            p.business_type && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground line-clamp-1", children: p.business_type })
          ] })
        ]
      },
      p.slug
    )) }) })
  ] });
}
function PoolProsPage() {
  const {
    providers
  } = Route.useLoaderData();
  const total = providers.length;
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("header", { className: "text-center", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold uppercase tracking-wider text-primary", children: "Directory" }),
        /* @__PURE__ */ jsx("h1", { className: "mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl", children: "Find a pool pro near you" }),
        /* @__PURE__ */ jsxs("p", { className: "mx-auto mt-4 max-w-2xl text-lg text-muted-foreground", children: [
          "Browse ",
          total.toLocaleString(),
          "+ verified builders, cleaners, and service pros. Search by name, filter by service type or city."
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-10", children: /* @__PURE__ */ jsx(BuildersFilter, { providers, showCityFilter: true }) })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
export {
  PoolProsPage as component
};
