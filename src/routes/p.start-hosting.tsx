import { createFileRoute } from "@tanstack/react-router";
import {
  ToolPlaceholderPage,
  type ToolPlaceholderProps,
} from "@/components/templates/tool-placeholder";
import {
  buildMeta,
  breadcrumbJsonLd,
  ldJsonScript,
  SITE_URL,
} from "@/lib/seo";
import heroImage from "@/assets/hosting-hero.jpg";

/**
 * /p/start-hosting — short, keyword-focused entry funnel that replaces
 * earn.poolrentalnearme.com. The deeper hub lives at /p/hosting; this
 * page captures the "start hosting" search intent and funnels there.
 */

const PATH = "/p/start-hosting";
const PUBLISHED = "2026-05-23T00:00:00Z";
const MODIFIED = "2026-05-23T00:00:00Z";

const TITLE =
  "Start hosting your pool: earn $1,500 to $8,000 a month | Pool Rental Near Me";
const DESCRIPTION =
  "Start hosting your pool on Pool Rental Near Me. Flat 10% host fee, $2M liability included, free to list, 24-hour payouts. Be live in 15 minutes.";

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "How do I start hosting my pool?",
    a: "Create a free account, add photos and an hourly rate, pick the days you want to host, and submit. We review every pool before it goes live, usually within 24 hours.",
  },
  {
    q: "How much can I earn hosting a pool?",
    a: "Most hosts earn $1,500 to $8,000 a month in season. Earnings depend on your city, pool size, amenities, and how aggressively you price weekends and holidays.",
  },
  {
    q: "What does it cost to start hosting?",
    a: "Nothing. Listing is free. There's no monthly fee. We take a flat 10% per booking — Swimply charges 15% to 30%.",
  },
  {
    q: "Do I need my own insurance to host?",
    a: "No. Every booking includes up to $2,000,000 in third-party liability coverage built into the host fee. Most hosts also keep their own homeowner policy in place.",
  },
  {
    q: "Can I host without being home?",
    a: "Yes. Many hosts use a smart lock and a digital waiver, plus our automated check-in messages. Our free Pool Host Academy covers the exact setup.",
  },
];

const WHY_EXISTS = {
  heading: "Why start hosting your pool",
  paragraphs: [
    "A backyard pool is one of the most underused assets in American real estate. The average residential pool gets swum in about 25 days a year. The other 340 days it sits idle, costing $200 to $500 a month in chemicals, electricity, and water — a recurring drain on your household budget that produces no income.",
    "Hosting flips that math. The same pool that's costing you $300 a month becomes one that's making you $3,000 a month — and in the right city, in season, $8,000 a month is normal, not exceptional. Hosts in Los Angeles, Phoenix, Miami, Houston, Dallas, and Atlanta routinely break $10,000 in peak July weekends alone.",
    "Pool Rental Near Me is built specifically for this. Flat 10% host fee — half of what Swimply charges. $2M liability insurance baked into every booking at no extra cost. Free to list, no monthly fees, payouts within 24 hours. The economics finally favor the person who actually owns the pool.",
  ],
};

const WHO_USES = {
  heading: "Who hosts on Pool Rental Near Me",
  paragraphs: [
    "Homeowners with an in-ground or above-ground pool, a fenced yard, and a few hours a week to host. You don't have to be home — about 60% of our hosts run a smart lock plus a digital waiver and never meet most of their guests in person.",
    "Property managers and short-term rental operators add pool rental as a separate revenue stream on top of nightly stays. The pool can be booked by the hour to locals during the day while the property itself sits between guest turnovers.",
    "Career changers and semi-retired homeowners use hosting as a part-time business. A two-pool portfolio in a strong market clears $6,000 to $12,000 a month in season — meaningful income for a few hours a week of cleaning, messaging, and guest greeting.",
  ],
};

const HOW_IT_WORKS = {
  heading: "How to start hosting in 15 minutes",
  steps: [
    { title: "Create a free host account", body: "Email and phone, no card required. Hosting is free to start — you keep 90% of every booking from day one." },
    { title: "Upload five photos and basic info", body: "Wide shot of the pool, the yard, any standout amenity, plus pool dimensions and max guests. Phone photos are fine; our AI listing generator writes the rest." },
    { title: "Set your hourly rate and availability", body: "Our smart pricing tool benchmarks your zip code, pool size, and amenities against booked listings nearby and recommends an opening rate." },
    { title: "Pass the 24-hour review", body: "We verify every pool before it goes live to protect you and the marketplace. Most listings are approved within a few hours." },
    { title: "Start receiving bookings", body: "Bookings come in through the app. Approve manually for the first month or two, then turn on auto-approval for renters with verified IDs and past 5-star reviews." },
  ],
};

const SCENARIOS = {
  heading: "Common host scenarios",
  items: [
    { title: "The $3K/month suburban host", body: "Standard 30,000-gallon in-ground in a Phoenix suburb. $65/hour, books 50 hours a month May through September, $325 in monthly hosting costs net. Pool pays for itself plus a car payment." },
    { title: "The $8K/month luxury host", body: "Heated pool with hot tub, outdoor kitchen, and shade structures in Beverly Hills. $150/hour weekends, books out four to six weekends a month, plus weekday corporate offsites and photo shoots." },
    { title: "The event-only host", body: "Larger backyard near a downtown core. Skips casual swimming, hosts only birthday parties and small corporate events. Three to five events a month at $400–$800 per booking." },
    { title: "The portfolio host", body: "Property manager running three vacation rentals, each with a pool. Layers in pool-only bookings during the daytime between overnight guests — adds $4,000–$6,000 a month across the portfolio with no extra property cost." },
  ],
};

const PROPS: Omit<ToolPlaceholderProps, "breadcrumbItems"> = {
  eyebrow: "Earn from your pool",
  h1: "Start hosting your pool: earn $1,500 to $8,000 a month",
  intro:
    "Your backyard pool can pay for itself. Start hosting on Pool Rental Near Me with a flat 10% host fee, $2M liability on every booking, and 24-hour payouts. Free to list, no monthly cost, be live in 15 minutes.",
  heroSrc: heroImage,
  heroAlt:
    "Smiling pool host welcoming guests to a clean backyard pool on a sunny afternoon",
  bullets: [
    "Flat 10% host fee (Swimply charges 15–30%)",
    "$2,000,000 liability coverage on every booking",
    "24-hour payouts, free to list, no monthly fees",
    "Approve every guest or auto-approve trusted renters",
    "Pool Host Academy: 135 free classes to ramp up fast",
    "Free Host Pro app: pricing, calendar, waivers, taxes",
  ],
  whyExists: WHY_EXISTS,
  whoUses: WHO_USES,
  howItWorks: HOW_IT_WORKS,
  scenarios: SCENARIOS,
  faqs: FAQS,
  primaryCta: {
    label: "List my pool — it's free",
    href: "/l/draft/00000000-0000-0000-0000-000000000000/new/details",
  },
  secondaryCta: { label: "See the full host guide", href: "/p/hosting" },
};

const BREADCRUMBS = [
  { name: "Home", path: "/" },
  { name: "Host Tools", path: "/p/free-host-tools" },
  { name: "Start hosting", path: PATH },
];

export const Route = createFileRoute("/p/start-hosting")({
  head: () => {
    const meta = buildMeta({
      title: TITLE,
      description: DESCRIPTION,
      path: PATH,
      type: "article",
      image: `${SITE_URL}${heroImage}`,
    });
    return {
      meta: [
        ...meta.meta,
        { property: "article:published_time", content: PUBLISHED },
        { property: "article:modified_time", content: MODIFIED },
        { property: "article:author", content: "Pool Rental Near Me" },
      ],
      links: meta.links,
      scripts: [
        ldJsonScript(breadcrumbJsonLd(BREADCRUMBS)),
        ldJsonScript({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      ],
    };
  },
  component: () => <ToolPlaceholderPage {...PROPS} breadcrumbItems={BREADCRUMBS} />,
});
