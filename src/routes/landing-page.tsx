import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { buildMeta, ldJsonScript, SITE_NAME, SITE_URL } from "@/lib/seo";
import { getHomeData, type HomeData } from "@/server/home-data.functions";
import { HomePageContent, HOMEPAGE_FAQS, HOMEPAGE_HERO_IMAGE } from "@/components/home-page";

const EMPTY_HOME_DATA: HomeData = {
  cities: [],
  cityCount: 0,
  categories: [],
  listings: [],
  nearby: { city: null, region: null, count: 0, nearestMiles: null },
};

export const Route = createFileRoute("/landing-page")({
  // This route is reverse-proxied at https://www.poolrentalnearme.com/.
  // The browser URL is `/` while the upstream HTML is for `/landing-page`,
  // which makes any data-driven first render risk a hydration mismatch.
  // We render a deterministic empty shell on both server and first client
  // render, then fetch live data in an effect post-hydration.
  head: () => {
    const meta = buildMeta({
      title: "Pool Rental Near Me — Rent a Private Pool by the Hour",
      description:
        "Find and book private pool rentals near you. Heated pools, hot tubs, and luxury backyards. Hourly bookings with $2M liability insurance included.",
      path: "/landing-page",
      // Reverse proxy serves this upstream at https://www.poolrentalnearme.com/.
      // Canonicalize to the root so Google never indexes /landing-page as a
      // separate page competing with /.
      canonicalPath: "/",
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
  const fetchHome = useServerFn(getHomeData);
  const [data, setData] = useState<HomeData>(EMPTY_HOME_DATA);

  useEffect(() => {
    let cancelled = false;
    fetchHome()
      .then((d) => {
        if (!cancelled && d) setData(d);
      })
      .catch((err) => {
        console.error("landing-page getHomeData failed:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchHome]);

  return <HomePageContent data={data} />;
}
