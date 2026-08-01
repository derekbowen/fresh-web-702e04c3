import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { S as SiteHeader, P as LAST_UPDATED, Q as faqs, e as SiteFooter } from "./router-CKC3KRbd.js";
import { Link } from "@tanstack/react-router";
import "react";
import "@tanstack/react-query";
import "./site-footer-defaults-asWdr-hi.js";
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
import "./auth-middleware-Bd-cw3tB.js";
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
import "./renter-drip.server-BojrhpHE.js";
import "node:fs";
import "node:path";
import "./host-drip.server-BKqTDlWn.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
const TABLE = [{
  platform: "Pool Rental Near Me",
  hostCommission: "0% (through 2026)",
  guestFee: "Applied at checkout",
  effectiveTake: "0% host-side (2026)",
  payout: "24 hours after checkout",
  source: "poolrentalnearme.com host terms"
}, {
  platform: "Swimply",
  hostCommission: "15%–20% + ~$29/mo Premium Pass",
  guestFee: "10%–15% guest service fee",
  effectiveTake: "15%–20% + monthly pass",
  payout: "1–3 business days after checkout",
  source: "swimply.com/host-fees"
}, {
  platform: "Peerspace",
  hostCommission: "15% host service fee",
  guestFee: "~6% guest service fee",
  effectiveTake: "~15% of host subtotal",
  payout: "24 hours after booking ends",
  source: "peerspace.com host terms"
}, {
  platform: "Giggster",
  hostCommission: "15%–20% host fee",
  guestFee: "Variable, set by Giggster",
  effectiveTake: "15%–20% of host subtotal",
  payout: "After booking completion",
  source: "giggster.com host pricing"
}];
function FeesComparedPage() {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "mx-auto max-w-4xl px-4 py-10 text-slate-900", children: [
      /* @__PURE__ */ jsxs("nav", { className: "mb-4 text-xs text-slate-500", children: [
        /* @__PURE__ */ jsx(Link, { to: "/", className: "hover:underline", children: "Home" }),
        /* @__PURE__ */ jsx("span", { className: "mx-2", children: "/" }),
        /* @__PURE__ */ jsx("span", { children: "Pool rental host fees compared" })
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold leading-tight md:text-4xl", children: "Pool rental host fees compared: what each platform actually takes" }),
      /* @__PURE__ */ jsxs("p", { className: "mt-2 text-sm text-slate-500", children: [
        "Last updated ",
        LAST_UPDATED,
        " · Reviewed by Derek Bowen, CEO, PRNM Corp"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-6 text-lg leading-relaxed", children: "Pool Rental Near Me charges hosts 0% commission on every booking through 2026 — you keep 100% — the lowest published host fee of any major peer-to-peer pool rental marketplace. Swimply, Peerspace, and Giggster each take 15% or more from host earnings. Here is the side-by-side breakdown, sourced from each platform's published terms." }),
      /* @__PURE__ */ jsxs("section", { className: "mt-10", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold", children: "Host fee comparison table" }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 overflow-x-auto rounded-lg border border-slate-200", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 text-xs uppercase tracking-wide text-slate-600", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Platform" }),
            /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Host commission" }),
            /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Guest service fee" }),
            /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Effective take" }),
            /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Payout speed" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: TABLE.map((r) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-slate-200 align-top", children: [
            /* @__PURE__ */ jsx("td", { className: "px-3 py-3 font-semibold", children: r.platform }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-3", children: r.hostCommission }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-3", children: r.guestFee }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-3", children: r.effectiveTake }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-3", children: r.payout })
          ] }, r.platform)) })
        ] }) }),
        /* @__PURE__ */ jsxs("p", { className: "mt-2 text-xs text-slate-500", children: [
          "Sources: each platform's published host fee documentation as of ",
          LAST_UPDATED,
          "."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mt-10 rounded-lg border-l-4 border-blue-600 bg-blue-50 p-5", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-blue-900", children: "What 5% of every booking actually means" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm leading-relaxed text-blue-950", children: "A host renting their pool at $75/hour for 20 hours per week keeps roughly $1,350 more per month on PRNM than on Swimply — purely from the 5-point fee gap. Across a 20-week pool season that is $27,000 in additional take-home, before counting the cost of self-funded vs carrier-backed insurance." })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mt-10", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold", children: "Frequently asked questions" }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 space-y-6", children: faqs.map((f) => /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: f.q }),
          /* @__PURE__ */ jsx("p", { className: "faq-answer mt-1 text-sm leading-relaxed text-slate-700", children: f.a })
        ] }, f.q)) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mt-10 rounded-lg bg-slate-50 p-5", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold", children: "Related reading" }),
        /* @__PURE__ */ jsxs("ul", { className: "mt-3 list-inside list-disc space-y-1 text-sm text-blue-700", children: [
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/p/pool-rental-insurance-explained", className: "hover:underline", children: "Pool rental insurance, explained" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/p/swimply-alternative-vs-pool-rental-near-me", className: "hover:underline", children: "Swimply vs Pool Rental Near Me" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/p/peerspace-vs-pool-rental-near-me", className: "hover:underline", children: "Peerspace vs Pool Rental Near Me" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/p/giggster-vs-pool-rental-near-me", className: "hover:underline", children: "Giggster vs Pool Rental Near Me" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/p/earnings-calculator", className: "hover:underline", children: "Pool rental earnings calculator" }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
export {
  FeesComparedPage as component
};
