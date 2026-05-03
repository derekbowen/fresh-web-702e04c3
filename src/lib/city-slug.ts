/**
 * Pure helpers for mapping content_pages slugs to city slugs / display names.
 * No server deps so both server fns and head() / metadata helpers can use it.
 */

const HOST_ACQ_PREFIXES = [
  "become-a-swimming-pool-host-",
  "become-a-pool-host-",
];

const SPANISH_HOST_ACQ_PREFIX = "conviertete-en-anfitrion-de-piscina-";

/** Extract a `cities.slug` from a content page's slug. */
export function cityForContentPage(
  templateType: string | null,
  slug: string | null,
): string | null {
  if (!slug) return null;
  switch (templateType) {
    case "host_acq_city": {
      for (const p of HOST_ACQ_PREFIXES) {
        if (slug.startsWith(p)) return slug.slice(p.length);
      }
      return null;
    }
    case "spanish_host_acq": {
      if (slug.startsWith(SPANISH_HOST_ACQ_PREFIX)) {
        return slug.slice(SPANISH_HOST_ACQ_PREFIX.length);
      }
      return null;
    }
    case "public_pool_city":
      return slug;
    default:
      return null;
  }
}

const US_STATE_CODES = new Set([
  "al","ak","az","ar","ca","co","ct","de","fl","ga","hi","id","il","in","ia",
  "ks","ky","la","me","md","ma","mi","mn","ms","mo","mt","ne","nv","nh","nj",
  "nm","ny","nc","nd","oh","ok","or","pa","ri","sc","sd","tn","tx","ut","vt",
  "va","wa","wv","wi","wy","dc",
]);

export interface CityNameParts {
  city: string;
  stateCode: string | null;
}

/**
 * Best-effort split of a `cities.slug` like "los-angeles-ca" into a
 * Title Case city + uppercase state code. Falls back to titlecasing the
 * whole slug when no trailing 2-letter US state code is detected.
 */
export function parseCitySlug(citySlug: string): CityNameParts {
  const parts = citySlug.split("-").filter(Boolean);
  if (parts.length === 0) return { city: citySlug, stateCode: null };
  const last = parts[parts.length - 1].toLowerCase();
  if (parts.length >= 2 && US_STATE_CODES.has(last)) {
    const cityParts = parts.slice(0, -1);
    return { city: titleCase(cityParts), stateCode: last.toUpperCase() };
  }
  return { city: titleCase(parts), stateCode: null };
}

function titleCase(words: string[]): string {
  return words
    .map((w) => (w.length === 0 ? w : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}
