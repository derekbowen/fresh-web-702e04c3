/**
 * Phase 1 listing-read facade — the single place that decides whether a public
 * listing read is answered by Sharetribe or by the Supabase mirror.
 *
 * SCOPE, deliberately narrow:
 *   • reads only — nothing here writes to Sharetribe or Supabase
 *   • no transaction, auth, Stripe, payout or messaging code is touched
 *   • no Sharetribe code is deleted; both paths stay live
 *   • PRNM_LISTING_READ_SOURCE=sharetribe restores today's behaviour exactly,
 *     so this whole phase reverses with one env var and a restart
 *
 * The call surface matches the functions it wraps (searchListings / fetchListing
 * in ./sharetribe.server), so callers swap one import and nothing else.
 *
 * Why a facade rather than editing searchListings in place: source selection was
 * previously implicit in the shape of `opts` — a city filter silently meant
 * "use the mirror". That is unobservable and uncontrollable. Here the source is
 * named, logged, and diffable.
 */
import {
  EMPTY_LISTING_SEARCH_RESULT,
  fetchListing,
  fetchListingFromMirror,
  searchListings,
  searchListingsFromMirror,
  searchListingsFromSharetribe,
  type ListingSearchResult,
  type ListingSummary,
  type SearchOptions,
} from "./sharetribe.server";
import {
  buildParityReport,
  diffListing,
  diffSearchResult,
  formatParityReport,
  type ParityFinding,
  type ParityReport,
} from "@/lib/listing-parity";
import {
  LISTING_READ_SOURCE_ENV_VAR,
  mirrorUnsupportedOptsFor,
  resolveListingReadSource,
  type ListingReadSource,
} from "@/lib/listing-read-source";

/** Which backend actually answered, for logging and for the parity record. */
export type ServedBy = "sharetribe" | "mirror" | "sharetribe-fallback";

export interface ListingReadOutcome<T> {
  result: T;
  servedBy: ServedBy;
  source: ListingReadSource;
  /** Present in shadow mode when both sources were compared. */
  parity?: ParityReport;
}

let warnedInvalidFlag = false;

function currentSource(): ListingReadSource {
  const resolved = resolveListingReadSource(process.env);
  if (resolved.invalid && !warnedInvalidFlag) {
    warnedInvalidFlag = true;
    console.warn(
      `[listing-read] ${LISTING_READ_SOURCE_ENV_VAR}="${resolved.raw}" is not a recognised ` +
        `source — falling back to "${resolved.source}". Valid: sharetribe | mirror | shadow.`,
    );
  }
  return resolved.source;
}

/** Stable label for a query, used as the parity record key. */
export function describeSearchOpts(opts: SearchOptions): string {
  const parts = Object.entries(opts)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`);
  return parts.length ? `search(${parts.join("&")})` : "search(all)";
}

// ─────────────────────────────────────────────────────────────────────────────
// Search
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Flag-aware listing search.
 *
 * sharetribe → delegates to the untouched legacy searchListings, including its
 *              existing implicit mirror use for city/state queries. This is
 *              literally today's production path; nothing is re-implemented.
 * mirror     → mirror only. A query the mirror cannot express falls back to
 *              Sharetribe and says so, rather than quietly returning a
 *              different result set.
 * shadow     → Sharetribe's answer is returned; the mirror is computed
 *              alongside and diffed. Never changes what callers receive.
 */
export async function readListingSearch(
  opts: SearchOptions = {},
): Promise<ListingReadOutcome<ListingSearchResult>> {
  const source = currentSource();

  if (source === "sharetribe") {
    return { result: await searchListings(opts), servedBy: "sharetribe", source };
  }

  const unsupported = mirrorUnsupportedOptsFor(opts as Record<string, unknown>);

  if (source === "mirror") {
    if (unsupported.length > 0) {
      console.warn(
        `[listing-read] mirror cannot express ${unsupported.join(", ")} for ` +
          `${describeSearchOpts(opts)} — serving from Sharetribe instead. This is a known ` +
          "Phase 2 gap (PostGIS + full-text indexes), not a mirror failure.",
      );
      return {
        result: await safeSharetribeSearch(opts),
        servedBy: "sharetribe-fallback",
        source,
      };
    }
    const fromMirror = await searchListingsFromMirror(opts);
    if (fromMirror) return { result: fromMirror, servedBy: "mirror", source };

    console.error(
      `[listing-read] mirror query FAILED for ${describeSearchOpts(opts)} — serving from ` +
        "Sharetribe. Investigate before trusting mirror mode.",
    );
    return { result: await safeSharetribeSearch(opts), servedBy: "sharetribe-fallback", source };
  }

  // shadow
  const [sharetribeResult, mirrorResult] = await Promise.all([
    safeSharetribeSearch(opts),
    unsupported.length > 0 ? Promise.resolve(null) : searchListingsFromMirror(opts),
  ]);

  const findings: ParityFinding[] =
    unsupported.length > 0
      ? diffSearchResult(sharetribeResult, sharetribeResult, { unsupportedOpts: unsupported })
      : diffSearchResult(sharetribeResult, mirrorResult, { unsupportedOpts: unsupported });

  if (mirrorResult === null && unsupported.length === 0) {
    findings.push({
      field: "result",
      severity: "blocking",
      code: "mirror-query-errored",
      sharetribe: "present",
      mirror: null,
      detail: "The mirror query itself errored, so no comparison was possible for this request.",
    });
  }

  const parity = buildParityReport(
    describeSearchOpts(opts),
    sharetribeResult.listings.length,
    findings,
  );
  logParity(parity);

  // Sharetribe stays authoritative in shadow mode. Always.
  return { result: sharetribeResult, servedBy: "sharetribe", source, parity };
}

/** searchListingsFromSharetribe throws; callers here need the legacy empty-result contract. */
async function safeSharetribeSearch(opts: SearchOptions): Promise<ListingSearchResult> {
  try {
    return await searchListingsFromSharetribe(opts);
  } catch (err) {
    console.error("[listing-read] Sharetribe search error:", err);
    return { ...EMPTY_LISTING_SEARCH_RESULT };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Flag-aware single-listing read.
 *
 * Returns the same `ListingSummary | null` that callers already handle. In
 * shadow mode the Sharetribe answer is returned unchanged; `undefined` from the
 * mirror means its query errored and is reported as such rather than being
 * treated as "listing does not exist".
 */
export async function readListing(id: string): Promise<ListingReadOutcome<ListingSummary | null>> {
  const source = currentSource();

  if (source === "sharetribe") {
    const legacy = await fetchListing(id);
    return { result: legacy?.listing ?? null, servedBy: "sharetribe", source };
  }

  if (source === "mirror") {
    const fromMirror = await fetchListingFromMirror(id);
    if (fromMirror !== undefined) return { result: fromMirror, servedBy: "mirror", source };

    console.error(
      `[listing-read] mirror detail query FAILED for listing ${id} — serving from Sharetribe.`,
    );
    const legacy = await fetchListing(id);
    return { result: legacy?.listing ?? null, servedBy: "sharetribe-fallback", source };
  }

  // shadow
  const [legacy, fromMirror] = await Promise.all([fetchListing(id), fetchListingFromMirror(id)]);
  const sharetribeListing = legacy?.listing ?? null;

  const findings: ParityFinding[] = [];
  if (fromMirror === undefined) {
    findings.push({
      field: "listing",
      severity: "blocking",
      code: "mirror-query-errored",
      sharetribe: sharetribeListing?.id ?? null,
      mirror: null,
      detail: "The mirror detail query errored, so no comparison was possible for this listing.",
    });
  } else {
    findings.push(...diffListing(sharetribeListing, fromMirror, ""));
  }

  const parity = buildParityReport(`listing(${id})`, sharetribeListing ? 1 : 0, findings);
  logParity(parity);

  return { result: sharetribeListing, servedBy: "sharetribe", source, parity };
}

// ─────────────────────────────────────────────────────────────────────────────
// Parity logging
// ─────────────────────────────────────────────────────────────────────────────

/**
 * One line per read when clean, the full report when not.
 *
 * Deliberately console-only for this slice: persisting parity findings means a
 * new table and a write path, and this phase is reads-only by design. The
 * report object is returned to callers so a follow-up slice can persist it
 * without changing anything here. Grep EAST's pm2 log for `[listing-parity]`.
 */
function logParity(report: ParityReport): void {
  if (report.findings.length === 0) {
    console.info(
      `[listing-parity] ${report.generatedFor} — clean (${report.comparedListings} listings)`,
    );
    return;
  }
  if (report.mirrorCanServe) {
    console.info(
      `[listing-parity] ${report.generatedFor} — serveable, ` +
        `${report.bySeverity.degraded} degraded / ${report.bySeverity.cosmetic} cosmetic`,
    );
    return;
  }
  console.warn(
    `[listing-parity] ${report.generatedFor} — NOT serveable\n${formatParityReport(report)}`,
  );
}

export { formatParityReport };
export type { ListingSearchResult, ListingSummary, SearchOptions, ParityReport };
