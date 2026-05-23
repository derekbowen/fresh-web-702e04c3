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

const PATH = "/p/host-marketing-playbook";
const PUBLISHED = "2026-05-23T00:00:00Z";
const MODIFIED = "2026-05-23T00:00:00Z";

const TITLE =
  "Host marketing playbook: free templates, flyers, and seasonal campaigns | Pool Rental Near Me";
const DESCRIPTION =
  "Free host marketing playbook: printable flyers, social post templates, seasonal campaign calendars, and outreach scripts that fill your booking calendar.";

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "What's in the host marketing playbook?",
    a: "Printable neighborhood flyers, Instagram and TikTok caption templates, a 12-month seasonal campaign calendar, email outreach scripts, and review-request templates that actually get a response.",
  },
  {
    q: "Is the playbook free?",
    a: "Yes. It's free for every Pool Rental Near Me host. You can download the PDFs, copy the templates, and reuse them across any platform — Swimply, Peerspace, your own site.",
  },
  {
    q: "Will the templates work outside of pool rentals?",
    a: "Many of them yes — the social and email frameworks generalize. The flyers and seasonal campaigns are tuned for pool rental demand specifically.",
  },
  {
    q: "How often is the playbook updated?",
    a: "We refresh it each season. Spring openings, summer peak, fall winddown, and winter (event hosting, hot-tub-only) all get their own templates and timing notes.",
  },
  {
    q: "Do you have templates in Spanish?",
    a: "Yes. The social and outreach templates ship in English and Spanish. Flyer PDFs are bilingual or come in a Spanish-only version.",
  },
];

const PROPS: Omit<ToolPlaceholderProps, "breadcrumbItems"> = {
  eyebrow: "Free playbook · Coming soon",
  h1: "Host marketing playbook: free templates, flyers, and seasonal campaigns",
  intro:
    "Stop guessing what to post. The host marketing playbook gives you printable flyers, social captions, seasonal calendars, and outreach scripts — the exact assets our top earners use to fill their calendar.",
  heroSrc: heroImage,
  heroAlt:
    "Pool host marketing playbook open on a tablet next to printed neighborhood flyers and a phone showing an Instagram post",
  bullets: [
    "Printable neighborhood flyer PDFs (English and Spanish)",
    "Instagram, TikTok, and Facebook caption templates",
    "12-month seasonal campaign calendar with timing notes",
    "Cold outreach scripts for HOAs, event planners, and corporate teams",
    "Review-request email templates that get replies",
    "Listing-photo shot list and lighting cheat sheet",
  ],
  faqs: FAQS,
  primaryCta: { label: "Notify me when it launches", href: "/p/hosting" },
  secondaryCta: { label: "See all free host tools", href: "/p/free-host-tools" },
};

const BREADCRUMBS = [
  { name: "Home", path: "/" },
  { name: "Host Tools", path: "/p/free-host-tools" },
  { name: "Host marketing playbook", path: PATH },
];

export const Route = createFileRoute("/p/host-marketing-playbook")({
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
