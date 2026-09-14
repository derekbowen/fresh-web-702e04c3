/**
 * Listing image sourcing — Phase 1b of the Sharetribe exit.
 *
 * Pure. No network, no database, no clock. The worker
 * (src/server/listing-image-rehost.server.ts) and the read path both use these,
 * and the tests assert on fixtures.
 *
 * The problem being solved: synced_listings persists only a resolved, signed
 * sharetribe.imgix.net URL per image. No bytes are held, the image UUID is not a
 * column, and the imgix `s=` signature is an HMAC on Sharetribe's secret — so we
 * can neither re-sign nor re-crop, and every photo 404s the moment the account
 * goes away. This module decides what to download, where to put it, and which
 * URL to serve.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Flag
// ─────────────────────────────────────────────────────────────────────────────

export const IMAGE_SOURCES = ["sharetribe", "prnm"] as const;
export type ImageSource = (typeof IMAGE_SOURCES)[number];
export const DEFAULT_IMAGE_SOURCE: ImageSource = "sharetribe";
export const IMAGE_SOURCE_ENV_VAR = "PRNM_IMAGE_SOURCE";

export interface ResolvedImageSource {
  source: ImageSource;
  raw: string | undefined;
  invalid: boolean;
}

/**
 * Unset, empty, or unrecognised all resolve to "sharetribe". A typo must never
 * flip the site onto half-migrated images. Case-insensitive and trimmed, because
 * this is hand-edited into pm2 env files.
 */
export function resolveImageSource(
  env: Record<string, string | undefined> = process.env,
): ResolvedImageSource {
  const raw = env[IMAGE_SOURCE_ENV_VAR];
  if (raw === undefined || raw.trim() === "") {
    return { source: DEFAULT_IMAGE_SOURCE, raw, invalid: false };
  }
  const normalized = raw.trim().toLowerCase();
  if ((IMAGE_SOURCES as readonly string[]).includes(normalized)) {
    return { source: normalized as ImageSource, raw, invalid: false };
  }
  return { source: DEFAULT_IMAGE_SOURCE, raw, invalid: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Variant selection
// ─────────────────────────────────────────────────────────────────────────────

export interface SharetribeVariant {
  url: string;
  width?: number;
  height?: number;
}

/**
 * Variants we ask Sharetribe for when re-hosting, largest first.
 *
 * `scaled-xlarge` is the largest variant the Marketplace/Integration API
 * exposes and is what the marketplace app's own gallery already requests
 * (ListingPage.duck.js, SectionGallery.js). **There is no way to obtain the true
 * original bytes** — Sharetribe serves variants only — so this ladder is the
 * permanent fidelity ceiling of the migration. Recorded per asset in
 * listing_image_assets.source_variant so the ceiling stays visible.
 */
export const REHOST_VARIANT_LADDER = [
  "scaled-xlarge",
  "scaled-large",
  "default",
  "scaled-medium",
  "scaled-small",
] as const;

/**
 * Cropped variants. Deliberately last-resort: a crop has permanently lost
 * framing, so re-hosting one as the canonical asset means we can never render
 * the uncropped image again. Used only when the ladder above yields nothing.
 */
export const REHOST_CROP_FALLBACK_LADDER = [
  "landscape-crop2x",
  "landscape-crop",
  // Sharetribe's square variants are named "square-small" / "square-small2x"
  // (see the marketplace's own Avatar.js, which has always used those). There
  // is no "square" or "square2x"; asking for a variant that does not exist gets
  // the whole fields.image parameter rejected, so the earlier spelling could
  // have failed every discovery request rather than just this last-resort rung.
  "square-small2x",
  "square-small",
] as const;

/** The `fields.image` value to send so the ladder is actually populated. */
export const REHOST_IMAGE_FIELDS = [...REHOST_VARIANT_LADDER, ...REHOST_CROP_FALLBACK_LADDER]
  .map((v) => `variants.${v}`)
  .join(",");

export interface VariantPick {
  variant: string;
  url: string;
  width: number | null;
  height: number | null;
  /** True when only a cropped variant was available — framing is already lost. */
  isCrop: boolean;
}

/**
 * Choose what to download for one image.
 *
 * Walks the uncropped ladder first, then the crop fallback. Returns null when
 * the image offers no usable variant at all, which the worker records as
 * `unavailable` rather than retrying forever.
 */
export function pickRehostVariant(
  variants: Record<string, SharetribeVariant | undefined> | null | undefined,
): VariantPick | null {
  if (!variants) return null;

  const tryLadder = (ladder: readonly string[], isCrop: boolean): VariantPick | null => {
    for (const variant of ladder) {
      const v = variants[variant];
      if (v && typeof v.url === "string" && v.url.trim() !== "") {
        return {
          variant,
          url: v.url,
          width: typeof v.width === "number" ? v.width : null,
          height: typeof v.height === "number" ? v.height : null,
          isCrop,
        };
      }
    }
    return null;
  };

  return tryLadder(REHOST_VARIANT_LADDER, false) ?? tryLadder(REHOST_CROP_FALLBACK_LADDER, true);
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage paths
// ─────────────────────────────────────────────────────────────────────────────

export const LISTING_IMAGE_BUCKET = "listing-images";

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

/**
 * File extension for a Content-Type. Unknown types fall back to jpg, matching
 * what Sharetribe actually serves for listing photos; the stored
 * `content_type` column keeps the truth either way.
 */
export function extensionForContentType(contentType: string | null | undefined): string {
  if (!contentType) return "jpg";
  const bare = contentType.split(";")[0]!.trim().toLowerCase();
  return EXTENSION_BY_TYPE[bare] ?? "jpg";
}

/**
 * Deterministic object path: `<listingId>/<imageId>.<ext>`.
 *
 * Deterministic on purpose — a re-run uploads to the same key with upsert, so a
 * retry replaces rather than accumulating orphans, and the bucket stays
 * greppable by listing. No timestamp: a timestamped path (as city-heroes uses)
 * would leak a new object on every retry and there is no cleanup job.
 */
export function storagePathFor(
  listingStId: string,
  sharetribeImageId: string,
  contentType: string | null | undefined,
): string {
  return `${listingStId}/${sharetribeImageId}.${extensionForContentType(contentType)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Host classification
// ─────────────────────────────────────────────────────────────────────────────

const SUPABASE_OBJECT_PATH = "/storage/v1/object/public/";
const SUPABASE_RENDER_PATH = "/storage/v1/render/image/public/";

/**
 * True when the URL is served from our own Supabase Storage, i.e. it survives
 * Sharetribe going away. Matches both the plain object path and the render
 * (on-the-fly resize) path that src/lib/hero-image.ts rewrites to.
 */
export function isPrnmHostedImageUrl(url: unknown): boolean {
  if (typeof url !== "string" || url.trim() === "") return false;
  try {
    const u = new URL(url);
    return (
      u.pathname.includes(`${SUPABASE_OBJECT_PATH}${LISTING_IMAGE_BUCKET}/`) ||
      u.pathname.includes(`${SUPABASE_RENDER_PATH}${LISTING_IMAGE_BUCKET}/`)
    );
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Serving
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Which URL to serve for one listing.
 *
 * Fallback is PER LISTING, not global: the migration runs over tens of
 * thousands of images, so for a long stretch some listings are re-hosted and
 * some are not. A global switch would blank out every un-migrated listing's
 * photo the moment it flipped. With `prnm` set, a listing that has a PRNM URL
 * uses it and one that does not keeps its Sharetribe URL, so the site is never
 * worse than it is today at any point during the migration.
 */
export function preferredImageUrl(
  prnmUrl: string | null | undefined,
  sharetribeUrl: string | null | undefined,
  source: ImageSource,
): string | null {
  if (source === "prnm" && typeof prnmUrl === "string" && prnmUrl.trim() !== "") {
    return prnmUrl;
  }
  if (typeof sharetribeUrl === "string" && sharetribeUrl.trim() !== "") return sharetribeUrl;
  // With source=prnm and no Sharetribe URL, a PRNM URL is still better than nothing.
  if (typeof prnmUrl === "string" && prnmUrl.trim() !== "") return prnmUrl;
  return null;
}

/** Same choice across a listing's whole gallery, preserving order. */
export function preferredImageUrls(
  prnmUrls: readonly string[] | null | undefined,
  sharetribeUrls: readonly string[] | null | undefined,
  source: ImageSource,
): string[] {
  const prnm = (prnmUrls ?? []).filter((u) => typeof u === "string" && u.trim() !== "");
  const sharetribe = (sharetribeUrls ?? []).filter((u) => typeof u === "string" && u.trim() !== "");
  if (source === "prnm" && prnm.length > 0) return [...prnm];
  return sharetribe.length > 0 ? [...sharetribe] : [...prnm];
}

// ─────────────────────────────────────────────────────────────────────────────
// Rebuilding the denormalized columns
// ─────────────────────────────────────────────────────────────────────────────

export interface StoredAssetRow {
  sharetribe_image_id: string;
  position: number | null;
  public_url: string | null;
  status: string;
}

/**
 * Rebuild `prnm_image_urls` / `prnm_primary_image_url` from asset rows.
 *
 * Only `stored` rows contribute — a pending or failed image must not leave a
 * hole or a dead URL in the array. Ordered by `position`, with the image id as a
 * tiebreaker so two rows sharing a position always come back in the same order
 * (the mirror's own ordering bug class).
 */
export function buildPrnmImageColumns(assets: readonly StoredAssetRow[]): {
  prnm_image_urls: string[];
  prnm_primary_image_url: string | null;
} {
  const stored = assets
    .filter((a) => a.status === "stored" && typeof a.public_url === "string" && a.public_url !== "")
    .slice()
    .sort(
      (a, b) =>
        (a.position ?? 0) - (b.position ?? 0) ||
        a.sharetribe_image_id.localeCompare(b.sharetribe_image_id),
    );

  const urls = stored.map((a) => a.public_url as string);
  return { prnm_image_urls: urls, prnm_primary_image_url: urls[0] ?? null };
}
