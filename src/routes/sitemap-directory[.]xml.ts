import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SITE_URL } from "@/lib/seo";
import { buildSitemapXml, sitemapResponse, type SitemapUrl } from "@/lib/sitemap";

export const Route = createFileRoute("/sitemap-directory.xml")({
  server: {
    handlers: {
      GET: async () => {
        const urls: SitemapUrl[] = [
          { loc: `${SITE_URL}/directory`, changefreq: "weekly", priority: 0.8 },
        ];

        const { data: cats } = await supabaseAdmin
          .from("service_categories")
          .select("slug, updated_at")
          .eq("is_published", true);
        for (const c of cats ?? []) {
          urls.push({
            loc: `${SITE_URL}/directory/${c.slug}`,
            lastmod: c.updated_at,
            changefreq: "weekly",
            priority: 0.7,
          });
        }

        const { data: provs } = await supabaseAdmin
          .from("providers")
          .select("slug, updated_at")
          .eq("is_published", true)
          .limit(5000);
        for (const p of provs ?? []) {
          urls.push({
            loc: `${SITE_URL}/providers/${p.slug}`,
            lastmod: p.updated_at,
            changefreq: "monthly",
            priority: 0.6,
          });
        }

        return sitemapResponse(buildSitemapXml(urls));
      },
    },
  },
});
