/**
 * Structural parity between a Sharetribe listing read and the Supabase mirror.
 *
 * Pure — no network, no database, no clock. Every function here is a
 * deterministic transform so the test suite can assert on fixtures and the
 * shadow-mode harness can reuse the identical comparison against live traffic.
 *
 * Design rule, from the migration brief: DO NOT SILENTLY NORMALIZE. Where the
 * two sources disagree, that disagreement is the output. Nothing is coerced,
 * trimmed, case-folded or rounded to make a diff disappear — a normalizer here
 * would hide exactly the divergence this harness exists to find.
 */

import { isPrnmHostedImageUrl } from "./listing-images";

// ─────────────────────────────────────────────────────────────────────────────
// Findings
// ─────────────────────────────────────────────────────────────────────────────

/**
 * blocking      The mirror cannot serve this read correctly. Cutting over would
 *               change what a visitor sees.
 * degraded      The mirror answers, but with less or staler data than Sharetribe.
 * cosmetic      Representational difference with no user-visible effect.
 * unsupported   The mirror has no way to express this query at all.
 */
export type ParitySeverity = "blocking" | "degraded" | "cosmetic" | "unsupported";

export interface ParityFinding {
  /** Dotted path, e.g. "listings[2].price.amount" or "pagination.total". */
  field: string;
  severity: ParitySeverity;
  /** Stable machine-readable reason, for grouping in the report. */
  code: string;
  sharetribe: unknown;
  mirror: unknown;
  /** One line a human can act on. */
  detail: string;
}

export interface ParityReport {
  generatedFor: string;
  comparedListings: number;
  findings: ParityFinding[];
  /** Counts keyed by severity; every severity present as a key, zero-filled. */
  bySeverity: Record<ParitySeverity, number>;
  /** Counts keyed by `code`, descending. */
  byCode: Array<{ code: string; count: number; severity: ParitySeverity }>;
  /** True only when there is not a single blocking or unsupported finding. */
  mirrorCanServe: boolean;
}

const SEVERITY_ORDER: ParitySeverity[] = ["blocking", "unsupported", "degraded", "cosmetic"];

// ─────────────────────────────────────────────────────────────────────────────
// Images — the migration blocker the audit flagged
// ─────────────────────────────────────────────────────────────────────────────

export const SHARETRIBE_IMAGE_HOST = "sharetribe.imgix.net";

export interface ImageUrlFacts {
  url: string;
  /** Parsed host, or null when the value is not a parseable absolute URL. */
  host: string | null;
  /** True when the bytes are served by Sharetribe's imgix account. */
  sharetribeHosted: boolean;
  /** True when the URL carries imgix's `s=` signature, which we cannot re-mint. */
  signed: boolean;
  /** Sharetribe marketplace UUID from the path, when present. */
  marketplaceId: string | null;
  /** Sharetribe image UUID from the path — the only durable handle we persist. */
  imageId: string | null;
  /** True when the bytes are already served from PRNM-owned Supabase Storage. */
  prnmHosted: boolean;
  /**
   * True when the URL dies with Sharetribe. A signed, Sharetribe-hosted URL
   * cannot be re-signed by us and the bytes cannot be re-fetched afterwards, so
   * the stored string is worthless the moment the account goes away.
   */
  diesWithSharetribe: boolean;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Decompose a persisted image URL.
 *
 * The important question is not "is there a URL" but "does the URL survive
 * Sharetribe being switched off". synced_listings.image_urls stores fully
 * resolved, signed imgix URLs; the image UUID is recoverable from the path
 * (so we can enumerate what to download) but the bytes are only obtainable
 * while Sharetribe still serves them.
 */
export function classifyImageUrl(url: unknown): ImageUrlFacts {
  const base: ImageUrlFacts = {
    url: typeof url === "string" ? url : String(url),
    host: null,
    sharetribeHosted: false,
    signed: false,
    marketplaceId: null,
    imageId: null,
    prnmHosted: false,
    diesWithSharetribe: false,
  };

  if (typeof url !== "string" || url.trim() === "") return base;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return base;
  }

  const host = parsed.host.toLowerCase();
  const sharetribeHosted = host === SHARETRIBE_IMAGE_HOST || host.endsWith(".sharetribe.com");
  const prnmHosted = isPrnmHostedImageUrl(url);
  const signed = parsed.searchParams.has("s");

  const segments = parsed.pathname.split("/").filter(Boolean);

  // Sharetribe path is /{marketplaceId}/{imageId}.
  const marketplaceId = segments[0] && UUID_RE.test(segments[0]) ? segments[0] : null;
  let imageId = segments[1] && UUID_RE.test(segments[1]) ? segments[1] : null;

  // A re-hosted object is .../listing-images/{listingId}/{imageId}.{ext}, so the
  // Sharetribe image UUID survives in the filename. Recovering it is what lets
  // the diff tell "same picture, now ours" from "two different pictures".
  if (prnmHosted && !imageId) {
    const stem = (segments[segments.length - 1] ?? "").replace(/\.[a-z0-9]+$/i, "");
    if (UUID_RE.test(stem)) imageId = stem;
  }

  return {
    ...base,
    host,
    sharetribeHosted,
    signed,
    marketplaceId,
    imageId,
    prnmHosted,
    diesWithSharetribe: sharetribeHosted,
  };
}

/** Every distinct Sharetribe image UUID in a set of URLs — the download worklist for Phase 1b. */
export function sharetribeImageIds(urls: Iterable<unknown>): string[] {
  const out = new Set<string>();
  for (const u of urls) {
    const facts = classifyImageUrl(u);
    if (facts.sharetribeHosted && facts.imageId) out.add(facts.imageId);
  }
  return [...out];
}

// ─────────────────────────────────────────────────────────────────────────────
// Value comparison
// ─────────────────────────────────────────────────────────────────────────────

/** Deep structural equality. Key order is ignored; nothing else is. */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  // NaN
  if (typeof a === "number" && typeof b === "number") {
    return Number.isNaN(a) && Number.isNaN(b);
  }
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return false;

  const aArr = Array.isArray(a);
  if (aArr !== Array.isArray(b)) return false;
  if (aArr) {
    const x = a as unknown[];
    const y = b as unknown[];
    return x.length === y.length && x.every((v, i) => deepEqual(v, y[i]));
  }

  const x = a as Record<string, unknown>;
  const y = b as Record<string, unknown>;
  const xk = Object.keys(x);
  const yk = Object.keys(y);
  if (xk.length !== yk.length) return false;
  return xk.every((k) => Object.prototype.hasOwnProperty.call(y, k) && deepEqual(x[k], y[k]));
}

/**
 * A number the mirror stores through NUMERIC and returns as a string, or a
 * Postgres-widened integer, is still the same value. This is the ONE place a
 * representational difference is tolerated, and it is reported as cosmetic
 * rather than dropped — see `numericallyEqual` callers.
 */
function numericallyEqual(a: unknown, b: unknown): boolean {
  const an = typeof a === "string" ? Number(a) : a;
  const bn = typeof b === "string" ? Number(b) : b;
  if (typeof an !== "number" || typeof bn !== "number") return false;
  if (Number.isNaN(an) || Number.isNaN(bn)) return false;
  return an === bn;
}

// ─────────────────────────────────────────────────────────────────────────────
// Listing summary diff
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A listing from either source. Deliberately loose: the point of the harness is
 * to find fields the two sides disagree about, including fields one side does
 * not return at all, so a strict interface here would hide findings at compile
 * time instead of surfacing them at runtime.
 *
 * Recognised keys (all optional): `id`, `slug`, `title`, `description`, `price`
 * ({amount,currency}), `city`, `state`, `imageUrl`, `url`, `geolocation`
 * ({lat,lng}), `publicData`, `metadata`, `authorId`, `listingState`.
 */
export type ListingLike = Partial<Record<string, unknown>>;

/** Fields where any difference changes what a visitor sees. */
const BLOCKING_FIELDS = new Set(["id", "title", "price"]);
/**
 * Fields where a difference is real but softer.
 *
 * `slug` and `url` were blocking here on the strength of the audit's claim that
 * a differing slug splits the canonical URL. Probing production disproved it:
 * the marketplace registers /l/:slug/:id AND /l/:id and its canonicalRoutePath
 * strips the slug, so every variant returns 200 with the same slug-less
 * canonical and Google consolidates them. A slug mismatch is now a consistency
 * problem — worth reporting, not worth blocking a cutover over. See
 * src/lib/listing-url.ts.
 */
const DEGRADED_FIELDS = new Set([
  "slug",
  "url",
  "description",
  "city",
  "state",
  "geolocation",
  "imageUrl",
  "publicData",
  "metadata",
  "authorId",
  "listingState",
]);

function severityForField(field: string): ParitySeverity {
  if (BLOCKING_FIELDS.has(field)) return "blocking";
  if (DEGRADED_FIELDS.has(field)) return "degraded";
  return "degraded";
}

/**
 * Compare one listing from each source.
 *
 * `path` prefixes every finding so search-result diffs stay addressable
 * (`listings[3].price`). Fields absent from BOTH sides are not compared —
 * a field neither source returns is not a parity problem. A field present on
 * one side only IS reported, as a missing/extra finding.
 */
export function diffListing(
  sharetribe: object | null | undefined,
  mirror: object | null | undefined,
  path = "",
): ParityFinding[] {
  const p = (f: string) => (path ? `${path}.${f}` : f);
  const findings: ParityFinding[] = [];

  if (!sharetribe && !mirror) return findings;

  if (sharetribe && !mirror) {
    findings.push({
      field: path || "listing",
      severity: "blocking",
      code: "listing-missing-from-mirror",
      sharetribe: (sharetribe as ListingLike).id ?? sharetribe,
      mirror: null,
      detail:
        "Sharetribe returned this listing and the mirror has no row for it — the sync has not " +
        "seen it yet, or tombstoned it incorrectly.",
    });
    return findings;
  }

  if (!sharetribe && mirror) {
    findings.push({
      field: path || "listing",
      severity: "blocking",
      code: "listing-only-in-mirror",
      sharetribe: null,
      mirror: (mirror as ListingLike).id ?? mirror,
      detail:
        "The mirror returned a listing Sharetribe did not — it is stale (closed, deleted or " +
        "unpublished upstream) and would be shown to visitors after cutover.",
    });
    return findings;
  }

  const st = sharetribe as ListingLike;
  const mi = mirror as ListingLike;

  const FIELDS = [
    "id",
    "slug",
    "title",
    "description",
    "url",
    "city",
    "state",
    "authorId",
    "listingState",
  ];

  for (const field of FIELDS) {
    const hasSt = Object.prototype.hasOwnProperty.call(st, field);
    const hasMi = Object.prototype.hasOwnProperty.call(mi, field);
    if (!hasSt && !hasMi) continue;

    if (hasSt && !hasMi) {
      findings.push({
        field: p(field),
        severity: severityForField(field),
        code: "field-absent-from-mirror",
        sharetribe: st[field],
        mirror: undefined,
        detail: `The mirror read does not return \`${field}\` at all.`,
      });
      continue;
    }
    if (!hasSt && hasMi) {
      findings.push({
        field: p(field),
        severity: "cosmetic",
        code: "field-only-in-mirror",
        sharetribe: undefined,
        mirror: mi[field],
        detail: `The mirror returns \`${field}\`, which the Sharetribe read does not.`,
      });
      continue;
    }

    if (!deepEqual(st[field], mi[field])) {
      findings.push({
        field: p(field),
        severity: severityForField(field),
        code: `field-mismatch:${field}`,
        sharetribe: st[field],
        mirror: mi[field],
        detail: `\`${field}\` differs between sources.`,
      });
    }
  }

  findings.push(...diffPrice(st.price, mi.price, p("price")));
  findings.push(...diffGeolocation(st.geolocation, mi.geolocation, p("geolocation")));
  findings.push(...diffImages(st, mi, path));
  findings.push(...diffExtendedData(st.publicData, mi.publicData, p("publicData"), "publicData"));
  findings.push(...diffExtendedData(st.metadata, mi.metadata, p("metadata"), "metadata"));

  return findings;
}

function diffPrice(st: unknown, mi: unknown, field: string): ParityFinding[] {
  if (st === undefined && mi === undefined) return [];
  if (deepEqual(st, mi)) return [];

  const stObj = st as { amount?: unknown; currency?: unknown } | null;
  const miObj = mi as { amount?: unknown; currency?: unknown } | null;

  if (stObj && miObj && typeof stObj === "object" && typeof miObj === "object") {
    const out: ParityFinding[] = [];
    if (!deepEqual(stObj.amount, miObj.amount)) {
      // A NUMERIC round-trip can hand back "8050" for 8050. Same money, and it
      // is reported rather than hidden because a consumer doing arithmetic on
      // the string would silently produce a wrong total.
      const cosmetic = numericallyEqual(stObj.amount, miObj.amount);
      out.push({
        field: `${field}.amount`,
        severity: cosmetic ? "cosmetic" : "blocking",
        code: cosmetic ? "price-amount-type-differs" : "price-amount-mismatch",
        sharetribe: stObj.amount,
        mirror: miObj.amount,
        detail: cosmetic
          ? "Same value, different JS type — the mirror returns it as a string. Any consumer " +
            "doing arithmetic without coercion gets a wrong total."
          : "Price amount differs. A displayed all-in price must equal the checkout total to " +
            "the penny, so this is never shippable.",
      });
    }
    if (!deepEqual(stObj.currency, miObj.currency)) {
      out.push({
        field: `${field}.currency`,
        severity: "blocking",
        code: "price-currency-mismatch",
        sharetribe: stObj.currency,
        mirror: miObj.currency,
        detail:
          "Currency differs. One marketplace is one currency (USD); anything else cannot be booked.",
      });
    }
    if (out.length) return out;
  }

  return [
    {
      field,
      severity: "blocking",
      code: "price-mismatch",
      sharetribe: st,
      mirror: mi,
      detail:
        st === null || mi === null
          ? "One source has no price for this listing and the other does."
          : "Price objects differ structurally.",
    },
  ];
}

function diffGeolocation(st: unknown, mi: unknown, field: string): ParityFinding[] {
  if (st === undefined && mi === undefined) return [];
  if (deepEqual(st, mi)) return [];

  const a = st as { lat?: unknown; lng?: unknown } | null;
  const b = mi as { lat?: unknown; lng?: unknown } | null;

  if (a && b && typeof a === "object" && typeof b === "object") {
    const latSame = deepEqual(a.lat, b.lat) || numericallyEqual(a.lat, b.lat);
    const lngSame = deepEqual(a.lng, b.lng) || numericallyEqual(a.lng, b.lng);
    if (latSame && lngSame) {
      return [
        {
          field,
          severity: "cosmetic",
          code: "geolocation-type-differs",
          sharetribe: st,
          mirror: mi,
          detail:
            "Same coordinates, different types — synced_listings stores lat/lng as NUMERIC and " +
            "PostgREST returns them as strings.",
        },
      ];
    }
  }

  return [
    {
      field,
      severity: "degraded",
      code: "geolocation-mismatch",
      sharetribe: st,
      mirror: mi,
      detail:
        st === null || mi === null
          ? "One source has no geolocation. Map pins and distance sort depend on it."
          : "Coordinates differ between sources.",
    },
  ];
}

/**
 * Image parity, plus the durability question.
 *
 * Two separate concerns, reported separately:
 *   1. do the sources agree on which image to show
 *   2. does the stored URL survive Sharetribe going away (it does not)
 */
function diffImages(st: ListingLike, mi: ListingLike, path: string): ParityFinding[] {
  const p = (f: string) => (path ? `${path}.${f}` : f);
  const out: ParityFinding[] = [];

  const stUrl = st.imageUrl;
  const miUrl = mi.imageUrl;
  const hasEither = stUrl !== undefined || miUrl !== undefined;

  if (hasEither && !deepEqual(stUrl, miUrl)) {
    const stFacts = classifyImageUrl(stUrl);
    const miFacts = classifyImageUrl(miUrl);
    // Same underlying image, different imgix variant, is still a different
    // asset on the page (different dimensions and crop), so it is degraded
    // rather than cosmetic.
    const sameImage = !!stFacts.imageId && !!miFacts.imageId && stFacts.imageId === miFacts.imageId;

    // Phase 1b's intended end state: Sharetribe still serves imgix, the mirror
    // now serves the same picture from our own storage. The URLs differ by
    // design, so this is success, not a defect — and it must never read as
    // blocking or the parity gate would refuse to let the migration land.
    if (sameImage && miFacts.prnmHosted && !stFacts.prnmHosted) {
      out.push({
        field: p("imageUrl"),
        severity: "cosmetic",
        code: "image-rehosted-to-prnm",
        sharetribe: stUrl,
        mirror: miUrl,
        detail:
          `Image ${miFacts.imageId} has been re-hosted: Sharetribe still serves it from ` +
          `${stFacts.host}, the mirror serves the same picture from PRNM storage. This URL ` +
          "survives Sharetribe being switched off.",
      });
    }

    out.push({
      field: p("imageUrl"),
      severity: stUrl == null || miUrl == null ? "blocking" : "degraded",
      code: sameImage ? "image-variant-differs" : "image-mismatch",
      sharetribe: stUrl,
      mirror: miUrl,
      detail: sameImage
        ? `Same Sharetribe image (${stFacts.imageId}) but a different imgix variant. The sync ` +
          "stores landscape-crop2x while the detail read asks for scaled-large, so the mirror " +
          "serves a different crop and resolution than production does today."
        : stUrl == null
          ? "Sharetribe returns no hero image but the mirror does — the mirror row is stale."
          : miUrl == null
            ? "Sharetribe has a hero image and the mirror has none. The listing renders imageless."
            : "The two sources point at different images entirely.",
    });
  }

  // Durability, asked only of the MIRROR's URL.
  //
  // The Sharetribe read's URL dying with Sharetribe is a tautology, not a
  // finding — we are leaving Sharetribe. What matters is whether the URL the
  // mirror would serve after cutover survives, so the count of these findings is
  // exactly the Phase 1b work remaining.
  if (miUrl != null) {
    const facts = classifyImageUrl(miUrl);
    if (facts.diesWithSharetribe) {
      out.push({
        field: p("imageUrl.mirror"),
        severity: "blocking",
        code: "image-host-dies-with-sharetribe",
        sharetribe: undefined,
        mirror: miUrl,
        detail:
          `Served by ${facts.host}${facts.signed ? " with an imgix signature we cannot re-mint" : ""}. ` +
          `The mirror persists the URL string only — no bytes, and the image UUID ` +
          `(${facts.imageId ?? "unparseable"}) is recoverable from the path but the bytes are ` +
          "only fetchable while Sharetribe still serves them. Re-host it (bun run rehost:images) " +
          "or this photo 404s at cutover.",
      });
    }
  }

  return out;
}

/**
 * Extended data. Compared only when both sides supply the scope — the mirror
 * stores publicData and metadata as whole JSONB copies, so where it returns
 * them they should match exactly. Per-key diffs, so a report names the key.
 */
function diffExtendedData(
  st: unknown,
  mi: unknown,
  field: string,
  scope: "publicData" | "metadata",
): ParityFinding[] {
  if (st === undefined || mi === undefined) return [];
  if (deepEqual(st, mi)) return [];

  if (st === null || mi === null || typeof st !== "object" || typeof mi !== "object") {
    return [
      {
        field,
        severity: "degraded",
        code: `${scope}-mismatch`,
        sharetribe: st,
        mirror: mi,
        detail: `\`${scope}\` is not an object on at least one side.`,
      },
    ];
  }

  const a = st as Record<string, unknown>;
  const b = mi as Record<string, unknown>;
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
  const out: ParityFinding[] = [];

  for (const key of keys) {
    const inA = Object.prototype.hasOwnProperty.call(a, key);
    const inB = Object.prototype.hasOwnProperty.call(b, key);
    if (inA && !inB) {
      out.push({
        field: `${field}.${key}`,
        severity: "degraded",
        code: `${scope}-key-absent-from-mirror`,
        sharetribe: a[key],
        mirror: undefined,
        detail: `\`${scope}.${key}\` is present upstream and missing from the mirror.`,
      });
    } else if (!inA && inB) {
      out.push({
        field: `${field}.${key}`,
        severity: "degraded",
        code: `${scope}-key-stale-in-mirror`,
        sharetribe: undefined,
        mirror: b[key],
        detail:
          `\`${scope}.${key}\` exists only in the mirror — it was removed upstream and the ` +
          "sync did not clear it.",
      });
    } else if (!deepEqual(a[key], b[key])) {
      out.push({
        field: `${field}.${key}`,
        severity: "degraded",
        code: `${scope}-key-mismatch`,
        sharetribe: a[key],
        mirror: b[key],
        detail: `\`${scope}.${key}\` differs between sources.`,
      });
    }
  }

  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Search result diff
// ─────────────────────────────────────────────────────────────────────────────

export interface ComparableSearchResult {
  listings: readonly object[];
  total?: unknown;
  page?: unknown;
  totalPages?: unknown;
}

/**
 * Compare two search responses.
 *
 * Membership and ordering are diffed separately from per-listing fields,
 * because "same listings in a different order" and "different listings" are
 * different problems with different fixes. Per-listing field diffs are only
 * emitted for listings that appear in BOTH sides, matched by id rather than by
 * index — otherwise one inserted row shifts every subsequent index and buries
 * the real finding under dozens of spurious ones.
 */
export function diffSearchResult(
  sharetribe: ComparableSearchResult | null | undefined,
  mirror: ComparableSearchResult | null | undefined,
  opts: { unsupportedOpts?: readonly string[] } = {},
): ParityFinding[] {
  const findings: ParityFinding[] = [];

  for (const key of opts.unsupportedOpts ?? []) {
    findings.push({
      field: `query.${key}`,
      severity: "unsupported",
      code: "query-opt-unsupported-by-mirror",
      sharetribe: key,
      mirror: null,
      detail:
        `\`${key}\` has no synced_listings equivalent — it is a Sharetribe server-side feature ` +
        "(geo bounds, distance sort or full-text relevance). Serving it from the mirror would " +
        "return a different result set, not the same one more cheaply.",
    });
  }

  if (!sharetribe || !mirror) {
    findings.push({
      field: "result",
      severity: "blocking",
      code: "search-result-absent",
      sharetribe: sharetribe ? "present" : null,
      mirror: mirror ? "present" : null,
      detail: "One source returned no result object at all.",
    });
    return findings;
  }

  const stList = Array.isArray(sharetribe.listings) ? sharetribe.listings : [];
  const miList = Array.isArray(mirror.listings) ? mirror.listings : [];

  // Pagination
  for (const key of ["total", "page", "totalPages"] as const) {
    const a = sharetribe[key];
    const b = mirror[key];
    if (a === undefined && b === undefined) continue;
    if (deepEqual(a, b)) continue;
    const cosmetic = numericallyEqual(a, b);
    findings.push({
      field: `pagination.${key}`,
      severity: cosmetic ? "cosmetic" : key === "total" ? "blocking" : "degraded",
      code: cosmetic ? `pagination-${key}-type-differs` : `pagination-${key}-mismatch`,
      sharetribe: a,
      mirror: b,
      detail: cosmetic
        ? `Same \`${key}\`, different type.`
        : key === "total"
          ? "Result totals differ, so pagination controls and 'N pools' copy would be wrong."
          : `\`${key}\` differs between sources.`,
    });
  }

  // Membership, by id
  const idOf = (l: ListingLike): string | null =>
    typeof l?.id === "string" ? l.id : l?.id == null ? null : String(l.id);

  const stIds = stList.map(idOf);
  const miIds = miList.map(idOf);
  const stSet = new Set(stIds.filter((v): v is string => v !== null));
  const miSet = new Set(miIds.filter((v): v is string => v !== null));

  for (const id of stSet) {
    if (!miSet.has(id)) {
      findings.push({
        field: `membership.${id}`,
        severity: "blocking",
        code: "listing-missing-from-mirror-page",
        sharetribe: id,
        mirror: null,
        detail: "Sharetribe returned this listing on this page and the mirror did not.",
      });
    }
  }
  for (const id of miSet) {
    if (!stSet.has(id)) {
      findings.push({
        field: `membership.${id}`,
        severity: "blocking",
        code: "listing-extra-in-mirror-page",
        sharetribe: null,
        mirror: id,
        detail:
          "The mirror returned a listing Sharetribe did not — stale row, or a filter the mirror " +
          "applies differently.",
      });
    }
  }

  // Ordering, over the intersection only, so membership differences don't
  // masquerade as an ordering bug.
  const shared = stIds.filter((id): id is string => id !== null && miSet.has(id));
  const sharedMirrorOrder = miIds.filter((id): id is string => id !== null && stSet.has(id));
  if (!deepEqual(shared, sharedMirrorOrder)) {
    findings.push({
      field: "ordering",
      severity: "blocking",
      code: "ordering-mismatch",
      sharetribe: shared,
      mirror: sharedMirrorOrder,
      detail:
        "The listings both sources agree on come back in a different order. SSR and client " +
        "reading different orders is what produces React hydration mismatches, and it changes " +
        "which pools appear above the fold.",
    });
  }

  // Per-listing fields, matched by id
  const miById = new Map<string, ListingLike>();
  miList.forEach((l) => {
    const id = idOf(l);
    if (id !== null) miById.set(id, l);
  });

  stList.forEach((stListing, index) => {
    const id = idOf(stListing);
    if (id === null || !miById.has(id)) return;
    findings.push(...diffListing(stListing, miById.get(id), `listings[${index}]`));
  });

  return findings;
}

// ─────────────────────────────────────────────────────────────────────────────
// Report
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Aggregate findings. Deterministic ordering: severity (blocking first), then
 * count descending, then code alphabetically — so two runs over the same input
 * produce byte-identical reports and a diff of two reports is meaningful.
 */
export function buildParityReport(
  generatedFor: string,
  comparedListings: number,
  findings: ParityFinding[],
): ParityReport {
  const bySeverity: Record<ParitySeverity, number> = {
    blocking: 0,
    unsupported: 0,
    degraded: 0,
    cosmetic: 0,
  };
  for (const f of findings) bySeverity[f.severity] += 1;

  const codeMap = new Map<string, { count: number; severity: ParitySeverity }>();
  for (const f of findings) {
    const existing = codeMap.get(f.code);
    if (existing) existing.count += 1;
    else codeMap.set(f.code, { count: 1, severity: f.severity });
  }

  const byCode = [...codeMap.entries()]
    .map(([code, v]) => ({ code, count: v.count, severity: v.severity }))
    .sort(
      (a, b) =>
        SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity) ||
        b.count - a.count ||
        a.code.localeCompare(b.code),
    );

  return {
    generatedFor,
    comparedListings,
    findings,
    bySeverity,
    byCode,
    mirrorCanServe: bySeverity.blocking === 0 && bySeverity.unsupported === 0,
  };
}

/** Human-readable report. Stable output — safe to commit or diff across runs. */
export function formatParityReport(report: ParityReport): string {
  const lines: string[] = [];
  lines.push(`Listing read parity — ${report.generatedFor}`);
  lines.push(`Listings compared: ${report.comparedListings}`);
  lines.push(
    `Verdict: ${report.mirrorCanServe ? "mirror can serve this read" : "mirror CANNOT serve this read"}`,
  );
  lines.push("");
  lines.push(
    `blocking=${report.bySeverity.blocking} unsupported=${report.bySeverity.unsupported} ` +
      `degraded=${report.bySeverity.degraded} cosmetic=${report.bySeverity.cosmetic}`,
  );

  if (report.byCode.length) {
    lines.push("");
    lines.push("By cause:");
    for (const { code, count, severity } of report.byCode) {
      lines.push(`  [${severity.padEnd(11)}] ${String(count).padStart(5)}  ${code}`);
    }
  }

  const firstOfEachCode = new Map<string, ParityFinding>();
  for (const f of report.findings) {
    if (!firstOfEachCode.has(f.code)) firstOfEachCode.set(f.code, f);
  }
  if (firstOfEachCode.size) {
    lines.push("");
    lines.push("Example per cause:");
    for (const { code } of report.byCode) {
      const f = firstOfEachCode.get(code);
      if (!f) continue;
      lines.push(`  ${code} @ ${f.field}`);
      lines.push(`    sharetribe: ${JSON.stringify(f.sharetribe) ?? "undefined"}`);
      lines.push(`    mirror:     ${JSON.stringify(f.mirror) ?? "undefined"}`);
      lines.push(`    ${f.detail}`);
    }
  }

  return lines.join("\n");
}
