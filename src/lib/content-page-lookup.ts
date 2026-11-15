/**
 * The decision behind `lookupContentPage` (/p/{slug}), separated from the
 * database client so it can be tested with `node --test`.
 *
 * The rule this file exists to enforce: `not_found` may be concluded only when
 * EVERY read consulted on the way there succeeded. If any of them failed
 * (returned error, thrown exception, timeout) the answer is `unavailable`:
 * the caller must answer 503, must not 404, must not redirect and must not log
 * a 404. See src/lib/failed-read.ts for the history.
 *
 * Pure: relative imports only, types erased at runtime.
 */
import type { ContentPage, ContentPageLookupResult } from "../server/content-pages.functions";
import type { ReadOutcome } from "./failed-read.ts";

/** The published blog_posts columns the lookup turns into a synthetic page. */
export interface BlogPostRow {
  id: string;
  slug: string;
  title: string | null;
  excerpt: string | null;
  content: string | null;
  cover_image_url: string | null;
  author: string | null;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  updated_at: string;
  topic: string | null;
  tldr_bullets: unknown;
  related_slugs: unknown;
}

/** One function per read the lookup can make. Each reports success separately from rows. */
export interface ContentPageLookupReads {
  /** content_pages rows for this slug, status published|redirect, priority desc, max 5. */
  pagesBySlug(slug: string): Promise<ReadOutcome<ContentPage[]>>;
  /** A published|redirect row listing this slug in legacy_slugs[] (max 1). */
  aliasForSlug(slug: string): Promise<ReadOutcome<Array<{ slug: string | null }>>>;
  /** The published cities row for a bare city slug (max 1). */
  cityBySlug(citySlug: string): Promise<ReadOutcome<Array<{ slug: string; state_code: string }>>>;
  /** Whether a published|redirect content_pages row exists for this slug (max 1). */
  pageSlugExists(slug: string): Promise<ReadOutcome<Array<{ slug: string | null }>>>;
  /** The published blog post with this slug (max 1). */
  blogPostBySlug(slug: string): Promise<ReadOutcome<BlogPostRow[]>>;
}

const KNOWN_PREFIXES = [
  "become-a-swimming-pool-host-",
  "swim-instructor-pool-rental-",
  "rent-a-swimming-pool-",
  "pool-rental-",
  "host-acquisition-",
];

const UNAVAILABLE: ContentPageLookupResult = { kind: "unavailable" };

/**
 * A Postgres text[] literal with every element double-quoted, so any character
 * in a value is data, never array syntax. For `.contains(column, literal)`.
 *
 * postgrest-js's array form, `.contains(column, [value])`, sends
 * `cs.{value}` with the value unquoted. The slug is decoded user input, and a
 * `{`, `}` or `"` in it (`/p/become-a-swimming-pool-host-%7Bcity%7D`, an
 * unfilled template placeholder) makes Postgres reject the literal (22P02,
 * PostgREST 400). That is a failed read only by accident of encoding: the
 * same URL fails on every retry, so it would answer 503 forever instead of
 * the 404 (or become-a-host 301) a missing page gets. A comma would split the
 * value into two elements, and a backslash would be eaten as an escape.
 */
export function pgTextArrayLiteral(values: readonly string[]): string {
  return `{${values.map((v) => `"${v.replace(/[\\"]/g, "\\$&")}"`).join(",")}}`;
}

function redirectLookup(
  fromSlug: string,
  rawTarget: string,
  onRedirect?: (fromSlug: string, toSlug: string) => void,
): ContentPageLookupResult {
  const target = rawTarget.trim();
  const redirectPath =
    target.startsWith("http") || target.startsWith("/")
      ? target
      : `/p/${target.replace(/^p\//, "")}`;
  const canonicalSlug = redirectPath.startsWith("/p/")
    ? redirectPath.slice(3).replace(/^\/+|\/+$/g, "")
    : target;
  if (canonicalSlug && canonicalSlug !== fromSlug) onRedirect?.(fromSlug, canonicalSlug);
  return { kind: "redirect", canonicalSlug: canonicalSlug || target, redirectPath };
}

/**
 * Looks up a content page by slug. If the slug is in another row's
 * `legacy_slugs[]` array, returns a redirect descriptor pointing at the
 * canonical slug. Caller is responsible for issuing the 301.
 */
export async function resolveContentPageLookup(
  slug: string,
  reads: ContentPageLookupReads,
  onRedirect?: (fromSlug: string, toSlug: string) => void,
): Promise<ContentPageLookupResult> {
  // Prefer canonical /p/{slug} url_path; multiple rows may share a slug
  // (e.g. nested legacy paths like /p/foo/become-a-pool-host-...). Include
  // redirect rows, otherwise admin-created 404 repairs keep returning 404.
  const canonicalPath = `/p/${slug}`;
  const pages = await reads.pagesBySlug(slug);
  if (!pages.ok) return UNAVAILABLE;

  const list = pages.data ?? [];
  const exactRedirect = list.find((r) => {
    const redirectTo = (r as unknown as { redirect_to?: string | null }).redirect_to;
    return (
      r.url_path === canonicalPath &&
      r.status === "redirect" &&
      typeof redirectTo === "string" &&
      redirectTo.trim()
    );
  });
  if (exactRedirect) {
    return redirectLookup(
      slug,
      (exactRedirect as unknown as { redirect_to: string }).redirect_to,
      onRedirect,
    );
  }

  const page =
    list.find((r) => r.url_path === canonicalPath && r.status === "published") ??
    list.find((r) => r.status === "published") ??
    null;

  if (page) {
    // Honor an explicit redirect_to on the canonical row.
    const redirectTo = (page as unknown as { redirect_to?: string | null }).redirect_to;
    if (redirectTo && typeof redirectTo === "string") {
      const target = redirectTo.startsWith("/p/") ? redirectTo.slice(3) : redirectTo;
      if (target && target !== slug) return redirectLookup(slug, target, onRedirect);
    }
    return { kind: "found", page };
  }

  // Alias lookup: any published page that lists this slug in legacy_slugs[]
  // becomes the canonical destination for a 301 redirect.
  const aliases = await reads.aliasForSlug(slug);
  if (!aliases.ok) return UNAVAILABLE;
  const alias = (aliases.data ?? [])[0];
  if (alias?.slug && alias.slug !== slug) {
    return redirectLookup(slug, alias.slug, onRedirect);
  }

  // Fallback: many host-acq / swim-instructor slugs are stored with a
  // `-{state_code}` suffix (e.g. `become-a-swimming-pool-host-cleveland-oh`).
  // If a visitor hits the bare-city variant (`...-cleveland`), look up the
  // city's state and 301 to the canonical state-suffixed slug if it exists.
  const matchedPrefix = KNOWN_PREFIXES.find((p) => slug.startsWith(p));
  if (matchedPrefix) {
    const citySlug = slug.slice(matchedPrefix.length);
    if (!/-[a-z]{2}$/.test(citySlug) && citySlug.length > 0) {
      const cities = await reads.cityBySlug(citySlug);
      if (!cities.ok) return UNAVAILABLE;
      const city = (cities.data ?? [])[0];
      if (city?.state_code) {
        const candidate = `${matchedPrefix}${citySlug}-${city.state_code.toLowerCase()}`;
        const candidates = await reads.pageSlugExists(candidate);
        if (!candidates.ok) return UNAVAILABLE;
        if ((candidates.data ?? []).length > 0) {
          return redirectLookup(slug, candidate, onRedirect);
        }
      }
    }
  }

  // Fallback: published blog posts also live at /p/{slug} now (legacy
  // /blog/{slug} URLs were retired). Render them through the dispatcher
  // as a synthetic resource-article page so canonical, OG, and JSON-LD
  // are all built from /p/{slug} via the existing head() pipeline.
  const blogs = await reads.blogPostBySlug(slug);
  if (!blogs.ok) return UNAVAILABLE;
  const blog = (blogs.data ?? [])[0];
  if (blog) {
    const tldr = Array.isArray(blog.tldr_bullets)
      ? (blog.tldr_bullets as unknown[]).filter((s): s is string => typeof s === "string")
      : null;
    const related = Array.isArray(blog.related_slugs)
      ? (blog.related_slugs as unknown[]).filter((s): s is string => typeof s === "string")
      : null;
    const synthetic: ContentPage = {
      id: blog.id,
      slug: blog.slug,
      url_path: `/p/${blog.slug}`,
      source_url: `${"" /* no upstream */}`,
      template_type: "resource",
      category: blog.topic ?? "blog",
      locale: "en",
      title: blog.title,
      seo_title: blog.seo_title,
      seo_description: blog.seo_description,
      hero_image_url: blog.cover_image_url,
      body_markdown: blog.content,
      raw_html: null,
      status: "published",
      scraped_at: null,
      updated_at: blog.updated_at,
      description: blog.excerpt,
      content: blog.content,
      cover_image_url: blog.cover_image_url,
      language: "en",
      author: blog.author,
      published_at: blog.published_at,
      is_published: true,
      legacy_slugs: [],
      hreflang_alt: null,
      tldr_bullets: tldr,
      related_slugs: related,
      topic: blog.topic,
    };
    return { kind: "found", page: synthetic };
  }

  // Every read above succeeded and none of them knows this slug.
  return { kind: "not_found" };
}
