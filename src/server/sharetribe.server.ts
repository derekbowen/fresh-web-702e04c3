/**
 * Sharetribe Flex Marketplace API client (server-only).
 *
 * Uses the public Marketplace API for read-only listing data (no secret required
 * for public reads, just the Client ID). Auth via client_credentials when needed.
 *
 * Docs: https://www.sharetribe.com/api-reference/marketplace.html
 */

type TokenCache = { token: string; expiresAt: number } | null;
let tokenCache: TokenCache = null;

// Sharetribe Flex Marketplace API base. Always this host — the per-marketplace
// scope is determined by the Client ID, not the URL.
const FLEX_API_BASE = "https://flex-api.sharetribe.com";

function getApiBase(): string {
  const raw = process.env.SHARETRIBE_MARKETPLACE_URL?.trim();
  if (!raw) return FLEX_API_BASE;
  // Accept either a full URL (https://flex-api.sharetribe.com) or a bare
  // marketplace ident like "poolrentalnearme" — fall back to the canonical base.
  if (/^https?:\/\//i.test(raw)) return raw.replace(/\/$/, "");
  return FLEX_API_BASE;
}

function getClientId(): string {
  const id = process.env.SHARETRIBE_CLIENT_ID;
  if (!id) throw new Error("SHARETRIBE_CLIENT_ID is not configured");
  return id;
}

/**
 * Get an anonymous (public) access token for the Marketplace API.
 * Cached in-memory for the lifetime of the worker instance.
 */
async function getAnonymousToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 30_000) {
    return tokenCache.token;
  }

  const baseUrl = getApiBase();
  const clientId = getClientId();

  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: "client_credentials",
    scope: "public-read",
  });

  const res = await fetch(`${baseUrl}/v1/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Sharetribe auth failed [${res.status}]: ${text.slice(0, 200)}`,
    );
  }

  const json = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  tokenCache = {
    token: json.access_token,
    expiresAt: now + json.expires_in * 1000,
  };
  return json.access_token;
}

async function marketplaceGet<T = unknown>(
  path: string,
  query: Record<string, string | number | boolean | undefined> = {},
): Promise<T> {
  const baseUrl = getApiBase();
  const token = await getAnonymousToken();

  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== "") {
      params.set(k, String(v));
    }
  }

  const url = `${baseUrl}/v1/api${path}${params.size ? `?${params}` : ""}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Sharetribe ${path} failed [${res.status}]: ${text.slice(0, 200)}`,
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
    geolocation?: { lat: number; lng: number };
    price?: { amount: number; currency: string };
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
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
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
  const pd = listing.attributes.publicData ?? {};
  const location = (pd.location as Record<string, unknown> | undefined) ?? {};
  const city = (location.city as string) ?? (pd.city as string) ?? null;
  const state = (location.state as string) ?? (pd.state as string) ?? null;
  const slug = slugify(listing.attributes.title || "pool");
  return {
    id: listing.id,
    slug,
    title: listing.attributes.title,
    description: listing.attributes.description ?? "",
    price: listing.attributes.price ?? null,
    city,
    state,
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

export async function fetchListing(id: string): Promise<{
  listing: ListingSummary;
  raw: STListing;
} | null> {
  try {
    const res = await marketplaceGet<STResponse<STListing | STListing[]>>(
      `/listings/show`,
      { id, ...IMAGE_VARIANT_PARAMS },
    );
    const data = Array.isArray(res.data) ? res.data[0] : res.data;
    if (!data) return null;
    return { listing: summarize(data, res.included), raw: data };
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
}

export async function searchListings(opts: SearchOptions = {}): Promise<{
  listings: ListingSummary[];
  total: number;
  page: number;
  totalPages: number;
}> {
  try {
    const res = await marketplaceGet<STResponse<STListing[]>>(
      `/listings/query`,
      {
        page: opts.page ?? 1,
        perPage: opts.perPage ?? 24,
        keywords: opts.keywords,
        origin: opts.origin,
        bounds: opts.bounds,
        pub_category: opts.pub_category,
        ...IMAGE_VARIANT_PARAMS,
      },
    );
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
