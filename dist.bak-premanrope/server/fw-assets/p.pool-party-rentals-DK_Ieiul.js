import { jsxs, jsx } from "react/jsx-runtime";
import { S as SiteHeader, Y as heroImage, Z as FAQS, e as SiteFooter } from "./router-B7ZiUt1j.js";
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
const LIST_HREF = "/l/draft/00000000-0000-0000-0000-000000000000/new/details";
const CITY_LINKS = [{
  name: "Los Angeles, CA",
  slug: "los-angeles-ca"
}, {
  name: "San Diego, CA",
  slug: "san-diego-ca"
}, {
  name: "Sacramento, CA",
  slug: "sacramento-ca"
}, {
  name: "Phoenix, AZ",
  slug: "phoenix-az"
}, {
  name: "Las Vegas, NV",
  slug: "las-vegas-nv"
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
  name: "Austin, TX",
  slug: "austin-tx"
}, {
  name: "Dallas, TX",
  slug: "dallas-tx"
}, {
  name: "Houston, TX",
  slug: "houston-tx"
}, {
  name: "Atlanta, GA",
  slug: "atlanta-ga"
}];
const PRICING_ROWS = [{
  tier: "Small gathering (5 to 15 guests)",
  range: "$40 to $75 / hour",
  note: "Birthdays, family swim, small showers"
}, {
  tier: "Mid-size party (16 to 30 guests)",
  range: "$75 to $120 / hour",
  note: "Graduations, quinceañeras, bachelorettes"
}, {
  tier: "Large party (31 to 50 guests)",
  range: "$120 to $200 / hour",
  note: "Company offsites, milestone birthdays"
}];
function PoolPartyRentalsPage() {
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col bg-background", children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1", children: [
      /* @__PURE__ */ jsxs("section", { className: "relative overflow-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "absolute inset-0", children: [
          /* @__PURE__ */ jsx("img", { src: heroImage, alt: "Backyard pool party at golden hour with guests gathered around the water", className: "h-full w-full object-cover", loading: "eager" }),
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative mx-auto max-w-3xl px-4 py-20 text-center text-white sm:py-28", children: [
          /* @__PURE__ */ jsxs("nav", { className: "mb-4 text-xs text-white/80", children: [
            /* @__PURE__ */ jsx(Link, { to: "/", className: "hover:text-white", children: "Home" }),
            /* @__PURE__ */ jsx("span", { className: "mx-1.5", children: "/" }),
            /* @__PURE__ */ jsx("span", { children: "Pool party rentals" })
          ] }),
          /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold tracking-tight sm:text-5xl", children: "Pool party rentals by the hour" }),
          /* @__PURE__ */ jsx("p", { className: "mt-5 text-lg leading-relaxed text-white/90 sm:text-xl", children: "Book a private backyard for your birthday, graduation, baby shower, or company offsite. Pool party rentals across America, hourly pricing, and $2M in liability coverage on every booking." }),
          /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row", children: [
            /* @__PURE__ */ jsx("a", { href: "/s?keyword=pool%20party", className: "inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-lg transition hover:opacity-90", children: "Find a pool party rental near you" }),
            /* @__PURE__ */ jsx("a", { href: "#how-it-works", className: "inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-8 py-3 text-base font-semibold text-white backdrop-blur transition hover:bg-white/20", children: "How it works" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl px-4 py-12 sm:py-16", children: [
        /* @__PURE__ */ jsxs("article", { className: "prose prose-slate max-w-none text-foreground\n              prose-headings:font-semibold prose-headings:tracking-tight\n              prose-h2:mt-12 prose-h2:text-2xl prose-h2:border-b prose-h2:border-border prose-h2:pb-2\n              prose-h3:mt-8 prose-h3:text-xl\n              prose-p:leading-relaxed\n              prose-a:text-primary hover:prose-a:underline\n              prose-strong:text-foreground\n              prose-ul:my-4 prose-li:my-1.5\n              dark:prose-invert", children: [
          /* @__PURE__ */ jsx("h2", { children: "Why people book pool party rentals" }),
          /* @__PURE__ */ jsx("p", { children: "Hosting a party at home means cleaning the house, parking traffic on your street, and hoping the weather plays nice. Booking a backyard at a public park means permits, shared space, and a two-hour window. Pool party rentals solve both. You get a private backyard with a pool, hot tub, seating, and shade for a few hours. You bring the people, the food, and the music. When the party ends you go home, and someone else cleans up." }),
          /* @__PURE__ */ jsx("p", { children: "Most pool party rentals on Pool Rental Near Me cost $40 to $200 per hour depending on group size, amenities, and city. Hosts set their own pricing, minimum hours, and house rules. A guest service fee is applied at checkout on top of the hourly rate. Hosts keep 100% of every booking — 0% host fees through 2026." }),
          /* @__PURE__ */ jsx("h2", { children: "Party types that work great in a backyard pool" }),
          /* @__PURE__ */ jsx("h3", { children: "Birthday parties" }),
          /* @__PURE__ */ jsx("p", { children: "Kid birthdays, adult milestone birthdays, and surprise parties all run well in a backyard with a pool. A two or three hour booking covers swim time, cake, and presents without rushing. Pick a host with shaded seating if you have grandparents or little kids who need to step out of the sun." }),
          /* @__PURE__ */ jsx("h3", { children: "Graduations, sweet 16s, and quinceañeras" }),
          /* @__PURE__ */ jsx("p", { children: "These need space for 20 to 50 guests, room for a DJ or playlist setup, and somewhere to take photos. Filter for backyards with a pool deck, outdoor sound system, and a lawn area for tables. Three to four hour bookings are typical." }),
          /* @__PURE__ */ jsx("h3", { children: "Baby showers and bridal showers" }),
          /* @__PURE__ */ jsx("p", { children: "Daytime, mid-sized, and photo-friendly. A heated pool extends the shower season into spring and fall. Look for listings with a covered patio so food and gifts stay out of the sun." }),
          /* @__PURE__ */ jsx("h3", { children: "Bachelorette weekends" }),
          /* @__PURE__ */ jsx("p", { children: "Group photos, day drinking, and pool floats. Pick a host that allows music and check the noise cutoff before booking. Many hosts allow extended afternoon bookings on Saturdays." }),
          /* @__PURE__ */ jsx("h3", { children: "Company offsites and team events" }),
          /* @__PURE__ */ jsx("p", { children: "Quarterly team gatherings, small holiday parties, and client appreciation days work well in a backyard pool setting. Most hosts welcome catering and food trucks with advance notice. Ask about parking for larger teams." }),
          /* @__PURE__ */ jsx("h3", { children: "Content shoots and influencer days" }),
          /* @__PURE__ */ jsx("p", { children: "Music videos, influencer content, brand shoots, and product photography. Commercial shoots require host approval upfront, so note it in your booking request. Two to four hour blocks are typical, and hosts usually charge a small commercial premium." }),
          /* @__PURE__ */ jsx("h2", { children: "What a pool party rental costs" }),
          /* @__PURE__ */ jsx("p", { children: "Pricing scales with group size and amenities. These ranges hold across most cities on the marketplace:" }),
          /* @__PURE__ */ jsx("div", { className: "not-prose my-8 overflow-x-auto rounded-2xl border border-border", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-muted/60 text-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left font-semibold", children: "Tier" }),
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left font-semibold", children: "Hourly range" }),
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left font-semibold", children: "Best for" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { children: PRICING_ROWS.map((r) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border align-top", children: [
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-medium", children: r.tier }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: r.range }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-muted-foreground", children: r.note })
            ] }, r.tier)) })
          ] }) }),
          /* @__PURE__ */ jsx("p", { children: "Weekends and holidays cost more than weekday afternoons. If your date is flexible, a Friday afternoon booking can run 20% to 30% less than the same slot on Saturday." }),
          /* @__PURE__ */ jsx("h2", { children: "What to filter for when you search" }),
          /* @__PURE__ */ jsxs("ul", { children: [
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("a", { href: "/s?keyword=heated", children: "Heated pools" }),
              " ",
              "so cool mornings and shoulder-season dates still work."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("a", { href: "/s?keyword=hot%20tub", children: "Hot tub listings" }),
              " ",
              "for bachelorettes, anniversaries, and adult-only parties."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("a", { href: "/s?keyword=saltwater", children: "Saltwater pools" }),
              " ",
              "for guests with chlorine sensitivities or kids with eczema."
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { children: "Read each listing's house rules before you book. Hosts spell out maximum guest count, music cutoff time, whether glass is allowed, pet policy, parking, and what comes with the space." }),
          /* @__PURE__ */ jsx("h2", { children: "What is not included" }),
          /* @__PURE__ */ jsx("p", { children: "A pool party rental is exclusive use of a private backyard for a few hours. Things to plan for separately:" }),
          /* @__PURE__ */ jsxs("ul", { children: [
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Food and drink." }),
              " Bring your own or hire catering. Most hosts allow outside food. Glass is usually banned in the pool area."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Lifeguard." }),
              " Not included. Adults in your group supervise swimmers. Bring a designated water-watcher when kids are present."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Music cutoff." }),
              " Most cities have noise ordinances. Hosts typically cut amplified music at 9 or 10pm. Check the listing before you hire a DJ."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Trash and cleanup." }),
              " Bag your trash, leave the space the way you found it. Some hosts charge a cleaning fee if the yard is left a mess."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Inflatables and bounce houses." }),
              " Pool floats are fine. Anything anchored to the yard needs host approval."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Weather." }),
              " Each host sets their own rain and cancellation policy. Read it before booking a date with iffy forecast."
            ] })
          ] }),
          /* @__PURE__ */ jsx("h2", { id: "how-it-works", children: "How booking a pool party works" }),
          /* @__PURE__ */ jsxs("ol", { children: [
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Search by city." }),
              " ",
              /* @__PURE__ */ jsx("a", { href: "/s?keyword=pool%20party", children: "Browse pool party listings" }),
              " ",
              "near you and filter by date, group size, and amenities."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Pick a slot and submit." }),
              " Each listing shows the host's hourly rate, minimum hours, and available time blocks."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Host confirms." }),
              " Most bookings confirm in under an hour. You get the address and house rules once confirmed."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Show up, swim, party." }),
              " Stay within your booked window. Respect house rules and the music cutoff."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Pack out, rate your host." }),
              " Bag your trash and head home. Every booking carries $2M in liability coverage at no extra cost."
            ] })
          ] }),
          /* @__PURE__ */ jsx("h2", { children: "Pool party rentals in your city" }),
          /* @__PURE__ */ jsx("p", { children: "These metros have the deepest party-friendly inventory on Pool Rental Near Me. Click your city for local listings and pricing:" }),
          /* @__PURE__ */ jsx("div", { className: "not-prose my-6 grid grid-cols-2 gap-2 sm:grid-cols-3", children: CITY_LINKS.map((c) => /* @__PURE__ */ jsx(Link, { to: `/p/${c.slug}`, className: "rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:bg-primary/5", children: c.name }, c.slug)) }),
          /* @__PURE__ */ jsxs("p", { children: [
            "Looking for a quieter, smaller booking instead of a party? See",
            " ",
            /* @__PURE__ */ jsx(Link, { to: "/p/private-pool-rental", children: "private pool rental by the hour" }),
            " ",
            "for family swims, date afternoons, and therapy sessions. Browse",
            " ",
            /* @__PURE__ */ jsx(Link, { to: "/p/all-locations", children: "every US city with pools available" }),
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
          /* @__PURE__ */ jsx("h2", { className: "m-0 text-2xl font-semibold text-foreground", children: "Ready to book a pool party rental?" }),
          /* @__PURE__ */ jsx("p", { className: "mx-auto mt-3 max-w-xl text-base text-muted-foreground", children: "Browse party-friendly backyards in your city. $2M liability coverage included on every booking." }),
          /* @__PURE__ */ jsx("a", { href: "/s?keyword=pool%20party", className: "mt-5 inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-sm transition hover:opacity-90", children: "Find a pool party rental near you" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "not-prose my-12 rounded-2xl border border-border bg-muted/40 p-6", children: [
          /* @__PURE__ */ jsx("h2", { className: "m-0 text-xl font-semibold text-foreground", children: "Have a pool? Host parties and earn" }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-base text-muted-foreground", children: "Hosts who allow parties earn $2,000 to $10,000 a month renting their backyard pool by the hour. 0% host fees through 2026, so you keep 100% of every booking. We eat the credit card processing fees, so 90% means 90%. $2M liability coverage included." }),
          /* @__PURE__ */ jsx("a", { href: LIST_HREF, className: "mt-5 inline-flex items-center justify-center rounded-full bg-foreground px-8 py-3 text-base font-semibold text-background shadow-sm transition hover:opacity-90", children: "List your pool free" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
export {
  PoolPartyRentalsPage as component
};
