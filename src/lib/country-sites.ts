/**
 * Canonical host and country mapping — the one place that decides which host
 * a page's canonical URL lives on (audit fix F10, owner's rule: "Use explicit
 * canonical-host and country mappings").
 *
 * Pure (no imports, no framework), so `node --test` can import it directly and
 * both the server and the client bundle can use it.
 *
 * Every host serves the whole site (EAST answers the ccTLDs directly, WEST
 * proxies www to EAST), so the canonical must not follow the request host.
 * The rules:
 *
 *   1. A page that belongs to a country (below) has exactly one canonical URL:
 *      https://<that country's canonical host>/p/<slug>, whichever host served
 *      it (www.poolrentalnearme.com, the bare ccTLD or www.<ccTLD>).
 *   2. Every other page canonicalises to https://www.poolrentalnearme.com.
 *
 * Which pages belong to a country. Only single-segment content URLs /p/<slug>,
 * matched by an explicit SUFFIX ("-uk") or an EXACT slug. Never a substring or
 * bare wildcard: "%melbourne%" sweeps in /p/become-a-swimming-pool-host-
 * melbourne-fl, "%vancouver%" Vancouver WA, "%manchester%" Manchester NH/MO/TN
 * and "%london%" London OH (all live US pages on 2026-11-15). The prefix
 * patterns robots.txt used to carry ("/p/australian-*", "/p/canadian-*") are
 * replaced by the one exact slug each matched.
 *
 * Canonical host per country: the BARE ccTLD. On 2026-11-15 all 60
 * content_pages rows with a canonical_override point at the bare ccTLD with
 * the same path (57 in a sitemap, 3 not), every ccTLD sitemap already listed
 * the bare host, and www.<ccTLD> answered with a canonical to the bare host for
 * those rows. The 9 country_launch hubs had no override and were self-canonical
 * on three hosts each; they now follow the same rule.
 *
 * Nothing here changes what is served or redirects a host: it decides
 * canonical, robots.txt (src/routes/robots[.]txt.ts), sitemap-country.xml and
 * which URLs the www sitemaps may list (src/lib/sitemap-rules.ts).
 */

export const WWW_HOST = "www.poolrentalnearme.com";
export const WWW_ORIGIN = `https://${WWW_HOST}`;
/** The .com hosts. Bare .com 301s to www at the edge. */
export const COM_HOSTS: readonly string[] = [WWW_HOST, "poolrentalnearme.com"];

export type CountryCode = "GB" | "CA" | "AU";

export interface CountrySite {
  code: CountryCode;
  /** As written in the robots.txt header comment. */
  label: string;
  /** hreflang value for this market's pages. */
  hreflang: "en-GB" | "en-CA" | "en-AU";
  /** The one host a country page's canonical lives on. */
  canonicalHost: string;
  /** Every host that serves this country's domain (canonical host first). */
  hosts: readonly string[];
  /** A /p/<slug> whose slug ends with one of these belongs to this country. */
  slugSuffixes: readonly string[];
  /** And these exact slugs. */
  exactSlugs: readonly string[];
  /**
   * US places whose name ends in a country suffix. A slug equal to one of
   * these, or ending in "-" + one of these, is NOT this country's page even
   * though it ends with a suffix above (the suffix form of the "%melbourne%"
   * trap CLAUDE.md warns about). Each entry is a real US place in the site's
   * own data.
   */
  usPlaceTraps: readonly string[];
}

export const COUNTRY_SITES: readonly CountrySite[] = [
  {
    code: "GB",
    label: "United Kingdom",
    hreflang: "en-GB",
    canonicalHost: "poolrentalnearme.co.uk",
    hosts: ["poolrentalnearme.co.uk", "www.poolrentalnearme.co.uk"],
    slugSuffixes: ["-uk", "-united-kingdom"],
    exactSlugs: [
      "rent-out-your-pool-london",
      "rent-out-your-pool-manchester",
      // The three below carried a canonical_override to co.uk but matched no
      // robots Allow line, so .com pointed Google at a URL it may not fetch.
      "pool-rental-london",
      "pool-rental-manchester",
      "uk-cities-with-pools",
    ],
    // No US place in the site's cities data (5,360 city|state keys, audit
    // 2026-11-14) ends in "uk" or "united-kingdom".
    usPlaceTraps: [],
  },
  {
    code: "CA",
    label: "Canada",
    hreflang: "en-CA",
    canonicalHost: "poolrentalnearme.ca",
    hosts: ["poolrentalnearme.ca", "www.poolrentalnearme.ca"],
    slugSuffixes: ["-canada"],
    exactSlugs: [
      "canadian-cities-with-pools",
      "rent-out-your-pool-toronto",
      "rent-out-your-pool-vancouver",
      "pool-rental-toronto",
      "pool-rental-vancouver",
    ],
    // Little Canada, MN: city key "little-canada|mn" in the site's cities data
    // and /p/become-a-swimming-pool-host-little-canada-mn in the 2026-11-14
    // sitemap. Its bare-city forms (/p/<prefix>-little-canada, as other
    // bare-city slugs like become-a-swimming-pool-host-akron exist) would
    // otherwise end in "-canada" and be mapped to poolrentalnearme.ca.
    usPlaceTraps: ["little-canada"],
  },
  {
    code: "AU",
    label: "Australia",
    hreflang: "en-AU",
    canonicalHost: "poolrentalnearme.com.au",
    hosts: ["poolrentalnearme.com.au", "www.poolrentalnearme.com.au"],
    slugSuffixes: ["-australia"],
    exactSlugs: [
      "australian-cities-with-pools",
      "rent-out-your-pool-sydney",
      "rent-out-your-pool-melbourne",
      "pool-rental-sydney",
      "pool-rental-melbourne",
    ],
    // No US place in the site's cities data ends in "australia".
    usPlaceTraps: [],
  },
];

/**
 * Same-origin files every page's markup references outside /fw-assets/: the
 * header/footer logo (<img src="/icon.svg"> in site-layout.tsx) and the
 * favicon links in __root.tsx. A country domain's robots.txt allows them so
 * its pages render with their logo and get a site favicon.
 */
export const RENDER_ASSET_PATHS: readonly string[] = [
  "/icon.svg",
  "/favicon.ico",
  "/favicon-192.png",
  "/favicon-512.png",
  "/apple-touch-icon.png",
];

/** A content slug: lower-case words of [a-z0-9] joined by single hyphens, one segment. */
const SINGLE_SEGMENT_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Lower-case, no port, no trailing dot. "" for anything unusable. */
export function normaliseHost(host: string | null | undefined): string {
  const h = (host ?? "").trim().toLowerCase().split(",")[0]!.trim();
  return h.replace(/:\d+$/, "").replace(/\.$/, "");
}

/**
 * The public host a request was made to: X-Forwarded-Host (set by WEST nginx
 * for www and by EAST nginx for the ccTLDs; a client-sent value is replaced
 * by both proxies), else Host, else the request URL's host. Used by robots.txt
 * and sitemap-country.xml so they key on the same host the page renderer saw.
 */
export function publicHostOf(request: Request): string {
  const fwd = normaliseHost(request.headers.get("x-forwarded-host"));
  if (fwd) return fwd;
  const host = normaliseHost(request.headers.get("host"));
  if (host) return host;
  try {
    return normaliseHost(new URL(request.url).host);
  } catch {
    return "";
  }
}

export function countryForHost(host: string | null | undefined): CountrySite | null {
  const h = normaliseHost(host);
  return COUNTRY_SITES.find((s) => s.hosts.includes(h)) ?? null;
}

export function isComHost(host: string | null | undefined): boolean {
  return COM_HOSTS.includes(normaliseHost(host));
}

/** The suffix of `site` that `slug` ends with, if any (the slug must be longer than it). */
function matchedSuffix(site: CountrySite, slug: string): string | null {
  for (const suffix of site.slugSuffixes) {
    if (slug.length > suffix.length && slug.endsWith(suffix)) return suffix;
  }
  return null;
}

/** Is `slug` a US place trap of `site` (equal to one, or ending in "-" + one)? */
function isUsPlaceTrap(site: CountrySite, slug: string): boolean {
  return site.usPlaceTraps.some((t) => slug === t || slug.endsWith(`-${t}`));
}

/** The country a /p/<slug> content slug belongs to, or null (a US / www page). */
export function countryForSlug(slug: string | null | undefined): CountrySite | null {
  if (typeof slug !== "string" || !SINGLE_SEGMENT_SLUG.test(slug)) return null;
  for (const site of COUNTRY_SITES) {
    if (site.exactSlugs.includes(slug)) return site;
    if (matchedSuffix(site, slug) && !isUsPlaceTrap(site, slug)) return site;
  }
  return null;
}

/**
 * A path argument as given, or "" when there is none. Every function below
 * that takes a path accepts null, undefined and "" (content_pages.url_path is
 * NULL on most country pages in production: 50 of the 59 pages in the three
 * ccTLD sitemaps on 2026-11-16), so a missing path can never throw inside a
 * render. Callers that build a page's own URL pass contentPagePath(page),
 * which falls back to /p/<slug>.
 */
function pathText(path: string | null | undefined): string {
  return typeof path === "string" ? path.trim() : "";
}

/**
 * The path a content_pages row is served at: its url_path when set, else
 * /p/<slug> (the dispatcher serves every row at /p/<slug>). "" only when the
 * row has neither. Use it wherever a template or head() names the page's own
 * URL (breadcrumb self crumb, JSON-LD url, canonical): url_path is NULL on
 * most country pages in production.
 */
export function contentPagePath(
  page: { url_path?: string | null; slug?: string | null } | null | undefined,
): string {
  const stored = pathText(page?.url_path);
  if (stored) return stored;
  const slug = pathText(page?.slug).replace(/^\/+|\/+$/g, "");
  return slug ? `/p/${slug}` : "";
}

/** The single path segment of /p/<slug> (query and hash ignored), else null. */
function contentSlugOfPath(path: string | null | undefined): string | null {
  const bare = pathText(path).split(/[?#]/)[0]!;
  const m = bare.match(/^\/p\/([^/]+)$/);
  return m ? m[1]! : null;
}

export function countryForPath(path: string | null | undefined): CountrySite | null {
  const slug = contentSlugOfPath(path);
  return slug ? countryForSlug(slug) : null;
}

/** https://<host> a page at `path` is canonical on (www for a missing path). */
export function canonicalOriginForPath(path: string | null | undefined): string {
  const site = countryForPath(path);
  return site ? `https://${site.canonicalHost}` : WWW_ORIGIN;
}

/**
 * `path` as an absolute site path: leading "/" added, "" for a missing path.
 * Query and hash are kept.
 */
export function sitePath(path: string | null | undefined): string {
  const p = pathText(path);
  if (!p) return "";
  return p.startsWith("/") ? p : `/${p}`;
}

/**
 * The canonical URL of the page at `path` (query and hash dropped). A missing
 * path (null, undefined, "") gives the www origin with "/", never a string
 * ending in "null".
 */
export function canonicalUrlForPath(path: string | null | undefined): string {
  const bare = (sitePath(path) || "/").split(/[?#]/)[0]!;
  return `${canonicalOriginForPath(bare)}${bare}`;
}

/**
 * The canonical URL for a page at `pagePath` that may carry a stored override
 * (content_pages.canonical_override). The mapping decides the host; an
 * override may only name another PATH IN THE PAGE'S OWN MARKET (the target
 * maps to the same country as the page, or both to www), and is honoured when
 * it is (a) relative, or (b) absolute on exactly the host the mapping assigns
 * to that path. Anything else is ignored and the page's own mapped canonical
 * is used: another host, a ccTLD URL for a US page (same path or not — e.g.
 * /p/pool-maintenance -> /p/pool-maintenance-uk), a www URL for a country
 * page, a non-http(s) or unparseable value. Market is compared, not host,
 * because a relative override names no host at all. On 2026-11-15 every one
 * of the 60 overrides equals the mapped canonical of its own row, so this
 * changes no stored override's effect; it stops a future one (the admin tool
 * can write canonical_override) from moving a page to another market's host.
 */
export function resolveCanonicalUrl(
  pagePath: string | null | undefined,
  override?: string | null,
): string {
  const own = canonicalUrlForPath(pagePath);
  const raw = (override ?? "").trim();
  if (!raw) return own;
  const sameMarket = (path: string) => countryForPath(path) === countryForPath(pagePath);
  if (raw.startsWith("/") && !raw.startsWith("//")) {
    return sameMarket(raw) ? canonicalUrlForPath(raw) : own;
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return own;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return own;
  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (!sameMarket(path)) return own;
  const mapped = canonicalUrlForPath(path);
  return normaliseHost(url.host) === new URL(mapped).host ? mapped : own;
}

/** robots.txt Allow patterns for every page the mapping assigns to `site`. */
export function robotsAllowPatterns(site: CountrySite): string[] {
  return [
    ...site.slugSuffixes.map((s) => `/p/*${s}$`),
    ...site.exactSlugs.map((s) => `/p/${s}$`),
  ];
}

/**
 * robots.txt Disallow patterns that carve the US place traps back out of the
 * suffix Allow lines. Each is longer than the suffix pattern it overrides, so
 * it wins under the longest-match rule (Google, RFC 9309).
 */
export function robotsTrapDisallowPatterns(site: CountrySite): string[] {
  return site.usPlaceTraps.flatMap((t) => [`/p/${t}$`, `/p/*-${t}$`]);
}

/**
 * robots.txt for a country domain (bare and www.): everything disallowed
 * except the pages the mapping assigns to the country, its own
 * sitemap-country.xml, and what those pages need to render: /fw-assets/ (the
 * JS/CSS bundle — it used to be disallowed, so Googlebot could fetch the HTML
 * only) and the logo and favicon files (RENDER_ASSET_PATHS). The US place
 * traps are disallowed again after the suffix Allow lines. The Sitemap line
 * names the canonical host, where the sitemap's <loc>s live, on both host
 * variants.
 */
export function countryRobotsTxt(site: CountrySite, wwwOrigin: string = WWW_ORIGIN): string {
  const allow = [
    ...robotsAllowPatterns(site),
    "/sitemap-country.xml$",
    "/fw-assets/",
    ...RENDER_ASSET_PATHS.map((p) => `${p}$`),
  ];
  const traps = robotsTrapDisallowPatterns(site);
  return `# ${site.label} domain for Pool Rental Near Me.
# Only this country's pages are crawlable here; everything else lives on
# ${wwwOrigin} and must not be duplicated across origins.
User-agent: *
Disallow: /
${allow.map((p) => `Allow: ${p}`).join("\n")}
${traps.map((p) => `Disallow: ${p}`).join("\n")}${traps.length ? "\n" : ""}
Sitemap: https://${site.canonicalHost}/sitemap-country.xml
`;
}

/**
 * A PostgREST `or=(...)` filter that selects at least every content_pages slug
 * the mapping assigns to `site`. It only narrows the read; countryForSlug is
 * applied to every row afterwards and is what decides.
 */
export function slugOrFilter(site: CountrySite): string {
  return [
    ...site.slugSuffixes.map((s) => `slug.like.*${s}`),
    ...site.exactSlugs.map((s) => `slug.eq.${s}`),
  ].join(",");
}

/**
 * hreflang alternates for a country page. The mapping defines equivalents in
 * one way only: the same base article localised per market by its country
 * suffix ("pool-maintenance-uk", "-canada", "-australia"), all three in the
 * same hreflang_group. Exact-slug country pages (city pages, the
 * cities-with-pools pages, the launch hubs) have no defined equivalent — the
 * database grouped London with Toronto and Sydney under "new-york-ny" — so
 * they get none. Every href is the sibling's canonical URL. Returns undefined
 * unless at least two markets are present (a lone self-reference is noise).
 * No en-US and no x-default: the .com article whose slug is the group key
 * (e.g. /p/pool-maintenance) carries no hreflang of its own (0 of 19 such
 * pages in the 2026-11-14 crawl) and nothing establishes it is the same
 * article, so pairing it would be inventing an equivalent.
 */
export function countryHreflangAlternates(
  slug: string,
  groupSlugs: readonly string[],
): Array<{ lang: string; href: string }> | undefined {
  const own = countryForSlug(slug);
  if (!own) return undefined;
  const ownSuffix = matchedSuffix(own, slug);
  if (!ownSuffix || own.exactSlugs.includes(slug)) return undefined;
  const base = slug.slice(0, -ownSuffix.length);
  const present = new Set([slug, ...groupSlugs]);
  const out: Array<{ lang: string; href: string }> = [];
  for (const site of COUNTRY_SITES) {
    const match = site.slugSuffixes
      .map((s) => `${base}${s}`)
      .find((s) => present.has(s) && countryForSlug(s) === site && !site.exactSlugs.includes(s));
    if (match) out.push({ lang: site.hreflang, href: canonicalUrlForPath(`/p/${match}`) });
  }
  return out.length >= 2 ? out : undefined;
}
