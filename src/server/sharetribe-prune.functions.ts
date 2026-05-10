/**
 * Server functions to prune "Become a host" content pages down to the set
 * of cities that actually exist as Sharetribe listings.
 *
 * Source of truth: live Sharetribe Integration API (all listings, all states).
 * For each listing we derive `{citySlug}-{stateCode}` and keep only
 * content_pages whose host-acquisition slug matches that set.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  integrationGet,
  type STListing,
  type STResponse,
} from "./sharetribe.server";
import { extractStateCode } from "./listing-sync.server";

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Admin access required");
}

const PER_PAGE = 100;
const HOST_PREFIXES = [
  "become-a-swimming-pool-host-",
  "become-a-pool-host-",
];
const ES_PREFIX = "conviertete-en-anfitrion-de-piscina-";
const HOST_CATEGORIES = [
  "Host/City Acquisition",
  "Host Acquisition (City pSEO)",
  "Host/City Acquisition (ES)",
];

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || ""
  );
}

function deriveCityKeyFromListing(l: STListing): string | null {
  const pd = (l.attributes.publicData ?? {}) as Record<string, any>;
  const city: string | null =
    pd.city ?? pd.location?.city ?? pd.address?.city ?? null;
  const rawState: string | null =
    pd.state ?? pd.stateCode ?? pd.location?.state ?? pd.address?.state ?? null;
  const address: string | null =
    pd.address?.formatted ?? pd.location?.address ?? pd.fullAddress ?? null;
  const stateCode =
    (rawState && rawState.length === 2 ? rawState.toUpperCase() : null) ??
    extractStateCode(address);
  if (!city || !stateCode) return null;
  return `${slugify(city)}-${stateCode.toLowerCase()}`;
}

function pageSlugToCityKey(slug: string | null): string | null {
  if (!slug) return null;
  for (const p of HOST_PREFIXES) {
    if (slug.startsWith(p)) return slug.slice(p.length);
  }
  if (slug.startsWith(ES_PREFIX)) return slug.slice(ES_PREFIX.length);
  return null;
}

async function fetchAllSharetribeCityKeys(): Promise<{
  keys: Set<string>;
  totalListings: number;
  skipped: number;
  pagesScanned: number;
}> {
  const keys = new Set<string>();
  let totalListings = 0;
  let skipped = 0;
  let page = 1;
  while (true) {
    const resp = await integrationGet<STResponse<STListing[]>>(
      "/listings/query",
      { perPage: PER_PAGE, page },
    );
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
  return { keys, totalListings, skipped, pagesScanned: page };
}

export const previewSharetribePrune = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin((context as { userId: string }).userId);
    const { keys, totalListings, skipped, pagesScanned } =
      await fetchAllSharetribeCityKeys();

    const { data: pages, error } = await supabaseAdmin
      .from("content_pages")
      .select("id, slug, url_path, category")
      .in("category", HOST_CATEGORIES);
    if (error) throw new Error(error.message);

    const rows = pages ?? [];
    let keepCount = 0;
    let deleteCount = 0;
    let unmatched = 0;
    const deleteSamples: string[] = [];
    const keepSamples: string[] = [];
    for (const r of rows) {
      const k = pageSlugToCityKey(r.slug as string | null);
      if (!k) {
        unmatched++;
        if (deleteSamples.length < 8) deleteSamples.push(`${r.url_path} (no city key)`);
        deleteCount++;
        continue;
      }
      if (keys.has(k)) {
        keepCount++;
        if (keepSamples.length < 8) keepSamples.push(r.url_path as string);
      } else {
        deleteCount++;
        if (deleteSamples.length < 8) deleteSamples.push(r.url_path as string);
      }
    }

    return {
      sharetribe: {
        totalListings,
        uniqueCityKeys: keys.size,
        skippedNoCity: skipped,
        pagesScanned,
        sampleKeys: Array.from(keys).slice(0, 12),
      },
      pages: {
        total: rows.length,
        keep: keepCount,
        toDelete: deleteCount,
        unmatchedSlug: unmatched,
        keepSamples,
        deleteSamples,
      },
    };
  });

export const executeSharetribePrune = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ confirm: z.literal("DELETE") }).parse(d))
  .handler(async () => {
    const { userId } = ctx.context as { userId: string }; await assertAdmin(userId);
    const { keys } = await fetchAllSharetribeCityKeys();

    const { data: pages, error } = await supabaseAdmin
      .from("content_pages")
      .select("id, slug")
      .in("category", HOST_CATEGORIES);
    if (error) throw new Error(error.message);

    const idsToDelete: string[] = [];
    for (const r of pages ?? []) {
      const k = pageSlugToCityKey(r.slug as string | null);
      if (!k || !keys.has(k)) idsToDelete.push(r.id as string);
    }

    if (idsToDelete.length === 0) {
      return { deleted: 0, kept: (pages?.length ?? 0), keysFound: keys.size };
    }

    // Delete in chunks of 500 to avoid URL length issues
    let deleted = 0;
    for (let i = 0; i < idsToDelete.length; i += 500) {
      const chunk = idsToDelete.slice(i, i + 500);
      const { error: delErr, count } = await supabaseAdmin
        .from("content_pages")
        .delete({ count: "exact" })
        .in("id", chunk);
      if (delErr) throw new Error(delErr.message);
      deleted += count ?? chunk.length;
    }
    return {
      deleted,
      kept: (pages?.length ?? 0) - deleted,
      keysFound: keys.size,
    };
  });
