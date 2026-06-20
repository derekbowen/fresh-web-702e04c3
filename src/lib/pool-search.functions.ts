import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type PoolCardData = {
  id: string;
  slug: string;
  title: string;
  priceCents: number | null;
  city: string | null;
  state: string | null;
  imageUrl: string | null;
  url: string;
  lat: number | null;
  lng: number | null;
};

export type PoolSearchResult = { pools: PoolCardData[]; total: number };

/**
 * Search pools for the /s browse page.
 *
 * Reads the public synced_listings mirror directly (NOT the Sharetribe API) —
 * it's always available (no ST integ creds needed), carries lat/lng for the
 * "near me" sort, and is the same data the rest of fresh-web renders. Returns
 * up to perPage published pools; optional city contains-match.
 */
export const searchPools = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        city: z.string().max(120).optional(),
        perPage: z.number().int().min(1).max(100).default(100),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }): Promise<PoolSearchResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("synced_listings")
      .select(
        "sharetribe_id, slug, title, price_amount, price_currency, city, state_code, primary_image_url, latitude, longitude",
        { count: "exact" },
      )
      .eq("state", "published")
      .eq("is_deleted", false);
    if (data.city) q = q.ilike("city", `%${data.city}%`);

    const { data: rows, count, error } = await q
      .order("updated_at", { ascending: false })
      .order("sharetribe_id", { ascending: true })
      .limit(data.perPage);
    if (error) {
      console.error("[searchPools]", error);
      return { pools: [], total: 0 };
    }

    // Point cards at the canonical /pools-for-rent/... URL when a frozen slug
    // exists; fall back to the legacy /l/ path until backfillPoolSlugs has run.
    const ids = (rows ?? []).map((r: any) => r.sharetribe_id);
    const { data: slugRows } = ids.length
      ? await supabaseAdmin
          .from("pool_slugs")
          .select("sharetribe_id, state_code, city_slug, slug")
          .in("sharetribe_id", ids)
      : { data: [] as any[] };
    const pathById = new Map<string, string>(
      (slugRows ?? []).map((s: any) => [
        s.sharetribe_id,
        `/pools-for-rent/${s.state_code}/${s.city_slug}/${s.slug}`,
      ]),
    );

    const pools: PoolCardData[] = (rows ?? []).map((r: any) => ({
      id: r.sharetribe_id,
      slug: r.slug,
      title: r.title,
      priceCents: r.price_amount ?? null,
      city: r.city ?? null,
      state: r.state_code ?? null,
      imageUrl: r.primary_image_url ?? null,
      url: pathById.get(r.sharetribe_id) ?? `/l/${r.slug}/${r.sharetribe_id}`,
      lat: r.latitude != null ? Number(r.latitude) : null,
      lng: r.longitude != null ? Number(r.longitude) : null,
    }));
    return { pools, total: count ?? pools.length };
  });
