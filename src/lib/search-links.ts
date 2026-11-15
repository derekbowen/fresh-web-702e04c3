/**
 * ONE form for every generated link into the marketplace search (`/s`).
 *
 * `/s` is noindex,follow for any query string, so these links are navigation,
 * not crawl targets. They stay; what must not happen is the same place being
 * linked under several spellings (`Akron%2C%20OH`, `Akron%2C+OH`, `akron%2C%20oh`,
 * `Akron%2C%20` with an empty state), each one a separate URL to a crawler.
 *
 * The form is `/s?address=<encodeURIComponent("City, ST")>`:
 *   - one parameter, `address`, nothing else
 *   - city words single-spaced, periods dropped ("St. Louis" -> "St Louis"),
 *     an all-lowercase name title-cased ("buffalo" -> "Buffalo")
 *   - a two-letter state code upper-cased; a full state name title-cased
 *   - a state repeated inside the city name dropped ("New Haven CT, CT" -> "New Haven, CT")
 *   - no state known: the city alone, never a dangling ", "
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
