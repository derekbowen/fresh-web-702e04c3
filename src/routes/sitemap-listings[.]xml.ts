import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SITE_URL } from "@/lib/seo";
import { pagedSitemapResponse, sitemapUnavailableResponse } from "@/lib/sitemap";
import { loadListingEntries } from "@/lib/sitemap-sources";

/**
 * Sitemap of Sharetribe listings mirrored into `synced_listings`.
 * Listing pages live at /l/{slug}/{sharetribe_id} (owned by the
 * Sharetribe marketplace, proxied by nginx).
 *
 * Mirror table is refreshed by the listing-sync job; sitemap reads
 * the mirror to avoid burning Sharetribe API quota on every fetch.
 * Configuration listings are left out (NON_PUBLIC_LISTING_IDS and the title
 * marker in src/lib/sitemap-rules.ts).
 */
export const Route = createFileRoute("/sitemap-listings.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const list = await loadListingEntries(supabaseAdmin, SITE_URL);
        // Failed read: 503, not a 200 with an empty <urlset>.
        if (!list.ok) return sitemapUnavailableResponse();
        return pagedSitemapResponse(request, list.data);
      },
    },
  },
});
