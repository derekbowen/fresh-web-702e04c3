import { createFileRoute } from "@tanstack/react-router";
import { buildMeta, ldJsonScript, SITE_NAME, SITE_URL } from "@/lib/seo";
import { getHomeData } from "@/server/home-data.functions";
import { HomePageContent, HOMEPAGE_FAQS, HOMEPAGE_HERO_IMAGE } from "@/components/home-page";

export const Route = createFileRoute("/landing-page")({
  // This route is served via an nginx reverse proxy at https://www.poolrentalnearme.com/.
  // The browser URL is `/` but the upstream HTML is for `/landing-page`, which causes
  // a router hydration mismatch (React error #418). Disabling SSR for this route makes
  // the client render fresh from the visible URL — head() metadata still SSRs for SEO.
  ssr: false,
  loader: () => getHomeData(),
  head: () => {
    const meta = buildMeta({
      title: "Pool Rental Near Me — Rent a Private Pool by the Hour",
      description:
        "Find and book private pool rentals near you. Heated pools, hot tubs, and luxury backyards. Hourly bookings with $2M liability insurance included.",
      path: "/landing-page",
      image: HOMEPAGE_HERO_IMAGE,
    });
    const org = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      sameAs: ["https://www.poolrentalnearme.com"],
    };
    const faqLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: HOMEPAGE_FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };
    return { ...meta, scripts: [ldJsonScript(org), ldJsonScript(faqLd)] };
  },
  component: LandingPage,
});

function LandingPage() {
  const data = Route.useLoaderData();
  return <HomePageContent data={data} />;
}
