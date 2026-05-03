/**
 * Nearby cities lookup for /p/{slug} content pages.
 *
 * Uses the public.nearby_cities_by_distance RPC (haversine + same-state
 * fallback). Server-only because we go through supabaseAdmin to avoid
 * client/anon dependency on RLS for the cities table (defense-in-depth).
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
}

export const getNearbyCitiesForPage = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        templateType: z.string().nullable(),
        slug: z.string().nullable(),
        limit: z.number().int().min(1).max(24).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<NearbyCity[]> => {
    const citySlug = cityForContentPage(data.templateType, data.slug);
    if (!citySlug) return [];

    const { data: rows, error } = await (supabaseAdmin as any).rpc(
      "nearby_cities_by_distance",
      { _slug: citySlug, _limit: data.limit ?? 6 },
    );
    if (error || !rows) return [];

    return (rows as Array<Record<string, unknown>>).map((r) => ({
      slug: String(r.out_slug),
      name: String(r.out_name),
      state: (r.out_state as string | null) ?? null,
      state_code: (r.out_state_code as string | null) ?? null,
      distance_km:
        r.out_distance_km == null ? null : Number(r.out_distance_km),
    }));
  });
