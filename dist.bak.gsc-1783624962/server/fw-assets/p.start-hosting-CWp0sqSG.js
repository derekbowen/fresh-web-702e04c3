import { jsx } from "react/jsx-runtime";
import { q as BREADCRUMBS, s as FAQS, t as heroImage } from "./router-Bw8GQi9C.js";
import { T as ToolPlaceholderPage } from "./tool-placeholder-HpTPsmgB.js";
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
const WHY_EXISTS = {
  heading: "Why start hosting your pool",
  paragraphs: ["A backyard pool is one of the most underused assets in American real estate. The average residential pool gets swum in about 25 days a year. The other 340 days it sits idle, costing $200 to $500 a month in chemicals, electricity, and water — a recurring drain on your household budget that produces no income.", "Hosting flips that math. The same pool that's costing you $300 a month becomes one that's making you $3,000 a month — and in the right city, in season, $8,000 a month is normal, not exceptional. Hosts in Los Angeles, Phoenix, Miami, Houston, Dallas, and Atlanta routinely break $10,000 in peak July weekends alone.", "Pool Rental Near Me is built specifically for this. 0% host fees through 2026 — half of what Swimply charges. $2M liability insurance baked into every booking at no extra cost. Free to list, no monthly fees, payouts within 24 hours. The economics finally favor the person who actually owns the pool."]
};
const WHO_USES = {
  heading: "Who hosts on Pool Rental Near Me",
  paragraphs: ["Homeowners with an in-ground or above-ground pool, a fenced yard, and a few hours a week to host. You don't have to be home — about 60% of our hosts run a smart lock plus a digital waiver and never meet most of their guests in person.", "Property managers and short-term rental operators add pool rental as a separate revenue stream on top of nightly stays. The pool can be booked by the hour to locals during the day while the property itself sits between guest turnovers.", "Career changers and semi-retired homeowners use hosting as a part-time business. A two-pool portfolio in a strong market clears $6,000 to $12,000 a month in season — meaningful income for a few hours a week of cleaning, messaging, and guest greeting."]
};
const HOW_IT_WORKS = {
  heading: "How to start hosting in 15 minutes",
  steps: [{
    title: "Create a free host account",
    body: "Email and phone, no card required. Hosting is free to start — you keep 100% of every booking from day one."
  }, {
    title: "Upload five photos and basic info",
    body: "Wide shot of the pool, the yard, any standout amenity, plus pool dimensions and max guests. Phone photos are fine; our AI listing generator writes the rest."
  }, {
    title: "Set your hourly rate and availability",
    body: "Our smart pricing tool benchmarks your zip code, pool size, and amenities against booked listings nearby and recommends an opening rate."
  }, {
    title: "Pass the 24-hour review",
    body: "We verify every pool before it goes live to protect you and the marketplace. Most listings are approved within a few hours."
  }, {
    title: "Start receiving bookings",
    body: "Bookings come in through the app. Approve manually for the first month or two, then turn on auto-approval for renters with verified IDs and past 5-star reviews."
  }]
};
const SCENARIOS = {
  heading: "Common host scenarios",
  items: [{
    title: "The $3K/month suburban host",
    body: "Standard 30,000-gallon in-ground in a Phoenix suburb. $65/hour, books 50 hours a month May through September, $325 in monthly hosting costs net. Pool pays for itself plus a car payment."
  }, {
    title: "The $8K/month luxury host",
    body: "Heated pool with hot tub, outdoor kitchen, and shade structures in Beverly Hills. $150/hour weekends, books out four to six weekends a month, plus weekday corporate offsites and photo shoots."
  }, {
    title: "The event-only host",
    body: "Larger backyard near a downtown core. Skips casual swimming, hosts only birthday parties and small corporate events. Three to five events a month at $400–$800 per booking."
  }, {
    title: "The portfolio host",
    body: "Property manager running three vacation rentals, each with a pool. Layers in pool-only bookings during the daytime between overnight guests — adds $4,000–$6,000 a month across the portfolio with no extra property cost."
  }]
};
const PROPS = {
  eyebrow: "Earn from your pool",
  h1: "Start hosting your pool: earn $1,500 to $8,000 a month",
  intro: "Your backyard pool can pay for itself. Start hosting on Pool Rental Near Me with 0% host fees through 2026, $2M liability on every booking, and 24-hour payouts. Free to list, no monthly cost, be live in 15 minutes.",
  heroSrc: heroImage,
  heroAlt: "Smiling pool host welcoming guests to a clean backyard pool on a sunny afternoon",
  bullets: ["0% host fees through 2026 (Swimply charges 15–30%)", "$2,000,000 liability coverage on every booking", "24-hour payouts, free to list, no monthly fees", "Approve every guest or auto-approve trusted renters", "Pool Host Academy: 135 free classes to ramp up fast", "Free Host Pro app: pricing, calendar, waivers, taxes"],
  whyExists: WHY_EXISTS,
  whoUses: WHO_USES,
  howItWorks: HOW_IT_WORKS,
  scenarios: SCENARIOS,
  faqs: FAQS,
  primaryCta: {
    label: "List my pool — it's free",
    href: "/l/draft/00000000-0000-0000-0000-000000000000/new/details"
  },
  secondaryCta: {
    label: "See the full host guide",
    href: "/p/hosting"
  }
};
const SplitComponent = () => /* @__PURE__ */ jsx(ToolPlaceholderPage, { ...PROPS, breadcrumbItems: BREADCRUMBS });
export {
  SplitComponent as component
};
