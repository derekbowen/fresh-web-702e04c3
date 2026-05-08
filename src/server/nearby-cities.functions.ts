/**
 * Nearby cities lookup for /p/{slug} content pages.
 *
 * Uses the public.nearby_cities_by_distance RPC (haversine + same-state
 * fallback). Server-only because we go through supabaseAdmin to avoid
 * client/anon dependency on RLS for the cities table (defense-in-depth).
 *
 * When `requirePathPrefix` is provided, results are filtered to cities that
 * have a published content_pages row at `/p/{prefix}{slug}` or
 * `/p/{prefix}{slug}-{state_code}`. Each returned city includes `linkSlug`
 * pointing at the existing page so callers never render dead links.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { cityForContentPage } from "@/lib/city-slug";

export { cityForContentPage };

export interface NearbyCity {
  slug: string;
  name: string;
  state: string | null;
  state_code: string | null;
  distance_km: number | null;
  /** When `requirePathPrefix` is set, the validated slug to use in /p/{slug}. */
  linkSlug?: string;
}

export const getNearbyCitiesForPage = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        templateType: z.string().nullable(),
        slug: z.string().nullable(),
        limit: z.number().int().min(1).max(24).optional(),
        requirePathPrefix: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<NearbyCity[]> => {
    const citySlug = cityForContentPage(data.templateType, data.slug);
    if (!citySlug) return [];

    const limit = data.limit ?? 6;
    // Fetch a wider pool so filtering still leaves enough results.
    const fetchLimit = data.requirePathPrefix ? Math.min(24, limit * 4) : limit;

    const { data: rows, error } = await (supabaseAdmin as any).rpc(
      "nearby_cities_by_distance",
      { _slug: citySlug, _limit: fetchLimit },
    );
    if (error || !rows) return [];

    const cities: NearbyCity[] = (rows as Array<Record<string, unknown>>).map(
      (r) => ({
        slug: String(r.out_slug),
        name: String(r.out_name),
        state: (r.out_state as string | null) ?? null,
        state_code: (r.out_state_code as string | null) ?? null,
        distance_km:
          r.out_distance_km == null ? null : Number(r.out_distance_km),
      }),
    );

    if (!data.requirePathPrefix) return cities.slice(0, limit);

    // Build candidate url_paths for each city, then filter to published rows.
    const prefix = data.requirePathPrefix;
    const candidates: string[] = [];
    for (const c of cities) {
      const stateLow = c.state_code ? c.state_code.toLowerCase() : null;
      const base = `/p/${prefix}${c.slug}`;
      candidates.push(base);
      if (stateLow && !c.slug.endsWith(`-${stateLow}`)) {
        candidates.push(`${base}-${stateLow}`);
      }
    }

    const { data: existingRows } = await (supabaseAdmin as any)
      .from("content_pages")
      .select("url_path")
      .eq("status", "published")
      .in("url_path", candidates);

    const existing = new Set<string>(
      ((existingRows as Array<{ url_path: string }> | null) ?? []).map(
        (r) => r.url_path,
      ),
    );

    const out: NearbyCity[] = [];
    for (const c of cities) {
      const stateLow = c.state_code ? c.state_code.toLowerCase() : null;
      const base = `${prefix}${c.slug}`;
      const withState =
        stateLow && !c.slug.endsWith(`-${stateLow}`) ? `${base}-${stateLow}` : null;
      let linkSlug: string | null = null;
      if (existing.has(`/p/${base}`)) linkSlug = base;
      else if (withState && existing.has(`/p/${withState}`)) linkSlug = withState;
      if (linkSlug) {
        out.push({ ...c, linkSlug });
        if (out.length >= limit) break;
      }
    }
    return out;
  });
