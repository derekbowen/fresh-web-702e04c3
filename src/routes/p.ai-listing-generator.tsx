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

const WHY_EXISTS = {
  heading: "Why the AI pool listing generator exists",
  paragraphs: [
    "Most new pool hosts stall on the same step: writing the listing. They open the form, see a blank title field and a 500-character description box, and bounce. The pool that could be earning $3,000 a month sits unlisted because nobody wants to write marketing copy on a Tuesday night after work.",
    "The other failure mode is worse — hosts who do publish, but write a generic three-line description (\"Nice pool, fenced yard, holds 10 people\") that doesn't rank, doesn't convert, and doesn't get bookings. They blame the platform when really their listing buried itself.",
    "The AI listing generator removes both excuses. Upload one photo, get a real listing draft in under 60 seconds — title tuned to how renters actually search, description that highlights the things that actually book (shade, restroom access, easy parking), and an amenities checklist pulled from what's visible in your photos. You edit, you publish, you start getting requests.",
  ],
};

const WHO_USES = {
  heading: "Who the listing generator is for",
  paragraphs: [
    "First-time hosts are the obvious fit. You have a pool, you've heard about the income, and the only thing between you and your first booking is the listing. The generator turns a blank form into a 90% finished draft.",
    "Existing hosts use it differently. If your current listing has been live for six months and bookings have plateaued, regenerate it. The AI was trained on the listings that book the most this season on Pool Rental Near Me, Swimply, and Peerspace — your three-year-old copy is probably leaving rate and ranking on the table.",
    "Property managers running multiple pools save the most time. Instead of writing eight near-identical listings by hand and accidentally cannibalizing your own search results, generate eight unique drafts in 10 minutes — each with different keywords, different angles, and different hero photos.",
  ],
};

const HOW_IT_WORKS = {
  heading: "How the AI listing generator works",
  steps: [
    { title: "Upload one to five photos of your pool", body: "Wide-angle of the pool, one of the surrounding yard, and one of any standout feature (waterfall, hot tub, cabana). Phone shots are fine." },
    { title: "Confirm the basics", body: "Pool type (in-ground vs above), approximate gallons, max guest count, and your zip. The AI uses zip to anchor pricing." },
    { title: "Review the generated draft", body: "Title, two-paragraph description, amenities checklist, suggested hourly rate, and a starter set of house rules — all editable in place." },
    { title: "Tweak and approve", body: "Most hosts change one or two lines. Hit save and the draft becomes a live, indexable listing on your Pool Rental Near Me dashboard." },
    { title: "Iterate as you learn", body: "After 10 bookings, re-run the generator with your real booking data fed back in. It will sharpen the title and re-rank amenities by what actually closes." },
  ],
};

const SCENARIOS = {
  heading: "Common scenarios",
  items: [
    { title: "The brand-new host", body: "You bought the house six months ago. The pool is the reason. You've never written a rental listing in your life and the blank form is intimidating. Twelve minutes after starting, you have a publishable listing." },
    { title: "The plateaued host", body: "You've been live for a year. Bookings have flattened. Regenerate the listing with this season's training data and you usually pick up 15–25% more profile views in the first two weeks." },
    { title: "The multi-pool manager", body: "You manage three to ten pools for a small portfolio. The generator gives each one a distinct angle and keyword set so they stop competing with each other in the same city search." },
    { title: "The bilingual market", body: "You host in a market with strong Spanish-language demand (Los Angeles, Miami, Houston, Phoenix). One click outputs a parallel Spanish listing so you don't have to translate by hand." },
  ],
};

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
  whyExists: WHY_EXISTS,
  whoUses: WHO_USES,
  howItWorks: HOW_IT_WORKS,
  scenarios: SCENARIOS,
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
