import { jsx } from "react/jsx-runtime";
import { z as BREADCRUMBS, D as FAQS, i as heroImage } from "./router-BPpbotmS.js";
import { T as ToolPlaceholderPage } from "./tool-placeholder-BGWPB8Qj.js";
import "@tanstack/react-router";
import "react";
import "@tanstack/react-query";
import "./site-footer-defaults-Brwu0BKb.js";
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
import "./renter-drip.server-CFIkIdnw.js";
import "node:fs";
import "node:path";
import "./host-drip.server-BAToYGOj.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
const WHY_EXISTS = {
  heading: "Why the pool rules generator exists",
  paragraphs: ["Nine out of ten host-side problems trace back to one of three things: glass at the pool, an unannounced extra 12 people showing up, or kids in the water unsupervised. All three are preventable with clear, signed house rules — and almost no host has them written down.", `The hosts who do write rules usually copy-paste a wall of legalese from a hotel website, which guests never read and which doesn't actually map to a backyard pool. Or they write three vague lines ("please be respectful, no glass") that don't protect anything when a $400 cleaning bill shows up Monday morning.`, "The rules generator gives you a clean middle path: a printable, plain-English rules document tuned specifically to your pool — your guest cap, your hours, your stance on music and smoking — paired with a digital signature so every guest acknowledges the rules before they arrive. Five minutes to set up, every booking, forever."]
};
const WHO_USES = {
  heading: "Who the rules generator is for",
  paragraphs: ["Hosts in their first 90 days get the biggest lift. You haven't seen the failure modes yet, but the generator has — every preset is based on the actual disputes that come through Pool Rental Near Me support. Following the recommended defaults will save you a $300 mess at least once this season.", "Hosts in HOA neighborhoods need the noise and amplified-music presets specifically. The generator's quiet-hours templates have been pressure-tested against neighbor complaints in dozens of HOAs and keep your hosting privileges intact.", "Hosts who allow events (birthday parties, photo shoots, small corporate gatherings) use the event-specific rule packs. They cover catering setup, decor restrictions, end-of-event cleanup expectations, and after-hours fees that most general rule documents miss entirely."]
};
const HOW_IT_WORKS = {
  heading: "How the rules generator works",
  steps: [{
    title: "Answer the questionnaire",
    body: "Pool type, max guests, allowed hours, position on kids, pets, music, smoking, alcohol, and photography. Takes about three minutes."
  }, {
    title: "Pick presets where you're unsure",
    body: 'Not sure where to land on amplified music or pet policy? Each question has a "what most hosts pick" recommendation based on bookings volume in your zip.'
  }, {
    title: "Review the generated document",
    body: "You get a printable PDF in plain English (and Spanish if requested), broken into short clear sections — not a wall of legalese."
  }, {
    title: "Wire it into bookings",
    body: "Toggle one switch and the rules attach to every booking confirmation, with a one-tap acknowledgment that gets timestamped and stored on the booking record."
  }, {
    title: "Update once per season",
    body: "Re-run the generator whenever your situation changes — added a hot tub, switched to event-only hosting, new HOA rule. Past bookings keep the version they signed; new bookings get the new version."
  }]
};
const SCENARIOS = {
  heading: "Common scenarios",
  items: [{
    title: "The party host",
    body: "You allow birthdays. The generator's event template caps decor placement, requires removal before midnight, blocks confetti and balloon arches inside the pool fence, and sets a documented after-hours cleanup fee."
  }, {
    title: "The quiet-neighborhood host",
    body: "HOA-sensitive. Amplified music caps at 8pm, guest cap at 12 to stay below HOA event-permit threshold, no parking on the street between 9pm and 7am."
  }, {
    title: "The kid-heavy market",
    body: 'Suburban host where most bookings are family swim parties. Generator surfaces a strict "adult present at the water at all times" rule and a signed acknowledgment line specifically about non-swimming kids.'
  }, {
    title: "The lifeguard-required listing",
    body: "Pool with a deep end, host wants every group with kids under 12 to either bring or hire a lifeguard. Generator wires the requirement directly into the booking flow as a checkbox during checkout."
  }]
};
const PROPS = {
  eyebrow: "Free tool · Coming soon",
  h1: "Pool rules generator: house rules every guest signs before arrival",
  intro: "Stop rewriting your house rules every booking. Answer a few questions, get a clean printable rules document tuned to your pool, and pair it with a one-tap digital waiver. Free for hosts.",
  heroSrc: heroImage,
  heroAlt: "Printed pool house rules document on a poolside table next to a phone showing the same rules digitally",
  bullets: ["Generate a printable rules PDF in under a minute", "Sliders for guest count, hours, music, glass, smoking", "Kid, pet, and lifeguard policy presets", "Spanish version generated alongside English", "Sync the rules into every booking confirmation", "Pair with the digital waiver for a signed record"],
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
