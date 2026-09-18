/**
 * Sharetribe Integration API → Supabase sync.
 * Pulls all listings (any state) and upserts into public.synced_listings.
 * Server-only.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  integrationGet,
  type STImage,
  type STListing,
  type STResponse,
} from "./sharetribe.server";

const PER_PAGE = 100;

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "listing"
  );
}

const US_STATES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC","PR",
]);

/**
 * Extract a 2-letter US state code from a free-form address string.
 * Examples that match: "1311 Lower Seguin Rd, Marion, TX 78124, USA"
 *                      "..., Marion, TX, USA"
 *                      "..., Los Angeles, CA 90001"
 */
export function extractStateCode(address: string | null | undefined): string | null {
  if (!address) return null;
  // Match a 2-letter token preceded by a comma/space, optionally followed by ZIP.
  const matches = address.toUpperCase().match(/[, ]([A-Z]{2})(?=[ ,]|\s\d{5}|$)/g);
  if (!matches) return null;
  for (const m of matches) {
    const code = m.replace(/[^A-Z]/g, "");
    if (US_STATES.has(code)) return code;
  }
  return null;
}

const STATE_NAMES: Record<string, string> = {
  alabama:"AL",alaska:"AK",arizona:"AZ",arkansas:"AR",california:"CA",colorado:"CO",
  connecticut:"CT",delaware:"DE",florida:"FL",georgia:"GA",hawaii:"HI",idaho:"ID",
  illinois:"IL",indiana:"IN",iowa:"IA",kansas:"KS",kentucky:"KY",louisiana:"LA",
  maine:"ME",maryland:"MD",massachusetts:"MA",michigan:"MI",minnesota:"MN",
  mississippi:"MS",missouri:"MO",montana:"MT",nebraska:"NE",nevada:"NV",
  "new hampshire":"NH","new jersey":"NJ","new mexico":"NM","new york":"NY",
  "north carolina":"NC","north dakota":"ND",ohio:"OH",oklahoma:"OK",oregon:"OR",
  pennsylvania:"PA","rhode island":"RI","south carolina":"SC","south dakota":"SD",
  tennessee:"TN",texas:"TX",utah:"UT",vermont:"VT",virginia:"VA",washington:"WA",
  "west virginia":"WV",wisconsin:"WI",wyoming:"WY","district of columbia":"DC",
};

const ZIP_RE = /\b\d{5}(-\d{4})?\b/g;

/** Map a spelled-out state name inside an address to its 2-letter code. */
export function stateCodeFromFullName(address: string | null | undefined): string | null {
  if (!address) return null;
  for (const part of address.split(",")) {
    const cleaned = part.replace(ZIP_RE, "").trim().toLowerCase();
    const code = STATE_NAMES[cleaned];
    if (code) return code;
  }
  return null;
}

/**
 * Pull the city out of a formatted address by locating the state token and
 * taking the segment before it. Handles the shapes Sharetribe actually stores:
 *   "Albuquerque, NM" | "Dallas, GA 30157" | "Bloomfield Hills, Michigan 48301"
 *   "Nicholas Dr, Carlisle, PA 17015, USA"
 * Returns null rather than guessing when no state token is found.
 */
export function extractCityFromAddress(address: string | null | undefined): string | null {
  if (!address) return null;
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  for (let i = parts.length - 1; i >= 1; i--) {
    const tail = parts[i].replace(ZIP_RE, "").trim();
    if (!tail || /^(usa|united states)$/i.test(tail)) continue;
    const isState =
      US_STATES.has(tail.toUpperCase()) || STATE_NAMES[tail.toLowerCase()] !== undefined;
    if (!isState) continue;
    const city = parts[i - 1].replace(ZIP_RE, "").trim();
    if (city.length >= 2 && !/^\d+$/.test(city)) return city;
    return null;
  }
  return null;
}

function pickImages(
  listing: STListing,
  included: STResponse<unknown>["included"],
): { primary: string | null; all: string[] } {
  const refs = listing.relationships?.images?.data ?? [];
  if (!included || refs.length === 0) return { primary: null, all: [] };
  const urls: string[] = [];
  for (const ref of refs) {
    const img = included.find(
      (x) => x.type === "image" && x.id === ref.id,
    ) as STImage | undefined;
    if (!img) continue;
    const v = img.attributes.variants;
    const url =
      v["landscape-crop2x"]?.url ||
      v["landscape-crop"]?.url ||
      v["default"]?.url ||
      Object.values(v)[0]?.url;
    if (url) urls.push(url);
  }
  return { primary: urls[0] ?? null, all: urls };
}

function toRow(listing: STListing, included: STResponse<unknown>["included"]) {
  const a = listing.attributes;
  const pd = (a.publicData ?? {}) as Record<string, any>;
  const md = (a.metadata ?? {}) as Record<string, any>;
  const { primary, all } = pickImages(listing, included);

  const rawStateCode: string | null =
    pd.state ?? pd.stateCode ?? pd.location?.state ?? pd.address?.state ?? null;
  const address: string | null =
    pd.address?.formatted ?? pd.location?.address ?? pd.fullAddress ?? null;
  // Sharetribe public_data rarely carries a discrete city/state; fall back to
  // parsing the formatted address. Measured 2026-09-18: only 56 of 124 eligible
  // listings had publicData.city, while 123 had a parseable address — without
  // this fallback more than half the inventory can never match a city page.
  const city: string | null =
    (pd.city ?? pd.location?.city ?? pd.address?.city ?? null) ||
    extractCityFromAddress(address);
  const stateCode: string | null =
    (rawStateCode && rawStateCode.length === 2 ? rawStateCode.toUpperCase() : null) ??
    extractStateCode(address) ??
    stateCodeFromFullName(address);

  const amenities: string[] = Array.isArray(pd.amenities)
    ? pd.amenities.map(String)
    : [];
  const capacity: number | null =
    typeof pd.capacity === "number"
      ? pd.capacity
      : typeof pd.maxGuests === "number"
        ? pd.maxGuests
        : null;
  const category: string | null =
    pd.category ?? pd.listingType ?? pd.type ?? null;

  return {
    sharetribe_id: listing.id,
    slug: slugify(`${a.title}-${listing.id.slice(0, 8)}`),
    title: a.title ?? "Untitled",
    description: a.description ?? null,
    price_amount: a.price?.amount ?? null,
    price_currency: a.price?.currency ?? null,
    latitude: a.geolocation?.lat ?? null,
    longitude: a.geolocation?.lng ?? null,
    address,
    city,
    state_code: stateCode,
    city_slug: city ? slugify(city) : null,
    category,
    amenities,
    capacity,
    image_urls: all,
    primary_image_url: primary,
    author_id: listing.relationships?.author?.data?.id ?? null,
    state: a.state ?? "published",
    is_deleted: false,
    public_data: pd,
    metadata: md,
    st_created_at: a.createdAt ?? null,
    last_synced_at: new Date().toISOString(),
  };
}

export interface SyncResult {
  status: "success" | "error";
  totalProcessed: number;
  inserted: number;
  updated: number;
  failed: number;
  error?: string;
  durationMs: number;
}

export async function runListingSync(): Promise<SyncResult> {
  const startedAt = Date.now();

  const { data: logRow } = await supabaseAdmin
    .from("listing_sync_log")
    .insert({ status: "running" })
    .select("id")
    .single();
  const logId = logRow?.id as string | undefined;

  let page = 1;
  let totalProcessed = 0;
  let inserted = 0;
  let updated = 0;
  let failed = 0;
  let errorMessage: string | undefined;
  const seenIds: string[] = [];

  try {
    // Loop pages
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const resp = await integrationGet<STResponse<STListing[]>>(
        "/listings/query",
        {
          include: "images,author",
          "fields.image":
            "variants.default,variants.landscape-crop,variants.landscape-crop2x",
          perPage: PER_PAGE,
          page,
        },
      );

      const listings = resp.data ?? [];
      if (listings.length === 0) break;

      const rows = listings.map((l) => toRow(l, resp.included));

      // Determine which already exist for insert/update counters
      const ids = rows.map((r) => r.sharetribe_id);
      const { data: existing } = await supabaseAdmin
        .from("synced_listings")
        .select("sharetribe_id")
        .in("sharetribe_id", ids);
      const existingIds = new Set(
        (existing ?? []).map((r: any) => r.sharetribe_id as string),
      );

      const { error: upsertError } = await supabaseAdmin
        .from("synced_listings")
        .upsert(rows, { onConflict: "sharetribe_id" });

      if (upsertError) {
        failed += rows.length;
        errorMessage = upsertError.message;
        throw new Error(`Upsert failed: ${upsertError.message}`);
      }

      for (const r of rows) {
        seenIds.push(r.sharetribe_id);
        if (existingIds.has(r.sharetribe_id)) updated++;
        else inserted++;
      }
      totalProcessed += rows.length;

      const totalPages = resp.meta?.totalPages ?? 1;
      if (page >= totalPages || listings.length < PER_PAGE) break;
      page++;
      if (page > 500) break; // safety
    }

    // Tombstone listings that no longer appear
    if (seenIds.length > 0) {
      await supabaseAdmin
        .from("synced_listings")
        .update({ is_deleted: true, last_synced_at: new Date().toISOString() })
        .not("sharetribe_id", "in", `(${seenIds.map((i) => `"${i}"`).join(",")})`)
        .eq("is_deleted", false);
    }

    if (logId) {
      await supabaseAdmin
        .from("listing_sync_log")
        .update({
          status: "success",
          finished_at: new Date().toISOString(),
          total_processed: totalProcessed,
          inserted_count: inserted,
          updated_count: updated,
          failed_count: failed,
        })
        .eq("id", logId);
    }

    return {
      status: "success",
      totalProcessed,
      inserted,
      updated,
      failed,
      durationMs: Date.now() - startedAt,
    };
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    if (logId) {
      await supabaseAdmin
        .from("listing_sync_log")
        .update({
          status: "error",
          finished_at: new Date().toISOString(),
          total_processed: totalProcessed,
          inserted_count: inserted,
          updated_count: updated,
          failed_count: failed || 1,
          error_message: msg,
        })
        .eq("id", logId);
    }
    return {
      status: "error",
      totalProcessed,
      inserted,
      updated,
      failed: failed || 1,
      error: msg,
      durationMs: Date.now() - startedAt,
    };
  }
}
