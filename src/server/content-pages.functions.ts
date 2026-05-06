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
import { z } from "zod";

export type ContentPageTemplateType =
  | "host_acq_city"
  | "public_pool"
  | "public_pool_city"
  | "public_pool_state"
  | "event_guide"
  | "resource"
  | "amenity"
  | "amenity_hub"
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
  | "account_legal"
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
}

export type ContentPageLookupResult =
  | { kind: "found"; page: ContentPage }
  | { kind: "redirect"; canonicalSlug: string }
  | { kind: "not_found" };

/**
 * Looks up a content page by slug. If the slug is in another row's
 * `legacy_slugs[]` array, returns a redirect descriptor pointing at the
 * canonical slug. Caller is responsible for issuing the 301.
 */
export const lookupContentPage = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ slug: z.string().min(1) }).parse(data))
  .handler(async ({ data }): Promise<ContentPageLookupResult> => {
    const { slug } = data;

    // Prefer canonical /p/{slug} url_path; multiple rows may share a slug
    // (e.g. nested legacy paths like /p/foo/become-a-pool-host-...)
    const canonicalPath = `/p/${slug}`;
    const { data: rows } = await (supabaseAdmin as any)
      .from("content_pages")
      .select("*")
      .eq("slug", slug)
      .in("status", ["pending", "scraped", "drafted", "migrated", "published"])
      .order("priority", { ascending: false })
      .limit(5);

    const list = (rows ?? []) as ContentPage[];
    const page =
      list.find((r) => r.url_path === canonicalPath) ?? list[0] ?? null;

    if (page) {
      return { kind: "found", page };
    }

    // Fallback: many host-acq / swim-instructor slugs are stored with a
    // `-{state_code}` suffix (e.g. `become-a-swimming-pool-host-cleveland-oh`).
    // If a visitor hits the bare-city variant (`...-cleveland`), look up the
    // city's state and 301 to the canonical state-suffixed slug if it exists.
    const KNOWN_PREFIXES = [
      "become-a-swimming-pool-host-",
      "swim-instructor-pool-rental-",
      "rent-a-swimming-pool-",
      "pool-rental-",
      "host-acquisition-",
    ];
    const matchedPrefix = KNOWN_PREFIXES.find((p) => slug.startsWith(p));
    if (matchedPrefix) {
      const citySlug = slug.slice(matchedPrefix.length);
      if (!/-[a-z]{2}$/.test(citySlug) && citySlug.length > 0) {
        const { data: cityRows } = await (supabaseAdmin as any)
          .from("cities")
          .select("slug, state_code")
          .eq("slug", citySlug)
          .eq("is_published", true)
          .limit(1);
        const city = (cityRows ?? [])[0] as { slug: string; state_code: string } | undefined;
        if (city?.state_code) {
          const candidate = `${matchedPrefix}${citySlug}-${city.state_code.toLowerCase()}`;
          const { data: candRows } = await (supabaseAdmin as any)
            .from("content_pages")
            .select("slug")
            .eq("slug", candidate)
            .in("status", ["pending", "scraped", "drafted", "migrated", "published"])
            .limit(1);
          if ((candRows ?? []).length > 0) {
            return { kind: "redirect", canonicalSlug: candidate };
          }
        }
      }
    }

    return { kind: "not_found" };
  });

export const getHreflangSibling = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ pageId: z.string().uuid() }).parse(data))
  .handler(async () => {
    return { sibling: null as null | { slug: string; language: string } };
  });
