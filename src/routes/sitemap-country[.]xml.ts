import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sitemapResponse, sitemapUnavailableResponse, buildUrlsetXml } from "@/lib/sitemap";
import { loadCountryEntries } from "@/lib/sitemap-sources";
import { countryForHost, publicHostOf } from "@/lib/country-sites";

/**
 * Country-scoped sitemap, served on the ccTLD origins only.
 *
 * Lists exactly the pages the country mapping (src/lib/country-sites.ts)
 * assigns to the requesting host's country, each at its canonical URL on the
 * country's canonical (bare) host, on both host variants — so www.<ccTLD> no
 * longer advertises a second set of URLs whose canonical is the bare host.
 * Any other host (www.poolrentalnearme.com included) gets an empty urlset; the
 * www sitemaps list none of these pages (sitemap-rules.ts canonicalIsElsewhere).
 */
export const Route = createFileRoute("/sitemap-country.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const site = countryForHost(publicHostOf(request));
        if (!site) return sitemapResponse(buildUrlsetXml([]));
        const list = await loadCountryEntries(site, supabaseAdmin);
        // Failed read: 503, never a 200 with an empty <urlset>.
        if (!list.ok) return sitemapUnavailableResponse();
        return sitemapResponse(buildUrlsetXml(list.data));
      },
    },
  },
});
