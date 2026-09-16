/**
 * Server function for the country_launch template: fetch the market's guide
 * pages (title, blurb, cover) so the launch page can show real, linked
 * content instead of a bare list of slugs. content_pages is server-only
 * (grants revoked for anon/authenticated), so this goes through supabaseAdmin
 * like every other content lookup.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface CountryLaunchGuide {
  slug: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
}

export const getCountryLaunchGuides = createServerFn({ method: "GET" })
  .inputValidator((input: { slugs: string[] }) =>
    z.object({ slugs: z.array(z.string().min(1)).max(12) }).parse(input),
  )
  .handler(async ({ data }): Promise<CountryLaunchGuide[]> => {
    if (data.slugs.length === 0) return [];
    const { data: rows, error } = await (supabaseAdmin as any)
      .from("content_pages")
      .select("slug, title, seo_title, description, seo_description, cover_image_url, hero_image_url")
      .in("slug", data.slugs)
      .eq("in_sitemap", true)
      .limit(12);
    if (error || !Array.isArray(rows)) return [];
    const bySlug = new Map<string, CountryLaunchGuide>();
    for (const r of rows as Array<Record<string, string | null>>) {
      if (!r.slug) continue;
      const title = r.title || r.seo_title;
      if (!title) continue;
      bySlug.set(r.slug, {
        slug: r.slug,
        title,
        description: r.description || r.seo_description || null,
        cover_image_url: r.cover_image_url || r.hero_image_url || null,
      });
    }
    // Preserve the configured display order.
    return data.slugs.map((s) => bySlug.get(s)).filter((g): g is CountryLaunchGuide => !!g);
  });
