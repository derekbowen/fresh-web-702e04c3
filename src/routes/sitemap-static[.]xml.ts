import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/seo";
import { buildUrlsetXml, sitemapResponse, type SitemapUrl } from "@/lib/sitemap";
import { getAllStateHubs, stateHubPath } from "@/server/state-hub.functions";

/**
 * Static sub-sitemap: pages whose URLs and content are known at build time
 * (no DB lookup needed for the URL list itself).
 */

const STATIC_URLS: Array<{ path: string; lastmod?: Date }> = [
  { path: "/" },
  { path: "/p/hosting" },
  { path: "/p/host-training-academy" },
  { path: "/p/become-a-host" },
  { path: "/p/become-a-swimming-pool-host" },
  { path: "/p/privacy-policy" },
  { path: "/p/terms-of-service" },
  { path: "/p/about" },
  { path: "/p/howitworksforguests" },
  { path: "/p/make-money" },
  { path: "/p/investors" },
  { path: "/p/all-locations" },
  { path: "/p/pool-rentals" },
  { path: "/p/pool-rental-insurance-explained" },
  { path: "/p/pool-rental-host-fees-compared" },
  { path: "/p/pool-rental-permits-by-state" },
  // Phase 1 subdomain consolidation — six new keyword-targeted tool routes.
  { path: "/p/start-hosting" },
  { path: "/p/pool-heating-cost-calculator" },
  { path: "/p/ai-listing-generator" },
  { path: "/p/waiver-generator" },
  { path: "/p/host-marketing-playbook" },
  { path: "/p/pool-rules-generator" },
  { path: "/p/pool-wifi-guide" },
];

export const Route = createFileRoute("/sitemap-static.xml")({
  server: {
    handlers: {
      GET: async () => {
        const now = new Date();
        // State hub pages are data-driven: the /p/pool-rentals-$state route
        // notFound()s any state with zero host_acq_city data. getAllStateHubs()
        // already filters those out, so emit only states that actually render
        // (was: hardcoded all 51, which fed Google 38 sitemap 404s).
        let stateHubs: Awaited<ReturnType<typeof getAllStateHubs>> = [];
        try {
          stateHubs = await getAllStateHubs();
        } catch {
          stateHubs = [];
        }
        const stateEntries: Array<{ path: string; lastmod?: Date }> =
          stateHubs.map((h) => ({ path: stateHubPath(h.stateName) }));
        const urls: SitemapUrl[] = [...STATIC_URLS, ...stateEntries].map(
          (entry) => ({
            loc: `${SITE_URL}${entry.path}`,
            lastmod: entry.lastmod ?? now,
          }),
        );
        return sitemapResponse(buildUrlsetXml(urls));
      },
    },
  },
});
