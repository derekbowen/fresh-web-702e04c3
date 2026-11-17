// Unit tests for the shared sub-sitemap builder (src/lib/sitemap.ts) with a
// fake Supabase client: a failed read is a 503, never a 200 with an empty
// <urlset>.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import {
  buildContentPagesSitemap,
  sitemapUnavailableResponse,
  sitemapResponse,
  buildUrlsetXml,
} from "../src/lib/sitemap.ts";

before(() => {
  console.error = () => {};
});

const SITE = "https://www.example.test";

/**
 * Minimal stand-in for the supabase-js query builder: every filter returns the
 * builder, awaiting it yields `result` (or runs `behaviour`). Records the calls.
 */
function fakeClient(behaviour) {
  const calls = [];
  const builder = {
    then(resolve, reject) {
      return Promise.resolve()
        .then(() => (typeof behaviour === "function" ? behaviour(calls) : behaviour))
        .then(resolve, reject);
    },
  };
  for (const m of [
    "select",
    "in",
    "eq",
    "is",
    "not",
    "order",
    "range",
    "limit",
    "like",
    "abortSignal",
  ]) {
    builder[m] = (...args) => {
      calls.push([m, ...args]);
      return builder;
    };
  }
  return {
    calls,
    from(table) {
      calls.push(["from", table]);
      return builder;
    },
  };
}

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

test("success: 200 with the page URLs, cacheable, rows outside the prefix dropped", async () => {
  const client = fakeClient({ data: rows, error: null });
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
  assert.deepEqual(client.calls[0], ["from", "content_pages"]);
  assert.ok(client.calls.some((c) => c[0] === "in" && c[1] === "template_type"));
});

test("success: ?page=2 reads the second window of 1000", async () => {
  const client = fakeClient({ data: [], error: null });
  await buildContentPagesSitemap(
    req("/sitemap-pages-host-acquisition.xml?page=2"),
    ["host_acq_city"],
    "/p",
    client,
    SITE,
  );
  assert.deepEqual(
    client.calls.find((c) => c[0] === "range"),
    ["range", 1000, 1999],
  );
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
  const client = fakeClient({
    data: [
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
    ],
    error: null,
  });
  const res = await buildContentPagesSitemap(req(), ["elearning"], "/p", client, SITE, {
    minBodyChars: 800,
  });
  assert.deepEqual(locs(await res.text()), [`${SITE}/p/elearning-academy-full`]);
});

test("sitemapUnavailableResponse is not cacheable and sitemapResponse still is", async () => {
  const bad = sitemapUnavailableResponse();
  assertUnavailable(bad, await bad.text());
  assert.equal(bad.headers.get("x-robots-tag"), "noindex");
  const good = sitemapResponse(buildUrlsetXml([{ loc: `${SITE}/` }]));
  assert.equal(good.status, 200);
  assert.match(good.headers.get("cache-control"), /public/);
});
