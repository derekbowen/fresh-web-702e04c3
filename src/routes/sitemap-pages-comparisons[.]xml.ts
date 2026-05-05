import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SITE_URL } from "@/lib/seo";
import { buildUrlsetXml, sitemapResponse, type SitemapUrl } from "@/lib/sitemap";

/**
 * Sitemap for programmatic competitor-vs-PRNM city comparison pages:
 *   /p/giggster-vs-pool-rental-near-me-in-{city}
 *   /p/peerspace-vs-pool-rental-near-me-in-{city}
 *
 * Sources slugs from `cities` table (published only). Also emits the two
 * pillar pages.
 */

const PILLARS = [
  "/p/giggster-vs-pool-rental-near-me",
  "/p/peerspace-vs-pool-rental-near-me",
  "/p/swimply-alternative-vs-pool-rental-near-me",
];

const COMPETITOR_SLUGS = [
  "giggster-vs-pool-rental-near-me-in-",
  "peerspace-vs-pool-rental-near-me-in-",
];

export const Route = createFileRoute("/sitemap-pages-comparisons.xml")({
  server: {
    handlers: {
      GET: async () => {
        const now = new Date();
        const urls: SitemapUrl[] = PILLARS.map((p) => ({
          loc: `${SITE_URL}${p}`,
          lastmod: now,
        }));

        const { data, error } = await supabaseAdmin
          .from("cities")
          .select("slug, updated_at")
          .eq("is_published", true)
          .order("slug", { ascending: true })
          .limit(5000);

        if (!error && data) {
          for (const row of data) {
            const lastmod = row.updated_at ? new Date(row.updated_at) : now;
            for (const prefix of COMPETITOR_SLUGS) {
              urls.push({
                loc: `${SITE_URL}/p/${prefix}${row.slug}`,
                lastmod,
              });
            }
          }
        }

        return sitemapResponse(buildUrlsetXml(urls));
      },
    },
  },
});
