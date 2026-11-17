import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SITE_URL } from "@/lib/seo";
import {
  buildSitemapIndexXml,
  sitemapResponse,
  sitemapUnavailableResponse,
  SITEMAP_PAGE_SIZE,
  type SitemapIndexEntry,
} from "@/lib/sitemap";
import { ReadUnavailableError } from "@/lib/failed-read";
import { CONTENT_SITEMAP_GROUPS } from "@/lib/sitemap-groups";
import { pageCount } from "@/lib/sitemap-rules";
import {
  latestLastmod,
  loadBlogEntries,
  loadContentGroupEntries,
  loadListingEntries,
  type ListOutcome,
  type SitemapEntry,
} from "@/lib/sitemap-sources";

/**
 * Parent sitemap index. Lists the fresh-web sub-sitemaps; WEST nginx appends
 * /public-pools.xml (served by pp-ssr) to the copy www answers.
 *
 * Every child it lists exists and has entries: each database-backed child is
 * counted by loading the same final list the child emits (every exclusion rule
 * in src/lib/sitemap-rules.ts applied), and a list with no entries is not
 * listed. `sitemap-static.xml` and `sitemap-pages-comparisons.xml` are always
 * non-empty (constant paths, three comparison pillars).
 *
 * Not listed, on purpose: sitemap-pages-courses.xml (retired 2026-09-02, every
 * URL was a 301), sitemap-directory.xml (410: the pool-pros tree is noindex),
 * sitemap-country.xml (ccTLD hosts only, declared by their robots.txt), and the
 * 301 aliases (sitemap-hub, sitemap-index, sitemap-default, sitemap-recent-pages,
 * pools-directory-sitemap, sm-74buq58v*).
 */

/**
 * The content_pages groups, as the CLAUDE.md sitemap note calls them. Defined
 * once in src/lib/sitemap-groups.ts and read by every sub-sitemap route too.
 */
const TEMPLATE_GROUPS = CONTENT_SITEMAP_GROUPS;

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
 *
 * Since 2026-11 a "count" is no longer a `count: "exact"` head scan: it is the
 * length of the list the child itself emits (paged reads, every exclusion rule
 * applied), so the index can never advertise a ?page=N that has no entries or
 * miss one that has. Each content group costs one small redirect-row read plus
 * ceil(rows / 1000) + 1 windows.
 */
/** Younger than this: serve as-is, no rebuild. */
const INDEX_FRESH_MS = 300_000;
/** Older than FRESH but younger than this: serve stale, rebuild in background. */
const INDEX_STALE_MS = 24 * 60 * 60 * 1000;
let indexCache: { at: number; xml: string } | null = null;
let indexInFlight: Promise<string> | null = null;

/**
 * One child's count: the length of the list it emits (and its newest lastmod).
 * `timedOut` is kept separately because a timeout is not retried.
 */
type CountResult = {
  count: number | null;
  latest?: string;
  error: unknown;
  timedOut?: boolean;
};

const countOnce = async (load: () => Promise<ListOutcome<SitemapEntry>>): Promise<CountResult> => {
  let list: ListOutcome<SitemapEntry>;
  try {
    list = await load();
  } catch (err) {
    return { count: null, error: err };
  }
  if (!list.ok) return { count: null, error: list.error, timedOut: list.reason === "timeout" };
  return { count: list.data.length, latest: latestLastmod(list.data), error: null };
};

/**
 * One retry, because these reads fail intermittently and a failure is not
 * cosmetic: without a count the index cannot list that group's ?page=N entries.
 */
const countRows = async (key: string, load: () => Promise<ListOutcome<SitemapEntry>>): Promise<CountResult> => {
  const first = await countOnce(load);
  if (!first.error) return first;
  // A read that TIMED OUT is not the intermittent fast failure the retry is
  // for; asking a database that is not answering a second time only doubles
  // the wait.
  if (first.timedOut) return first;
  console.warn(`[sitemap] count for ${key} failed, retrying once`, first.error);
  return countOnce(load);
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
 * reuses the last good value and says so. A key that has never succeeded in
 * this process (first build after boot) has nothing to reuse: that build fails
 * and /sitemap.xml answers 503 until a count succeeds (see buildIndexXml).
 */
const lastGood = new Map<string, { count: number; latest?: string }>();

const countRemembered = async (
  key: string,
  load: () => Promise<ListOutcome<SitemapEntry>>,
): Promise<CountResult & { stale?: boolean }> => {
  const r = await countRows(key, load);
  if (!r.error) {
    if (r.count !== null) lastGood.set(key, { count: r.count, latest: r.latest });
    return r;
  }
  // Timed out: the database is not answering. Do not paper over it per group
  // (a dozen reads in a row, each waiting out the timeout); fail the build.
  if (r.timedOut) return r;
  const remembered = lastGood.get(key);
  if (remembered === undefined) return r;
  console.warn(`[sitemap] count for ${key} failed twice — using last good count ${remembered.count}`, r.error);
  return { count: remembered.count, latest: remembered.latest, error: null, stale: true };
};

/**
 * Sequential, on purpose. Running every count through Promise.all made the
 * index FASTER and LESS RELIABLE: concurrent scans contend, some return an
 * empty-message error, and the index then shipped without those groups'
 * pagination — observed live as /sitemap.xml alternating between 1602 and
 * 1257 bytes, the difference being host-acquisition pages 2-4.
 *
 * Since the index is built behind a stale-while-revalidate cache and warmed at
 * boot, NOTHING waits on this function. Latency here is free; a wrong index is
 * not. So the loads go one at a time.
 */
const inSeries = async <T, R>(items: readonly T[], fn: (item: T) => Promise<R>): Promise<R[]> => {
  const out: R[] = [];
  for (const item of items) out.push(await fn(item));
  return out;
};

/** `basePath`, `basePath?page=2`, ... for a list of `count` entries. */
function pagedEntries(basePath: string, count: number, lastmod?: string): SitemapIndexEntry[] {
  const out: SitemapIndexEntry[] = [];
  for (let p = 1; p <= pageCount(count, SITEMAP_PAGE_SIZE); p++) {
    out.push({
      loc: p === 1 ? `${SITE_URL}${basePath}` : `${SITE_URL}${basePath}?page=${p}`,
      ...(lastmod ? { lastmod } : {}),
    });
  }
  return out;
}

async function buildIndexXml(): Promise<string> {
  const entries: SitemapIndexEntry[] = [];

  // 1. Static sub-sitemap (constant paths + state hubs; never empty)
  entries.push({ loc: `${SITE_URL}/sitemap-static.xml` });

  // 1b. Comparison pages (three pillars + city variants; never empty, one file)
  entries.push({ loc: `${SITE_URL}/sitemap-pages-comparisons.xml` });

  // Pool pros directory sitemap removed 2026-07-06 and answering 410 since
  // 2026-11: the /p/pool-pros tree is noindexed (see commit b8672f38), so it
  // must not be advertised in sitemaps.

  // Fail closed, and fail on the first one. A count that failed and has no
  // remembered value (see countRemembered) means the index cannot be built
  // correctly. It used to be published anyway with "page 1 only" for that
  // group: a 200 index missing ?page=2..N, memoised for five minutes here and
  // cached downstream. Now the build throws, nothing is memoised, and GET
  // answers 503 (or keeps serving the last complete index while that is
  // younger than a day).
  const requireCount = <T extends CountResult>(basePath: string, r: T): T => {
    if (r.error) {
      console.error(`[sitemap] index not built: count failed for ${basePath}`, r.error);
      throw new ReadUnavailableError("sitemap index counts");
    }
    return r;
  };

  const db = supabaseAdmin as any;
  const groupCounts = await inSeries(TEMPLATE_GROUPS, async (group) =>
    requireCount(
      group.basePath,
      await countRemembered(group.basePath, () => loadContentGroupEntries(group, db, SITE_URL)),
    ),
  );
  const blogCount = requireCount(
    "/sitemap-pages-blog.xml",
    await countRemembered("/sitemap-pages-blog.xml", () => loadBlogEntries(db, SITE_URL)),
  );
  const listingCount = requireCount(
    "/sitemap-listings.xml",
    await countRemembered("/sitemap-listings.xml", () => loadListingEntries(db, SITE_URL)),
  );

  // 2. Per-template-type content_pages sub-sitemaps (with auto-pagination).
  // A group with no entries (money, cities today) is not listed.
  // No index-level lastmod: max(updated_at) was re-stamped monthly by the
  // related-slug refresh, so it advertised fake freshness. Each URL carries
  // its own content-based lastmod inside the sub-sitemap.
  TEMPLATE_GROUPS.forEach((group, i) => {
    entries.push(...pagedEntries(group.basePath, groupCounts[i]!.count ?? 0));
  });

  // 2b. Blog posts (sourced from blog_posts, served at /p/{slug})
  entries.push(...pagedEntries("/sitemap-pages-blog.xml", blogCount.count ?? 0, blogCount.latest));

  // 2c. Courses sub-sitemap retired 2026-09-02: every /p/course/{slug} URL is a
  // nginx 301 to its /p/elearning-academy-* page, and those pages are listed in
  // sitemap-pages-academy.xml. The route still answers with an empty urlset so
  // the URL never 404s in Search Console.

  // 2d. Sharetribe listings (mirror in `synced_listings`, served at /l/{slug}/{id})
  entries.push(...pagedEntries("/sitemap-listings.xml", listingCount.count ?? 0, listingCount.latest));

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
        // No usable index in memory: build one now. If the counts cannot be
        // read, say so (503, no-store) rather than publish a partial index.
        try {
          return sitemapResponse(await rebuildIndex());
        } catch (err) {
          console.error("[sitemap] index unavailable", err);
          return sitemapUnavailableResponse();
        }
      },
    },
  },
});
