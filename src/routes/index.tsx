import { createFileRoute } from "@tanstack/react-router";
import { buildMeta, ldJsonScript } from "@/lib/seo";
import {
  getHomeData,
  getWinterHomeData,
  type HomeData,
  type WinterHomeData,
} from "@/server/home-data.functions";
import { HomePageContent, HOMEPAGE_FAQS, HOMEPAGE_HERO_IMAGE } from "@/components/home-page";
import { WinterHomePage } from "@/components/home-page-winter";

const EMPTY_HOME_DATA: HomeData = {
  cities: [],
  cityCount: 0,
  categories: [],
  listings: [],
  nearby: { city: null, region: null, count: 0, nearestMiles: null },
  academyAvailable: [],
  academyHealth: {},
};

const EMPTY_WINTER_DATA: WinterHomeData = { featured: [], cityCards: [], cities: [] };

/**
 * The winter homepage (2026-09-09 brief) is the production homepage at `/` as
 * of 2026-09-13, on Derek's go. The gate that used to expose it at
 * `/?preview=winter` is now INVERTED: the previous homepage is still built and
 * still reachable at `/?preview=classic`, so the two can be compared side by
 * side and a rollback is a URL, not a deploy.
 *
 * The noindex meta below is scoped to the classic preview and must stay that
 * way — `/` itself must never carry it. getWinterHomeData used to set
 * `x-robots-tag: noindex, nofollow` and `cache-control: no-store` on every
 * response back when it only served the preview; both were removed when it was
 * promoted, because a response header would have deindexed `/` no matter what
 * this file said. Indexability is decided by host in src/start.ts.
 */
type HomeSearch = { preview?: "classic" };

type HomeLoaderData =
  | { preview: "classic"; home: HomeData }
  | { preview?: undefined; winter: WinterHomeData };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): HomeSearch =>
    search.preview === "classic" ? { preview: "classic" } : {},
  loaderDeps: ({ search }) => ({ preview: search.preview }),
  loader: async ({ deps }): Promise<HomeLoaderData> => {
    if (deps.preview === "classic") {
      try {
        return { preview: "classic", home: (await getHomeData()) ?? EMPTY_HOME_DATA };
      } catch (err) {
        console.error("classic homepage loader failed:", err);
        return { preview: "classic", home: EMPTY_HOME_DATA };
      }
    }
    try {
      return { winter: (await getWinterHomeData()) ?? EMPTY_WINTER_DATA };
    } catch (err) {
      console.error("index loader failed:", err);
      return { winter: EMPTY_WINTER_DATA };
    }
  },
  head: ({ loaderData }) => {
    const isPreview = loaderData?.preview === "classic";
    const meta = buildMeta({
      title: "Pool Rental Near Me — Rent a Pool by the Hour | Private Pools Near You",
      description:
        "Rent a pool near you by the hour — private backyard pools, heated pools & hot tubs from real hosts. 0% host fees, hosts keep 100%. Book a private pool rental in minutes.",
      path: "/",
      // Indexability is controlled by the X-Robots-Tag HTTP header in src/start.ts
      // (preview hosts get noindex; production www.poolrentalnearme.com is indexable).
      // Do NOT add a noindex meta tag here for the production render — it would
      // deindex the homepage. The ONLY noindex below is scoped to ?preview=classic.
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
      meta: [
        ...(meta.meta ?? []),
        ...(isPreview ? [{ name: "robots", content: "noindex, nofollow" }] : []),
      ],
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
  if (data?.preview === "classic") return <HomePageContent data={data.home} />;
  return <WinterHomePage data={data?.winter} />;
}
