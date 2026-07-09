import { jsx } from "react/jsx-runtime";
import { B as BREADCRUMBS, F as FAQS, i as heroImage } from "./router-OI82CwOi.js";
import { T as ToolPlaceholderPage } from "./tool-placeholder-1R4CgcBx.js";
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
const WHY_EXISTS = {
  heading: "Why the pool waiver generator exists",
  paragraphs: [`A backyard pool is the riskiest amenity a host can offer, and most new hosts don't realize how exposed they are until something happens. A guest slips on the deck, a non-swimmer's kid gets pulled out of the deep end, a beer bottle breaks in the shallow end and slices a foot open. Any one of these can produce a five-figure liability claim — and without a signed waiver on file, your defense is essentially "trust me."`, "The fix isn't complicated. A short, clear, signed liability waiver from every guest before they enter the property. Lawyers have known this for 50 years. The problem is hosts don't have the time, the template, or the legal vocabulary to draft one, and the generic waivers floating around online are written for gyms and trampoline parks, not pool rentals.", "The pool waiver generator solves all three problems. Tuned-for-pool-rentals language, customizable to your state, signed digitally on the guest's phone in 30 seconds, stored as a timestamped PDF on every booking. Free for every Pool Rental Near Me host because it shouldn't be optional."]
};
const WHO_USES = {
  heading: "Who the waiver generator is for",
  paragraphs: ["Every host on the platform — full stop. There is no booking volume or pool size where skipping the waiver makes sense. The $2M liability insurance included with each booking pairs with a signed waiver to give you the strongest possible defense if a claim ever materializes.", "Hosts who allow kids, pets, or after-dark hosting get the most direct value. The generator includes specific clauses for under-18 supervision, animal behavior near water, and reduced-visibility nighttime risk that generic waivers miss.", "Hosts in plaintiff-friendly states — California, Florida, New York, Illinois — should never host without one. State-specific language inside the generator addresses the assumption-of-risk standards that courts in those states actually apply, instead of the boilerplate language that often gets thrown out."]
};
const HOW_IT_WORKS = {
  heading: "How the waiver generator works",
  steps: [{
    title: "Set your jurisdiction",
    body: "Pick your state. The generator adjusts language to match the assumption-of-risk and indemnification standards courts in your state actually enforce."
  }, {
    title: "Configure your pool specifics",
    body: "Pool type, depth range, hot tub yes/no, diving board yes/no, allowed activities. Each toggle adds or removes the relevant clauses."
  }, {
    title: "Generate the waiver",
    body: "Get a clean two-page PDF in plain English (and Spanish on request). Reviewable in two minutes — no legalese walls."
  }, {
    title: "Wire it into your booking flow",
    body: "Toggle one switch and every confirmed booking includes a waiver link in the confirmation email and SMS. Guests sign on their phone before arrival."
  }, {
    title: "Store and retrieve on demand",
    body: "Signed waivers are timestamped, IP-logged, and saved to the booking record indefinitely. Pull any signed waiver in two clicks if a claim ever comes up."
  }]
};
const SCENARIOS = {
  heading: "Common scenarios",
  items: [{
    title: "The slip-and-fall",
    body: "Guest slips on a wet deck, bruises a hip, threatens a claim. The signed waiver acknowledging slipping risk on wet surfaces, combined with the $2M policy, typically resolves the situation before it becomes a lawsuit."
  }, {
    title: "The unsupervised kid",
    body: "Adult turns away for 90 seconds, eight-year-old who can't swim panics in the deep end. Waiver includes a specific adult-supervision-at-all-times clause that materially changes how the claim is evaluated."
  }, {
    title: "The intoxicated guest",
    body: "Guest gets drunk and hurts themselves. Waiver includes acknowledgment of alcohol risk and host's right to end the booking — both critical pieces if the guest later sues."
  }, {
    title: "The disputed damage",
    body: "Guest claims they didn't break the patio furniture; you have video showing they did. Signed waiver includes acknowledgment of host's right to charge for damage from the booking's security deposit."
  }]
};
const PROPS = {
  eyebrow: "Free tool · Coming soon",
  h1: "Pool waiver generator: free digital liability waivers for hosts",
  intro: "Send a one-tap digital waiver before every booking. Guests sign on their phone, you get a PDF on file, and you're protected if something goes wrong. Free for Pool Rental Near Me hosts.",
  heroSrc: heroImage,
  heroAlt: "Pool guest signing a digital liability waiver on a smartphone before entering a backyard pool",
  bullets: ["Send a waiver link with every booking confirmation", "Guests sign on their phone in 30 seconds", "PDF copies stored on your account forever", "State-aware language for the most-rented states", "Add minors, multiple guests, and group leaders", "Powered by RentalWaivers.com for advanced customization"],
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
