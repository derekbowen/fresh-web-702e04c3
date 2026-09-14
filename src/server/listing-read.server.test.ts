/**
 * Facade routing tests — which backend actually answers, per flag.
 *
 * The Sharetribe and Supabase modules are mocked, so these run with no network
 * and no database. What is under test is the decision logic: that "sharetribe"
 * is genuinely the legacy path, that "mirror" never silently downgrades an
 * unsupported query, and that "shadow" never changes what callers receive.
 *
 * Run: bun test src/server/listing-read.server.test.ts
 */
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

const calls: string[] = [];

const LEGACY_RESULT = {
  listings: [
    {
      id: "legacy-1",
      slug: "s",
      title: "Legacy",
      description: "",
      price: null,
      city: null,
      state: null,
      imageUrl: null,
      url: "/l/s/legacy-1",
      geolocation: null,
    },
  ],
  total: 1,
  page: 1,
  totalPages: 1,
};
const DIRECT_RESULT = {
  listings: [
    {
      id: "direct-1",
      slug: "s",
      title: "Direct",
      description: "",
      price: null,
      city: null,
      state: null,
      imageUrl: null,
      url: "/l/s/direct-1",
      geolocation: null,
    },
  ],
  total: 1,
  page: 1,
  totalPages: 1,
};
const MIRROR_RESULT = {
  listings: [
    {
      id: "mirror-1",
      slug: "s",
      title: "Mirror",
      description: "",
      price: null,
      city: null,
      state: null,
      imageUrl: null,
      url: "/l/s/mirror-1",
      geolocation: null,
    },
  ],
  total: 1,
  page: 1,
  totalPages: 1,
};

/** Flipped per-test to simulate a broken mirror. */
let mirrorSearchReturns: unknown = MIRROR_RESULT;
let mirrorDetailReturns: unknown = { id: "mirror-1", title: "Mirror" };

mock.module("./sharetribe.server", () => ({
  EMPTY_LISTING_SEARCH_RESULT: { listings: [], total: 0, page: 1, totalPages: 0 },
  searchListings: async () => {
    calls.push("legacy:searchListings");
    return LEGACY_RESULT;
  },
  searchListingsFromSharetribe: async () => {
    calls.push("direct:searchListingsFromSharetribe");
    return DIRECT_RESULT;
  },
  searchListingsFromMirror: async () => {
    calls.push("mirror:searchListingsFromMirror");
    return mirrorSearchReturns;
  },
  fetchListing: async () => {
    calls.push("legacy:fetchListing");
    return { listing: { id: "legacy-1", title: "Legacy" }, raw: {} };
  },
  fetchListingFromMirror: async () => {
    calls.push("mirror:fetchListingFromMirror");
    return mirrorDetailReturns;
  },
}));

const { readListing, readListingSearch, describeSearchOpts } =
  await import("./listing-read.server");

beforeEach(() => {
  calls.length = 0;
  mirrorSearchReturns = MIRROR_RESULT;
  mirrorDetailReturns = { id: "mirror-1", title: "Mirror" };
});

afterEach(() => {
  delete process.env.PRNM_LISTING_READ_SOURCE;
});

describe("sharetribe mode is the untouched legacy path", () => {
  test("unset flag delegates search to legacy searchListings and nothing else", async () => {
    const out = await readListingSearch({ citySlug: "austin" });
    expect(calls).toEqual(["legacy:searchListings"]);
    expect(out.servedBy).toBe("sharetribe");
    expect(out.result).toEqual(LEGACY_RESULT);
    expect(out.parity).toBeUndefined();
  });

  test("explicit sharetribe behaves identically to unset", async () => {
    process.env.PRNM_LISTING_READ_SOURCE = "sharetribe";
    await readListingSearch({ citySlug: "austin" });
    expect(calls).toEqual(["legacy:searchListings"]);
  });

  test("an invalid flag value falls back to legacy, never to the mirror", async () => {
    process.env.PRNM_LISTING_READ_SOURCE = "mirrror";
    const out = await readListingSearch({});
    expect(calls).toEqual(["legacy:searchListings"]);
    expect(out.servedBy).toBe("sharetribe");
  });

  test("detail reads delegate to legacy fetchListing", async () => {
    const out = await readListing("abc");
    expect(calls).toEqual(["legacy:fetchListing"]);
    expect(out.result).toEqual({ id: "legacy-1", title: "Legacy" });
  });
});

describe("mirror mode", () => {
  beforeEach(() => {
    process.env.PRNM_LISTING_READ_SOURCE = "mirror";
  });

  test("a serveable query is answered by the mirror alone", async () => {
    const out = await readListingSearch({ citySlug: "austin" });
    expect(calls).toEqual(["mirror:searchListingsFromMirror"]);
    expect(out.servedBy).toBe("mirror");
    expect(out.result).toEqual(MIRROR_RESULT);
  });

  test("an unsupported query falls back to Sharetribe and says so", async () => {
    const out = await readListingSearch({ origin: "30,-97" });
    expect(calls).toEqual(["direct:searchListingsFromSharetribe"]);
    expect(out.servedBy).toBe("sharetribe-fallback");
    expect(out.result).toEqual(DIRECT_RESULT);
  });

  test("a mirror that errors falls back rather than serving an empty page", async () => {
    mirrorSearchReturns = null;
    const out = await readListingSearch({ pub_category: "pool" });
    expect(calls).toEqual([
      "mirror:searchListingsFromMirror",
      "direct:searchListingsFromSharetribe",
    ]);
    expect(out.servedBy).toBe("sharetribe-fallback");
  });

  test("a mirror error on a city query returns empty, never nationwide listings", async () => {
    // Sharetribe has no citySlug filter, so falling back to it would answer with
    // the newest listings marketplace-wide under an Austin heading. Wrong
    // geography is worse than no results because nobody notices it.
    mirrorSearchReturns = null;
    const out = await readListingSearch({ citySlug: "austin" });
    expect(calls).toEqual(["mirror:searchListingsFromMirror"]);
    expect(out.servedBy).toBe("unserviceable");
    expect(out.result.listings).toEqual([]);
  });

  test("a query neither source can express returns empty rather than dropping a filter", async () => {
    // The mirror has no PostGIS index for `origin`; Sharetribe has no stateCode.
    const out = await readListingSearch({ stateCode: "TX", origin: "30.2,-97.7" });
    expect(calls).toEqual([]);
    expect(out.servedBy).toBe("unserviceable");
    expect(out.result.listings).toEqual([]);
  });

  test("a mirror returning zero rows is respected, not treated as failure", async () => {
    mirrorSearchReturns = { listings: [], total: 0, page: 1, totalPages: 0 };
    const out = await readListingSearch({ citySlug: "nowhere" });
    expect(calls).toEqual(["mirror:searchListingsFromMirror"]);
    expect(out.servedBy).toBe("mirror");
    expect(out.result.listings).toEqual([]);
  });

  test("detail reads come from the mirror", async () => {
    const out = await readListing("abc");
    expect(calls).toEqual(["mirror:fetchListingFromMirror"]);
    expect(out.result).toEqual({ id: "mirror-1", title: "Mirror" });
  });

  test("a mirror detail read of null means 'no such listing', not a failure", async () => {
    mirrorDetailReturns = null;
    const out = await readListing("abc");
    expect(calls).toEqual(["mirror:fetchListingFromMirror"]);
    expect(out.servedBy).toBe("mirror");
    expect(out.result).toBeNull();
  });

  test("a mirror detail read of undefined means the query errored, so it falls back", async () => {
    mirrorDetailReturns = undefined;
    const out = await readListing("abc");
    expect(calls).toEqual(["mirror:fetchListingFromMirror", "legacy:fetchListing"]);
    expect(out.servedBy).toBe("sharetribe-fallback");
  });
});

describe("shadow mode never changes what callers receive", () => {
  beforeEach(() => {
    process.env.PRNM_LISTING_READ_SOURCE = "shadow";
  });

  test("both sources are queried but Sharetribe's answer is returned", async () => {
    const out = await readListingSearch({ pub_category: "pool" });
    expect(calls.sort()).toEqual([
      "direct:searchListingsFromSharetribe",
      "mirror:searchListingsFromMirror",
    ]);
    expect(out.servedBy).toBe("sharetribe");
    expect(out.result).toEqual(DIRECT_RESULT);
  });

  test("divergence is reported and marks the read non-serveable", async () => {
    const out = await readListingSearch({ pub_category: "pool" });
    expect(out.parity).toBeDefined();
    expect(out.parity!.mirrorCanServe).toBe(false);
    const codes = out.parity!.findings.map((f) => f.code);
    expect(codes).toContain("listing-missing-from-mirror-page");
    expect(codes).toContain("listing-extra-in-mirror-page");
  });

  test("agreement yields a clean report", async () => {
    mirrorSearchReturns = DIRECT_RESULT;
    const out = await readListingSearch({ pub_category: "pool" });
    expect(out.parity!.findings).toEqual([]);
    expect(out.parity!.mirrorCanServe).toBe(true);
  });

  test("an unsupported query is reported as unsupported, and the mirror is not queried", async () => {
    const out = await readListingSearch({ keywords: "saltwater" });
    expect(calls).toEqual(["direct:searchListingsFromSharetribe"]);
    expect(out.result).toEqual(DIRECT_RESULT);
    expect(out.parity!.findings.map((f) => f.code)).toEqual(["not-comparable"]);
    expect(out.parity!.mirrorCanServe).toBe(false);
  });

  test("an unsupported query does NOT report parity by comparing Sharetribe to itself", async () => {
    // Diffing a result against itself is structurally guaranteed clean, which
    // would claim perfect parity for exactly the queries that have none.
    const out = await readListingSearch({ keywords: "saltwater" });
    expect(out.parity!.findings.map((f) => f.code)).not.toContain("field-mismatch:id");
    expect(out.parity!.findings).toHaveLength(1);
    expect(out.parity!.findings[0].detail).toContain("not evidence of parity");
  });

  test("a city query is served by the legacy router, not by an unfiltered Sharetribe call", async () => {
    // The whole promise of shadow mode is that it never changes what callers
    // get. Sharetribe cannot express citySlug, so calling it would return
    // nationwide listings and break that promise on every city hub page.
    const out = await readListingSearch({ citySlug: "austin" });
    expect(calls).toEqual(["legacy:searchListings"]);
    expect(out.servedBy).toBe("legacy");
    expect(out.result).toEqual(LEGACY_RESULT);
    expect(out.parity!.findings.map((f) => f.code)).toEqual(["not-comparable"]);
  });

  test("a state query is likewise served by the legacy router", async () => {
    const out = await readListingSearch({ stateCode: "TX" });
    expect(calls).toEqual(["legacy:searchListings"]);
    expect(out.servedBy).toBe("legacy");
  });

  test("a mirror error is recorded as a finding, and Sharetribe still answers", async () => {
    mirrorSearchReturns = null;
    const out = await readListingSearch({ pub_category: "pool" });
    expect(out.result).toEqual(DIRECT_RESULT);
    expect(out.parity!.findings.map((f) => f.code)).toContain("mirror-query-errored");
  });

  test("detail reads query both and return Sharetribe's", async () => {
    const out = await readListing("abc");
    expect(calls.sort()).toEqual(["legacy:fetchListing", "mirror:fetchListingFromMirror"]);
    expect(out.result).toEqual({ id: "legacy-1", title: "Legacy" });
    expect(out.parity).toBeDefined();
  });

  test("a mirror detail error is a finding, not a thrown request", async () => {
    mirrorDetailReturns = undefined;
    const out = await readListing("abc");
    expect(out.result).toEqual({ id: "legacy-1", title: "Legacy" });
    expect(out.parity!.findings.map((f) => f.code)).toContain("mirror-query-errored");
  });
});

describe("describeSearchOpts", () => {
  test("is stable regardless of key order, so parity records key consistently", () => {
    expect(describeSearchOpts({ perPage: 24, citySlug: "austin" })).toBe(
      describeSearchOpts({ citySlug: "austin", perPage: 24 }),
    );
  });

  test("omits empty values and labels the unfiltered query", () => {
    expect(describeSearchOpts({})).toBe("search(all)");
    expect(describeSearchOpts({ citySlug: "austin", keywords: "" })).toBe(
      "search(citySlug=austin)",
    );
  });
});
