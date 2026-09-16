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
 * Parallelising alone was NOT enough, and the first version of this comment
 * claimed otherwise. Measured after that change: warm 0.37-0.59s, but a cold
 * index still took 6.5s (verified by waiting out the memo TTL and re-fetching).
 * Individually every count answers in 69-747ms, so the cold cost is contention
 * between eleven concurrent PostgREST count scans, not their sum.
 *
 * So the memo is now stale-while-revalidate rather than a plain TTL: once an
 * index has been built, every later request is served from memory INSTANTLY and
 * a stale entry triggers a background rebuild instead of making the caller wait.
 * A build is also kicked off at module load, so the one genuinely cold request
 * per process happens before any crawler asks. If the very first request does
 * arrive before that finishes, it awaits the same in-flight promise rather than
 * starting a second pile of count queries.
 */
/** Younger than this: serve as-is, no rebuild. */
const INDEX_FRESH_MS = 300_000;
/** Older than FRESH but younger than this: serve stale, rebuild in background. */
const INDEX_STALE_MS = 24 * 60 * 60 * 1000;
let indexCache: { at: number; xml: string } | null = null;
let indexInFlight: Promise<string> | null = null;

type CountResult = { count: number | null; error: unknown };

const countOnce = async (table: string, apply: (q: any) => any): Promise<CountResult> => {
  try {
    const { count, error } = await apply(
      (supabaseAdmin as any).from(table).select("*", { count: "exact", head: true }),
    );
    return { count: count ?? null, error: error ?? null };
  } catch (err) {
    return { count: null, error: err };
  }
};

/**
 * One retry, because these counts fail intermittently and a failure is not
 * cosmetic: a missing count costs the index that group's ?page=N entries, and
 * before the page-1 fallback existed it cost the group entirely.
 */
const countRows = async (table: string, apply: (q: any) => any): Promise<CountResult> => {
  const first = await countOnce(table, apply);
  if (!first.error) return first;
  console.warn(`[sitemap] count on ${table} failed, retrying once`, first.error);
  return countOnce(table, apply);
};

/**
 * Last count that succeeded, per index entry, for the life of the process.
 *
 * Even with the retry, 6 of ~3,600 counts in the 28h after 2026-09-15 failed
 * twice in a row with an empty-message error (the same query answers in
 * 60-80ms when run by hand, so this is a transient client-side fetch failure,
 * not a slow scan). One of those was host-acquisition, whose pages 2-4 would
 * have vanished from the index for a refresh cycle. A count that is minutes
 * old is far closer to the truth than "page 1 only", so a failed count now
 * reuses the last good value and says so; the page-1 fallback remains only
 * for a key that has never succeeded in this process (first build after boot).
 */
const lastGoodCount = new Map<string, number>();

const countRemembered = async (
  key: string,
  table: string,
  apply: (q: any) => any,
): Promise<CountResult & { stale?: boolean }> => {
  const r = await countRows(table, apply);
  if (!r.error) {
    if (r.count !== null) lastGoodCount.set(key, r.count);
    return r;
  }
  const remembered = lastGoodCount.get(key);
  if (remembered === undefined) return r;
  console.warn(`[sitemap] count for ${key} failed twice — using last good count ${remembered}`, r.error);
  return { count: remembered, error: null, stale: true };
};

/**
 * Sequential, on purpose. Running all eleven counts through Promise.all made
 * the index FASTER and LESS RELIABLE: concurrent `count: "exact"` scans contend,
 * some return an empty-message error, and the index then shipped without those
 * groups' pagination — observed live as /sitemap.xml alternating between 1602
 * and 1257 bytes, the difference being host-acquisition pages 2-4.
 *
 * Since the index is now built behind a stale-while-revalidate cache and warmed
 * at boot, NOTHING waits on this function. Latency here is free; a wrong index
 * is not. So the counts go one at a time.
 */
const inSeries = async <T, R>(items: T[], fn: (item: T) => Promise<R>): Promise<R[]> => {
  const out: R[] = [];
  for (const item of items) out.push(await fn(item));
  return out;
};

async function buildIndexXml(): Promise<string> {
  const entries: SitemapIndexEntry[] = [];

  // 1. Static sub-sitemap
  entries.push({ loc: `${SITE_URL}/sitemap-static.xml` });

  // 1b. Comparison pages (pillar + city variants)
  entries.push({ loc: `${SITE_URL}/sitemap-pages-comparisons.xml` });

  // Pool pros directory sitemap removed 2026-07-06: the /p/pool-pros tree
  // is noindexed (see commit b8672f38), so it must not be advertised in sitemaps.

  // ---- every count, one at a time (see inSeries above) ----------------
  const groupCounts = await inSeries(TEMPLATE_GROUPS, (group) =>
    countRemembered(group.basePath, "content_pages", (q: any) =>
      q
        .in("template_type", group.templateTypes)
        .eq("in_sitemap", true)
        .eq("status", "published")
        .is("redirect_to", null)
        .not("slug", "is", null),
    ),
  );
  // These four are a different shape each (two counts, two lastmod lookups) and
  // hit three different tables, so they do not contend the way nine identical
  // content_pages scans did. They stay concurrent.
  const [blogCount, blogLatest, listingCount, listingLatest] =
    await Promise.all([
      countRemembered("/sitemap-pages-blog.xml", "blog_posts", (q: any) => q.eq("is_published", true)),
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
      countRemembered("/sitemap-listings.xml", "synced_listings", (q: any) =>
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
  // the extra pages are lost. Since 2026-09-16 even that only happens when
  // the process has never counted the group (see countRemembered).
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
  return xml;
}

/** One build at a time, shared by every caller that arrives while it runs. */
function rebuildIndex(): Promise<string> {
  if (!indexInFlight) {
    indexInFlight = buildIndexXml().finally(() => {
      indexInFlight = null;
    });
  }
  return indexInFlight;
}

// Warm at module load so the one unavoidable cold build does not land on a
// crawler. Errors are swallowed: a failed warm just means the first real
// request builds it, exactly as before.
void rebuildIndex().catch((err) => console.error("[sitemap] warm-up failed", err));

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const age = indexCache ? Date.now() - indexCache.at : Infinity;
        if (indexCache && age < INDEX_FRESH_MS) return sitemapResponse(indexCache.xml);
        if (indexCache && age < INDEX_STALE_MS) {
          // Stale but usable: answer now, refresh behind the response.
          void rebuildIndex().catch((err) => console.error("[sitemap] background rebuild failed", err));
          return sitemapResponse(indexCache.xml);
        }
        return sitemapResponse(await rebuildIndex());
      },
    },
  },
});
