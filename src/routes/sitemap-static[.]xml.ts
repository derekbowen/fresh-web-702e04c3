import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/seo";
import { buildUrlsetXml, sitemapResponse, type SitemapUrl } from "@/lib/sitemap";
import { STATE_NAMES } from "@/lib/states";

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
  // 50 state hub pages — internal linking layer for the 3,400+ city pages.
  ...Object.values(STATE_NAMES).map((name) => ({
    path: `/p/pool-rentals-${name.toLowerCase().replace(/\s+/g, "-")}`,
  })),
];

export const Route = createFileRoute("/sitemap-static.xml")({
  server: {
    handlers: {
      GET: async () => {
        const now = new Date();
        const urls: SitemapUrl[] = STATIC_URLS.map((entry) => ({
          loc: `${SITE_URL}${entry.path}`,
          lastmod: entry.lastmod ?? now,
        }));
        return sitemapResponse(buildUrlsetXml(urls));
      },
    },
  },
});
