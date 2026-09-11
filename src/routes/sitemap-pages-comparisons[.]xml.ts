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

        // Some of these slugs have a content_pages row carrying a `redirect_to`,
        // which makes the page 301 to the pillar instead of serving itself. A
        // sitemap must not advertise a URL that redirects, so those are skipped.
        // Filtering on redirect_to rather than a fixed list means any redirect
        // record added later is excluded automatically.
        const { data: redirectRows } = await (supabaseAdmin as any)
          .from("content_pages")
          .select("slug")
          .not("redirect_to", "is", null)
          .like("slug", "%-vs-pool-rental-near-me-in-%")
          .limit(5000);
        const redirected = new Set<string>(
          ((redirectRows ?? []) as Array<{ slug: string | null }>)
            .map((r) => r.slug)
            .filter((s): s is string => typeof s === "string"),
        );

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
              if (redirected.has(`${prefix}${row.slug}`)) continue;
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
