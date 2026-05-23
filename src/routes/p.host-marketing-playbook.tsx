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

const WHY_EXISTS = {
  heading: "Why the host marketing playbook exists",
  paragraphs: [
    "Most pool hosts hit the same wall around month three. The listing is live, the early-adopter friends-and-family bookings have run their course, and the calendar suddenly has gaps. The platform brings some traffic, but \"some\" doesn't pay the mortgage.",
    "At that point hosts try to learn marketing from scratch. They watch YouTube videos meant for Airbnb operators, copy Instagram captions from interior designers, and design clip-art flyers in Word. The output usually looks amateur and converts worse than doing nothing.",
    "The host marketing playbook short-circuits all of that. Every asset inside is something a top-earning Pool Rental Near Me host is actually using right now — printable neighborhood flyers, seasonal social campaigns, cold outreach scripts for HOAs and event planners, and review-request templates that get replies. Copy, paste, adapt to your city, and put it to work the same afternoon.",
  ],
};

const WHO_USES = {
  heading: "Who the playbook is for",
  paragraphs: [
    "Hosts at the \"I'm getting some bookings but I want more\" stage get the most out of it. The playbook assumes your listing is live and presentable; it's about filling the calendar around it.",
    "Hosts targeting events specifically — birthday parties, corporate offsites, photo shoots, swim lessons — find the most leverage. Event demand doesn't search the same way casual swimmers do, and the cold outreach scripts open doors that the marketplace alone never will.",
    "Property managers and small portfolios use the seasonal calendar as a quarterly checklist. Instead of reinventing campaigns each season, you have a 12-month template that says \"this is the email we send in late February\" and \"this is the flyer we drop in early May.\"",
  ],
};

const HOW_IT_WORKS = {
  heading: "How to use the playbook",
  steps: [
    { title: "Start with the seasonal calendar", body: "Find the current month and read the next 60 days of campaigns. Pick two campaigns to run." },
    { title: "Customize the templates", body: "Drop in your city, your pool name, your hourly rate, your booking link. Every template uses placeholder tokens so you don't miss a spot." },
    { title: "Print, post, send", body: "Flyers go up in coffee shops and community boards. Social captions go out across Instagram, TikTok, and Facebook on the schedule recommended in the calendar." },
    { title: "Track what works", body: "Each template has a tracking link. After a campaign ends, the playbook tells you which channels actually generated bookings so you double down next time." },
    { title: "Refresh quarterly", body: "We update the playbook each season with new templates and remove ones that stopped converting. Re-download in March, June, September, and December." },
  ],
};

const SCENARIOS = {
  heading: "Common scenarios",
  items: [
    { title: "Filling the shoulder season", body: "It's April. Summer is coming but bookings haven't picked up. The playbook's pre-season campaign drops a neighborhood flyer and a \"book early for summer weekends\" Instagram series that historically fills 30–40% of June dates in the first two weeks." },
    { title: "Going after corporate offsites", body: "Your pool can host a 25-person team event but corporate buyers aren't searching the marketplace. The cold-outreach script pack gives you the exact email, LinkedIn DM, and follow-up cadence top hosts use to book a single $1,200 corporate event a month." },
    { title: "Recovering after a bad review", body: "One unfair 3-star review tanked your conversion rate. The review-request templates run a structured ask after the next 10 bookings and bury the old review under fresh 5-stars within a month." },
    { title: "Filling winter and hot-tub-only dates", body: "Most hosts give up in October. The winter section pivots your listing toward photo shoots, hot-tub-only soaks, and indoor pool rentals where applicable — usually 10–20% of summer revenue, on auto-pilot." },
  ],
};

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
