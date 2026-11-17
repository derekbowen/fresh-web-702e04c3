/**
 * ONE form for every generated link into the marketplace search (`/s`).
 *
 * `/s` is noindex,follow for any query string, so these links are navigation,
 * not crawl targets. They stay; what must not happen is the same place being
 * linked under several spellings (`Akron%2C%20OH`, `Akron%2C+OH`, `akron%2C%20oh`,
 * `Akron%2C%20` with an empty state), each one a separate URL to a crawler.
 *
 * The address form is `/s?address=<encodeURIComponent("City, ST")>`:
 *   - one parameter, `address`, nothing else
 *   - city words single-spaced, periods dropped ("St. Louis" -> "St Louis"),
 *     an all-lowercase name title-cased ("buffalo" -> "Buffalo")
 *   - a two-letter state code upper-cased; a full state name title-cased
 *   - a state repeated inside the city name dropped ("New Haven CT, CT" -> "New Haven, CT")
 *   - no state known: the city alone, never a dangling ", "
 *
 * BUT the marketplace search ignores `address` on its own. WEST's SearchPage
 * (poolrentalnearme-web SearchPage.duck.js) drops `address` from the query and
 * searches by `bounds` only, and SearchPageWithMap skips its nearest-to-visitor
 * default whenever `address` is present. So `/s?address=Tempe%2C%20AZ` shows
 * every pool on the site, unordered (129 on 2026-11-17), which is worse than the
 * bare `/s`. A link that promises pools near a place must carry bounds:
 * searchHrefNearPlace() below. The address-only searchHrefForPlace() /
 * searchHrefForState() are kept for the templates that already linked that way
 * before seo/05-intent (comparison pages, state hubs, advocacy, activity_city).
 *
 * Pure and dependency-free so the link-variant measurement script
 * (scripts/intent-report.mjs) runs the same code the pages do.
 */

function cleanWords(s: string): string {
  const words = s.replace(/\./g, " ").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const allLower = words.every((w) => w === w.toLowerCase());
  return words.map((w) => (allLower ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(" ");
}

function cleanState(st: string | null | undefined): string | null {
  if (!st) return null;
  const t = st.replace(/\./g, "").trim();
  if (!t) return null;
  if (/^[A-Za-z]{2}$/.test(t)) return t.toUpperCase();
  return cleanWords(t);
}

/** The address value for a place, before URL encoding ("St Louis, MO"). */
export function searchAddressForPlace(
  city: string | null | undefined,
  state: string | null | undefined,
): string | null {
  const st = cleanState(state);
  let c = city ? cleanWords(city) : "";
  // Some cities rows carry the state in the name ("New Haven CT").
  if (c && st && c.toUpperCase().endsWith(" " + st.toUpperCase()))
    c = c.slice(0, -(st.length + 1)).trimEnd();
  if (c && st) return `${c}, ${st}`;
  if (c) return c;
  if (st) return st;
  return null;
}

/** `/s?address=…` for a city (and state), or the bare `/s` when there is no place. */
export function searchHrefForPlace(
  city: string | null | undefined,
  state: string | null | undefined,
): string {
  const address = searchAddressForPlace(city, state);
  return address ? `/s?address=${encodeURIComponent(address)}` : "/s";
}

/**
 * Radius, in miles, of a city page's "near {City}" inventory
 * (src/server/city-inventory.functions.ts reads it). The search box around a
 * city covers the same radius, so the map a "Search pools near {City}" link
 * opens holds every pool the page counted as near.
 */
export const CITY_SEARCH_RADIUS_MI = 60;

/**
 * `bounds` for the marketplace search: "neLat,neLng,swLat,swLng" (the order
 * WEST parses as latlngBounds and the homepage city cards use), 5 decimals,
 * for a box `radiusMi` around a point. It is the same box the inventory query
 * reads (lat ± r/69, lng ± r/(69·cos lat)), so it contains the whole radius.
 * Null when the point is not a usable coordinate.
 */
export function searchBoundsAround(
  lat: number | null | undefined,
  lng: number | null | undefined,
  radiusMi: number = CITY_SEARCH_RADIUS_MI,
): string | null {
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  const dLat = radiusMi / 69;
  const cos = Math.abs(Math.cos((lat * Math.PI) / 180));
  const dLng = radiusMi / (69 * (cos < 0.01 ? 0.01 : cos));
  const clamp = (v: number, lim: number) => Math.max(-lim, Math.min(lim, v));
  return [
    clamp(lat + dLat, 90),
    clamp(lng + dLng, 180),
    clamp(lat - dLat, 90),
    clamp(lng - dLng, 180),
  ]
    .map((v) => v.toFixed(5))
    .join(",");
}

/**
 * The marketplace search around a place, in the form WEST honours:
 * `/s?address=<City, ST>&bounds=<neLat,neLng,swLat,swLng>` (both values
 * encodeURIComponent'd, as the homepage city cards build them), the box
 * CITY_SEARCH_RADIUS_MI around `centre` (the page's inventory centre).
 *
 * No usable coordinates, or no place: the bare `/s`, never an address-only
 * link (WEST would ignore the address and show every pool unordered, and lose
 * its nearest-to-visitor default).
 */
export function searchHrefNearPlace(
  city: string | null | undefined,
  state: string | null | undefined,
  centre: { lat: number | null | undefined; lng: number | null | undefined } | null | undefined,
): string {
  const address = searchAddressForPlace(city, state);
  const bounds = centre ? searchBoundsAround(centre.lat, centre.lng) : null;
  if (!address || !bounds) return "/s";
  return `/s?address=${encodeURIComponent(address)}&bounds=${encodeURIComponent(bounds)}`;
}

/** `/s?address=…` for a whole state ("Ohio"), or `/s`. */
export function searchHrefForState(stateNameOrCode: string | null | undefined): string {
  return searchHrefForPlace(null, stateNameOrCode);
}

/**
 * Rewrite a stored `/s?address=…` link (from a page body) into the one form.
 * Accepts `+` or `%20` for spaces. Anything that is not a plain address-only
 * search link (other parameters, other paths, absolute URLs) is returned as is.
 */
export function normalizeSearchHref(href: string): string {
  const m = /^\/s\?address=([^&#]*)$/.exec(href.trim());
  if (!m) return href;
  let value: string;
  try {
    value = decodeURIComponent(m[1].replace(/\+/g, " "));
  } catch {
    return href;
  }
  const comma = value.lastIndexOf(",");
  if (comma === -1) return searchHrefForPlace(value, null);
  return searchHrefForPlace(value.slice(0, comma), value.slice(comma + 1));
}
