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

const PATH = "/p/ai-listing-generator";
const PUBLISHED = "2026-05-23T00:00:00Z";
const MODIFIED = "2026-05-23T00:00:00Z";

const TITLE =
  "AI pool listing generator: turn one photo into a booking-ready listing | Pool Rental Near Me";
const DESCRIPTION =
  "Upload one photo of your pool and our AI pool listing generator writes the title, description, amenities list, and house rules in under a minute. Free for hosts.";

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "What does the AI pool listing generator do?",
    a: "You upload one or more photos of your pool. The tool returns a finished listing: title, two-paragraph description, amenities list, suggested hourly rate, and a starter set of house rules.",
  },
  {
    q: "Is the AI listing generator free?",
    a: "Yes. It's free for every host on Pool Rental Near Me — no caps, no credit card. Listings you create flow straight into your dashboard.",
  },
  {
    q: "Can I edit what the AI writes?",
    a: "Everything is editable. The output is a strong first draft, not a final answer. Most hosts tweak the title, swap one or two amenities, and publish in under five minutes.",
  },
  {
    q: "Will my photos be used to train other models?",
    a: "No. Your photos are used to generate your listing copy and stored on your account. We never use them to train external models or share them with other hosts.",
  },
  {
    q: "What pool rental description generator works best for SEO?",
    a: "Ours is tuned on the top-ranking pool rental listings on Pool Rental Near Me, Swimply, and Peerspace. It uses the keywords renters actually search and avoids the boilerplate that hurts rankings.",
  },
];

const PROPS: Omit<ToolPlaceholderProps, "breadcrumbItems"> = {
  eyebrow: "AI tool · Coming soon",
  h1: "AI pool listing generator: turn one photo into a booking-ready listing",
  intro:
    "Stop staring at a blank listing form. Upload a photo of your pool and our AI writes the title, description, amenities, and starter house rules — tuned on the listings that actually book on Pool Rental Near Me.",
  heroSrc: heroImage,
  heroAlt:
    "Host taking a photo of a backyard pool with a phone, with AI-generated listing text appearing on screen",
  bullets: [
    "Upload one photo to generate a complete listing draft",
    "Auto-detect pool type, amenities, and capacity from photos",
    "Suggested title, two-paragraph description, and house rules",
    "Recommended hourly rate based on your zip code",
    "Bilingual output (English and Spanish) with one click",
    "One-click push into your Pool Rental Near Me listing",
  ],
  faqs: FAQS,
  primaryCta: { label: "Notify me when it launches", href: "/p/hosting" },
  secondaryCta: { label: "See all free host tools", href: "/p/free-host-tools" },
};

const BREADCRUMBS = [
  { name: "Home", path: "/" },
  { name: "Host Tools", path: "/p/free-host-tools" },
  { name: "AI listing generator", path: PATH },
];

export const Route = createFileRoute("/p/ai-listing-generator")({
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
