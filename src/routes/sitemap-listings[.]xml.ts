import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SITE_URL } from "@/lib/seo";
import { canonicalListingUrl } from "@/lib/listing-url";
import {
  buildUrlsetXml,
  sitemapResponse,
  SITEMAP_PAGE_SIZE,
  type SitemapUrl,
} from "@/lib/sitemap";

/**
 * Sitemap of Sharetribe listings mirrored into `synced_listings`.
 *
 * Listing pages are owned by the marketplace and proxied by nginx. The
 * marketplace registers both /l/:slug/:id and /l/:id, and its canonicalRoutePath
 * strips the slug, so every listing page emits rel="canonical" pointing at the
 * SLUG-LESS /l/{id}. Verified live: three different slugs for the same id all
 * return 200 with the identical canonical.
 *
 * A sitemap entry is a strong canonical hint, so listing /l/{slug}/{id} here
 * spends crawl budget asking Google to fetch a URL that then tells it the
 * canonical is somewhere else. We advertise the canonical instead.
 *
 * Mirror table is refreshed by the listing-sync job; sitemap reads
 * the mirror to avoid burning Sharetribe API quota on every fetch.
 */
export const Route = createFileRoute("/sitemap-listings.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
        const from = (page - 1) * SITEMAP_PAGE_SIZE;
        const to = from + SITEMAP_PAGE_SIZE - 1;

        const { data, error } = await (supabaseAdmin as any)
          .from("synced_listings")
          .select("sharetribe_id, primary_image_url, prnm_primary_image_url, title, updated_at")
          .eq("state", "published")
          .eq("is_deleted", false)
          // slug is no longer part of the URL, so a row without one is still
          // perfectly indexable. Only the id is required.
          .not("sharetribe_id", "is", null)
          .order("updated_at", { ascending: false })
          .range(from, to);

        if (error) {
          console.error("[sitemap-listings] query error", error);
          return sitemapResponse(buildUrlsetXml([]));
        }

        const urls: SitemapUrl[] = (data ?? [])
          .filter((r: { sharetribe_id: string | null }) => !!r?.sharetribe_id)
          .map((r: any) => {
            const u: SitemapUrl = {
              loc: canonicalListingUrl(r.sharetribe_id, SITE_URL),
              lastmod: r.updated_at ?? null,
            };
            // Prefer the PRNM-hosted image: a sitemap image entry that 404s
            // after cutover is worse than none, and these outlive the crawl.
            const image = r.prnm_primary_image_url ?? r.primary_image_url;
            if (image) {
              u.images = [{ loc: image, title: r.title ?? undefined }];
            }
            return u;
          });

        return sitemapResponse(buildUrlsetXml(urls));
      },
    },
  },
});
