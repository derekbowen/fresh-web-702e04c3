import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sitemapResponse, sitemapUnavailableResponse, buildUrlsetXml } from "@/lib/sitemap";
import { loadCountryEntries } from "@/lib/sitemap-sources";
import { countryForHost, publicHostOf } from "@/lib/country-sites";

/**
 * Country-scoped sitemap, served on the ccTLD origins only.
 *
 * On a country's canonical (bare) host it lists exactly the pages the country
 * mapping (src/lib/country-sites.ts) assigns to that country, each at its
 * canonical URL on that host. Every other host gets an empty urlset, with no
 * database read:
 *   - www.<ccTLD>: its pages all canonicalise to the bare host, and a sitemap
 *     may list another host's URLs only when that host's robots.txt points at
 *     it (sitemaps.org cross-submission rule). The bare host's robots.txt
 *     points at its own sitemap, so a www.<ccTLD> list of bare-host URLs would
 *     be rejected entry by entry. Both variants' robots.txt name the bare
 *     host's sitemap, so nothing is lost.
 *   - www.poolrentalnearme.com and any other host: the www sitemaps list none
 *     of these pages (sitemap-rules.ts canonicalIsElsewhere).
 */
export const Route = createFileRoute("/sitemap-country.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const host = publicHostOf(request);
        const site = countryForHost(host);
        if (!site || host !== site.canonicalHost) return sitemapResponse(buildUrlsetXml([]));
        const list = await loadCountryEntries(site, supabaseAdmin);
        // Failed read: 503, never a 200 with an empty <urlset>.
        if (!list.ok) return sitemapUnavailableResponse();
        return sitemapResponse(buildUrlsetXml(list.data));
      },
    },
  },
});
