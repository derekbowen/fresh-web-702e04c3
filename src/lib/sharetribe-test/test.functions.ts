/**
 * Admin-only server fns that exercise the Sharetribe Marketplace API SDK
 * against the TEST marketplace. Used by the "SDK Test" view in
 * /admin/marketplace.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("forbidden");
}

export type SdkPingResult = {
  ok: boolean;
  marketplaceId: string | null;
  marketplaceName: string | null;
  marketplaceUrl: string | null;
  clientIdSuffix: string;
  error: string | null;
};

export const sdkTestPing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SdkPingResult> => {
    await assertAdmin((context as any).userId);
    const { getTestSdkTrusted, sdkErrorMessage } = await import(
      "@/lib/sharetribe-test/sdk.server"
    );
    const clientId = process.env.SHARETRIBE_TEST_CLIENT_ID ?? "";
    const clientIdSuffix = clientId.slice(-6);
    try {
      const sdk = getTestSdkTrusted();
      const res = await sdk.marketplace.show();
      const m = res?.data?.data;
      return {
        ok: true,
        marketplaceId: m?.id?.uuid ?? null,
        marketplaceName: m?.attributes?.name ?? null,
        marketplaceUrl: m?.attributes?.url ?? null,
        clientIdSuffix,
        error: null,
      };
    } catch (e) {
      return {
        ok: false,
        marketplaceId: null,
        marketplaceName: null,
        marketplaceUrl: null,
        clientIdSuffix,
        error: sdkErrorMessage(e),
      };
    }
  });

export type SdkListing = {
  id: string;
  title: string;
  state: string;
  priceCents: number | null;
  priceCurrency: string | null;
  city: string | null;
  listingType: string | null;
  poolType: string | null;
  poolSize: string | null;
  poolDepth: string | null;
  maxGuests: number | null;
  isHeated: boolean | null;
  amenities: string[];
};

export const sdkTestSearchListings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        keywords: z.string().max(200).optional(),
        page: z.number().int().min(1).max(50).optional(),
        perPage: z.number().int().min(1).max(50).optional(),
      })
      .parse(d),
  )
  .handler(
    async ({ data, context }): Promise<{ items: SdkListing[]; total: number; error: string | null }> => {
      await assertAdmin((context as any).userId);
      const { getTestSdkTrusted, sdkErrorMessage } = await import(
        "@/lib/sharetribe-test/sdk.server"
      );
      try {
        const sdk = getTestSdkTrusted();
        const params: Record<string, any> = {
          perPage: data.perPage ?? 10,
          page: data.page ?? 1,
        };
        if (data.keywords) params.keywords = data.keywords;
        const res = await sdk.listings.query(params);
        const items: SdkListing[] = (res?.data?.data ?? []).map((l: any) => {
          const attrs = l.attributes ?? {};
          const pd = (attrs.publicData ?? {}) as Record<string, any>;
          const heatedRaw = pd.is_heated;
          const isHeated =
            heatedRaw === true || heatedRaw === "yes"
              ? true
              : heatedRaw === false || heatedRaw === "no"
                ? false
                : null;
          const maxGuestsRaw = pd.max_guests ?? pd.maxGuests;
          const maxGuests =
            typeof maxGuestsRaw === "number"
              ? maxGuestsRaw
              : typeof maxGuestsRaw === "string" && maxGuestsRaw.trim() !== ""
                ? Number(maxGuestsRaw) || null
                : null;
          return {
            id: l.id?.uuid ?? "",
            title: attrs.title ?? "(untitled)",
            state: attrs.state ?? "unknown",
            priceCents: attrs.price?.amount ?? null,
            priceCurrency: attrs.price?.currency ?? null,
            city: pd.city ?? pd.location?.city ?? null,
            listingType: pd.listingType ?? pd.listing_type ?? pd.category ?? null,
            poolType: pd.pool_type ?? null,
            poolSize: pd.poolsize ?? pd.pool_size ?? null,
            poolDepth: pd.pool_depth ?? null,
            maxGuests,
            isHeated,
            amenities: Array.isArray(pd.poolAmenities)
              ? (pd.poolAmenities as string[])
              : Array.isArray(pd.amenities)
                ? (pd.amenities as string[])
                : [],
          };
        });
        return {
          items,
          total: res?.data?.meta?.totalItems ?? items.length,
          error: null,
        };
      } catch (e) {
        return { items: [], total: 0, error: sdkErrorMessage(e) };
      }
    },
  );

// ============= DB-backed sync =============

function mapListingRow(l: any) {
  const attrs = l.attributes ?? {};
  const pd = (attrs.publicData ?? {}) as Record<string, any>;
  const heatedRaw = pd.is_heated;
  const isHeated =
    heatedRaw === true || heatedRaw === "yes"
      ? true
      : heatedRaw === false || heatedRaw === "no"
        ? false
        : null;
  const maxGuestsRaw = pd.max_guests ?? pd.maxGuests;
  const maxGuests =
    typeof maxGuestsRaw === "number"
      ? maxGuestsRaw
      : typeof maxGuestsRaw === "string" && maxGuestsRaw.trim() !== ""
        ? Number(maxGuestsRaw) || null
        : null;
  return {
    id: l.id?.uuid ?? "",
    title: attrs.title ?? null,
    state: attrs.state ?? null,
    city: pd.city ?? pd.location?.city ?? null,
    listing_type: pd.listingType ?? pd.listing_type ?? pd.category ?? null,
    pool_type: pd.pool_type ?? null,
    pool_size: pd.poolsize ?? pd.pool_size ?? null,
    pool_depth: pd.pool_depth ?? null,
    max_guests: maxGuests,
    is_heated: isHeated,
    amenities: Array.isArray(pd.poolAmenities)
      ? (pd.poolAmenities as string[])
      : Array.isArray(pd.amenities)
        ? (pd.amenities as string[])
        : [],
    price_cents: attrs.price?.amount ?? null,
    price_currency: attrs.price?.currency ?? null,
    raw: l,
    last_synced_at: new Date().toISOString(),
  };
}

export type SdkSyncResult = {
  ok: boolean;
  totalFetched: number;
  inserted: number;
  updated: number;
  error: string | null;
  runId: string | null;
};

export const sdkTestSyncListings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SdkSyncResult> => {
    await assertAdmin((context as any).userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getTestSdkTrusted, sdkErrorMessage } = await import(
      "@/lib/sharetribe-test/sdk.server"
    );

    const { data: runRow } = await supabaseAdmin
      .from("sharetribe_test_sync_runs")
      .insert({ triggered_by: (context as any).userId })
      .select("id")
      .single();
    const runId = runRow?.id ?? null;

    try {
      const sdk = getTestSdkTrusted();
      const perPage = 100;
      let page = 1;
      let totalFetched = 0;
      let inserted = 0;
      let updated = 0;
      const seenIds = new Set<string>();

      // Get existing IDs once for insert/update accounting
      const { data: existing } = await supabaseAdmin
        .from("sharetribe_test_listings")
        .select("id");
      const existingIds = new Set((existing ?? []).map((r: any) => r.id));

      while (page <= 50) {
        const res = await sdk.listings.query({ perPage, page });
        const batch = res?.data?.data ?? [];
        if (batch.length === 0) break;

        const rows = batch.map(mapListingRow).filter((r: any) => r.id);
        for (const r of rows) {
          seenIds.add(r.id);
          if (existingIds.has(r.id)) updated++;
          else inserted++;
        }

        const { error: upsertErr } = await supabaseAdmin
          .from("sharetribe_test_listings")
          .upsert(rows, { onConflict: "id" });
        if (upsertErr) throw upsertErr;

        totalFetched += batch.length;
        const totalPages = res?.data?.meta?.totalPages;
        if (typeof totalPages === "number" && page >= totalPages) break;
        if (batch.length < perPage) break;
        page++;
      }

      if (runId) {
        await supabaseAdmin
          .from("sharetribe_test_sync_runs")
          .update({
            finished_at: new Date().toISOString(),
            total_fetched: totalFetched,
            inserted_count: inserted,
            updated_count: updated,
          })
          .eq("id", runId);
      }


      return { ok: true, totalFetched, inserted, updated, error: null, runId };
    } catch (e) {
      const msg = sdkErrorMessage(e);
      if (runId) {
        await supabaseAdmin
          .from("sharetribe_test_sync_runs")
          .update({ finished_at: new Date().toISOString(), error: msg })
          .eq("id", runId);
      }
      return { ok: false, totalFetched: 0, inserted: 0, updated: 0, error: msg, runId };
    }
  });

export type SdkSyncRun = {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  totalFetched: number;
  inserted: number;
  updated: number;
  error: string | null;
};

export const sdkTestLatestSyncRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ run: SdkSyncRun | null; rowCount: number }> => {
    await assertAdmin((context as any).userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("sharetribe_test_sync_runs")
      .select("id, started_at, finished_at, total_fetched, inserted_count, updated_count, error")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { count } = await supabaseAdmin
      .from("sharetribe_test_listings")
      .select("id", { count: "exact", head: true });
    return {
      run: data
        ? {
            id: data.id,
            startedAt: data.started_at,
            finishedAt: data.finished_at,
            totalFetched: data.total_fetched,
            inserted: data.inserted_count,
            updated: data.updated_count,
            error: data.error,
          }
        : null,
      rowCount: count ?? 0,
    };
  });

export const sdkTestListListings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        search: z.string().max(200).optional(),
        city: z.string().max(100).optional(),
        heated: z.enum(["yes", "no", "any"]).optional(),
        minGuests: z.number().int().min(0).max(1000).optional(),
        page: z.number().int().min(1).max(500).optional(),
        perPage: z.number().int().min(1).max(100).optional(),
      })
      .parse(d),
  )
  .handler(
    async ({ data, context }): Promise<{ items: SdkListing[]; total: number; error: string | null }> => {
      await assertAdmin((context as any).userId);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      try {
        const perPage = data.perPage ?? 25;
        const page = data.page ?? 1;
        const from = (page - 1) * perPage;
        const to = from + perPage - 1;

        let q = supabaseAdmin
          .from("sharetribe_test_listings")
          .select(
            "id, title, state, city, listing_type, pool_type, pool_size, pool_depth, max_guests, is_heated, amenities, price_cents, price_currency",
            { count: "exact" },
          )
          .order("last_synced_at", { ascending: false });

        if (data.search) q = q.ilike("title", `%${data.search}%`);
        if (data.city) q = q.ilike("city", `%${data.city}%`);
        if (data.heated === "yes") q = q.eq("is_heated", true);
        if (data.heated === "no") q = q.eq("is_heated", false);
        if (data.minGuests != null) q = q.gte("max_guests", data.minGuests);

        const { data: rows, count, error } = await q.range(from, to);
        if (error) throw error;

        const items: SdkListing[] = (rows ?? []).map((r: any) => ({
          id: r.id,
          title: r.title ?? "(untitled)",
          state: r.state ?? "unknown",
          priceCents: r.price_cents,
          priceCurrency: r.price_currency,
          city: r.city,
          listingType: r.listing_type,
          poolType: r.pool_type,
          poolSize: r.pool_size,
          poolDepth: r.pool_depth,
          maxGuests: r.max_guests,
          isHeated: r.is_heated,
          amenities: r.amenities ?? [],
        }));

        return { items, total: count ?? items.length, error: null };
      } catch (e) {
        return { items: [], total: 0, error: e instanceof Error ? e.message : String(e) };
      }
    },
  );
