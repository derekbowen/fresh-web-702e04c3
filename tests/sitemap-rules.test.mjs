// Unit tests for every sitemap exclusion rule (src/lib/sitemap-rules.ts), the
// group definitions (src/lib/sitemap-groups.ts), the static path list and the
// paged loaders (src/lib/sitemap-sources.ts).
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEDICATED_P_ROUTE_SLUGS,
  isDedicatedRouteSlug,
  isServableSlug,
  canonicalIsElsewhere,
  contentRowExclusion,
  contentRowLoc,
  redirectShadowedSlugs,
  blogPostExclusion,
  listingExclusion,
  NON_PUBLIC_LISTING_IDS,
  dedupeByLoc,
  pageParam,
  pageSlice,
  pageCount,
} from "../src/lib/sitemap-rules.ts";
import {
  CONTENT_SITEMAP_GROUPS,
  contentGroup,
  groupOrFilter,
  rowInGroup,
} from "../src/lib/sitemap-groups.ts";
import { STATIC_URLS } from "../src/lib/sitemap-static-paths.ts";
import {
  readAllRows,
  loadBlogEntries,
  loadListingEntries,
  loadComparisonEntries,
  loadContentGroupEntries,
  latestLastmod,
} from "../src/lib/sitemap-sources.ts";

before(() => {
  console.error = () => {};
});

const SITE = "https://www.poolrentalnearme.com";
const ROUTES = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "routes");
const ctx = (over = {}) => ({ siteUrl: SITE, redirectShadowedSlugs: new Set(), ...over });

// ───────────────────────────── slugs and URLs ───────────────────────────────

test("isServableSlug: underscore and upper case redirect at the edge / in p.$slug", () => {
  assert.equal(isServableSlug("pool-rental-guarantees"), true);
  assert.equal(isServableSlug("es/texas-leyes-alquiler-albercas"), true);
  assert.equal(isServableSlug("ultimate_pool_party_music_and_sound_system_guide"), false);
  assert.equal(isServableSlug("Austin-TX"), false);
  assert.equal(isServableSlug(""), false);
  assert.equal(isServableSlug(null), false);
  assert.equal(isServableSlug("has space"), false);
});

test("canonicalIsElsewhere: a ccTLD override is elsewhere; self, blank and trailing slash are not", () => {
  const loc = `${SITE}/p/hosting-uk`;
  assert.equal(canonicalIsElsewhere("https://poolrentalnearme.co.uk/p/hosting-uk", loc), true);
  assert.equal(canonicalIsElsewhere("https://www.poolrentalnearme.co.uk/p/hosting-uk", loc), true);
  assert.equal(canonicalIsElsewhere(`${SITE}/p/other-page`, loc), true);
  assert.equal(canonicalIsElsewhere(null, loc), false);
  assert.equal(canonicalIsElsewhere("", loc), false);
  assert.equal(canonicalIsElsewhere("   ", loc), false);
  assert.equal(canonicalIsElsewhere(`${SITE}/p/hosting-uk`, loc), false);
  assert.equal(canonicalIsElsewhere(`${SITE}/p/hosting-uk/`, loc), false);
  assert.equal(canonicalIsElsewhere("https://WWW.poolrentalnearme.com/p/hosting-uk", loc), false);
  assert.equal(canonicalIsElsewhere("/p/hosting-uk", loc), false, "relative = same origin");
  assert.equal(canonicalIsElsewhere("not a url", loc), true, "unparsable: not provably self");
});

test("contentRowLoc: only /p/<slug>; a different url_path is not listed", () => {
  assert.equal(contentRowLoc({ slug: "a", url_path: null }, SITE), `${SITE}/p/a`);
  assert.equal(contentRowLoc({ slug: "a", url_path: "/p/a" }, SITE), `${SITE}/p/a`);
  assert.equal(contentRowLoc({ slug: "es/x", url_path: "/p/es/x" }, SITE), `${SITE}/p/es/x`);
  assert.equal(contentRowLoc({ slug: "b", url_path: "/p/a/b" }, SITE), null);
  assert.equal(
    contentRowLoc({ slug: "learning-academy", url_path: "/learning-academy" }, SITE),
    null,
  );
  assert.equal(contentRowLoc({ slug: null, url_path: "/p/x" }, SITE), null);
});

// ───────────────────────────── content rows ─────────────────────────────────

test("contentRowExclusion: one reason per rule, in a fixed order", () => {
  const cases = [
    [{ slug: null }, "no_slug"],
    [{ slug: "ultimate_pool_party_music_and_sound_system_guide" }, "slug_redirects"],
    [{ slug: "b", url_path: "/p/a/b" }, "url_path_mismatch"],
    [{ slug: "pool-pros", url_path: "/p/pool-pros" }, "dedicated_route"],
    [{ slug: "all-locations" }, "dedicated_route"],
    [{ slug: "swimply-alternative-vs-pool-rental-near-me" }, "dedicated_route"],
    [{ slug: "giggster-vs-pool-rental-near-me-in-akron" }, "dedicated_route"],
    [{ slug: "pool-rentals-ohio" }, "dedicated_route"],
    [
      { slug: "hosting-uk", canonical_override: "https://poolrentalnearme.co.uk/p/hosting-uk" },
      "canonical_elsewhere",
    ],
    [{ slug: "about" }, null],
    [{ slug: "about", canonical_override: `${SITE}/p/about` }, null],
  ];
  for (const [row, want] of cases)
    assert.equal(contentRowExclusion(row, ctx()), want, JSON.stringify(row));
  assert.equal(
    contentRowExclusion({ slug: "x" }, ctx({ redirectShadowedSlugs: new Set(["x"]) })),
    "shadowed_by_redirect_row",
  );
  assert.equal(
    contentRowExclusion({ slug: "x", body_markdown: "short" }, ctx({ minBodyChars: 800 })),
    "thin_body",
  );
  assert.equal(
    contentRowExclusion({ slug: "x", body_markdown: "y".repeat(800) }, ctx({ minBodyChars: 800 })),
    null,
  );
});

test("redirectShadowedSlugs: only redirect rows at /p/<slug> with a target", () => {
  const s = redirectShadowedSlugs([
    { slug: "a", url_path: "/p/a", redirect_to: "b", status: "redirect" },
    { slug: "c", url_path: "/p/x/c", redirect_to: "b", status: "redirect" },
    { slug: "d", url_path: "/p/d", redirect_to: "  ", status: "redirect" },
    { slug: "e", url_path: "/p/e", redirect_to: "b", status: "published" },
  ]);
  assert.deepEqual([...s], ["a"]);
});

// ───────────────────────────── dedicated routes ─────────────────────────────

test("DEDICATED_P_ROUTE_SLUGS equals the static src/routes/p.<name> files", () => {
  const fromFiles = readdirSync(ROUTES)
    .filter((f) => /^p\.[^$]*\.tsx?$/.test(f) && !f.includes("{") && !f.includes("$"))
    .map((f) =>
      f
        .replace(/^p\./, "")
        .replace(/\.tsx?$/, "")
        .replace(/\./g, "/"),
    )
    .sort();
  assert.deepEqual([...DEDICATED_P_ROUTE_SLUGS].sort(), fromFiles);
});

test("every dynamic /p/ route file is covered by a dedicated prefix (except the dispatcher and es/)", () => {
  const dynamic = readdirSync(ROUTES).filter(
    (f) => /^p\..*\.tsx?$/.test(f) && (f.includes("$") || f.includes("{")),
  );
  const handled = {
    "p.$.tsx": "splat (301s to the last segment)",
    "p.$slug.tsx": "the content dispatcher",
    "p.es.$slug.tsx": "Spanish content rows (owned by the spanish group)",
  };
  for (const f of dynamic) {
    if (handled[f]) continue;
    // p.pool-pros.$slug.tsx -> pool-pros/x ; p.giggster-...-in-{$city}.tsx -> giggster-...-in-x
    const sample = f
      .replace(/^p\./, "")
      .replace(/\.tsx?$/, "")
      .replace(/\{\$[a-z]+\}/g, "x")
      .replace(/\$[a-z]+/g, "x")
      .replace(/\./g, "/");
    assert.ok(isDedicatedRouteSlug(sample), `${f} (${sample}) is not covered`);
  }
});

// ───────────────────────────── static sitemap ───────────────────────────────

test("STATIC_URLS: unique; every /p/ entry is a dedicated route (content rows belong to their group)", () => {
  const paths = STATIC_URLS.map((e) => e.path);
  assert.equal(new Set(paths).size, paths.length, "duplicate path in STATIC_URLS");
  for (const p of paths.filter((x) => x.startsWith("/p/"))) {
    assert.ok(DEDICATED_P_ROUTE_SLUGS.includes(p.slice(3)), `${p} is served by the dispatcher`);
  }
  // Removed because a content row (and its group sitemap) owns them.
  for (const gone of [
    "/p/about",
    "/p/become-a-host",
    "/p/privacy-policy",
    "/p/host-training-academy",
  ]) {
    assert.ok(!paths.includes(gone), gone);
  }
  // Noindex, forms, or pages with a known fee error stay out.
  for (const out of [
    "/p/pool-pros",
    "/p/privacy-request",
    "/p/affiliate-program",
    "/p/affiliate",
  ]) {
    assert.ok(!paths.includes(out), out);
  }
  assert.ok(paths.includes("/s"), "bare /s (audit section 8)");
});

// ───────────────────────────── groups ───────────────────────────────────────

test("groups: no template type is in two groups; untyped slugs are owned once", () => {
  const seen = new Map();
  for (const g of CONTENT_SITEMAP_GROUPS) {
    for (const t of g.templateTypes) {
      assert.ok(!seen.has(t), `${t} in ${seen.get(t)} and ${g.basePath}`);
      seen.set(t, g.basePath);
    }
  }
  const owners = (row) =>
    CONTENT_SITEMAP_GROUPS.filter((g) => rowInGroup(row, g)).map((g) => g.basePath);
  assert.deepEqual(owners({ template_type: null, slug: "elearning-academy-x" }), [
    "/sitemap-pages-academy.xml",
  ]);
  assert.deepEqual(owners({ template_type: null, slug: "pool-host-tools" }), [
    "/sitemap-pages-articles.xml",
  ]);
  assert.deepEqual(
    owners({ template_type: null, slug: "billings-mt" }),
    [],
    "unreviewed untyped: no sitemap",
  );
  assert.deepEqual(owners({ template_type: "resource", slug: "elearning-academy-x" }), [
    "/sitemap-pages-articles.xml",
  ]);
  assert.deepEqual(owners({ template_type: "resource_article", slug: "x" }), [
    "/sitemap-pages-articles.xml",
  ]);
});

test("groupOrFilter: PostgREST or-tree that matches rowInGroup", () => {
  assert.equal(
    groupOrFilter(contentGroup("/sitemap-pages-money.xml")),
    "template_type.in.(money_page)",
  );
  assert.equal(
    groupOrFilter(contentGroup("/sitemap-pages-academy.xml")),
    "template_type.in.(elearning),and(template_type.is.null,slug.in.(academy-catalog)),and(template_type.is.null,slug.like.elearning-academy-*)",
  );
  assert.match(groupOrFilter(contentGroup("/sitemap-pages-articles.xml")), /resource_article/);
  assert.throws(() => contentGroup("/nope.xml"));
});

// ───────────────────────────── blog ─────────────────────────────────────────

test("blogPostExclusion: a post the dispatcher serves from content_pages is not a blog URL", () => {
  const served = new Set([
    "opening-pool-for-summer",
    "above-ground-pools-the-best-choices-for-summer",
  ]);
  assert.equal(
    blogPostExclusion({ slug: "opening-pool-for-summer" }, served),
    "served_by_content_page",
  );
  assert.equal(
    blogPostExclusion({ slug: "above-ground-pools-the-best-choices-for-summer" }, served),
    "served_by_content_page",
  );
  assert.equal(blogPostExclusion({ slug: "fresh-post" }, served), null);
  assert.equal(blogPostExclusion({ slug: "a_b" }, served), "slug_redirects");
  assert.equal(blogPostExclusion({ slug: "blog" }, served), "dedicated_route");
  assert.equal(blogPostExclusion({ slug: null }, served), "no_slug");
});

// ───────────────────────────── listings ─────────────────────────────────────

test("listingExclusion: the configuration listing by id, by title marker and by slug", () => {
  assert.equal(NON_PUBLIC_LISTING_IDS.length, 1);
  const id = NON_PUBLIC_LISTING_IDS[0];
  assert.equal(
    listingExclusion({
      slug: "config-listing-do-not-delete",
      sharetribe_id: id,
      title: "CONFIG LISTING - DO NOT DELETE",
    }),
    "non_public_listing",
  );
  assert.equal(
    listingExclusion({ slug: "renamed", sharetribe_id: id, title: "Renamed" }),
    "non_public_listing",
  );
  assert.equal(
    listingExclusion({
      slug: "x",
      sharetribe_id: "00000000-0000-4000-8000-000000000000",
      title: "Second config listing",
    }),
    "non_public_listing",
  );
  assert.equal(
    listingExclusion({
      slug: "x",
      sharetribe_id: "00000000-0000-4000-8000-000000000000",
      title: "Do not delete!",
    }),
    "non_public_listing",
  );
  assert.equal(
    listingExclusion({
      slug: "backyard-oasis",
      sharetribe_id: "00000000-0000-4000-8000-000000000001",
      title: "Backyard Oasis",
    }),
    null,
  );
  assert.equal(
    listingExclusion({
      slug: "configured-pool",
      sharetribe_id: "00000000-0000-4000-8000-000000000002",
      title: "Configured pool",
    }),
    null,
  );
  assert.equal(listingExclusion({ slug: null, sharetribe_id: id }), "incomplete");
});

// ───────────────────────────── small helpers ────────────────────────────────

test("dedupeByLoc, pageParam, pageSlice, pageCount, latestLastmod", () => {
  assert.deepEqual(
    dedupeByLoc([{ loc: "a" }, { loc: "b" }, { loc: "a" }]).map((e) => e.loc),
    ["a", "b"],
  );
  assert.equal(pageParam(new URL("http://x/?page=3")), 3);
  for (const v of ["0", "-1", "abc", "1.7"])
    assert.equal(pageParam(new URL(`http://x/?page=${v}`)), 1, v);
  assert.equal(pageParam(new URL("http://x/")), 1);
  assert.deepEqual(pageSlice([1, 2, 3, 4, 5], 2, 2), [3, 4]);
  assert.equal(pageCount(0, 1000), 0);
  assert.equal(pageCount(1000, 1000), 1);
  assert.equal(pageCount(1001, 1000), 2);
  assert.equal(
    latestLastmod([
      { loc: "a", lastmod: "2026-01-01T00:00:00Z" },
      { loc: "b", lastmod: "2026-03-01T00:00:00Z" },
      { loc: "c" },
    ]),
    "2026-03-01T00:00:00.000Z",
  );
  assert.equal(latestLastmod([{ loc: "a" }]), undefined);
});

// ───────────────────────────── loaders (fake client) ────────────────────────

/**
 * Fake supabase-js: `tables[table](query)` returns the rows that query should
 * see (before paging); `.range(a, b)` is applied here, capped at `cap` rows per
 * answer like PostgREST max-rows.
 */
function fakeDb(tables, { cap = 1000, fail } = {}) {
  const queries = [];
  return {
    queries,
    from(table) {
      const q = { table, calls: [] };
      queries.push(q);
      const b = {
        then(ok, err) {
          return Promise.resolve()
            .then(() => {
              if (fail?.(q)) return { data: null, error: { message: "stub failure" } };
              const all = (tables[table] ?? (() => []))(q);
              const r = q.calls.find((c) => c[0] === "range");
              const from = r ? r[1] : 0;
              const to = r ? r[2] : all.length - 1;
              return { data: all.slice(from, Math.min(to + 1, from + cap)), error: null };
            })
            .then(ok, err);
        },
      };
      for (const m of [
        "select",
        "in",
        "eq",
        "is",
        "not",
        "or",
        "overlaps",
        "order",
        "range",
        "limit",
        "like",
        "abortSignal",
      ]) {
        b[m] = (...a) => {
          q.calls.push([m, ...a]);
          return b;
        };
      }
      return b;
    },
  };
}
const has = (q, m, col) => q.calls.some((c) => c[0] === m && c[1] === col);

test("readAllRows: walks windows by rows returned, stops on an empty one, fails on any failed window", async () => {
  const rows = Array.from({ length: 2500 }, (_, i) => ({ i }));
  const db = fakeDb({ t: () => rows }, { cap: 700 });
  const r = await readAllRows("t", (from, to, signal) =>
    db.from("t").select("*").range(from, to).abortSignal(signal),
  );
  assert.equal(r.ok, true);
  assert.equal(r.data.length, 2500);
  assert.deepEqual(r.data.slice(-1), [{ i: 2499 }]);
  const bad = fakeDb(
    { t: () => rows },
    { fail: (q) => q.calls.find((c) => c[0] === "range")[1] >= 1000 },
  );
  const f = await readAllRows("t", (from, to, signal) =>
    bad.from("t").select("*").range(from, to).abortSignal(signal),
  );
  assert.equal(f.ok, false);
});

test("loadComparisonEntries: more than 1,000 published cities -> every city, minus redirected pages", async () => {
  const cities = Array.from({ length: 1234 }, (_, i) => ({
    slug: `city-${String(i).padStart(4, "0")}`,
    updated_at: "2026-07-06T00:00:00Z",
  }));
  const db = fakeDb({
    cities: () => cities,
    content_pages: () => [
      { slug: "giggster-vs-pool-rental-near-me-in-city-0001" },
      { slug: "peerspace-vs-pool-rental-near-me-in-city-1200" },
    ],
  });
  const r = await loadComparisonEntries(db, SITE, new Date("2026-11-15T00:00:00Z"));
  assert.equal(r.ok, true);
  assert.equal(r.data.length, 3 + 2 * 1234 - 2);
  const locs = new Set(r.data.map((e) => e.loc));
  assert.ok(
    locs.has(`${SITE}/p/peerspace-vs-pool-rental-near-me-in-city-1233`),
    "a city past the first 1,000",
  );
  assert.ok(!locs.has(`${SITE}/p/giggster-vs-pool-rental-near-me-in-city-0001`));
  assert.ok(locs.has(`${SITE}/p/peerspace-vs-pool-rental-near-me-in-city-0001`));
  const cityReads = db.queries.filter((q) => q.table === "cities");
  assert.equal(cityReads.length, 3, "windows 0, 1000, 1234 (empty)");
  assert.ok(
    cityReads.every((q) => !q.calls.some((c) => c[0] === "limit")),
    "no .limit(): it never lifted the cap",
  );
  assert.ok(has(cityReads[0], "eq", "is_published"));
});

test("loadComparisonEntries: a failed redirect read or cities window fails the list", async () => {
  const cities = Array.from({ length: 1500 }, (_, i) => ({ slug: `c${i}` }));
  for (const fail of [
    (q) => q.table === "content_pages",
    (q) => q.table === "cities" && q.calls.find((c) => c[0] === "range")[1] === 1000,
  ]) {
    const r = await loadComparisonEntries(
      fakeDb({ cities: () => cities, content_pages: () => [] }, { fail }),
      SITE,
    );
    assert.equal(r.ok, false);
  }
});

test("loadBlogEntries: drops posts served by a content row or a legacy_slugs alias", async () => {
  const posts = [
    {
      slug: "fresh-post",
      updated_at: "2026-10-17T00:00:00Z",
      cover_image_url: "https://img/x.jpg",
      title: "Fresh",
    },
    { slug: "above-ground-pools-the-best-choices-for-summer", updated_at: "2026-07-16T00:00:00Z" },
    { slug: "opening-pool-for-summer", updated_at: "2026-07-16T00:00:00Z" },
  ];
  const db = fakeDb({
    blog_posts: () => posts,
    content_pages: (q) => {
      if (has(q, "overlaps", "legacy_slugs")) {
        return [{ legacy_slugs: ["how-to-open-a-pool", "opening-pool-for-summer"] }];
      }
      if (has(q, "in", "slug")) return [{ slug: "above-ground-pools-the-best-choices-for-summer" }];
      return [];
    },
  });
  const r = await loadBlogEntries(db, SITE);
  assert.equal(r.ok, true);
  assert.deepEqual(
    r.data.map((e) => e.loc),
    [`${SITE}/p/fresh-post`],
  );
  const alias = db.queries.find((q) => has(q, "overlaps", "legacy_slugs"));
  assert.match(
    alias.calls.find((c) => c[0] === "overlaps")[2],
    /^\{"[^"]+"(,"[^"]+")*\}$/,
    "quoted array literal",
  );
  const statuses = alias.calls.find((c) => c[0] === "in" && c[1] === "status")[2];
  assert.deepEqual(statuses, ["published", "redirect"]);
});

test("loadBlogEntries: the shadow lookup failing fails the list (503), it never lists everything", async () => {
  const db = fakeDb(
    { blog_posts: () => [{ slug: "a" }], content_pages: () => [] },
    { fail: (q) => q.table === "content_pages" },
  );
  assert.equal((await loadBlogEntries(db, SITE)).ok, false);
});

test("loadListingEntries: the configuration listing is not listed", async () => {
  const db = fakeDb({
    synced_listings: () => [
      {
        slug: "backyard-oasis",
        sharetribe_id: "00000000-0000-4000-8000-0000000000aa",
        title: "Backyard Oasis",
        updated_at: "2026-09-25T05:05:03Z",
      },
      {
        slug: "config-listing-do-not-delete",
        sharetribe_id: NON_PUBLIC_LISTING_IDS[0],
        title: "CONFIG LISTING - DO NOT DELETE",
      },
    ],
  });
  const r = await loadListingEntries(db, SITE);
  assert.deepEqual(
    r.data.map((e) => e.loc),
    [`${SITE}/l/backyard-oasis/00000000-0000-4000-8000-0000000000aa`],
  );
});

test("loadContentGroupEntries: reviewed untyped academy rows are read through the or-tree", async () => {
  const db = fakeDb({
    content_pages: (q) =>
      has(q, "eq", "status") && q.calls.some((c) => c[0] === "eq" && c[2] === "redirect")
        ? []
        : [
            {
              slug: "elearning-academy-a",
              url_path: "/p/elearning-academy-a",
              body_markdown: "x".repeat(900),
            },
            {
              slug: "host-training-academy",
              url_path: "/p/host-training-academy",
              body_markdown: "x".repeat(900),
            },
          ],
  });
  const r = await loadContentGroupEntries(contentGroup("/sitemap-pages-academy.xml"), db, SITE);
  assert.equal(r.ok, true);
  assert.equal(r.data.length, 2);
  const main = db.queries.find((q) => q.calls.some((c) => c[0] === "or"));
  assert.match(
    main.calls.find((c) => c[0] === "or")[1],
    /and\(template_type\.is\.null,slug\.like\.elearning-academy-\*\)/,
  );
  assert.deepEqual(
    main.calls.filter((c) => c[0] === "order").map((c) => c[1]),
    ["slug", "id"],
    "stable order",
  );
});
