import { createFileRoute } from "@tanstack/react-router";
import { buildMeta, ldJsonScript } from "@/lib/seo";
import { getHomeData, type HomeData } from "@/server/home-data.functions";
import { HomePageContent, HOMEPAGE_FAQS, HOMEPAGE_HERO_IMAGE } from "@/components/home-page";

const EMPTY_HOME_DATA: HomeData = {
  cities: [],
  cityCount: 0,
  categories: [],
  listings: [],
  nearby: { city: null, region: null, count: 0, nearestMiles: null },
  academyAvailable: [],
  academyHealth: {},
};

export const Route = createFileRoute("/")({
  loader: async (): Promise<HomeData> => {
    try {
      return (await getHomeData()) ?? EMPTY_HOME_DATA;
    } catch (err) {
      console.error("index loader failed:", err);
      return EMPTY_HOME_DATA;
    }
  },
  head: () => {
    const meta = buildMeta({
      title: "Pool Rental Near Me — Rent a Private Pool by the Hour",
      description:
        "Find and book private pool rentals near you. Heated pools, hot tubs, and luxury backyards. Hourly bookings with $2M liability insurance included.",
      path: "/",
      // Indexability is controlled by the X-Robots-Tag HTTP header in src/start.ts
      // (preview hosts get noindex; production www.poolrentalnearme.com is indexable).
      // Do NOT add a noindex meta tag here — it would deindex the production homepage.
      image: HOMEPAGE_HERO_IMAGE,
    });
    // Organization + WebSite JSON-LD are emitted once in __root.tsx and
    // inherited by every route — do NOT re-emit Organization here or
    // Google Rich Results flags the page for duplicate structured data.
    const faqLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: HOMEPAGE_FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };
    return {
      ...meta,
      links: [
        ...(meta.links ?? []),
        // Speed up navigation to the Sharetribe marketplace search page.
        { rel: "prefetch", href: "/s" },
        // Warm up the connection to the imgix CDN that serves listing photos
        // (hero image + every featured-listing thumbnail).
        { rel: "preconnect", href: "https://sharetribe.imgix.net", crossOrigin: "" },
      ],
      scripts: [ldJsonScript(faqLd)],
    };
  },
  component: HomePage,
});

function HomePage() {
  const data = Route.useLoaderData();
  return <HomePageContent data={data} />;
}
