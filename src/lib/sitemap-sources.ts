/**
 * Every database-backed sitemap list, read in full and filtered by the rules in
 * sitemap-rules.ts. Each loader returns the FINAL entry list (after every
 * exclusion), so the sitemap index counts exactly what the sub-sitemaps emit:
 * a group's ?page=N entries can no longer be computed from a raw row count that
 * includes rows the sub-sitemap then drops.
 *
 * Paging. PostgREST answers at most `max-rows` rows (1,000 on this project) per
 * request whatever `.limit()` asks for, so `.limit(5000)` silently stops at
 * 1,000. readAllRows walks `.range()` windows, advancing by the number of rows
 * actually returned and stopping on an empty window, so a server cap lower than
 * the window size still cannot truncate the list. Every window is a guarded
 * read; one failed window fails the whole list (the caller answers 503).
 *
 * Pure: relative imports only.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { guardedRead, type ReadOutcome } from "./failed-read.ts";
import {
  KNOWN_PREFIXES,
  pgTextArrayLiteral,
  resolveContentPageLookup,
  type BlogPostRow,
  type ContentPageLookupReads,
} from "./content-page-lookup.ts";
import { groupOrFilter, type ContentSitemapGroup } from "./sitemap-groups.ts";
import {
  blogPostExclusion,
  canonicalIsElsewhere,
  contentRowExclusion,
  contentRowLoc,
  dedupeByLoc,
  listingExclusion,
  redirectShadowedSlugs,
} from "./sitemap-rules.ts";
import { countryForSlug, slugOrFilter, type CountrySite } from "./country-sites.ts";
import { isComparisonDuplicatePath } from "./comparison-duplicates.ts";

/** Rows asked for per request. Equal to the PostgREST cap; see the header. */
export const READ_WINDOW = 1000;
/** A list longer than this is a runaway query, not a sitemap. */
const MAX_ROWS = 200_000;

export interface SitemapEntry {
  loc: string;
  lastmod?: string | Date | null;
  images?: Array<{ loc: string; title?: string; caption?: string }>;
}

type Failed = { ok: false; reason: "error" | "thrown" | "timeout"; error: unknown };
export type ListOutcome<T> = { ok: true; data: T[] } | Failed;

/**
 * All rows of a query, window by window. `build(from, to, signal)` must return
 * the query with `.range(from, to)` and `.abortSignal(signal)` applied, and a
 * stable ORDER BY that ends in a unique column so windows do not overlap.
 */
export async function readAllRows<T>(
  label: string,
  build: (
    from: number,
    to: number,
    signal: AbortSignal,
  ) => PromiseLike<{ data?: unknown; error?: unknown }>,
  options?: { window?: number },
): Promise<ListOutcome<T>> {
  const window = options?.window ?? READ_WINDOW;
  const out: T[] = [];
  for (let from = 0; from < MAX_ROWS; ) {
    const readWindow = (attempt: string): Promise<ReadOutcome<T[]>> =>
      guardedRead<T[]>(
        `${label} [${from}]${attempt}`,
        (signal) =>
          build(from, from + window - 1, signal) as PromiseLike<{
            data?: T[] | null;
            error?: unknown;
          }>,
      );
    let read = await readWindow("");
    // One immediate retry for a returned or thrown error: a large group is
    // several windows (host-acquisition: 5, plus the redirect-row lookup), so
    // a single transient failure (the index has seen empty-message errors
    // that clear on retry) would otherwise turn the whole sitemap into a 503.
    // A timeout is not retried: that would double the time to the 503.
    if (!read.ok && read.reason !== "timeout") read = await readWindow(" (retry)");
    if (!read.ok) return read;
    const rows = read.data ?? [];
    if (rows.length === 0) return { ok: true, data: out };
    out.push(...rows);
    from += rows.length;
  }
  return { ok: false, reason: "error", error: new Error(`${label}: more than ${MAX_ROWS} rows`) };
}

// ───────────────────────────── content_pages ────────────────────────────────

interface ContentRow {
  id?: string;
  slug: string | null;
  url_path: string | null;
  canonical_override?: string | null;
  content_refreshed_at?: string | null;
  created_at?: string | null;
  hero_image_url?: string | null;
  body_markdown?: string | null;
}

/** status='redirect' rows that shadow a published row with the same slug. */
export async function loadRedirectShadowedSlugs(
  supabase: SupabaseClient,
): Promise<ListOutcome<string>> {
  const read = await readAllRows<{
    slug: string | null;
    url_path: string | null;
    redirect_to: string | null;
  }>("sitemap content_pages redirect rows", (from, to, signal) =>
    supabase
      .from("content_pages")
      .select("id, slug, url_path, redirect_to")
      .eq("status", "redirect")
      .not("redirect_to", "is", null)
      .not("slug", "is", null)
      .order("id")
      .range(from, to)
      .abortSignal(signal),
  );
  if (!read.ok) return read;
  return {
    ok: true,
    data: [...redirectShadowedSlugs(read.data.map((r) => ({ ...r, status: "redirect" })))],
  };
}

/**
 * Every URL a content group's sub-sitemap lists, in emission order (slug, id).
 * Base filter (database): in_sitemap, status published, no redirect_to, slug
 * present, the group's template types (+ reviewed untyped slugs). Then every
 * rule in contentRowExclusion.
 */
export async function loadContentGroupEntries(
  group: ContentSitemapGroup,
  supabase: SupabaseClient,
  siteUrl: string,
): Promise<ListOutcome<SitemapEntry>> {
  const minBodyChars = group.minBodyChars ?? 0;
  // lastmod comes from content_refreshed_at (set only when the body is
  // actually regenerated), falling back to created_at. updated_at is bumped
  // by any column write — the monthly related-slug refresh re-stamped 4,452
  // rows on the 1st of every month and advertised it to Google as fresh
  // content (audit 2026-09-01).
  const cols =
    "id, slug, url_path, canonical_override, content_refreshed_at, created_at, hero_image_url" +
    (minBodyChars > 0 ? ", body_markdown" : "");

  const shadowed = await loadRedirectShadowedSlugs(supabase);
  if (!shadowed.ok) return shadowed;

  const rows = await readAllRows<ContentRow>(
    `sitemap content_pages ${group.basePath}`,
    (from, to, signal) =>
      supabase
        .from("content_pages")
        .select(cols)
        .or(groupOrFilter(group))
        .eq("in_sitemap", true)
        .eq("status", "published")
        // Rows that 301 elsewhere must never be advertised (2026-09-01 crawl: 14).
        .is("redirect_to", null)
        .not("slug", "is", null)
        .order("slug")
        .order("id")
        .range(from, to)
        .abortSignal(signal),
  );
  if (!rows.ok) return rows;

  const ctx = { siteUrl, redirectShadowedSlugs: new Set(shadowed.data), minBodyChars };
  const entries: SitemapEntry[] = [];
  for (const row of rows.data) {
    if (contentRowExclusion(row, ctx)) continue;
    const entry: SitemapEntry = {
      loc: contentRowLoc(row, siteUrl)!,
      lastmod: row.content_refreshed_at ?? row.created_at ?? null,
    };
    if (row.hero_image_url) entry.images = [{ loc: row.hero_image_url }];
    entries.push(entry);
  }
  return { ok: true, data: dedupeByLoc(entries) };
}

// ───────────────────────────── country pages ────────────────────────────────

/**
 * sitemap-country.xml for one country: exactly the /p/<slug> pages the country
 * mapping assigns to it (src/lib/country-sites.ts) that may be listed at all.
 *   - content_pages rows: published, in_sitemap, no redirect_to, and every
 *     content rule (servable and well-formed slug, plain /p/<slug>, not a
 *     dedicated route, not shadowed by a redirect row, canonical equal to its
 *     own URL);
 *   - published blog_posts that /p/<slug> serves as the blog post (the same
 *     rule as the blog sitemap): the mapping is by path, so a blog post whose
 *     slug ends in a country suffix canonicalises to the ccTLD and belongs
 *     here, not in sitemap-pages-blog.xml. None existed in the 2026-11-14
 *     crawl; this keeps the two lists complementary if one is published.
 * <loc> is on the country's canonical host. Paged and fail closed like every
 * other list. The old route read `ilike` patterns with a flat `.limit(5000)`
 * and no status / redirect filter, and took lastmod from updated_at (else the
 * request time); see the lastmod note below.
 */
export async function loadCountryEntries(
  site: CountrySite,
  supabase: SupabaseClient,
): Promise<ListOutcome<SitemapEntry>> {
  const shadowed = await loadRedirectShadowedSlugs(supabase);
  if (!shadowed.ok) return shadowed;
  const rows = await readAllRows<ContentRow>(`sitemap country ${site.code}`, (from, to, signal) =>
    supabase
      .from("content_pages")
      .select("id, slug, url_path, canonical_override, content_refreshed_at, created_at")
      .or(slugOrFilter(site))
      .eq("in_sitemap", true)
      .eq("status", "published")
      .is("redirect_to", null)
      .not("slug", "is", null)
      .order("slug")
      .order("id")
      .range(from, to)
      .abortSignal(signal),
  );
  if (!rows.ok) return rows;
  const siteUrl = `https://${site.canonicalHost}`;
  const ctx = { siteUrl, redirectShadowedSlugs: new Set(shadowed.data) };
  const entries: SitemapEntry[] = [];
  for (const row of rows.data) {
    if (countryForSlug(row.slug) !== site) continue;
    if (contentRowExclusion(row, ctx)) continue;
    entries.push({
      loc: contentRowLoc(row, siteUrl)!,
      // Same lastmod rule as the www content sitemaps (step 03): updated_at is
      // bumped by any column write, so it is not a content date. Deliberate
      // change from the old route: on 2026-11-16 its live <lastmod>s were
      // updated_at bulk-write times (46 of 59 URLs share 2026-08-06T08:32:45Z).
      lastmod: row.content_refreshed_at ?? row.created_at ?? null,
    });
  }
  const blogs = await loadServedBlogPosts(supabase, `sitemap country ${site.code} blog_posts`, slugOrFilter(site));
  if (!blogs.ok) return blogs;
  for (const r of blogs.data) {
    if (countryForSlug(r.slug) !== site) continue;
    entries.push({ loc: `${siteUrl}/p/${r.slug}`, lastmod: r.updated_at ?? r.published_at ?? null });
  }
  return { ok: true, data: dedupeByLoc(entries) };
}

// ───────────────────────────── blog_posts ───────────────────────────────────

const CONTENT_LOOKUP_STATUSES = ["published", "redirect"];
/** Slugs per `in.(...)` / `ov.{...}` request: 40 quoted slugs of up to ~100 characters keep each URL near 5 KB. */
const SLUG_CHUNK = 40;

/** The content_pages columns the dispatcher's decision looks at. */
interface LookupRow {
  id: string;
  slug: string | null;
  url_path: string | null;
  status: string | null;
  redirect_to: string | null;
  priority: number | null;
}

/** What the dispatcher would read for a set of slugs, fetched in batches. */
export interface DispatcherSnapshot {
  /** published|redirect rows by slug. */
  rowsBySlug: Map<string, LookupRow[]>;
  /** published|redirect rows by each of their legacy_slugs. */
  aliasesBySlug: Map<string, Array<{ slug: string | null }>>;
  /** published cities by slug (only those asked for by the bare-city fallback). */
  citiesBySlug: Map<string, { slug: string; state_code: string }>;
  /** published|redirect content slugs among the bare-city fallback candidates. */
  existingCandidates: Set<string>;
}

/** The bare-city slug the dispatcher's fallback would look up, or null. Mirrors content-page-lookup.ts. */
function bareCitySlug(slug: string): string | null {
  const prefix = KNOWN_PREFIXES.find((p) => slug.startsWith(p));
  if (!prefix) return null;
  const city = slug.slice(prefix.length);
  return city.length > 0 && !/-[a-z]{2}$/.test(city) ? city : null;
}

const BLOG_MARKER = "__sitemap_blog_post__";

/**
 * True when /p/<slug> is answered by the blog post itself. Runs the
 * dispatcher's own decision (resolveContentPageLookup) against `snapshot`,
 * with a stand-in blog row for the last step, so every rule it applies (an
 * exact redirect row, any published row, a legacy_slugs alias, the bare-city
 * 301) is applied here the same way. Pure.
 */
export async function blogPostIsServedAsBlog(
  slug: string,
  snapshot: DispatcherSnapshot,
): Promise<boolean> {
  const ok = <T>(data: T) => Promise.resolve({ ok: true as const, data, count: null });
  const reads: ContentPageLookupReads = {
    // Same order and cap as the server read: priority desc, max 5.
    pagesBySlug: (s) =>
      ok(
        [...(snapshot.rowsBySlug.get(s) ?? [])]
          .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || a.id.localeCompare(b.id))
          .slice(0, 5) as never,
      ),
    // The server read takes any one row (limit 1, no order). Prefer one that
    // points elsewhere, so the URL is never advertised as the blog post when
    // the dispatcher may 301 it.
    aliasForSlug: (s) => {
      const list = snapshot.aliasesBySlug.get(s) ?? [];
      const elsewhere = list.find((r) => r.slug && r.slug !== s);
      return ok(elsewhere ? [elsewhere] : list.slice(0, 1));
    },
    cityBySlug: (c) => {
      const city = snapshot.citiesBySlug.get(c);
      return ok(city ? [city] : []);
    },
    pageSlugExists: (s) => ok(snapshot.existingCandidates.has(s) ? [{ slug: s }] : []),
    blogPostBySlug: (s) => ok([{ id: BLOG_MARKER, slug: s } as unknown as BlogPostRow]),
  };
  const result = await resolveContentPageLookup(slug, reads);
  return result.kind === "found" && result.page.id === BLOG_MARKER;
}

/**
 * Which of `slugs` the /p/ dispatcher does NOT answer with the blog post:
 * those it serves from a content row, 301s through a redirect row, a
 * legacy_slugs alias or the bare-city fallback. Reads in chunks of SLUG_CHUNK:
 * own rows, alias rows, and (only for slugs the bare-city fallback applies to)
 * the cities and state-suffixed candidates. Any failed read fails the list.
 */
export async function loadContentServedSlugs(
  supabase: SupabaseClient,
  slugs: string[],
): Promise<ListOutcome<string>> {
  const snapshot: DispatcherSnapshot = {
    rowsBySlug: new Map(),
    aliasesBySlug: new Map(),
    citiesBySlug: new Map(),
    existingCandidates: new Set(),
  };
  const push = <K, V>(m: Map<K, V[]>, k: K, v: V) => {
    const list = m.get(k);
    if (list) list.push(v);
    else m.set(k, [v]);
  };
  const wanted = new Set(slugs);

  for (let i = 0; i < slugs.length; i += SLUG_CHUNK) {
    const chunk = slugs.slice(i, i + SLUG_CHUNK);
    const own = await readAllRows<LookupRow>("sitemap blog shadow rows", (from, to, signal) =>
      supabase
        .from("content_pages")
        .select("id, slug, url_path, status, redirect_to, priority")
        .in("slug", chunk)
        .in("status", CONTENT_LOOKUP_STATUSES)
        .order("id")
        .range(from, to)
        .abortSignal(signal),
    );
    if (!own.ok) return own;
    for (const r of own.data) if (r.slug) push(snapshot.rowsBySlug, r.slug, r);

    const aliases = await readAllRows<{ slug: string | null; legacy_slugs: string[] | null }>(
      "sitemap blog shadow aliases",
      (from, to, signal) =>
        supabase
          .from("content_pages")
          .select("id, slug, legacy_slugs")
          // Quoted literal, as in content-page-lookup.ts: a slug is data, never array syntax.
          .overlaps("legacy_slugs", pgTextArrayLiteral(chunk))
          .in("status", CONTENT_LOOKUP_STATUSES)
          .order("id")
          .range(from, to)
          .abortSignal(signal),
    );
    if (!aliases.ok) return aliases;
    for (const r of aliases.data)
      for (const s of r.legacy_slugs ?? [])
        if (wanted.has(s)) push(snapshot.aliasesBySlug, s, { slug: r.slug });
  }

  // Bare-city fallback: only for slugs that reach it (no content row, no alias).
  const citySlugs = [
    ...new Set(
      slugs
        .filter((s) => !snapshot.rowsBySlug.has(s) && !snapshot.aliasesBySlug.has(s))
        .map(bareCitySlug)
        .filter((c): c is string => !!c),
    ),
  ];
  for (let i = 0; i < citySlugs.length; i += SLUG_CHUNK) {
    const chunk = citySlugs.slice(i, i + SLUG_CHUNK);
    const cities = await readAllRows<{ id?: string; slug: string; state_code: string }>(
      "sitemap blog shadow cities",
      (from, to, signal) =>
        supabase
          .from("cities")
          .select("id, slug, state_code")
          .in("slug", chunk)
          .eq("is_published", true)
          .order("id")
          .range(from, to)
          .abortSignal(signal),
    );
    if (!cities.ok) return cities;
    for (const c of cities.data)
      if (c.slug && !snapshot.citiesBySlug.has(c.slug))
        snapshot.citiesBySlug.set(c.slug, { slug: c.slug, state_code: c.state_code });
  }
  const candidates: string[] = [];
  for (const s of slugs) {
    const city = bareCitySlug(s);
    const row = city ? snapshot.citiesBySlug.get(city) : undefined;
    if (!city || !row?.state_code) continue;
    const prefix = KNOWN_PREFIXES.find((p) => s.startsWith(p))!;
    candidates.push(`${prefix}${city}-${row.state_code.toLowerCase()}`);
  }
  for (let i = 0; i < candidates.length; i += SLUG_CHUNK) {
    const chunk = candidates.slice(i, i + SLUG_CHUNK);
    const found = await readAllRows<{ slug: string | null }>(
      "sitemap blog shadow city candidates",
      (from, to, signal) =>
        supabase
          .from("content_pages")
          .select("id, slug")
          .in("slug", chunk)
          .in("status", CONTENT_LOOKUP_STATUSES)
          .order("id")
          .range(from, to)
          .abortSignal(signal),
    );
    if (!found.ok) return found;
    for (const r of found.data) if (r.slug) snapshot.existingCandidates.add(r.slug);
  }

  const served: string[] = [];
  for (const s of slugs) if (!(await blogPostIsServedAsBlog(s, snapshot))) served.push(s);
  return { ok: true, data: served };
}

interface BlogRow {
  slug: string | null;
  cover_image_url?: string | null;
  title?: string | null;
  updated_at?: string | null;
  published_at?: string | null;
}

/**
 * Published blog posts that /p/<slug> really serves from blog_posts (every
 * blogPostExclusion rule applied), newest first. `slugFilter`, a PostgREST
 * `or=(...)` filter, narrows the read (sitemap-country uses the mapping's).
 */
async function loadServedBlogPosts(
  supabase: SupabaseClient,
  label: string,
  slugFilter?: string,
): Promise<ListOutcome<BlogRow & { slug: string }>> {
  const rows = await readAllRows<BlogRow>(label, (from, to, signal) => {
    let q = supabase
      .from("blog_posts")
      .select("id, slug, cover_image_url, title, updated_at, published_at")
      .eq("is_published", true);
    if (slugFilter) q = q.or(slugFilter);
    return q
      .order("updated_at", { ascending: false })
      .order("id")
      .range(from, to)
      .abortSignal(signal);
  });
  if (!rows.ok) return rows;
  const slugs = rows.data.map((r) => r.slug).filter((s): s is string => !!s);
  const served = await loadContentServedSlugs(supabase, [...new Set(slugs)]);
  if (!served.ok) return served;
  const contentSlugs = new Set(served.data);
  return {
    ok: true,
    data: rows.data.filter(
      (r): r is BlogRow & { slug: string } => !blogPostExclusion(r, contentSlugs),
    ),
  };
}

/**
 * Published blog posts that /p/<slug> really serves from blog_posts, minus any
 * whose canonical is elsewhere: the country mapping is by path, so a blog post
 * whose slug maps to a country canonicalises to its ccTLD and is listed by
 * that country's sitemap-country.xml instead. Newest first.
 */
export async function loadBlogEntries(
  supabase: SupabaseClient,
  siteUrl: string,
): Promise<ListOutcome<SitemapEntry>> {
  const rows = await loadServedBlogPosts(supabase, "sitemap blog_posts");
  if (!rows.ok) return rows;

  const entries: SitemapEntry[] = [];
  for (const r of rows.data) {
    if (canonicalIsElsewhere(null, `${siteUrl}/p/${r.slug}`)) continue;
    const e: SitemapEntry = {
      loc: `${siteUrl}/p/${r.slug}`,
      lastmod: r.updated_at ?? r.published_at ?? null,
    };
    if (r.cover_image_url) e.images = [{ loc: r.cover_image_url, title: r.title ?? undefined }];
    entries.push(e);
  }
  return { ok: true, data: dedupeByLoc(entries) };
}

// ──────────────────────────── synced_listings ───────────────────────────────

interface ListingRow {
  slug: string | null;
  sharetribe_id: string | null;
  primary_image_url?: string | null;
  title?: string | null;
  updated_at?: string | null;
}

/** Sharetribe listings mirrored in synced_listings, at /l/{slug}/{sharetribe_id}. */
export async function loadListingEntries(
  supabase: SupabaseClient,
  siteUrl: string,
): Promise<ListOutcome<SitemapEntry>> {
  const rows = await readAllRows<ListingRow>("sitemap synced_listings", (from, to, signal) =>
    supabase
      .from("synced_listings")
      .select("slug, sharetribe_id, primary_image_url, title, updated_at")
      .eq("state", "published")
      .eq("is_deleted", false)
      .not("slug", "is", null)
      .not("sharetribe_id", "is", null)
      .order("updated_at", { ascending: false })
      .order("sharetribe_id")
      .range(from, to)
      .abortSignal(signal),
  );
  if (!rows.ok) return rows;
  const entries: SitemapEntry[] = [];
  for (const r of rows.data) {
    if (listingExclusion(r)) continue;
    const e: SitemapEntry = {
      loc: `${siteUrl}/l/${r.slug}/${r.sharetribe_id}`,
      lastmod: r.updated_at ?? null,
    };
    if (r.primary_image_url) e.images = [{ loc: r.primary_image_url, title: r.title ?? undefined }];
    entries.push(e);
  }
  return { ok: true, data: dedupeByLoc(entries) };
}

// ───────────────────────────── comparisons ──────────────────────────────────

export const COMPARISON_PILLARS = [
  "/p/giggster-vs-pool-rental-near-me",
  "/p/peerspace-vs-pool-rental-near-me",
  "/p/swimply-alternative-vs-pool-rental-near-me",
];

export const COMPARISON_CITY_PREFIXES = [
  "giggster-vs-pool-rental-near-me-in-",
  "peerspace-vs-pool-rental-near-me-in-",
];

/**
 * The comparison sitemap: three pillars plus two city pages per published
 * cities row, minus every city page that a content_pages row redirects
 * (redirect_to set), because that URL 301s instead of serving itself, and
 * minus the confirmed exact duplicates that 301 to their state-suffixed twin
 * (COMPARISON_DUPLICATE_REDIRECTS). Both reads are paged: the cities read used `.limit(5000)`, which PostgREST
 * caps at 1,000 rows (2,003 URLs), and the redirect read the same.
 */
export async function loadComparisonEntries(
  supabase: SupabaseClient,
  siteUrl: string,
  now: Date = new Date(),
): Promise<ListOutcome<SitemapEntry>> {
  const redirects = await readAllRows<{ slug: string | null }>(
    "sitemap comparison redirects",
    (from, to, signal) =>
      supabase
        .from("content_pages")
        .select("id, slug")
        .not("redirect_to", "is", null)
        .like("slug", "%-vs-pool-rental-near-me-in-%")
        .order("id")
        .range(from, to)
        .abortSignal(signal),
  );
  if (!redirects.ok) return redirects;
  const redirected = new Set(redirects.data.map((r) => r.slug).filter((s): s is string => !!s));

  const cities = await readAllRows<{ slug: string | null; updated_at: string | null }>(
    "sitemap comparison cities",
    (from, to, signal) =>
      supabase
        .from("cities")
        .select("id, slug, updated_at")
        .eq("is_published", true)
        .order("slug", { ascending: true })
        .order("id")
        .range(from, to)
        .abortSignal(signal),
  );
  if (!cities.ok) return cities;

  const entries: SitemapEntry[] = COMPARISON_PILLARS.map((p) => ({
    loc: `${siteUrl}${p}`,
    lastmod: now,
  }));
  for (const row of cities.data) {
    if (!row.slug) continue;
    const lastmod = row.updated_at ? new Date(row.updated_at) : now;
    for (const prefix of COMPARISON_CITY_PREFIXES) {
      if (redirected.has(`${prefix}${row.slug}`)) continue;
      // A confirmed exact duplicate 301s to its state-suffixed twin
      // (src/lib/comparison-duplicates.ts); only the twin is listed.
      if (isComparisonDuplicatePath(`/p/${prefix}${row.slug}`)) continue;
      entries.push({ loc: `${siteUrl}/p/${prefix}${row.slug}`, lastmod });
    }
  }
  return { ok: true, data: dedupeByLoc(entries) };
}

/** Latest lastmod in a list, for the index entry (undefined when none). */
export function latestLastmod(entries: SitemapEntry[]): string | undefined {
  let best: number | undefined;
  for (const e of entries) {
    if (!e.lastmod) continue;
    const t = new Date(e.lastmod).getTime();
    if (Number.isFinite(t) && (best === undefined || t > best)) best = t;
  }
  return best === undefined ? undefined : new Date(best).toISOString();
}
