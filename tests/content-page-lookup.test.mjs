// Unit tests for the /p/{slug} lookup decision (src/lib/content-page-lookup.ts).
// The rule under test: not_found only when every read consulted SUCCEEDED.
import { test } from "node:test";
import assert from "node:assert/strict";
import { PostgrestClient } from "@supabase/postgrest-js";
import { pgTextArrayLiteral, resolveContentPageLookup } from "../src/lib/content-page-lookup.ts";

const ok = (data) => ({ ok: true, data, count: null });
const failures = {
  "returned error": { ok: false, reason: "error", error: { message: "500 Internal Server Error" } },
  "thrown error": { ok: false, reason: "thrown", error: new Error("fetch failed") },
  timeout: { ok: false, reason: "timeout", error: new Error("no answer within 10000 ms") },
};

const READS = ["pagesBySlug", "aliasForSlug", "cityBySlug", "pageSlugExists", "blogPostBySlug"];

/** Fake reads: every read succeeds with no rows unless overridden. Records the call order. */
function fakeReads(overrides = {}) {
  const calls = [];
  const reads = {};
  for (const name of READS) {
    reads[name] = async (arg) => {
      calls.push([name, arg]);
      const o = overrides[name];
      return typeof o === "function" ? o(arg) : (o ?? ok([]));
    };
  }
  return { reads, calls, names: () => calls.map((c) => c[0]) };
}

const page = (over = {}) => ({
  id: "p1",
  slug: "pool-party-ideas",
  url_path: "/p/pool-party-ideas",
  status: "published",
  title: "Pool party ideas",
  template_type: "resource",
  ...over,
});

test("found: the canonical published row, and nothing else is read", async () => {
  const f = fakeReads({ pagesBySlug: ok([page()]) });
  const res = await resolveContentPageLookup("pool-party-ideas", f.reads);
  assert.equal(res.kind, "found");
  assert.equal(res.page.id, "p1");
  assert.deepEqual(f.names(), ["pagesBySlug"]);
});

test("found: prefers the row whose url_path is /p/{slug} over another published row", async () => {
  const f = fakeReads({
    pagesBySlug: ok([
      page({ id: "nested", url_path: "/p/foo/pool-party-ideas" }),
      page({ id: "canonical" }),
    ]),
  });
  const res = await resolveContentPageLookup("pool-party-ideas", f.reads);
  assert.equal(res.page.id, "canonical");
});

test("redirect: a status=redirect row for the exact path wins over the published row", async () => {
  const logged = [];
  const f = fakeReads({
    pagesBySlug: ok([
      page({ id: "pub", slug: "houston-tx", url_path: "/p/houston-tx" }),
      page({
        id: "redir",
        slug: "houston-tx",
        url_path: "/p/houston-tx",
        status: "redirect",
        redirect_to: "become-a-swimming-pool-host-houston-tx",
      }),
    ]),
  });
  const res = await resolveContentPageLookup("houston-tx", f.reads, (a, b) => logged.push([a, b]));
  assert.deepEqual(res, {
    kind: "redirect",
    canonicalSlug: "become-a-swimming-pool-host-houston-tx",
    redirectPath: "/p/become-a-swimming-pool-host-houston-tx",
  });
  assert.deepEqual(logged, [["houston-tx", "become-a-swimming-pool-host-houston-tx"]]);
});

test("redirect: redirect_to on the published row (absolute path kept as is)", async () => {
  const f = fakeReads({
    pagesBySlug: ok([
      page({ slug: "terms", url_path: "/p/terms", redirect_to: "/terms-of-service" }),
    ]),
  });
  const res = await resolveContentPageLookup("terms", f.reads);
  assert.equal(res.kind, "redirect");
  assert.equal(res.redirectPath, "/terms-of-service");
});

test("redirect: a legacy_slugs alias", async () => {
  const f = fakeReads({ aliasForSlug: ok([{ slug: "new-slug" }]) });
  const res = await resolveContentPageLookup("old-slug", f.reads);
  assert.deepEqual(res, {
    kind: "redirect",
    canonicalSlug: "new-slug",
    redirectPath: "/p/new-slug",
  });
  assert.deepEqual(f.names(), ["pagesBySlug", "aliasForSlug"]);
});

test("redirect: bare-city host slug to its state-suffixed page", async () => {
  const f = fakeReads({
    cityBySlug: ok([{ slug: "cleveland", state_code: "OH" }]),
    pageSlugExists: ok([{ slug: "become-a-swimming-pool-host-cleveland-oh" }]),
  });
  const res = await resolveContentPageLookup("become-a-swimming-pool-host-cleveland", f.reads);
  assert.equal(res.kind, "redirect");
  assert.equal(res.canonicalSlug, "become-a-swimming-pool-host-cleveland-oh");
  assert.deepEqual(f.calls[2], ["cityBySlug", "cleveland"]);
  assert.deepEqual(f.calls[3], ["pageSlugExists", "become-a-swimming-pool-host-cleveland-oh"]);
});

test("found: a published blog post becomes a synthetic resource page", async () => {
  const f = fakeReads({
    blogPostBySlug: ok([
      {
        id: "b1",
        slug: "heat-your-pool",
        title: "Heat your pool",
        excerpt: "x",
        content: "body",
        cover_image_url: null,
        author: null,
        seo_title: null,
        seo_description: null,
        published_at: null,
        updated_at: "2026-10-01T00:00:00Z",
        topic: "maintenance",
        tldr_bullets: ["a", 1, "b"],
        related_slugs: null,
      },
    ]),
  });
  const res = await resolveContentPageLookup("heat-your-pool", f.reads);
  assert.equal(res.kind, "found");
  assert.equal(res.page.url_path, "/p/heat-your-pool");
  assert.equal(res.page.template_type, "resource");
  assert.deepEqual(res.page.tldr_bullets, ["a", "b"]);
});

test("not_found: every read succeeded and none knows the slug", async () => {
  const f = fakeReads();
  const res = await resolveContentPageLookup("no-such-page", f.reads);
  assert.deepEqual(res, { kind: "not_found" });
  assert.deepEqual(f.names(), ["pagesBySlug", "aliasForSlug", "blogPostBySlug"]);
});

test("not_found: unknown become-host slug, city read succeeded with no city", async () => {
  const f = fakeReads();
  const res = await resolveContentPageLookup("become-a-swimming-pool-host-zzyzxville", f.reads);
  assert.deepEqual(res, { kind: "not_found" });
  assert.deepEqual(f.names(), ["pagesBySlug", "aliasForSlug", "cityBySlug", "blogPostBySlug"]);
});

test("not_found: state-suffixed slug skips the city fallback", async () => {
  const f = fakeReads();
  const res = await resolveContentPageLookup("become-a-swimming-pool-host-zzyzxville-qq", f.reads);
  assert.deepEqual(res, { kind: "not_found" });
  assert.deepEqual(f.names(), ["pagesBySlug", "aliasForSlug", "blogPostBySlug"]);
});

// ---- the defect: a failed read must never be read as "no rows" -------------

for (const [how, failure] of Object.entries(failures)) {
  test(`unavailable: first read fails (${how}) for a page that exists — not not_found`, async () => {
    const f = fakeReads({ pagesBySlug: failure });
    const res = await resolveContentPageLookup("pool-party-ideas", f.reads);
    assert.deepEqual(res, { kind: "unavailable" });
    // Nothing further is asked, and nothing is logged as a redirect.
    assert.deepEqual(f.names(), ["pagesBySlug"]);
  });

  test(`unavailable: alias read fails (${how})`, async () => {
    const f = fakeReads({ aliasForSlug: failure });
    const res = await resolveContentPageLookup("old-slug", f.reads);
    assert.deepEqual(res, { kind: "unavailable" });
    assert.deepEqual(f.names(), ["pagesBySlug", "aliasForSlug"]);
  });

  test(`unavailable: city read fails (${how}) for a become-host slug — not the 301 path`, async () => {
    const f = fakeReads({ cityBySlug: failure });
    const res = await resolveContentPageLookup("become-a-swimming-pool-host-cleveland", f.reads);
    assert.deepEqual(res, { kind: "unavailable" });
    assert.deepEqual(f.names(), ["pagesBySlug", "aliasForSlug", "cityBySlug"]);
  });

  test(`unavailable: state-suffixed candidate read fails (${how})`, async () => {
    const f = fakeReads({
      cityBySlug: ok([{ slug: "cleveland", state_code: "OH" }]),
      pageSlugExists: failure,
    });
    const res = await resolveContentPageLookup("become-a-swimming-pool-host-cleveland", f.reads);
    assert.deepEqual(res, { kind: "unavailable" });
  });

  test(`unavailable: blog read fails (${how}) after every content_pages read succeeded`, async () => {
    const f = fakeReads({ blogPostBySlug: failure });
    const res = await resolveContentPageLookup("heat-your-pool", f.reads);
    assert.deepEqual(res, { kind: "unavailable" });
  });
}

test("no failure anywhere in the chain can produce not_found", async () => {
  // For every read position and every slug shape, fail exactly that read.
  const slugs = [
    "no-such-page",
    "become-a-swimming-pool-host-cleveland",
    "become-a-swimming-pool-host-cleveland-oh",
    "swim-instructor-pool-rental-austin",
  ];
  for (const slug of slugs) {
    for (const name of READS) {
      const f = fakeReads({
        cityBySlug: ok([{ slug: "x", state_code: "TX" }]),
        [name]: failures["returned error"],
      });
      const res = await resolveContentPageLookup(slug, f.reads);
      const consulted = f.names().includes(name);
      if (consulted) {
        assert.equal(res.kind, "unavailable", `${slug}: ${name} failed but result was ${res.kind}`);
      } else {
        assert.notEqual(res.kind, "unavailable", `${slug}: ${name} was never read`);
      }
    }
  }
});

test("a found page is not held hostage by reads it never needs", async () => {
  const f = fakeReads({
    pagesBySlug: ok([page()]),
    aliasForSlug: failures.timeout,
    cityBySlug: failures.timeout,
    blogPostBySlug: failures.timeout,
  });
  const res = await resolveContentPageLookup("pool-party-ideas", f.reads);
  assert.equal(res.kind, "found");
});

// ── the legacy_slugs alias filter: a slug is data, never array syntax ──────────
// A missing slug with `{`, `}` or `"` in it (an unfilled `{city}` placeholder
// from an old SMS) used to reach PostgREST as `cs.{...{city}}`, a malformed
// array literal (Postgres 22P02, HTTP 400). That error is a "failed read", so
// the page answered 503 on every retry instead of the 404 / become-host 301.

test("pgTextArrayLiteral: every element double-quoted, \\ and \" escaped", () => {
  assert.equal(pgTextArrayLiteral(["fixture-old-slug"]), '{"fixture-old-slug"}');
  assert.equal(
    pgTextArrayLiteral(["become-a-swimming-pool-host-{city}"]),
    '{"become-a-swimming-pool-host-{city}"}',
  );
  assert.equal(pgTextArrayLiteral(['foo"bar']), '{"foo\\"bar"}');
  assert.equal(pgTextArrayLiteral(["back\\slash"]), '{"back\\\\slash"}');
  assert.equal(pgTextArrayLiteral(["a,b"]), '{"a,b"}', "a comma stays inside one element");
  assert.equal(pgTextArrayLiteral(["a", "b"]), '{"a","b"}');
});

test("the alias filter postgrest-js actually sends is the quoted literal", () => {
  const url = (slug) =>
    new PostgrestClient("http://stub/rest/v1")
      .from("content_pages")
      .select("slug")
      .contains("legacy_slugs", pgTextArrayLiteral([slug])).url;
  for (const slug of ["fixture-old-slug", "become-a-swimming-pool-host-{city}", 'foo"bar', "a,b"]) {
    const sent = url(slug).searchParams.get("legacy_slugs");
    assert.equal(sent, `cs.${pgTextArrayLiteral([slug])}`, slug);
    assert.ok(sent.startsWith('cs.{"') && sent.endsWith('"}'), sent);
  }
  // What the array form would have sent, for the record: the bug.
  const raw = new PostgrestClient("http://stub/rest/v1")
    .from("content_pages")
    .select("slug")
    .contains("legacy_slugs", ["become-a-swimming-pool-host-{city}"]).url;
  assert.equal(raw.searchParams.get("legacy_slugs"), "cs.{become-a-swimming-pool-host-{city}}");
});
