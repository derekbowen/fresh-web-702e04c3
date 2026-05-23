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
import heroImage from "@/assets/host-pro-hero.jpg";

const PATH = "/p/pool-rules-generator";
const PUBLISHED = "2026-05-23T00:00:00Z";
const MODIFIED = "2026-05-23T00:00:00Z";

const TITLE =
  "Pool rules generator: free house rules every guest signs | Pool Rental Near Me";
const DESCRIPTION =
  "Free pool rules generator for hosts. Build a clear, enforceable house-rules document in 60 seconds — guest count, hours, glass, smoking, music, kids, pets, more.";

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "What does the pool rules generator do?",
    a: "It builds a clean, printable house-rules document tailored to your pool — guest count, hours, glass policy, smoking, music limits, kids and pets, photography, and after-hours fees.",
  },
  {
    q: "Is the pool rules generator free?",
    a: "Yes. Free for every host on Pool Rental Near Me. The PDF is yours to use on any platform — Swimply, Peerspace, your own site.",
  },
  {
    q: "Should I make guests sign my pool rules?",
    a: "Yes. Pair the rules with our digital waiver and you have a signed, time-stamped record. That's worth a lot if a guest later disputes a charge or claims damage.",
  },
  {
    q: "Can I require quiet hours or limit music volume?",
    a: "Yes. The generator includes time-windowed rules for noise, music, and parties. Most hosts cap amplified music at 8pm or 9pm to keep neighbors happy.",
  },
  {
    q: "What pool rules cause the most problems for hosts?",
    a: "Glass containers, unannounced extra guests, and unattended kids. Set hard rules on all three and your damage claims drop sharply.",
  },
];

const PROPS: Omit<ToolPlaceholderProps, "breadcrumbItems"> = {
  eyebrow: "Free tool · Coming soon",
  h1: "Pool rules generator: house rules every guest signs before arrival",
  intro:
    "Stop rewriting your house rules every booking. Answer a few questions, get a clean printable rules document tuned to your pool, and pair it with a one-tap digital waiver. Free for hosts.",
  heroSrc: heroImage,
  heroAlt:
    "Printed pool house rules document on a poolside table next to a phone showing the same rules digitally",
  bullets: [
    "Generate a printable rules PDF in under a minute",
    "Sliders for guest count, hours, music, glass, smoking",
    "Kid, pet, and lifeguard policy presets",
    "Spanish version generated alongside English",
    "Sync the rules into every booking confirmation",
    "Pair with the digital waiver for a signed record",
  ],
  faqs: FAQS,
  primaryCta: { label: "Notify me when it launches", href: "/p/hosting" },
  secondaryCta: { label: "See all free host tools", href: "/p/free-host-tools" },
};

const BREADCRUMBS = [
  { name: "Home", path: "/" },
  { name: "Host Tools", path: "/p/free-host-tools" },
  { name: "Pool rules generator", path: PATH },
];

export const Route = createFileRoute("/p/pool-rules-generator")({
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
