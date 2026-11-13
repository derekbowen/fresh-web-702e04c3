/**
 * /s browse page — pure helpers.
 *
 * No network, no database, no clock. Everything the page decides (which URL
 * params count, what reaches the listing-read facade, what the visitor is told
 * when an answer is narrower than they asked for, pager hrefs, robots) lives
 * here so it can be tested without a server.
 *
 * ## What the mirror can and cannot express
 *
 * The page is built for PRNM_LISTING_READ_SOURCE=mirror-only, where every read
 * is answered by synced_listings and Sharetribe is never called. The mirror
 * search (searchSyncedListings in src/server/sharetribe.server.ts) filters on
 * exactly two things: `city_slug` / `city` and `state_code`. So:
 *
 *   state, city   real filters, offered as controls
 *   pub_category  accepted from incoming URLs (the homepage pool-type grid links
 *                 to `/s?pub_category=...`) and passed through, but NOT offered
 *                 as a control: the mirror search has no category predicate, so
 *                 in mirror and mirror-only it is ignored, and the facade does not
 *                 list it in MIRROR_UNSUPPORTED_OPTS, so nothing upstream flags it
 *   keywords, origin, bounds
 *                 legacy marketplace params, passed through so the facade can drop
 *                 and name them (`degraded`) in mirror-only
 *
 * `unappliedOpts` below works out, from which backend answered, which of the
 * Sharetribe-only options the visitor's results do not reflect, so the page can
 * say so instead of labelling an unfiltered list as filtered.
 */
import { z } from "zod";
import { STATE_NAMES } from "@/lib/states";
import { sharetribeUnsupportedOptsFor, type ListingReadSource } from "@/lib/listing-read-source";
import type { ListingReadOutcome, ServedBy } from "@/server/listing-read.server";
import type {
  ListingSearchResult,
  ListingSummary,
  SearchOptions,
} from "@/server/sharetribe.server";

export const BROWSE_PATH = "/s";
export const BROWSE_PER_PAGE = 24;
/** Deeper pages are treated as invalid and dropped (the param, not the request). */
export const BROWSE_MAX_PAGE = 500;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** The read itself: what reaches the server function and the facade. */
export interface BrowseQuery {
  /** Two-letter code from STATE_NAMES, uppercase. → SearchOptions.stateCode */
  state?: string;
  /** synced_listings.city_slug formula, e.g. "san-antonio". → SearchOptions.citySlug */
  city?: string;
  /** Incoming `pub_category`. Never offered as a control; see the module note. */
  category?: string;
  /** 2..BROWSE_MAX_PAGE. Page 1 is represented by absence. */
  page?: number;
  /** Legacy, from `keywords` | `keyword` | `q`. */
  keywords?: string;
  /** Legacy "lat,lng". */
  origin?: string;
  /** Legacy "neLat,neLng,swLat,swLng". */
  bounds?: string;
}

/** Route search state: the query plus what the page learnt from a legacy `address`. */
export interface BrowseSearch extends BrowseQuery {
  /**
   * A legacy `address` resolved to a US state/city but NOT applied, because the
   * URL also carried `bounds` or `origin`, which are the real geography of a
   * marketplace-style search. Offered as a one-click alternative when those
   * cannot be honoured.
   */
  addressScope?: { state: string; city?: string };
  /** A legacy `address` was present but could not be matched to a US state or city. */
  addressUnmatched?: true;
}

/** What the browse server function returns. */
export interface BrowseResult {
  listings: ListingSummary[];
  total: number;
  page: number;
  totalPages: number;
  perPage: number;
  servedBy: ServedBy;
  source: ListingReadSource;
  /** The facade's own `degraded`, unchanged. Only mirror-only sets it. */
  degraded: { droppedOpts: string[]; message: string } | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Field normalisation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * synced_listings.city_slug is written by `slugify` in
 * src/server/listing-sync.server.ts. This is that formula, step for step, minus
 * its `|| "listing"` fallback (an empty result here means "no city", not a city
 * called "listing"). It is deliberately NOT createSlug from listing-url.ts:
 * that is the marketplace's listing-slug formula and differs ("São Paulo" →
 * `sao-paulo` there, `s-o-paulo` in city_slug). Matching the stored column is
 * the only thing that matters. If listing-sync's slugify changes, change this.
 */
export function toMirrorCitySlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/** "san-antonio" → "San Antonio". Deterministic, so SSR and client agree. */
export function cityDisplayName(citySlug: string): string {
  return citySlug
    .split("-")
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(" ");
}

function normalizeStateName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z]+/g, " ")
    .trim();
}

const STATE_CODE_BY_NAME = new Map(
  Object.entries(STATE_NAMES).map(([code, name]) => [normalizeStateName(name), code]),
);

/** "TX" | "tx" | "Texas" | "new-york" → code from STATE_NAMES, else null. */
export function resolveStateCode(input: string): string | null {
  const t = input.trim();
  if (/^[A-Za-z]{2}$/.test(t)) {
    const code = t.toUpperCase();
    return STATE_NAMES[code] ? code : null;
  }
  return STATE_CODE_BY_NAME.get(normalizeStateName(t)) ?? null;
}

const CATEGORY_RE = /^[a-z0-9][a-z0-9_-]{0,59}$/;

export function normalizeCategory(input: string | undefined): string | undefined {
  if (!input) return undefined;
  const t = input.trim().toLowerCase();
  return CATEGORY_RE.test(t) ? t : undefined;
}

const NUM = String.raw`-?\d{1,3}(?:\.\d+)?`;
const ORIGIN_RE = new RegExp(`^(${NUM}),(${NUM})$`);
const BOUNDS_RE = new RegExp(`^(${NUM}),(${NUM}),(${NUM}),(${NUM})$`);

const isLat = (n: number) => Number.isFinite(n) && n >= -90 && n <= 90;
const isLng = (n: number) => Number.isFinite(n) && n >= -180 && n <= 180;

/** "30.27, -97.74" → "30.27,-97.74"; anything out of range → undefined. */
export function normalizeOrigin(input: string | undefined): string | undefined {
  if (!input) return undefined;
  const t = input.replace(/\s+/g, "");
  const m = ORIGIN_RE.exec(t);
  if (!m) return undefined;
  return isLat(Number(m[1])) && isLng(Number(m[2])) ? t : undefined;
}

/** Sharetribe order: neLat,neLng,swLat,swLng. A box whose NE is south of its SW is invalid. */
export function normalizeBounds(input: string | undefined): string | undefined {
  if (!input) return undefined;
  const t = input.replace(/\s+/g, "");
  const m = BOUNDS_RE.exec(t);
  if (!m) return undefined;
  const [neLat, neLng, swLat, swLng] = m.slice(1, 5).map(Number) as [
    number,
    number,
    number,
    number,
  ];
  if (!isLat(neLat) || !isLat(swLat) || !isLng(neLng) || !isLng(swLng)) return undefined;
  if (neLat < swLat) return undefined;
  return t;
}

const US_COUNTRY_ALIASES = new Set([
  "usa",
  "us",
  "u s a",
  "u s",
  "united states",
  "united states of america",
]);

/**
 * Resolve a legacy `address` display string to a US state, and a city when the
 * string names one. Conservative on purpose — a wrong geography is worse than
 * none (the `%melbourne%` lesson), so anything ambiguous returns null and the
 * page says it could not match the location:
 *
 *   "Texas" | "TX"                    → { state: "TX" }
 *   "Austin, TX" | "Austin, Texas"    → { state: "TX", city: "austin" }
 *   "Austin, TX 78701, USA"           → { state: "TX", city: "austin" }
 *   "123 Main St, Austin, TX"         → { state: "TX", city: "austin" }
 *   "Austin TX" (no comma)            → only with an UPPERCASE trailing code
 *   "Austin" | "Toronto, ON, Canada"  → null
 */
export function resolveAddressScope(address: string): { state: string; city?: string } | null {
  const parts = address
    .split(",")
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  if (parts.length > 0 && US_COUNTRY_ALIASES.has(normalizeStateName(parts[parts.length - 1]!))) {
    parts.pop();
  }
  if (parts.length === 0) return null;

  if (parts.length === 1) {
    const only = parts[0]!;
    const asState = resolveStateCode(only);
    if (asState) return { state: asState };
    // "Austin TX": accept only an uppercase trailing code, so "Ozark hi" or
    // "pool party ok" cannot turn into Hawaii or Oklahoma.
    const m = /^(.*\S)\s+([A-Z]{2})$/.exec(only);
    if (m && STATE_NAMES[m[2]!]) return withCity(m[2]!, m[1]!);
    return null;
  }

  const last = parts[parts.length - 1]!.replace(/\s+\d{5}(?:-\d{4})?$/, "");
  const state = resolveStateCode(last);
  if (!state) return null;
  return withCity(state, parts[parts.length - 2]!);
}

function withCity(state: string, cityPart: string): { state: string; city?: string } {
  // A part with digits is a street or a ZIP, not a city: keep the state only.
  if (/\d/.test(cityPart)) return { state };
  const city = toMirrorCitySlug(cityPart);
  return city ? { state, city } : { state };
}

// ─────────────────────────────────────────────────────────────────────────────
// Parsing (route validateSearch + server fn input)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TanStack Router JSON-parses each search value, so `?page=2` arrives as 2,
 * `?keywords=123` as 123 and a repeated key as an array. Reduce all of that to
 * one string or nothing.
 */
function scalar(v: unknown): string | undefined {
  const x = Array.isArray(v) ? v[0] : v;
  if (typeof x === "string") return x;
  if (typeof x === "number" && Number.isFinite(x)) return String(x);
  if (typeof x === "boolean") return String(x);
  return undefined;
}

/** Collapsed, trimmed, non-empty and at most `max` characters — or undefined. */
const text = (max: number) =>
  z
    .preprocess((v) => {
      const s = scalar(v);
      if (s === undefined) return undefined;
      const t = s.replace(/\s+/g, " ").trim();
      return t === "" ? undefined : t;
    }, z.string().max(max).optional())
    .catch(undefined);

/**
 * Every field `.catch`es to undefined, so an invalid value drops that one param
 * and a junk URL renders the unfiltered page. Parsing never throws for an
 * object input, which is what keeps `/s?page=banana` from being a 500.
 * Unknown keys are stripped (zod's default).
 */
const rawBrowseSearchSchema = z.object({
  state: text(40),
  city: text(120),
  pub_category: text(60),
  category: text(60),
  page: z
    .preprocess(scalar, z.coerce.number().int().min(1).max(BROWSE_MAX_PAGE).optional())
    .catch(undefined),
  keywords: text(200),
  keyword: text(200),
  q: text(200),
  origin: text(60),
  bounds: text(200),
  address: text(200),
});

export function parseBrowseSearch(raw: unknown): BrowseSearch {
  const parsed = rawBrowseSearchSchema.safeParse(raw ?? {});
  if (!parsed.success) return {};
  const r = parsed.data;
  const out: BrowseSearch = {};

  const state = r.state ? resolveStateCode(r.state) : null;
  if (state) out.state = state;
  const city = r.city ? toMirrorCitySlug(r.city) : "";
  if (city) out.city = city;

  const category = normalizeCategory(r.pub_category ?? r.category);
  if (category) out.category = category;
  if (r.page !== undefined && r.page > 1) out.page = r.page;

  const keywords = r.keywords ?? r.keyword ?? r.q;
  if (keywords) out.keywords = keywords;
  const origin = normalizeOrigin(r.origin);
  if (origin) out.origin = origin;
  const bounds = normalizeBounds(r.bounds);
  if (bounds) out.bounds = bounds;

  // Explicit state/city always win; `address` is only a fallback scope.
  if (r.address && !out.state && !out.city) {
    const scope = resolveAddressScope(r.address);
    if (!scope) {
      out.addressUnmatched = true;
    } else if (out.bounds || out.origin) {
      out.addressScope = scope;
    } else {
      out.state = scope.state;
      if (scope.city) out.city = scope.city;
    }
  }
  return out;
}

/** Every URL param /s understands, legacy aliases included. Anything else is ignored. */
export const BROWSE_URL_KEYS = [
  "state",
  "city",
  "pub_category",
  "category",
  "page",
  "keywords",
  "keyword",
  "q",
  "origin",
  "bounds",
  "address",
] as const;

export type BrowseUrlSearch = Partial<Record<(typeof BROWSE_URL_KEYS)[number], unknown>>;

/** True when parseBrowseSearch would use this one param for anything. */
function isUsableParam(key: (typeof BROWSE_URL_KEYS)[number], value: unknown): boolean {
  return value !== undefined && Object.keys(parseBrowseSearch({ [key]: value })).length > 0;
}

/**
 * The route's validateSearch. Two TanStack Router behaviours shape it:
 *
 * 1. It MERGES this output over the raw location search
 *    (`match.search = { ...raw, ...validated }`) instead of replacing it, so a
 *    param dropped by omission survives with its raw value: `?state=ZZ` would
 *    head an unfiltered list "Pool rentals in ZZ". Every key is therefore
 *    written, `undefined` when unusable.
 * 2. On SSR it rebuilds the href from that merge and REDIRECTS when it differs
 *    from the request. So this stays in the URL's own vocabulary and passes a
 *    usable value through untouched — same key, same type (`?page=2` arrives as
 *    the number 2 and must leave as 2). Valid URLs, including every href this
 *    page builds, never redirect; unusable params cost one redirect to the URL
 *    without them. Derived state (aliases, address → scope) is NOT written here,
 *    or it would land in the redirected URL; parseBrowseSearch derives it from
 *    this output in loaderDeps.
 */
export function parseBrowseRouteSearch(raw: Record<string, unknown>): BrowseUrlSearch {
  const out: BrowseUrlSearch = {};
  for (const k of BROWSE_URL_KEYS) out[k] = isUsableParam(k, raw?.[k]) ? raw[k] : undefined;
  return out;
}

/** Strip the address bookkeeping: what is left is the read. */
export function toBrowseQuery(search: BrowseSearch): BrowseQuery {
  const q: BrowseQuery = {};
  if (search.state) q.state = search.state;
  if (search.city) q.city = search.city;
  if (search.category) q.category = search.category;
  if (search.page && search.page > 1) q.page = search.page;
  if (search.keywords) q.keywords = search.keywords;
  if (search.origin) q.origin = search.origin;
  if (search.bounds) q.bounds = search.bounds;
  return q;
}

/** Server fn input validator. Same rules as the route, so a direct call cannot widen anything. */
export function parseBrowseQuery(data: unknown): BrowseQuery {
  return toBrowseQuery(parseBrowseSearch(data));
}

// ─────────────────────────────────────────────────────────────────────────────
// Mapping to the facade
// ─────────────────────────────────────────────────────────────────────────────

/** BrowseQuery → the facade's SearchOptions. Unset filters are omitted, never sent empty. */
export function toSearchOptions(q: BrowseQuery): SearchOptions {
  const opts: SearchOptions = { page: q.page ?? 1, perPage: BROWSE_PER_PAGE };
  if (q.state) opts.stateCode = q.state;
  if (q.city) opts.citySlug = q.city;
  if (q.category) opts.pub_category = q.category;
  if (q.keywords) opts.keywords = q.keywords;
  if (q.origin) opts.origin = q.origin;
  if (q.bounds) opts.bounds = q.bounds;
  return opts;
}

/**
 * Facade outcome → what the page needs. Descriptions are blanked: ListingCard
 * never renders them and 24 of them would otherwise ride along in every SSR
 * payload. Price, title, image, city and state pass through untouched.
 */
export function toBrowseResult(outcome: ListingReadOutcome<ListingSearchResult>): BrowseResult {
  const r = outcome.result;
  return {
    listings: r.listings.map((l) => ({ ...l, description: "" })),
    total: r.total,
    page: r.page,
    totalPages: Math.max(0, r.totalPages),
    perPage: BROWSE_PER_PAGE,
    servedBy: outcome.servedBy,
    source: outcome.source,
    degraded: outcome.degraded
      ? { droppedOpts: outcome.degraded.droppedOpts.slice(), message: outcome.degraded.message }
      : null,
  };
}

/** For when the read threw. Shaped like the facade's own unserviceable answer. */
export function unavailableBrowseResult(source: ListingReadSource, page = 1): BrowseResult {
  return {
    listings: [],
    total: 0,
    page,
    totalPages: 0,
    perPage: BROWSE_PER_PAGE,
    servedBy: "unserviceable",
    source,
    degraded: { droppedOpts: [], message: "Listings are temporarily unavailable." },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// What the results do and do not reflect
// ─────────────────────────────────────────────────────────────────────────────

/** Options only the Sharetribe Marketplace API can apply. Fixed display order. */
const SHARETRIBE_ONLY_OPTS = ["keywords", "bounds", "pub_category", "origin"] as const;

function requestedSharetribeOnlyOpts(q: BrowseQuery): string[] {
  const opts = toSearchOptions(q) as Record<string, unknown>;
  return SHARETRIBE_ONLY_OPTS.filter((k) => opts[k] !== undefined);
}

/**
 * Which requested Sharetribe-only options the results do NOT reflect.
 *
 * Union of the facade's own `degraded.droppedOpts` (authoritative, mirror-only)
 * and what follows from which backend answered:
 *   mirror, legacy                 → the mirror answered: none applied
 *   sharetribe + a city/state      → the legacy router sent it to the mirror
 *   sharetribe, no city/state      → the Marketplace API answered: all applied
 *   sharetribe-fallback            → the Marketplace API answered: all applied
 *   unserviceable                  → nothing was shown; reported separately
 *
 * The second half is what catches `pub_category`, which no source flags.
 */
export function unappliedOpts(
  q: BrowseQuery,
  result: Pick<BrowseResult, "servedBy" | "degraded">,
): string[] {
  if (result.servedBy === "unserviceable") return [];
  const requested = requestedSharetribeOnlyOpts(q);
  const hasGeo =
    sharetribeUnsupportedOptsFor(toSearchOptions(q) as Record<string, unknown>).length > 0;
  const mirrorAnswered =
    result.servedBy === "mirror" ||
    result.servedBy === "legacy" ||
    (result.servedBy === "sharetribe" && hasGeo);

  const out = new Set<string>(result.degraded?.droppedOpts ?? []);
  if (mirrorAnswered) requested.forEach((k) => out.add(k));

  const known = SHARETRIBE_ONLY_OPTS.filter((k) => out.has(k));
  const unknown = [...out]
    .filter((k) => !(SHARETRIBE_ONLY_OPTS as readonly string[]).includes(k))
    .sort();
  return [...known, ...unknown];
}

// ─────────────────────────────────────────────────────────────────────────────
// Labels
// ─────────────────────────────────────────────────────────────────────────────

/** "Austin, TX" | "Texas" | "Austin" | null. */
export function scopeLabel(q: Pick<BrowseQuery, "state" | "city">): string | null {
  if (q.city && q.state) return `${cityDisplayName(q.city)}, ${q.state}`;
  if (q.state) return STATE_NAMES[q.state] ?? q.state;
  if (q.city) return cityDisplayName(q.city);
  return null;
}

export function browseHeading(q: BrowseQuery): string {
  const scope = scopeLabel(q);
  return scope ? `Pool rentals in ${scope}` : "Pool rentals";
}

const fmt = (n: number) => n.toLocaleString("en-US");

/** "1 pool" | "18 pools" | "Showing 25–48 of 113 pools" | null when nothing is shown. */
export function describeResultCount(
  total: number,
  page: number,
  perPage: number,
  shown: number,
): string | null {
  if (total <= 0 || shown <= 0) return null;
  const noun = total === 1 ? "pool" : "pools";
  if (page <= 1 && shown >= total) return `${fmt(total)} ${noun}`;
  const from = (page - 1) * perPage + 1;
  const to = from + shown - 1;
  return `Showing ${fmt(from)}–${fmt(to)} of ${fmt(total)} ${noun}`;
}

/** Labels for Sharetribe-only filters that the results DO reflect (default source, no city/state). */
export function appliedExtras(
  q: BrowseQuery,
  result: Pick<BrowseResult, "servedBy" | "degraded">,
): string[] {
  if (result.servedBy === "unserviceable") return [];
  const unapplied = new Set(unappliedOpts(q, result));
  const out: string[] = [];
  if (q.keywords && !unapplied.has("keywords")) out.push(`Matching “${q.keywords}”`);
  if (q.category && !unapplied.has("pub_category")) out.push(`Pool type: ${q.category}`);
  if (q.bounds && !unapplied.has("bounds")) out.push("Within the map area you searched");
  if (q.origin && !unapplied.has("origin")) out.push("Sorted by distance");
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// The notice (aria-live banner)
// ─────────────────────────────────────────────────────────────────────────────

export interface BrowseNotice {
  kind: "none" | "degraded" | "unavailable";
  /** Visitor-facing copy. Empty when kind is "none". */
  message: string;
  /** Requested options the results do not reflect. */
  unapplied: string[];
  /** A genuinely different, better-scoped result the visitor can switch to. */
  action: { href: string; label: string } | null;
}

const OPT_PHRASE: Record<string, string> = {
  keywords: "keyword search",
  bounds: "map-area search",
  pub_category: "filtering by pool type",
};

function joinPhrases(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

const capitalize = (s: string) => (s ? s[0]!.toUpperCase() + s.slice(1) : s);

/**
 * What the banner says. `result` null means the read itself failed in transit.
 * Copy names what is unavailable and what is shown instead; it promises nothing
 * about when it comes back.
 */
export function decideBrowseNotice(
  search: BrowseSearch,
  result: Pick<BrowseResult, "servedBy" | "degraded"> | null,
): BrowseNotice {
  const q = toBrowseQuery(search);

  if (!result || result.servedBy === "unserviceable") {
    return {
      kind: "unavailable",
      message: "Pool listings are temporarily unavailable. Please try again later.",
      unapplied: [],
      action: null,
    };
  }

  const unapplied = unappliedOpts(q, result);
  const filterOpts = unapplied.filter((k) => k !== "origin");
  const originUnapplied = unapplied.includes("origin");

  const reasons: string[] = [];
  if (search.addressUnmatched)
    reasons.push("we couldn't match that location to a US state or city");
  if (filterOpts.length > 0) {
    const known = filterOpts.filter((k) => OPT_PHRASE[k]).map((k) => OPT_PHRASE[k]!);
    const hasUnknown = filterOpts.some((k) => !OPT_PHRASE[k]);
    const phrases = hasUnknown ? [...known, "some search filters"] : known;
    const plural = phrases.length > 1 || hasUnknown;
    reasons.push(`${joinPhrases(phrases)} ${plural ? "are" : "is"} temporarily unavailable`);
  }

  let message = "";
  if (reasons.length > 0) {
    const scope = scopeLabel(q);
    const target = scope ? `all pools in ${scope}` : "all available pools";
    message = `${capitalize(reasons.join(", and "))}, so we're showing ${target}${
      originUnapplied ? ", not sorted by distance" : ""
    }.`;
  } else if (originUnapplied) {
    message =
      "Sorting by distance is temporarily unavailable, so these pools are not in distance order.";
  }

  // Only offer the address scope when the geography that pre-empted it was dropped.
  const geoDropped = unapplied.includes("bounds") || unapplied.includes("origin");
  const action =
    search.addressScope && geoDropped
      ? {
          href: buildBrowseHref({
            state: search.addressScope.state,
            city: search.addressScope.city,
          }),
          label: `Show pools in ${scopeLabel(search.addressScope)}`,
        }
      : null;

  return { kind: message ? "degraded" : "none", message, unapplied, action };
}

// ─────────────────────────────────────────────────────────────────────────────
// Body, hrefs and pager
// ─────────────────────────────────────────────────────────────────────────────

export type BrowseBody = "unavailable" | "results" | "empty" | "out-of-range";

export function decideBrowseBody(
  result: Pick<BrowseResult, "servedBy" | "listings" | "total"> | null,
): BrowseBody {
  if (!result || result.servedBy === "unserviceable") return "unavailable";
  if (result.listings.length > 0) return "results";
  return result.total > 0 ? "out-of-range" : "empty";
}

/** True when anything narrows or pages the result. Address bookkeeping counts. */
export function isFilteredOrPaged(search: BrowseSearch): boolean {
  return (
    Object.keys(toBrowseQuery(search)).length > 0 ||
    !!search.addressScope ||
    !!search.addressUnmatched
  );
}

/**
 * `/s?state=TX&city=austin&page=2`. Fixed key order so the same query is
 * always the same URL. Page 1 is never written. Legacy params are kept so a
 * pager does not silently change the query between pages.
 */
export function buildBrowseHref(q: BrowseQuery): string {
  const p = new URLSearchParams();
  if (q.state) p.set("state", q.state);
  if (q.city) p.set("city", q.city);
  if (q.category) p.set("pub_category", q.category);
  if (q.keywords) p.set("keywords", q.keywords);
  if (q.origin) p.set("origin", q.origin);
  if (q.bounds) p.set("bounds", q.bounds);
  if (q.page && q.page > 1) p.set("page", String(q.page));
  const s = p.toString();
  return s ? `${BROWSE_PATH}?${s}` : BROWSE_PATH;
}

export interface BrowsePager {
  page: number;
  totalPages: number;
  prevHref: string | null;
  nextHref: string | null;
}

/** null when there is only one page. Prev from beyond the end lands on the last page. */
export function buildPager(q: BrowseQuery, totalPages: number): BrowsePager | null {
  const page = q.page ?? 1;
  if (totalPages <= 1 && page <= 1) return null;
  const prevPage = Math.max(1, Math.min(page - 1, totalPages));
  return {
    page,
    totalPages,
    prevHref: page > 1 ? buildBrowseHref({ ...q, page: prevPage }) : null,
    nextHref: page < totalPages ? buildBrowseHref({ ...q, page: page + 1 }) : null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SEO
// ─────────────────────────────────────────────────────────────────────────────

export interface BrowseSeo {
  title: string;
  description: string;
  /** Always the bare search page. */
  canonicalPath: string;
  /** null means "emit no robots meta" (indexable). */
  robots: string | null;
}

/**
 * robots policy:
 *   filtered or paged variant → noindex, follow (robots.txt also disallows `/s?`)
 *   bare /s with results      → indexable; robots.txt already allows it as the
 *                               search hub, and it is a crawl path to listings
 *   bare /s, empty/unavailable→ noindex, follow, so an outage is not indexed
 */
export function browseSeo(search: BrowseSearch, body: BrowseBody): BrowseSeo {
  const q = toBrowseQuery(search);
  const scope = scopeLabel(q);
  const pageSuffix = q.page && q.page > 1 ? ` (page ${q.page})` : "";
  const title = scope
    ? `Pool rentals in ${scope}${pageSuffix} | Pool Rental Near Me`
    : `Browse private pool rentals${pageSuffix} | Pool Rental Near Me`;
  const description = scope
    ? `Browse private pools listed for hourly rental in ${scope} on Pool Rental Near Me.`
    : "Browse private pools listed for hourly rental on Pool Rental Near Me. Filter by state or city.";
  const indexable = !isFilteredOrPaged(search) && body === "results";
  return {
    title,
    description,
    canonicalPath: BROWSE_PATH,
    robots: indexable ? null : "noindex, follow",
  };
}

/** Options for the state select, alphabetical by name. Static data, no query. */
export const BROWSE_STATE_OPTIONS: ReadonlyArray<{ code: string; name: string }> = Object.entries(
  STATE_NAMES,
)
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name, "en-US"));
