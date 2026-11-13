/**
 * Listing inquiry tests. No network, no database, no real email.
 *
 * The real sendViaEmailit is used, with globalThis.fetch replaced by a stub
 * that answers only the Emailit endpoint and throws on any other URL, so these
 * tests prove the exact payload that would leave the process and that nothing
 * else does. EMAILIT_API_KEY is set to an obviously fake value for the run and
 * restored afterwards; even a real key in the environment could not send,
 * because fetch never reaches the network.
 *
 * Fixtures are deliberately fake (example.com, 555-01xx, "Test Pool Listing").
 *
 * Run: bun test src/server/listing-inquiry.server.test.ts
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { sendViaEmailit } from "@/lib/email/emailit";
import type { ListingReadOutcome } from "./listing-read.server";
import type { ListingSummary } from "./sharetribe.server";
import {
  HONEYPOT_FIELD,
  INQUIRY_FROM,
  INQUIRY_RATE_LIMITS,
  INQUIRY_TO,
  SlidingWindowCounter,
  createInquiryRateLimiter,
  emailBucket,
  handleListingInquiry,
  headerSafe,
  ipBucket,
  mentionsInsurance,
  type InquiryDeps,
  type InquiryResult,
} from "./listing-inquiry.server";

const EMAILIT_URL = "https://api.emailit.com/v2/emails";
const FAKE_KEY = "test-key-not-a-real-key";
const SITE = "https://www.poolrentalnearme.com";
const LISTING_ID = "11111111-2222-4333-8444-555555555555";
const OTHER_ID = "99999999-8888-4777-8666-555555555555";
/** 2026-11-13 15:00 UTC */
const NOW = Date.UTC(2026, 10, 13, 15, 0, 0);
const HOUR = 60 * 60 * 1000;

const LISTING: ListingSummary = {
  id: LISTING_ID,
  slug: "test-pool-listing",
  title: "Test Pool Listing",
  description: "",
  price: { amount: 5000, currency: "USD" },
  city: "Testville",
  state: "TX",
  imageUrl: null,
  url: `/l/test-pool-listing/${LISTING_ID}`,
  geolocation: null,
};

const VALID = {
  listingId: LISTING_ID,
  name: "Test Guest",
  email: "guest@example.com",
  phone: "+1 (512) 555-0100",
  preferredDate: "2026-12-05",
  groupSize: 6,
  message: "Is the pool free on Saturday afternoon for a small birthday party?",
  [HONEYPOT_FIELD]: "",
};

// ─────────────────────────────────────────────────────────────────────────────
// fetch stub: the only thing allowed out is a POST to the Emailit endpoint.
// ─────────────────────────────────────────────────────────────────────────────

interface Outbound {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
}

const realFetch = globalThis.fetch;
let outbound: Outbound[] = [];
let foreignRequests: string[] = [];
let emailitReply: () => Response | Promise<Response> = () =>
  new Response(JSON.stringify({ id: "em_test_1", status: "queued" }), { status: 200 });

beforeEach(() => {
  outbound = [];
  foreignRequests = [];
  emailitReply = () =>
    new Response(JSON.stringify({ id: "em_test_1", status: "queued" }), { status: 200 });
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : (input as Request).url;
    if (url !== EMAILIT_URL) {
      foreignRequests.push(url);
      throw new Error(`test stub: unexpected outbound request to ${url}`);
    }
    const headers: Record<string, string> = {};
    new Headers(init?.headers).forEach((v, k) => {
      headers[k] = v;
    });
    outbound.push({
      url,
      method: init?.method ?? "GET",
      headers,
      body: JSON.parse(String(init?.body ?? "{}")),
    });
    return emailitReply();
  }) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = realFetch;
  // Every test must leave the network untouched apart from the stubbed endpoint.
  expect(foreignRequests).toEqual([]);
});

let savedKey: string | undefined;
beforeAll(() => {
  savedKey = process.env.EMAILIT_API_KEY;
  process.env.EMAILIT_API_KEY = FAKE_KEY;
});
afterAll(() => {
  if (savedKey === undefined) delete process.env.EMAILIT_API_KEY;
  else process.env.EMAILIT_API_KEY = savedKey;
});

// ─────────────────────────────────────────────────────────────────────────────
// Deps
// ─────────────────────────────────────────────────────────────────────────────

type ReadImpl = (id: string) => Promise<ListingReadOutcome<ListingSummary | null>>;

function harness(opts: { read?: ReadImpl; env?: InquiryDeps["env"] } = {}) {
  const logs: string[] = [];
  const reads: string[] = [];
  const clock = { t: NOW };
  const limiter = createInquiryRateLimiter();
  const read: ReadImpl =
    opts.read ?? (async () => ({ result: LISTING, servedBy: "mirror", source: "mirror-only" }));
  const deps: InquiryDeps = {
    readListing: async (id) => {
      reads.push(id);
      return read(id);
    },
    send: sendViaEmailit,
    env: opts.env ?? { EMAILIT_API_KEY: FAKE_KEY },
    now: () => clock.t,
    limiter,
    log: {
      info: (l) => logs.push(`info ${l}`),
      warn: (l) => logs.push(`warn ${l}`),
      error: (l) => logs.push(`error ${l}`),
    },
    siteUrl: SITE,
  };
  let ipSeq = 0;
  return {
    deps,
    logs,
    reads,
    clock,
    limiter,
    /** Submit with a fresh IP each time unless one is given. */
    submit: (raw: unknown, ip: string | null = `198.51.100.${++ipSeq % 250}`) =>
      handleListingInquiry(raw, { ip }, deps),
  };
}

function expectInvalid(res: InquiryResult, field: string) {
  expect(res.ok).toBe(false);
  if (res.ok) return;
  expect(res.reason).toBe("invalid");
  if (res.reason !== "invalid") return;
  expect(res.fieldErrors[field as keyof typeof res.fieldErrors]).toBeString();
}

// ─────────────────────────────────────────────────────────────────────────────
// The payload
// ─────────────────────────────────────────────────────────────────────────────

describe("the Emailit payload", () => {
  test("a valid inquiry sends exactly one email, to the support inbox only", async () => {
    const h = harness();
    const res = await h.submit(VALID);
    expect(res).toEqual({ ok: true });

    expect(outbound).toHaveLength(1);
    const call = outbound[0]!;
    expect(call.url).toBe(EMAILIT_URL);
    expect(call.method).toBe("POST");
    expect(call.headers.authorization).toBe(`Bearer ${FAKE_KEY}`);
    expect(call.headers["content-type"]).toBe("application/json");

    // Exactly these keys: no cc, no bcc, no extra headers, no second recipient.
    expect(Object.keys(call.body).sort()).toEqual([
      "from",
      "html",
      "reply_to",
      "subject",
      "text",
      "to",
    ]);
    expect(call.body.from).toBe("Pool Rental Near Me <noreply@poolrentalnearme.com>");
    expect(call.body.from).toBe(INQUIRY_FROM);
    expect(call.body.to).toBe("support@poolrentalnearme.com");
    expect(call.body.to).toBe(INQUIRY_TO);
    expect(call.body.reply_to).toBe("guest@example.com");
    expect(call.body.subject).toBe("Pool inquiry: Test Pool Listing (Testville, TX)");

    expect(h.reads).toEqual([LISTING_ID]);
    expect(h.logs).toEqual([
      `info [listing-inquiry] sent to support inbox listing=${LISTING_ID} insurance_flag=no`,
    ]);
  });

  test("the text part carries the listing, the guest, the message and the footer", async () => {
    const h = harness();
    await h.submit(VALID);
    const text = String(outbound[0]!.body.text);
    expect(text).toContain("Listing: Test Pool Listing");
    expect(text).toContain("Location: Testville, TX");
    expect(text).toContain(`Listing ID: ${LISTING_ID}`);
    expect(text).toContain(`Listing URL: ${SITE}/l/${LISTING_ID}`);
    expect(text).toContain("Guest name: Test Guest");
    expect(text).toContain("Guest email: guest@example.com");
    expect(text).toContain("Phone: +1 (512) 555-0100");
    expect(text).toContain("Preferred date: 2026-12-05 (Saturday)");
    expect(text).toContain("Group size: 6");
    expect(text).toContain(VALID.message);
    expect(text).toContain("The guest has not been emailed and the host has not been contacted.");
    expect(String(outbound[0]!.body.html)).toContain(
      "The guest has not been emailed and the host has not been contacted.",
    );
  });

  test("optional fields left blank read as 'not given'", async () => {
    const h = harness();
    await h.submit({ ...VALID, phone: "", preferredDate: "", groupSize: undefined });
    const text = String(outbound[0]!.body.text);
    expect(text).toContain("Phone: not given");
    expect(text).toContain("Preferred date: not given");
    expect(text).toContain("Group size: not given");
  });

  test("listing data comes from the server read, never from the payload", async () => {
    const h = harness();
    await h.submit({
      ...VALID,
      listingTitle: "Client Says Free Pool",
      title: "Client Says Free Pool",
      city: "Elsewhere",
      to: "someone@example.org",
      cc: "someone@example.org",
      bcc: "someone@example.org",
      subject: "spoofed",
      replyTo: "attacker@example.org",
    });
    const body = outbound[0]!.body;
    expect(body.to).toBe(INQUIRY_TO);
    expect(body.reply_to).toBe("guest@example.com");
    expect(body.subject).toBe("Pool inquiry: Test Pool Listing (Testville, TX)");
    expect(JSON.stringify(body)).not.toContain("Client Says Free Pool");
    expect(JSON.stringify(body)).not.toContain("someone@example.org");
    expect(JSON.stringify(body)).not.toContain("attacker@example.org");
  });

  test("subject drops the location when the listing has none", async () => {
    const h = harness({
      read: async () => ({
        result: { ...LISTING, city: null, state: null },
        servedBy: "mirror",
        source: "mirror-only",
      }),
    });
    await h.submit(VALID);
    expect(outbound[0]!.body.subject).toBe("Pool inquiry: Test Pool Listing");
  });

  test("reply_to is the trimmed, validated guest address", async () => {
    const h = harness();
    await h.submit({ ...VALID, email: "  guest.two@example.com  " });
    expect(outbound[0]!.body.reply_to).toBe("guest.two@example.com");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

describe("validation", () => {
  test("required fields", async () => {
    const h = harness();
    const res = await h.submit({ listingId: LISTING_ID });
    expect(res.ok).toBe(false);
    if (res.ok || res.reason !== "invalid") throw new Error("expected invalid");
    expect(Object.keys(res.fieldErrors).sort()).toEqual(["email", "message", "name"]);
    expect(outbound).toHaveLength(0);
    expect(h.reads).toHaveLength(0);
  });

  test("non-object payloads are invalid, not crashes", async () => {
    const h = harness();
    for (const raw of [null, undefined, "hello", 42, []]) {
      const res = await h.submit(raw);
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.reason).toBe("invalid");
    }
    expect(outbound).toHaveLength(0);
  });

  test("listing id must be a UUID", async () => {
    const h = harness();
    expectInvalid(await h.submit({ ...VALID, listingId: "not-a-uuid" }), "listingId");
    expectInvalid(await h.submit({ ...VALID, listingId: "../../etc/passwd" }), "listingId");
    expect(h.reads).toHaveLength(0);
  });

  test("message length: min 10, max 2,000", async () => {
    const h = harness();
    expectInvalid(await h.submit({ ...VALID, message: "hi" }), "message");
    expectInvalid(await h.submit({ ...VALID, message: "   \n\n   " }), "message");
    expectInvalid(await h.submit({ ...VALID, message: "x".repeat(2001) }), "message");
    expectInvalid(await h.submit({ ...VALID, message: "x".repeat(50_000) }), "message");
    expect(outbound).toHaveLength(0);
    expect(await h.submit({ ...VALID, message: "x".repeat(2000) })).toEqual({ ok: true });
    expect(outbound).toHaveLength(1);
  });

  test("name length cap", async () => {
    const h = harness();
    expectInvalid(await h.submit({ ...VALID, name: "a".repeat(101) }), "name");
    expectInvalid(await h.submit({ ...VALID, name: "   " }), "name");
    expect(await h.submit({ ...VALID, name: "a".repeat(100) })).toEqual({ ok: true });
  });

  test("email format", async () => {
    const h = harness();
    for (const email of [
      "not-an-email",
      "a@b",
      "Test Guest <guest@example.com>",
      "guest@example.com, other@example.com",
      "guest@example.com;other@example.com",
      `${"a".repeat(250)}@example.com`,
    ]) {
      expectInvalid(await h.submit({ ...VALID, email }), "email");
    }
    expect(outbound).toHaveLength(0);
  });

  test("preferred date: a real calendar date, today onwards, within two years", async () => {
    const h = harness();
    expectInvalid(await h.submit({ ...VALID, preferredDate: "2026-02-30" }), "preferredDate");
    expectInvalid(await h.submit({ ...VALID, preferredDate: "2020-01-01" }), "preferredDate");
    expectInvalid(await h.submit({ ...VALID, preferredDate: "12/05/2026" }), "preferredDate");
    expectInvalid(await h.submit({ ...VALID, preferredDate: "2030-01-01" }), "preferredDate");
    expect(await h.submit({ ...VALID, preferredDate: "2026-11-13" })).toEqual({ ok: true });
  });

  test("group size: whole number 1 to 100", async () => {
    const h = harness();
    for (const groupSize of [0, 101, -3, 2.5, "abc", "1e3"]) {
      expectInvalid(await h.submit({ ...VALID, groupSize }), "groupSize");
    }
    expect(await h.submit({ ...VALID, groupSize: "12" })).toEqual({ ok: true });
    expect(String(outbound[0]!.body.text)).toContain("Group size: 12");
  });

  test("phone: digits and phone punctuation only", async () => {
    const h = harness();
    expectInvalid(await h.submit({ ...VALID, phone: "call me maybe" }), "phone");
    expectInvalid(await h.submit({ ...VALID, phone: "12" }), "phone");
    expectInvalid(await h.submit({ ...VALID, phone: "5".repeat(41) }), "phone");
    expect(await h.submit({ ...VALID, phone: "512-555-0100 ext 12" })).toEqual({ ok: true });
  });

  test("control and bidi-override characters are stripped from every value", async () => {
    const h = harness();
    await h.submit({
      ...VALID,
      name: "Test\u0000 Gu\u0007est",
      message: "Is it\u0008 free\u202E on Saturday\u200B afternoon?\u001B[31m",
    });
    const body = outbound[0]!.body;
    const all = `${body.text}${body.html}${body.subject}`;
    // eslint-disable-next-line no-control-regex -- asserting control characters are gone
    expect(all).not.toMatch(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202E\u200B]/);
    expect(String(body.text)).toContain("Guest name: Test Guest");
    expect(String(body.text)).toContain("Is it free on Saturday afternoon?[31m");
  });

  test("message newlines survive (normalised to \\n) in the text part", async () => {
    const h = harness();
    await h.submit({
      ...VALID,
      message: "Line one here\r\nLine two here\r\n\r\n\r\n\r\nLine three",
    });
    expect(String(outbound[0]!.body.text)).toContain("Line one here\nLine two here\n\nLine three");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Header injection
// ─────────────────────────────────────────────────────────────────────────────

describe("CR/LF header injection", () => {
  test("a line break in the name is rejected, not repaired", async () => {
    const h = harness();
    for (const name of [
      "Test Guest\r\nBcc: victim@example.org",
      "Test Guest\nBcc: victim@example.org",
      "Test Guest\rBcc: victim@example.org",
      "Test Guest\u2028Bcc: victim@example.org",
      "Test Guest\n", // even a trailing one that trimming would have hidden
    ]) {
      expectInvalid(await h.submit({ ...VALID, name }), "name");
    }
    expect(outbound).toHaveLength(0);
    expect(h.reads).toHaveLength(0);
  });

  test("a line break in the email is rejected", async () => {
    const h = harness();
    for (const email of [
      "guest@example.com\r\nBcc: victim@example.org",
      "guest@example.com\nBcc: victim@example.org",
      "guest@example.com\r\n",
    ]) {
      expectInvalid(await h.submit({ ...VALID, email }), "email");
    }
    expect(outbound).toHaveLength(0);
  });

  test("a host-written title with line breaks cannot break the subject", async () => {
    const h = harness({
      read: async () => ({
        result: {
          ...LISTING,
          title: "Test Pool\r\nBcc: victim@example.org\r\n\r\nInjected body",
          city: "Test\nville",
          state: "T\rX",
        },
        servedBy: "mirror",
        source: "mirror-only",
      }),
    });
    expect(await h.submit(VALID)).toEqual({ ok: true });
    const subject = String(outbound[0]!.body.subject);
    expect(subject).not.toMatch(/[\r\n]/);
    expect(subject).toBe(
      "Pool inquiry: Test Pool Bcc: victim@example.org Injected body (Test ville, T X)",
    );
  });

  test("an over-long listing title is truncated in the subject", async () => {
    const h = harness({
      read: async () => ({
        result: { ...LISTING, title: "T".repeat(400) },
        servedBy: "mirror",
        source: "mirror-only",
      }),
    });
    await h.submit(VALID);
    expect(String(outbound[0]!.body.subject).length).toBeLessThan(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// HTML escaping
// ─────────────────────────────────────────────────────────────────────────────

describe("HTML escaping", () => {
  test("every guest value and the host-written title are escaped in the HTML part", async () => {
    const h = harness({
      read: async () => ({
        result: { ...LISTING, title: `Pool <b onclick="x">& Spa</b>`, city: "<i>Test</i>" },
        servedBy: "mirror",
        source: "mirror-only",
      }),
    });
    await h.submit({
      ...VALID,
      name: `<script>alert("n")</script>`,
      message: `<img src=x onerror=alert(1)> & "double" 'single' </div><a href="javascript:x">`,
      phone: "(512) 555-0100",
    });
    const html = String(outbound[0]!.body.html);
    expect(html).toContain("&lt;script&gt;alert(&quot;n&quot;)&lt;/script&gt;");
    expect(html).toContain(
      "&lt;img src=x onerror=alert(1)&gt; &amp; &quot;double&quot; &#39;single&#39;",
    );
    expect(html).toContain("Pool &lt;b onclick=&quot;x&quot;&gt;&amp; Spa&lt;/b&gt;");
    expect(html).toContain("&lt;i&gt;Test&lt;/i&gt;");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<b ");
    expect(html).not.toContain("<i>");
    expect(html).not.toContain('href="javascript');
    // The only links are the listing URL and the guest's validated address.
    const hrefs = [...html.matchAll(/href="([^"]*)"/g)].map((m) => m[1]);
    expect(hrefs).toEqual([`${SITE}/l/${LISTING_ID}`, "mailto:guest@example.com"]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Honeypot
// ─────────────────────────────────────────────────────────────────────────────

describe("honeypot", () => {
  test("filled: answers success, reads nothing, counts nothing, sends nothing", async () => {
    const h = harness();
    const res = await h.submit({ ...VALID, [HONEYPOT_FIELD]: "http://spam.example" });
    expect(res).toEqual({ ok: true });
    expect(outbound).toHaveLength(0);
    expect(h.reads).toHaveLength(0);
    expect(h.limiter.perIp.size).toBe(0);
    expect(h.limiter.perEmail.size).toBe(0);
    expect(h.limiter.global.size).toBe(0);
    expect(h.logs).toEqual([
      "info [listing-inquiry] honeypot filled; answered success, nothing sent",
    ]);
  });

  test("filled with otherwise-invalid data still answers success", async () => {
    const h = harness();
    expect(await h.submit({ [HONEYPOT_FIELD]: "x", email: "nope" })).toEqual({ ok: true });
    expect(outbound).toHaveLength(0);
  });

  test("whitespace-only honeypot counts as empty", async () => {
    const h = harness();
    expect(await h.submit({ ...VALID, [HONEYPOT_FIELD]: "   " })).toEqual({ ok: true });
    expect(outbound).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rate limits
// ─────────────────────────────────────────────────────────────────────────────

const email = (i: number) => `guest${i}@example.com`;

describe("rate limits", () => {
  test("per IP: 5 an hour, then refused without a read or a send", async () => {
    const h = harness();
    const ip = "203.0.113.7";
    for (let i = 0; i < INQUIRY_RATE_LIMITS.perIp.limit; i++) {
      expect(await h.submit({ ...VALID, email: email(i) }, ip)).toEqual({ ok: true });
    }
    const res = await h.submit({ ...VALID, email: email(99) }, ip);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("rate_limited");
    expect(outbound).toHaveLength(5);
    expect(h.reads).toHaveLength(5);
    expect(h.logs.at(-1)).toBe(
      `warn [listing-inquiry] NOT SENT listing=${LISTING_ID} reason=rate_limited limiter=per-ip`,
    );
    // A different IP is unaffected.
    expect(await h.submit({ ...VALID, email: email(100) }, "203.0.113.8")).toEqual({ ok: true });
    // And the window slides.
    h.clock.t += HOUR + 1;
    expect(await h.submit({ ...VALID, email: email(101) }, ip)).toEqual({ ok: true });
  });

  test("per IP counts not-found probes too", async () => {
    const h = harness({
      read: async (id) =>
        id === LISTING_ID
          ? { result: LISTING, servedBy: "mirror", source: "mirror-only" }
          : { result: null, servedBy: "mirror", source: "mirror-only" },
    });
    const ip = "203.0.113.9";
    for (let i = 0; i < 5; i++) {
      const r = await h.submit({ ...VALID, listingId: OTHER_ID, email: email(i) }, ip);
      if (!r.ok) expect(r.reason).toBe("listing_not_found");
    }
    const res = await h.submit({ ...VALID, email: email(50) }, ip);
    if (!res.ok) expect(res.reason).toBe("rate_limited");
    else throw new Error("expected rate_limited");
    expect(outbound).toHaveLength(0);
  });

  test("IPv6 addresses share a budget per /64", async () => {
    const h = harness();
    const ips = [
      "2001:db8:1:2::1",
      "2001:db8:1:2::2",
      "2001:0db8:0001:0002:ffff::9",
      "2001:db8:1:2:aaaa:bbbb:cccc:dddd",
      "[2001:db8:1:2::5]",
    ];
    for (let i = 0; i < ips.length; i++) {
      expect(await h.submit({ ...VALID, email: email(i) }, ips[i]!)).toEqual({ ok: true });
    }
    const res = await h.submit({ ...VALID, email: email(9) }, "2001:db8:1:2::77");
    expect(res.ok).toBe(false);
    // A neighbouring /64 is a different budget.
    expect(await h.submit({ ...VALID, email: email(10) }, "2001:db8:1:3::1")).toEqual({ ok: true });
  });

  test("per email: 3 an hour across IPs, case and +tags folded", async () => {
    const h = harness();
    expect(await h.submit({ ...VALID, email: "guest@example.com" })).toEqual({ ok: true });
    expect(await h.submit({ ...VALID, email: "Guest@Example.com" })).toEqual({ ok: true });
    expect(await h.submit({ ...VALID, email: "guest+pool@example.com" })).toEqual({ ok: true });
    const res = await h.submit({ ...VALID, email: "guest+again@example.com" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("rate_limited");
    expect(outbound).toHaveLength(3);
    expect(h.logs.at(-1)).toContain("limiter=per-email");
    // Not the guest's address in the log line.
    expect(h.logs.join("\n")).not.toContain("guest@example.com");
  });

  test("global: 30 an hour no matter who sends, then refused until the window slides", async () => {
    const h = harness();
    for (let i = 0; i < INQUIRY_RATE_LIMITS.global.limit; i++) {
      expect(await h.submit({ ...VALID, email: email(i) })).toEqual({ ok: true });
    }
    const res = await h.submit({ ...VALID, email: email(1000) });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("rate_limited");
    expect(outbound).toHaveLength(30);
    expect(h.logs.at(-1)).toContain("limiter=global");

    h.clock.t += HOUR - 1;
    expect((await h.submit({ ...VALID, email: email(1001) })).ok).toBe(false);
    h.clock.t += 2;
    expect(await h.submit({ ...VALID, email: email(1002) })).toEqual({ ok: true });
  });

  test("global cap holds under concurrent submissions", async () => {
    const h = harness({
      // Slow read, so every request passes the first check before any records.
      read: async () => {
        await new Promise((r) => setTimeout(r, 5));
        return { result: LISTING, servedBy: "mirror", source: "mirror-only" };
      },
    });
    const results = await Promise.all(
      Array.from({ length: 45 }, (_, i) => h.submit({ ...VALID, email: email(i) })),
    );
    expect(results.filter((r) => r.ok)).toHaveLength(30);
    expect(outbound).toHaveLength(30);
  });

  test("no IP: the per-IP cap is skipped, email and global caps still apply", async () => {
    const h = harness();
    for (let i = 0; i < 3; i++) {
      expect(await h.submit({ ...VALID }, null)).toEqual({ ok: true });
    }
    expect((await h.submit({ ...VALID }, null)).ok).toBe(false);
    expect(h.limiter.perIp.size).toBe(0);
  });

  test("a failed send still spends the email budget (no retry storms)", async () => {
    const h = harness();
    emailitReply = () => new Response("boom", { status: 500 });
    for (let i = 0; i < 3; i++) {
      const r = await h.submit({ ...VALID });
      if (!r.ok) expect(r.reason).toBe("unavailable");
    }
    const res = await h.submit({ ...VALID });
    if (!res.ok) expect(res.reason).toBe("rate_limited");
    else throw new Error("expected rate_limited");
    expect(outbound).toHaveLength(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Listing read
// ─────────────────────────────────────────────────────────────────────────────

describe("listing read", () => {
  test("not found: clear error, no email", async () => {
    const h = harness({
      read: async () => ({ result: null, servedBy: "mirror", source: "mirror-only" }),
    });
    const res = await h.submit(VALID);
    expect(res).toEqual({
      ok: false,
      reason: "listing_not_found",
      message: "We couldn't find this pool. It may have been taken down.",
    });
    expect(outbound).toHaveLength(0);
  });

  test("mirror-only unserviceable: reported as unavailable, not as not-found", async () => {
    const h = harness({
      read: async () => ({
        result: null,
        servedBy: "unserviceable",
        source: "mirror-only",
        degraded: { droppedOpts: [], message: "This listing is temporarily unavailable." },
      }),
    });
    const res = await h.submit(VALID);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("listing_unavailable");
    expect(outbound).toHaveLength(0);
    expect(h.logs).toEqual([
      `error [listing-inquiry] NOT SENT listing=${LISTING_ID} reason=listing_unserviceable source=mirror-only`,
    ]);
  });

  test("a throwing read is unavailable, not a crash", async () => {
    const h = harness({
      read: async () => {
        throw new Error("supabase exploded");
      },
    });
    const res = await h.submit(VALID);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("listing_unavailable");
    expect(outbound).toHaveLength(0);
  });

  test("the read uses the id from the payload, trimmed", async () => {
    const h = harness();
    await h.submit({ ...VALID, listingId: ` ${LISTING_ID} ` });
    expect(h.reads).toEqual([LISTING_ID]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Emailit failure and missing key
// ─────────────────────────────────────────────────────────────────────────────

describe("Emailit failure", () => {
  const UNAVAILABLE = {
    ok: false,
    reason: "unavailable",
    message: "Your message couldn't be sent just now. Please email us instead.",
  };

  test("a 500 tells the visitor plainly and logs one line with no guest data", async () => {
    const h = harness();
    emailitReply = () =>
      new Response(`{"error":"bad","echo":"${VALID.message}","to":"guest@example.com"}`, {
        status: 500,
        statusText: "Internal Server Error",
      });
    const res = await h.submit(VALID);
    expect(res).toEqual(UNAVAILABLE as InquiryResult);
    expect(outbound).toHaveLength(1);
    expect(h.logs).toEqual([
      `error [listing-inquiry] NOT SENT listing=${LISTING_ID} reason=emailit_error status=500; ` +
        "visitor shown the email-us fallback",
    ]);
    const logged = h.logs.join("\n");
    expect(logged).not.toContain(VALID.message);
    expect(logged).not.toContain("guest@example.com");
    expect(logged).not.toContain("Test Guest");
  });

  test("a 429 is the same plain failure", async () => {
    const h = harness();
    emailitReply = () =>
      new Response("slow down", { status: 429, headers: { "Retry-After": "30" } });
    expect(await h.submit(VALID)).toEqual(UNAVAILABLE as InquiryResult);
    expect(h.logs[0]).toContain("status=429");
  });

  test("a network error is the same plain failure", async () => {
    const h = harness();
    emailitReply = () => {
      throw new TypeError("fetch failed");
    };
    expect(await h.submit(VALID)).toEqual(UNAVAILABLE as InquiryResult);
    expect(h.logs[0]).toContain("reason=send_threw");
  });

  test("missing EMAILIT_API_KEY: no read, no request, one log line", async () => {
    const h = harness({ env: {} });
    expect(await h.submit(VALID)).toEqual(UNAVAILABLE as InquiryResult);
    expect(outbound).toHaveLength(0);
    expect(h.reads).toHaveLength(0);
    expect(h.logs).toHaveLength(1);
    expect(h.logs[0]).toContain("reason=missing_api_key");
    expect(h.logs[0]).not.toContain(VALID.message);
  });

  test("key gone from the process env at send time: sendViaEmailit refuses before fetch", async () => {
    const h = harness();
    delete process.env.EMAILIT_API_KEY;
    try {
      expect(await h.submit(VALID)).toEqual(UNAVAILABLE as InquiryResult);
      expect(outbound).toHaveLength(0);
      expect(h.logs[0]).toContain("reason=emailit_error status=500");
    } finally {
      process.env.EMAILIT_API_KEY = FAKE_KEY;
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Insurance flag (CLAUDE.md rule 8)
// ─────────────────────────────────────────────────────────────────────────────

describe("insurance flag", () => {
  test("flagged in the subject and the first line of both parts; visitor sees plain success", async () => {
    const h = harness();
    const res = await h.submit({
      ...VALID,
      message: "Does your insurance cover us if one of the kids gets hurt?",
    });
    // Same confirmation as any other inquiry: nothing answers the question.
    expect(res).toEqual({ ok: true });

    const body = outbound[0]!.body;
    expect(body.subject).toBe(
      "[Insurance question - Derek] Pool inquiry: Test Pool Listing (Testville, TX)",
    );
    const firstLine = String(body.text).split("\n")[0]!;
    expect(firstLine).toStartWith("INSURANCE QUESTION");
    expect(firstLine).toContain("must be answered by Derek");
    const html = String(body.html);
    expect(html.indexOf("must be answered by Derek")).toBeGreaterThan(-1);
    expect(html.indexOf("must be answered by Derek")).toBeLessThan(html.indexOf("<table"));
    // The routing is the only thing added: no coverage statement of any kind.
    expect(`${body.text}${body.html}`).not.toMatch(
      /\$\d|covers you|is covered|not covered|included/i,
    );
    expect(h.logs.at(-1)).toContain("insurance_flag=yes");
  });

  test("terms that route to Derek", () => {
    for (const msg of [
      "do you have insurance?",
      "are we insured while swimming",
      "who carries the liability",
      "are you liable if",
      "what is the coverage",
      "how do I file a claim",
      "past claims on this pool?",
      "what if we damage the deck",
      "it was damaged last time",
      "if someone has an injury",
      "if someone is injured",
    ]) {
      expect(mentionsInsurance(msg)).toBe(true);
    }
  });

  test("ordinary pool questions are not flagged", async () => {
    for (const msg of [
      "Is there a covered patio with shade?",
      "Love the reclaimed wood deck",
      "Is the pool heated in December?",
      "Can we bring a cake and a speaker?",
    ]) {
      expect(mentionsInsurance(msg)).toBe(false);
    }
    const h = harness();
    await h.submit({ ...VALID, message: "Is there a covered patio with shade?" });
    expect(String(outbound[0]!.body.subject)).toStartWith("Pool inquiry:");
    expect(String(outbound[0]!.body.text)).not.toContain("INSURANCE QUESTION");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

describe("helpers", () => {
  test("ipBucket", () => {
    expect(ipBucket(null)).toBeNull();
    expect(ipBucket("")).toBeNull();
    expect(ipBucket("  ")).toBeNull();
    expect(ipBucket("203.0.113.7")).toBe("203.0.113.7");
    expect(ipBucket("::ffff:203.0.113.7")).toBe("203.0.113.7");
    expect(ipBucket("2001:DB8:1:2::1")).toBe("2001:db8:1:2::/64");
    expect(ipBucket("2001:0db8:0001:0002:0000:0000:0000:0001")).toBe("2001:db8:1:2::/64");
    expect(ipBucket("fe80::1%eth0")).toBe("fe80:0:0:0::/64");
    expect(ipBucket("garbage")).toBe("raw:garbage");
    expect(ipBucket("x".repeat(500))!.length).toBeLessThanOrEqual(68);
  });

  test("emailBucket folds case and +tags", () => {
    expect(emailBucket("Guest+Pool@Example.COM")).toBe("guest@example.com");
    expect(emailBucket("guest@example.com")).toBe("guest@example.com");
    expect(emailBucket("+tag@example.com")).toBe("+tag@example.com");
  });

  test("headerSafe flattens and caps", () => {
    expect(headerSafe("a\r\nb\tc\u2028d\u0000e")).toBe("a b c de");
    expect(headerSafe(null)).toBe("");
    expect(headerSafe("x".repeat(50), 10)).toBe(`${"x".repeat(9)}…`);
  });

  test("SlidingWindowCounter keeps memory bounded", () => {
    const c = new SlidingWindowCounter(1, HOUR, 100);
    for (let i = 0; i < 1000; i++) c.record(`k${i}`, NOW);
    expect(c.size).toBe(100);
    // The most recent keys are the ones kept.
    expect(c.allows("k999", NOW)).toBe(false);
    expect(c.allows("k0", NOW)).toBe(true);
  });

  test("SlidingWindowCounter forgets hits outside the window", () => {
    const c = new SlidingWindowCounter(2, HOUR);
    c.record("a", NOW);
    c.record("a", NOW + 10);
    expect(c.allows("a", NOW + 20)).toBe(false);
    expect(c.allows("a", NOW + HOUR + 1)).toBe(true);
    expect(c.allows("a", NOW + HOUR + 11)).toBe(true);
    expect(c.size).toBe(0);
  });
});
