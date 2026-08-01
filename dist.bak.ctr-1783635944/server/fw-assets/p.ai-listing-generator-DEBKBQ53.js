import { jsx } from "react/jsx-runtime";
import { at as BREADCRUMBS, au as FAQS, i as heroImage } from "./router-BEu57YoG.js";
import { T as ToolPlaceholderPage } from "./tool-placeholder-DQA4fPg6.js";
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
const WHY_EXISTS = {
  heading: "Why the AI pool listing generator exists",
  paragraphs: ["Most new pool hosts stall on the same step: writing the listing. They open the form, see a blank title field and a 500-character description box, and bounce. The pool that could be earning $3,000 a month sits unlisted because nobody wants to write marketing copy on a Tuesday night after work.", `The other failure mode is worse — hosts who do publish, but write a generic three-line description ("Nice pool, fenced yard, holds 10 people") that doesn't rank, doesn't convert, and doesn't get bookings. They blame the platform when really their listing buried itself.`, "The AI listing generator removes both excuses. Upload one photo, get a real listing draft in under 60 seconds — title tuned to how renters actually search, description that highlights the things that actually book (shade, restroom access, easy parking), and an amenities checklist pulled from what's visible in your photos. You edit, you publish, you start getting requests."]
};
const WHO_USES = {
  heading: "Who the listing generator is for",
  paragraphs: ["First-time hosts are the obvious fit. You have a pool, you've heard about the income, and the only thing between you and your first booking is the listing. The generator turns a blank form into a 90% finished draft.", "Existing hosts use it differently. If your current listing has been live for six months and bookings have plateaued, regenerate it. The AI was trained on the listings that book the most this season on Pool Rental Near Me, Swimply, and Peerspace — your three-year-old copy is probably leaving rate and ranking on the table.", "Property managers running multiple pools save the most time. Instead of writing eight near-identical listings by hand and accidentally cannibalizing your own search results, generate eight unique drafts in 10 minutes — each with different keywords, different angles, and different hero photos."]
};
const HOW_IT_WORKS = {
  heading: "How the AI listing generator works",
  steps: [{
    title: "Upload one to five photos of your pool",
    body: "Wide-angle of the pool, one of the surrounding yard, and one of any standout feature (waterfall, hot tub, cabana). Phone shots are fine."
  }, {
    title: "Confirm the basics",
    body: "Pool type (in-ground vs above), approximate gallons, max guest count, and your zip. The AI uses zip to anchor pricing."
  }, {
    title: "Review the generated draft",
    body: "Title, two-paragraph description, amenities checklist, suggested hourly rate, and a starter set of house rules — all editable in place."
  }, {
    title: "Tweak and approve",
    body: "Most hosts change one or two lines. Hit save and the draft becomes a live, indexable listing on your Pool Rental Near Me dashboard."
  }, {
    title: "Iterate as you learn",
    body: "After 10 bookings, re-run the generator with your real booking data fed back in. It will sharpen the title and re-rank amenities by what actually closes."
  }]
};
const SCENARIOS = {
  heading: "Common scenarios",
  items: [{
    title: "The brand-new host",
    body: "You bought the house six months ago. The pool is the reason. You've never written a rental listing in your life and the blank form is intimidating. Twelve minutes after starting, you have a publishable listing."
  }, {
    title: "The plateaued host",
    body: "You've been live for a year. Bookings have flattened. Regenerate the listing with this season's training data and you usually pick up 15–25% more profile views in the first two weeks."
  }, {
    title: "The multi-pool manager",
    body: "You manage three to ten pools for a small portfolio. The generator gives each one a distinct angle and keyword set so they stop competing with each other in the same city search."
  }, {
    title: "The bilingual market",
    body: "You host in a market with strong Spanish-language demand (Los Angeles, Miami, Houston, Phoenix). One click outputs a parallel Spanish listing so you don't have to translate by hand."
  }]
};
const PROPS = {
  eyebrow: "AI tool · Coming soon",
  h1: "AI pool listing generator: turn one photo into a booking-ready listing",
  intro: "Stop staring at a blank listing form. Upload a photo of your pool and our AI writes the title, description, amenities, and starter house rules — tuned on the listings that actually book on Pool Rental Near Me.",
  heroSrc: heroImage,
  heroAlt: "Host taking a photo of a backyard pool with a phone, with AI-generated listing text appearing on screen",
  bullets: ["Upload one photo to generate a complete listing draft", "Auto-detect pool type, amenities, and capacity from photos", "Suggested title, two-paragraph description, and house rules", "Recommended hourly rate based on your zip code", "Bilingual output (English and Spanish) with one click", "One-click push into your Pool Rental Near Me listing"],
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
