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
