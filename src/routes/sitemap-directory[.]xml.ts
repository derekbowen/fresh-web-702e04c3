import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SITE_URL } from "@/lib/seo";
import { buildUrlsetXml, sitemapResponse, type SitemapUrl } from "@/lib/sitemap";
import { listCategoryGeoCoverage } from "@/server/directory.functions";

export const Route = createFileRoute("/sitemap-directory.xml")({
  server: {
    handlers: {
      GET: async () => {
        const urls: SitemapUrl[] = [{ loc: `${SITE_URL}/p/pool-pros` }];

        const { data: cats } = await supabaseAdmin
          .from("service_categories")
          .select("slug, updated_at")
          .eq("is_published", true);

        for (const c of cats ?? []) {
          urls.push({ loc: `${SITE_URL}/p/pool-pros/c/${c.slug}`, lastmod: c.updated_at });
          try {
            const { states } = await listCategoryGeoCoverage({ data: { slug: c.slug } });
            for (const st of states) {
              urls.push({ loc: `${SITE_URL}/p/pool-pros/c/${c.slug}/${st.code.toLowerCase()}` });
              for (const city of st.cities) {
                urls.push({
                  loc: `${SITE_URL}/p/pool-pros/c/${c.slug}/${st.code.toLowerCase()}/${city.slug}`,
                });
              }
            }
          } catch (e) {
            console.error("[sitemap-directory] coverage error", c.slug, e);
          }
        }

        const { data: provs } = await supabaseAdmin
          .from("providers")
          .select("slug, updated_at, hero_image_url, logo_url, name")
          .eq("is_published", true)
          .limit(5000);
        for (const p of provs ?? []) {
          const img = p.hero_image_url || p.logo_url;
          urls.push({
            loc: `${SITE_URL}/p/pool-pros/${p.slug}`,
            lastmod: p.updated_at,
            images: img ? [{ loc: img, title: p.name }] : undefined,
          });
        }

        return sitemapResponse(buildUrlsetXml(urls));
      },
    },
  },
});
