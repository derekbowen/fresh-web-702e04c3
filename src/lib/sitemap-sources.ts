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
import { pgTextArrayLiteral } from "./content-page-lookup.ts";
import { groupOrFilter, type ContentSitemapGroup } from "./sitemap-groups.ts";
import {
  blogPostExclusion,
  contentRowExclusion,
  contentRowLoc,
  dedupeByLoc,
  listingExclusion,
  redirectShadowedSlugs,
} from "./sitemap-rules.ts";

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
    const read: ReadOutcome<T[]> = await guardedRead<T[]>(
      `${label} [${from}]`,
      (signal) =>
        build(from, from + window - 1, signal) as PromiseLike<{
          data?: T[] | null;
          error?: unknown;
        }>,
    );
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

// ───────────────────────────── blog_posts ───────────────────────────────────

const CONTENT_LOOKUP_STATUSES = ["published", "redirect"];
/** Slugs per `in.(...)` / `ov.{...}` request: 40 quoted slugs of up to ~100 characters keep each URL near 5 KB. */
const SLUG_CHUNK = 40;

/**
 * Which of `slugs` the /p/ dispatcher answers from content_pages before it
 * reaches blog_posts: a published|redirect row with that slug, or one listing
 * it in legacy_slugs (the alias 301).
 */
export async function loadContentServedSlugs(
  supabase: SupabaseClient,
  slugs: string[],
): Promise<ListOutcome<string>> {
  const wanted = new Set(slugs);
  const served = new Set<string>();
  for (let i = 0; i < slugs.length; i += SLUG_CHUNK) {
    const chunk = slugs.slice(i, i + SLUG_CHUNK);
    const own = await readAllRows<{ slug: string | null }>(
      "sitemap blog shadow rows",
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
    if (!own.ok) return own;
    for (const r of own.data) if (r.slug) served.add(r.slug);

    const aliases = await readAllRows<{ legacy_slugs: string[] | null }>(
      "sitemap blog shadow aliases",
      (from, to, signal) =>
        supabase
          .from("content_pages")
          .select("id, legacy_slugs")
          // Quoted literal, as in content-page-lookup.ts: a slug is data, never array syntax.
          .overlaps("legacy_slugs", pgTextArrayLiteral(chunk))
          .in("status", CONTENT_LOOKUP_STATUSES)
          .order("id")
          .range(from, to)
          .abortSignal(signal),
    );
    if (!aliases.ok) return aliases;
    for (const r of aliases.data)
      for (const s of r.legacy_slugs ?? []) if (wanted.has(s)) served.add(s);
  }
  return { ok: true, data: [...served] };
}

interface BlogRow {
  slug: string | null;
  cover_image_url?: string | null;
  title?: string | null;
  updated_at?: string | null;
  published_at?: string | null;
}

/** Published blog posts that /p/<slug> really serves from blog_posts. Newest first. */
export async function loadBlogEntries(
  supabase: SupabaseClient,
  siteUrl: string,
): Promise<ListOutcome<SitemapEntry>> {
  const rows = await readAllRows<BlogRow>("sitemap blog_posts", (from, to, signal) =>
    supabase
      .from("blog_posts")
      .select("id, slug, cover_image_url, title, updated_at, published_at")
      .eq("is_published", true)
      .order("updated_at", { ascending: false })
      .order("id")
      .range(from, to)
      .abortSignal(signal),
  );
  if (!rows.ok) return rows;
  const slugs = rows.data.map((r) => r.slug).filter((s): s is string => !!s);
  const served = await loadContentServedSlugs(supabase, [...new Set(slugs)]);
  if (!served.ok) return served;
  const contentSlugs = new Set(served.data);

  const entries: SitemapEntry[] = [];
  for (const r of rows.data) {
    if (blogPostExclusion(r, contentSlugs)) continue;
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
 * (redirect_to set), because that URL 301s instead of serving itself.
 * Both reads are paged: the cities read used `.limit(5000)`, which PostgREST
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
