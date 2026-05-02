/**
 * SEO helpers for building meta tags and JSON-LD structured data.
 */

export const SITE_URL = "https://www.poolrentalnearme.com";
export const SITE_NAME = "Pool Rental Near Me";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.jpg`;
export const SITE_LOGO = `${SITE_URL}/og-default.jpg`;

export const SOCIAL_PROFILES = [
  "https://www.facebook.com/poolrentalnearme",
  "https://x.com/poolrentalnearme",
  "https://www.youtube.com/@poolrentalnearme",
  "https://www.linkedin.com/company/poolrentalnearme",
  "https://www.instagram.com/poolrentalnearme",
  "https://www.tiktok.com/@poolrentalnearme",
  "https://www.pinterest.com/poolrentalnearme",
];

export interface SeoMetaInput {
  title: string;
  description: string;
  path: string; // starts with /
  canonicalPath?: string; // overrides `path` for canonical (e.g. strip query)
  image?: string | null;
  type?: "website" | "article" | "product";
  noindex?: boolean;
  prevPath?: string | null;
  nextPath?: string | null;
}

export function buildMeta({
  title,
  description,
  path,
  canonicalPath,
  image,
  type = "website",
  noindex,
  prevPath,
  nextPath,
}: SeoMetaInput) {
  const url = `${SITE_URL}${path}`;
  const canonicalUrl = `${SITE_URL}${canonicalPath ?? path}`;
  const resolvedImage = image === null ? null : image ?? DEFAULT_OG_IMAGE;
  const meta: Array<Record<string, string>> = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: type },
    { property: "og:url", content: url },
    { property: "og:site_name", content: SITE_NAME },
    { name: "twitter:card", content: resolvedImage ? "summary_large_image" : "summary" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
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
