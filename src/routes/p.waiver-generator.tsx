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

const PATH = "/p/waiver-generator";
const PUBLISHED = "2026-05-23T00:00:00Z";
const MODIFIED = "2026-05-23T00:00:00Z";

const TITLE =
  "Pool waiver generator: free digital liability waivers for hosts | Pool Rental Near Me";
const DESCRIPTION =
  "Free pool waiver generator. Create a digital liability waiver every guest signs on their phone before arrival. State-aware language, PDF copies, host-ready.";

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "What is a pool rental liability waiver?",
    a: "It's a short legal document a guest signs before swimming that acknowledges the risks of pool use and waives certain claims against the host. Every serious pool host uses one.",
  },
  {
    q: "Is the waiver generator free?",
    a: "Yes. The hosted, sign-on-phone waiver is free for Pool Rental Near Me hosts. The standalone product at RentalWaivers.com offers extras like custom branding and unlimited industries.",
  },
  {
    q: "Is a digital waiver legally enforceable?",
    a: "Yes — when it's signed, time-stamped, and stored with the guest's identifying info. Our waiver captures all three and stores a PDF on your account for every booking.",
  },
  {
    q: "Does the waiver work in every state?",
    a: "The base language works nationwide and the generator adjusts for state-specific quirks (California, Texas, Florida, New York). For unusual rules, check with a local attorney.",
  },
  {
    q: "What if my guest refuses to sign?",
    a: "Don't host them. Refusing a standard liability waiver is the single strongest predictor of a problem booking. Our cancellation policy supports declining for unsigned waivers.",
  },
];

const PROPS: Omit<ToolPlaceholderProps, "breadcrumbItems"> = {
  eyebrow: "Free tool · Coming soon",
  h1: "Pool waiver generator: free digital liability waivers for hosts",
  intro:
    "Send a one-tap digital waiver before every booking. Guests sign on their phone, you get a PDF on file, and you're protected if something goes wrong. Free for Pool Rental Near Me hosts.",
  heroSrc: heroImage,
  heroAlt:
    "Pool guest signing a digital liability waiver on a smartphone before entering a backyard pool",
  bullets: [
    "Send a waiver link with every booking confirmation",
    "Guests sign on their phone in 30 seconds",
    "PDF copies stored on your account forever",
    "State-aware language for the most-rented states",
    "Add minors, multiple guests, and group leaders",
    "Powered by RentalWaivers.com for advanced customization",
  ],
  faqs: FAQS,
  primaryCta: { label: "Notify me when it launches", href: "/p/hosting" },
  secondaryCta: { label: "See all free host tools", href: "/p/free-host-tools" },
};

const BREADCRUMBS = [
  { name: "Home", path: "/" },
  { name: "Host Tools", path: "/p/free-host-tools" },
  { name: "Waiver generator", path: PATH },
];

export const Route = createFileRoute("/p/waiver-generator")({
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
