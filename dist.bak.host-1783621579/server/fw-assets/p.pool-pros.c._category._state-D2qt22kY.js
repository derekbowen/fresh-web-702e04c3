import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { bQ as Route, S as SiteHeader, e as SiteFooter } from "./router-BskH5uAy.js";
import { P as ProviderPlanBadges } from "./provider-plan-badges-P0eJPX3p.js";
import "react";
import "@tanstack/react-query";
import "./site-footer-defaults-C6_J6kuR.js";
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
import "./client-TSMcDHCK.js";
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
import "./renter-drip.server-BUH95fZo.js";
import "node:fs";
import "node:path";
import "./host-drip.server-MvSzhhAo.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
function StateHub() {
  const {
    category,
    stateCode,
    stateName,
    providers,
    cities
  } = Route.useLoaderData();
  const params = Route.useParams();
  const stateLower = params.state.toLowerCase();
  const featured = providers.filter((p) => p.is_featured);
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("nav", { "aria-label": "Breadcrumb", className: "text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsx(Link, { to: "/", className: "hover:text-primary", children: "Home" }),
        /* @__PURE__ */ jsx("span", { className: "mx-1.5", children: "/" }),
        /* @__PURE__ */ jsx(Link, { to: "/p/pool-pros", className: "hover:text-primary", children: "Pool Pros" }),
        /* @__PURE__ */ jsx("span", { className: "mx-1.5", children: "/" }),
        /* @__PURE__ */ jsx(Link, { to: "/p/pool-pros/c/$category", params: {
          category: params.category
        }, className: "hover:text-primary", children: category.plural_name }),
        /* @__PURE__ */ jsx("span", { className: "mx-1.5", children: "/" }),
        /* @__PURE__ */ jsx("span", { className: "text-foreground", children: stateName })
      ] }),
      /* @__PURE__ */ jsxs("header", { className: "mt-4 max-w-3xl", children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-4xl font-bold tracking-tight text-foreground sm:text-5xl", children: [
          category.plural_name,
          " in ",
          stateName
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "mt-3 text-lg text-muted-foreground", children: [
          providers.length,
          " ",
          providers.length === 1 ? "pro" : "pros",
          " listed across ",
          cities.length,
          " ",
          cities.length === 1 ? "city" : "cities",
          " in ",
          stateName,
          "."
        ] })
      ] }),
      cities.length > 0 && /* @__PURE__ */ jsxs("section", { className: "mt-10", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground", children: "Browse by city" }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4", children: cities.map((city) => /* @__PURE__ */ jsxs(Link, { to: "/p/pool-pros/c/$category/$state/$city", params: {
          category: params.category,
          state: stateLower,
          city: city.slug
        }, className: "flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm transition hover:border-primary hover:bg-muted/40", children: [
          /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground", children: city.name }),
          /* @__PURE__ */ jsx("span", { className: "rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground", children: city.count })
        ] }, city.slug)) })
      ] }),
      featured.length > 0 && /* @__PURE__ */ jsxs("section", { className: "mt-12", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-sm font-semibold uppercase tracking-wider text-primary", children: [
          "Featured in ",
          stateName
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: featured.map((p) => /* @__PURE__ */ jsxs(Link, { to: "/p/pool-pros/$slug", params: {
          slug: p.slug
        }, className: "rounded-2xl border border-primary/40 bg-card p-5 ring-1 ring-primary/20 transition hover:shadow-md", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold text-foreground", children: p.name }),
            /* @__PURE__ */ jsx(ProviderPlanBadges, { p })
          ] }),
          p.city && /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [
            p.city,
            ", ",
            p.state_code
          ] })
        ] }, p.slug)) })
      ] }),
      providers.length === 0 && /* @__PURE__ */ jsx("div", { className: "mt-10 rounded-2xl border border-dashed border-border bg-card p-10 text-center", children: /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", children: [
        "No ",
        category.plural_name.toLowerCase(),
        " listed in ",
        stateName,
        " yet."
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
export {
  StateHub as component
};
