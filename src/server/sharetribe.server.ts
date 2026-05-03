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
  const city =
    (location.city as string) ||
    (pd.city as string) ||
    (addressStr ? addressStr.split(",")[0]?.trim() : "") ||
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

export async function fetchListing(id: string): Promise<{
  listing: ListingSummary;
  raw: STListing;
} | null> {
  try {
    const res = await integGet<STResponse<STListing | STListing[]>>(
      `/listings/show`,
      { id, ...IMAGE_VARIANT_PARAMS },
    );
    const data = Array.isArray(res.data) ? res.data[0] : res.data;
    if (!data) return null;
    // Don't expose draft / closed listings publicly.
    if (data.attributes.state !== "published") return null;
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
    const res = await integGet<STResponse<STListing[]>>(`/listings/query`, {
      page: opts.page ?? 1,
      perPage: opts.perPage ?? 24,
      states: "published",
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
