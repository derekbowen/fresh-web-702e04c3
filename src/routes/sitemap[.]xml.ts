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
 * passthrough listing sitemap. See migration-plan/04-sitemap-structure.md.
 *
 * Sharetribe owns /sitemap-recent-listings.xml — the reverse proxy passes that
 * URL through to Sharetribe origin. We just reference it from the parent index
 * so Google discovers it.
 */

interface TemplateGroup {
  templateType: string;
  basePath: string; // e.g. "/sitemap-pages-host-acquisition.xml"
}

const TEMPLATE_GROUPS: TemplateGroup[] = [
  { templateType: "money_page", basePath: "/sitemap-pages-money.xml" },
  { templateType: "city_main", basePath: "/sitemap-pages-cities.xml" },
  { templateType: "host_acquisition_city", basePath: "/sitemap-pages-host-acquisition.xml" },
  { templateType: "event_city_guide", basePath: "/sitemap-pages-event-guides.xml" },
  { templateType: "resource_article", basePath: "/sitemap-pages-articles.xml" },
  { templateType: "academy_article", basePath: "/sitemap-pages-academy.xml" },
  { templateType: "host_advocacy", basePath: "/sitemap-pages-advocacy.xml" },
  { templateType: "state_advocacy_guide", basePath: "/sitemap-pages-advocacy.xml" }, // co-located
  { templateType: "spanish_host_acquisition", basePath: "/sitemap-pages-spanish.xml" },
  { templateType: "spanish_resource", basePath: "/sitemap-pages-spanish.xml" }, // co-located
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapIndexEntry[] = [];

        // 1. Static sub-sitemap (always present; lastmod = build/deploy time)
        entries.push({
          loc: `${SITE_URL}/sitemap-static.xml`,
          lastmod: new Date(),
        });

        // 2. Per-template-type content_pages sub-sitemaps (with auto-pagination)
        const seen = new Set<string>();
        for (const group of TEMPLATE_GROUPS) {
          if (seen.has(group.basePath)) continue;
          // For co-located groups (advocacy, spanish), aggregate count across types
          const types = TEMPLATE_GROUPS
            .filter((g) => g.basePath === group.basePath)
            .map((g) => g.templateType);

          const { count, error } = await (supabaseAdmin as any)
            .from("content_pages")
            .select("*", { count: "exact", head: true })
            .eq("is_published", true)
            .in("template_type", types);

          if (error || !count) continue;

          // Latest lastmod for the group
          const { data: latest } = await (supabaseAdmin as any)
            .from("content_pages")
            .select("updated_at")
            .eq("is_published", true)
            .in("template_type", types)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          const pageCount = Math.ceil(count / SITEMAP_PAGE_SIZE);
          for (let p = 1; p <= pageCount; p++) {
            const loc =
              p === 1 ? `${SITE_URL}${group.basePath}` : `${SITE_URL}${group.basePath}?page=${p}`;
            entries.push({ loc, lastmod: latest?.updated_at });
          }
          seen.add(group.basePath);
        }

        // 3. Amenities (renamed from /category to match Sharetribe /amenity URLs)
        const { count: amenityCount } = await (supabaseAdmin as any)
          .from("amenities")
          .select("*", { count: "exact", head: true })
          .eq("is_published", true);
        if (amenityCount && amenityCount > 0) {
          const { data: latest } = await (supabaseAdmin as any)
            .from("amenities")
            .select("updated_at")
            .eq("is_published", true)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          entries.push({
            loc: `${SITE_URL}/sitemap-amenities.xml`,
            lastmod: latest?.updated_at,
          });
        }

        // 4. Public pools (sub-index — referenced even if its sub-sitemaps are still empty)
        entries.push({
          loc: `${SITE_URL}/sitemap-public-pools.xml`,
          lastmod: new Date(),
        });

        // 5. Host profiles (optional — /u/{uuid})
        const { count: hostCount } = await (supabaseAdmin as any)
          .from("host_profiles")
          .select("*", { count: "exact", head: true })
          .eq("is_published", true);
        if (hostCount && hostCount > 0) {
          entries.push({
            loc: `${SITE_URL}/sitemap-hosts.xml`,
            lastmod: new Date(),
          });
        }

        // 6. Sharetribe-served listing sub-sitemap — passthrough.
        // No lastmod here: Lovable can't reliably know when Sharetribe
        // last regenerated this. Google handles missing lastmod fine.
        entries.push({ loc: `${SITE_URL}/sitemap-recent-listings.xml` });

        return sitemapResponse(buildSitemapIndexXml(entries));
      },
    },
  },
});
