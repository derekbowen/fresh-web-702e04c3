// Unit tests for the canonical-host and country mapping (src/lib/country-sites.ts),
// checked against the production snapshot of every country row (2026-11-15).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  COUNTRY_SITES,
  RENDER_ASSET_PATHS,
  WWW_ORIGIN,
  canonicalUrlForPath,
  countryForHost,
  countryForPath,
  countryForSlug,
  countryHreflangAlternates,
  countryRobotsTxt,
  publicHostOf,
  resolveCanonicalUrl,
  robotsAllowPatterns,
  slugOrFilter,
} from "../src/lib/country-sites.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SNAPSHOT = join(ROOT, "ops/seo-repairs-2026-11/country-mapping/content-pages-2026-11-15.psv");
const rows = readFileSync(SNAPSHOT, "utf8")
  .split("\n")
  .filter((l) => l && !l.startsWith("#"))
  .map((l) => {
    const [slug, status, in_sitemap, template_type, locale, canonical_override, hreflang_group] = l.split("|");
    return { slug, status, in_sitemap: in_sitemap === "t", template_type, locale, canonical_override, hreflang_group };
  });
const site = (code) => COUNTRY_SITES.find((s) => s.code === code);
const LOCALE = { "en-GB": "GB", "en-CA": "CA", "en-AU": "AU" };

/** Google's robots.txt rule matching: longest matching pattern wins, a tie goes to Allow. */
function robotsAllows(body, path) {
  let best = { len: -1, allow: true };
  for (const line of body.split("\n")) {
    const m = line.match(/^(Allow|Disallow):\s*(\S*)\s*$/);
    if (!m || !m[2]) continue;
    const pat = m[2];
    const anchored = pat.endsWith("$");
    const re = new RegExp(
      `^${(anchored ? pat.slice(0, -1) : pat).replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}${anchored ? "$" : ""}`,
    );
    if (!re.test(path)) continue;
    const allow = m[1] === "Allow";
    if (pat.length > best.len || (pat.length === best.len && allow)) best = { len: pat.length, allow };
  }
  return best.allow;
}

// US pages that a bare wildcard would have swept in (all live on 2026-11-15).
const US_TRAPS = [
  "become-a-swimming-pool-host-melbourne-fl",
  "become-a-swimming-pool-host-west-melbourne-fl",
  "become-a-swimming-pool-host-vancouver-wa",
  "become-a-swimming-pool-host-manchester-nh",
  "become-a-swimming-pool-host-manchester-mo",
  "become-a-swimming-pool-host-manchester-tn",
  "become-a-swimming-pool-host-london-oh",
  "become-a-swimming-pool-host-new-london-ct",
  "conviertete-en-anfitrion-de-alberca-melbourne-fl",
  "conviertete-en-anfitrion-de-alberca-vancouver-wa",
  "conviertete-en-anfitrion-de-alberca-manchester-nh",
  "peerspace-vs-pool-rental-near-me-in-manchester",
  "manchester",
  "austin-tx",
  "hosting",
  "how-it-works",
  "american-cities-with-pools",
  // Little Canada, MN (city key "little-canada|mn"; its -mn host page is live).
  // The bare-city forms end in "-canada" and must not become .ca pages.
  "little-canada",
  "become-a-swimming-pool-host-little-canada",
  "become-a-swimming-pool-host-little-canada-mn",
  "swim-instructor-pool-rental-little-canada",
  "giggster-vs-pool-rental-near-me-in-little-canada",
  "peerspace-vs-pool-rental-near-me-in-little-canada",
];

test("snapshot: 69 country rows, 60 overrides (57 in a sitemap), 9 country_launch", () => {
  assert.equal(rows.length, 69);
  assert.equal(rows.filter((r) => r.canonical_override).length, 60);
  assert.equal(rows.filter((r) => r.canonical_override && r.in_sitemap).length, 57);
  assert.equal(rows.filter((r) => r.template_type === "country_launch").length, 9);
});

test("every production country row maps to the country of its locale", () => {
  for (const r of rows) {
    const s = countryForSlug(r.slug);
    assert.ok(s, `${r.slug} has no country`);
    assert.equal(s.code, LOCALE[r.locale], r.slug);
  }
});

test("every stored canonical_override equals the mapped canonical of its own row (no stored decision changes)", () => {
  for (const r of rows.filter((x) => x.canonical_override)) {
    assert.equal(canonicalUrlForPath(`/p/${r.slug}`), r.canonical_override, r.slug);
    assert.equal(resolveCanonicalUrl(`/p/${r.slug}`, r.canonical_override), r.canonical_override, r.slug);
  }
});

test("the 9 country_launch pages get one canonical, on the bare ccTLD", () => {
  const want = {
    "rent-out-your-pool-uk": "poolrentalnearme.co.uk",
    "rent-out-your-pool-london": "poolrentalnearme.co.uk",
    "rent-out-your-pool-manchester": "poolrentalnearme.co.uk",
    "rent-out-your-pool-canada": "poolrentalnearme.ca",
    "rent-out-your-pool-toronto": "poolrentalnearme.ca",
    "rent-out-your-pool-vancouver": "poolrentalnearme.ca",
    "rent-out-your-pool-australia": "poolrentalnearme.com.au",
    "rent-out-your-pool-sydney": "poolrentalnearme.com.au",
    "rent-out-your-pool-melbourne": "poolrentalnearme.com.au",
  };
  for (const [slug, host] of Object.entries(want)) {
    assert.equal(canonicalUrlForPath(`/p/${slug}`), `https://${host}/p/${slug}`);
  }
});

test("US pages are never country pages: no substring or bare-wildcard matching", () => {
  for (const slug of US_TRAPS) assert.equal(countryForSlug(slug), null, slug);
  for (const slug of ["uk", "canada", "-uk", "australia", "Hosting-UK", "hosting-uk/", "es/hosting-uk", ""]) {
    assert.equal(countryForSlug(slug), null, JSON.stringify(slug));
  }
  assert.equal(countryForSlug(null), null);
});

test("country is decided only for single-segment /p/<slug> paths", () => {
  assert.equal(countryForPath("/p/hosting-uk").code, "GB");
  assert.equal(countryForPath("/p/hosting-uk?utm_source=x").code, "GB");
  assert.equal(countryForPath("/p/es/hosting-uk"), null);
  assert.equal(countryForPath("/p/a/hosting-uk"), null);
  assert.equal(countryForPath("/hosting-uk"), null);
  assert.equal(countryForPath("/"), null);
});

test("canonicalUrlForPath: country page on its ccTLD, everything else on www, query dropped", () => {
  assert.equal(canonicalUrlForPath("/p/pool-maintenance-canada"), "https://poolrentalnearme.ca/p/pool-maintenance-canada");
  assert.equal(canonicalUrlForPath("/p/austin-tx"), `${WWW_ORIGIN}/p/austin-tx`);
  assert.equal(canonicalUrlForPath("/p/austin-tx?page=2"), `${WWW_ORIGIN}/p/austin-tx`);
  assert.equal(canonicalUrlForPath("/"), `${WWW_ORIGIN}/`);
  assert.equal(canonicalUrlForPath("p/hosting"), `${WWW_ORIGIN}/p/hosting`);
});

test("resolveCanonicalUrl: an override may change the path, never the host", () => {
  const p = "/p/about";
  assert.equal(resolveCanonicalUrl(p), `${WWW_ORIGIN}/p/about`);
  assert.equal(resolveCanonicalUrl(p, "  "), `${WWW_ORIGIN}/p/about`);
  assert.equal(resolveCanonicalUrl(p, `${WWW_ORIGIN}/p/about-our-company`), `${WWW_ORIGIN}/p/about-our-company`);
  assert.equal(resolveCanonicalUrl(p, "/p/about-our-company"), `${WWW_ORIGIN}/p/about-our-company`);
  assert.equal(resolveCanonicalUrl(p, `${WWW_ORIGIN}/p/about-our-company/`), `${WWW_ORIGIN}/p/about-our-company`);
  // wrong host for the path: ignored
  assert.equal(resolveCanonicalUrl(p, "https://poolrentalnearme.co.uk/p/about"), `${WWW_ORIGIN}/p/about`);
  assert.equal(resolveCanonicalUrl(p, "https://www.poolrentalnearme.co.uk/p/hosting-uk"), `${WWW_ORIGIN}/p/about`);
  assert.equal(resolveCanonicalUrl(p, "https://example.com/p/about"), `${WWW_ORIGIN}/p/about`);
  assert.equal(resolveCanonicalUrl(p, "not a url"), `${WWW_ORIGIN}/p/about`);
  assert.equal(resolveCanonicalUrl(p, "//evil.test/p/x"), `${WWW_ORIGIN}/p/about`);
  assert.equal(resolveCanonicalUrl(p, "javascript:alert(1)"), `${WWW_ORIGIN}/p/about`);
  // a country page cannot be pointed back at www or at another country
  const uk = "/p/hosting-uk";
  assert.equal(resolveCanonicalUrl(uk, `${WWW_ORIGIN}/p/hosting-uk`), "https://poolrentalnearme.co.uk/p/hosting-uk");
  assert.equal(resolveCanonicalUrl(uk, "https://poolrentalnearme.ca/p/hosting-uk"), "https://poolrentalnearme.co.uk/p/hosting-uk");
  // an override to another UK page on the UK host is honoured
  assert.equal(
    resolveCanonicalUrl(uk, "https://poolrentalnearme.co.uk/p/how-it-works-uk"),
    "https://poolrentalnearme.co.uk/p/how-it-works-uk",
  );
  assert.equal(resolveCanonicalUrl(uk, "/p/how-it-works-uk"), "https://poolrentalnearme.co.uk/p/how-it-works-uk");
});

test("resolveCanonicalUrl: an override never moves a page to another market, by any path", () => {
  // A US page pointed at a country page (another path), relative or absolute,
  // on the right ccTLD or not: stays on www at its own path.
  const us = "/p/pool-maintenance";
  const own = `${WWW_ORIGIN}${us}`;
  for (const o of [
    "/p/pool-maintenance-uk",
    "https://poolrentalnearme.co.uk/p/pool-maintenance-uk",
    "https://www.poolrentalnearme.co.uk/p/pool-maintenance-uk",
    "/p/rent-out-your-pool-toronto",
    "https://poolrentalnearme.ca/p/rent-out-your-pool-toronto",
    "https://poolrentalnearme.com.au/p/hosting-australia",
  ]) {
    assert.equal(resolveCanonicalUrl(us, o), own, o);
  }
  // A country page pointed at a US page or at another country's page.
  const uk = "/p/hosting-uk";
  const ukOwn = "https://poolrentalnearme.co.uk/p/hosting-uk";
  for (const o of ["/p/hosting", `${WWW_ORIGIN}/p/hosting`, "/p/hosting-canada", "https://poolrentalnearme.ca/p/hosting-canada"]) {
    assert.equal(resolveCanonicalUrl(uk, o), ukOwn, o);
  }
  // Same market, another path: honoured.
  assert.equal(resolveCanonicalUrl(us, "/p/pool-maintenance-guide"), `${WWW_ORIGIN}/p/pool-maintenance-guide`);
  // Every stored override still resolves to itself (none crosses a market).
  for (const r of rows.filter((x) => x.canonical_override)) {
    assert.equal(resolveCanonicalUrl(`/p/${r.slug}`, r.canonical_override), r.canonical_override, r.slug);
  }
});

test("hosts: both variants of each ccTLD map to their country; .com and others to none", () => {
  for (const s of COUNTRY_SITES) {
    for (const h of s.hosts) assert.equal(countryForHost(h), s);
    assert.equal(countryForHost(`${s.hosts[1].toUpperCase()}:443`), s);
    assert.equal(s.hosts[0], s.canonicalHost);
  }
  for (const h of ["www.poolrentalnearme.com", "poolrentalnearme.com", "localhost", "3.222.110.146", "", null]) {
    assert.equal(countryForHost(h), null, String(h));
  }
});

test("publicHostOf: X-Forwarded-Host, then Host, then the URL", () => {
  const req = (url, headers = {}) => new Request(url, { headers });
  assert.equal(
    publicHostOf(req("http://127.0.0.1/robots.txt", { "x-forwarded-host": "WWW.poolrentalnearme.co.uk", host: "127.0.0.1" })),
    "www.poolrentalnearme.co.uk",
  );
  assert.equal(publicHostOf(req("http://127.0.0.1/x", { "x-forwarded-host": "poolrentalnearme.ca, proxy.internal" })), "poolrentalnearme.ca");
  assert.equal(publicHostOf(req("http://poolrentalnearme.com.au:8080/x")), "poolrentalnearme.com.au");
});

test("robots: each ccTLD allows exactly its mapped pages, its sitemap and /fw-assets/", () => {
  for (const s of COUNTRY_SITES) {
    const body = countryRobotsTxt(s);
    assert.match(body, /^User-agent: \*\nDisallow: \/$/m);
    assert.match(body, new RegExp(`^Sitemap: https://${s.canonicalHost.replace(/\./g, "\\.")}/sitemap-country\\.xml$`, "m"));
    assert.ok(robotsAllows(body, "/sitemap-country.xml"), `${s.code} sitemap`);
    assert.ok(robotsAllows(body, "/fw-assets/index-3yfv84Ne.js"), `${s.code} assets`);
    for (const blocked of ["/", "/sitemap.xml", "/s", "/p/all-locations", "/p/austin-tx", "/p/hosting", "/sitemap-country.xml?x=1"]) {
      assert.equal(robotsAllows(body, blocked), false, `${s.code} ${blocked}`);
    }
    for (const r of rows) {
      const mine = countryForSlug(r.slug) === s;
      assert.equal(robotsAllows(body, `/p/${r.slug}`), mine, `${s.code} /p/${r.slug}`);
    }
    for (const slug of US_TRAPS) assert.equal(robotsAllows(body, `/p/${slug}`), false, `${s.code} ${slug}`);
    // what the pages need to render: the bundle, the logo and the favicons
    for (const asset of RENDER_ASSET_PATHS) assert.ok(robotsAllows(body, asset), `${s.code} ${asset}`);
    for (const other of ["/icon.svg.bak", "/favicon.ico/x", "/logo.png", "/llms.txt"]) {
      assert.equal(robotsAllows(body, other), false, `${s.code} ${other}`);
    }
  }
});

test("robots: every same-origin file the layout references is allowed on each ccTLD", () => {
  // The <head> links in __root.tsx and the header/footer logo in site-layout.tsx
  // are on every page, country pages included. A ccTLD that blocks them
  // renders its pages without a logo and gets no site favicon.
  const refs = new Set();
  for (const file of ["src/routes/__root.tsx", "src/components/site-layout.tsx"]) {
    const src = readFileSync(join(ROOT, file), "utf8");
    for (const m of src.matchAll(/\b(?:href|src)\s*[:=]\s*\{?\s*["'](\/[^"'/][^"']*\.(?:svg|png|ico|jpe?g|webp|webmanifest|css|js))["']/g)) {
      refs.add(m[1]);
    }
  }
  assert.ok(refs.has("/icon.svg") && refs.has("/favicon.ico"), [...refs].join(" "));
  for (const s of COUNTRY_SITES) {
    const body = countryRobotsTxt(s);
    for (const ref of refs) assert.ok(robotsAllows(body, ref), `${s.code} ${ref}`);
  }
});

test("Little Canada, MN never maps to Canada; real -canada pages still do", () => {
  assert.equal(countryForSlug("hosting-canada")?.code, "CA");
  assert.equal(countryForSlug("rent-out-your-pool-canada")?.code, "CA");
  assert.equal(countryForPath("/p/become-a-swimming-pool-host-little-canada"), null);
  assert.equal(canonicalUrlForPath("/p/little-canada"), `${WWW_ORIGIN}/p/little-canada`);
  const ca = countryRobotsTxt(site("CA"));
  assert.ok(robotsAllows(ca, "/p/hosting-canada"));
  assert.equal(robotsAllows(ca, "/p/little-canada"), false);
  assert.equal(robotsAllows(ca, "/p/swim-instructor-pool-rental-little-canada"), false);
});

test("robots: the 7 canonical targets that used to be robots-blocked are now crawlable", () => {
  const seven = {
    "pool-rental-london": "GB",
    "pool-rental-manchester": "GB",
    "uk-cities-with-pools": "GB",
    "pool-rental-melbourne": "AU",
    "pool-rental-sydney": "AU",
    "pool-rental-toronto": "CA",
    "pool-rental-vancouver": "CA",
  };
  for (const [slug, code] of Object.entries(seven)) {
    assert.ok(robotsAllows(countryRobotsTxt(site(code)), `/p/${slug}`), slug);
  }
});

test("robots patterns and the PostgREST filter come from the same lists", () => {
  for (const s of COUNTRY_SITES) {
    assert.equal(robotsAllowPatterns(s).length, s.slugSuffixes.length + s.exactSlugs.length);
    const parts = slugOrFilter(s).split(",");
    assert.equal(parts.length, s.slugSuffixes.length + s.exactSlugs.length);
    for (const p of parts) assert.match(p, /^slug\.(like\.\*-[a-z-]+|eq\.[a-z0-9-]+)$/);
  }
});

test("hreflang: only localised versions of one article; none for pages without a defined equivalent", () => {
  const groupOf = (slug) => rows.find((r) => r.slug === slug).hreflang_group;
  const siblings = (slug) => rows.filter((r) => r.hreflang_group === groupOf(slug) && r.slug !== slug).map((r) => r.slug);

  assert.deepEqual(countryHreflangAlternates("pool-maintenance-uk", siblings("pool-maintenance-uk")), [
    { lang: "en-GB", href: "https://poolrentalnearme.co.uk/p/pool-maintenance-uk" },
    { lang: "en-CA", href: "https://poolrentalnearme.ca/p/pool-maintenance-canada" },
    { lang: "en-AU", href: "https://poolrentalnearme.com.au/p/pool-maintenance-australia" },
  ]);
  // same set from every member: reciprocal
  for (const s of ["pool-maintenance-canada", "pool-maintenance-australia"]) {
    assert.deepEqual(
      countryHreflangAlternates(s, siblings(s)),
      countryHreflangAlternates("pool-maintenance-uk", siblings("pool-maintenance-uk")),
    );
  }
  // UK + AU share a base; the Canadian page in the group is a different article
  assert.deepEqual(
    countryHreflangAlternates("pool-hire-tax-deductions-uk", siblings("pool-hire-tax-deductions-uk")).map((h) => h.lang),
    ["en-GB", "en-AU"],
  );
  assert.equal(countryHreflangAlternates("pool-rental-tax-write-offs-canada", siblings("pool-rental-tax-write-offs-canada")), undefined);
  // London was grouped with Toronto and Sydney under "new-york-ny": not equivalents
  assert.equal(countryHreflangAlternates("pool-rental-london", siblings("pool-rental-london")), undefined);
  assert.equal(countryHreflangAlternates("uk-cities-with-pools", siblings("uk-cities-with-pools")), undefined);
  assert.equal(countryHreflangAlternates("rent-out-your-pool-uk", []), undefined);
  assert.equal(countryHreflangAlternates("hosting-uk", []), undefined, "a lone page gets no self-only set");
  assert.equal(countryHreflangAlternates("austin-tx", ["hosting-uk"]), undefined);
});

test("hreflang across the snapshot: every href is a canonical URL on its own country's host", () => {
  let pages = 0;
  for (const r of rows.filter((x) => x.hreflang_group)) {
    const sib = rows.filter((x) => x.hreflang_group === r.hreflang_group && x.slug !== r.slug).map((x) => x.slug);
    const alts = countryHreflangAlternates(r.slug, sib);
    if (!alts) continue;
    pages++;
    assert.ok(alts.some((a) => a.href === canonicalUrlForPath(`/p/${r.slug}`)), `${r.slug} includes itself`);
    for (const a of alts) {
      const slug = new URL(a.href).pathname.slice(3);
      assert.equal(countryForSlug(slug).hreflang, a.lang, a.href);
      assert.equal(a.href, canonicalUrlForPath(`/p/${slug}`));
    }
  }
  assert.equal(pages, 50, "pages with alternates");
});
