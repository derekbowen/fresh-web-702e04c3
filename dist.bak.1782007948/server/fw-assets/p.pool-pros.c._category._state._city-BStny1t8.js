import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { bV as Route, S as SiteHeader, e as SiteFooter } from "./router-Bk6RtsuF.js";
import { P as ProviderPlanBadges } from "./provider-plan-badges-P0eJPX3p.js";
import "react";
import "@tanstack/react-query";
import "./site-footer-defaults-C7gHxS5b.js";
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
import "./states-UIdvqlKs.js";
import "./site-origin-DK0yY0Ip.js";
import "./city-slug-Bqls2qOy.js";
import "@tanstack/zod-adapter";
import "./client-Dh5RMKgP.js";
import "lucide-react";
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
import "./renter-drip.server-DkMf2kRj.js";
import "./emailit-DRsipvVx.js";
import "node:fs";
import "node:path";
import "./host-drip.server-Dv1yKbNa.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
function CityCategoryPage() {
  const {
    category,
    stateCode,
    stateName,
    cityName,
    providers
  } = Route.useLoaderData();
  const params = Route.useParams();
  const stateLower = params.state.toLowerCase();
  const featured = providers.filter((p) => p.is_featured);
  const standard = providers.filter((p) => !p.is_featured);
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
        /* @__PURE__ */ jsx(Link, { to: "/p/pool-pros/c/$category/$state", params: {
          category: params.category,
          state: stateLower
        }, className: "hover:text-primary", children: stateName }),
        /* @__PURE__ */ jsx("span", { className: "mx-1.5", children: "/" }),
        /* @__PURE__ */ jsx("span", { className: "text-foreground", children: cityName })
      ] }),
      /* @__PURE__ */ jsxs("header", { className: "mt-4 max-w-3xl", children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-4xl font-bold tracking-tight text-foreground sm:text-5xl", children: [
          category.plural_name,
          " in ",
          cityName,
          ", ",
          stateCode
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-lg text-muted-foreground", children: providers.length === 0 ? `We don't have ${category.plural_name.toLowerCase()} listed in ${cityName} yet.` : `${providers.length} ${providers.length === 1 ? "pro" : "pros"} serving ${cityName} and the surrounding area.` })
      ] }),
      featured.length > 0 && /* @__PURE__ */ jsxs("section", { className: "mt-10", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-primary", children: "Featured" }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: featured.map((p) => /* @__PURE__ */ jsx(ProviderCard, { p, featured: true }, p.slug)) })
      ] }),
      standard.length > 0 && /* @__PURE__ */ jsxs("section", { className: "mt-10", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-xl font-semibold text-foreground", children: [
          "All ",
          category.plural_name.toLowerCase(),
          " in ",
          cityName
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: standard.map((p) => /* @__PURE__ */ jsx(ProviderCard, { p }, p.slug)) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mt-12 rounded-2xl border border-border bg-muted/30 p-6", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-foreground", children: [
          "More ",
          category.plural_name.toLowerCase(),
          " nearby"
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "mt-2 text-sm text-muted-foreground", children: [
          /* @__PURE__ */ jsxs(Link, { to: "/p/pool-pros/c/$category/$state", params: {
            category: params.category,
            state: stateLower
          }, className: "text-primary hover:underline", children: [
            "Browse all ",
            category.plural_name.toLowerCase(),
            " in ",
            stateName
          ] }),
          " ",
          "or",
          " ",
          /* @__PURE__ */ jsxs(Link, { to: "/p/pool-pros/c/$category", params: {
            category: params.category
          }, className: "text-primary hover:underline", children: [
            "see every ",
            category.name.toLowerCase(),
            " nationwide"
          ] }),
          "."
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function ProviderCard({
  p,
  featured = false
}) {
  return /* @__PURE__ */ jsxs(Link, { to: "/p/pool-pros/$slug", params: {
    slug: p.slug
  }, className: `flex items-start gap-4 rounded-2xl border bg-card p-5 transition hover:shadow-md ${featured ? "border-primary/40 ring-1 ring-primary/20" : "border-border"}`, children: [
    p.logo_url ? /* @__PURE__ */ jsx("img", { src: p.logo_url, alt: p.name, className: "h-14 w-14 rounded-lg object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary", children: p.name.charAt(0) }),
    /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsx("h3", { className: "truncate font-semibold text-foreground", children: p.name }),
        /* @__PURE__ */ jsx(ProviderPlanBadges, { p })
      ] }),
      p.address && /* @__PURE__ */ jsx("p", { className: "truncate text-xs text-muted-foreground", children: p.address }),
      typeof p.rating === "number" && /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: [
        "★ ",
        p.rating.toFixed(1),
        " ",
        p.rating_count ? `(${p.rating_count})` : ""
      ] }),
      p.phone && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: p.phone })
    ] })
  ] });
}
export {
  CityCategoryPage as component
};
