/**
 * Per-city citation sources for host_acq_city pages.
 *
 * Sources are hand-curated rows in `public.city_sources` (admin-only).
 * Server-only access via supabaseAdmin so anon/authenticated grants stay
 * revoked (defense-in-depth, same posture as content_pages).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { resolveCityRow } from "@/server/cities.functions";

export type CitySourceBucket =
  | "ordinance"
  | "hoa_str"
  | "noaa"
  | "demand"
  | "insurance";

export interface CitySource {
  id: string;
  bucket: CitySourceBucket;
  title: string;
  url: string;
  publisher: string;
  key_fact: string;
}

const SELECT = "id, bucket, title, url, publisher, key_fact";

export async function loadCitySources(rawSlug: string): Promise<CitySource[]> {
  // Resolve to canonical cities.slug so "boise-id" -> "boise" works.
  let lookupSlug = rawSlug;
  try {
    const row = await resolveCityRow(rawSlug);
    if (row?.slug) lookupSlug = row.slug;
  } catch {
    /* fall through with rawSlug */
  }

  const { data, error } = await (supabaseAdmin as any)
    .from("city_sources")
    .select(SELECT)
    .eq("city_slug", lookupSlug)
    .order("bucket", { ascending: true });

  if (error || !data) return [];
  return data as CitySource[];
}

export const getCitySources = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ slug: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }): Promise<CitySource[]> => {
    try {
      return await loadCitySources(data.slug);
    } catch {
      return [];
    }
  });
