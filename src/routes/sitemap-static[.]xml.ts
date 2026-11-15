import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/seo";
import {
  buildUrlsetXml,
  sitemapResponse,
  sitemapUnavailableResponse,
  type SitemapUrl,
} from "@/lib/sitemap";
import { loadAllStateHubs, stateHubPath } from "@/server/state-hub.functions";
import { STATIC_URLS } from "@/lib/sitemap-static-paths";

/** Static sub-sitemap. The path list and its rules: src/lib/sitemap-static-paths.ts. */
export const Route = createFileRoute("/sitemap-static.xml")({
  server: {
    handlers: {
      GET: async () => {
        // State hub pages are data-driven: the /p/pool-rentals-$state route
        // notFound()s any state with zero host_acq_city data. loadAllStateHubs()
        // already filters those out, so emit only states that actually render
        // (was: hardcoded all 51, which fed Google 38 sitemap 404s).
        //
        // If the hubs cannot be read the answer is 503, not a 200 that lists
        // the static pages and silently drops every state hub.
        let stateHubs: Awaited<ReturnType<typeof loadAllStateHubs>> = [];
        try {
          stateHubs = await loadAllStateHubs();
        } catch (err) {
          console.error("[sitemap-static] state hubs unavailable", err);
          return sitemapUnavailableResponse();
        }
        const stateEntries: Array<{ path: string; lastmod?: Date }> =
          stateHubs.map((h) => ({ path: stateHubPath(h.stateName) }));
        const urls: SitemapUrl[] = [...STATIC_URLS, ...stateEntries].map(
          // No lastmod unless a real change date is known: a "now" stamp on
          // every request is a fabricated freshness signal (audit 2026-09-01).
          (entry) => ({
            loc: `${SITE_URL}${entry.path}`,
            ...(entry.lastmod ? { lastmod: entry.lastmod } : {}),
          }),
        );
        return sitemapResponse(buildUrlsetXml(urls));
      },
    },
  },
});
