import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { bF as submitProviderLead, bG as Route, S as SiteHeader, a4 as Breadcrumbs, e as SiteFooter } from "./router-BmsL3Cd5.js";
import { useState } from "react";
import { P as ProviderPlanBadges } from "./provider-plan-badges-P0eJPX3p.js";
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
import "./renter-drip.server-Bp6Mhaag.js";
import "node:fs";
import "node:path";
import "./host-drip.server-Js7RHpjT.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
function JoinNetworkForm({
  variant = "card",
  defaultCity = "",
  defaultState = "",
  sourceProviderSlug,
  sourcePath,
  heading = "Are you a pool builder or pool owner?",
  subheading = "Join the Pool Rental Near Me network — get listed, claim leads, and earn from your pool."
}) {
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  async function onSubmit(e) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await submitProviderLead({
        data: {
          name: String(fd.get("name") || ""),
          email: String(fd.get("email") || ""),
          phone: String(fd.get("phone") || ""),
          company: String(fd.get("company") || ""),
          website: String(fd.get("website") || ""),
          city: String(fd.get("city") || ""),
          state_code: String(fd.get("state_code") || ""),
          message: String(fd.get("message") || ""),
          source_provider_slug: sourceProviderSlug ?? "",
          source_path: sourcePath ?? (typeof window !== "undefined" ? window.location.pathname : "")
        }
      });
      if (res.ok) {
        setStatus("success");
        e.currentTarget.reset();
      } else {
        setStatus("error");
        setErrorMsg(res.error);
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Submission failed");
    }
  }
  if (status === "success") {
    return /* @__PURE__ */ jsx("div", { className: containerClass(variant), children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary", children: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", className: "h-6 w-6", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 13l4 4L19 7" }) }) }),
      /* @__PURE__ */ jsx("h3", { className: "mt-3 text-lg font-semibold text-foreground", children: "You're on the list!" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Our team will reach out within 1 business day with next steps." })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: containerClass(variant), children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-foreground sm:text-xl", children: heading }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: subheading })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit, className: "grid gap-3 sm:grid-cols-2", children: [
      /* @__PURE__ */ jsx(Input, { name: "name", placeholder: "Your name *", required: true }),
      /* @__PURE__ */ jsx(Input, { name: "email", type: "email", placeholder: "Email *", required: true }),
      /* @__PURE__ */ jsx(Input, { name: "phone", type: "tel", placeholder: "Phone" }),
      /* @__PURE__ */ jsx(Input, { name: "company", placeholder: "Business name" }),
      /* @__PURE__ */ jsx(Input, { name: "website", placeholder: "Website", className: "sm:col-span-2" }),
      /* @__PURE__ */ jsx(Input, { name: "city", placeholder: "City", defaultValue: defaultCity }),
      /* @__PURE__ */ jsx(Input, { name: "state_code", placeholder: "State (e.g. CA)", defaultValue: defaultState, maxLength: 2 }),
      /* @__PURE__ */ jsx(
        "textarea",
        {
          name: "message",
          placeholder: "Tell us about your pool or business (optional)",
          rows: 3,
          maxLength: 2e3,
          className: "sm:col-span-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2 flex items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "By submitting, you agree to be contacted about joining the network." }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            disabled: status === "submitting",
            className: "inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary-glow disabled:opacity-60",
            children: status === "submitting" ? "Submitting…" : "Join the network"
          }
        )
      ] }),
      status === "error" && /* @__PURE__ */ jsx("p", { className: "sm:col-span-2 text-sm text-destructive", children: errorMsg })
    ] })
  ] });
}
function containerClass(variant) {
  if (variant === "footer") return "rounded-2xl border border-border bg-card p-6";
  if (variant === "inline") return "rounded-2xl bg-secondary/40 p-6";
  return "rounded-2xl border border-border bg-card p-6 shadow-sm";
}
function Input(props) {
  const { className = "", ...rest } = props;
  return /* @__PURE__ */ jsx(
    "input",
    {
      ...rest,
      className: `rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${className}`
    }
  );
}
function ClaimListingCTA({ providerSlug, providerName }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-foreground", children: "Is this your business?" }),
      /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
        "Claim ",
        providerName,
        " to update your profile, add photos, and get referral leads."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex shrink-0 gap-2", children: [
      /* @__PURE__ */ jsx(
        "a",
        {
          href: `/providers/${encodeURIComponent(providerSlug)}/claim`,
          className: "inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary-glow",
          children: "Claim this listing"
        }
      ),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: `/providers/${encodeURIComponent(providerSlug)}/manage`,
          className: "inline-flex h-10 items-center justify-center rounded-full border border-primary/40 px-5 text-sm font-semibold text-primary transition-all hover:bg-primary/10",
          children: "Manage"
        }
      )
    ] })
  ] });
}
function ProviderPage() {
  const {
    provider
  } = Route.useLoaderData();
  const params = Route.useParams();
  const p = provider;
  const category = p.primary_category || "pool-builders";
  const stateCode = p.state_code?.toLowerCase() ?? null;
  const citySlug = p.city_slug ?? null;
  const gallery = Array.isArray(p.gallery_urls) ? p.gallery_urls.filter(Boolean) : [];
  const faq = Array.isArray(p.faq) ? p.faq : [];
  const services = Array.isArray(p.services) ? p.services : [];
  const heroBg = p.hero_image_url || p.logo_url;
  const path = `/p/pool-pros/${params.slug}`;
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col bg-background", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1", children: [
      /* @__PURE__ */ jsxs("section", { className: "relative overflow-hidden border-b border-border", children: [
        heroBg && /* @__PURE__ */ jsxs("div", { className: "absolute inset-0", children: [
          /* @__PURE__ */ jsx("img", { src: heroBg, alt: "", className: "h-full w-full object-cover opacity-25" }),
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8", children: [
          /* @__PURE__ */ jsx(Breadcrumbs, { items: [{
            name: "Home",
            path: "/"
          }, {
            name: "Pool Pros",
            path: "/p/pool-pros"
          }, {
            name: category,
            path: `/p/pool-pros/c/${category}`
          }, ...stateCode ? [{
            name: p.state_code,
            path: `/p/pool-pros/c/${category}/${stateCode}`
          }] : [], ...stateCode && citySlug && p.city ? [{
            name: p.city,
            path: `/p/pool-pros/c/${category}/${stateCode}/${citySlug}`
          }] : [], {
            name: p.name,
            path
          }] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-col gap-6 sm:flex-row sm:items-end", children: [
            p.logo_url && /* @__PURE__ */ jsx("div", { className: "h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-lg sm:h-28 sm:w-28", children: /* @__PURE__ */ jsx("img", { src: p.logo_url, alt: p.name, className: "h-full w-full object-cover" }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsx(ProviderPlanBadges, { p, className: "mb-3" }),
              /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold tracking-tight text-foreground sm:text-5xl", children: p.name }),
              /* @__PURE__ */ jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground", children: [
                (p.city || p.state_code) && /* @__PURE__ */ jsxs("span", { children: [
                  "📍 ",
                  stateCode && citySlug && p.city ? /* @__PURE__ */ jsxs(Link, { to: "/p/pool-pros/c/$category/$state/$city", params: {
                    category,
                    state: stateCode,
                    city: citySlug
                  }, className: "hover:text-primary", children: [
                    p.city,
                    ", ",
                    p.state_code
                  ] }) : [p.city, p.state_code].filter(Boolean).join(", ")
                ] }),
                typeof p.rating === "number" && /* @__PURE__ */ jsxs("span", { children: [
                  "★ ",
                  p.rating,
                  p.rating_count ? ` · ${p.rating_count} reviews` : ""
                ] }),
                p.business_type && /* @__PURE__ */ jsxs("span", { children: [
                  "• ",
                  p.business_type
                ] }),
                p.primary_category && /* @__PURE__ */ jsxs("span", { children: [
                  "• ",
                  p.primary_category
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-5 flex flex-wrap gap-2", children: [
                p.phone && /* @__PURE__ */ jsxs("a", { href: `tel:${p.phone}`, className: "inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:opacity-90", children: [
                  "📞 ",
                  p.phone
                ] }),
                p.website_url && /* @__PURE__ */ jsx("a", { href: p.website_url, target: "_blank", rel: "noreferrer noopener", className: "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:bg-secondary", children: "Visit website" }),
                p.email && /* @__PURE__ */ jsx("a", { href: `mailto:${p.email}`, className: "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:bg-secondary", children: "Email" })
              ] })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-8 lg:grid-cols-[1fr_320px]", children: [
          /* @__PURE__ */ jsxs("div", { className: "min-w-0 space-y-10", children: [
            gallery.length > 0 && /* @__PURE__ */ jsx("section", { children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-3 sm:grid-cols-3", children: gallery.slice(0, 6).map((src) => /* @__PURE__ */ jsx("div", { className: "aspect-square overflow-hidden rounded-xl bg-muted", children: /* @__PURE__ */ jsx("img", { src, alt: "", loading: "lazy", className: "h-full w-full object-cover transition hover:scale-105" }) }, src)) }) }),
            /* @__PURE__ */ jsxs("section", { children: [
              /* @__PURE__ */ jsxs("h2", { className: "text-2xl font-bold tracking-tight", children: [
                "About ",
                p.name
              ] }),
              p.long_description ? /* @__PURE__ */ jsx("div", { className: "prose prose-sm mt-4 max-w-none whitespace-pre-line text-foreground/90", children: p.long_description }) : p.description ? /* @__PURE__ */ jsx("p", { className: "mt-4 whitespace-pre-line text-foreground/90", children: p.description }) : /* @__PURE__ */ jsx("p", { className: "mt-4 text-muted-foreground", children: "More information about this provider is coming soon." })
            ] }),
            services.length > 0 && /* @__PURE__ */ jsxs("section", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold tracking-tight", children: "Services" }),
              /* @__PURE__ */ jsx("ul", { className: "mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2", children: services.map((s) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm", children: [
                /* @__PURE__ */ jsx("span", { className: "text-primary", children: "✓" }),
                s
              ] }, s)) })
            ] }),
            faq.length > 0 && /* @__PURE__ */ jsxs("section", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold tracking-tight", children: "Frequently asked questions" }),
              /* @__PURE__ */ jsx("div", { className: "mt-4 space-y-3", children: faq.map((f, i) => /* @__PURE__ */ jsxs("details", { className: "group rounded-xl border border-border bg-card p-4", children: [
                /* @__PURE__ */ jsxs("summary", { className: "cursor-pointer list-none font-semibold text-foreground", children: [
                  /* @__PURE__ */ jsx("span", { className: "mr-2 inline-block transition group-open:rotate-90", children: "›" }),
                  f.question
                ] }),
                /* @__PURE__ */ jsx("p", { className: "mt-2 pl-5 text-sm text-foreground/80", children: f.answer })
              ] }, i)) })
            ] }),
            /* @__PURE__ */ jsx("section", { children: /* @__PURE__ */ jsx(ClaimListingCTA, { providerSlug: params.slug, providerName: p.name }) })
          ] }),
          /* @__PURE__ */ jsxs("aside", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-5 shadow-sm", children: [
              /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold uppercase tracking-wide text-muted-foreground", children: "Contact" }),
              /* @__PURE__ */ jsxs("ul", { className: "mt-3 space-y-2 text-sm", children: [
                p.address && /* @__PURE__ */ jsxs("li", { className: "text-foreground/90", children: [
                  "📍 ",
                  p.address
                ] }),
                p.phone && /* @__PURE__ */ jsxs("li", { children: [
                  "📞 ",
                  /* @__PURE__ */ jsx("a", { href: `tel:${p.phone}`, className: "text-primary hover:underline", children: p.phone })
                ] }),
                p.email && /* @__PURE__ */ jsxs("li", { children: [
                  "✉️ ",
                  /* @__PURE__ */ jsx("a", { href: `mailto:${p.email}`, className: "text-primary hover:underline", children: p.email })
                ] }),
                p.website_url && /* @__PURE__ */ jsxs("li", { children: [
                  "🔗 ",
                  /* @__PURE__ */ jsx("a", { href: p.website_url, target: "_blank", rel: "noreferrer noopener", className: "text-primary hover:underline", children: "Website" })
                ] })
              ] })
            ] }),
            p.city && p.state_code && /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-secondary p-5", children: [
              /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold uppercase tracking-wide", children: "Rent your pool" }),
              /* @__PURE__ */ jsxs("p", { className: "mt-2 text-sm text-foreground/80", children: [
                "List your pool in ",
                p.city,
                " and earn $40–$150/hr."
              ] }),
              /* @__PURE__ */ jsx("a", { href: "/l/draft/00000000-0000-0000-0000-000000000000/new/details", className: "mt-3 inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90", children: "List a pool" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("section", { className: "mt-12", children: /* @__PURE__ */ jsx(JoinNetworkForm, { heading: "Are you a pool pro or pool owner?", subheading: "Get listed on Pool Rental Near Me — free directory plus pool-rental income for hosts.", defaultCity: p.city ?? "", defaultState: p.state_code ?? "", sourceProviderSlug: params.slug, sourcePath: path }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
export {
  ProviderPage as component
};
