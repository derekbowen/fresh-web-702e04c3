import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { bU as Route, I as SITE_URL, S as SiteHeader, e as SiteFooter } from "./router-BPpbotmS.js";
import { P as ProviderPlanBadges } from "./provider-plan-badges-P0eJPX3p.js";
import "react";
import "@tanstack/react-query";
import "./site-footer-defaults-Brwu0BKb.js";
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
function CategoryPage() {
  const {
    category,
    providers
  } = Route.useLoaderData();
  const params = Route.useParams();
  const featured = providers.filter((p) => p.is_featured);
  const standard = providers.filter((p) => !p.is_featured);
  const url = `${SITE_URL}/p/pool-pros/c/${category.slug}`;
  const byState = /* @__PURE__ */ new Map();
  for (const p of standard) {
    const k = p.state_code || "—";
    if (!byState.has(k)) byState.set(k, []);
    byState.get(k).push(p);
  }
  const states = [...byState.keys()].sort();
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("nav", { "aria-label": "Breadcrumb", className: "text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsx(Link, { to: "/", className: "hover:text-primary", children: "Home" }),
        /* @__PURE__ */ jsx("span", { className: "mx-1.5", children: "/" }),
        /* @__PURE__ */ jsx(Link, { to: "/p/pool-pros", className: "hover:text-primary", children: "Pool Pros" }),
        /* @__PURE__ */ jsx("span", { className: "mx-1.5", children: "/" }),
        /* @__PURE__ */ jsx("span", { className: "text-foreground", children: category.plural_name })
      ] }),
      /* @__PURE__ */ jsxs("header", { className: "mt-4 max-w-3xl", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold tracking-tight text-foreground sm:text-5xl", children: category.plural_name }),
        category.intro_markdown && /* @__PURE__ */ jsx("p", { className: "mt-4 text-lg text-muted-foreground", dangerouslySetInnerHTML: {
          __html: category.intro_markdown.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        } }),
        /* @__PURE__ */ jsxs("p", { className: "mt-2 text-sm text-muted-foreground", children: [
          providers.length,
          " listed nationwide"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-5 flex gap-3", children: /* @__PURE__ */ jsx("a", { href: url, className: "inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-muted/50", children: "Share this directory" }) })
      ] }),
      featured.length > 0 && /* @__PURE__ */ jsxs("section", { className: "mt-10", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-primary", children: "Featured" }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: featured.map((p) => /* @__PURE__ */ jsx(ProviderCard, { p, featured: true }, p.slug)) })
      ] }),
      providers.length === 0 ? /* @__PURE__ */ jsx("div", { className: "mt-10 rounded-2xl border border-dashed border-border bg-card p-10 text-center", children: /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", children: [
        "No ",
        category.plural_name.toLowerCase(),
        " listed yet."
      ] }) }) : /* @__PURE__ */ jsx("section", { className: "mt-10 space-y-10", children: states.map((state) => /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-baseline justify-between", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-foreground", children: state === "—" ? "Other locations" : state }),
          state !== "—" && /^[A-Z]{2}$/.test(state) && /* @__PURE__ */ jsxs(Link, { to: "/p/pool-pros/c/$category/$state", params: {
            category: params.category,
            state: state.toLowerCase()
          }, className: "text-sm font-medium text-primary hover:underline", children: [
            "Browse ",
            state,
            " →"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: byState.get(state).map((p) => /* @__PURE__ */ jsx(ProviderCard, { p }, p.slug)) })
      ] }, state)) })
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
      (p.city || p.state_code) && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: [p.city, p.state_code].filter(Boolean).join(", ") }),
      typeof p.rating === "number" && /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: [
        "★ ",
        p.rating.toFixed(1),
        " ",
        p.rating_count ? `(${p.rating_count})` : ""
      ] })
    ] })
  ] });
}
export {
  CategoryPage as component
};
