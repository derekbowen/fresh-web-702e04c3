import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SITE_URL } from "@/lib/seo";
import {
  buildUrlsetXml,
  sitemapResponse,
  sitemapUnavailableResponse,
  type SitemapUrl,
} from "@/lib/sitemap";
import { guardedRead, isReadUnavailable } from "@/lib/failed-read";
import { listCategoryGeoCoverage } from "@/server/directory.functions";

export const Route = createFileRoute("/sitemap-directory.xml")({
  server: {
    handlers: {
      GET: async () => {
        const urls: SitemapUrl[] = [{ loc: `${SITE_URL}/p/pool-pros` }];

        // Every read here fails closed: a category, coverage or provider read
        // that failed used to be skipped, which answered 200 with whatever
        // subset happened to load. Now it is a 503.
        const cats = await guardedRead("sitemap service_categories", (signal) =>
          supabaseAdmin
            .from("service_categories")
            .select("slug, updated_at")
            .eq("is_published", true)
            .abortSignal(signal),
        );
        if (!cats.ok) return sitemapUnavailableResponse();

        for (const c of cats.data ?? []) {
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
            if (isReadUnavailable(e)) return sitemapUnavailableResponse();
          }
        }

        const provs = await guardedRead("sitemap providers", (signal) =>
          supabaseAdmin
            .from("providers")
            .select("slug, updated_at, hero_image_url, logo_url, name")
            .eq("is_published", true)
            .limit(5000)
            .abortSignal(signal),
        );
        if (!provs.ok) return sitemapUnavailableResponse();
        for (const p of provs.data ?? []) {
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
