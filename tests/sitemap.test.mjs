// Unit tests for the shared sub-sitemap builder (src/lib/sitemap.ts) with a
// fake Supabase client: a failed read is a 503, never a 200 with an empty
// <urlset>; a group is read in full (paged) and ?page=N is cut from the final
// list.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import {
  buildContentPagesSitemap,
  sitemapUnavailableResponse,
  sitemapGoneResponse,
  sitemapResponse,
  buildUrlsetXml,
} from "../src/lib/sitemap.ts";

before(() => {
  console.error = () => {};
});

const SITE = "https://www.example.test";

/**
 * Stand-in for the supabase-js query builder. Each `from()` starts a query
 * whose calls are recorded; awaiting it asks `resolve(query)` for
 * `{ data, error }` (or runs it, so it may throw or hang). When `data` is an
 * array and the query called `.range(a, b)`, only that window is returned, so
 * paged reads terminate the way they do against PostgREST.
 */
const METHODS = [
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
];
function fakeClient(resolve) {
  const queries = [];
  return {
    queries,
    get calls() {
      return queries.flatMap((q) => [["from", q.table], ...q.calls]);
    },
    from(table) {
      const q = { table, calls: [] };
      queries.push(q);
      const builder = {
        then(onOk, onErr) {
          return Promise.resolve()
            .then(() => (typeof resolve === "function" ? resolve(q) : resolve))
            .then((res) => {
              const range = q.calls.find((c) => c[0] === "range");
              if (res && Array.isArray(res.data) && range) {
                return { ...res, data: res.data.slice(range[1], range[2] + 1) };
              }
              return res;
            })
            .then(onOk, onErr);
        },
      };
      for (const m of METHODS) {
        builder[m] = (...args) => {
          q.calls.push([m, ...args]);
          return builder;
        };
      }
      return builder;
    },
  };
}
const isRedirectRowRead = (q) =>
  q.calls.some((c) => c[0] === "eq" && c[1] === "status" && c[2] === "redirect");
/** Group rows for the main read, nothing for the redirect-row read. */
const groupRows = (rows) => (q) =>
  isRedirectRowRead(q) ? { data: [], error: null } : { data: rows, error: null };

const rows = [
  {
    slug: "become-a-swimming-pool-host-akron-oh",
    url_path: "/p/become-a-swimming-pool-host-akron-oh",
    status: "published",
    content_refreshed_at: "2026-08-01T00:00:00Z",
    created_at: "2026-05-01T00:00:00Z",
    hero_image_url: "https://img.example.test/akron.jpg",
  },
  {
    slug: "become-a-swimming-pool-host-boise-id",
    url_path: null,
    status: "published",
    content_refreshed_at: null,
    created_at: "2026-05-02T00:00:00Z",
    hero_image_url: null,
  },
  {
    slug: "legacy-outside-prefix",
    url_path: "/academy/legacy",
    status: "published",
    content_refreshed_at: null,
    created_at: null,
    hero_image_url: null,
  },
];

const req = (path = "/sitemap-pages-host-acquisition.xml") =>
  new Request(`http://localhost${path}`);
const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

function assertUnavailable(res, body) {
  assert.equal(res.status, 503);
  assert.equal(res.headers.get("cache-control"), "no-store");
  assert.equal(res.headers.get("retry-after"), "120");
  assert.doesNotMatch(body, /<urlset/);
  assert.doesNotMatch(body, /<loc>/);
}

test("success: 200 with the page URLs, cacheable, rows outside /p/<slug> dropped", async () => {
  const client = fakeClient(groupRows(rows));
  const res = await buildContentPagesSitemap(
    req(),
    ["host_acq_city", "host_acq_hub"],
    "/p",
    client,
    SITE,
  );
  const xml = await res.text();
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /application\/xml/);
  assert.match(res.headers.get("cache-control"), /max-age=300/);
  assert.deepEqual(locs(xml), [
    `${SITE}/p/become-a-swimming-pool-host-akron-oh`,
    `${SITE}/p/become-a-swimming-pool-host-boise-id`,
  ]);
  assert.match(xml, /<image:loc>https:\/\/img\.example\.test\/akron\.jpg<\/image:loc>/);
  assert.match(xml, /<lastmod>2026-08-01T00:00:00\.000Z<\/lastmod>/);
  const main = client.queries.find((q) => !isRedirectRowRead(q));
  assert.equal(main.table, "content_pages");
  const or = main.calls.find((c) => c[0] === "or");
  assert.equal(or[1], "template_type.in.(host_acq_city,host_acq_hub)");
  for (const [m, col, val] of [
    ["eq", "in_sitemap", true],
    ["eq", "status", "published"],
    ["is", "redirect_to", null],
  ]) {
    assert.ok(
      main.calls.some((c) => c[0] === m && c[1] === col && c[2] === val),
      `${m} ${col}`,
    );
  }
});

test("paging: a group of 2,345 rows is read in 1,000-row windows until an empty one", async () => {
  const many = Array.from({ length: 2345 }, (_, i) => ({
    slug: `become-a-swimming-pool-host-town-${String(i).padStart(4, "0")}-oh`,
    url_path: null,
    created_at: "2026-05-01T00:00:00Z",
  }));
  const client = fakeClient(groupRows(many));
  const res = await buildContentPagesSitemap(req(), ["host_acq_city"], "/p", client, SITE);
  assert.equal(locs(await res.text()).length, 1000, "page 1 holds the first 1,000");
  const windows = client.queries
    .filter((q) => !isRedirectRowRead(q))
    .map((q) => q.calls.find((c) => c[0] === "range").slice(1));
  assert.deepEqual(windows, [
    [0, 999],
    [1000, 1999],
    [2000, 2999],
    [2345, 3344],
  ]);
});

test("paging: ?page=3 is entries 2,001-2,345 of the final list; ?page=4 is empty", async () => {
  const many = Array.from({ length: 2345 }, (_, i) => ({
    slug: `become-a-swimming-pool-host-town-${String(i).padStart(4, "0")}-oh`,
    url_path: null,
  }));
  const p3 = await buildContentPagesSitemap(
    req("/sitemap-pages-host-acquisition.xml?page=3"),
    ["host_acq_city"],
    "/p",
    fakeClient(groupRows(many)),
    SITE,
  );
  const l3 = locs(await p3.text());
  assert.equal(l3.length, 345);
  assert.equal(l3[0], `${SITE}/p/become-a-swimming-pool-host-town-2000-oh`);
  const p4 = await buildContentPagesSitemap(
    req("/sitemap-pages-host-acquisition.xml?page=4"),
    ["host_acq_city"],
    "/p",
    fakeClient(groupRows(many)),
    SITE,
  );
  assert.deepEqual(locs(await p4.text()), []);
});

test("paging: a server cap below the window (500 rows per answer) still reads every row", async () => {
  const many = Array.from({ length: 1200 }, (_, i) => ({
    slug: `a-${String(i).padStart(4, "0")}`,
    url_path: null,
  }));
  const client = fakeClient((q) => {
    if (isRedirectRowRead(q)) return { data: [], error: null };
    const [, from] = q.calls.find((c) => c[0] === "range");
    // Answer at most 500 rows from `from`, whatever was asked for.
    return { data: [...Array(from).fill(null), ...many.slice(from, from + 500)], error: null };
  });
  const p2 = await buildContentPagesSitemap(req("/x.xml?page=2"), ["resource"], "/p", client, SITE);
  assert.equal(locs(await p2.text()).length, 200);
});

test("exclusion rules are applied inside the builder (one example each)", async () => {
  const client = fakeClient((q) =>
    isRedirectRowRead(q)
      ? {
          data: [
            {
              slug: "shadowed-by-redirect",
              url_path: "/p/shadowed-by-redirect",
              redirect_to: "elsewhere",
            },
          ],
          error: null,
        }
      : {
          data: [
            { slug: "kept-article", url_path: "/p/kept-article" },
            { slug: "ultimate_pool_party_guide", url_path: "/p/ultimate_pool_party_guide" },
            { slug: "pool-pros", url_path: "/p/pool-pros" },
            {
              slug: "hosting-uk",
              url_path: "/p/hosting-uk",
              canonical_override: "https://poolrentalnearme.co.uk/p/hosting-uk",
            },
            {
              slug: "self-canonical",
              url_path: "/p/self-canonical",
              canonical_override: `${SITE}/p/self-canonical`,
            },
            { slug: "shadowed-by-redirect", url_path: "/p/shadowed-by-redirect" },
            { slug: "nested", url_path: "/p/a/nested" },
          ],
          error: null,
        },
  );
  const res = await buildContentPagesSitemap(
    req("/sitemap-pages-articles.xml"),
    ["resource"],
    "/p",
    client,
    SITE,
  );
  assert.deepEqual(locs(await res.text()), [`${SITE}/p/kept-article`, `${SITE}/p/self-canonical`]);
});

test("success with no rows is a 200 empty urlset (a group that really is empty)", async () => {
  const client = fakeClient({ data: [], error: null });
  const res = await buildContentPagesSitemap(req(), ["money_page"], "/p", client, SITE);
  assert.equal(res.status, 200);
  assert.deepEqual(locs(await res.text()), []);
});

test("returned error: 503 + no-store, never an empty 200", async () => {
  const client = fakeClient({ data: null, error: { message: "upstream connect error", code: "" } });
  const res = await buildContentPagesSitemap(req(), ["host_acq_city"], "/p", client, SITE);
  assertUnavailable(res, await res.text());
});

test("returned error on the second window: 503, not a sitemap cut at 1,000", async () => {
  const many = Array.from({ length: 1500 }, (_, i) => ({ slug: `a-${i}`, url_path: null }));
  const client = fakeClient((q) => {
    if (isRedirectRowRead(q)) return { data: [], error: null };
    const [, from] = q.calls.find((c) => c[0] === "range");
    return from === 0 ? { data: many, error: null } : { data: null, error: { message: "boom" } };
  });
  const res = await buildContentPagesSitemap(req(), ["host_acq_city"], "/p", client, SITE);
  assertUnavailable(res, await res.text());
});

test("failed redirect-row read: 503 (it decides which rows are shadowed)", async () => {
  const client = fakeClient((q) =>
    isRedirectRowRead(q) ? { data: null, error: { message: "x" } } : { data: rows, error: null },
  );
  const res = await buildContentPagesSitemap(req(), ["host_acq_city"], "/p", client, SITE);
  assertUnavailable(res, await res.text());
});

test("thrown error: 503 + no-store, never an empty 200", async () => {
  const client = fakeClient(() => {
    throw new TypeError("fetch failed");
  });
  const res = await buildContentPagesSitemap(req(), ["host_acq_city"], "/p", client, SITE);
  assertUnavailable(res, await res.text());
});

test("client that throws before the query is built: 503", async () => {
  const client = {
    from() {
      throw new Error("Missing Supabase environment variable(s)");
    },
  };
  const res = await buildContentPagesSitemap(req(), ["host_acq_city"], "/p", client, SITE);
  assertUnavailable(res, await res.text());
});

test("hung read: 503 after the read timeout, the query is told to abort", async () => {
  const saved = process.env.SUPABASE_READ_TIMEOUT_MS;
  process.env.SUPABASE_READ_TIMEOUT_MS = "40";
  try {
    const client = fakeClient(() => new Promise(() => {}));
    const started = Date.now();
    const res = await buildContentPagesSitemap(req(), ["host_acq_city"], "/p", client, SITE);
    assertUnavailable(res, await res.text());
    assert.ok(Date.now() - started < 2000);
    const signal = client.calls.find((c) => c[0] === "abortSignal")[1];
    assert.equal(signal.aborted, true);
  } finally {
    if (saved === undefined) delete process.env.SUPABASE_READ_TIMEOUT_MS;
    else process.env.SUPABASE_READ_TIMEOUT_MS = saved;
  }
});

test("academy minBodyChars still filters thin rows on success", async () => {
  const client = fakeClient(
    groupRows([
      {
        slug: "elearning-academy-thin",
        url_path: "/p/elearning-academy-thin",
        body_markdown: "short",
      },
      {
        slug: "elearning-academy-full",
        url_path: "/p/elearning-academy-full",
        body_markdown: "x".repeat(900),
      },
    ]),
  );
  const res = await buildContentPagesSitemap(req(), ["elearning"], "/p", client, SITE, {
    minBodyChars: 800,
  });
  assert.deepEqual(locs(await res.text()), [`${SITE}/p/elearning-academy-full`]);
  const main = client.queries.find((q) => !isRedirectRowRead(q));
  assert.match(main.calls.find((c) => c[0] === "select")[1], /body_markdown/);
});

test("sitemapUnavailableResponse is not cacheable and sitemapResponse still is", async () => {
  const bad = sitemapUnavailableResponse();
  assertUnavailable(bad, await bad.text());
  assert.equal(bad.headers.get("x-robots-tag"), "noindex");
  const good = sitemapResponse(buildUrlsetXml([{ loc: `${SITE}/` }]));
  assert.equal(good.status, 200);
  assert.match(good.headers.get("cache-control"), /public/);
});

test("sitemapGoneResponse: 410, short body, re-readable cache, no XML", async () => {
  const gone = sitemapGoneResponse("Retired.");
  const body = await gone.text();
  assert.equal(gone.status, 410);
  assert.ok(body.length < 200);
  assert.doesNotMatch(body, /<urlset|<loc>/);
  assert.match(gone.headers.get("cache-control"), /max-age=\d+/);
  assert.doesNotMatch(gone.headers.get("cache-control"), /immutable|no-store/);
});
