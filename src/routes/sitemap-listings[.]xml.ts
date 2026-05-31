import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SITE_URL } from "@/lib/seo";
import {
  buildUrlsetXml,
  sitemapResponse,
  SITEMAP_PAGE_SIZE,
  type SitemapUrl,
} from "@/lib/sitemap";

/**
 * Sitemap of Sharetribe listings mirrored into `synced_listings`.
 * Listing pages live at /l/{slug}/{sharetribe_id} (owned by the
 * Sharetribe marketplace, proxied by nginx).
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
          .select("slug, sharetribe_id, primary_image_url, title, updated_at")
          .eq("state", "published")
          .eq("is_deleted", false)
          .not("slug", "is", null)
          .not("sharetribe_id", "is", null)
          .order("updated_at", { ascending: false })
          .range(from, to);

        if (error) {
          console.error("[sitemap-listings] query error", error);
          return sitemapResponse(buildUrlsetXml([]));
        }

        const urls: SitemapUrl[] = (data ?? [])
          .filter((r: { slug: string | null; sharetribe_id: string | null }) =>
            !!r?.slug && !!r?.sharetribe_id,
          )
          .map((r: any) => {
            const u: SitemapUrl = {
              loc: `${SITE_URL}/l/${r.slug}/${r.sharetribe_id}`,
              lastmod: r.updated_at ?? null,
            };
            if (r.primary_image_url) {
              u.images = [{ loc: r.primary_image_url, title: r.title ?? undefined }];
            }
            return u;
          });

        return sitemapResponse(buildUrlsetXml(urls));
      },
    },
  },
});
