import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SITE_URL } from "@/lib/seo";
import {
  buildSitemapIndexXml,
  sitemapResponse,
  SITEMAP_PAGE_SIZE,
  type SitemapIndexEntry,
} from "@/lib/sitemap";

/**
 * Parent sitemap index. Lists Lovable-served sub-sitemaps + the Sharetribe
 * passthrough listing sitemap.
 *
 * Eligibility for content_pages: `in_sitemap = true` AND `slug IS NOT NULL`.
 * We do NOT filter on `status` here because the importer leaves rows as
 * 'pending' until they're scraped, but `in_sitemap=true` is the canonical
 * "this URL should be advertised" flag.
 */

interface TemplateGroup {
  basePath: string;
  templateTypes: string[];
}

const TEMPLATE_GROUPS: TemplateGroup[] = [
  { basePath: "/sitemap-pages-money.xml", templateTypes: ["money_page"] },
  { basePath: "/sitemap-pages-cities.xml", templateTypes: ["city_main", "public_pool_city", "public_pool_state"] },
  { basePath: "/sitemap-pages-host-acquisition.xml", templateTypes: ["host_acq_city", "host_acq_hub"] },
  { basePath: "/sitemap-pages-event-guides.xml", templateTypes: ["event_guide"] },
  { basePath: "/sitemap-pages-articles.xml", templateTypes: ["resource", "other"] },
  { basePath: "/sitemap-pages-academy.xml", templateTypes: ["elearning"] },
  { basePath: "/sitemap-pages-advocacy.xml", templateTypes: ["host_advocacy_hub", "host_advocacy_state"] },
  { basePath: "/sitemap-pages-spanish.xml", templateTypes: ["spanish_host_acq", "spanish_resource"] },
  { basePath: "/sitemap-pages-swim-instructor.xml", templateTypes: ["swim_instructor_city", "swim_instructor_hub"] },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapIndexEntry[] = [];

        // 1. Static sub-sitemap
        entries.push({
          loc: `${SITE_URL}/sitemap-static.xml`,
          lastmod: new Date(),
        });

        // 2. Per-template-type content_pages sub-sitemaps (with auto-pagination)
        for (const group of TEMPLATE_GROUPS) {
          const { count, error } = await (supabaseAdmin as any)
            .from("content_pages")
            .select("*", { count: "exact", head: true })
            .in("template_type", group.templateTypes)
            .eq("in_sitemap", true)
            .not("slug", "is", null);

          if (error) {
            console.error(`[sitemap] count error for ${group.basePath}`, error);
            continue;
          }
          if (!count) continue;

          const { data: latest } = await (supabaseAdmin as any)
            .from("content_pages")
            .select("updated_at")
            .in("template_type", group.templateTypes)
            .eq("in_sitemap", true)
            .not("slug", "is", null)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          const pageCount = Math.ceil(count / SITEMAP_PAGE_SIZE);
          for (let p = 1; p <= pageCount; p++) {
            const loc =
              p === 1 ? `${SITE_URL}${group.basePath}` : `${SITE_URL}${group.basePath}?page=${p}`;
            entries.push({ loc, lastmod: latest?.updated_at });
          }
        }

        // 3. Sharetribe-served listing sub-sitemap — passthrough
        entries.push({ loc: `${SITE_URL}/sitemap-recent-listings.xml` });

        return sitemapResponse(buildSitemapIndexXml(entries));
      },
    },
  },
});
