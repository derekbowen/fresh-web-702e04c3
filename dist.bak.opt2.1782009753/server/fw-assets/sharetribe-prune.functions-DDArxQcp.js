import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { z } from "zod";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { r as requireSupabaseAuth } from "./auth-middleware-rMMNsPLB.js";
import { integrationGet } from "./sharetribe.server-BZ7y3aGI.js";
import { e as extractStateCode } from "./listing-sync.server-C2GpYdIM.js";
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
    data
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Admin access required");
}
const PER_PAGE = 100;
const HOST_PREFIXES = ["become-a-swimming-pool-host-", "become-a-pool-host-"];
const ES_PREFIX = "conviertete-en-anfitrion-de-piscina-";
const HOST_CATEGORIES = ["Host/City Acquisition", "Host Acquisition (City pSEO)", "Host/City Acquisition (ES)"];
function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "";
}
function deriveCityKeyFromListing(l) {
  const pd = l.attributes.publicData ?? {};
  const city = pd.city ?? pd.location?.city ?? pd.address?.city ?? null;
  const rawState = pd.state ?? pd.stateCode ?? pd.location?.state ?? pd.address?.state ?? null;
  const address = pd.address?.formatted ?? pd.location?.address ?? pd.fullAddress ?? null;
  const stateCode = (rawState && rawState.length === 2 ? rawState.toUpperCase() : null) ?? extractStateCode(address);
  if (!city || !stateCode) return null;
  return `${slugify(city)}-${stateCode.toLowerCase()}`;
}
function pageSlugToCityKey(slug) {
  if (!slug) return null;
  for (const p of HOST_PREFIXES) {
    if (slug.startsWith(p)) return slug.slice(p.length);
  }
  if (slug.startsWith(ES_PREFIX)) return slug.slice(ES_PREFIX.length);
  return null;
}
async function fetchAllSharetribeCityKeys() {
  const keys = /* @__PURE__ */ new Set();
  let totalListings = 0;
  let skipped = 0;
  let page = 1;
  while (true) {
    const resp = await integrationGet("/listings/query", {
      perPage: PER_PAGE,
      page
    });
    const items = resp.data ?? [];
    if (items.length === 0) break;
    totalListings += items.length;
    for (const l of items) {
      const k = deriveCityKeyFromListing(l);
      if (k) keys.add(k);
      else skipped++;
    }
    const totalPages = resp.meta?.totalPages ?? 1;
    if (page >= totalPages || items.length < PER_PAGE) break;
    page++;
    if (page > 200) break;
  }
  return {
    keys,
    totalListings,
    skipped,
    pagesScanned: page
  };
}
const previewSharetribePrune_createServerFn_handler = createServerRpc({
  id: "0247f74e677fb3a8b3da9eaf70efdf262b47841de6ed97c23286ec41ac700f11",
  name: "previewSharetribePrune",
  filename: "src/server/sharetribe-prune.functions.ts"
}, (opts) => previewSharetribePrune.__executeServer(opts));
const previewSharetribePrune = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(previewSharetribePrune_createServerFn_handler, async ({
  context
}) => {
  await assertAdmin(context.userId);
  const {
    keys,
    totalListings,
    skipped,
    pagesScanned
  } = await fetchAllSharetribeCityKeys();
  const {
    data: pages,
    error
  } = await supabaseAdmin.from("content_pages").select("id, slug, url_path, category").in("category", HOST_CATEGORIES);
  if (error) throw new Error(error.message);
  const rows = pages ?? [];
  let keepCount = 0;
  let deleteCount = 0;
  let unmatched = 0;
  const deleteSamples = [];
  const keepSamples = [];
  for (const r of rows) {
    const k = pageSlugToCityKey(r.slug);
    if (!k) {
      unmatched++;
      if (deleteSamples.length < 8) deleteSamples.push(`${r.url_path} (no city key)`);
      deleteCount++;
      continue;
    }
    if (keys.has(k)) {
      keepCount++;
      if (keepSamples.length < 8) keepSamples.push(r.url_path);
    } else {
      deleteCount++;
      if (deleteSamples.length < 8) deleteSamples.push(r.url_path);
    }
  }
  return {
    sharetribe: {
      totalListings,
      uniqueCityKeys: keys.size,
      skippedNoCity: skipped,
      pagesScanned,
      sampleKeys: Array.from(keys).slice(0, 12)
    },
    pages: {
      total: rows.length,
      keep: keepCount,
      toDelete: deleteCount,
      unmatchedSlug: unmatched,
      keepSamples,
      deleteSamples
    }
  };
});
const executeSharetribePrune_createServerFn_handler = createServerRpc({
  id: "558751776f24a095b0bbfad1dd5f86a27f253fc34f6dd6b1530c4aacc781993f",
  name: "executeSharetribePrune",
  filename: "src/server/sharetribe-prune.functions.ts"
}, (opts) => executeSharetribePrune.__executeServer(opts));
const executeSharetribePrune = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  confirm: z.literal("DELETE")
}).parse(d)).handler(executeSharetribePrune_createServerFn_handler, async ({
  context
}) => {
  await assertAdmin(context.userId);
  const {
    keys
  } = await fetchAllSharetribeCityKeys();
  const {
    data: pages,
    error
  } = await supabaseAdmin.from("content_pages").select("id, slug").in("category", HOST_CATEGORIES);
  if (error) throw new Error(error.message);
  const idsToDelete = [];
  for (const r of pages ?? []) {
    const k = pageSlugToCityKey(r.slug);
    if (!k || !keys.has(k)) idsToDelete.push(r.id);
  }
  if (idsToDelete.length === 0) {
    return {
      deleted: 0,
      kept: pages?.length ?? 0,
      keysFound: keys.size
    };
  }
  let deleted = 0;
  for (let i = 0; i < idsToDelete.length; i += 500) {
    const chunk = idsToDelete.slice(i, i + 500);
    const {
      error: delErr,
      count
    } = await supabaseAdmin.from("content_pages").delete({
      count: "exact"
    }).in("id", chunk);
    if (delErr) throw new Error(delErr.message);
    deleted += count ?? chunk.length;
  }
  return {
    deleted,
    kept: (pages?.length ?? 0) - deleted,
    keysFound: keys.size
  };
});
export {
  executeSharetribePrune_createServerFn_handler,
  previewSharetribePrune_createServerFn_handler
};
