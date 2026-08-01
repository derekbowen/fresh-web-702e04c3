import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { ai as Route, aj as cityTier, ak as buildFaqs, C as ComparisonPage, j as CTAPrimary, a2 as ComparisonTable, l as CTAMid, m as FAQList, A as AuthorBlock, p as FooterBlock } from "./router-BEu57YoG.js";
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
import "./renter-drip.server-DJqUcyMM.js";
import "node:fs";
import "node:path";
import "./host-drip.server-BfIDzqiI.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
function GiggsterCityPage() {
  const {
    city
  } = Route.useLoaderData();
  const tier = cityTier(city);
  const isHub = tier === "hub";
  const faqs = buildFaqs(city);
  const tableRows = [{
    label: "Primary buyer in " + city.name,
    prnm: "Recreational renters (families, friend groups, small parties)",
    competitor: isHub ? "Production crews + event renters (film, photo, video, commercials)" : "Production crews — limited inventory of pool buyers in " + city.name
  }, {
    label: "Host commission",
    prnm: /* @__PURE__ */ jsx("strong", { children: "0% (2026)" }),
    competitor: "19% (per Giggster Help Center)"
  }, {
    label: `Take-home on a $400 ${city.name} booking`,
    prnm: /* @__PURE__ */ jsx("strong", { children: "$360" }),
    competitor: "$324"
  }, {
    label: "Included general liability",
    prnm: /* @__PURE__ */ jsx("strong", { children: "$2M / $4M Hartford on every approved booking" }),
    competitor: "Not included — host carries homeowner's; renter must supply $2M COI for production"
  }, {
    label: "Property damage coverage",
    prnm: "$150K STRETCH® PLUS blanket",
    competitor: "Per renter-supplied COI (or Giggster's optional add-on at checkout)"
  }, {
    label: "Typical hourly rate band",
    prnm: "$45–$150 / hour recreational",
    competitor: isHub ? "$150–$500+ / hour production (in " + city.name + ")" : "Production rates exist on the platform, but " + city.name + " production-buyer demand is thin"
  }, {
    label: "Pool-specific host training",
    prnm: "Pool Host Academy — 70+ free courses, HOA Defense Kit, waiver generator",
    competitor: "Production-focused help center — COIs, payouts, location agreements"
  }];
  return /* @__PURE__ */ jsxs(ComparisonPage, { competitor: "Giggster", title: `Giggster vs Pool Rental Near Me in ${city.name}`, effectiveMonthYear: "May 2026", children: [
    /* @__PURE__ */ jsxs("h1", { children: [
      "Giggster vs Pool Rental Near Me in ",
      city.name,
      ", ",
      city.state_code,
      " (2026): Fees, Insurance & Best Use"
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: /* @__PURE__ */ jsx("em", { children: "Last updated May 5, 2026. All Giggster facts on this page are taken directly from Giggster's published Help Center and Terms of Service and were verified live on the source URLs at publication. Always confirm current terms on each platform before listing." }) }),
    /* @__PURE__ */ jsxs("p", { children: [
      "If you own a pool in ",
      /* @__PURE__ */ jsxs("strong", { children: [
        city.name,
        ", ",
        city.state
      ] }),
      " and you're trying to decide between ",
      /* @__PURE__ */ jsx("strong", { children: "Giggster" }),
      " and",
      " ",
      /* @__PURE__ */ jsx("strong", { children: "Pool Rental Near Me (PRNM)" }),
      ", the right answer depends on what kind of buyer you actually have in ",
      city.name,
      ". Giggster is a production-location marketplace — film, photo, video, commercials, and events. Pool Rental Near Me is built specifically for recreational hourly pool rentals to families, friend groups, and small parties. That single difference drives fees, insurance, the kind of guests who show up, and how much your ",
      city.name,
      " pool can actually earn."
    ] }),
    /* @__PURE__ */ jsxs("blockquote", { children: [
      /* @__PURE__ */ jsxs("strong", { children: [
        "Bottom line for ",
        city.name,
        " pool hosts:"
      ] }),
      " ",
      isHub ? /* @__PURE__ */ jsxs(Fragment, { children: [
        city.name,
        " is one of Giggster's strongest production-hub markets, so the highest-yield strategy for a camera-ready pool is to list on",
        /* @__PURE__ */ jsx("em", { children: " both" }),
        ": production rates on Giggster (weekday) and recreational rates on Pool Rental Near Me (weekend). On a same-size host payout, PRNM's 0% commission (2026) keeps more in your pocket per booking; Giggster's premium per-hour production rates can make up the difference on a smaller number of larger bookings."
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        "For a typical residential pool in ",
        city.name,
        ", Pool Rental Near Me is the realistic channel — recreational demand is broadly distributed, while Giggster's production buyers concentrate in a handful of hub metros. PRNM's 0% host commission (2026), included $2M Hartford liability on every approved booking, and pool-specific training are sized for residential pool hosting in ",
        city.name,
        "."
      ] })
    ] }),
    /* @__PURE__ */ jsx(CTAPrimary, {}),
    /* @__PURE__ */ jsxs("h2", { children: [
      "At-a-glance comparison for ",
      city.name
    ] }),
    /* @__PURE__ */ jsx(ComparisonTable, { competitor: "Giggster", rows: tableRows }),
    /* @__PURE__ */ jsxs("h2", { id: "fees", children: [
      "Fees: what you actually keep on a ",
      city.name,
      " booking"
    ] }),
    /* @__PURE__ */ jsxs("p", { children: [
      "Giggster's Help Center article ",
      /* @__PURE__ */ jsx("em", { children: '"How much commission does Giggster take?"' }),
      " states verbatim: ",
      /* @__PURE__ */ jsx("em", { children: `"Giggster takes a 19% commission out of the host's total payout (location fee + additional fees (if any)) for the booking."` }),
      /* @__PURE__ */ jsx("sup", { children: "[¹]" }),
      " Giggster also collects a separate Processing Fee from the renter at checkout that scales with booking size and features."
    ] }),
    /* @__PURE__ */ jsxs("p", { children: [
      "Pool Rental Near Me charges ",
      city.name,
      " hosts 0% host commission through 2026 — you keep 100%, with a guest service fee applied at checkout. Hosts keep 100% of the booking subtotal."
    ] }),
    /* @__PURE__ */ jsx("div", { className: "not-prose my-6 overflow-x-auto rounded-2xl border border-border", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-muted/60 text-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsxs("th", { className: "px-4 py-3 text-left font-semibold", children: [
          city.name,
          " gross host payout"
        ] }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left font-semibold text-primary", children: "Keep on PRNM (0% in 2026)" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left font-semibold", children: "Keep on Giggster (19%)" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left font-semibold", children: "PRNM advantage" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: [[200, 180, 162, 18], [400, 360, 324, 36], [800, 720, 648, 72], [1500, 1350, 1215, 135], [3e3, 2700, 2430, 270]].map(([g, p, gg, diff]) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
        /* @__PURE__ */ jsxs("td", { className: "px-4 py-3 font-medium text-foreground", children: [
          "$",
          g
        ] }),
        /* @__PURE__ */ jsxs("td", { className: "px-4 py-3 text-foreground", children: [
          "$",
          p
        ] }),
        /* @__PURE__ */ jsxs("td", { className: "px-4 py-3 text-muted-foreground", children: [
          "$",
          gg
        ] }),
        /* @__PURE__ */ jsxs("td", { className: "px-4 py-3 font-semibold text-primary", children: [
          "+$",
          diff
        ] })
      ] }, g)) })
    ] }) }),
    /* @__PURE__ */ jsxs("p", { children: [
      "Across a typical ",
      city.name,
      " season of 40–60 bookings, the fee delta compounds. Run your specific ",
      city.name,
      " numbers in the",
      " ",
      /* @__PURE__ */ jsx("a", { href: "/p/earnings-calculator", children: "earnings calculator" }),
      "."
    ] }),
    /* @__PURE__ */ jsxs("h2", { id: "insurance", children: [
      "Insurance & liability for a ",
      city.state,
      " residential pool"
    ] }),
    /* @__PURE__ */ jsxs("p", { children: [
      "Pool incidents can be catastrophic — drownings, slip-and-falls, property damage. The two platforms handle insurance very differently, and this is the most important section for any ",
      city.name,
      " pool host to understand before listing."
    ] }),
    /* @__PURE__ */ jsxs("h3", { children: [
      "Giggster's insurance model in ",
      city.name
    ] }),
    /* @__PURE__ */ jsxs("p", { children: [
      "Per Giggster's Help Center article ",
      /* @__PURE__ */ jsx("em", { children: '"As a host, do I need insurance?"' }),
      ", Giggster hosts in ",
      city.name,
      ` (and everywhere else) must carry sufficient homeowner's insurance, and Giggster's Terms of Service §13 require the host or the renter to obtain "Sufficient Insurance" before the booking start date.`,
      /* @__PURE__ */ jsx("sup", { children: "[²]" }),
      " For production bookings specifically, Giggster's ",
      /* @__PURE__ */ jsx("em", { children: '"Do I need insurance to host production?"' }),
      " article states that every renter must carry production insurance with a $2 million minimum in general liability and property damage and supply the host with a Certificate of Insurance (COI) before the shoot.",
      /* @__PURE__ */ jsx("sup", { children: "[³]" }),
      " Renters can purchase Giggster's optional Production/Event Insurance at checkout or supply their own."
    ] }),
    /* @__PURE__ */ jsxs("h3", { children: [
      "Pool Rental Near Me's insurance model in ",
      city.name
    ] }),
    /* @__PURE__ */ jsxs("p", { children: [
      "PRNM Corp maintains a Business Owner's Policy through Hartford Underwriters that automatically covers every approved ",
      city.name,
      " ",
      "booking with no separate renter policy required:"
    ] }),
    /* @__PURE__ */ jsxs("ul", { children: [
      /* @__PURE__ */ jsxs("li", { children: [
        /* @__PURE__ */ jsx("strong", { children: "$2,000,000 per-occurrence / $4,000,000 aggregate" }),
        " ",
        "general liability"
      ] }),
      /* @__PURE__ */ jsxs("li", { children: [
        /* @__PURE__ */ jsx("strong", { children: "$10,000 medical expenses" }),
        " per person"
      ] }),
      /* @__PURE__ */ jsxs("li", { children: [
        /* @__PURE__ */ jsx("strong", { children: "$150,000 STRETCH® PLUS" }),
        " property coverage blanket"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("p", { children: [
      "For a residential ",
      city.name,
      " pool host, the practical upshot is that you don't have to chase a COI per booking — coverage attaches the moment a booking is approved.",
      /* @__PURE__ */ jsx("sup", { children: "[⁴]" })
    ] }),
    /* @__PURE__ */ jsxs("h2", { id: "buyers", children: [
      "Who actually books pools in ",
      city.name,
      "?"
    ] }),
    isHub ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("p", { children: [
        city.name,
        " is one of Giggster's strongest production-hub markets. Real production buyers — location scouts, photographers, indie filmmakers, content creators, commercial production companies — actively scout ",
        city.name,
        " pools on Giggster, and they pay premium per-hour rates ($150–$500+/hour) when the pool is camera-ready (clean sightlines, photogenic surround, good light, parking and load-in space)."
      ] }),
      /* @__PURE__ */ jsxs("p", { children: [
        "At the same time, ",
        city.name,
        "'s recreational pool demand is huge: families, friend groups, birthday parties, swim lessons, bachelorette and bachelor groups, and small private events looking for a nice backyard pool to rent for a few hours. That's the buyer base on Pool Rental Near Me."
      ] }),
      /* @__PURE__ */ jsxs("p", { children: [
        /* @__PURE__ */ jsxs("strong", { children: [
          "The smart play in ",
          city.name,
          " is to run both"
        ] }),
        " — premium production rates on Giggster (weekday availability, stricter rules), recreational rates on Pool Rental Near Me (weekend availability, party-friendly capacity)."
      ] })
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("p", { children: [
        city.name,
        " is not one of Giggster's production-hub metros, so production buyers actively scouting pools in ",
        city.name,
        " on Giggster are limited. You can list there, but expect thin demand for residential pools relative to the production-hub cities."
      ] }),
      /* @__PURE__ */ jsxs("p", { children: [
        "Recreational pool demand in ",
        city.name,
        " is the realistic opportunity: families, friend groups, small parties, birthday celebrations, swim lessons, fitness clients. That's the buyer base Pool Rental Near Me is built for, and it's broadly distributed across ",
        city.state,
        " markets like ",
        city.name,
        "."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("h2", { id: "local-demand", children: [
      "Live ",
      city.name,
      " pool-rental demand"
    ] }),
    /* @__PURE__ */ jsxs("p", { children: [
      "See current ",
      city.name,
      " pool inventory on the",
      " ",
      /* @__PURE__ */ jsxs("a", { href: `/s?address=${encodeURIComponent(`${city.name}, ${city.state_code}`)}`, className: "text-primary underline", children: [
        city.name,
        " pool search"
      ] }),
      ". Browse what locals are renting and how hosts price their hours."
    ] }),
    /* @__PURE__ */ jsx(CTAMid, {}),
    /* @__PURE__ */ jsx("h2", { id: "strategy", children: isHub ? `${city.name} dual-channel strategy` : `Smartest ${city.name} listing strategy` }),
    isHub ? /* @__PURE__ */ jsxs("ol", { children: [
      /* @__PURE__ */ jsx("li", { children: "Tune your Giggster listing for production crews: premium per-hour rates, weekday availability, COI-ready language, stricter house rules." }),
      /* @__PURE__ */ jsxs("li", { children: [
        "Create your free Pool Rental Near Me listing at",
        " ",
        /* @__PURE__ */ jsx("a", { href: "/p/start-hosting", rel: "noopener", children: "poolrentalnearme.com/p/start-hosting" }),
        " ",
        "with recreational pricing and weekend party capacity."
      ] }),
      /* @__PURE__ */ jsx("li", { children: "Sync calendars across both platforms to prevent double-bookings." }),
      /* @__PURE__ */ jsxs("li", { children: [
        "Run the",
        " ",
        /* @__PURE__ */ jsx("a", { href: "/p/learningacademy", children: "Pool Host Academy" }),
        " ",
        "intake modules to optimize your PRNM recreational listing — photo composition, amenity upsells, waiver setup, HOA defense."
      ] }),
      /* @__PURE__ */ jsxs("li", { children: [
        "After 60 days, look at profit per weekend hour by channel and bias availability toward the higher-yield channel for ",
        /* @__PURE__ */ jsx("em", { children: "your" }),
        " ",
        "specific ",
        city.name,
        " pool."
      ] })
    ] }) : /* @__PURE__ */ jsxs("ol", { children: [
      /* @__PURE__ */ jsxs("li", { children: [
        "Create your free Pool Rental Near Me listing at",
        " ",
        /* @__PURE__ */ jsx("a", { href: "/p/start-hosting", rel: "noopener", children: "poolrentalnearme.com/p/start-hosting" }),
        "."
      ] }),
      /* @__PURE__ */ jsxs("li", { children: [
        "Set your ",
        city.name,
        " hourly rate in the typical $45–$150 range depending on capacity, amenities, and season."
      ] }),
      /* @__PURE__ */ jsxs("li", { children: [
        "Run the",
        " ",
        /* @__PURE__ */ jsx("a", { href: "/p/learningacademy", children: "Pool Host Academy" }),
        " ",
        "intake modules to optimize photos, amenity upsells, waiver setup, and HOA defense."
      ] }),
      /* @__PURE__ */ jsxs("li", { children: [
        "If your ",
        city.name,
        " pool is genuinely camera-ready, you can also test a Giggster listing — but treat it as a low-priority secondary channel given ",
        city.name,
        "'s production-buyer thinness."
      ] })
    ] }),
    /* @__PURE__ */ jsx("h2", { id: "related", children: "Related comparisons" }),
    /* @__PURE__ */ jsxs("p", { children: [
      "Read the full pillar comparison:",
      " ",
      /* @__PURE__ */ jsx(Link, { to: "/p/$slug", params: {
        slug: "giggster-vs-pool-rental-near-me"
      }, className: "text-primary underline", children: "Giggster vs Pool Rental Near Me (2026): Fees, Insurance & Best Use Cases" }),
      ". Or compare other platforms:",
      " ",
      /* @__PURE__ */ jsx(Link, { to: "/p/$slug", params: {
        slug: "peerspace-vs-pool-rental-near-me"
      }, className: "text-primary underline", children: "Peerspace vs Pool Rental Near Me" }),
      " ",
      "·",
      " ",
      /* @__PURE__ */ jsx(Link, { to: "/p/$slug", params: {
        slug: "swimply-alternative-vs-pool-rental-near-me"
      }, className: "text-primary underline", children: "Swimply alternative vs Pool Rental Near Me" }),
      "."
    ] }),
    /* @__PURE__ */ jsxs("h2", { id: "faq", children: [
      "Frequently asked questions — ",
      city.name
    ] }),
    /* @__PURE__ */ jsx(FAQList, { faqs }),
    /* @__PURE__ */ jsx(AuthorBlock, {}),
    /* @__PURE__ */ jsx("h2", { children: "📊 Sources & footnotes" }),
    /* @__PURE__ */ jsxs("ol", { children: [
      /* @__PURE__ */ jsxs("li", { children: [
        /* @__PURE__ */ jsx("strong", { children: "Giggster 19% host commission" }),
        ' — Giggster Help Center, "How much commission does Giggster take?" (verified live May 5, 2026):',
        " ",
        /* @__PURE__ */ jsx("a", { href: "https://help.giggster.com/en/articles/2832062-how-much-commission-does-giggster-take", rel: "noopener nofollow", children: "help.giggster.com/en/articles/2832062" }),
        "."
      ] }),
      /* @__PURE__ */ jsxs("li", { children: [
        /* @__PURE__ */ jsx("strong", { children: "Giggster host insurance requirements" }),
        ' — Giggster Help Center, "As a host, do I need insurance?" (citing Giggster Terms of Service §13):',
        " ",
        /* @__PURE__ */ jsx("a", { href: "https://help.giggster.com/en/articles/8076417-as-a-host-do-i-need-insurance", rel: "noopener nofollow", children: "help.giggster.com/en/articles/8076417" }),
        "."
      ] }),
      /* @__PURE__ */ jsxs("li", { children: [
        /* @__PURE__ */ jsx("strong", { children: "Giggster production-renter $2M COI requirement" }),
        ' — Giggster Help Center, "Do I need insurance to host production?": renters must carry production insurance with',
        " ",
        /* @__PURE__ */ jsx("em", { children: '"a $2 million minimum in general liability and property damage"' }),
        " and supply the host with a Certificate of Insurance before the shoot:",
        " ",
        /* @__PURE__ */ jsx("a", { href: "https://help.giggster.com/en/articles/8076412-do-i-need-insurance-to-host-production", rel: "noopener nofollow", children: "help.giggster.com/en/articles/8076412" }),
        "."
      ] }),
      /* @__PURE__ */ jsxs("li", { children: [
        /* @__PURE__ */ jsx("strong", { children: "$2,000,000 PRNM general liability insurance" }),
        " — PRNM Corp's Business Owner's Policy through Hartford Underwriters. Full terms in the",
        " ",
        /* @__PURE__ */ jsx("a", { href: "/p/terms-of-service", children: "Pool Rental Near Me Terms of Service" }),
        "."
      ] })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: /* @__PURE__ */ jsxs("em", { children: [
      "Disclaimer: This page is an informational comparison written by Pool Rental Near Me. We are not affiliated with Giggster. ",
      city.name,
      "- and ",
      city.state,
      "-specific commentary reflects general 2026 market context, not legal or tax advice. Fees, insurance terms, and policies on either platform may change at any time; always verify the current published terms on each platform before listing or booking."
    ] }) }),
    /* @__PURE__ */ jsx(FooterBlock, { city: city.name })
  ] });
}
export {
  GiggsterCityPage as component
};
