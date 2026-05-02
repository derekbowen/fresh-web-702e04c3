/**
 * SEO helpers for building meta tags and JSON-LD structured data.
 */

export const SITE_URL = "https://www.poolrentalnearme.com";
export const SITE_NAME = "Pool Rental Near Me";

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
  const meta: Array<Record<string, string>> = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: type },
    { property: "og:url", content: url },
    { property: "og:site_name", content: SITE_NAME },
    { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];
  if (image) {
    meta.push({ property: "og:image", content: image });
    meta.push({ name: "twitter:image", content: image });
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

export function ldJsonScript(obj: unknown) {
  return {
    type: "application/ld+json",
    children: JSON.stringify(obj),
  };
}
