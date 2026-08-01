import { jsxs, jsx } from "react/jsx-runtime";
import { S as SiteHeader, a4 as Breadcrumbs, aw as PATH, e as SiteFooter } from "./router-Bw8GQi9C.js";
import { Building2, Briefcase, ExternalLink, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import "@tanstack/react-router";
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
import "./site-origin-DalDu5p3.js";
import "./city-slug-Bqls2qOy.js";
import "@tanstack/zod-adapter";
import "./client-Dh5RMKgP.js";
import "./transactional-email.server-BoL6nxoQ.js";
import "@react-email/components";
import "./_unsubscribe-footer-DXp0Y_3B.js";
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
import "./renter-drip.server-CMz_M9Zp.js";
import "node:fs";
import "node:path";
import "./host-drip.server-nBw4NS9X.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
const PRNM_BRANDS = [{
  name: "Pool Rental Near Me",
  domain: "poolrentalnearme.com",
  desc: "Pool rental marketplace — iOS, Android, and web"
}, {
  name: "PoolHostPro",
  domain: "poolhostpro.com",
  desc: "Calendar sync for pool hosts across 8+ platforms"
}];
const SOLUTIONS_BRANDS = [{
  name: "RentalWaivers.com",
  domain: "rentalwaivers.com",
  desc: "Digital liability waivers from 6¢ per signature"
}, {
  name: "BookMyPool.com",
  domain: "bookmypool.com",
  desc: "Direct booking platform for pool hosts, $9/month"
}, {
  name: "Pool Host Academy",
  domain: null,
  desc: "Education and training for pool rental hosts"
}, {
  name: "Founders.click",
  domain: "founders.click",
  desc: "Multi-tenant programmatic SEO platform for marketplace operators (in development)"
}];
const PRESS = [{
  name: "The Tennessean",
  note: "USA Today Network"
}, {
  name: "Arizona Republic",
  note: null
}, {
  name: "National Law Review",
  note: null
}, {
  name: "EIN Presswire",
  note: null
}];
function AboutCompanyPage() {
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 pb-20 sm:pb-0", children: [
      /* @__PURE__ */ jsx("section", { className: "border-b border-border bg-gradient-to-b from-primary/10 via-background to-background", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8", children: [
        /* @__PURE__ */ jsx(Breadcrumbs, { items: [{
          name: "Home",
          path: "/"
        }, {
          name: "About Our Company",
          path: PATH
        }] }),
        /* @__PURE__ */ jsx("p", { className: "mt-6 text-xs font-bold uppercase tracking-[0.2em] text-primary", children: "Corporate" }),
        /* @__PURE__ */ jsx("h1", { className: "mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl", children: "About our company" }),
        /* @__PURE__ */ jsx("p", { className: "mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl", children: "Pool Rental Near Me is operated by PRNM Corp, a Delaware C-Corporation. PRNM Corp is sister to 10,000 Solutions LLC, a California-registered company. Together, we operate a portfolio of brands serving the rental economy." })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "bg-background", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold tracking-tight text-foreground sm:text-4xl", children: "Corporate structure" }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 max-w-2xl text-base text-muted-foreground", children: "Two separate legal entities. One mission: build software that helps real operators earn more." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-10 grid gap-6 md:grid-cols-2", children: [
          /* @__PURE__ */ jsx(EntityCard, { icon: Building2, name: "PRNM Corp", jurisdiction: "Delaware C-Corporation", description: "PRNM Corp operates Pool Rental Near Me, a peer-to-peer pool rental marketplace serving 40+ U.S. states. Every booking includes $2,000,000 in liability coverage. With 0% host fees through 2026, PRNM Corp is the leading marketplace for pool hosts who want to keep more of what they earn.", brands: PRNM_BRANDS }),
          /* @__PURE__ */ jsx(EntityCard, { icon: Briefcase, name: "10,000 Solutions LLC", jurisdiction: "California Limited Liability Company", description: "10,000 Solutions LLC operates a portfolio of SaaS and education products built for rental-economy operators. Built by operators, for operators.", brands: SOLUTIONS_BRANDS })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "border-y border-border bg-accent/40", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold tracking-tight text-foreground sm:text-4xl", children: "Leadership" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-10 grid gap-6 md:grid-cols-2", children: [
          /* @__PURE__ */ jsx(LeaderCard, { name: "Derek Bowen", title: "Founder & CEO, PRNM Corp", bio: "Derek Bowen is a Class A CDL truck driver and serial entrepreneur with over 20 years of experience building marketplace businesses. He founded PRNM Corp in 2024 after spending three years building Pool Rental Near Me from truck stops across the country during his off-hours. Derek is a single father of three and writes about marketplace operations, programmatic SEO, and bootstrapped startup growth." }),
          /* @__PURE__ */ jsx(LeaderCard, { name: "Brandon Elias", title: "Co-Founder & COO, PRNM Corp", bio: "Brandon Elias is Co-Founder and COO of PRNM Corp. Like Derek, Brandon is a Class A CDL driver who helped build Pool Rental Near Me from the ground up. Brandon leads platform operations, host success, and trust and safety across the marketplace." })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "bg-background", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold tracking-tight text-foreground sm:text-4xl", children: "Contact" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-10 grid gap-6 md:grid-cols-2", children: [
          /* @__PURE__ */ jsx(ContactCard, { entity: "PRNM Corp", email: "derek@poolrentalnearme.com", phoneHref: "tel:18889404247", phoneLabel: "(888) 940-4247", address: "Mailing address available upon request" }),
          /* @__PURE__ */ jsx(ContactCard, { entity: "10,000 Solutions LLC", email: "derek@10000solutions.com", phoneHref: "tel:19092728096", phoneLabel: "(909) 272-8096", address: "Riverside, California" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "border-t border-border bg-accent/40", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold tracking-tight text-foreground sm:text-4xl", children: "In the press" }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-base text-muted-foreground", children: "PRNM Corp has been featured in:" }),
        /* @__PURE__ */ jsx("ul", { className: "mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4", children: PRESS.map((p) => /* @__PURE__ */ jsxs("li", { className: "rounded-xl border border-border bg-background p-4 text-center shadow-sm", children: [
          /* @__PURE__ */ jsx("div", { className: "text-base font-semibold text-foreground", children: p.name }),
          p.note ? /* @__PURE__ */ jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: p.note }) : null
        ] }, p.name)) }),
        /* @__PURE__ */ jsx("div", { className: "mt-8", children: /* @__PURE__ */ jsxs("a", { href: "https://www.einpresswire.com/article/908834379/two-truck-drivers-built-a-national-pool-rental-marketplace-on-their-off-hours", target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-accent", children: [
          "Read the press release",
          /* @__PURE__ */ jsx(ExternalLink, { className: "h-4 w-4" })
        ] }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function EntityCard({
  icon: Icon,
  name,
  jurisdiction,
  description,
  brands
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8", children: [
    /* @__PURE__ */ jsx("div", { className: "flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary", children: /* @__PURE__ */ jsx(Icon, { className: "h-6 w-6" }) }),
    /* @__PURE__ */ jsx("h3", { className: "mt-4 text-2xl font-bold text-foreground", children: name }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm font-medium uppercase tracking-wide text-primary", children: jurisdiction }),
    /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm leading-relaxed text-muted-foreground", children: description }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 border-t border-border pt-5", children: [
      /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold uppercase tracking-[0.18em] text-foreground", children: "Operating brands" }),
      /* @__PURE__ */ jsx("ul", { className: "mt-4 space-y-3", children: brands.map((b) => /* @__PURE__ */ jsxs("li", { className: "text-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "font-semibold text-foreground", children: [
          b.name,
          b.domain ? /* @__PURE__ */ jsxs("span", { className: "ml-1 font-normal text-muted-foreground", children: [
            "(",
            b.domain,
            ")"
          ] }) : null
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-0.5 text-muted-foreground", children: b.desc })
      ] }, b.name)) })
    ] })
  ] });
}
function LeaderCard({
  name,
  title,
  bio
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-8", children: [
    /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-foreground", children: name }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm font-medium text-primary", children: title }),
    /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm leading-relaxed text-muted-foreground", children: bio }),
    /* @__PURE__ */ jsxs("a", { href: "#", "aria-label": `${name} on LinkedIn`, className: "mt-5 inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary", children: [
      /* @__PURE__ */ jsx(Linkedin, { className: "h-4 w-4" }),
      "LinkedIn"
    ] })
  ] });
}
function ContactCard({
  entity,
  email,
  phoneHref,
  phoneLabel,
  address
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8", children: [
    /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-foreground", children: entity }),
    /* @__PURE__ */ jsxs("ul", { className: "mt-5 space-y-3 text-sm", children: [
      /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-3", children: [
        /* @__PURE__ */ jsx(Mail, { className: "mt-0.5 h-4 w-4 shrink-0 text-primary" }),
        /* @__PURE__ */ jsx("a", { href: `mailto:${email}`, className: "text-foreground hover:text-primary", children: email })
      ] }),
      /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-3", children: [
        /* @__PURE__ */ jsx(Phone, { className: "mt-0.5 h-4 w-4 shrink-0 text-primary" }),
        /* @__PURE__ */ jsx("a", { href: phoneHref, className: "text-foreground hover:text-primary", children: phoneLabel })
      ] }),
      /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-3", children: [
        /* @__PURE__ */ jsx(MapPin, { className: "mt-0.5 h-4 w-4 shrink-0 text-primary" }),
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: address })
      ] })
    ] })
  ] });
}
export {
  AboutCompanyPage as component
};
