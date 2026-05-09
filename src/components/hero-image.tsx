import { heroSrcSet, heroVariant, HERO_SIZES } from "@/lib/hero-image";

interface HeroImageProps {
  src: string;
  alt: string;
  className?: string;
  /** Width/height attributes. Defaults to 1600x900 (16:9) for CLS prevention. */
  width?: number;
  height?: number;
}

/**
 * Responsive LCP-optimized hero <img>. Always served with:
 *   - `loading="eager"` + `fetchpriority="high"` (LCP candidate)
 *   - `decoding="async"` so paint isn't blocked
 *   - srcset across phone/tablet/desktop widths
 *   - explicit width/height to reserve space (no CLS)
 *
 * Pair with `heroPreloadLinks(src)` in the route's head() so the browser
 * starts the fetch before React mounts.
 */
export function HeroImage({
  src,
  alt,
  className,
  width = 1600,
  height = 900,
}: HeroImageProps) {
  return (
    <img
      src={heroVariant(src, 1200)}
      srcSet={heroSrcSet(src)}
      sizes={HERO_SIZES}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="eager"
      fetchPriority="high"
      decoding="async"
    />
  );
}
