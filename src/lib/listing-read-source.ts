/**
 * Which backend answers public listing reads.
 *
 * Phase 1 of the Sharetribe exit. Reads only — nothing here writes to
 * Sharetribe or Supabase, touches transactions, auth, Stripe or messaging.
 * Flipping PRNM_LISTING_READ_SOURCE back to "sharetribe" restores the exact
 * pre-migration behaviour, so this phase is reversible with one env var.
 *
 *   sharetribe  Legacy routing, byte-for-byte what production does today: the
 *               synced_listings mirror already answers city/state-filtered
 *               queries, everything else goes to the Integration API. This is
 *               the default and is what you get for an unset or invalid value.
 *
 *   mirror      Supabase answers every listing read. Queries the mirror cannot
 *               express (origin/bounds/keywords — see MIRROR_UNSUPPORTED_OPTS)
 *               are reported, not silently downgraded to a different result set.
 *
 *   shadow      Sharetribe stays authoritative and its response is what callers
 *               get. The mirror response is computed alongside and structurally
 *               diffed so divergence is measured against real traffic at zero
 *               risk. Never let shadow change what is returned.
 */

export const LISTING_READ_SOURCES = ["sharetribe", "mirror", "shadow"] as const;

export type ListingReadSource = (typeof LISTING_READ_SOURCES)[number];

export const DEFAULT_LISTING_READ_SOURCE: ListingReadSource = "sharetribe";

export const LISTING_READ_SOURCE_ENV_VAR = "PRNM_LISTING_READ_SOURCE";

export interface ResolvedListingReadSource {
  source: ListingReadSource;
  /** The raw env value, for logging. */
  raw: string | undefined;
  /** True when `raw` was set but not a recognised source. */
  invalid: boolean;
}

function isListingReadSource(v: string): v is ListingReadSource {
  return (LISTING_READ_SOURCES as readonly string[]).includes(v);
}

/**
 * Resolve the flag. Unset, empty, or unrecognised all fall back to
 * "sharetribe": a typo must never silently move production onto the mirror.
 * Matching is case-insensitive and trims surrounding whitespace, because this
 * gets set by hand in pm2 env files.
 */
export function resolveListingReadSource(
  env: Record<string, string | undefined> = process.env,
): ResolvedListingReadSource {
  const raw = env[LISTING_READ_SOURCE_ENV_VAR];

  if (raw === undefined || raw.trim() === "") {
    return { source: DEFAULT_LISTING_READ_SOURCE, raw, invalid: false };
  }

  const normalized = raw.trim().toLowerCase();
  if (isListingReadSource(normalized)) {
    return { source: normalized, raw, invalid: false };
  }

  return { source: DEFAULT_LISTING_READ_SOURCE, raw, invalid: true };
}

/**
 * Search options the synced_listings mirror has no equivalent for today.
 *
 * `origin` is a distance sort, `bounds` a bounding-box filter and `keywords` a
 * full-text relevance search — all three are Sharetribe server-side features.
 * synced_listings has latitude/longitude columns but no PostGIS index and no
 * FTS index, so answering these from the mirror would return a *different*
 * result set rather than the same one more cheaply. Phase 2 adds the indexes;
 * until then these are reported as unsupported.
 */
export const MIRROR_UNSUPPORTED_OPTS = ["origin", "bounds", "keywords"] as const;

export type MirrorUnsupportedOpt = (typeof MIRROR_UNSUPPORTED_OPTS)[number];

/** Which requested options the mirror cannot honour. Empty means it can serve this query. */
export function mirrorUnsupportedOptsFor(
  opts: Record<string, unknown> | null | undefined,
): MirrorUnsupportedOpt[] {
  if (!opts) return [];
  return MIRROR_UNSUPPORTED_OPTS.filter((key) => {
    const v = opts[key];
    return v !== undefined && v !== null && v !== "";
  });
}

/** True when the mirror can express every filter in `opts`. */
export function mirrorCanServe(opts: Record<string, unknown> | null | undefined): boolean {
  return mirrorUnsupportedOptsFor(opts).length === 0;
}

/**
 * Options the Sharetribe Marketplace API cannot express.
 *
 * These are mirror-only concepts: `synced_listings` derives city/state columns
 * during sync, and Sharetribe has no equivalent filter. Sending them is not a
 * degraded query, it is an ignored one — the API drops the keys and returns the
 * newest listings marketplace-wide, so a caller asking for Texas gets Florida
 * pools and has no way to tell. That is the `%melbourne%` failure class from the
 * operating notes: wrong geography is worse than no results, because nobody
 * notices it.
 */
export const SHARETRIBE_UNSUPPORTED_OPTS = ["citySlug", "city", "stateCode"] as const;

export type SharetribeUnsupportedOpt = (typeof SHARETRIBE_UNSUPPORTED_OPTS)[number];

/** Which requested options Sharetribe cannot honour. Empty means it can serve this query. */
export function sharetribeUnsupportedOptsFor(
  opts: Record<string, unknown> | null | undefined,
): SharetribeUnsupportedOpt[] {
  if (!opts) return [];
  return SHARETRIBE_UNSUPPORTED_OPTS.filter((key) => {
    const v = opts[key];
    return v !== undefined && v !== null && v !== "";
  });
}

/** True when Sharetribe can express every filter in `opts`. */
export function sharetribeCanServe(opts: Record<string, unknown> | null | undefined): boolean {
  return sharetribeUnsupportedOptsFor(opts).length === 0;
}
