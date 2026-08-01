import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { E as Route, S as SiteHeader, G as ListingCard, e as SiteFooter } from "./router-BTf4C8qB.js";
import { B as BreadcrumbsWithSchema } from "./breadcrumbs-jsonld-gKDiR8Cu.js";
import "react";
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
import "./auth-middleware-C3cX-s7a.js";
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
import "./renter-drip.server-C0Ma8t5O.js";
import "node:fs";
import "node:path";
import "./host-drip.server-DDQBE_qt.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
function StateHubPage() {
  const {
    stateName,
    stateCode,
    cities,
    listings
  } = Route.useLoaderData();
  const buckets = /* @__PURE__ */ new Map();
  for (const c of cities) {
    const letter = (c.cityName[0] ?? "#").toUpperCase();
    const key = /[A-Z]/.test(letter) ? letter : "#";
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(c);
  }
  const letters = [...buckets.keys()].sort();
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsx(BreadcrumbsWithSchema, { items: [{
        name: "Home",
        path: "/"
      }, {
        name: "Pool rentals by state",
        path: "/p/pool-rentals"
      }, {
        name: stateName,
        path: `/p/pool-rentals-${stateName.toLowerCase().replace(/\s+/g, "-")}`
      }] }),
      /* @__PURE__ */ jsxs("header", { className: "mt-6", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold uppercase tracking-wider text-primary", children: stateCode }),
        /* @__PURE__ */ jsxs("h1", { className: "mt-2 text-4xl font-bold tracking-tight sm:text-5xl", children: [
          "Pool rentals in ",
          stateName
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "mt-4 max-w-2xl text-lg text-muted-foreground", children: [
          "Browse private backyard pool rentals across",
          " ",
          /* @__PURE__ */ jsx("strong", { className: "text-foreground", children: cities.length }),
          " ",
          stateName,
          " cities. Book by the hour, $40–150/hour typical, with $2M liability insurance included on every booking."
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap gap-3", children: [
          /* @__PURE__ */ jsxs("a", { href: `/s?address=${encodeURIComponent(stateName)}`, className: "inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90", children: [
            "Find a pool in ",
            stateName
          ] }),
          /* @__PURE__ */ jsx("a", { href: "/l/draft/00000000-0000-0000-0000-000000000000/new/details", className: "inline-flex items-center justify-center rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary", children: "List your pool" })
        ] })
      ] }),
      listings.length > 0 && /* @__PURE__ */ jsxs("section", { className: "mt-12", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-end justify-between gap-3", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-2xl font-bold tracking-tight", children: [
            "Available pools in ",
            stateName
          ] }),
          /* @__PURE__ */ jsx("a", { href: `/s?address=${encodeURIComponent(stateName)}`, className: "text-sm font-semibold text-primary hover:underline", children: "See all →" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", children: listings.map((l) => /* @__PURE__ */ jsx(ListingCard, { listing: l }, l.id)) })
      ] }),
      letters.length > 1 && /* @__PURE__ */ jsx("nav", { "aria-label": "Jump to letter", className: "mt-10 flex flex-wrap gap-2", children: letters.map((l) => /* @__PURE__ */ jsx("a", { href: `#letter-${l}`, className: "rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary", children: l }, l)) }),
      /* @__PURE__ */ jsx("section", { className: "mt-10", children: letters.map((letter) => /* @__PURE__ */ jsxs("div", { id: `letter-${letter}`, className: "scroll-mt-24 border-b border-border py-6 last:border-b-0", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold tracking-tight", children: letter }),
        /* @__PURE__ */ jsx("ul", { className: "mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4", children: buckets.get(letter).map((c) => /* @__PURE__ */ jsx("li", { className: "leading-snug", children: /* @__PURE__ */ jsxs(Link, { to: "/p/$slug", params: {
          slug: c.pageSlug
        }, className: "block truncate text-sm text-foreground hover:text-primary hover:underline", title: `${c.cityName}, ${stateCode}`, children: [
          c.cityName,
          ", ",
          stateCode
        ] }) }, c.citySlug)) })
      ] }, letter)) }),
      /* @__PURE__ */ jsxs("aside", { className: "mt-12 rounded-2xl border border-border bg-muted/30 p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "Want to host?" }),
        /* @__PURE__ */ jsxs("p", { className: "mt-2 text-muted-foreground", children: [
          "Pool owners in ",
          stateName,
          " typically earn $3,000–$10,000 per month renting their backyard pool. You keep 100% — we charge 0% host fees through 2026, and every booking includes $2M liability coverage."
        ] }),
        /* @__PURE__ */ jsxs("a", { href: "/l/draft/00000000-0000-0000-0000-000000000000/new/details", className: "mt-5 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90", children: [
          "Get started in ",
          stateName
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-10 text-center text-sm", children: /* @__PURE__ */ jsx(Link, { to: "/p/pool-rentals", className: "text-primary hover:underline", children: "← Browse pool rentals in all 50 states" }) })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
export {
  StateHubPage as component
};
