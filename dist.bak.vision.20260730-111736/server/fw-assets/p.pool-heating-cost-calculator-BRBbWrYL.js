import { jsx } from "react/jsx-runtime";
import { _ as BREADCRUMBS, $ as FAQS, i as heroImage } from "./router-DotN2vF1.js";
import { T as ToolPlaceholderPage } from "./tool-placeholder-DvAqr-QZ.js";
import "@tanstack/react-router";
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
const WHY_EXISTS = {
  heading: "Why the pool heating cost calculator exists",
  paragraphs: ["Heating is the line item that quietly eats pool rental profit. A host charges $75 an hour, books 20 hours a month, and feels great about a $1,500 month — until the utility bill arrives and a $600 gas charge wipes out 40% of the take. By then it's too late to reprice.", 'The problem is that nobody runs the numbers up front. Heater manufacturers publish BTU ratings, not dollar costs. Utility companies publish per-therm rates, not pool-rental scenarios. And every "how much does it cost to heat a pool" article online is written for backyard owners who swim three times a summer, not for hosts heating to 88°F on demand every Saturday.', "This calculator translates the physics into the only number that matters: what will it cost you, this month, to host. Plug in gallons, target temperature, zip code, heater type, and cover usage. Get a real monthly run-cost and a recommended pass-through fee so your $75 rate stays a $75 rate after utilities."]
};
const WHO_USES = {
  heading: "Who the calculator is for",
  paragraphs: ["Prospective hosts pricing their listing use it before they go live. The output tells them whether their climate and pool size can support hourly rates that pencil — and whether a cover upgrade should happen before the first booking, not after the first power bill.", "Existing hosts use it to decide between gas and a heat pump upgrade. The calculator's payback view shows how many months a $4,500 heat pump takes to pay for itself given their actual booking volume. For busy hosts in mild climates, that number is often under a single season.", "Solar-curious hosts use it to size a panel array against their target temperature and shoulder-season hosting window. The output integrates with the host fee structure so the recommended pass-through to renters stays competitive in your local market."]
};
const HOW_IT_WORKS = {
  heading: "How the calculator works",
  steps: [{
    title: "Enter the pool basics",
    body: "Gallons (or length × width × average depth — we'll convert), pool type, and zip code so we can pull local climate and utility rates."
  }, {
    title: "Pick a heater scenario",
    body: "Natural gas, propane, electric heat pump, or solar. Add the heater's BTU or kW rating if you know it; we use sane defaults if you don't."
  }, {
    title: "Set your hosting profile",
    body: "Target water temperature, hours hosted per week, and whether you use a thermal cover between bookings. Cover usage typically halves the answer."
  }, {
    title: "Compare side by side",
    body: "The output shows monthly run-cost, cost per booking hour, and payback time for any upgrades against your current setup."
  }, {
    title: "Export a host-ready summary",
    body: "Generate a one-page PDF you can paste into your listing's FAQ section. Renters who see real numbers convert better than renters who get a surprise heating fee at checkout."
  }]
};
const SCENARIOS = {
  heading: "Common scenarios",
  items: [{
    title: "The Phoenix host who doesn't need a heater",
    body: 'Mid-summer in Arizona — solar gain keeps the pool at 86°F unassisted. The calculator confirms the host can skip heating costs entirely from May through September and bake a small "heated" surcharge into October–April only.'
  }, {
    title: "The Bay Area host running a heat pump",
    body: "Mild climate, year-round hosting potential. Calculator shows a heat pump runs about $180/month with a cover or $410/month without. Cover pays for itself in seven weeks."
  }, {
    title: "The Atlanta host using gas",
    body: "Humid summers, cool evenings. Gas heats fast but the calculator shows the monthly run cost crosses $700 once they hit 30 booked hours. Heat pump upgrade pencils inside a single season."
  }, {
    title: "The Vermont host with a short season",
    body: "Calculator shows a heat pump can extend the bookable window from 12 weeks to 22 weeks and effectively double annual revenue versus relying on solar gain alone."
  }]
};
const PROPS = {
  eyebrow: "Free tool · Coming soon",
  h1: "Pool heating cost calculator: gas, heat pump, and solar",
  intro: "Estimate the real monthly cost to heat your pool, compare heater types side by side, and see how a cover changes payback time. Built for pool rental hosts who don't want a surprise utility bill at the end of summer.",
  heroSrc: heroImage,
  heroAlt: "Pool host reviewing a heating cost calculator on a laptop next to a heated backyard pool at dusk",
  bullets: ["Compare gas, electric heat pump, and solar in one screen", "Plug in pool gallons, target temperature, and zip code", "See monthly run-cost with and without a thermal cover", "Estimate payback time for solar and heat pump upgrades", "Export a host-ready cost summary for your listing FAQs", "Save profiles for each pool you manage"],
  whyExists: WHY_EXISTS,
  whoUses: WHO_USES,
  howItWorks: HOW_IT_WORKS,
  scenarios: SCENARIOS,
  faqs: FAQS,
  primaryCta: {
    label: "Notify me when it launches",
    href: "/p/hosting"
  },
  secondaryCta: {
    label: "See all free host tools",
    href: "/p/free-host-tools"
  }
};
const SplitComponent = () => /* @__PURE__ */ jsx(ToolPlaceholderPage, { ...PROPS, breadcrumbItems: BREADCRUMBS });
export {
  SplitComponent as component
};
