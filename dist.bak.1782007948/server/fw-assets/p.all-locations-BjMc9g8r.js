import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { as as Route, S as SiteHeader, e as SiteFooter } from "./router-Bk6RtsuF.js";
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
function TopCitiesBlock({
  cities,
  heading = "Top pool rental cities",
  subheading = "Become a host in popular markets",
  className
}) {
  if (!cities?.length) return null;
  return /* @__PURE__ */ jsxs("section", { className: ["mt-12 border-t border-border pt-10", className].filter(Boolean).join(" "), children: [
    /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-foreground", children: heading }),
    subheading && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: subheading }),
    /* @__PURE__ */ jsx("ul", { className: "mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3", children: cities.map((c) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
      Link,
      {
        to: c.hostAcqHref,
        className: "block rounded-lg border border-border bg-card px-3 py-2 text-sm transition hover:border-primary hover:text-primary",
        children: [
          /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground", children: c.name }),
          c.state_code && /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
            ", ",
            c.state_code
          ] })
        ]
      }
    ) }, c.slug)) })
  ] });
}
const TITLE_OVERRIDES = {
  "host-acquisition": "Become a host by city",
  "swim-instructors": "Swim instructors by city",
  "event-guides": "Event and party pool guides",
  "money-guides": "Money and income guides",
  advocacy: "Pool rental laws and advocacy",
  resources: "Articles and resources",
  academy: "Host Academy and courses",
  "pool-maintenance": "Pool maintenance hub",
  spanish: "Guías en español",
  main: "Main pages",
  listings: "Active pool listings"
};
function displayTitle(g) {
  return TITLE_OVERRIDES[g.id] ?? g.title;
}
const STATE_NAMES = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "Washington, D.C."
};
function stateSlug(name) {
  return name.toLowerCase().replace(/[.,]/g, "").replace(/\s+/g, "-");
}
function buildStateIndex(hostAcqLinks) {
  const byState = /* @__PURE__ */ new Map();
  for (const link of hostAcqLinks) {
    const slug = link.href.replace(/^\/p\//, "");
    const parts = slug.split("-");
    const last = parts[parts.length - 1]?.toUpperCase() ?? "";
    if (last.length !== 2 || !STATE_NAMES[last]) continue;
    const cityParts = parts.slice(4, -1);
    if (cityParts.length === 0) continue;
    const city = cityParts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
    const arr = byState.get(last) ?? [];
    arr.push({
      city,
      href: link.href
    });
    byState.set(last, arr);
  }
  return Array.from(byState.entries()).map(([code, cities]) => ({
    code,
    name: STATE_NAMES[code],
    hubHref: `/p/pool-rentals-${stateSlug(STATE_NAMES[code])}`,
    cities: cities.sort((a, b) => a.city.localeCompare(b.city))
  })).sort((a, b) => a.name.localeCompare(b.name));
}
function AllLocationsPage() {
  const data = Route.useLoaderData();
  const cityCount = data.groups.find((g) => g.id === "host-acquisition")?.links.length ?? 0;
  const academyCount = data.groups.find((g) => g.id === "academy")?.links.length ?? 0;
  const sectionCount = data.groups.length;
  const stateIndex = buildStateIndex(data.groups.find((g) => g.id === "host-acquisition")?.links ?? []);
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col bg-background", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1", children: [
      /* @__PURE__ */ jsxs("section", { className: "relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-background to-background", children: [
        /* @__PURE__ */ jsx("div", { "aria-hidden": true, className: "pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" }),
        /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl px-4 py-14 sm:py-20", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.18em] text-primary", children: "Pool rentals near me" }),
          /* @__PURE__ */ jsx("h1", { className: "mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl", children: "Pool rentals near me — every US city with a private pool for rent" }),
          /* @__PURE__ */ jsxs("p", { className: "mt-5 max-w-2xl text-lg text-muted-foreground", children: [
            "The full index of ",
            /* @__PURE__ */ jsx("strong", { children: "pool rentals near me" }),
            ", organized by state and city. Browse every US city where you can book a private backyard pool by the hour. $2M liability insurance included on every booking, flat 10% host fee, no memberships."
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 max-w-2xl text-sm text-muted-foreground", children: "Jump straight to your state below, or scroll for the full directory of host guides, courses, and resources." }),
          /* @__PURE__ */ jsxs("dl", { className: "mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4", children: [
            /* @__PURE__ */ jsx(Stat, { label: "Total URLs", value: data.totalUrls.toLocaleString() }),
            /* @__PURE__ */ jsx(Stat, { label: "Cities", value: cityCount.toLocaleString() }),
            /* @__PURE__ */ jsx(Stat, { label: "Courses", value: academyCount.toLocaleString() }),
            /* @__PURE__ */ jsx(Stat, { label: "Sections", value: sectionCount.toLocaleString() })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "mt-6 text-xs text-muted-foreground", children: [
            "Last updated",
            " ",
            new Date(data.generatedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric"
            })
          ] })
        ] })
      ] }),
      stateIndex.length > 0 && /* @__PURE__ */ jsx("section", { id: "by-state", "aria-label": "Pool rentals by state", className: "border-b border-border bg-card/40", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl px-4 py-10 sm:py-12", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-6 flex flex-wrap items-end justify-between gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold tracking-tight sm:text-3xl", children: "Pool rentals by state" }),
            /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [
              stateIndex.length,
              " states · ",
              cityCount.toLocaleString(),
              " cities with a private pool to rent"
            ] })
          ] }),
          /* @__PURE__ */ jsx("a", { href: "/p/pool-rentals", className: "text-sm font-medium text-primary hover:underline", children: "See 50 state hubs →" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-2 lg:grid-cols-3", children: stateIndex.map((s) => /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("a", { href: s.hubHref, className: "text-base font-semibold text-foreground hover:text-primary hover:underline", children: [
            s.name,
            /* @__PURE__ */ jsxs("span", { className: "ml-2 text-xs font-normal text-muted-foreground", children: [
              "(",
              s.cities.length,
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsx("ul", { className: "mt-2 space-y-1", children: s.cities.map((c) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("a", { href: c.href, className: "text-sm text-muted-foreground hover:text-primary hover:underline", children: [
            c.city,
            ", ",
            s.code
          ] }) }, c.href)) })
        ] }, s.code)) })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-6xl overflow-x-auto px-4 py-3", children: /* @__PURE__ */ jsx("nav", { "aria-label": "Jump to section", className: "flex min-w-max items-center gap-2", children: data.groups.map((g) => /* @__PURE__ */ jsxs("a", { href: `#${g.id}`, className: "inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground transition hover:border-primary hover:text-primary", children: [
        displayTitle(g),
        /* @__PURE__ */ jsx("span", { className: "rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground", children: g.links.length.toLocaleString() })
      ] }, `top-${g.id}`)) }) }) }),
      /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl px-4 py-12", children: [
        data.groups.map((group) => {
          const isAcademy = group.id === "academy";
          return /* @__PURE__ */ jsxs("section", { id: group.id, className: "scroll-mt-24 border-b border-border py-10 last:border-b-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "mb-6 flex flex-wrap items-end justify-between gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "max-w-2xl", children: [
                isAcademy && /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.16em] text-primary", children: "Free for hosts" }),
                /* @__PURE__ */ jsx("h2", { className: "mt-1 text-2xl font-bold tracking-tight sm:text-3xl", children: displayTitle(group) }),
                /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: group.description })
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground", children: [
                group.links.length.toLocaleString(),
                " pages"
              ] })
            ] }),
            /* @__PURE__ */ jsx("ul", { className: isAcademy ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" : "grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4", children: group.links.map((link) => isAcademy ? /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("a", { href: link.href, className: "group block h-full rounded-xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-sm", title: link.label, children: [
              /* @__PURE__ */ jsx("span", { className: "block text-sm font-semibold leading-snug text-foreground group-hover:text-primary", children: link.label }),
              link.sub && /* @__PURE__ */ jsx("span", { className: "mt-1 block text-xs text-muted-foreground", children: link.sub }),
              /* @__PURE__ */ jsx("span", { className: "mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100", children: "Start course →" })
            ] }) }, link.href) : /* @__PURE__ */ jsxs("li", { className: "leading-snug", children: [
              /* @__PURE__ */ jsx("a", { href: link.href, className: "block truncate text-sm text-foreground hover:text-primary hover:underline", title: link.label, children: link.label }),
              link.sub && /* @__PURE__ */ jsx("span", { className: "block truncate text-xs text-muted-foreground", children: link.sub })
            ] }, link.href)) }),
            /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsx("a", { href: "#top", className: "text-xs font-medium text-muted-foreground hover:text-primary", children: "↑ Back to top" }) })
          ] }, group.id);
        }),
        /* @__PURE__ */ jsx(TopCitiesBlock, { cities: data.topCities }),
        /* @__PURE__ */ jsxs("section", { id: "bottom-nav", "aria-label": "All sections", className: "mt-12 rounded-2xl border border-border bg-muted/30 p-6", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Browse all sections" }),
          /* @__PURE__ */ jsx("nav", { className: "mt-4 flex flex-wrap gap-2", children: data.groups.map((g) => /* @__PURE__ */ jsxs("a", { href: `#${g.id}`, className: "rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary", children: [
            displayTitle(g),
            " ",
            /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
              "(",
              g.links.length.toLocaleString(),
              ")"
            ] })
          ] }, `bot-${g.id}`)) }),
          /* @__PURE__ */ jsxs("p", { className: "mt-6 text-xs text-muted-foreground", children: [
            "Looking for the machine-readable version?",
            " ",
            /* @__PURE__ */ jsx("a", { href: "/sitemap.xml", className: "text-primary hover:underline", children: "View XML sitemap →" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
function Stat({
  label,
  value
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-card/60 px-4 py-3 backdrop-blur", children: [
    /* @__PURE__ */ jsx("dt", { className: "text-[11px] font-medium uppercase tracking-wider text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("dd", { className: "mt-1 text-2xl font-bold tracking-tight text-foreground", children: value })
  ] });
}
export {
  AllLocationsPage as component
};
