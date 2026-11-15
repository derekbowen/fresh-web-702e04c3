import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SITE_URL } from "@/lib/seo";
import { buildUrlsetXml, sitemapResponse, sitemapUnavailableResponse } from "@/lib/sitemap";
import { loadComparisonEntries } from "@/lib/sitemap-sources";

/**
 * Sitemap for programmatic competitor-vs-PRNM city comparison pages:
 *   /p/giggster-vs-pool-rental-near-me-in-{city}
 *   /p/peerspace-vs-pool-rental-near-me-in-{city}
 * plus the three pillar pages. Slugs come from the `cities` table (published
 * only), read in pages: `.limit(5000)` used to stop at PostgREST's 1,000-row
 * cap. City pages a content_pages row redirects (redirect_to) are left out.
 *
 * One file: two URLs per city is far below the 50,000-URL limit, and the index
 * lists this file once.
 *
 * Both reads fail closed (503). A failed redirect read used to mean "no
 * redirects", which advertised every redirecting URL; a failed cities read
 * used to answer 200 with the three pillars and nothing else.
 */
export const Route = createFileRoute("/sitemap-pages-comparisons.xml")({
  server: {
    handlers: {
      GET: async () => {
        const list = await loadComparisonEntries(supabaseAdmin, SITE_URL);
        if (!list.ok) return sitemapUnavailableResponse();
        return sitemapResponse(buildUrlsetXml(list.data));
      },
    },
  },
});
