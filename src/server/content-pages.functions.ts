import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

export type ContentPageTemplateType =
  | "city_main"
  | "host_acquisition_city"
  | "event_city_guide"
  | "spanish_host_acquisition"
  | "spanish_resource"
  | "host_advocacy"
  | "state_advocacy_guide"
  | "academy_article"
  | "money_page"
  | "resource_article";

export interface ContentPage {
  id: string;
  slug: string;
  template_type: ContentPageTemplateType;
  title: string;
  description: string | null;
  content: string | null;
  seo_title: string | null;
  seo_description: string | null;
  cover_image_url: string | null;
  city_id: string | null;
  state_code: string | null;
  amenity_id: string | null;
  language: "en" | "es";
  hreflang_alt: string | null;
  author: string | null;
  published_at: string | null;
  updated_at: string;
  is_published: boolean;
  legacy_slugs: string[];
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

    // 1. Canonical lookup
    const { data: page } = await (supabaseAdmin as any)
      .from("content_pages")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (page) {
      return { kind: "found", page: page as unknown as ContentPage };
    }

    // 2. Legacy slug alias lookup
    const { data: aliased } = await (supabaseAdmin as any)
      .from("content_pages")
      .select("slug")
      .contains("legacy_slugs", [slug])
      .eq("is_published", true)
      .maybeSingle();

    if (aliased) {
      return { kind: "redirect", canonicalSlug: aliased.slug };
    }

    return { kind: "not_found" };
  });

/**
 * Returns the EN↔ES sibling for a page if hreflang_alt is set. Used by the
 * dispatcher to emit hreflang link tags pointing both ways.
 */
export const getHreflangSibling = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ pageId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { data: row } = await (supabaseAdmin as any)
      .from("content_pages")
      .select("slug, language")
      .eq("id", data.pageId)
      .eq("is_published", true)
      .maybeSingle();
    return { sibling: row };
  });
