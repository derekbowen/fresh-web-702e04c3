/**
 * Renter intent vs host-recruitment intent for `host_acq_city` pages.
 *
 * Every published content_pages row with template_type 'host_acq_city' renders
 * through src/components/templates/host-acq-city.tsx, but the rows serve two
 * different searchers:
 *
 *   HOST    slug starts with "become-a-" (become-a-swimming-pool-host-<city>-<st>,
 *           become-a-pool-host-<city>-<st>): a pool owner deciding whether to list.
 *   RENTER  every other host_acq_city slug ("<city>-<st>", a bare "<city>", or a
 *           topic slug such as "birthday-pool-party-austin-tx"): someone looking
 *           for a private pool to rent in that city. /p/<city>-<st> is the site's
 *           guest-facing city URL (e.g. /p/privatepoolrentalssandiego 301s to
 *           /p/san-diego-ca).
 *
 * That is the ONE rule (see docs/seo-repairs-2026-11/intent.md for the counts).
 * Everything here is pure and dependency-free (relative imports only) so the
 * unit tests and scripts/intent-report.mjs run exactly this code under plain
 * Node, and the route head(), the loader and the template cannot disagree.
 *
 * Nothing in this file states a number. Counts and distances are passed in
 * from synced_listings via the inventory loader; this module only words them.
 */
import { STATE_NAMES } from "./states.ts";
import { getVariantCopy, normalizeTitleVariant, type TitleVariant } from "./host-acq-variants.ts";
import { cityForContentPage, parseCitySlug } from "./city-slug.ts";

export type CityIntent = "host" | "renter";

/**
 * A stated money figure: "$40-$150/hr", "$3K+/mo", "earn up to 10k". Stored
 * host_acq_city titles and descriptions carry these on hundreds of rows
 * (722 HOST descriptions, 2026-11-15) and none of them is sourced from data,
 * so a page never shows stored copy that matches this; it falls back to the
 * fee facts that are true for every host (0% host fees, keep 100%).
 * "Earn extra income" with no figure is a proposition, not a number, and stays.
 */
const EARNINGS_FIGURE = /\$\s?\d|\b\d+(?:[.,]\d+)?\s?[kK]\b/;
export function hasEarningsFigure(text: string | null | undefined): boolean {
  return typeof text === "string" && EARNINGS_FIGURE.test(text);
}

/** The classification rule. Deterministic on the slug alone. */
export function classifyCityIntent(slug: string | null | undefined): CityIntent {
  return typeof slug === "string" && slug.startsWith("become-a-") ? "host" : "renter";
}

const HOST_PREFIXES = ["become-a-swimming-pool-host-", "become-a-pool-host-"];

/** The city part of a slug: the slug minus any become-a-…host- prefix. */
export function cityPartOfSlug(slug: string): string {
  for (const p of HOST_PREFIXES) {
    if (slug.startsWith(p)) return slug.slice(p.length).replace(/^-+/, "");
  }
  const generic = /^become-a-[a-z-]*?host-/.exec(slug);
  if (generic) return slug.slice(generic[0].length).replace(/^-+/, "");
  return slug;
}

const STATE_CODES = new Set(Object.keys(STATE_NAMES));
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const compact = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

function editDistance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const up = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = up;
    }
  }
  return prev[b.length];
}
/**
 * Two spellings of one place name: one a word-prefix of the other ("Tuolumne" /
 * "Tuolumne City", "Anchorage" / "Anchorage Municipality") or at most two
 * letters apart ("Liguna Niguel" / "Laguna Niguel", "Moore Park" / "Moorpark").
 * Different places with a shared first word ("North Hollywood" / "Los Angeles")
 * are not similar.
 */
export function similarPlaceName(a: string, b: string): boolean {
  const ca = compact(a);
  const cb = compact(b);
  if (!ca || !cb || ca === cb) return ca === cb && !!ca;
  const wa = a.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const wb = b.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const [short, long] = wa.length <= wb.length ? [wa, wb] : [wb, wa];
  if (short.length > 0 && short.every((w, i) => long[i] === w)) return true;
  return Math.min(ca.length, cb.length) >= 4 && editDistance(ca, cb) <= 2;
}
/** Full state names as slug suffixes ("new-mexico" -> NM), longest first. */
const STATE_NAME_SUFFIXES = Object.entries(STATE_NAMES)
  .map(([code, name]) => [slugify(name), code] as const)
  .sort((a, b) => b[0].length - a[0].length);

interface SlugState {
  base: string;
  stateCode: string;
  viaName: boolean;
}

function splitSlugState(part: string): SlugState | null {
  const m = /^(.+)-([a-z]{2})$/.exec(part);
  if (m && STATE_CODES.has(m[2].toUpperCase())) {
    return { base: m[1], stateCode: m[2].toUpperCase(), viaName: false };
  }
  for (const [suffix, code] of STATE_NAME_SUFFIXES) {
    if (part.endsWith(`-${suffix}`) && part.length > suffix.length + 1) {
      return { base: part.slice(0, -(suffix.length + 1)), stateCode: code, viaName: true };
    }
  }
  return null;
}

/** "… in Chapel Hill, NC" / "… en Austin, TX | …" -> { city, stateCode }. */
export function titlePlace(
  title: string | null | undefined,
): { city: string; stateCode: string } | null {
  if (!title) return null;
  const m = /\b(?:in|en)\s+([^,|—–:]+?)\s*,\s*([A-Za-z]{2})\s*(?:$|[|—–:])/i.exec(title);
  if (!m) return null;
  const stateCode = m[2].toUpperCase();
  if (!STATE_CODES.has(stateCode)) return null;
  const city = m[1].trim();
  return city ? { city, stateCode } : null;
}

const titleCaseKey = (key: string) =>
  key
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
const recase = (s: string) =>
  s === s.toLowerCase() ? s.replace(/\b[a-z]/g, (c) => c.toUpperCase()) : s;

export interface PageIdentityInput {
  slug: string | null;
  title?: string | null;
}

/** What can be said about a page's place from the row alone (no cities lookup). */
export interface SlugIdentity {
  intent: CityIntent;
  /** Slug minus the become-a-…host- prefix. */
  cityPart: string;
  /** The slug handed to resolveCityRow(): state-suffixed whenever a state is known. */
  lookupSlug: string;
  /** State from the slug (code or full name) or, failing that, from the title. */
  stateCode: string | null;
  /** City display name when no cities row is found. */
  fallbackCityName: string;
  /** A renter page about one occasion in a city ("Birthday Pool Party Rental in Austin, TX"). */
  isTopic: boolean;
  /**
   * The city as the stored title names it, when the title is about the same
   * place (same state, same or similar name). Hand-written titles spell the
   * place right where a generated slug ("liguna-niguel-ca") or a census-style
   * cities row name ("Anchorage Municipality") does not.
   */
  titleCityName: string | null;
  /**
   * The un-suffixed cities slug ("houston" for houston-tx), read for its
   * coordinates only. On 2026-11-15 every pair of "<city>" / "<city>-<st>"
   * cities rows that disagree by more than 4 miles had the city-centre
   * coordinate on the bare row (houston 29.7604,-95.3698 vs houston-tx 21 miles
   * north-west). Null when the page has no state or no separate bare slug.
   */
  centroidSlug: string | null;
}

export function slugIdentity(page: PageIdentityInput): SlugIdentity {
  const slug = page.slug ?? "";
  const intent = classifyCityIntent(slug);
  const cityPart = cityPartOfSlug(slug);
  const t = titlePlace(page.title);
  let s = splitSlugState(cityPart);
  // A full state name is only read as a state when the title agrees, so a bare
  // "fort-washington" is never "Fort, WA".
  if (s?.viaName && !(t && t.stateCode === s.stateCode)) s = null;
  // Census-style designations in generated slugs ("anchorage-municipality-ak",
  // "lexington-fayette-urban-county-ky") are not part of the place's name.
  const base = (s ? s.base : cityPart).replace(/-(municipality|urban-county)$/, "");
  const tc = t ? compact(t.city) : "";
  const sameState = !!t && (!s || t.stateCode === s.stateCode);
  const consistent =
    sameState && tc.length > 0 && (compact(base).startsWith(tc) || compact(base).endsWith(tc));
  // The title names the same place under a corrected spelling.
  const respelled = !consistent && sameState && !!t && similarPlaceName(base.replace(/-/g, " "), t.city);
  const titleCity = consistent || respelled ? t : null;
  const isTopic = intent === "renter" && consistent && compact(base) !== tc;
  const stateCode = s?.stateCode ?? titleCity?.stateCode ?? null;
  // City key for the lookup: the slug's own city words, except where the slug
  // carries no state (bare "newbury-park-a"), is a topic slug, or misspells the
  // city, where the title names it.
  const cityKey = titleCity && (isTopic || !s || respelled) ? slugify(titleCity.city) : base;
  const lookupSlug = stateCode ? `${cityKey}-${stateCode.toLowerCase()}` : cityPart;
  const fallbackCityName =
    titleCity && (isTopic || !s || respelled || compact(base) === tc)
      ? recase(titleCity.city)
      : titleCaseKey(base) || "your city";
  const centroidSlug = stateCode && cityKey && cityKey !== lookupSlug ? cityKey : null;
  return {
    intent,
    cityPart,
    lookupSlug,
    stateCode,
    fallbackCityName,
    isTopic,
    titleCityName: titleCity ? recase(titleCity.city) : null,
    centroidSlug,
  };
}

export interface CityRowLike {
  name: string | null;
  state_code: string | null;
}

export interface CityPlace extends SlugIdentity {
  cityName: string;
  /** "City, ST", or "City" when no state is known. */
  label: string;
}

/** The place a page is about, preferring the canonical cities row when one resolved. */
export function placeForPage(page: PageIdentityInput, cityRow?: CityRowLike | null): CityPlace {
  const id = slugIdentity(page);
  const stateCode = id.stateCode ?? (cityRow?.state_code ? cityRow.state_code.toUpperCase() : null);
  let cityName = cityRow?.name?.trim() || id.fallbackCityName;
  // A cities row spelled differently from the page's own title ("Anchorage
  // Municipality" for "… in Anchorage, AK") gives way to the title.
  if (
    cityRow?.name &&
    id.titleCityName &&
    compact(id.titleCityName) !== compact(cityName) &&
    similarPlaceName(id.titleCityName, cityName)
  ) {
    cityName = id.titleCityName;
  }
  // Some cities rows carry the state in the name ("New Haven CT").
  if (stateCode && cityName.toUpperCase().endsWith(" " + stateCode)) {
    cityName = cityName.slice(0, cityName.length - stateCode.length - 1).trimEnd();
  }
  return {
    ...id,
    stateCode,
    cityName,
    label: stateCode ? `${cityName}, ${stateCode}` : cityName,
  };
}

// ─────────────────────────── titles and headings ───────────────────────────

export interface HeadingParts {
  /** The whole H1 as text (what a crawler reads). */
  text: string;
  /** Rendered plain. */
  lead: string;
  /** Rendered with the accent gradient, after `lead`. Empty when none. */
  accent: string;
}

/** Text before the first " | " of a stored title. */
const titleHead = (title: string) => title.split(/\s+\|\s+/)[0].trim();

export interface CityPageCopy {
  intent: CityIntent;
  variant: TitleVariant | null;
  h1: HeadingParts;
  /** The full <title>. */
  title: string;
  /** Variant pages carry their own meta description and intro. */
  variantMetaDescription: string | null;
  variantIntro: string | null;
}

export interface CityPageInput extends PageIdentityInput {
  seo_title?: string | null;
  title_variant?: string | null;
}

const SITE_NAME = "Pool Rental Near Me";

/**
 * The title_variant A/B/C/D copy exactly as b3e2ace produced it, so the
 * running title test is not changed under it: the city name is the cities row
 * name (or the slug parsed by parseCitySlug) unmodified in <title> and meta,
 * and with a trailing " ST" stripped in the H1 and intro, as the old head()
 * and template did.
 */
function legacyVariantCopy(
  variant: TitleVariant,
  slug: string | null,
  cityRow: CityRowLike | null | undefined,
): Pick<CityPageCopy, "h1" | "title" | "variantMetaDescription" | "variantIntro"> {
  const citySlug = cityForContentPage("host_acq_city", slug);
  const parsed = parseCitySlug(citySlug ?? slug ?? "");
  const raw = cityRow?.name || parsed.city || "your city";
  const st = (cityRow?.state_code || parsed.stateCode || "").toUpperCase();
  const stripped =
    st && raw.toUpperCase().endsWith(" " + st) ? raw.slice(0, raw.length - st.length - 1).trimEnd() : raw;
  const head = getVariantCopy(variant, raw, st);
  const body = getVariantCopy(variant, stripped, st);
  return {
    h1: { text: body.h1, lead: body.h1, accent: "" },
    title: head.title,
    variantMetaDescription: head.metaDescription,
    variantIntro: body.intro,
  };
}

/**
 * Title and H1 for a host_acq_city page.
 *
 * HOST   H1 "Rent out your pool in {City}, {ST} by the hour. 0% host fees. Keep 100%."
 *        <title> the stored seo_title, unchanged: it is the CONTROL arm of the
 *        title_variant test, and changing it would invalidate the test. Only a
 *        stored title that states an earnings figure ("| Earn $3k+/mo") is
 *        replaced, by "Become a Pool Host in {City}, {ST} | 0% Host Fees".
 *        A title_variant (A-D) row gets exactly its variant copy (title, H1,
 *        meta, intro), computed as b3e2ace did.
 * RENTER H1 "Private pool rentals in {City}, {ST}"
 *        title "Private Pool Rentals in {City}, {ST} | Pool Rental Near Me"
 *        A topic page keeps its own stored title ("Birthday Pool Party Rental in
 *        Austin, TX") as H1 and title. Variants are host copy and never apply.
 *
 * The state is always in the H1, so same-name cities in different states
 * ("Springfield, MO" / "Springfield, IL") no longer share one.
 */
export function cityPageCopy(
  page: CityPageInput,
  place: CityPlace,
  cityRow?: CityRowLike | null,
): CityPageCopy {
  if (place.intent === "host") {
    const variant = normalizeTitleVariant(page.title_variant);
    if (variant) {
      return { intent: "host", variant, ...legacyVariantCopy(variant, page.slug, cityRow) };
    }
    const lead = `Rent out your pool in ${place.label} by the hour.`;
    const accent = "0% host fees. Keep 100%.";
    const stored = page.seo_title?.trim() || "";
    const storedTitle = page.title?.trim() || "";
    const title =
      stored && !hasEarningsFigure(stored)
        ? stored
        : !stored && storedTitle && !hasEarningsFigure(storedTitle)
          ? `${storedTitle} | ${SITE_NAME}`
          : `Become a Pool Host in ${place.label} | 0% Host Fees`;
    return {
      intent: "host",
      variant: null,
      h1: { text: `${lead} ${accent}`, lead, accent },
      title,
      variantMetaDescription: null,
      variantIntro: null,
    };
  }
  if (place.isTopic && page.title) {
    const head = titleHead(page.title);
    return {
      intent: "renter",
      variant: null,
      h1: { text: head, lead: head, accent: "" },
      title: page.title.includes(" | ") ? page.title.trim() : `${head} | ${SITE_NAME}`,
      variantMetaDescription: null,
      variantIntro: null,
    };
  }
  const h1 = `Private pool rentals in ${place.label}`;
  return {
    intent: "renter",
    variant: null,
    h1: { text: h1, lead: h1, accent: "" },
    title: `Private Pool Rentals in ${place.label} | ${SITE_NAME}`,
    variantMetaDescription: null,
    variantIntro: null,
  };
}

// ─────────────────────────── host value copy ────────────────────────────────

/** Stored description, or null when there is none or it states an earnings figure. */
export function cleanStoredDescription(page: {
  seo_description?: string | null;
  description?: string | null;
}): string | null {
  const stored = (page.seo_description || page.description || "").trim();
  return stored && !hasEarningsFigure(stored) ? stored : null;
}

/**
 * The HOST hero sentence when the stored description is missing or states an
 * earnings figure. Every clause is a fee fact already on the page.
 */
export function hostValueSentence(place: CityPlace): string {
  return `List your ${place.cityName} pool on Pool Rental Near Me and rent it out by the hour. 0% host fees: you keep 100% of your listed price, paid after each completed booking.`;
}

export function hostMetaDescription(place: CityPlace): string {
  return `Rent out your pool in ${place.label} by the hour on Pool Rental Near Me. 0% host fees: you keep 100% of your listed price, paid after each completed booking.`;
}

/** A page written in another language (locale/language "es"…) keeps its stored wording. */
export function isNonEnglishPage(page: { locale?: string | null; language?: string | null }): boolean {
  const l = (page.locale || page.language || "en").toLowerCase();
  return !l.startsWith("en");
}

// ─────────────────────────── renter inventory wording ───────────────────────

/** The inventory facts a renter page may state. All of them come from synced_listings. */
export interface InventorySummary {
  /** Eligible listings whose city matches exactly (true count, not the cards shown). */
  exactTotal: number;
  /** Eligible listings within `radiusMi` of the city centre, excluding exact ones. */
  nearbyTotal: number;
  /** Distance of the nearest nearby listing, miles. */
  nearestMi: number | null;
  radiusMi: number | null;
  /** The inventory read failed: say nothing about how many pools there are. */
  readFailed: boolean;
  /**
   * The nearby (radius) lookup ran. False when the city has no coordinates, so
   * "nothing nearby" is NOT known and must not be said.
   */
  nearbyChecked: boolean;
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export function formatMiles(mi: number): string {
  return mi < 1 ? "under 1 mile" : `${Math.round(mi)} ${Math.round(mi) === 1 ? "mile" : "miles"}`;
}

/**
 * exact     pools whose city is this city
 * nearby    none with this city as their city, some within the radius
 * unchecked none with this city as their city; no coordinates, so nearby unknown
 * none      none in the city and none within the radius
 * unknown   the read failed
 */
export type RenterInventoryState = "exact" | "nearby" | "unchecked" | "none" | "unknown";

export function renterInventoryState(s: InventorySummary): RenterInventoryState {
  if (s.readFailed) return "unknown";
  if (s.exactTotal > 0) return "exact";
  if (s.nearbyTotal > 0) return "nearby";
  if (!s.nearbyChecked) return "unchecked";
  return "none";
}

/** States whose primary renter CTA is a search around the city. */
export function renterSearchesNearby(state: RenterInventoryState): boolean {
  return state === "exact" || state === "nearby" || state === "unchecked";
}

/**
 * The renter hero paragraph. States only listing counts and distances it is
 * given; never availability, dates or that a pool can be booked today.
 *
 * The "nearby" wording makes no claim that the city itself has no pool: exact
 * matching reads the listing's city field, and a listing filed under a
 * neighbourhood ("Jamaica" for Queens) or with no city at all can sit inside
 * the city. It states the radius count and the nearest distance only.
 */
export function renterIntro(place: CityPlace, s: InventorySummary): string {
  switch (renterInventoryState(s)) {
    case "exact": {
      const n = s.exactTotal;
      let text = `${n} private ${plural(n, "pool is", "pools are")} listed in ${place.label} on Pool Rental Near Me. Open a listing to see its photos and details.`;
      if (s.nearbyTotal > 0 && s.radiusMi) {
        const m = s.nearbyTotal;
        text += ` ${m} more ${plural(m, "is", "are")} listed within ${s.radiusMi} miles.`;
      }
      return text;
    }
    case "nearby": {
      const m = s.nearbyTotal;
      const nearest =
        s.nearestMi != null
          ? ` The nearest is ${formatMiles(s.nearestMi)} from ${place.cityName}.`
          : "";
      const where = s.radiusMi ? `within ${s.radiusMi} miles of ${place.label}` : `near ${place.label}`;
      return `${m} private ${plural(m, "pool is", "pools are")} listed ${where} on Pool Rental Near Me.${nearest}`;
    }
    case "unchecked":
      return `No pools are listed with ${place.label} as their city on Pool Rental Near Me yet. Search the map to see the pools listed near ${place.cityName}.`;
    case "none":
      return `No pools are listed in ${place.label} yet. You can browse every pool listed on Pool Rental Near Me.`;
    default:
      return `Private pool rentals in ${place.label} on Pool Rental Near Me. Browse the pools listed on the site.`;
  }
}

/** Meta description for a renter page: the intro, capped at 160 characters. */
export function renterMetaDescription(place: CityPlace, s: InventorySummary): string {
  const text = renterIntro(place, s);
  if (text.length <= 160) return text;
  const cut = text.slice(0, 157);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

/**
 * The meta description for any host_acq_city page (head() calls this).
 *   HOST variant      the variant's own description
 *   HOST              the stored description, unless it states an earnings
 *                     figure; then hostMetaDescription()
 *   RENTER topic or non-English page: the stored description (it is about the
 *                     occasion / in the page's language), unless it states a
 *                     figure; otherwise
 *   RENTER            renterMetaDescription() from the inventory
 */
export function cityMetaDescription(
  page: {
    seo_description?: string | null;
    description?: string | null;
    locale?: string | null;
    language?: string | null;
  },
  place: CityPlace,
  copy: CityPageCopy,
  s: InventorySummary,
): string {
  if (copy.variantMetaDescription) return copy.variantMetaDescription;
  const stored = cleanStoredDescription(page);
  if (copy.intent === "host") return stored ? stored.slice(0, 160) : hostMetaDescription(place);
  if (stored && (place.isTopic || isNonEnglishPage(page))) return stored.slice(0, 160);
  return renterMetaDescription(place, s);
}

/** The InventorySummary of a loaded CityInventory (template and head() share it). */
export function inventorySummaryOf(inv: {
  exact: unknown[];
  nearby: { mi?: number }[];
  exactTotal?: number;
  nearbyTotal?: number;
  radiusMi: number | null;
  readFailed?: boolean;
  nearbyChecked?: boolean;
}): InventorySummary {
  return {
    exactTotal: Math.max(inv.exactTotal ?? 0, inv.exact.length),
    nearbyTotal: Math.max(inv.nearbyTotal ?? 0, inv.nearby.length),
    nearestMi: inv.nearby[0]?.mi ?? null,
    radiusMi: inv.radiusMi,
    readFailed: !!inv.readFailed,
    nearbyChecked: !!inv.nearbyChecked,
  };
}

/** "September 25, 2026" for an ISO timestamp (UTC), or null. */
export function formatSyncDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}
