/**
 * Server function for fetching a single city row by slug. Used by the
 * /p/{slug} dispatcher to enrich host_acq_city pages with cities.description,
 * name, state, etc. for the local guide + earnings calculator.
 *
 * Resolution order:
 *   1. Exact slug match (e.g. "nashville-tn").
 *   2. If slug ends with "-{2-letter US state}", try the base slug
 *      (e.g. "boise-id" -> "boise") and verify state_code matches.
 *   3. If still no match and slug ends with "-{state}", try matching by
 *      name (de-slugged) + state_code (handles cities never seeded with the
 *      state-suffixed slug, e.g. arlington-va).
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

const SELECT_COLS =
  "slug, name, state, state_code, description, latitude, longitude, hero_image_url";

const US_STATES = new Set([
  "al","ak","az","ar","ca","co","ct","de","fl","ga","hi","id","il","in","ia",
  "ks","ky","la","me","md","ma","mi","mn","ms","mo","mt","ne","nv","nh","nj",
  "nm","ny","nc","nd","oh","ok","or","pa","ri","sc","sd","tn","tx","ut","vt",
  "va","wa","wv","wi","wy","dc",
]);

function splitStateSuffix(slug: string): { base: string; state: string } | null {
  const m = slug.match(/^(.+)-([a-z]{2})$/);
  if (!m) return null;
  if (!US_STATES.has(m[2])) return null;
  return { base: m[1], state: m[2].toUpperCase() };
}

/**
 * Resolve a slug like "boise-id" or "arlington-va" to the canonical
 * cities row, even when the cities table only has the un-suffixed slug
 * or only matches by name. Server-only.
 */
export async function resolveCityRow(slug: string): Promise<CityRow | null> {
  const sb = supabaseAdmin as any;

  // 1. exact
  {
    const { data: row } = await sb
      .from("cities")
      .select(SELECT_COLS)
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (row) return row as CityRow;
  }

  const split = splitStateSuffix(slug);
  if (!split) return null;

  // 2. base slug + state match
  {
    const { data: row } = await sb
      .from("cities")
      .select(SELECT_COLS)
      .eq("slug", split.base)
      .eq("state_code", split.state)
      .eq("is_published", true)
      .maybeSingle();
    if (row) return row as CityRow;
  }

  // 3. de-slugged name (Title Case) + state match
  const name = split.base
    .split("-")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
  {
    const { data: row } = await sb
      .from("cities")
      .select(SELECT_COLS)
      .ilike("name", name)
      .eq("state_code", split.state)
      .eq("is_published", true)
      .maybeSingle();
    if (row) return row as CityRow;
  }

  return null;
}

export const getCityBySlug = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ slug: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }): Promise<CityRow | null> => {
    try {
      return await resolveCityRow(data.slug);
    } catch {
      return null;
    }
  });
