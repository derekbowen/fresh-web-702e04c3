import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { S as SiteHeader, N as LAST_UPDATED, O as faqs, e as SiteFooter } from "./router-DotN2vF1.js";
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
import "./renter-drip.server-C0_mcvap.js";
import "node:fs";
import "node:path";
import "./host-drip.server-BcWebfNA.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
const TABLE = [{
  platform: "Pool Rental Near Me",
  policyType: "Business Owner's Policy (commercial)",
  limit: "$2M occurrence / $4M aggregate GL + $150K property",
  carrier: "Hartford Underwriters Insurance Company",
  proof: "COI available on request",
  source: "PRNM policy documents (Hartford)"
}, {
  platform: "Swimply",
  policyType: "Self-funded reimbursement program",
  limit: "Up to $1M per occurrence + $10K property",
  carrier: "None — paid by Swimply, Inc.",
  proof: "No COI; discretionary payout",
  source: "swimply.com/protection-guarantee"
}, {
  platform: "Peerspace",
  policyType: "Third-party liability (general venue)",
  limit: "Up to $1M per booking",
  carrier: "Third-party broker (general use)",
  proof: "Per-booking certificate via Peerspace",
  source: "peerspace.com host protection terms"
}, {
  platform: "Giggster",
  policyType: "Add-on liability (per booking)",
  limit: "$1M / $2M / $5M tiers",
  carrier: "Third-party broker",
  proof: "Per-booking certificate",
  source: "giggster.com insurance page"
}];
function InsuranceExplainedPage() {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "mx-auto max-w-4xl px-4 py-10 text-slate-900", children: [
      /* @__PURE__ */ jsxs("nav", { className: "mb-4 text-xs text-slate-500", children: [
        /* @__PURE__ */ jsx(Link, { to: "/", className: "hover:underline", children: "Home" }),
        /* @__PURE__ */ jsx("span", { className: "mx-2", children: "/" }),
        /* @__PURE__ */ jsx("span", { children: "Pool rental insurance explained" })
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold leading-tight md:text-4xl", children: "Do you need insurance to rent out your pool?" }),
      /* @__PURE__ */ jsxs("p", { className: "mt-2 text-sm text-slate-500", children: [
        "Last updated ",
        LAST_UPDATED,
        " · Reviewed by Derek Bowen, CEO, PRNM Corp"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-6 text-lg leading-relaxed", children: "If a guest gets hurt in your pool, the insurance question stops being theoretical. This page is the short, sourced version of what each major pool-rental platform actually puts behind a host when a claim hits — pulled directly from each company's published terms. The single most important distinction: Pool Rental Near Me is the only major pool-rental marketplace that places hosts on a third-party commercial policy from a licensed carrier (The Hartford), rather than a self-funded reimbursement program paid out at the platform's discretion." }),
      /* @__PURE__ */ jsxs("section", { className: "mt-10", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold", children: "Side-by-side: who underwrites what" }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 overflow-x-auto rounded-lg border border-slate-200", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 text-xs uppercase tracking-wide text-slate-600", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Platform" }),
            /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Policy type" }),
            /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Limit" }),
            /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Carrier" }),
            /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Proof" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: TABLE.map((r) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-slate-200 align-top", children: [
            /* @__PURE__ */ jsx("td", { className: "px-3 py-3 font-semibold", children: r.platform }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-3", children: r.policyType }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-3", children: r.limit }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-3", children: r.carrier }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-3", children: r.proof })
          ] }, r.platform)) })
        ] }) }),
        /* @__PURE__ */ jsxs("p", { className: "mt-2 text-xs text-slate-500", children: [
          "Sources: each platform's published Protection / Insurance terms as of ",
          LAST_UPDATED,
          ". PRNM row sourced from Hartford Underwriters Insurance Company policy on file."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mt-10 rounded-lg border-l-4 border-blue-600 bg-blue-50 p-5", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-blue-900", children: "The carrier-backed vs. self-funded distinction" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm leading-relaxed text-blue-950", children: "A self-funded guarantee (Swimply's model) is a promise by the company to reimburse covered losses out of its own balance sheet, subject to its own review. A carrier-backed policy (PRNM's model) is a contract with a regulated insurance company — The Hartford — that is legally obligated to defend and indemnify covered claims regardless of the platform's financial condition. The difference matters most in the exact scenario you bought coverage for: a serious claim." })
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
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/p/swimply-alternative-vs-pool-rental-near-me", className: "hover:underline", children: "Swimply vs Pool Rental Near Me — full comparison" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/p/peerspace-vs-pool-rental-near-me", className: "hover:underline", children: "Peerspace vs Pool Rental Near Me" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/p/giggster-vs-pool-rental-near-me", className: "hover:underline", children: "Giggster vs Pool Rental Near Me" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/p/hosting", className: "hover:underline", children: "How hosting on PRNM works" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/p/earnings-calculator", className: "hover:underline", children: "Pool rental earnings calculator" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-10 text-xs text-slate-500", children: "Need a Certificate of Insurance for your booking? Call PRNM support at 888-940-4247 and request a Hartford COI naming you as additional insured." })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
export {
  InsuranceExplainedPage as component
};
