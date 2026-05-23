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

const PATH = "/p/pool-heating-cost-calculator";
const PUBLISHED = "2026-05-23T00:00:00Z";
const MODIFIED = "2026-05-23T00:00:00Z";

const TITLE =
  "Pool heating cost calculator: gas, heat pump, and solar | Pool Rental Near Me";
const DESCRIPTION =
  "Free swimming pool heating cost calculator. Compare gas, heat pump, and solar — see monthly run-cost and payback time for your pool's size and climate.";

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "What does a pool heating cost calculator do?",
    a: "It estimates how much you'll spend each month to keep your pool at a target temperature, based on pool size, cover use, location, and the heater type (gas, electric heat pump, or solar).",
  },
  {
    q: "Which pool heater is cheapest to run?",
    a: "Solar is cheapest after install. Electric heat pumps typically cost $100–$300/month to run in mild climates. Natural gas is fastest but usually the most expensive per BTU.",
  },
  {
    q: "Do I really need a pool cover to control heating costs?",
    a: "Yes. A solar or thermal cover cuts heat loss by 50–70%. Without one, your heater fights evaporation 24/7 and run-costs roughly double.",
  },
  {
    q: "How much does it cost to heat a pool per month for rentals?",
    a: "For a typical 15,000-gallon backyard rental in a mild climate, expect $150–$450/month with a heat pump and cover, or $400–$900/month with gas and no cover.",
  },
  {
    q: "Is the calculator free?",
    a: "Yes. It's free for everyone, with no signup required. Hosts on Pool Rental Near Me can save preset profiles for each of their listings.",
  },
];

const PROPS: Omit<ToolPlaceholderProps, "breadcrumbItems"> = {
  eyebrow: "Free tool · Coming soon",
  h1: "Pool heating cost calculator: gas, heat pump, and solar",
  intro:
    "Estimate the real monthly cost to heat your pool, compare heater types side by side, and see how a cover changes payback time. Built for pool rental hosts who don't want a surprise utility bill at the end of summer.",
  heroSrc: heroImage,
  heroAlt:
    "Pool host reviewing a heating cost calculator on a laptop next to a heated backyard pool at dusk",
  bullets: [
    "Compare gas, electric heat pump, and solar in one screen",
    "Plug in pool gallons, target temperature, and zip code",
    "See monthly run-cost with and without a thermal cover",
    "Estimate payback time for solar and heat pump upgrades",
    "Export a host-ready cost summary for your listing FAQs",
    "Save profiles for each pool you manage",
  ],
  faqs: FAQS,
  primaryCta: {
    label: "Notify me when it launches",
    href: "/p/hosting",
  },
  secondaryCta: { label: "See all free host tools", href: "/p/free-host-tools" },
};

const BREADCRUMBS = [
  { name: "Home", path: "/" },
  { name: "Host Tools", path: "/p/free-host-tools" },
  { name: "Pool heating cost calculator", path: PATH },
];

export const Route = createFileRoute("/p/pool-heating-cost-calculator")({
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
