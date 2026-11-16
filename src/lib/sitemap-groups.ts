/**
 * The content_pages sitemap groups: which rows each `/sitemap-pages-*.xml`
 * emits. ONE definition, read by the sitemap index (src/routes/sitemap[.]xml.ts,
 * which re-exports it as TEMPLATE_GROUPS) and by every sub-sitemap route, so a
 * template_type can no longer be listed in one and missing from the other (how
 * the 9 country_launch pages once sat uncrawled).
 *
 * Pure: no path alias, no framework import.
 *
 * Untyped rows (template_type NULL, 302 published on 2026-11-15) are NOT
 * eligible by default. A published row alone does not establish sitemap
 * eligibility. Only rows reviewed in docs/seo-repairs-2026-11/untyped-pages.md
 * are named here, through `untypedSlugs` / `untypedSlugPrefixes`, and only while
 * they stay untyped: once such a row gets a template_type it is owned by that
 * type's group instead, so it can never be listed twice.
 */

export interface ContentSitemapGroup {
  /** Sub-sitemap path, e.g. "/sitemap-pages-articles.xml". */
  basePath: string;
  templateTypes: readonly string[];
  /** Reviewed untyped rows (template_type IS NULL) this group owns, by exact slug. */
  untypedSlugs?: readonly string[];
  /** Reviewed untyped families this group owns, by slug prefix. */
  untypedSlugPrefixes?: readonly string[];
  /** Minimum trimmed body_markdown length (chars); thinner rows are left out. */
  minBodyChars?: number;
}

export const CONTENT_SITEMAP_GROUPS: readonly ContentSitemapGroup[] = [
  { basePath: "/sitemap-pages-money.xml", templateTypes: ["money_page"] },
  { basePath: "/sitemap-pages-cities.xml", templateTypes: ["city_main"] },
  {
    basePath: "/sitemap-pages-host-acquisition.xml",
    templateTypes: ["host_acq_city", "host_acq_hub"],
  },
  { basePath: "/sitemap-pages-event-guides.xml", templateTypes: ["event_guide"] },
  {
    basePath: "/sitemap-pages-articles.xml",
    templateTypes: [
      "resource",
      "other",
      "pool_maintenance",
      "pool_maintenance_hub",
      "country_launch",
      // One row (a 3,400-character swim-spa article, 200, indexable,
      // self-canonical on 2026-11-15) carries this type and no group read it.
      "resource_article",
    ],
    // Reviewed 2026-11-15: 200, indexable, self-canonical, real pages, no
    // typed twin. See docs/seo-repairs-2026-11/untyped-pages.md.
    untypedSlugs: ["pool-host-tools", "qr-code-generator"],
  },
  {
    basePath: "/sitemap-pages-academy.xml",
    templateTypes: ["elearning"],
    // The 131 untyped elearning-academy-* course pages and the catalogue the
    // WEST static academy file has listed since 2026-07-20; this route did not.
    untypedSlugs: ["academy-catalog"],
    untypedSlugPrefixes: ["elearning-academy-"],
    minBodyChars: 800,
  },
  {
    basePath: "/sitemap-pages-advocacy.xml",
    templateTypes: ["host_advocacy_hub", "host_advocacy_state"],
  },
  {
    basePath: "/sitemap-pages-spanish.xml",
    templateTypes: ["spanish_host_acq", "spanish_resource", "host_acq_city_es"],
  },
  {
    basePath: "/sitemap-pages-swim-instructor.xml",
    templateTypes: ["swim_instructor_city", "swim_instructor_hub"],
  },
];

export function contentGroup(basePath: string): ContentSitemapGroup {
  const g = CONTENT_SITEMAP_GROUPS.find((x) => x.basePath === basePath);
  if (!g) throw new Error(`no content sitemap group for ${basePath}`);
  return g;
}

/** PostgREST quoting for one value inside in.(...) / like. */
function pgrstValue(v: string): string {
  return /[,()."\\:\s*]/.test(v) ? `"${v.replace(/["\\]/g, "\\$&")}"` : v;
}

/**
 * The PostgREST `or` filter that selects a group's rows:
 *   template_type.in.(a,b)
 *   [,and(template_type.is.null,slug.in.(x,y))]
 *   [,and(template_type.is.null,slug.like.prefix*)]
 */
export function groupOrFilter(group: ContentSitemapGroup): string {
  const parts = [`template_type.in.(${group.templateTypes.map(pgrstValue).join(",")})`];
  if (group.untypedSlugs?.length) {
    parts.push(
      `and(template_type.is.null,slug.in.(${group.untypedSlugs.map(pgrstValue).join(",")}))`,
    );
  }
  for (const prefix of group.untypedSlugPrefixes ?? []) {
    if (!/^[a-z0-9-]+$/.test(prefix)) throw new Error(`unsupported slug prefix ${prefix}`);
    parts.push(`and(template_type.is.null,slug.like.${prefix}*)`);
  }
  return parts.join(",");
}

/** Does a row belong to this group? Same rule as groupOrFilter, for tests and in-memory checks. */
export function rowInGroup(
  row: { template_type: string | null; slug: string | null },
  group: ContentSitemapGroup,
): boolean {
  if (row.template_type) return group.templateTypes.includes(row.template_type);
  if (!row.slug) return false;
  return (
    (group.untypedSlugs ?? []).includes(row.slug) ||
    (group.untypedSlugPrefixes ?? []).some((p) => row.slug!.startsWith(p))
  );
}
