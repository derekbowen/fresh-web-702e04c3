import { jsx, jsxs } from "react/jsx-runtime";
import { a0 as Route, a1 as buildFaqs, C as ComparisonPage, j as CTAPrimary, a2 as ComparisonTable, l as CTAMid, m as FAQList, A as AuthorBlock, p as FooterBlock } from "./router-Bw8GQi9C.js";
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
function PeerspaceCityPage() {
  const {
    city
  } = Route.useLoaderData();
  const faqs = buildFaqs(city);
  const tableRows = [{
    label: "Host service fee",
    prnm: /* @__PURE__ */ jsx("strong", { children: "0% (2026)" }),
    competitor: "20%"
  }, {
    label: `Take-home on $300 ${city.name} booking`,
    prnm: /* @__PURE__ */ jsx("strong", { children: "$300" }),
    competitor: "$240"
  }, {
    label: "General liability",
    prnm: /* @__PURE__ */ jsx("strong", { children: "$2M / $4M" }),
    competitor: "$1M"
  }, {
    label: "Property protection",
    prnm: /* @__PURE__ */ jsx("strong", { children: "$150K STRETCH® PLUS" }),
    competitor: "$25K"
  }, {
    label: `Built for ${city.name} pool guests`,
    prnm: "Yes — pool-specialized",
    competitor: "No — general venue marketplace"
  }, {
    label: "Free pool host training",
    prnm: "70+ courses",
    competitor: "Generic venue support"
  }];
  return /* @__PURE__ */ jsxs(ComparisonPage, { competitor: "Peerspace", title: `Peerspace vs Pool Rental Near Me in ${city.name}`, effectiveMonthYear: "May 2026", children: [
    /* @__PURE__ */ jsxs("h1", { children: [
      "Peerspace vs Pool Rental Near Me in ",
      city.name,
      ", ",
      city.state_code,
      " (2026)"
    ] }),
    /* @__PURE__ */ jsxs("p", { children: [
      "If you own a pool in ",
      /* @__PURE__ */ jsxs("strong", { children: [
        city.name,
        ", ",
        city.state
      ] }),
      " and you're deciding between ",
      /* @__PURE__ */ jsx("strong", { children: "Peerspace" }),
      " and",
      " ",
      /* @__PURE__ */ jsx("strong", { children: "Pool Rental Near Me" }),
      ", this guide breaks down which platform pays you more per booking, which carries the right insurance for residential pool hosting, and which one actually drives",
      " ",
      city.name,
      " pool-intent traffic to your listing."
    ] }),
    /* @__PURE__ */ jsxs("blockquote", { children: [
      /* @__PURE__ */ jsxs("strong", { children: [
        "Bottom line for ",
        city.name,
        " pool hosts:"
      ] }),
      " Pool Rental Near Me's 0% host fee (2026) beats Peerspace's 20%, and the $2M liability is double. For typical ",
      city.name,
      " pools renting at $45–$150/hr, Pool Rental Near Me wins on economics. Peerspace wins for production-grade luxury pools chasing $200+/hr event bookings."
    ] }),
    /* @__PURE__ */ jsx(CTAPrimary, {}),
    /* @__PURE__ */ jsxs("h2", { children: [
      "Quick comparison for ",
      city.name,
      " pool hosts"
    ] }),
    /* @__PURE__ */ jsx(ComparisonTable, { competitor: "Peerspace", rows: tableRows }),
    /* @__PURE__ */ jsxs("h2", { children: [
      "How much can you earn in ",
      city.name,
      "?"
    ] }),
    /* @__PURE__ */ jsxs("p", { children: [
      city.name,
      " pool hosts typically price between ",
      /* @__PURE__ */ jsx("strong", { children: "$45 and $150 per hour" }),
      " depending on capacity, amenities, and season. On a $300 ",
      city.name,
      " booking:"
    ] }),
    /* @__PURE__ */ jsxs("ul", { children: [
      /* @__PURE__ */ jsxs("li", { children: [
        /* @__PURE__ */ jsx("strong", { children: "Pool Rental Near Me (0% fee, 2026):" }),
        " you keep $300"
      ] }),
      /* @__PURE__ */ jsxs("li", { children: [
        /* @__PURE__ */ jsx("strong", { children: "Peerspace (20% fee):" }),
        " you keep $240"
      ] }),
      /* @__PURE__ */ jsxs("li", { children: [
        /* @__PURE__ */ jsx("strong", { children: "Difference:" }),
        " $30 more per booking on Pool Rental Near Me"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("p", { children: [
      "Across a 50-booking ",
      city.name,
      " summer season, that's $1,500 in fee savings. Run your specific ",
      city.name,
      " numbers in the",
      " ",
      /* @__PURE__ */ jsx("a", { href: "/p/earnings-calculator", children: "earnings calculator" }),
      "."
    ] }),
    /* @__PURE__ */ jsxs("h2", { children: [
      "Why pool-specific demand matters in ",
      city.name
    ] }),
    /* @__PURE__ */ jsxs("p", { children: [
      "Peerspace lists ",
      city.name,
      ` pools alongside lofts, studios, and event halls — guests browsing Peerspace are often searching for a "venue," not a pool. Pool Rental Near Me's `,
      city.name,
      " traffic comes from people who specifically searched for a pool to rent, so listings convert at a higher rate per impression."
    ] }),
    /* @__PURE__ */ jsxs("p", { children: [
      "See live ",
      city.name,
      " pool-rental demand in",
      " ",
      /* @__PURE__ */ jsx("a", { href: `/s?address=${encodeURIComponent(`${city.name}, ${city.state_code}`)}`, className: "text-primary underline", children: "marketplace search" }),
      " ",
      "and review the",
      " ",
      /* @__PURE__ */ jsx("a", { href: "/p/elearning-academy-permit-licensing-requirements-pool-hosts", className: "text-primary underline", children: "permit and licensing guide" }),
      "."
    ] }),
    /* @__PURE__ */ jsxs("h2", { children: [
      "Insurance that actually fits a ",
      city.state,
      " residential pool"
    ] }),
    /* @__PURE__ */ jsxs("p", { children: [
      "Pool injuries can be catastrophic. Peerspace's ",
      /* @__PURE__ */ jsx("strong", { children: "$1M general liability" }),
      " is supplemental coverage built around general venue rentals. Pool Rental Near Me's ",
      /* @__PURE__ */ jsx("strong", { children: "$2M per-occurrence / $4M aggregate" }),
      " Hartford-backed policy is sized for residential pool exposure — plus a $150K STRETCH® PLUS property blanket on every approved booking."
    ] }),
    /* @__PURE__ */ jsx(CTAMid, {}),
    /* @__PURE__ */ jsxs("h2", { children: [
      "When to list a ",
      city.name,
      " pool on both platforms"
    ] }),
    /* @__PURE__ */ jsxs("p", { children: [
      "If your ",
      city.name,
      " pool is high-end and photogenic, listing on Peerspace for production / event bookings ($200+/hr) and on Pool Rental Near Me for recreational hourly rentals ($45–$150/hr) is a proven dual-channel strategy. Just sync your calendar to avoid double-bookings."
    ] }),
    /* @__PURE__ */ jsxs("h2", { children: [
      "Get started in ",
      city.name
    ] }),
    /* @__PURE__ */ jsxs("ol", { children: [
      /* @__PURE__ */ jsxs("li", { children: [
        "Create your free Pool Rental Near Me listing at",
        " ",
        /* @__PURE__ */ jsx("a", { href: "/p/start-hosting", children: "poolrentalnearme.com/p/start-hosting" }),
        "."
      ] }),
      /* @__PURE__ */ jsxs("li", { children: [
        "Set your ",
        city.name,
        " hourly rate ($45–$150 is the typical band)."
      ] }),
      /* @__PURE__ */ jsxs("li", { children: [
        "Run the",
        " ",
        /* @__PURE__ */ jsx("a", { href: "/p/learningacademy", children: "Pool Host Academy" }),
        " ",
        "intake to optimize your listing."
      ] }),
      /* @__PURE__ */ jsxs("li", { children: [
        "Read the",
        " ",
        /* @__PURE__ */ jsx(Link, { to: "/p/$slug", params: {
          slug: "peerspace-vs-pool-rental-near-me"
        }, className: "text-primary underline", children: "full Peerspace vs Pool Rental Near Me comparison" }),
        " ",
        "for fees, insurance, and platform-fit detail."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("h2", { children: [
      "Frequently asked questions — ",
      city.name
    ] }),
    /* @__PURE__ */ jsx(FAQList, { faqs }),
    /* @__PURE__ */ jsx(AuthorBlock, {}),
    /* @__PURE__ */ jsx(FooterBlock, { city: city.name })
  ] });
}
export {
  PeerspaceCityPage as component
};
