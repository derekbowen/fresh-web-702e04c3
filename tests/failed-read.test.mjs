// Unit tests for src/lib/failed-read.ts — run with: npm run test:unit
// (node --test; Node 22 strips the TypeScript types natively).
import { test, before } from "node:test";
import assert from "node:assert/strict";
import {
  guardedRead,
  readOrThrow,
  readTimeoutMs,
  isReadUnavailable,
  ReadUnavailableError,
  READ_UNAVAILABLE_MESSAGE,
  unavailableResponse,
  UNAVAILABLE_RETRY_AFTER_SECONDS,
} from "../src/lib/failed-read.ts";

// guardedRead logs every failed read; keep the test output readable.
before(() => {
  console.error = () => {};
});

test("success: rows come back as ok:true", async () => {
  const out = await guardedRead("t", async () => ({ data: [{ id: 1 }], error: null }));
  assert.deepEqual(out, { ok: true, data: [{ id: 1 }], count: null });
});

test("success with zero rows is still ok:true (this is the only way to learn 'no rows')", async () => {
  const out = await guardedRead("t", async () => ({ data: [], error: null }));
  assert.equal(out.ok, true);
  assert.deepEqual(out.data, []);
});

test("success: count is passed through for head/count queries", async () => {
  const out = await guardedRead("t", async () => ({ data: null, error: null, count: 3933 }));
  assert.deepEqual(out, { ok: true, data: null, count: 3933 });
});

test("returned { error } is a failed read, not 'no rows'", async () => {
  const error = { message: "FetchError: connect ECONNRESET", code: "" };
  const out = await guardedRead("t", async () => ({ data: null, error }));
  assert.equal(out.ok, false);
  assert.equal(out.reason, "error");
  assert.equal(out.error, error);
});

test("a rejected promise is a failed read", async () => {
  const boom = new Error("fetch failed");
  const out = await guardedRead("t", () => Promise.reject(boom));
  assert.equal(out.ok, false);
  assert.equal(out.reason, "thrown");
  assert.equal(out.error, boom);
});

test("a synchronous throw while building the query is a failed read", async () => {
  const out = await guardedRead("t", () => {
    throw new Error("Missing Supabase environment variable(s)");
  });
  assert.equal(out.ok, false);
  assert.equal(out.reason, "thrown");
});

test("a read that resolves with nothing is a failed read", async () => {
  const out = await guardedRead("t", async () => undefined);
  assert.equal(out.ok, false);
  assert.equal(out.reason, "error");
});

test("timeout: a hung read becomes ok:false within the bound and aborts the signal", async () => {
  let seen;
  const started = Date.now();
  const out = await guardedRead(
    "t",
    (signal) => {
      seen = signal;
      return new Promise(() => {}); // never settles
    },
    { timeoutMs: 40 },
  );
  const elapsed = Date.now() - started;
  assert.equal(out.ok, false);
  assert.equal(out.reason, "timeout");
  assert.equal(seen.aborted, true);
  assert.ok(elapsed >= 30 && elapsed < 1000, `elapsed ${elapsed} ms`);
});

test("timeout: a read that rejects because it was aborted is reported as a timeout", async () => {
  const out = await guardedRead(
    "t",
    (signal) =>
      new Promise((_, reject) => {
        signal.addEventListener("abort", () => reject(new Error("AbortError")));
      }),
    { timeoutMs: 20 },
  );
  assert.equal(out.ok, false);
  assert.equal(out.reason, "timeout");
});

test("a fast read is not affected by the timeout and leaves no timer behind", async () => {
  let seen;
  const out = await guardedRead(
    "t",
    async (signal) => {
      seen = signal;
      return { data: { slug: "a" }, error: null };
    },
    { timeoutMs: 20 },
  );
  assert.equal(out.ok, true);
  await new Promise((r) => setTimeout(r, 40));
  assert.equal(seen.aborted, false);
});

test("PGRST116 (maybeSingle: not exactly one row) is an answer, not a failure", async () => {
  const out = await guardedRead("t", async () => ({
    data: null,
    error: { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned" },
  }));
  assert.deepEqual(out, { ok: true, data: null, count: null });
});

test("readTimeoutMs: 10 s by default, overridable by SUPABASE_READ_TIMEOUT_MS", () => {
  const saved = process.env.SUPABASE_READ_TIMEOUT_MS;
  try {
    delete process.env.SUPABASE_READ_TIMEOUT_MS;
    assert.equal(readTimeoutMs(), 10_000);
    process.env.SUPABASE_READ_TIMEOUT_MS = "2500";
    assert.equal(readTimeoutMs(), 2500);
    for (const junk of ["", "abc", "0", "-5"]) {
      process.env.SUPABASE_READ_TIMEOUT_MS = junk;
      assert.equal(readTimeoutMs(), 10_000, `junk value ${JSON.stringify(junk)}`);
    }
  } finally {
    if (saved === undefined) delete process.env.SUPABASE_READ_TIMEOUT_MS;
    else process.env.SUPABASE_READ_TIMEOUT_MS = saved;
  }
});

test("the env timeout is what guardedRead uses when none is passed", async () => {
  const saved = process.env.SUPABASE_READ_TIMEOUT_MS;
  process.env.SUPABASE_READ_TIMEOUT_MS = "30";
  try {
    const out = await guardedRead("t", () => new Promise(() => {}));
    assert.equal(out.reason, "timeout");
  } finally {
    if (saved === undefined) delete process.env.SUPABASE_READ_TIMEOUT_MS;
    else process.env.SUPABASE_READ_TIMEOUT_MS = saved;
  }
});

test("readOrThrow returns data on success and throws ReadUnavailableError on any failure", async () => {
  assert.deepEqual(await readOrThrow("t", async () => ({ data: [1], error: null })), {
    data: [1],
    count: null,
  });
  await assert.rejects(
    readOrThrow("t", async () => ({ data: null, error: { message: "500" } })),
    (err) => err instanceof ReadUnavailableError && isReadUnavailable(err),
  );
  await assert.rejects(
    readOrThrow("t", () => Promise.reject(new Error("x"))),
    ReadUnavailableError,
  );
  await assert.rejects(
    readOrThrow("t", () => new Promise(() => {}), { timeoutMs: 20 }),
    ReadUnavailableError,
  );
});

test("isReadUnavailable still recognises the error after it lost its class (RPC serialization)", () => {
  assert.equal(isReadUnavailable(new ReadUnavailableError("x")), true);
  assert.equal(isReadUnavailable(new Error(READ_UNAVAILABLE_MESSAGE)), true);
  assert.equal(isReadUnavailable({ name: "ReadUnavailableError", message: "whatever" }), true);
  assert.equal(isReadUnavailable(new Error("something else")), false);
  assert.equal(isReadUnavailable(null), false);
  assert.equal(isReadUnavailable(undefined), false);
  assert.equal(isReadUnavailable("ReadUnavailableError"), false);
});

test("unavailableResponse: 503, Retry-After 120, no-store, noindex, small body", async () => {
  for (const kind of ["html", "text"]) {
    const res = unavailableResponse(kind);
    assert.equal(res.status, 503);
    assert.equal(res.headers.get("retry-after"), "120");
    assert.equal(UNAVAILABLE_RETRY_AFTER_SECONDS, 120);
    assert.equal(res.headers.get("cache-control"), "no-store");
    assert.equal(res.headers.get("x-robots-tag"), "noindex");
    assert.equal(res.headers.get("location"), null);
    const body = await res.text();
    assert.ok(body.length > 20 && body.length < 2000, `body length ${body.length}`);
    if (kind === "html") {
      assert.match(res.headers.get("content-type"), /^text\/html/);
      assert.match(body, /<meta name="robots" content="noindex">/);
      assert.match(body, /Temporarily unavailable/);
    } else {
      assert.match(res.headers.get("content-type"), /^text\/plain/);
      assert.doesNotMatch(body, /<urlset|<sitemapindex/);
    }
  }
});
