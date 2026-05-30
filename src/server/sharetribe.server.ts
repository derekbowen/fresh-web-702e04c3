/**
 * Sharetribe API client (server-only).
 *
 * Two clients are configured:
 *
 * 1. Marketplace API (public-read) — for public-facing listing browsing.
 *    Uses SHARETRIBE_CLIENT_ID. Returns only published listings.
 *      POST https://flex-api.sharetribe.com/v1/auth/token
 *           client_id, grant_type=client_credentials, scope=public-read
 *      GET  https://flex-api.sharetribe.com/v1/api/listings/{query|show}
 *
 * 2. Integration API (integ) — for admin / write / all-states reads.
 *    Uses SHARETRIBE_INTEG_CLIENT_ID + SHARETRIBE_INTEG_CLIENT_SECRET.
 *    Returns ALL listings including draft/pending/closed.
 *      POST https://flex-integ-api.sharetribe.com/v1/auth/token
 *           client_id, client_secret, grant_type=client_credentials, scope=integ
 *      GET  https://flex-integ-api.sharetribe.com/v1/integration_api/...
 *
 * Default for public reads (`integGet`) uses the public-read client.
 * Use `integrationGet` / `integrationPost` for Integration API calls.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const MARKETPLACE_API_BASE = "https://flex-api.sharetribe.com";
const INTEGRATION_API_BASE = "https://flex-integ-api.sharetribe.com";

type TokenCache = { token: string; expiresAt: number } | null;
let publicTokenCache: TokenCache = null;
let integTokenCache: TokenCache = null;

function getPublicClientId(): string {
  const id = process.env.SHARETRIBE_CLIENT_ID;
  if (!id) throw new Error("SHARETRIBE_CLIENT_ID is not configured");
  return id;
}

function getIntegClientId(): string {
  const id = process.env.SHARETRIBE_INTEG_CLIENT_ID;
  if (!id) throw new Error("SHARETRIBE_INTEG_CLIENT_ID is not configured");
  return id;
}

function getIntegClientSecret(): string {
  const s = process.env.SHARETRIBE_INTEG_CLIENT_SECRET;
  if (!s) throw new Error("SHARETRIBE_INTEG_CLIENT_SECRET is not configured");
  return s;
}

/**
 * Get a Marketplace API access token (scope=public-read). Cached in-memory.
 * The public-read flow is client_id-only — no client_secret required.
 */
async function getPublicReadToken(): Promise<string> {
  const now = Date.now();
  if (publicTokenCache && publicTokenCache.expiresAt > now + 30_000) {
    return publicTokenCache.token;
  }

  const body = new URLSearchParams({
    client_id: getPublicClientId(),
    grant_type: "client_credentials",
    scope: "public-read",
  });

  const res = await fetch(`${MARKETPLACE_API_BASE}/v1/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Sharetribe public-read auth failed [${res.status}]: ${text.slice(0, 200)}`,
    );
  }

  const json = (await res.json()) as { access_token: string; expires_in: number };
  publicTokenCache = {
    token: json.access_token,
    expiresAt: now + (json.expires_in ?? 3600) * 1000,
  };
  return json.access_token;
}

/**
 * Get an Integration API access token (scope=integ). Cached in-memory.
 */
async function getIntegrationToken(): Promise<string> {
  const now = Date.now();
  if (integTokenCache && integTokenCache.expiresAt > now + 30_000) {
    return integTokenCache.token;
  }

  const body = new URLSearchParams({
    client_id: getIntegClientId(),
    client_secret: getIntegClientSecret(),
    grant_type: "client_credentials",
    scope: "integ",
  });

  const res = await fetch(`${INTEGRATION_API_BASE}/v1/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Sharetribe integ auth failed [${res.status}]: ${text.slice(0, 200)}`,
    );
  }

  const json = (await res.json()) as { access_token: string; expires_in: number };
  integTokenCache = {
    token: json.access_token,
    expiresAt: now + (json.expires_in ?? 3600) * 1000,
  };
  return json.access_token;
}

/** Marketplace API GET (public-read scope). Used by public listing browse. */
async function integGet<T = unknown>(
  path: string,
  query: Record<string, string | number | boolean | undefined> = {},
): Promise<T> {
  const token = await getPublicReadToken();

  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== "") {
      // Marketplace API public-read does not support `states` filter
      // (only published listings are returned).
      if (k === "states") continue;
      params.set(k, String(v));
    }
  }

  const url = `${MARKETPLACE_API_BASE}/v1/api${path}${params.size ? `?${params}` : ""}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Sharetribe ${path} failed [${res.status}]: ${text.slice(0, 200)}`,
    );
  }
  return (await res.json()) as T;
}

/** Integration API GET (integ scope). For admin reads incl. all states. */
export async function integrationGet<T = unknown>(
  path: string,
  query: Record<string, string | number | boolean | undefined> = {},
): Promise<T> {
  const token = await getIntegrationToken();

  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== "") {
      params.set(k, String(v));
    }
  }

  const url = `${INTEGRATION_API_BASE}/v1/integration_api${path}${params.size ? `?${params}` : ""}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Sharetribe integ ${path} failed [${res.status}]: ${text.slice(0, 200)}`,
    );
  }
  return (await res.json()) as T;
}

/** Integration API POST (integ scope). For admin writes / transitions. */
export async function integrationPost<T = unknown>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const token = await getIntegrationToken();
  const url = `${INTEGRATION_API_BASE}/v1/integration_api${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/transit+json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Sharetribe integ POST ${path} failed [${res.status}]: ${text.slice(0, 200)}`,
    );
  }
  return (await res.json()) as T;
}

// ---------- Types (subset of Sharetribe response shape) ----------

export interface STImageVariant {
  url: string;
  width: number;
  height: number;
}
export interface STImage {
  id: string;
  type: "image";
  attributes: { variants: Record<string, STImageVariant> };
}

export interface STListing {
  id: string;
  type: "listing";
  attributes: {
    title: string;
    description: string;
    geolocation?: { lat: number; lng: number } | null;
    price?: { amount: number; currency: string } | null;
    publicData?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    state: string;
    createdAt: string;
  };
  relationships?: {
    images?: { data: Array<{ id: string; type: "image" }> };
    author?: { data: { id: string; type: "user" } };
  };
}

export interface STResponse<T> {
  data: T;
  included?: Array<STImage | { id: string; type: string; attributes: unknown }>;
  meta?: {
    totalItems?: number;
    totalPages?: number;
    page?: number;
    perPage?: number;
  };
}

// ---------- Public helpers ----------

export interface ListingReview {
  /** 1–5 star rating left by the guest */
  rating: number;
  /** Review body text */
  body: string;
  /** Author display name (Sharetribe profile.displayName or abbreviated) */
  authorName: string;
  /** ISO timestamp the review was created */
  createdAt: string;
}

export interface ListingSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: { amount: number; currency: string } | null;
  city: string | null;
  state: string | null;
  imageUrl: string | null;
  url: string;
  geolocation: { lat: number; lng: number } | null;
  /** Approx miles from visitor (server-computed via Cloudflare geo). */
  distanceMiles?: number | null;
  /** Public guest-of-host reviews, newest first. Empty array if none. */
  reviews?: ListingReview[];
  /** Aggregate of `reviews` for convenient JSON-LD wiring. */
  aggregateRating?: { value: number; count: number } | null;
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "pool"
  );
}

function pickImage(
  listing: STListing,
  included: STResponse<unknown>["included"],
): string | null {
  const imgRef = listing.relationships?.images?.data?.[0];
  if (!imgRef || !included) return null;
  const img = included.find(
    (x) => x.type === "image" && x.id === imgRef.id,
  ) as STImage | undefined;
  if (!img) return null;
  const variants = img.attributes.variants;
  return (
    variants["landscape-crop2x"]?.url ||
    variants["landscape-crop"]?.url ||
    variants["default"]?.url ||
    Object.values(variants)[0]?.url ||
    null
  );
}

function summarize(
  listing: STListing,
  included: STResponse<unknown>["included"],
): ListingSummary {
  const pd = (listing.attributes.publicData ?? {}) as Record<string, unknown>;
  const location = (pd.location as Record<string, unknown> | undefined) ?? {};
  const addressStr =
    typeof pd.address === "string"
      ? pd.address
      : typeof (pd.location as Record<string, unknown> | undefined)?.address === "string"
        ? ((pd.location as Record<string, unknown>).address as string)
        : "";
  // PRIVACY: never derive "city" from the raw address string — the first
  // comma-segment is almost always the street (e.g. "1234 Main St"). Only
  // use structured city/state fields. If they're missing, show nothing.
  const cityFromAddress = (() => {
    if (!addressStr) return null;
    const parts = addressStr.split(",").map((s) => s.trim()).filter(Boolean);
    // Heuristic: a US address like "123 Main St, Los Angeles, CA 90001"
    // has the city at index -2. Anything shorter is unsafe — skip.
    return parts.length >= 3 ? parts[parts.length - 2] ?? null : null;
  })();
  const city =
    (location.city as string) ||
    (pd.city as string) ||
    cityFromAddress ||
    null;
  const state =
    (location.state as string) ||
    (pd.state as string) ||
    (pd.state_code as string) ||
    null;
  const slug = slugify(listing.attributes.title || "pool");
  return {
    id: listing.id,
    slug,
    title: listing.attributes.title,
    description: listing.attributes.description ?? "",
    price: listing.attributes.price ?? null,
    city: city || null,
    state: state || null,
    imageUrl: pickImage(listing, included),
    url: `/l/${slug}/${listing.id}`,
    geolocation: listing.attributes.geolocation ?? null,
  };
}

const IMAGE_VARIANT_PARAMS = {
  "fields.image":
    "variants.landscape-crop,variants.landscape-crop2x,variants.default",
  include: "images",
};

/**
 * Fetch public guest-of-host reviews for a listing via the Integration API.
 *
 * Sharetribe's `/reviews/query` returns 404 on this marketplace (likely
 * because of small collection size or configuration), so we fetch reviews
 * through `/transactions/query?listingId=...&include=reviews,reviews.author`.
 * Only `type=ofProvider` (guest reviewing the pool) and `state=public`
 * reviews are returned. Sorted newest-first. Returns `[]` on any error.
 */
export async function fetchListingReviews(listingId: string): Promise<ListingReview[]> {
  try {
    const res = await integrationGet<any>("/transactions/query", {
      listingId,
      perPage: 100,
      include: "reviews,reviews.author",
      "fields.review": "type,state,rating,content,createdAt",
      "fields.user": "profile",
    });
    const inc: any[] = Array.isArray(res?.included) ? res.included : [];
    const users = new Map<string, any>();
    const rawReviews: any[] = [];
    for (const item of inc) {
      if (item?.type === "user" && item.id) users.set(String(item.id), item);
      else if (item?.type === "review") rawReviews.push(item);
    }
    const seen = new Set<string>();
    const out: ListingReview[] = [];
    for (const r of rawReviews) {
      const id = String(r?.id ?? "");
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const a = r?.attributes ?? {};
      if (a.type !== "ofProvider") continue;
      if (a.state && a.state !== "public") continue;
      const rating = Number(a.rating);
      const body = typeof a.content === "string" ? a.content.trim() : "";
      if (!rating || rating < 1 || rating > 5 || !body) continue;
      const authorRel = r?.relationships?.author?.data;
      const authorId = authorRel?.id ? String(authorRel.id) : null;
      const author = authorId ? users.get(authorId) : null;
      const profile = author?.attributes?.profile ?? {};
      const displayName =
        (typeof profile.displayName === "string" && profile.displayName.trim()) ||
        [profile.firstName, profile.abbreviatedLastName].filter(Boolean).join(" ").trim() ||
        "Guest";
      out.push({
        rating,
        body,
        authorName: displayName,
        createdAt: String(a.createdAt ?? ""),
      });
    }
    out.sort((x, y) => (y.createdAt || "").localeCompare(x.createdAt || ""));
    return out;
  } catch (err) {
    console.error("fetchListingReviews error:", err);
    return [];
  }
}

function aggregateFor(reviews: ListingReview[]): { value: number; count: number } | null {
  if (!reviews.length) return null;
  const sum = reviews.reduce((a, r) => a + r.rating, 0);
  return { value: Math.round((sum / reviews.length) * 10) / 10, count: reviews.length };
}

export async function fetchListing(id: string): Promise<{
  listing: ListingSummary;
  raw: STListing;
} | null> {
  try {
    const [listingRes, reviews] = await Promise.all([
      integGet<STResponse<STListing | STListing[]>>(`/listings/show`, {
        id,
        ...IMAGE_VARIANT_PARAMS,
      }),
      fetchListingReviews(id),
    ]);
    const data = Array.isArray(listingRes.data) ? listingRes.data[0] : listingRes.data;
    if (!data) return null;
    // Don't expose draft / closed listings publicly.
    if (data.attributes.state !== "published") return null;
    const listing = summarize(data, listingRes.included);
    listing.reviews = reviews;
    listing.aggregateRating = aggregateFor(reviews);
    return { listing, raw: data };
  } catch (err) {
    console.error("fetchListing error:", err);
    return null;
  }
}

export interface SearchOptions {
  page?: number;
  perPage?: number;
  keywords?: string;
  origin?: string; // "lat,lng"
  bounds?: string; // "neLat,neLng,swLat,swLng"
  pub_category?: string;
  address?: string;
  citySlug?: string;
  city?: string;
  stateCode?: string; // e.g. "CA" — synced_listings only
}

export async function searchListings(opts: SearchOptions = {}): Promise<{
  listings: ListingSummary[];
  total: number;
  page: number;
  totalPages: number;
}> {
  try {
    // Deterministic source selection: if the synced mirror is queryable for
    // these opts, ALWAYS use the mirror result — even if it returns zero
    // rows. Falling back to the direct Sharetribe API on empty would make
    // SSR vs client return different data shapes (different listings or
    // different orders), which causes React #418 hydration mismatches inside
    // the route loader's Suspense boundary. Same opts → same source → same
    // result, every call. Only fall through if the mirror itself errored.
    if (opts.citySlug || opts.city || opts.stateCode) {
      const bySynced = await searchSyncedListings(opts);
      if (bySynced) return bySynced;
      console.warn(
        `[searchListings] synced query errored for opts=${JSON.stringify(opts)} — falling back to direct Sharetribe`,
      );
    }

    const res = await integGet<STResponse<STListing[]>>(`/listings/query`, {
      page: opts.page ?? 1,
      perPage: opts.perPage ?? 24,
      states: "published",
      // Explicit sort so the API doesn't rely on a default that can shift
      // between calls. Newest-first matches the synced mirror's ordering.
      sort: "-createdAt",
      keywords: opts.keywords,
      origin: opts.origin,
      bounds: opts.bounds,
      pub_category: opts.pub_category,
      ...IMAGE_VARIANT_PARAMS,
    });
    return {
      listings: (res.data ?? []).map((l) => summarize(l, res.included)),
      total: res.meta?.totalItems ?? 0,
      page: res.meta?.page ?? 1,
      totalPages: res.meta?.totalPages ?? 1,
    };
  } catch (err) {
    console.error("searchListings error:", err);
    return { listings: [], total: 0, page: 1, totalPages: 0 };
  }
}

async function searchSyncedListings(opts: SearchOptions): Promise<{
  listings: ListingSummary[];
  total: number;
  page: number;
  totalPages: number;
} | null> {
  try {
    const page = opts.page ?? 1;
    const perPage = opts.perPage ?? 24;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    let query = supabaseAdmin
      .from("synced_listings")
      .select("sharetribe_id, slug, title, description, price_amount, price_currency, city, state_code, primary_image_url, latitude, longitude", { count: "exact" })
      .eq("state", "published")
      .eq("is_deleted", false);
    if (opts.citySlug) query = query.eq("city_slug", opts.citySlug);
    else if (opts.city) query = query.ilike("city", opts.city);
    const normalizedState = opts.stateCode ? opts.stateCode.toUpperCase() : null;
    if (normalizedState) query = query.eq("state_code", normalizedState);

    const { data, count, error } = await query
      // Newest-first, with sharetribe_id as a stable tiebreaker so two rows
      // with identical updated_at always come back in the same order.
      .order("updated_at", { ascending: false })
      .order("sharetribe_id", { ascending: true })
      .range(from, to);
    if (error) throw error;

    const rows = data ?? [];
    if (normalizedState && rows.length === 0) {
      console.warn(
        `[searchSyncedListings] zero rows for stateCode="${normalizedState}" — mirror likely missing state_code values`,
      );
    }
    return {
      listings: rows.map((row) => ({
        id: row.sharetribe_id,
        slug: row.slug,
        title: row.title,
        description: row.description ?? "",
        price: row.price_amount && row.price_currency
          ? { amount: row.price_amount, currency: row.price_currency }
          : null,
        city: row.city ?? null,
        state: row.state_code ?? null,
        imageUrl: row.primary_image_url ?? null,
        url: `/l/${row.slug}/${row.sharetribe_id}`,
        geolocation: row.latitude && row.longitude
          ? { lat: Number(row.latitude), lng: Number(row.longitude) }
          : null,
      })),
      total: count ?? rows.length,
      page,
      totalPages: Math.max(1, Math.ceil((count ?? rows.length) / perPage)),
    };
  } catch (err) {
    console.error("searchSyncedListings error:", err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Availability / time slots (Marketplace API public-read)
// ─────────────────────────────────────────────────────────────────────────────

export interface AvailableTimeSlot {
  start: string; // ISO
  end: string;   // ISO
  seats: number;
}

/**
 * Fetch available time slots for a listing within [startISO, endISO).
 * Uses Marketplace API: GET /v1/api/timeslots/query
 *
 * Returns an array sorted by start. Returns [] on error so callers stay defensive.
 */
export async function fetchAvailableTimeSlots(
  listingId: string,
  startISO: string,
  endISO: string,
): Promise<AvailableTimeSlot[]> {
  try {
    const json = await integGet<unknown>("/timeslots/query", {
      listingId,
      start: startISO,
      end: endISO,
      per_page: 100,
    });

    try {
      const rawList =
        json && typeof json === "object" && Array.isArray((json as any).data)
          ? (json as any).data
          : [];

      const { isValidIsoPair } = await import("@/lib/availability.utils");
      const slots: AvailableTimeSlot[] = [];
      for (const d of rawList) {
        const attrs = (d as any)?.attributes;
        if (!attrs) continue;
        const v = isValidIsoPair(attrs.start, attrs.end, attrs.seats);
        if (v) slots.push(v);
      }
      slots.sort((a, b) => a.start.localeCompare(b.start));
      return slots;
    } catch (parseErr) {
      console.error("fetchAvailableTimeSlots parse error:", parseErr);
      return [];
    }
  } catch (err) {
    console.error("fetchAvailableTimeSlots error:", err);
    return [];
  }
}

