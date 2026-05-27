/**
 * SEO helpers for building meta tags and JSON-LD structured data.
 */
import ogDefaultImage from "@/assets/og-default.jpg";

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
  "https://x.com/poolrentalnearme",
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
  /** Absolute URL override for canonical (e.g. cross-domain). Wins over canonicalPath. */
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
  const canonicalUrl = canonicalUrlOverride ?? `${SITE_URL}${canonicalPath ?? path}`;
  // og:url and twitter URLs should reflect the canonical location, not the
  // (potentially legacy) request path. This keeps social shares deduplicated
  // when a page is reachable via multiple URLs that 301 to one canonical.
  const url = canonicalUrl;
  // Social crawlers reject relative paths. Imported Vite assets resolve to
  // a hashed "/fw-assets/..." URL — prefix with SITE_URL so og:image and
  // twitter:image are always absolute.
  const rawImage = image === null ? null : image ?? DEFAULT_OG_IMAGE;
  const resolvedImage =
    rawImage && rawImage.startsWith("/") ? `${SITE_URL}${rawImage}` : rawImage;
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
  if (prevPath) links.push({ rel: "prev", href: `${SITE_URL}${prevPath}` });
  if (nextPath) links.push({ rel: "next", href: `${SITE_URL}${nextPath}` });
  if (hreflang?.length) {
    for (const h of hreflang) {
      links.push({ rel: "alternate", hreflang: h.lang, href: h.href });
    }
  }
  return { meta, links };
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
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
      url: `${SITE_URL}${item.path}`,
      name: item.name,
      ...(item.image ? { image: item.image } : {}),
    })),
  };
}

export function organizationJsonLd() {
  return {
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
