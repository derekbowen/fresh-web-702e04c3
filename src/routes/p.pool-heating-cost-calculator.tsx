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

const WHY_EXISTS = {
  heading: "Why the pool heating cost calculator exists",
  paragraphs: [
    "Heating is the line item that quietly eats pool rental profit. A host charges $75 an hour, books 20 hours a month, and feels great about a $1,500 month — until the utility bill arrives and a $600 gas charge wipes out 40% of the take. By then it's too late to reprice.",
    "The problem is that nobody runs the numbers up front. Heater manufacturers publish BTU ratings, not dollar costs. Utility companies publish per-therm rates, not pool-rental scenarios. And every \"how much does it cost to heat a pool\" article online is written for backyard owners who swim three times a summer, not for hosts heating to 88°F on demand every Saturday.",
    "This calculator translates the physics into the only number that matters: what will it cost you, this month, to host. Plug in gallons, target temperature, zip code, heater type, and cover usage. Get a real monthly run-cost and a recommended pass-through fee so your $75 rate stays a $75 rate after utilities.",
  ],
};

const WHO_USES = {
  heading: "Who the calculator is for",
  paragraphs: [
    "Prospective hosts pricing their listing use it before they go live. The output tells them whether their climate and pool size can support hourly rates that pencil — and whether a cover upgrade should happen before the first booking, not after the first power bill.",
    "Existing hosts use it to decide between gas and a heat pump upgrade. The calculator's payback view shows how many months a $4,500 heat pump takes to pay for itself given their actual booking volume. For busy hosts in mild climates, that number is often under a single season.",
    "Solar-curious hosts use it to size a panel array against their target temperature and shoulder-season hosting window. The output integrates with the host fee structure so the recommended pass-through to renters stays competitive in your local market.",
  ],
};

const HOW_IT_WORKS = {
  heading: "How the calculator works",
  steps: [
    { title: "Enter the pool basics", body: "Gallons (or length × width × average depth — we'll convert), pool type, and zip code so we can pull local climate and utility rates." },
    { title: "Pick a heater scenario", body: "Natural gas, propane, electric heat pump, or solar. Add the heater's BTU or kW rating if you know it; we use sane defaults if you don't." },
    { title: "Set your hosting profile", body: "Target water temperature, hours hosted per week, and whether you use a thermal cover between bookings. Cover usage typically halves the answer." },
    { title: "Compare side by side", body: "The output shows monthly run-cost, cost per booking hour, and payback time for any upgrades against your current setup." },
    { title: "Export a host-ready summary", body: "Generate a one-page PDF you can paste into your listing's FAQ section. Renters who see real numbers convert better than renters who get a surprise heating fee at checkout." },
  ],
};

const SCENARIOS = {
  heading: "Common scenarios",
  items: [
    { title: "The Phoenix host who doesn't need a heater", body: "Mid-summer in Arizona — solar gain keeps the pool at 86°F unassisted. The calculator confirms the host can skip heating costs entirely from May through September and bake a small \"heated\" surcharge into October–April only." },
    { title: "The Bay Area host running a heat pump", body: "Mild climate, year-round hosting potential. Calculator shows a heat pump runs about $180/month with a cover or $410/month without. Cover pays for itself in seven weeks." },
    { title: "The Atlanta host using gas", body: "Humid summers, cool evenings. Gas heats fast but the calculator shows the monthly run cost crosses $700 once they hit 30 booked hours. Heat pump upgrade pencils inside a single season." },
    { title: "The Vermont host with a short season", body: "Calculator shows a heat pump can extend the bookable window from 12 weeks to 22 weeks and effectively double annual revenue versus relying on solar gain alone." },
  ],
};

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
  whyExists: WHY_EXISTS,
  whoUses: WHO_USES,
  howItWorks: HOW_IT_WORKS,
  scenarios: SCENARIOS,
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
