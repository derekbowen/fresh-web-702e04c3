/**
 * Server function for fetching a single city row by slug. Used by the
 * /p/{slug} dispatcher to enrich host_acq_city pages with cities.description,
 * name, state, etc. for the local guide + earnings calculator.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface CityRow {
  slug: string;
  name: string;
  state: string;
  state_code: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  hero_image_url: string | null;
}

export const getCityBySlug = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ slug: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }): Promise<CityRow | null> => {
    const { data: row, error } = await (supabaseAdmin as any)
      .from("cities")
      .select("slug, name, state, state_code, description, latitude, longitude, hero_image_url")
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error || !row) return null;
    return row as CityRow;
  });
