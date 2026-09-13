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
  { basePath: "/sitemap-pages-cities.xml", templateTypes: ["city_main"] },
  { basePath: "/sitemap-pages-host-acquisition.xml", templateTypes: ["host_acq_city", "host_acq_hub"] },
  { basePath: "/sitemap-pages-event-guides.xml", templateTypes: ["event_guide"] },
  { basePath: "/sitemap-pages-articles.xml", templateTypes: ["resource", "other", "pool_maintenance", "pool_maintenance_hub", "country_launch"] },
  { basePath: "/sitemap-pages-academy.xml", templateTypes: ["elearning"] },
  { basePath: "/sitemap-pages-advocacy.xml", templateTypes: ["host_advocacy_hub", "host_advocacy_state"] },
  { basePath: "/sitemap-pages-spanish.xml", templateTypes: ["spanish_host_acq", "spanish_resource", "host_acq_city_es"] },
  { basePath: "/sitemap-pages-swim-instructor.xml", templateTypes: ["swim_instructor_city", "swim_instructor_hub"] },
];

/**
 * The nine TEMPLATE_GROUPS counts, the blog count and the listing count used to
 * be awaited one after another: eleven `count: "exact"` scans over
 * content_pages / blog_posts / synced_listings, in series. Measured 2026-09-13,
 * /sitemap.xml took 6-12s TTFB to return 1,602 bytes while every sub-sitemap it
 * points at answered in 0.3-0.66s. They are independent, so they now run in one
 * wave and the whole index costs one round trip instead of eleven.
 *
 * A short in-process memo sits in front of that. The response already carries
 * `max-age=300, stale-while-revalidate=86400`, but nothing absorbed a cache
 * MISS, and a crawler hitting a cold index waited the full 8s.
 */
const INDEX_CACHE_MS = 300_000;
let indexCache: { at: number; xml: string } | null = null;

type CountResult = { count: number | null; error: unknown };

const countRows = async (
  table: string,
  apply: (q: any) => any,
): Promise<CountResult> => {
  try {
    const { count, error } = await apply(
      (supabaseAdmin as any).from(table).select("*", { count: "exact", head: true }),
    );
    return { count: count ?? null, error: error ?? null };
  } catch (err) {
    return { count: null, error: err };
  }
};

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        if (indexCache && Date.now() - indexCache.at < INDEX_CACHE_MS) {
          return sitemapResponse(indexCache.xml);
        }

        const entries: SitemapIndexEntry[] = [];

        // 1. Static sub-sitemap
        entries.push({ loc: `${SITE_URL}/sitemap-static.xml` });

        // 1b. Comparison pages (pillar + city variants)
        entries.push({ loc: `${SITE_URL}/sitemap-pages-comparisons.xml` });

        // Pool pros directory sitemap removed 2026-07-06: the /p/pool-pros tree
        // is noindexed (see commit b8672f38), so it must not be advertised in sitemaps.

        // ---- every count in one wave -------------------------------------
        const [groupCounts, blogCount, blogLatest, listingCount, listingLatest] =
          await Promise.all([
            Promise.all(
              TEMPLATE_GROUPS.map((group) =>
                countRows("content_pages", (q: any) =>
                  q
                    .in("template_type", group.templateTypes)
                    .eq("in_sitemap", true)
                    .eq("status", "published")
                    .is("redirect_to", null)
                    .not("slug", "is", null),
                ),
              ),
            ),
            countRows("blog_posts", (q: any) => q.eq("is_published", true)),
            (async () => {
              try {
                const { data } = await (supabaseAdmin as any)
                  .from("blog_posts")
                  .select("updated_at")
                  .eq("is_published", true)
                  .order("updated_at", { ascending: false })
                  .limit(1)
                  .maybeSingle();
                return data?.updated_at as string | undefined;
              } catch {
                return undefined;
              }
            })(),
            countRows("synced_listings", (q: any) =>
              q
                .eq("state", "published")
                .eq("is_deleted", false)
                .not("slug", "is", null)
                .not("sharetribe_id", "is", null),
            ),
            (async () => {
              try {
                const { data } = await (supabaseAdmin as any)
                  .from("synced_listings")
                  .select("updated_at")
                  .eq("state", "published")
                  .eq("is_deleted", false)
                  .not("slug", "is", null)
                  .not("sharetribe_id", "is", null)
                  .order("updated_at", { ascending: false })
                  .limit(1)
                  .maybeSingle();
                return data?.updated_at as string | undefined;
              } catch {
                return undefined;
              }
            })(),
          ]);

        // 2. Per-template-type content_pages sub-sitemaps (with auto-pagination)
        //
        // A count that ERRORS used to `continue`, which dropped the whole
        // sub-sitemap from the index — so an intermittent Supabase error made a
        // few thousand live pages invisible to Google until the next crawl that
        // happened to succeed. The logs show exactly that happening to
        // /sitemap-pages-event-guides.xml. A failed count is now a pagination
        // problem, not a visibility one: page 1 is always advertised, and only
        // the extra pages are lost.
        TEMPLATE_GROUPS.forEach((group, i) => {
          const { count, error } = groupCounts[i]!;
          if (error) {
            console.error(
              `[sitemap] count failed for ${group.basePath} — advertising page 1 only`,
              error,
            );
            entries.push({ loc: `${SITE_URL}${group.basePath}` });
            return;
          }
          if (!count) return;

          // No index-level lastmod: max(updated_at) was re-stamped monthly by
          // the related-slug refresh, so it advertised fake freshness. Each
          // URL carries its own content-based lastmod inside the sub-sitemap.
          const pageCount = Math.ceil(count / SITEMAP_PAGE_SIZE);
          for (let p = 1; p <= pageCount; p++) {
            entries.push({
              loc: p === 1 ? `${SITE_URL}${group.basePath}` : `${SITE_URL}${group.basePath}?page=${p}`,
            });
          }
        });

        // 2b. Blog posts (sourced from blog_posts, served at /p/{slug})
        if (blogCount.error) {
          console.error("[sitemap] blog_posts count error — advertising page 1 only", blogCount.error);
          entries.push({ loc: `${SITE_URL}/sitemap-pages-blog.xml` });
        } else if (blogCount.count && blogCount.count > 0) {
          const blogPageCount = Math.ceil(blogCount.count / SITEMAP_PAGE_SIZE);
          for (let p = 1; p <= blogPageCount; p++) {
            entries.push({
              loc: p === 1 ? `${SITE_URL}/sitemap-pages-blog.xml` : `${SITE_URL}/sitemap-pages-blog.xml?page=${p}`,
              lastmod: blogLatest,
            });
          }
        }

        // 2c. Courses sub-sitemap retired 2026-09-02: every /p/course/{slug} URL is a
        // nginx 301 to its /p/elearning-academy-* page, and all 193 targets are already
        // listed in sitemap-pages-academy.xml (crawl 2026-09-01). Advertising 193
        // redirects only cost crawl budget. The route still answers with an empty
        // urlset so the URL never 404s in Search Console.

        // 2d. Sharetribe listings (mirror in `synced_listings`, served at /l/{slug}/{id})
        if (listingCount.error) {
          console.error("[sitemap] synced_listings count error — advertising page 1 only", listingCount.error);
          entries.push({ loc: `${SITE_URL}/sitemap-listings.xml` });
        } else if (listingCount.count && listingCount.count > 0) {
          const listingPageCount = Math.ceil(listingCount.count / SITEMAP_PAGE_SIZE);
          for (let p = 1; p <= listingPageCount; p++) {
            entries.push({
              loc: p === 1 ? `${SITE_URL}/sitemap-listings.xml` : `${SITE_URL}/sitemap-listings.xml?page=${p}`,
              lastmod: listingLatest,
            });
          }
        }

        const xml = buildSitemapIndexXml(entries);
        indexCache = { at: Date.now(), xml };
        return sitemapResponse(xml);
      },
    },
  },
});
