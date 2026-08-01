import { jsxs, jsx } from "react/jsx-runtime";
import { S as SiteHeader, a4 as Breadcrumbs, a5 as PATH, e as SiteFooter } from "./router-Bw8GQi9C.js";
import { Bell, Phone, Users, Home, ShieldCheck, Volume2, Car, Headphones } from "lucide-react";
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
const heroImage = "/fw-assets/neighbors-hero-RK0a0qAg.jpg";
const REPORT_HREF = "mailto:support@poolrentalnearme.com?subject=Report%20a%20host%20-%20neighbor%20concern";
const SIGNUP_HREF = "/signup";
const PRACTICES = [{
  n: 1,
  icon: Bell,
  title: "Notify neighbors",
  body: "Hosts let nearby neighbors know before listing their pool. A quick heads up over the fence prevents surprises and builds goodwill from day one."
}, {
  n: 2,
  icon: Phone,
  title: "Exchange contact info",
  body: "Hosts share a direct phone number with adjacent neighbors and point them to our 24/7 support line. Small issues get solved in minutes, not days."
}, {
  n: 3,
  icon: Users,
  title: "We are responsible",
  body: "Hosts cap guest count and parking based on what their street can handle, keep rental hours reasonable, and require quiet music after 8pm. Noise and crowds are the fastest way to lose a listing."
}, {
  n: 4,
  icon: Home,
  title: "We are home",
  body: "Hosts are home for about 85% of bookings, and on-site for every reservation with 15 or more guests. That hands-on supervision is why noise complaints stay rare."
}];
const HOST_RULES = [{
  icon: ShieldCheck,
  title: "Verified hosts",
  body: "ID verified, listing photos reviewed, $2M liability insurance on every booking."
}, {
  icon: Volume2,
  title: "Quiet hours",
  body: "Music kept to conversational volume after 8pm. No outdoor speakers facing neighboring yards."
}, {
  icon: Car,
  title: "Parking caps",
  body: "Guest car limit set per listing based on driveway and street space, never overflow onto neighbor frontage."
}, {
  icon: Users,
  title: "Guest limits",
  body: "Group sizes capped to what the pool and yard safely fit. Larger groups require host on property."
}];
function NeighborsPage() {
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsx("div", { className: "border-b border-border bg-muted/30", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto flex max-w-6xl items-center justify-between px-4 py-2 text-sm", children: [
      /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Neighbor of a Pool Rental Near Me host?" }),
      /* @__PURE__ */ jsx("a", { href: REPORT_HREF, className: "font-semibold text-primary hover:underline", children: "Report a host →" })
    ] }) }),
    /* @__PURE__ */ jsxs("main", { className: "mx-auto max-w-6xl px-4 py-10", children: [
      /* @__PURE__ */ jsx(Breadcrumbs, { items: [{
        name: "Home",
        path: "/"
      }, {
        name: "Neighbors",
        path: PATH
      }] }),
      /* @__PURE__ */ jsxs("section", { className: "mt-6 grid gap-8 md:grid-cols-2 md:items-center", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold uppercase tracking-wide text-primary", children: "Community care" }),
          /* @__PURE__ */ jsx("h1", { className: "mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl", children: "Pool Rental Near Me neighbors" }),
          /* @__PURE__ */ jsx("p", { className: "mt-5 text-lg text-muted-foreground", children: "Welcome to our neighbors page. Pool Rental Near Me is built on enhancing communities at the local level, giving homeowners a way to earn an extra income by sharing their backyard pool with nearby families looking for a private, safe afternoon together." }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-lg text-muted-foreground", children: "Quality, safety, and community come first. The standards on this page are how we keep it that way." }),
          /* @__PURE__ */ jsxs("div", { className: "mt-7 flex flex-wrap gap-3", children: [
            /* @__PURE__ */ jsx("a", { href: REPORT_HREF, className: "inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90", children: "Report a host" }),
            /* @__PURE__ */ jsx("a", { href: SIGNUP_HREF, className: "inline-flex items-center justify-center rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary", children: "Sign up" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-2xl border border-border", children: /* @__PURE__ */ jsx("img", { src: heroImage, alt: "Two neighbors chatting over a backyard fence", width: 1536, height: 1024, className: "h-full w-full object-cover" }) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mt-16", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold tracking-tight text-foreground", children: "Good neighbor practices" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 max-w-2xl text-muted-foreground", children: "Every host on Pool Rental Near Me agrees to these four standards before a single guest books their pool." }),
        /* @__PURE__ */ jsx("div", { className: "mt-8 grid gap-5 sm:grid-cols-2", children: PRACTICES.map((p) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold", children: p.n }),
            /* @__PURE__ */ jsx(p.icon, { className: "h-5 w-5 text-primary", "aria-hidden": true }),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-foreground", children: p.title })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: p.body })
        ] }, p.n)) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mt-16", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold tracking-tight text-foreground", children: "How we protect your block" }),
        /* @__PURE__ */ jsx("div", { className: "mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: HOST_RULES.map((r) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-5", children: [
          /* @__PURE__ */ jsx(r.icon, { className: "h-6 w-6 text-primary", "aria-hidden": true }),
          /* @__PURE__ */ jsx("h3", { className: "mt-3 font-semibold text-foreground", children: r.title }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: r.body })
        ] }, r.title)) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mt-16 grid gap-8 rounded-2xl border border-border bg-muted/40 p-8 md:grid-cols-[auto_1fr] md:items-center", children: [
        /* @__PURE__ */ jsx("div", { className: "flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground", children: /* @__PURE__ */ jsx(Headphones, { className: "h-10 w-10", "aria-hidden": true }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-foreground", children: "Our Community Care team was built for you" }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-muted-foreground", children: "If you think a host is breaking these standards, talking to them directly usually solves it the fastest. If that does not work, send our Community Care team the pool address or the host's name and we will take it from there. You will get a support ticket and a real human reply within 24 hours, usually much sooner." }),
          /* @__PURE__ */ jsx("a", { href: REPORT_HREF, className: "mt-5 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90", children: "Report a host" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mt-12 border-t border-border pt-8 text-center", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Neighbor of a Pool Rental Near Me host with a question or concern?" }),
        /* @__PURE__ */ jsx("a", { href: REPORT_HREF, className: "mt-2 inline-block text-base font-semibold text-primary hover:underline", children: "Report a host →" })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
export {
  NeighborsPage as component
};
