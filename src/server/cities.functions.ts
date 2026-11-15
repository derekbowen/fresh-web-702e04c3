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
import { guardedRead, isReadUnavailable, ReadUnavailableError } from "@/lib/failed-read";
import { failRequestUnavailable } from "@/server/request-unavailable.server";

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
 *
 * `strict` is for callers that turn "no city" into a 404: with it, a read that
 * FAILED throws ReadUnavailableError instead of counting as "no row". Without
 * it (page enrichment, where a missing city only drops a section) a failed
 * read is still treated as no row, as before.
 */
export async function resolveCityRow(
  slug: string,
  options?: { strict?: boolean },
): Promise<CityRow | null> {
  const sb = supabaseAdmin as any;
  const read = async (query: (signal: AbortSignal) => any): Promise<CityRow | null> => {
    if (!options?.strict) {
      const { data: row } = await query(new AbortController().signal);
      return (row as CityRow | null) ?? null;
    }
    const outcome = await guardedRead<CityRow>("cities row", query);
    if (!outcome.ok) throw new ReadUnavailableError("cities row");
    return outcome.data;
  };

  // 1. exact
  {
    const row = await read((signal) =>
      sb
        .from("cities")
        .select(SELECT_COLS)
        .eq("slug", slug)
        .eq("is_published", true)
        .abortSignal(signal)
        .maybeSingle(),
    );
    if (row) return row;
  }

  const split = splitStateSuffix(slug);
  if (!split) return null;

  // 2. base slug + state match
  {
    const row = await read((signal) =>
      sb
        .from("cities")
        .select(SELECT_COLS)
        .eq("slug", split.base)
        .eq("state_code", split.state)
        .eq("is_published", true)
        .abortSignal(signal)
        .maybeSingle(),
    );
    if (row) return row;
  }

  // 3. de-slugged name (Title Case) + state match
  const name = split.base
    .split("-")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
  {
    const row = await read((signal) =>
      sb
        .from("cities")
        .select(SELECT_COLS)
        .ilike("name", name)
        .eq("state_code", split.state)
        .eq("is_published", true)
        .abortSignal(signal)
        .maybeSingle(),
    );
    if (row) return row;
  }

  return null;
}

export const getCityBySlug = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ slug: z.string().min(1), strict: z.boolean().optional() }).parse(data),
  )
  .handler(async ({ data }): Promise<CityRow | null> => {
    try {
      return await resolveCityRow(data.slug, { strict: data.strict });
    } catch (err) {
      // strict callers 404 on null, so a failed read must not look like null.
      if (data.strict && isReadUnavailable(err)) failRequestUnavailable("cities row");
      return null;
    }
  });
