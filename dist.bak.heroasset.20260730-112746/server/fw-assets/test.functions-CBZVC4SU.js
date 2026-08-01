import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-Bd-cw3tB.js";
import { c as createServerFn } from "../server.js";
import "@supabase/supabase-js";
import "./createMiddleware-BvN2ghIY.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "react";
import "@tanstack/react-router";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
async function assertAdmin(userId) {
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.js");
  const {
    data
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("forbidden");
}
const sdkTestPing_createServerFn_handler = createServerRpc({
  id: "3220eb433800b25c5f810959f64879d73d18cfeb19d9818ea64c407c59da931c",
  name: "sdkTestPing",
  filename: "src/lib/sharetribe-test/test.functions.ts"
}, (opts) => sdkTestPing.__executeServer(opts));
const sdkTestPing = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(sdkTestPing_createServerFn_handler, async ({
  context
}) => {
  await assertAdmin(context.userId);
  const {
    getTestSdkTrusted,
    sdkErrorMessage
  } = await import("./sdk.server-bBDjRaRc.js");
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
      error: null
    };
  } catch (e) {
    return {
      ok: false,
      marketplaceId: null,
      marketplaceName: null,
      marketplaceUrl: null,
      clientIdSuffix,
      error: sdkErrorMessage(e)
    };
  }
});
const sdkTestSearchListings_createServerFn_handler = createServerRpc({
  id: "6e4608bf43dd702cc180a74cf069bb720bf52a845530541f7254f38a4bcd4cc6",
  name: "sdkTestSearchListings",
  filename: "src/lib/sharetribe-test/test.functions.ts"
}, (opts) => sdkTestSearchListings.__executeServer(opts));
const sdkTestSearchListings = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  keywords: z.string().max(200).optional(),
  page: z.number().int().min(1).max(50).optional(),
  perPage: z.number().int().min(1).max(50).optional()
}).parse(d)).handler(sdkTestSearchListings_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    getTestSdkTrusted,
    sdkErrorMessage
  } = await import("./sdk.server-bBDjRaRc.js");
  try {
    const sdk = getTestSdkTrusted();
    const params = {
      perPage: data.perPage ?? 10,
      page: data.page ?? 1
    };
    if (data.keywords) params.keywords = data.keywords;
    const res = await sdk.listings.query(params);
    const items = (res?.data?.data ?? []).map((l) => {
      const attrs = l.attributes ?? {};
      const pd = attrs.publicData ?? {};
      const heatedRaw = pd.is_heated;
      const isHeated = heatedRaw === true || heatedRaw === "yes" ? true : heatedRaw === false || heatedRaw === "no" ? false : null;
      const maxGuestsRaw = pd.max_guests ?? pd.maxGuests;
      const maxGuests = typeof maxGuestsRaw === "number" ? maxGuestsRaw : typeof maxGuestsRaw === "string" && maxGuestsRaw.trim() !== "" ? Number(maxGuestsRaw) || null : null;
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
        amenities: Array.isArray(pd.poolAmenities) ? pd.poolAmenities : Array.isArray(pd.amenities) ? pd.amenities : []
      };
    });
    return {
      items,
      total: res?.data?.meta?.totalItems ?? items.length,
      error: null
    };
  } catch (e) {
    return {
      items: [],
      total: 0,
      error: sdkErrorMessage(e)
    };
  }
});
function mapListingRow(l) {
  const attrs = l.attributes ?? {};
  const pd = attrs.publicData ?? {};
  const heatedRaw = pd.is_heated;
  const isHeated = heatedRaw === true || heatedRaw === "yes" ? true : heatedRaw === false || heatedRaw === "no" ? false : null;
  const maxGuestsRaw = pd.max_guests ?? pd.maxGuests;
  const maxGuests = typeof maxGuestsRaw === "number" ? maxGuestsRaw : typeof maxGuestsRaw === "string" && maxGuestsRaw.trim() !== "" ? Number(maxGuestsRaw) || null : null;
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
    amenities: Array.isArray(pd.poolAmenities) ? pd.poolAmenities : Array.isArray(pd.amenities) ? pd.amenities : [],
    price_cents: attrs.price?.amount ?? null,
    price_currency: attrs.price?.currency ?? null,
    raw: l,
    last_synced_at: (/* @__PURE__ */ new Date()).toISOString()
  };
}
const sdkTestSyncListings_createServerFn_handler = createServerRpc({
  id: "6b3775c9075af404e7422ce4ee23e6a3ac9867e895ae2e4a9c80cd68d478c21f",
  name: "sdkTestSyncListings",
  filename: "src/lib/sharetribe-test/test.functions.ts"
}, (opts) => sdkTestSyncListings.__executeServer(opts));
const sdkTestSyncListings = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(sdkTestSyncListings_createServerFn_handler, async ({
  context
}) => {
  await assertAdmin(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.js");
  const {
    getTestSdkTrusted,
    sdkErrorMessage
  } = await import("./sdk.server-bBDjRaRc.js");
  const {
    data: runRow
  } = await supabaseAdmin.from("sharetribe_test_sync_runs").insert({
    triggered_by: context.userId
  }).select("id").single();
  const runId = runRow?.id ?? null;
  try {
    const sdk = getTestSdkTrusted();
    const perPage = 100;
    let page = 1;
    let totalFetched = 0;
    let inserted = 0;
    let updated = 0;
    const seenIds = /* @__PURE__ */ new Set();
    const {
      data: existing
    } = await supabaseAdmin.from("sharetribe_test_listings").select("id");
    const existingIds = new Set((existing ?? []).map((r) => r.id));
    while (page <= 50) {
      const res = await sdk.listings.query({
        perPage,
        page
      });
      const batch = res?.data?.data ?? [];
      if (batch.length === 0) break;
      const rows = batch.map(mapListingRow).filter((r) => r.id);
      for (const r of rows) {
        seenIds.add(r.id);
        if (existingIds.has(r.id)) updated++;
        else inserted++;
      }
      const {
        error: upsertErr
      } = await supabaseAdmin.from("sharetribe_test_listings").upsert(rows, {
        onConflict: "id"
      });
      if (upsertErr) throw upsertErr;
      totalFetched += batch.length;
      const totalPages = res?.data?.meta?.totalPages;
      if (typeof totalPages === "number" && page >= totalPages) break;
      if (batch.length < perPage) break;
      page++;
    }
    if (runId) {
      await supabaseAdmin.from("sharetribe_test_sync_runs").update({
        finished_at: (/* @__PURE__ */ new Date()).toISOString(),
        total_fetched: totalFetched,
        inserted_count: inserted,
        updated_count: updated
      }).eq("id", runId);
    }
    return {
      ok: true,
      totalFetched,
      inserted,
      updated,
      error: null,
      runId
    };
  } catch (e) {
    const msg = sdkErrorMessage(e);
    if (runId) {
      await supabaseAdmin.from("sharetribe_test_sync_runs").update({
        finished_at: (/* @__PURE__ */ new Date()).toISOString(),
        error: msg
      }).eq("id", runId);
    }
    return {
      ok: false,
      totalFetched: 0,
      inserted: 0,
      updated: 0,
      error: msg,
      runId
    };
  }
});
const sdkTestLatestSyncRun_createServerFn_handler = createServerRpc({
  id: "a2cd98b5ad2648e15b0286a148f663249099824e5f4b0949bc5dd0c09c97b584",
  name: "sdkTestLatestSyncRun",
  filename: "src/lib/sharetribe-test/test.functions.ts"
}, (opts) => sdkTestLatestSyncRun.__executeServer(opts));
const sdkTestLatestSyncRun = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(sdkTestLatestSyncRun_createServerFn_handler, async ({
  context
}) => {
  await assertAdmin(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.js");
  const {
    data
  } = await supabaseAdmin.from("sharetribe_test_sync_runs").select("id, started_at, finished_at, total_fetched, inserted_count, updated_count, error").order("started_at", {
    ascending: false
  }).limit(1).maybeSingle();
  const {
    count
  } = await supabaseAdmin.from("sharetribe_test_listings").select("id", {
    count: "exact",
    head: true
  });
  return {
    run: data ? {
      id: data.id,
      startedAt: data.started_at,
      finishedAt: data.finished_at,
      totalFetched: data.total_fetched,
      inserted: data.inserted_count,
      updated: data.updated_count,
      error: data.error
    } : null,
    rowCount: count ?? 0
  };
});
const sdkTestListListings_createServerFn_handler = createServerRpc({
  id: "7c3f919066b044439f7f2c68b3098e9b82179ed6b72e2e5cbd4d1a78217e2af0",
  name: "sdkTestListListings",
  filename: "src/lib/sharetribe-test/test.functions.ts"
}, (opts) => sdkTestListListings.__executeServer(opts));
const sdkTestListListings = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  search: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  heated: z.enum(["yes", "no", "any"]).optional(),
  minGuests: z.number().int().min(0).max(1e3).optional(),
  page: z.number().int().min(1).max(500).optional(),
  perPage: z.number().int().min(1).max(100).optional()
}).parse(d)).handler(sdkTestListListings_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.js");
  try {
    const perPage = data.perPage ?? 25;
    const page = data.page ?? 1;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    let q = supabaseAdmin.from("sharetribe_test_listings").select("id, title, state, city, listing_type, pool_type, pool_size, pool_depth, max_guests, is_heated, amenities, price_cents, price_currency", {
      count: "exact"
    }).order("last_synced_at", {
      ascending: false
    });
    if (data.search) q = q.ilike("title", `%${data.search}%`);
    if (data.city) q = q.ilike("city", `%${data.city}%`);
    if (data.heated === "yes") q = q.eq("is_heated", true);
    if (data.heated === "no") q = q.eq("is_heated", false);
    if (data.minGuests != null) q = q.gte("max_guests", data.minGuests);
    const {
      data: rows,
      count,
      error
    } = await q.range(from, to);
    if (error) throw error;
    const items = (rows ?? []).map((r) => ({
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
      amenities: r.amenities ?? []
    }));
    return {
      items,
      total: count ?? items.length,
      error: null
    };
  } catch (e) {
    return {
      items: [],
      total: 0,
      error: e instanceof Error ? e.message : String(e)
    };
  }
});
export {
  sdkTestLatestSyncRun_createServerFn_handler,
  sdkTestListListings_createServerFn_handler,
  sdkTestPing_createServerFn_handler,
  sdkTestSearchListings_createServerFn_handler,
  sdkTestSyncListings_createServerFn_handler
};
