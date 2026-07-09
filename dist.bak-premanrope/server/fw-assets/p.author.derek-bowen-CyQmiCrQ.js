import { jsxs, jsx } from "react/jsx-runtime";
import { S as SiteHeader, a4 as Breadcrumbs, bJ as PATH, bK as LINKEDIN_URL, bL as AMAZON_AUTHOR_URL, bM as PRESS_URL, bN as BOOKS, bO as cover, bP as amazonUrl, e as SiteFooter } from "./router-B7ZiUt1j.js";
import { Linkedin, BookOpen, ExternalLink } from "lucide-react";
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
import "./client-TSMcDHCK.js";
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
import "./renter-drip.server-69Dq0r1C.js";
import "node:fs";
import "node:path";
import "./host-drip.server-d8aCbPyC.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
function AuthorPage() {
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { children: [
      /* @__PURE__ */ jsx("div", { className: "mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsx(Breadcrumbs, { items: [{
        name: "Home",
        path: "/"
      }, {
        name: "Derek Bowen",
        path: PATH
      }] }) }),
      /* @__PURE__ */ jsx("section", { className: "bg-background", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold uppercase tracking-wide text-primary", children: "Author · Founder · Operator" }),
        /* @__PURE__ */ jsx("h1", { className: "mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl", children: "Derek Bowen" }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-lg text-muted-foreground", children: "Founder & CEO, PRNM Corp · Author of 7 books on the pool rental economy" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-8 grid gap-8 md:grid-cols-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "md:col-span-2 space-y-4 text-base leading-7 text-foreground/90", children: [
            /* @__PURE__ */ jsx("p", { children: "I'm a Class A CDL truck driver and serial entrepreneur with over 20 years building marketplace businesses. I founded PRNM Corp in 2024 after three years of building Pool Rental Near Me from truck stops across the country during my off-hours, alongside my co-founder Brandon Elias." }),
            /* @__PURE__ */ jsx("p", { children: "Pool Rental Near Me is now a national peer-to-peer pool rental marketplace with thousands of indexed city pages and pool hosts earning $3,000 to $12,000 a month from their backyard pools. We charge 0% host fees through 2026 — you keep 100% — include $2M in liability coverage, and have built every piece of the platform — iOS, Android, web, calendar sync, waivers, insurance — without outside funding." }),
            /* @__PURE__ */ jsx("p", { children: "I've written seven books on the pool rental economy, covering everything from a first-time host's playbook to state-by-state legal frameworks to high-ticket positioning for premium pool venues. I write from the operator's seat — not the consultant's." }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Single father of three. Based in Riverside, California." })
          ] }),
          /* @__PURE__ */ jsxs("aside", { className: "space-y-3 rounded-lg border border-border bg-accent/40 p-5", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Find Derek" }),
            /* @__PURE__ */ jsxs("a", { href: LINKEDIN_URL, target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-2 text-sm text-foreground hover:text-primary", children: [
              /* @__PURE__ */ jsx(Linkedin, { className: "h-4 w-4" }),
              " LinkedIn"
            ] }),
            /* @__PURE__ */ jsxs("a", { href: AMAZON_AUTHOR_URL, target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-2 text-sm text-foreground hover:text-primary", children: [
              /* @__PURE__ */ jsx(BookOpen, { className: "h-4 w-4" }),
              " Amazon author page"
            ] }),
            /* @__PURE__ */ jsxs("a", { href: PRESS_URL, target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-2 text-sm text-foreground hover:text-primary", children: [
              /* @__PURE__ */ jsx(ExternalLink, { className: "h-4 w-4" }),
              " Press feature"
            ] }),
            /* @__PURE__ */ jsxs("a", { href: "/p/about-our-company", className: "flex items-center gap-2 text-sm text-foreground hover:text-primary", children: [
              /* @__PURE__ */ jsx(ExternalLink, { className: "h-4 w-4" }),
              " About PRNM Corp"
            ] })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "border-y border-border bg-accent/40", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold tracking-tight text-foreground sm:text-4xl", children: "Books by Derek Bowen" }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 max-w-2xl text-base text-muted-foreground", children: "Seven books on the pool rental economy, all available on Amazon Kindle. Written from inside an operating marketplace, not from the sidelines." }),
        /* @__PURE__ */ jsx("div", { className: "mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3", children: BOOKS.map((b) => /* @__PURE__ */ jsxs("a", { href: amazonUrl(b.asin), target: "_blank", rel: "noopener noreferrer", className: "group flex flex-col gap-3 rounded-lg border border-border bg-background p-5 transition hover:border-primary hover:shadow-md", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
            /* @__PURE__ */ jsx("img", { src: cover(b.cover), alt: `Cover of ${b.title} by Derek Bowen`, loading: "lazy", width: 88, height: 132, className: "h-32 w-22 flex-shrink-0 rounded-sm border border-border object-cover shadow-sm" }),
            /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsx("h3", { className: "text-base font-semibold leading-snug text-foreground group-hover:text-primary", children: b.title }),
              b.subtitle && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs leading-snug text-muted-foreground", children: b.subtitle })
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm leading-6 text-foreground/80", children: b.blurb }),
          /* @__PURE__ */ jsxs("span", { className: "mt-auto inline-flex items-center gap-1 text-xs font-semibold text-primary", children: [
            "Read on Amazon ",
            /* @__PURE__ */ jsx(ExternalLink, { className: "h-3 w-3" })
          ] })
        ] }, b.asin)) })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "bg-background", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-3xl px-4 py-14 text-center sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold tracking-tight text-foreground sm:text-3xl", children: "Want to rent out your own pool?" }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-base text-muted-foreground", children: "List your pool on Pool Rental Near Me. 0% host fees through 2026, $2M liability coverage included, and you keep your calendar in your control." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row", children: [
          /* @__PURE__ */ jsx("a", { href: "/l/draft/00000000-0000-0000-0000-000000000000/new/details", className: "inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90", children: "List your pool" }),
          /* @__PURE__ */ jsx("a", { href: "/s", className: "inline-flex items-center justify-center rounded-md border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-accent", children: "Find a pool to rent" })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
export {
  AuthorPage as component
};
