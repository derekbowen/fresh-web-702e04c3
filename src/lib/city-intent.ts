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

export type CityIntent = "host" | "renter";

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
  const base = s ? s.base : cityPart;
  const tc = t ? compact(t.city) : "";
  const consistent =
    !!t &&
    tc.length > 0 &&
    (!s || t.stateCode === s.stateCode) &&
    (compact(base).startsWith(tc) || compact(base).endsWith(tc));
  const titleCity = consistent ? t : null;
  const isTopic = intent === "renter" && !!titleCity && compact(base) !== tc;
  const stateCode = s?.stateCode ?? titleCity?.stateCode ?? null;
  // City key for the lookup: the slug's own city words, except where the slug
  // carries no state (bare "newbury-park-a") or is a topic slug, where the
  // title names the city.
  const cityKey = titleCity && (isTopic || !s) ? slugify(titleCity.city) : base;
  const lookupSlug = stateCode ? `${cityKey}-${stateCode.toLowerCase()}` : cityPart;
  const fallbackCityName =
    titleCity && (isTopic || !s || compact(base) === tc)
      ? recase(titleCity.city)
      : titleCaseKey(base) || "your city";
  return { intent, cityPart, lookupSlug, stateCode, fallbackCityName, isTopic };
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

/**
 * Title and H1 for a host_acq_city page.
 *
 * HOST   H1 "Rent out your pool in {City}, {ST} by the hour. 0% host fees. Keep 100%."
 *        title "Become a Pool Host in {City}, {ST} | 0% Host Fees"
 *        A title_variant (A-D) A/B override replaces both, unchanged.
 * RENTER H1 "Private pool rentals in {City}, {ST}"
 *        title "Private Pool Rentals in {City}, {ST} | Pool Rental Near Me"
 *        A topic page keeps its own stored title ("Birthday Pool Party Rental in
 *        Austin, TX") as H1 and title. Variants are host copy and never apply.
 *
 * The state is always in the heading, so same-name cities in different states
 * ("Springfield, MO" / "Springfield, IL") no longer share one.
 */
export function cityPageCopy(
  page: PageIdentityInput & { title_variant?: string | null },
  place: CityPlace,
): CityPageCopy {
  if (place.intent === "host") {
    const variant = normalizeTitleVariant(page.title_variant);
    if (variant) {
      const v = getVariantCopy(variant, place.cityName, place.stateCode ?? "");
      return {
        intent: "host",
        variant,
        h1: { text: v.h1, lead: v.h1, accent: "" },
        title: v.title,
        variantMetaDescription: v.metaDescription,
        variantIntro: v.intro,
      };
    }
    const lead = `Rent out your pool in ${place.label} by the hour.`;
    const accent = "0% host fees. Keep 100%.";
    return {
      intent: "host",
      variant: null,
      h1: { text: `${lead} ${accent}`, lead, accent },
      title: `Become a Pool Host in ${place.label} | 0% Host Fees`,
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
      title: page.title.includes(" | ") ? page.title.trim() : `${head} | Pool Rental Near Me`,
      variantMetaDescription: null,
      variantIntro: null,
    };
  }
  const h1 = `Private pool rentals in ${place.label}`;
  return {
    intent: "renter",
    variant: null,
    h1: { text: h1, lead: h1, accent: "" },
    title: `Private Pool Rentals in ${place.label} | Pool Rental Near Me`,
    variantMetaDescription: null,
    variantIntro: null,
  };
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
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export function formatMiles(mi: number): string {
  return mi < 1 ? "under 1 mile" : `${Math.round(mi)} ${Math.round(mi) === 1 ? "mile" : "miles"}`;
}

export type RenterInventoryState = "exact" | "nearby" | "none" | "unknown";

export function renterInventoryState(s: InventorySummary): RenterInventoryState {
  if (s.readFailed) return "unknown";
  if (s.exactTotal > 0) return "exact";
  if (s.nearbyTotal > 0) return "nearby";
  return "none";
}

/**
 * The renter hero paragraph. States only listing counts and distances it is
 * given; never availability, dates or that a pool can be booked today.
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
      const where = s.radiusMi ? `within ${s.radiusMi} miles` : "nearby";
      return `No pools are listed in ${place.label} yet. ${m} private ${plural(m, "pool is", "pools are")} listed ${where}.${nearest}`;
    }
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
