import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SITE_URL } from "@/lib/seo";
import { pagedSitemapResponse, sitemapUnavailableResponse } from "@/lib/sitemap";
import { loadBlogEntries } from "@/lib/sitemap-sources";

/**
 * Sitemap of published blog posts that /p/{slug} actually serves from
 * blog_posts. Legacy /blog/{slug} URLs are retired; every <loc> is on the
 * production origin under /p/.
 *
 * A post whose slug is also a content_pages row (or a legacy_slugs alias of
 * one) is NOT listed here: the dispatcher serves the content row (or 301s to
 * it) first, so that URL belongs to the content row's sitemap. On 2026-11-15
 * that was 91 posts (listed twice, in articles and here) plus
 * opening-pool-for-summer, which 301s to /p/opening-a-pool.
 */
export const Route = createFileRoute("/sitemap-pages-blog.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const list = await loadBlogEntries(supabaseAdmin, SITE_URL);
        // Failed read: 503, not a 200 with an empty <urlset>.
        if (!list.ok) return sitemapUnavailableResponse();
        return pagedSitemapResponse(request, list.data);
      },
    },
  },
});
