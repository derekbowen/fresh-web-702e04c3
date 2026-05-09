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
 * Sitemap of published blog posts. Blog posts now live at /p/{slug}
 * (legacy /blog/{slug} URLs are retired). All <loc> entries use the
 * production canonical origin and the /p/ path.
 */
export const Route = createFileRoute("/sitemap-pages-blog.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
        const from = (page - 1) * SITEMAP_PAGE_SIZE;
        const to = from + SITEMAP_PAGE_SIZE - 1;

        const { data, error } = await (supabaseAdmin as any)
          .from("blog_posts")
          .select("slug, cover_image_url, title, updated_at, published_at")
          .eq("is_published", true)
          .order("updated_at", { ascending: false })
          .range(from, to);

        if (error) {
          console.error("[sitemap-pages-blog] query error", error);
          return sitemapResponse(buildUrlsetXml([]));
        }

        const urls: SitemapUrl[] = (data ?? [])
          .filter((r: { slug: string | null }) => !!r?.slug)
          .map((r: any) => {
            const u: SitemapUrl = {
              loc: `${SITE_URL}/p/${r.slug}`,
              lastmod: r.updated_at ?? r.published_at ?? null,
            };
            if (r.cover_image_url) {
              u.images = [{ loc: r.cover_image_url, title: r.title ?? undefined }];
            }
            return u;
          });

        return sitemapResponse(buildUrlsetXml(urls));
      },
    },
  },
});
