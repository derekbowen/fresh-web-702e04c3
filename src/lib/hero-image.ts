/**
 * Hero image optimization helpers — used to:
 *   1. Rewrite CDN URLs (imgix, Unsplash) to request smaller, format-optimized
 *      variants per breakpoint.
 *   2. Build a responsive srcset string.
 *   3. Build the `<link rel="preload" as="image">` payload that lets the
 *      browser start fetching the LCP image before the React tree mounts.
 *
 * Pure functions — usable from both head() and component renders.
 */

const IMGIX_HOSTS = ["imgix.net", "sharetribe-assets.imgix.net"];
const UNSPLASH_HOST = "images.unsplash.com";
const SUPABASE_RENDER = "/storage/v1/render/image/public/";
const SUPABASE_OBJECT = "/storage/v1/object/public/";

export const HERO_BREAKPOINTS = [480, 768, 1200, 1600] as const;

function isImgix(u: URL) {
  return IMGIX_HOSTS.some((h) => u.hostname.endsWith(h));
}
function isUnsplash(u: URL) {
  return u.hostname === UNSPLASH_HOST;
}
function isSupabaseObject(u: URL) {
  return u.pathname.includes(SUPABASE_OBJECT);
}

/** Resize/format a hero URL to a target width. Falls back to original if unknown CDN. */
export function heroVariant(src: string, width: number): string {
  try {
    const u = new URL(src);
    if (isImgix(u) || isUnsplash(u)) {
      u.searchParams.set("auto", "format");
      u.searchParams.set("fit", "crop");
      u.searchParams.set("w", String(width));
      // Maintain ~16:9 hero ratio.
      u.searchParams.set("h", String(Math.round((width * 9) / 16)));
      u.searchParams.set("q", "70");
      return u.toString();
    }
    if (isSupabaseObject(u)) {
      // Use Supabase's image transform endpoint.
      const transformed = u.pathname.replace(SUPABASE_OBJECT, SUPABASE_RENDER);
      const t = new URL(u.origin + transformed);
      t.searchParams.set("width", String(width));
      t.searchParams.set("quality", "70");
      t.searchParams.set("resize", "cover");
      return t.toString();
    }
    return src;
  } catch {
    return src;
  }
}

/** Build a responsive srcset across HERO_BREAKPOINTS. */
export function heroSrcSet(src: string): string {
  return HERO_BREAKPOINTS.map((w) => `${heroVariant(src, w)} ${w}w`).join(", ");
}

/**
 * Default hero `sizes` attribute. Hero spans full viewport on mobile and tops
 * out around the 1200px hero column on desktop.
 */
export const HERO_SIZES = "(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px";

/**
 * Build a TanStack `links` entry for preloading the LCP hero image.
 * Returns `[]` when no src is provided so callers can spread unconditionally.
 */
export function heroPreloadLinks(
  src: string | null | undefined,
): Array<Record<string, string>> {
  if (!src) return [];
  return [
    {
      rel: "preload",
      as: "image",
      href: heroVariant(src, 1200),
      imagesrcset: heroSrcSet(src),
      imagesizes: HERO_SIZES,
      fetchpriority: "high",
    },
  ];
}
