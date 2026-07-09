import { jsxs, jsx } from "react/jsx-runtime";
import { S as SiteHeader, v as heroImage, w as FAQS, e as SiteFooter } from "./router-OI82CwOi.js";
import { Link } from "@tanstack/react-router";
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
import "lucide-react";
import "./states-UIdvqlKs.js";
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
import "./renter-drip.server-CZnPPh9d.js";
import "./emailit-DRsipvVx.js";
import "node:fs";
import "node:path";
import "./host-drip.server-Cdm15px5.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
const LIST_HREF = "/l/draft/00000000-0000-0000-0000-000000000000/new/details";
const CITY_LINKS = [{
  name: "Los Angeles, CA",
  slug: "los-angeles-ca"
}, {
  name: "San Diego, CA",
  slug: "san-diego-ca"
}, {
  name: "Phoenix, AZ",
  slug: "phoenix-az"
}, {
  name: "Houston, TX",
  slug: "houston-tx"
}, {
  name: "Dallas, TX",
  slug: "dallas-tx"
}, {
  name: "Austin, TX",
  slug: "austin-tx"
}, {
  name: "Miami, FL",
  slug: "miami-fl"
}, {
  name: "Orlando, FL",
  slug: "orlando-fl"
}, {
  name: "Tampa, FL",
  slug: "tampa-fl"
}, {
  name: "Las Vegas, NV",
  slug: "las-vegas-nv"
}, {
  name: "Atlanta, GA",
  slug: "atlanta-ga"
}, {
  name: "Charlotte, NC",
  slug: "charlotte-nc"
}];
const PRICING_ROWS = [{
  tier: "Standard private pool",
  range: "$40 to $75 / hour",
  note: "Typical backyard pool, seating, basic amenities"
}, {
  tier: "Heated pool or hot tub access",
  range: "$60 to $100 / hour",
  note: "Year-round bookable, hot tub or heated pool"
}, {
  tier: "Luxury backyard",
  range: "$100 to $150 / hour",
  note: "Resort-style: hot tub, outdoor kitchen, cabana"
}];
function PrivatePoolRentalPage() {
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col bg-background", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1", children: [
      /* @__PURE__ */ jsxs("section", { className: "relative overflow-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "absolute inset-0", children: [
          /* @__PURE__ */ jsx("img", { src: heroImage, alt: "Family enjoying a private backyard pool rental", className: "h-full w-full object-cover", loading: "eager" }),
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative mx-auto max-w-3xl px-4 py-20 text-center text-white sm:py-28", children: [
          /* @__PURE__ */ jsxs("nav", { className: "mb-4 text-xs text-white/80", children: [
            /* @__PURE__ */ jsx(Link, { to: "/", className: "hover:text-white", children: "Home" }),
            /* @__PURE__ */ jsx("span", { className: "mx-1.5", children: "/" }),
            /* @__PURE__ */ jsx("span", { children: "Private pool rental" })
          ] }),
          /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold tracking-tight sm:text-5xl", children: "Private pool rental by the hour" }),
          /* @__PURE__ */ jsx("p", { className: "mt-5 text-lg leading-relaxed text-white/90 sm:text-xl", children: "Book a private pool for an afternoon, an evening, or a full day. Heated pools, hot tubs, and saltwater backyards across America. You get the whole place to yourself, with $2M in liability coverage included on every booking." }),
          /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row", children: [
            /* @__PURE__ */ jsx("a", { href: "/s", className: "inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-lg transition hover:opacity-90", children: "Find a private pool near you" }),
            /* @__PURE__ */ jsx("a", { href: "#how-it-works", className: "inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-8 py-3 text-base font-semibold text-white backdrop-blur transition hover:bg-white/20", children: "How it works" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl px-4 py-12 sm:py-16", children: [
        /* @__PURE__ */ jsxs("article", { className: "prose prose-slate max-w-none text-foreground\n              prose-headings:font-semibold prose-headings:tracking-tight\n              prose-h2:mt-12 prose-h2:text-2xl prose-h2:border-b prose-h2:border-border prose-h2:pb-2\n              prose-h3:mt-8 prose-h3:text-xl\n              prose-p:leading-relaxed\n              prose-a:text-primary hover:prose-a:underline\n              prose-strong:text-foreground\n              prose-ul:my-4 prose-li:my-1.5\n              dark:prose-invert", children: [
          /* @__PURE__ */ jsx("h2", { children: "Why people book a private pool by the hour" }),
          /* @__PURE__ */ jsx("p", { children: "Public pools are crowded, hotel pools are off-limits unless you are a guest, and a backyard pool of your own costs $40,000 plus chemicals, repairs, and time. Renting a private pool for a few hours solves all of that. You get water, sunshine, and space for your people, and you go home when you are done." }),
          /* @__PURE__ */ jsx("p", { children: "Most guests on Pool Rental Near Me book for one of five reasons: family swim time, a small party, a date or anniversary, a workout or therapy session, or a photo or video shoot. The marketplace is hourly, so you pay for the time you actually use." }),
          /* @__PURE__ */ jsx("h3", { children: "Family days and quiet swims" }),
          /* @__PURE__ */ jsx("p", { children: "Parents with toddlers want a shallow, fenced, sunscreen-friendly spot without 200 strangers and a chlorine fog. A two-hour booking at a fenced backyard pool, with a hot tub on the side for grandma, runs $80 to $150 total. That is less than a single day pass for four people at most resort pools." }),
          /* @__PURE__ */ jsx("h3", { children: "Birthday parties and small celebrations" }),
          /* @__PURE__ */ jsxs("p", { children: [
            "Birthdays, graduations, baby showers, and bachelorette weekends do well in backyard settings. A private pool with seating for 15 and a grill turns into the whole event. For larger parties, see our",
            " ",
            /* @__PURE__ */ jsx("a", { href: "/p/pool-party-rentals", children: "pool party rentals guide" }),
            " for listings sized for 20 to 50 guests."
          ] }),
          /* @__PURE__ */ jsx("h3", { children: "Therapy, recovery, and accessibility" }),
          /* @__PURE__ */ jsx("p", { children: "Warm water helps people who cannot use a crowded public pool. Wheelchair users, seniors easing back into movement, kids with sensory sensitivities, and adults working through joint pain often book heated private pools by the hour because the space is calm, the entry is private, and the schedule is theirs. Look for listings tagged step entry, zero entry, heated, or ADA when you search." }),
          /* @__PURE__ */ jsx("h3", { children: "Photoshoots and content" }),
          /* @__PURE__ */ jsx("p", { children: "Photographers, brands, and creators rent pools for shoots that need water, sun, and a clean backyard. Permits for public pools are slow and expensive. A two-hour private booking gets you the location, the privacy, and a host who can point you to the best light." }),
          /* @__PURE__ */ jsx("h2", { children: "What a private pool rental costs" }),
          /* @__PURE__ */ jsx("p", { children: "Pricing is set by each host and varies by city, pool size, and amenities. Across the marketplace, three patterns hold:" }),
          /* @__PURE__ */ jsx("div", { className: "not-prose my-8 overflow-x-auto rounded-2xl border border-border", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-muted/60 text-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left font-semibold", children: "Tier" }),
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left font-semibold", children: "Hourly range" }),
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left font-semibold", children: "What you usually get" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { children: PRICING_ROWS.map((r) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border align-top", children: [
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-medium", children: r.tier }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: r.range }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-muted-foreground", children: r.note })
            ] }, r.tier)) })
          ] }) }),
          /* @__PURE__ */ jsx("p", { children: "Most listings have a two-hour minimum. Weekends and holidays command higher rates. Off-peak weekday mornings are the cheapest way to try a private pool for the first time." }),
          /* @__PURE__ */ jsx("h2", { children: "What to look for in a listing" }),
          /* @__PURE__ */ jsx("p", { children: "Filter by what actually matters to your group. Three of the most useful keyword searches:" }),
          /* @__PURE__ */ jsxs("ul", { children: [
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("a", { href: "/s?keyword=heated", children: "Heated pools" }),
              " ",
              "for cooler months and year-round bookings."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("a", { href: "/s?keyword=hot%20tub", children: "Hot tub listings" }),
              " ",
              "for year-round bookable spots, great for cold-weather dates and small gatherings."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("a", { href: "/s?keyword=saltwater", children: "Saltwater pools" }),
              " ",
              "for people with chlorine sensitivities or kids with eczema."
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { children: "Read the house rules before you book. Hosts list group size, whether glass is allowed, pet policy, music and noise cutoffs, parking, and what comes with the space (towels, restroom access, shade, grill, sound system). Photos tell the rest." }),
          /* @__PURE__ */ jsx("h2", { children: "What is not included, and what to know" }),
          /* @__PURE__ */ jsx("p", { children: "Real talk so you book with eyes open. A private pool rental is exclusive use of a stranger's backyard for a few hours, not a hotel resort:" }),
          /* @__PURE__ */ jsxs("ul", { children: [
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "No lifeguard on site." }),
              " Adults in your group are responsible for supervising swimmers. Bring an adult who knows how to swim."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Pool depth varies." }),
              " Many backyard pools are 3 to 6 feet, not diving depth. Check the listing if you need deep water."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Glass is usually prohibited." }),
              " Most hosts ban glass containers in the pool area for safety. Bring plastic or cans."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Restroom access varies." }),
              " Some hosts offer a pool-house bathroom, others ask guests to use a designated indoor bathroom. Check before you book a long session."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Weather is your risk." }),
              " Hosts set their own cancellation windows. Read the policy on the listing before you book a date with iffy forecast."
            ] })
          ] }),
          /* @__PURE__ */ jsx("h2", { id: "how-it-works", children: "How booking works" }),
          /* @__PURE__ */ jsxs("ol", { children: [
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Search by city or address." }),
              " Filter by date, group size, amenities, and price."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Pick a slot and pay." }),
              " Each listing shows the host's hourly rate, minimum hours, and available time slots."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Host confirms." }),
              " Most bookings confirm in under an hour. You get the address and house rules once confirmed."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Show up, swim, head home." }),
              " Stay within your booked window. Leave the space the way you found it."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Rate your host." }),
              " Every booking carries $2M in liability coverage at no extra cost to you."
            ] })
          ] }),
          /* @__PURE__ */ jsx("h2", { children: "Find a private pool in your city" }),
          /* @__PURE__ */ jsx("p", { children: "These metros have the deepest pool inventory on Pool Rental Near Me. Click your city for local listings and pricing:" }),
          /* @__PURE__ */ jsx("div", { className: "not-prose my-6 grid grid-cols-2 gap-2 sm:grid-cols-3", children: CITY_LINKS.map((c) => /* @__PURE__ */ jsx(Link, { to: `/p/${c.slug}`, className: "rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:bg-primary/5", children: c.name }, c.slug)) }),
          /* @__PURE__ */ jsxs("p", { children: [
            "Browse ",
            /* @__PURE__ */ jsx(Link, { to: "/p/all-locations", children: "every US city with a private pool rental available" }),
            " ",
            "for the full directory."
          ] }),
          /* @__PURE__ */ jsx("h2", { children: "Frequently asked questions" }),
          FAQS.map((f) => /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { children: f.q }),
            /* @__PURE__ */ jsx("p", { children: f.a })
          ] }, f.q))
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "not-prose my-12 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center", children: [
          /* @__PURE__ */ jsx("h2", { className: "m-0 text-2xl font-semibold text-foreground", children: "Ready to book a private pool?" }),
          /* @__PURE__ */ jsx("p", { className: "mx-auto mt-3 max-w-xl text-base text-muted-foreground", children: "Browse heated pools, hot tubs, and luxury backyards in your city. $2M liability coverage included on every booking." }),
          /* @__PURE__ */ jsx("a", { href: "/s", className: "mt-5 inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-sm transition hover:opacity-90", children: "Find a private pool near you" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "not-prose my-12 rounded-2xl border border-border bg-muted/40 p-6", children: [
          /* @__PURE__ */ jsx("h2", { className: "m-0 text-xl font-semibold text-foreground", children: "Have a pool? List it free" }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-base text-muted-foreground", children: "Hosts on Pool Rental Near Me earn $1,500 to $8,000 a month renting their backyard pool by the hour. Flat 10% host fee, so you keep 90% of every booking. We eat the credit card processing fees, so 90% means 90%. $2M liability coverage included." }),
          /* @__PURE__ */ jsx("a", { href: LIST_HREF, className: "mt-5 inline-flex items-center justify-center rounded-full bg-foreground px-8 py-3 text-base font-semibold text-background shadow-sm transition hover:opacity-90", children: "List your pool free" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
export {
  PrivatePoolRentalPage as component
};
