/**
 * SEO helpers for building meta tags and JSON-LD structured data.
 */
import ogDefaultImage from "@/assets/og-default.jpg";
import { canonicalOriginForPath, resolveCanonicalUrl, sitePath } from "@/lib/country-sites";

export const SITE_URL = "https://www.poolrentalnearme.com";
export const SITE_NAME = "Pool Rental Near Me";
// Bundled asset served from /fw-assets/ (the marketplace upstream
// hijacks /og-default.jpg at the nginx layer, so the public/ file is
// unreachable in production). buildMeta() prefixes relative paths with SITE_URL.
export const DEFAULT_OG_IMAGE = ogDefaultImage;
// TODO: replace logo URL with 600x600 transparent PNG once asset exists.
// Using the 512×512 PWA icon as a square fallback so Organization.logo
// is not a hero photo (which fails Google Rich Results Test).
export const SITE_LOGO = `${SITE_URL}/icon-512.png`;

export const SOCIAL_PROFILES = [
  "https://www.facebook.com/poolrentalnearme",
  "https://x.com/poolrentalnearm",
  "https://www.youtube.com/@poolrentalnearme",
  "https://www.linkedin.com/company/poolrentalnearme",
  "https://www.instagram.com/poolrentalnearme",
  "https://www.tiktok.com/@poolrentalnearme",
  "https://www.pinterest.com/poolrentalnearme",
];

/**
 * Canonical Author entity for Derek Bowen — referenced from every Article
 * JSON-LD on the site so Google ties all content to one Person.
 */
export const AUTHOR_PERSON_URL = `${SITE_URL}/p/author/derek-bowen`;
export const AUTHOR_PERSON_ID = `${AUTHOR_PERSON_URL}#person`;

export const AUTHOR_PERSON_JSONLD_REF = {
  "@type": "Person",
  "@id": AUTHOR_PERSON_ID,
  name: "Derek Bowen",
  url: AUTHOR_PERSON_URL,
  jobTitle: "Founder & CEO, PRNM Corp",
  sameAs: [
    "https://www.amazon.com/stores/Derek-Bowen/author/B0FJM55Y12",
    "https://www.linkedin.com/in/derekcbowen/",
  ],
} as const;

export interface SeoMetaInput {
  title: string;
  description: string;
  path: string; // starts with /
  canonicalPath?: string; // overrides `path` for canonical (e.g. strip query)
  /**
   * Stored canonical override (content_pages.canonical_override). It may move
   * the canonical to another PATH; the host is always the one the country
   * mapping assigns (src/lib/country-sites.ts resolveCanonicalUrl), so an
   * override on any other host is ignored.
   */
  canonicalUrl?: string;
  /** Optional override for og:title and twitter:title. Falls back to `title`. */
  ogTitle?: string;
  /** Optional override for og:description and twitter:description. Falls back to `description`. */
  ogDescription?: string;
  image?: string | null;
  type?: "website" | "article" | "product";
  noindex?: boolean;
  prevPath?: string | null;
  nextPath?: string | null;
  /**
   * Request-scoped origin from getRouteOrigin(). No longer used for any URL
   * this function emits: canonical, og:url, og:image and prev/next are built
   * on the canonical host from the country mapping, whichever host served the
   * request (audit fix F10 — every page used to self-canonicalise to the
   * ccTLD it was fetched on). Kept so existing callers need not change.
   */
  origin?: string;
  /**
   * Bidirectional hreflang links. When set, emits <link rel="alternate"
   * hreflang="..."> tags for each entry. Always include x-default. Each `href`
   * must be an absolute URL.
   */
  hreflang?: Array<{ lang: string; href: string }>;
}

export function buildMeta({
  title,
  description,
  path,
  canonicalPath,
  canonicalUrl: canonicalUrlOverride,
  ogTitle,
  ogDescription,
  image,
  type = "website",
  noindex,
  prevPath,
  nextPath,
  hreflang,
}: SeoMetaInput) {
  // One canonical per page, on the host the country mapping assigns
  // (src/lib/country-sites.ts): a country page on its ccTLD, everything else
  // on www. The request host does not matter.
  // An empty canonicalPath (a row with no url_path) falls back to `path`.
  const canonicalUrl = resolveCanonicalUrl(canonicalPath || path, canonicalUrlOverride);
  const siteOrigin = new URL(canonicalUrl).origin;
  // og:url and twitter URLs should reflect the canonical location, not the
  // (potentially legacy) request path. This keeps social shares deduplicated
  // when a page is reachable via multiple URLs that 301 to one canonical.
  const url = canonicalUrl;
  // Social crawlers reject relative paths. Imported Vite assets resolve to
  // a hashed "/fw-assets/..." URL — prefix with siteOrigin so og:image and
  // twitter:image are always absolute and on the live host.
  const rawImage = image === null ? null : image ?? DEFAULT_OG_IMAGE;
  const resolvedImage =
    rawImage && rawImage.startsWith("/") ? `${siteOrigin}${rawImage}` : rawImage;
  const ogTitleResolved = ogTitle || title;
  const ogDescriptionResolved = ogDescription || description;
  const meta: Array<Record<string, string>> = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: ogTitleResolved },
    { property: "og:description", content: ogDescriptionResolved },
    { property: "og:type", content: type },
    { property: "og:url", content: url },
    { property: "og:site_name", content: SITE_NAME },
    { name: "twitter:card", content: resolvedImage ? "summary_large_image" : "summary" },
    { name: "twitter:title", content: ogTitleResolved },
    { name: "twitter:description", content: ogDescriptionResolved },
  ];
  if (resolvedImage) {
    meta.push({ property: "og:image", content: resolvedImage });
    meta.push({ property: "og:image:width", content: "1200" });
    meta.push({ property: "og:image:height", content: "630" });
    meta.push({ name: "twitter:image", content: resolvedImage });
  }
  if (noindex) {
    meta.push({ name: "robots", content: "noindex, nofollow" });
  }
  const links: Array<Record<string, string>> = [
    { rel: "canonical", href: canonicalUrl },
  ];
  if (prevPath) links.push({ rel: "prev", href: `${siteOrigin}${prevPath}` });
  if (nextPath) links.push({ rel: "next", href: `${siteOrigin}${nextPath}` });
  if (hreflang?.length) {
    for (const h of hreflang) {
      links.push({ rel: "alternate", hreflang: h.lang, href: h.href });
    }
  }
  return { meta, links };
}


export interface BreadcrumbItem {
  name: string;
  /** May be null/empty at runtime (a row's url_path); pass contentPagePath(page) for a page's own crumb. */
  path: string | null | undefined;
}

/**
 * Absolute URL of a site path in structured data: on the host the country
 * mapping assigns to that path (a country page's ccTLD, else www), so JSON-LD
 * names the same URL the page's canonical does. The path's query, if any, is
 * kept (e.g. the blog topic crumb /p/blog?topic=...). A missing path (null,
 * undefined, "") never throws and never yields ".../null": it gives the www
 * origin with "/". Callers naming a content page pass contentPagePath(page).
 */
export function structuredDataUrl(path: string | null | undefined): string {
  return `${canonicalOriginForPath(path)}${sitePath(path) || "/"}`;
}

/**
 * A BreadcrumbList ListItem. A crumb without a path gets no `item` (Google
 * allows that for the last crumb) instead of a URL that names another page.
 */
export function breadcrumbListItem(name: string, path: string | null | undefined, position: number) {
  return {
    "@type": "ListItem",
    position,
    name,
    ...(sitePath(path) ? { item: structuredDataUrl(path) } : {}),
  };
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => breadcrumbListItem(item.name, item.path, i + 1)),
  };
}

export interface ItemListEntry {
  name: string;
  path: string;
  image?: string | null;
}

export function itemListJsonLd(items: ItemListEntry[], listName?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    ...(listName ? { name: listName } : {}),
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: structuredDataUrl(item.path),
      name: item.name,
      ...(item.image ? { image: item.image } : {}),
    })),
  };
}

export function organizationJsonLd() {
  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: SITE_LOGO,
    sameAs: SOCIAL_PROFILES,
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+1-888-940-4247",
        contactType: "customer service",
        email: "support@poolrentalnearme.com",
        areaServed: "US",
        availableLanguage: ["English", "Spanish"],
      },
    ],
  };
  // No aggregateRating here (removed 2026-09-02). A self-reported brand rating
  // on the Organization node, attached to every page including 404s, is not
  // eligible for review snippets and reads as self-serving markup. Listing
  // pages on the marketplace carry real, per-listing review ratings instead.
  return base;
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/s?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function ldJsonScript(obj: unknown) {
  return {
    type: "application/ld+json",
    children: JSON.stringify(obj),
  };
}
