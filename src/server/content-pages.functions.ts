/**
 * content_pages access contract (SECURITY)
 * ----------------------------------------
 * - The table has NO public/anon SELECT RLS policy. The only policy is
 *   "Admins manage content pages" (ALL, has_role admin).
 * - Table-level grants for `anon` and `authenticated` are REVOKED
 *   (migration 20260503_content_pages_revoke_grants). Defense-in-depth:
 *   even if a permissive policy is later added, PostgREST still rejects
 *   the request at the grant layer.
 * - Therefore content_pages MUST be queried server-side using
 *   `supabaseAdmin` (service role bypasses RLS + grants).
 * - NEVER import this table via the browser `@/integrations/supabase/client`.
 *   Public /p/{slug} pages render SSR through `lookupContentPage` below;
 *   sitemap routes use `supabaseAdmin` directly.
 */
import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { guardedRead } from "@/lib/failed-read";
import {
  pgTextArrayLiteral,
  resolveContentPageLookup,
  type BlogPostRow,
  type ContentPageLookupReads,
} from "@/lib/content-page-lookup";
import { markRequestUnavailable } from "@/server/request-unavailable.server";

// Fire-and-forget: log a 301 redirect from a legacy slug to the canonical
// slug. Failures are swallowed so logging never blocks the user-visible
// redirect.
function logRedirect(fromSlug: string, toSlug: string): void {
  let userAgent: string | null = null;
  let referrer: string | null = null;
  try {
    userAgent = getRequestHeader("user-agent") ?? null;
    referrer = getRequestHeader("referer") ?? null;
  } catch {
    // No active request context; leave as null.
  }
  void (supabaseAdmin as any)
    .from("redirect_log")
    .insert({
      from_slug: fromSlug,
      to_slug: toSlug,
      user_agent: userAgent,
      referrer: referrer,
    })
    .then((res: { error?: unknown }) => {
      if (res?.error) console.error("[redirect_log] insert failed", res.error);
    });
}

export type ContentPageTemplateType =
  | "host_acq_city"
  | "event_guide"
  | "resource"
  | "elearning"
  | "listing"
  | "host_advocacy_hub"
  | "host_advocacy_state"
  | "spanish_host_acq"
  | "spanish_resource"
  | "homepage"
  | "host_acq_hub"
  | "swim_instructor_city"
  | "swim_instructor_hub"
  | "activity_city"
  | "account_legal"
  | "country_launch"
  | "other";

export interface ContentPage {
  id: string;
  slug: string | null;
  url_path: string;
  source_url: string;
  template_type: ContentPageTemplateType | null;
  category: string;
  locale: string;
  title: string | null;
  seo_title: string | null;
  seo_description: string | null;
  hero_image_url: string | null;
  body_markdown: string | null;
  raw_html: string | null;
  status: string;
  scraped_at: string | null;
  updated_at: string;
  // Compatibility aliases used by older templates
  description?: string | null;
  content?: string | null;
  cover_image_url?: string | null;
  language?: string;
  author?: string | null;
  published_at?: string | null;
  is_published?: boolean;
  legacy_slugs?: string[];
  hreflang_alt?: string | null;
  /** Optional AI/derived enrichment surfaced on blog posts. */
  tldr_bullets?: string[] | null;
  related_slugs?: string[] | null;
  topic?: string | null;
  /** AI-generated FAQ Q&A list, stored per page. Renders FAQPage JSON-LD when present. */
  faq_items?: Array<{ question: string; answer: string }> | null;
  /** A/B/C/D title-test variant (host_acq_city only). NULL = control / no test. */
  title_variant?: "A" | "B" | "C" | "D" | null;
}

export type ContentPageLookupResult =
  | { kind: "found"; page: ContentPage }
  | { kind: "redirect"; canonicalSlug: string; redirectPath?: string }
  | { kind: "not_found" }
  /**
   * A read needed to answer failed (returned error, thrown, or timed out), so
   * it is NOT known whether the page exists. Callers answer 503: no 404, no
   * redirect, no content_404_log row.
   */
  | { kind: "unavailable" };

// Every read the lookup can make, each bounded by the read timeout and each
// reporting failure separately from "no rows" (src/lib/failed-read.ts).
const lookupReads: ContentPageLookupReads = {
  pagesBySlug: (slug) =>
    guardedRead<ContentPage[]>("content_pages by slug", (signal) =>
      (supabaseAdmin as any)
        .from("content_pages")
        .select("*")
        .eq("slug", slug)
        .in("status", ["published", "redirect"])
        .order("priority", { ascending: false })
        .limit(5)
        .abortSignal(signal),
    ),
  aliasForSlug: (slug) =>
    guardedRead<Array<{ slug: string | null }>>("content_pages by legacy slug", (signal) =>
      (supabaseAdmin as any)
        .from("content_pages")
        .select("slug")
        // Quoted literal, not `[slug]`: see pgTextArrayLiteral.
        .contains("legacy_slugs", pgTextArrayLiteral([slug]))
        .in("status", ["published", "redirect"])
        .limit(1)
        .abortSignal(signal),
    ),
  cityBySlug: (citySlug) =>
    guardedRead<Array<{ slug: string; state_code: string }>>("cities by slug", (signal) =>
      (supabaseAdmin as any)
        .from("cities")
        .select("slug, state_code")
        .eq("slug", citySlug)
        .eq("is_published", true)
        .limit(1)
        .abortSignal(signal),
    ),
  pageSlugExists: (slug) =>
    guardedRead<Array<{ slug: string | null }>>("content_pages state-suffixed slug", (signal) =>
      (supabaseAdmin as any)
        .from("content_pages")
        .select("slug")
        .eq("slug", slug)
        .in("status", ["published", "redirect"])
        .limit(1)
        .abortSignal(signal),
    ),
  blogPostBySlug: (slug) =>
    guardedRead<BlogPostRow[]>("blog_posts by slug", (signal) =>
      (supabaseAdmin as any)
        .from("blog_posts")
        .select(
          "id, slug, title, excerpt, content, cover_image_url, author, seo_title, seo_description, is_published, published_at, updated_at, topic, tldr_bullets, related_slugs",
        )
        .eq("slug", slug)
        .eq("is_published", true)
        .limit(1)
        .abortSignal(signal),
    ),
};

/**
 * Looks up a content page by slug. If the slug is in another row's
 * `legacy_slugs[]` array, returns a redirect descriptor pointing at the
 * canonical slug. Caller is responsible for issuing the 301.
 *
 * The decision itself lives in src/lib/content-page-lookup.ts. `not_found` is
 * returned only when every read consulted succeeded; a failed read returns
 * `unavailable` and flags the request so the HTTP answer is a 503.
 */
export const lookupContentPage = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ slug: z.string().min(1) }).parse(data))
  .handler(async ({ data }): Promise<ContentPageLookupResult> => {
    const result = await resolveContentPageLookup(data.slug, lookupReads, logRedirect);
    if (result.kind === "unavailable") markRequestUnavailable();
    return result;
  });

export const getHreflangSibling = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ pageId: z.string().uuid() }).parse(data))
  .handler(async ({ data }): Promise<{ sibling: null | { slug: string; language: string } }> => {
    const { pageId } = data;

    // Load the source page to read its hreflang_group.
    const { data: pageRow } = await (supabaseAdmin as any)
      .from("content_pages")
      .select("id, locale, hreflang_group")
      .eq("id", pageId)
      .maybeSingle();

    if (!pageRow) return { sibling: null };

    // Find another published row sharing the same hreflang_group.
    const group = (pageRow as { hreflang_group?: string | null }).hreflang_group;
    if (!group) return { sibling: null };



    const { data: sibRows } = await (supabaseAdmin as any)
      .from("content_pages")
      .select("slug, locale")
      .eq("hreflang_group", group)
      .eq("status", "published")
      .neq("id", pageId)
      .limit(1);

    const sib = (sibRows ?? [])[0] as { slug: string | null; locale: string | null } | undefined;
    if (sib?.slug && sib?.locale) {
      return { sibling: { slug: sib.slug, language: sib.locale } };
    }
    return { sibling: null };
  });

