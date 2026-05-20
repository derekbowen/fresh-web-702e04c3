/**
 * Convert content_pages.related_slugs (city-page sibling slugs) into
 * RelatedPages items with rotating anchor text:
 *   - "{City}, {State}"
 *   - "Hosting in {City}"
 *   - "Pool rentals in {City}"
 * Strips the known city-template prefixes so anchors aren't dominated
 * by the slug template (e.g. "Become A Swimming Pool Host…").
 */
import type { RelatedPagesItem } from "@/components/related-pages";
import { parseCitySlug } from "@/lib/city-slug";

const CITY_SLUG_PREFIXES = [
  "become-a-swimming-pool-host-",
  "become-a-pool-host-",
  "swim-instructor-pool-rental-",
  "conviertete-en-anfitrion-de-piscina-",
];

function stripCityPrefix(slug: string): string {
  for (const p of CITY_SLUG_PREFIXES) {
    if (slug.startsWith(p)) return slug.slice(p.length);
  }
  return slug;
}

export function relatedSlugsToItems(
  relatedSlugs: string[] | null | undefined,
  options?: { isSpanish?: boolean; max?: number },
): RelatedPagesItem[] {
  if (!relatedSlugs || relatedSlugs.length === 0) return [];
  const isEs = options?.isSpanish ?? false;
  const max = options?.max ?? 10;

  const items: RelatedPagesItem[] = [];
  for (let i = 0; i < relatedSlugs.length && items.length < max; i++) {
    const slug = relatedSlugs[i];
    if (!slug) continue;
    const citySlug = stripCityPrefix(slug);
    const { city, stateCode } = parseCitySlug(citySlug);
    if (!city) continue;

    const variant = i % 3;
    let label: string;
    let description: string | undefined;
    if (isEs) {
      // Spanish anchors mirror the EN rotation.
      const cityState = stateCode ? `${city}, ${stateCode}` : city;
      if (variant === 0) {
        label = cityState;
        description = "Alquila tu piscina por hora";
      } else if (variant === 1) {
        label = `Anfitri\u00f3n de piscinas en ${city}`;
        description = stateCode ? `${city}, ${stateCode}` : undefined;
      } else {
        label = `Alquiler de piscinas en ${city}`;
        description = stateCode ? `${city}, ${stateCode}` : undefined;
      }
    } else {
      const cityState = stateCode ? `${city}, ${stateCode}` : city;
      if (variant === 0) {
        label = cityState;
        description = "Local pool host market";
      } else if (variant === 1) {
        label = `Hosting in ${city}`;
        description = stateCode ? `${city}, ${stateCode}` : undefined;
      } else {
        label = `Pool rentals in ${city}`;
        description = stateCode ? `${city}, ${stateCode}` : undefined;
      }
    }

    items.push({ to: `/p/${slug}`, label, description });
  }
  return items;
}
