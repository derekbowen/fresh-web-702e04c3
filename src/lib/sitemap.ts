/**
 * Shared helpers for building sitemap XML.
 *
 * Defensive choices (per migration-plan/04-sitemap-structure.md):
 * - Strict XML escaping on every URL/string interpolated into XML
 * - ISO 8601 lastmod with timezone
 * - Explicit Content-Type with charset=utf-8
 * - Streaming-friendly response building (string concat is fine up to ~50K URLs;
 *   Cloudflare Workers have plenty of memory for this)
 * - No <priority>, no <changefreq> (Google ignores both)
 */

export const SITEMAP_PAGE_SIZE = 45_000;

const XML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

export function xmlEscape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => XML_ESCAPE_MAP[c] ?? c);
}

export function isoDate(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export interface SitemapUrl {
  loc: string;
  lastmod?: string | Date | null;
  /** Image entries — surface hero/og images to Google Image Search */
  images?: Array<{
    loc: string;
    title?: string;
    caption?: string;
  }>;
  /** Bidirectional hreflang links */
  hreflang?: Array<{
    lang: string; // 'en', 'es', or 'x-default'
    href: string;
  }>;
}

export interface SitemapIndexEntry {
  loc: string;
  lastmod?: string | Date | null;
}

export function buildUrlsetXml(urls: SitemapUrl[]): string {
  const usesImages = urls.some((u) => u.images?.length);
  const usesHreflang = urls.some((u) => u.hreflang?.length);

  const namespaces = ['xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'];
  if (usesHreflang) namespaces.push('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
  if (usesImages) namespaces.push('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');

  const body = urls
    .map((u) => {
      const parts = [`    <loc>${xmlEscape(u.loc)}</loc>`];
      const lastmod = isoDate(u.lastmod);
      if (lastmod) parts.push(`    <lastmod>${lastmod}</lastmod>`);
      if (u.hreflang?.length) {
        for (const h of u.hreflang) {
          parts.push(
            `    <xhtml:link rel="alternate" hreflang="${xmlEscape(h.lang)}" href="${xmlEscape(h.href)}"/>`,
          );
        }
      }
      if (u.images?.length) {
        for (const img of u.images) {
          const inner = [`      <image:loc>${xmlEscape(img.loc)}</image:loc>`];
          if (img.title) inner.push(`      <image:title>${xmlEscape(img.title)}</image:title>`);
          if (img.caption) inner.push(`      <image:caption>${xmlEscape(img.caption)}</image:caption>`);
          parts.push(`    <image:image>\n${inner.join("\n")}\n    </image:image>`);
        }
      }
      return `  <url>\n${parts.join("\n")}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset ${namespaces.join("\n        ")}>
${body}
</urlset>
`;
}

export function buildSitemapIndexXml(entries: SitemapIndexEntry[]): string {
  const body = entries
    .map((e) => {
      const parts = [`    <loc>${xmlEscape(e.loc)}</loc>`];
      const lastmod = isoDate(e.lastmod);
      if (lastmod) parts.push(`    <lastmod>${lastmod}</lastmod>`);
      return `  <sitemap>\n${parts.join("\n")}\n  </sitemap>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>
`;
}

export const SITEMAP_RESPONSE_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  // Short cache during launch window — switch to 1 hour after stable
  "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
  "X-Robots-Tag": "noindex",
} as const;

export function sitemapResponse(xml: string, init?: ResponseInit): Response {
  return new Response(xml, {
    status: 200,
    ...init,
    headers: { ...SITEMAP_RESPONSE_HEADERS, ...(init?.headers as Record<string, string> | undefined) },
  });
}

/**
 * Build a `/sitemap-pages-*.xml` sub-sitemap for one or more `template_type`
 * values. Used by every per-template sub-sitemap route.
 *
 * Pagination: takes ?page=N from the request URL. Pages start at 1. Auto-paginates
 * via the parent index (`sitemap.xml`) when a single template type exceeds
 * SITEMAP_PAGE_SIZE rows.
 */
export async function buildContentPagesSitemap(
  request: Request,
  templateTypes: string[],
  pathPrefix: string,
  supabase: import("@supabase/supabase-js").SupabaseClient,
  siteUrl: string,
): Promise<Response> {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const offset = (page - 1) * SITEMAP_PAGE_SIZE;

  const { data, error } = await supabase
    .from("content_pages")
    .select("slug, updated_at, hero_image_url")
    .in("template_type", templateTypes)
    .eq("in_sitemap", true)
    .eq("status", "published")
    .not("slug", "is", null)
    .order("slug")
    .range(offset, offset + SITEMAP_PAGE_SIZE - 1);

  if (error) {
    console.error(`[sitemap] supabase error for ${templateTypes.join(",")}`, error);
    return sitemapResponse(buildUrlsetXml([]));
  }

  const urls: SitemapUrl[] = (data ?? []).map((row) => {
    const sitemapUrl: SitemapUrl = {
      loc: `${siteUrl}${pathPrefix}/${row.slug}`,
      lastmod: row.updated_at,
    };
    if (row.hero_image_url) {
      sitemapUrl.images = [{ loc: row.hero_image_url }];
    }
    return sitemapUrl;
  });

  return sitemapResponse(buildUrlsetXml(urls));
}

/** Generate a 301 redirect Response to a target path. Cached for 24h. */
export function redirect301(targetPath: string, siteUrl: string): Response {
  return new Response(null, {
    status: 301,
    headers: {
      Location: `${siteUrl}${targetPath}`,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
