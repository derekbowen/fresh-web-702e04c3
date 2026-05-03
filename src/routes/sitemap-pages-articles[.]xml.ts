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
 * Resource articles sub-sitemap: /p/{slug} where template_type='resource_article'.
 * Other template_types get their own sub-sitemap files (host-acquisition, event-guides, etc.).
 *
 * Auto-paginates via ?page=N when row count exceeds SITEMAP_PAGE_SIZE.
 */

export const Route = createFileRoute("/sitemap-pages-articles.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
        const offset = (page - 1) * SITEMAP_PAGE_SIZE;

        const { data, error } = await (supabaseAdmin as any)
          .from("content_pages")
          .select("slug, updated_at, hero_image_url")
          .eq("template_type", "resource")
          .eq("in_sitemap", true)
          .eq("status", "published")
          .not("slug", "is", null)
          .order("slug")
          .range(offset, offset + SITEMAP_PAGE_SIZE - 1);

        if (error) {
          console.error("[sitemap-pages-articles] supabase error", error);
          return sitemapResponse(buildUrlsetXml([]));
        }

        const urls: SitemapUrl[] = ((data ?? []) as any[]).map((row) => {
          const sitemapUrl: SitemapUrl = {
            loc: `${SITE_URL}/p/${row.slug}`,
            lastmod: row.updated_at,
          };
          if (row.hero_image_url) {
            sitemapUrl.images = [{ loc: row.hero_image_url }];
          }
          return sitemapUrl;
        });

        return sitemapResponse(buildUrlsetXml(urls));
      },
    },
  },
});
