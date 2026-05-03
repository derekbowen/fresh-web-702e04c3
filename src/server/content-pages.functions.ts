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

    const { data: page } = await (supabaseAdmin as any)
      .from("content_pages")
      .select("*")
      .eq("slug", slug)
      .in("status", ["drafted", "migrated", "published"])
      .maybeSingle();

    if (page) {
      return { kind: "found", page: page as unknown as ContentPage };
    }
    return { kind: "not_found" };
  });

export const getHreflangSibling = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ pageId: z.string().uuid() }).parse(data))
  .handler(async () => {
    return { sibling: null as null | { slug: string; language: string } };
  });
