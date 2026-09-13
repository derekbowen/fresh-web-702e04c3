/**
 * Phase 1b worker — move listing image BYTES from Sharetribe's imgix account
 * onto PRNM-owned Supabase Storage.
 *
 * Why this is urgent rather than merely useful: synced_listings persists only a
 * resolved, signed sharetribe.imgix.net URL. No bytes are held, the image UUID
 * is not a column, and the `s=` signature is an HMAC on Sharetribe's secret. So
 * every listing photo 404s the moment that account goes away, and the originals
 * become unfetchable at the same instant. This is the one migration item where
 * delay destroys the option.
 *
 * SCOPE:
 *   • READS from Sharetribe (Integration API), WRITES only to Supabase.
 *     Nothing here mutates Sharetribe.
 *   • Does not touch transactions, auth, Stripe, payouts or messaging.
 *   • Does not change listing-sync.server.ts. It issues its own variant request
 *     so the existing image_urls column and today's rendering stay untouched.
 *   • Additive: writes prnm_* columns only. PRNM_IMAGE_SOURCE decides whether
 *     anything serves them, and defaults to sharetribe.
 *
 * Resumable and idempotent. Every image is one row in listing_image_assets keyed
 * on the Sharetribe image UUID; storage paths are deterministic so a retry
 * overwrites rather than orphaning. Safe to run repeatedly and safe to kill
 * mid-run.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  buildPrnmImageColumns,
  extensionForContentType,
  LISTING_IMAGE_BUCKET,
  pickRehostVariant,
  REHOST_IMAGE_FIELDS,
  storagePathFor,
  type SharetribeVariant,
  type StoredAssetRow,
} from "@/lib/listing-images";
import { integrationGet, type STResponse } from "./sharetribe.server";
import type { Database } from "@/integrations/supabase/types";

type ListingImageAssetInsert = Database["public"]["Tables"]["listing_image_assets"]["Insert"];
type ListingImageStatus = Database["public"]["Enums"]["listing_image_status"];

const PER_PAGE = 100;
/** Bytes above this are refused rather than streamed into memory. */
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
/** Give up on one download rather than hanging the run. */
const FETCH_TIMEOUT_MS = 30_000;
/** A failed asset stops being retried after this many attempts. */
export const MAX_ATTEMPTS = 4;

interface STImageLike {
  id: string;
  type: string;
  attributes?: { variants?: Record<string, SharetribeVariant> };
}

interface STListingLike {
  id: string;
  attributes?: { state?: string };
  relationships?: { images?: { data?: Array<{ id: string; type: string }> } };
}

export interface RehostStats {
  listingsScanned: number;
  imagesDiscovered: number;
  stored: number;
  skippedAlreadyStored: number;
  failed: number;
  unavailable: number;
  bytesStored: number;
  listingsBackfilled: number;
  errors: string[];
}

const emptyStats = (): RehostStats => ({
  listingsScanned: 0,
  imagesDiscovered: 0,
  stored: 0,
  skippedAlreadyStored: 0,
  failed: 0,
  unavailable: 0,
  bytesStored: 0,
  listingsBackfilled: 0,
  errors: [],
});

function unwrapId(v: unknown): string | null {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object" && v && "uuid" in (v as Record<string, unknown>)) {
    return String((v as Record<string, unknown>).uuid);
  }
  return null;
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes as unknown as ArrayBuffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ─────────────────────────────────────────────────────────────────────────────
// Discovery
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Enumerate published listings and their images, recording one pending row per
 * image. Pure discovery — no bytes are fetched here, so this stays cheap and can
 * be re-run to pick up newly uploaded photos.
 *
 * `states: published` only: draft and closed listings are not publicly
 * renderable, so their bytes are not worth the storage or the API budget.
 */
export async function discoverListingImages(
  opts: { listingId?: string; maxPages?: number } = {},
): Promise<{ stats: RehostStats; imageIds: string[] }> {
  const stats = emptyStats();
  const imageIds: string[] = [];
  const maxPages = opts.maxPages ?? 500;

  let page = 1;
  while (page <= maxPages) {
    let resp: STResponse<STListingLike[]>;
    try {
      resp = await integrationGet<STResponse<STListingLike[]>>("/listings/query", {
        ...(opts.listingId ? { ids: opts.listingId } : {}),
        states: "published",
        include: "images",
        "fields.image": REHOST_IMAGE_FIELDS,
        perPage: PER_PAGE,
        page,
        sort: "createdAt",
      });
    } catch (e) {
      stats.errors.push(`discovery page ${page}: ${(e as Error).message}`);
      break;
    }

    const listings = resp.data ?? [];
    if (listings.length === 0) break;

    const included = (resp.included ?? []) as STImageLike[];
    const imageById = new Map<string, STImageLike>();
    for (const inc of included) {
      if (inc.type === "image") {
        const id = unwrapId(inc.id);
        if (id) imageById.set(id, inc);
      }
    }

    const rows: ListingImageAssetInsert[] = [];
    for (const listing of listings) {
      const listingId = unwrapId(listing.id);
      if (!listingId) continue;
      stats.listingsScanned += 1;

      const refs = listing.relationships?.images?.data ?? [];
      refs.forEach((ref, position) => {
        const imageId = unwrapId(ref.id);
        if (!imageId) return;
        stats.imagesDiscovered += 1;
        imageIds.push(imageId);

        const pick = pickRehostVariant(imageById.get(imageId)?.attributes?.variants);
        rows.push({
          sharetribe_image_id: imageId,
          listing_st_id: listingId,
          position,
          source_url: pick?.url ?? null,
          source_variant: pick?.variant ?? null,
          // No usable variant is terminal, not a transient failure.
          status: pick ? "pending" : "unavailable",
          last_error: pick ? null : "Sharetribe offered no usable image variant",
        });
      });
    }

    if (rows.length > 0) {
      // ignoreDuplicates so an already-stored asset is never reset to pending by
      // a later discovery run. Re-driving a stored asset is what --retry-failed
      // and --force are for.
      const { error } = await supabaseAdmin
        .from("listing_image_assets")
        .upsert(rows, { onConflict: "sharetribe_image_id", ignoreDuplicates: true });
      if (error) stats.errors.push(`discovery upsert page ${page}: ${error.message}`);
    }

    const totalPages = resp.meta?.totalPages ?? page;
    if (page >= totalPages || listings.length < PER_PAGE) break;
    page += 1;
  }

  return { stats, imageIds };
}

// ─────────────────────────────────────────────────────────────────────────────
// Byte transfer
// ─────────────────────────────────────────────────────────────────────────────

interface ClaimedAsset {
  sharetribe_image_id: string;
  listing_st_id: string;
  source_url: string | null;
  source_variant: string | null;
  attempts: number;
}

/** Oldest-first so a long run makes even progress rather than churning one listing. */
async function claimAssets(limit: number, which: "pending" | "failed"): Promise<ClaimedAsset[]> {
  let q = supabaseAdmin
    .from("listing_image_assets")
    .select("sharetribe_image_id, listing_st_id, source_url, source_variant, attempts")
    .eq("status", which)
    .not("source_url", "is", null);

  if (which === "failed") q = q.lt("attempts", MAX_ATTEMPTS);

  const { data, error } = await q
    .order("created_at", { ascending: true })
    .order("sharetribe_image_id", { ascending: true })
    .limit(limit);

  if (error) throw new Error(`claim ${which}: ${error.message}`);
  return (data ?? []) as ClaimedAsset[];
}

async function markFailed(asset: ClaimedAsset, message: string): Promise<void> {
  await supabaseAdmin
    .from("listing_image_assets")
    .update({
      status: "failed",
      attempts: asset.attempts + 1,
      last_error: message.slice(0, 500),
    })
    .eq("sharetribe_image_id", asset.sharetribe_image_id);
}

/**
 * Fetch one image and put it in the bucket.
 *
 * Reads from Sharetribe's CDN with the already-signed URL recorded at discovery,
 * so no signing is attempted and no Sharetribe state is touched.
 */
async function transferOne(
  asset: ClaimedAsset,
  stats: RehostStats,
  dryRun: boolean,
): Promise<void> {
  const sourceUrl = asset.source_url;
  if (!sourceUrl) {
    await markFailed(asset, "no source_url recorded");
    stats.failed += 1;
    return;
  }

  let bytes: Uint8Array;
  let contentType: string;
  try {
    const res = await fetch(sourceUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) {
      await markFailed(asset, `source fetch ${res.status}`);
      stats.failed += 1;
      return;
    }
    contentType = (res.headers.get("content-type") ?? "image/jpeg").split(";")[0]!.trim();
    const buf = await res.arrayBuffer();
    if (buf.byteLength === 0) {
      await markFailed(asset, "source returned 0 bytes");
      stats.failed += 1;
      return;
    }
    if (buf.byteLength > MAX_IMAGE_BYTES) {
      await markFailed(asset, `source too large: ${buf.byteLength} bytes`);
      stats.failed += 1;
      return;
    }
    bytes = new Uint8Array(buf);
  } catch (e) {
    await markFailed(asset, `source fetch threw: ${(e as Error).message}`);
    stats.failed += 1;
    return;
  }

  const path = storagePathFor(asset.listing_st_id, asset.sharetribe_image_id, contentType);

  if (dryRun) {
    stats.stored += 1;
    stats.bytesStored += bytes.byteLength;
    return;
  }

  const { error: upErr } = await supabaseAdmin.storage
    .from(LISTING_IMAGE_BUCKET)
    .upload(path, bytes, {
      contentType,
      // Deterministic path + upsert means a retry replaces the object rather
      // than failing on conflict or leaving a duplicate behind.
      upsert: true,
      cacheControl: "31536000",
    });
  if (upErr) {
    await markFailed(asset, `storage upload: ${upErr.message}`);
    stats.failed += 1;
    return;
  }

  const { data: pub } = supabaseAdmin.storage.from(LISTING_IMAGE_BUCKET).getPublicUrl(path);
  const publicUrl = pub?.publicUrl;
  if (!publicUrl) {
    await markFailed(asset, "no public URL returned for uploaded object");
    stats.failed += 1;
    return;
  }

  const { error: updErr } = await supabaseAdmin
    .from("listing_image_assets")
    .update({
      status: "stored",
      storage_path: path,
      public_url: publicUrl,
      content_type: contentType,
      bytes: bytes.byteLength,
      sha256: await sha256Hex(bytes),
      attempts: asset.attempts + 1,
      last_error: null,
      stored_at: new Date().toISOString(),
    })
    .eq("sharetribe_image_id", asset.sharetribe_image_id);

  if (updErr) {
    // The object is in the bucket but we failed to record it. Mark failed so a
    // retry re-records; the upload itself is idempotent so that is harmless.
    await markFailed(asset, `record stored: ${updErr.message}`);
    stats.failed += 1;
    return;
  }

  stats.stored += 1;
  stats.bytesStored += bytes.byteLength;
}

/** Bounded concurrency without pulling in a dependency. */
async function runPool<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(concurrency, items.length)) }, () =>
    (async () => {
      for (;;) {
        const index = cursor++;
        if (index >= items.length) return;
        await fn(items[index]!);
      }
    })(),
  );
  await Promise.all(workers);
}

// ─────────────────────────────────────────────────────────────────────────────
// Backfill
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Recompute prnm_image_urls / prnm_primary_image_url for the listings touched.
 *
 * Only these three columns are written, so a concurrent runListingSync upsert
 * cannot clobber them and this cannot clobber anything the sync owns.
 */
export async function backfillListingImageColumns(
  listingIds: readonly string[],
  stats: RehostStats,
): Promise<void> {
  const unique = [...new Set(listingIds)].filter(Boolean);

  for (const listingId of unique) {
    const { data, error } = await supabaseAdmin
      .from("listing_image_assets")
      .select("sharetribe_image_id, position, public_url, status")
      .eq("listing_st_id", listingId);

    if (error) {
      stats.errors.push(`backfill read ${listingId}: ${error.message}`);
      continue;
    }

    const columns = buildPrnmImageColumns((data ?? []) as StoredAssetRow[]);
    const { error: updErr } = await supabaseAdmin
      .from("synced_listings")
      .update({ ...columns, prnm_images_synced_at: new Date().toISOString() })
      .eq("sharetribe_id", listingId);

    if (updErr) {
      stats.errors.push(`backfill write ${listingId}: ${updErr.message}`);
      continue;
    }
    stats.listingsBackfilled += 1;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────────────────

export interface RehostOptions {
  /** Stop after transferring this many images. */
  limit?: number;
  /** Only this Sharetribe listing id. */
  listingId?: string;
  /** Skip discovery and re-drive previously failed assets instead. */
  retryFailed?: boolean;
  /** Parallel downloads. Keep modest — this reads Sharetribe's CDN. */
  concurrency?: number;
  /** Fetch and measure, but upload nothing and record nothing. */
  dryRun?: boolean;
  /** Skip the discovery pass and work whatever is already pending. */
  skipDiscovery?: boolean;
}

export async function runListingImageRehost(opts: RehostOptions = {}): Promise<RehostStats> {
  const limit = opts.limit ?? 200;
  const concurrency = Math.max(1, Math.min(opts.concurrency ?? 4, 16));
  const stats = emptyStats();

  if (!opts.retryFailed && !opts.skipDiscovery) {
    const discovery = await discoverListingImages({ listingId: opts.listingId });
    stats.listingsScanned = discovery.stats.listingsScanned;
    stats.imagesDiscovered = discovery.stats.imagesDiscovered;
    stats.errors.push(...discovery.stats.errors);
  }

  const claimed = await claimAssets(limit, opts.retryFailed ? "failed" : "pending");
  if (claimed.length === 0) return stats;

  await runPool(claimed, concurrency, (asset) => transferOne(asset, stats, !!opts.dryRun));

  if (!opts.dryRun) {
    await backfillListingImageColumns(
      claimed.map((a) => a.listing_st_id),
      stats,
    );
  }

  return stats;
}

/** Progress, for the CLI and any future dashboard. */
export async function listingImageRehostProgress(): Promise<{
  byStatus: Record<string, number>;
  listingsWithPrnmHero: number | null;
  listingsPublished: number | null;
}> {
  const byStatus: Record<string, number> = {};
  const STATUSES: ListingImageStatus[] = ["pending", "stored", "failed", "unavailable"];
  for (const status of STATUSES) {
    const { count } = await supabaseAdmin
      .from("listing_image_assets")
      .select("sharetribe_image_id", { count: "exact", head: true })
      .eq("status", status);
    byStatus[status] = count ?? 0;
  }

  const published = await supabaseAdmin
    .from("synced_listings")
    .select("sharetribe_id", { count: "exact", head: true })
    .eq("state", "published")
    .eq("is_deleted", false);

  const withHero = await supabaseAdmin
    .from("synced_listings")
    .select("sharetribe_id", { count: "exact", head: true })
    .eq("state", "published")
    .eq("is_deleted", false)
    .not("prnm_primary_image_url", "is", null);

  return {
    byStatus,
    listingsPublished: published.count ?? null,
    listingsWithPrnmHero: withHero.count ?? null,
  };
}

export { extensionForContentType };
