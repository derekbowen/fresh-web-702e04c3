import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sitemapResponse, buildUrlsetXml } from "@/lib/sitemap";

/**
 * Country-scoped sitemap, served on the ccTLD origins only.
 *
 * Each international domain advertises only its own country's pages, on its
 * own origin, so the ccTLDs never advertise duplicates of the .com catalogue.
 */
const COUNTRY_MATCH: Record<string, string[]> = {
  "poolrentalnearme.com.au": [
    "%-australia",
    "australian-%",
    "rent-out-your-pool-sydney",
    "rent-out-your-pool-melbourne",
  ],
  "poolrentalnearme.co.uk": [
    "%-uk",
    "%-united-kingdom",
    "rent-out-your-pool-london",
    "rent-out-your-pool-manchester",
  ],
  "poolrentalnearme.ca": [
    "%-canada",
    "canadian-%",
    "rent-out-your-pool-toronto",
    "rent-out-your-pool-vancouver",
  ],
};

export const Route = createFileRoute("/sitemap-country.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const host = new URL(request.url).hostname.toLowerCase();
        const bare = host.replace(/^www\./, "");
        const patterns = COUNTRY_MATCH[bare];
        if (!patterns) return sitemapResponse(buildUrlsetXml([]));

        const { data } = await supabaseAdmin
          .from("content_pages")
          .select("slug, updated_at")
          .eq("in_sitemap", true)
          .not("slug", "is", null)
          .or(patterns.map((p) => `slug.ilike.${p}`).join(","))
          .limit(5000);

        const urls = (data ?? []).map((row: { slug: string; updated_at: string | null }) => ({
          loc: `https://${host}/p/${row.slug}`,
          lastmod: row.updated_at ? new Date(row.updated_at) : new Date(),
        }));
        return sitemapResponse(buildUrlsetXml(urls));
      },
    },
  },
});
