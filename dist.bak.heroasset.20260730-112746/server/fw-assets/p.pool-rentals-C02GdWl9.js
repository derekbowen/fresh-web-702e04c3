import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { J as Route, S as SiteHeader, e as SiteFooter } from "./router-DnjagyeS.js";
import { B as BreadcrumbsWithSchema } from "./breadcrumbs-jsonld-C1f9tev_.js";
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
function PoolRentalsIndex() {
  const {
    states
  } = Route.useLoaderData();
  const totalCities = states.reduce((s, x) => s + x.cityCount, 0);
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsx(BreadcrumbsWithSchema, { items: [{
        name: "Home",
        path: "/"
      }, {
        name: "Pool rentals by state",
        path: "/p/pool-rentals"
      }] }),
      /* @__PURE__ */ jsxs("header", { className: "mt-6", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold tracking-tight sm:text-5xl", children: "Pool rentals by state" }),
        /* @__PURE__ */ jsxs("p", { className: "mt-4 max-w-2xl text-lg text-muted-foreground", children: [
          "Browse private backyard pool rentals across",
          " ",
          /* @__PURE__ */ jsx("strong", { className: "text-foreground", children: totalCities.toLocaleString() }),
          " ",
          "cities in ",
          states.length,
          " states. Pick your state to see every city we cover."
        ] })
      ] }),
      /* @__PURE__ */ jsx("ul", { className: "mt-10 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5", children: states.map((s) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(Link, { to: "/p/pool-rentals-$state", params: {
        state: s.citySlug
      }, className: "group block rounded-md border border-border bg-card px-4 py-3 transition hover:border-primary", children: [
        /* @__PURE__ */ jsx("span", { className: "block text-sm font-semibold text-foreground group-hover:text-primary", children: s.stateName }),
        /* @__PURE__ */ jsxs("span", { className: "block text-xs text-muted-foreground", children: [
          s.cityCount,
          " ",
          s.cityCount === 1 ? "city" : "cities"
        ] })
      ] }) }, s.stateCode)) }),
      /* @__PURE__ */ jsxs("aside", { className: "mt-12 rounded-2xl border border-border bg-muted/30 p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "Don't see your city?" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: "New cities get added every week. Search the marketplace directly or list your own pool to be the first host in your area." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-5 flex flex-wrap gap-3", children: [
          /* @__PURE__ */ jsx("a", { href: "/s", className: "inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90", children: "Search all pools" }),
          /* @__PURE__ */ jsx("a", { href: "/l/draft/00000000-0000-0000-0000-000000000000/new/details", className: "inline-flex items-center justify-center rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition hover:border-primary", children: "List your pool" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
export {
  PoolRentalsIndex as component
};
