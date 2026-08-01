import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import "@supabase/supabase-js";
const MARKETPLACE_API_BASE = "https://flex-api.sharetribe.com";
const INTEGRATION_API_BASE = "https://flex-integ-api.sharetribe.com";
let publicTokenCache = null;
let integTokenCache = null;
function getPublicClientId() {
  const id = process.env.SHARETRIBE_CLIENT_ID;
  if (!id) throw new Error("SHARETRIBE_CLIENT_ID is not configured");
  return id;
}
function getIntegClientId() {
  const id = process.env.SHARETRIBE_INTEG_CLIENT_ID;
  if (!id) throw new Error("SHARETRIBE_INTEG_CLIENT_ID is not configured");
  return id;
}
function getIntegClientSecret() {
  const s = process.env.SHARETRIBE_INTEG_CLIENT_SECRET;
  if (!s) throw new Error("SHARETRIBE_INTEG_CLIENT_SECRET is not configured");
  return s;
}
async function getPublicReadToken() {
  const now = Date.now();
  if (publicTokenCache && publicTokenCache.expiresAt > now + 3e4) {
    return publicTokenCache.token;
  }
  const body = new URLSearchParams({
    client_id: getPublicClientId(),
    grant_type: "client_credentials",
    scope: "public-read"
  });
  const res = await fetch(`${MARKETPLACE_API_BASE}/v1/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Sharetribe public-read auth failed [${res.status}]: ${text.slice(0, 200)}`
    );
  }
  const json = await res.json();
  publicTokenCache = {
    token: json.access_token,
    expiresAt: now + (json.expires_in ?? 3600) * 1e3
  };
  return json.access_token;
}
async function getIntegrationToken() {
  const now = Date.now();
  if (integTokenCache && integTokenCache.expiresAt > now + 3e4) {
    return integTokenCache.token;
  }
  const body = new URLSearchParams({
    client_id: getIntegClientId(),
    client_secret: getIntegClientSecret(),
    grant_type: "client_credentials",
    scope: "integ"
  });
  const res = await fetch(`${INTEGRATION_API_BASE}/v1/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Sharetribe integ auth failed [${res.status}]: ${text.slice(0, 200)}`
    );
  }
  const json = await res.json();
  integTokenCache = {
    token: json.access_token,
    expiresAt: now + (json.expires_in ?? 3600) * 1e3
  };
  return json.access_token;
}
async function integGet(path, query = {}) {
  const token = await getPublicReadToken();
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== void 0 && v !== null && v !== "") {
      if (k === "states") continue;
      params.set(k, String(v));
    }
  }
  const url = `${MARKETPLACE_API_BASE}/v1/api${path}${params.size ? `?${params}` : ""}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Sharetribe ${path} failed [${res.status}]: ${text.slice(0, 200)}`
    );
  }
  return await res.json();
}
async function integrationGet(path, query = {}) {
  const token = await getIntegrationToken();
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== void 0 && v !== null && v !== "") {
      params.set(k, String(v));
    }
  }
  const url = `${INTEGRATION_API_BASE}/v1/integration_api${path}${params.size ? `?${params}` : ""}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Sharetribe integ ${path} failed [${res.status}]: ${text.slice(0, 200)}`
    );
  }
  return await res.json();
}
function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "pool";
}
function pickImage(listing, included) {
  const imgRef = listing.relationships?.images?.data?.[0];
  if (!imgRef || !included) return null;
  const img = included.find(
    (x) => x.type === "image" && x.id === imgRef.id
  );
  if (!img) return null;
  const variants = img.attributes.variants;
  return variants["landscape-crop2x"]?.url || variants["landscape-crop"]?.url || variants["default"]?.url || Object.values(variants)[0]?.url || null;
}
function summarize(listing, included) {
  const pd = listing.attributes.publicData ?? {};
  const location = pd.location ?? {};
  const addressStr = typeof pd.address === "string" ? pd.address : typeof pd.location?.address === "string" ? pd.location.address : "";
  const cityFromAddress = (() => {
    if (!addressStr) return null;
    const parts = addressStr.split(",").map((s) => s.trim()).filter(Boolean);
    return parts.length >= 3 ? parts[parts.length - 2] ?? null : null;
  })();
  const city = location.city || pd.city || cityFromAddress || null;
  const state = location.state || pd.state || pd.state_code || null;
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
    geolocation: listing.attributes.geolocation ?? null
  };
}
const IMAGE_VARIANT_PARAMS = {
  "fields.image": "variants.landscape-crop,variants.landscape-crop2x,variants.default",
  include: "images"
};
async function fetchListing(id) {
  try {
    const listingRes = await integGet(
      `/listings/show`,
      { id, ...IMAGE_VARIANT_PARAMS }
    );
    const data = Array.isArray(listingRes.data) ? listingRes.data[0] : listingRes.data;
    if (!data) return null;
    if (data.attributes.state !== "published") return null;
    const listing = summarize(data, listingRes.included);
    return { listing, raw: data };
  } catch (err) {
    console.error("fetchListing error:", err);
    return null;
  }
}
const STATE_ABBR = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY"
};
async function fetchShareListing(id) {
  try {
    const res = await integGet(`/listings/show`, {
      id,
      include: "images",
      "fields.image": "variants.scaled-large,variants.scaled-medium,variants.landscape-crop2x"
    });
    const data = Array.isArray(res.data) ? res.data[0] : res.data;
    if (!data || data.attributes.state !== "published") return null;
    const a = data.attributes;
    const pd = a.publicData ?? {};
    const loc = pd.location ?? {};
    const imageOrder = data.relationships?.images?.data ?? [];
    const imageMap = /* @__PURE__ */ new Map();
    for (const inc of res.included ?? []) {
      if (inc.type === "image") imageMap.set(inc.id, inc);
    }
    const images = [];
    for (const ref of imageOrder) {
      const img = imageMap.get(ref.id);
      if (!img) continue;
      const v = img.attributes.variants;
      const url = v["scaled-large"]?.url || v["landscape-crop2x"]?.url || v["scaled-medium"]?.url || Object.values(v)[0]?.url;
      if (url) images.push(url);
    }
    const rawState = loc.state || pd.state || null;
    let stateCode = null;
    if (rawState) {
      stateCode = rawState.length === 2 ? rawState.toUpperCase() : STATE_ABBR[rawState.toLowerCase()] ?? null;
    }
    if (!stateCode && typeof loc.address === "string") {
      const m = loc.address.match(/,\s*([A-Z]{2})\s+\d{5}/);
      if (m) stateCode = m[1];
    }
    const amenitiesRaw = Array.isArray(pd.amenities) ? pd.amenities : [];
    const amenities = amenitiesRaw.map((x) => ({
      id: String(x.id ?? ""),
      name: String(x.name ?? "").trim(),
      description: String(x.description ?? "").trim(),
      priceCents: Number(x.price?.amount ?? 0)
    })).filter((x) => x.name);
    const slug = slugify(a.title || "pool");
    return {
      id: data.id,
      slug,
      title: a.title,
      description: a.description ?? "",
      pricePerHour: Math.round((a.price?.amount ?? 0) / 100),
      city: loc.city || pd.city || null,
      state: stateCode,
      guests: typeof pd.guestallowed === "number" ? pd.guestallowed : null,
      poolType: pd.pool_type || null,
      waterType: pd.water_type || null,
      poolSize: pd.poolsize || null,
      poolDepth: pd.pool_depth || null,
      images,
      heroImage: images[0] ?? null,
      amenities,
      advantages: Array.isArray(pd.advantagesSelection) ? pd.advantagesSelection : [],
      houseRules: Array.isArray(pd.houseRules) ? pd.houseRules : [],
      poolAmenities: Array.isArray(pd.poolAmenities) ? pd.poolAmenities : [],
      bookUrl: `/l/${slug}/${data.id}`,
      geolocation: a.geolocation ?? null
    };
  } catch (err) {
    console.error("fetchShareListing error:", err);
    return null;
  }
}
async function searchListings(opts = {}) {
  try {
    if (opts.citySlug || opts.city || opts.stateCode) {
      const bySynced = await searchSyncedListings(opts);
      if (bySynced) return bySynced;
      console.warn(
        `[searchListings] synced query errored for opts=${JSON.stringify(opts)} — falling back to direct Sharetribe`
      );
    }
    const res = await integGet(`/listings/query`, {
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
      ...IMAGE_VARIANT_PARAMS
    });
    return {
      listings: (res.data ?? []).map((l) => summarize(l, res.included)),
      total: res.meta?.totalItems ?? 0,
      page: res.meta?.page ?? 1,
      totalPages: res.meta?.totalPages ?? 1
    };
  } catch (err) {
    console.error("searchListings error:", err);
    return { listings: [], total: 0, page: 1, totalPages: 0 };
  }
}
async function searchSyncedListings(opts) {
  try {
    const page = opts.page ?? 1;
    const perPage = opts.perPage ?? 24;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    let query = supabaseAdmin.from("synced_listings").select("sharetribe_id, slug, title, description, price_amount, price_currency, city, state_code, primary_image_url, latitude, longitude", { count: "exact" }).eq("state", "published").eq("is_deleted", false);
    if (opts.citySlug) query = query.eq("city_slug", opts.citySlug);
    else if (opts.city) query = query.ilike("city", opts.city);
    const normalizedState = opts.stateCode ? opts.stateCode.toUpperCase() : null;
    if (normalizedState) query = query.eq("state_code", normalizedState);
    const { data, count, error } = await query.order("updated_at", { ascending: false }).order("sharetribe_id", { ascending: true }).range(from, to);
    if (error) throw error;
    const rows = data ?? [];
    if (normalizedState && rows.length === 0) {
      console.warn(
        `[searchSyncedListings] zero rows for stateCode="${normalizedState}" — mirror likely missing state_code values`
      );
    }
    return {
      listings: rows.map((row) => ({
        id: row.sharetribe_id,
        slug: row.slug,
        title: row.title,
        description: row.description ?? "",
        price: row.price_amount && row.price_currency ? { amount: row.price_amount, currency: row.price_currency } : null,
        city: row.city ?? null,
        state: row.state_code ?? null,
        imageUrl: row.primary_image_url ?? null,
        url: `/l/${row.slug}/${row.sharetribe_id}`,
        geolocation: row.latitude && row.longitude ? { lat: Number(row.latitude), lng: Number(row.longitude) } : null
      })),
      total: count ?? rows.length,
      page,
      totalPages: Math.max(1, Math.ceil((count ?? rows.length) / perPage))
    };
  } catch (err) {
    console.error("searchSyncedListings error:", err);
    return null;
  }
}
async function fetchAvailableTimeSlots(listingId, startISO, endISO) {
  try {
    const json = await integGet("/timeslots/query", {
      listingId,
      start: startISO,
      end: endISO,
      per_page: 100
    });
    try {
      const rawList = json && typeof json === "object" && Array.isArray(json.data) ? json.data : [];
      const { isValidIsoPair } = await import("./availability.utils-ohL_VTYY.js");
      const slots = [];
      for (const d of rawList) {
        const attrs = d?.attributes;
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
export {
  fetchAvailableTimeSlots,
  fetchListing,
  fetchShareListing,
  integrationGet,
  searchListings
};
