// A content_pages row with url_path NULL (integration trial 2026-11-16).
//
// Production has url_path NULL on 50 of the 59 pages in the three ccTLD
// sitemap-country.xml files. On a115fd5 every such page rendered a blank 200:
// templates pass page.url_path as the page's own breadcrumb, the breadcrumb
// JSON-LD calls structuredDataUrl(path) -> canonicalOriginForPath(path) ->
// countryForPath(path) -> contentSlugOfPath(path), and `null.split` threw.
//
// Imported as a namespace so this file also runs (and fails, rather than not
// loading) against a build that lacks contentPagePath.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as cs from "../src/lib/country-sites.ts";

const WWW = "https://www.poolrentalnearme.com";
const MISSING = [null, undefined, "", "   "];

test("every path-taking function in country-sites.ts accepts null, undefined and empty", () => {
  for (const p of MISSING) {
    assert.doesNotThrow(() => cs.countryForPath(p), `countryForPath(${JSON.stringify(p)})`);
    assert.equal(cs.countryForPath(p), null);
    assert.doesNotThrow(() => cs.canonicalOriginForPath(p), `canonicalOriginForPath(${JSON.stringify(p)})`);
    assert.equal(cs.canonicalOriginForPath(p), WWW);
    assert.doesNotThrow(() => cs.canonicalUrlForPath(p), `canonicalUrlForPath(${JSON.stringify(p)})`);
    assert.equal(cs.canonicalUrlForPath(p), `${WWW}/`);
    assert.doesNotThrow(() => cs.resolveCanonicalUrl(p, null), `resolveCanonicalUrl(${JSON.stringify(p)})`);
    assert.equal(cs.resolveCanonicalUrl(p, null), `${WWW}/`);
    assert.equal(cs.countryForSlug(p), null);
    // Never a URL ending in "null" / "undefined".
    assert.doesNotMatch(cs.canonicalUrlForPath(p), /null|undefined/);
  }
});

test("contentPagePath: url_path when set, else /p/<slug>", () => {
  assert.equal(typeof cs.contentPagePath, "function", "contentPagePath is exported");
  assert.equal(cs.contentPagePath({ url_path: "/p/stored-path", slug: "x" }), "/p/stored-path");
  for (const url_path of [null, undefined, "", "  "]) {
    assert.equal(cs.contentPagePath({ url_path, slug: "pool-rental-london" }), "/p/pool-rental-london");
  }
  assert.equal(cs.contentPagePath({ url_path: null, slug: "es/fixture-pagina" }), "/p/es/fixture-pagina");
  assert.equal(cs.contentPagePath({ url_path: null, slug: null }), "");
  assert.equal(cs.contentPagePath(null), "");
});

test("a NULL-url_path page's own URL is /p/<slug> on its mapped host (each ccTLD and a US page)", () => {
  const cases = [
    ["pool-rental-london", "https://poolrentalnearme.co.uk"],
    ["fixture-maintenance-uk", "https://poolrentalnearme.co.uk"],
    ["pool-rental-toronto", "https://poolrentalnearme.ca"],
    ["fixture-maintenance-canada", "https://poolrentalnearme.ca"],
    ["pool-rental-sydney", "https://poolrentalnearme.com.au"],
    ["fixture-maintenance-australia", "https://poolrentalnearme.com.au"],
    ["fixture-null-path-us", WWW],
    ["become-a-swimming-pool-host-little-canada", WWW],
  ];
  for (const [slug, origin] of cases) {
    const path = cs.contentPagePath({ url_path: null, slug });
    assert.equal(cs.canonicalUrlForPath(path), `${origin}/p/${slug}`, slug);
    assert.equal(`${cs.canonicalOriginForPath(path)}${path}`, `${origin}/p/${slug}`, slug);
    assert.equal(cs.resolveCanonicalUrl(path, `${origin}/p/${slug}`), `${origin}/p/${slug}`, slug);
  }
});
