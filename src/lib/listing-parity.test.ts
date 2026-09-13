/**
 * Deterministic parity tests. No network, no database, no clock — every case is
 * a fixture, so the same input always produces the same findings.
 *
 * Run: bun test src/lib/listing-parity.test.ts
 */
import { describe, expect, test } from "bun:test";
import {
  buildParityReport,
  classifyImageUrl,
  deepEqual,
  diffListing,
  diffSearchResult,
  formatParityReport,
  sharetribeImageIds,
  SHARETRIBE_IMAGE_HOST,
  type ListingLike,
  type ParityFinding,
} from "./listing-parity";
import {
  DEFAULT_LISTING_READ_SOURCE,
  mirrorCanServe,
  mirrorUnsupportedOptsFor,
  resolveListingReadSource,
} from "./listing-read-source";

const MARKETPLACE = "672444e2-9969-433a-b885-743775a6824c";
const IMG_A = "6a74ba39-a544-4e70-9927-7e265422db70";
const IMG_B = "6a728312-0de2-4766-8144-d45e538c24b1";

const stImage = (imageId: string, variantQuery = "auto=format&fit=crop&h=480&w=480") =>
  `https://${SHARETRIBE_IMAGE_HOST}/${MARKETPLACE}/${imageId}?${variantQuery}&s=4a0a4df147d7228754c0f7b1fb92b5eb`;

/** A listing as the Sharetribe read returns it. */
const baseSharetribe = (over: ListingLike = {}): ListingLike => ({
  id: "11111111-1111-4111-8111-111111111111",
  slug: "sunny-backyard-pool",
  title: "Sunny Backyard Pool",
  description: "A warm saltwater pool.",
  price: { amount: 8050, currency: "USD" },
  city: "Austin",
  state: "TX",
  imageUrl: stImage(IMG_A),
  url: "/l/sunny-backyard-pool/11111111-1111-4111-8111-111111111111",
  geolocation: { lat: 30.2672, lng: -97.7431 },
  ...over,
});

/** The same listing as the mirror read returns it. */
const baseMirror = (over: ListingLike = {}): ListingLike => ({
  ...baseSharetribe(),
  ...over,
});

const codes = (f: ParityFinding[]) => f.map((x) => x.code).sort();
const byField = (f: ParityFinding[], field: string) => f.filter((x) => x.field === field);

// ─────────────────────────────────────────────────────────────────────────────

describe("flag resolution", () => {
  test("unset defaults to sharetribe so a missing var never moves production", () => {
    const r = resolveListingReadSource({});
    expect(r.source).toBe("sharetribe");
    expect(r.source).toBe(DEFAULT_LISTING_READ_SOURCE);
    expect(r.invalid).toBe(false);
  });

  test.each(["sharetribe", "mirror", "shadow"] as const)("accepts %s", (v: string) => {
    expect(resolveListingReadSource({ PRNM_LISTING_READ_SOURCE: v }).source).toBe(v);
  });

  test("is case- and whitespace-insensitive (these get hand-edited in pm2 env files)", () => {
    expect(resolveListingReadSource({ PRNM_LISTING_READ_SOURCE: "  MIRROR " }).source).toBe(
      "mirror",
    );
    expect(resolveListingReadSource({ PRNM_LISTING_READ_SOURCE: "Shadow" }).source).toBe("shadow");
  });

  test("a typo falls back to sharetribe and is flagged, never silently to mirror", () => {
    const r = resolveListingReadSource({ PRNM_LISTING_READ_SOURCE: "mirrror" });
    expect(r.source).toBe("sharetribe");
    expect(r.invalid).toBe(true);
    expect(r.raw).toBe("mirrror");
  });

  test("empty string is treated as unset, not as invalid", () => {
    const r = resolveListingReadSource({ PRNM_LISTING_READ_SOURCE: "   " });
    expect(r.source).toBe("sharetribe");
    expect(r.invalid).toBe(false);
  });
});

describe("mirror capability", () => {
  test("city / state / citySlug queries are serveable", () => {
    expect(mirrorCanServe({ citySlug: "austin" })).toBe(true);
    expect(mirrorCanServe({ city: "Austin", stateCode: "TX" })).toBe(true);
    expect(mirrorCanServe({ page: 2, perPage: 24 })).toBe(true);
  });

  test.each(["origin", "bounds", "keywords"] as const)(
    "%s is reported unsupported rather than downgraded",
    (key: string) => {
      expect(mirrorUnsupportedOptsFor({ [key]: "x" })).toEqual([key]);
      expect(mirrorCanServe({ [key]: "x" })).toBe(false);
    },
  );

  test("empty, null and undefined values do not count as requested filters", () => {
    expect(mirrorUnsupportedOptsFor({ origin: "", bounds: undefined, keywords: null })).toEqual([]);
  });

  test("reports every unsupported opt, not just the first", () => {
    expect(
      mirrorUnsupportedOptsFor({ origin: "30,-97", keywords: "saltwater", citySlug: "austin" }),
    ).toEqual(["origin", "keywords"]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("image classification — the migration blocker", () => {
  test("a signed Sharetribe imgix URL is recognised as dying with Sharetribe", () => {
    const f = classifyImageUrl(stImage(IMG_A));
    expect(f.host).toBe(SHARETRIBE_IMAGE_HOST);
    expect(f.sharetribeHosted).toBe(true);
    expect(f.signed).toBe(true);
    expect(f.marketplaceId).toBe(MARKETPLACE);
    expect(f.imageId).toBe(IMG_A);
    expect(f.diesWithSharetribe).toBe(true);
  });

  test("the image UUID is recoverable from the path — this is the Phase 1b download worklist", () => {
    expect(sharetribeImageIds([stImage(IMG_A), stImage(IMG_B), stImage(IMG_A)]).sort()).toEqual(
      [IMG_A, IMG_B].sort(),
    );
  });

  test("a PRNM-hosted URL survives cutover", () => {
    const f = classifyImageUrl("https://cdn.poolrentalnearme.com/listings/abc/hero.jpg");
    expect(f.sharetribeHosted).toBe(false);
    expect(f.diesWithSharetribe).toBe(false);
  });

  test("non-URL and empty values classify without throwing", () => {
    for (const v of ["", "   ", "not a url", null, undefined, 42, {}]) {
      const f = classifyImageUrl(v as unknown);
      expect(f.sharetribeHosted).toBe(false);
      expect(f.diesWithSharetribe).toBe(false);
      expect(f.imageId).toBeNull();
    }
  });

  test("a Sharetribe URL without a signature is still Sharetribe-hosted", () => {
    const f = classifyImageUrl(`https://${SHARETRIBE_IMAGE_HOST}/${MARKETPLACE}/${IMG_A}`);
    expect(f.signed).toBe(false);
    expect(f.diesWithSharetribe).toBe(true);
    expect(f.imageId).toBe(IMG_A);
  });

  test("non-UUID path segments do not produce a bogus imageId", () => {
    const f = classifyImageUrl(`https://${SHARETRIBE_IMAGE_HOST}/assets/logo.png`);
    expect(f.marketplaceId).toBeNull();
    expect(f.imageId).toBeNull();
  });

  test("every listing with a hero image raises a blocking durability finding", () => {
    const f = diffListing(baseSharetribe(), baseMirror());
    const durability = f.filter((x) => x.code === "image-host-dies-with-sharetribe");
    expect(durability.length).toBeGreaterThan(0);
    expect(durability.every((x) => x.severity === "blocking")).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("identical listings produce no field findings", () => {
  test("only the image-durability finding remains when both sources agree", () => {
    const f = diffListing(baseSharetribe(), baseMirror());
    const nonImage = f.filter((x) => x.code !== "image-host-dies-with-sharetribe");
    expect(nonImage).toEqual([]);
  });

  test("a listing with no image at all yields zero findings", () => {
    const f = diffListing(baseSharetribe({ imageUrl: null }), baseMirror({ imageUrl: null }));
    expect(f).toEqual([]);
  });
});

describe("field-level parity", () => {
  test("id mismatch is blocking", () => {
    const f = byField(diffListing(baseSharetribe(), baseMirror({ id: "other" })), "id");
    expect(f[0]?.severity).toBe("blocking");
    expect(f[0]?.code).toBe("field-mismatch:id");
  });

  test("title mismatch is blocking", () => {
    const f = byField(diffListing(baseSharetribe(), baseMirror({ title: "Renamed" })), "title");
    expect(f[0]?.severity).toBe("blocking");
  });

  test("description mismatch is degraded, and reported rather than trimmed away", () => {
    const f = byField(
      diffListing(baseSharetribe(), baseMirror({ description: "A warm saltwater pool. " })),
      "description",
    );
    expect(f).toHaveLength(1);
    expect(f[0]?.severity).toBe("degraded");
  });

  test("the real slug divergence between the two sources is caught", () => {
    // sharetribe.server.ts slugify(title); listing-sync.server.ts slugify(`${title}-${id.slice(0,8)}`)
    const st = baseSharetribe();
    const mi = baseMirror({
      slug: "sunny-backyard-pool-11111111",
      url: "/l/sunny-backyard-pool-11111111/11111111-1111-4111-8111-111111111111",
    });
    const f = diffListing(st, mi);
    expect(codes(f)).toContain("field-mismatch:slug");
    expect(codes(f)).toContain("field-mismatch:url");
    expect(byField(f, "slug")[0]?.severity).toBe("blocking");
    expect(byField(f, "url")[0]?.severity).toBe("blocking");
  });

  test("a field the mirror omits entirely is reported", () => {
    const mi = baseMirror();
    delete mi.description;
    const f = byField(diffListing(baseSharetribe(), mi), "description");
    expect(f[0]?.code).toBe("field-absent-from-mirror");
  });

  test("a field only the mirror returns is cosmetic, not silently dropped", () => {
    const f = byField(diffListing(baseSharetribe(), baseMirror({ extra: 1 })), "extra");
    expect(f).toHaveLength(0); // not in the compared field list
    const withKnown = diffListing(
      (() => {
        const st = baseSharetribe();
        delete st.city;
        return st;
      })(),
      baseMirror(),
    );
    expect(byField(withKnown, "city")[0]?.code).toBe("field-only-in-mirror");
    expect(byField(withKnown, "city")[0]?.severity).toBe("cosmetic");
  });

  test("author/provider reference mismatch is reported", () => {
    const f = byField(
      diffListing(
        baseSharetribe({ authorId: "aaaaaaaa-0000-4000-8000-000000000001" }),
        baseMirror({ authorId: "bbbbbbbb-0000-4000-8000-000000000002" }),
      ),
      "authorId",
    );
    expect(f).toHaveLength(1);
    expect(f[0]?.code).toBe("field-mismatch:authorId");
  });
});

describe("price parity — money is never allowed to drift", () => {
  test("a different amount is blocking", () => {
    const f = byField(
      diffListing(baseSharetribe(), baseMirror({ price: { amount: 7700, currency: "USD" } })),
      "price.amount",
    );
    expect(f[0]?.severity).toBe("blocking");
    expect(f[0]?.code).toBe("price-amount-mismatch");
  });

  test("a NUMERIC string round-trip is cosmetic but still reported", () => {
    const f = byField(
      diffListing(baseSharetribe(), baseMirror({ price: { amount: "8050", currency: "USD" } })),
      "price.amount",
    );
    expect(f).toHaveLength(1);
    expect(f[0]?.severity).toBe("cosmetic");
    expect(f[0]?.code).toBe("price-amount-type-differs");
  });

  test("a currency mismatch is blocking", () => {
    const f = byField(
      diffListing(baseSharetribe(), baseMirror({ price: { amount: 8050, currency: "GBP" } })),
      "price.currency",
    );
    expect(f[0]?.severity).toBe("blocking");
  });

  test("a missing price on one side is blocking", () => {
    const f = byField(diffListing(baseSharetribe(), baseMirror({ price: null })), "price");
    expect(f[0]?.severity).toBe("blocking");
    expect(f[0]?.code).toBe("price-mismatch");
  });
});

describe("geolocation parity", () => {
  test("NUMERIC-as-string coordinates are cosmetic", () => {
    const f = byField(
      diffListing(
        baseSharetribe(),
        baseMirror({ geolocation: { lat: "30.2672", lng: "-97.7431" } }),
      ),
      "geolocation",
    );
    expect(f[0]?.severity).toBe("cosmetic");
  });

  test("genuinely different coordinates are degraded", () => {
    const f = byField(
      diffListing(baseSharetribe(), baseMirror({ geolocation: { lat: 32.7767, lng: -96.797 } })),
      "geolocation",
    );
    expect(f[0]?.severity).toBe("degraded");
    expect(f[0]?.code).toBe("geolocation-mismatch");
  });

  test("a null geolocation in the mirror is reported (map pins and distance sort need it)", () => {
    const f = byField(
      diffListing(baseSharetribe(), baseMirror({ geolocation: null })),
      "geolocation",
    );
    expect(f).toHaveLength(1);
  });
});

describe("availability-related public fields and extended data", () => {
  const pd = {
    poolType: "in-ground",
    maxGuests: 12,
    poolAmenities: ["heated", "diving-board"],
    availabilityPlanTimezone: "America/Chicago",
    minimumBookingHours: 2,
  };

  test("identical publicData yields no findings", () => {
    const f = diffListing(
      baseSharetribe({ publicData: pd, imageUrl: null }),
      baseMirror({ publicData: { ...pd }, imageUrl: null }),
    );
    expect(f).toEqual([]);
  });

  test("a changed availability field is reported by key", () => {
    const f = diffListing(
      baseSharetribe({ publicData: pd, imageUrl: null }),
      baseMirror({
        publicData: { ...pd, availabilityPlanTimezone: "America/New_York" },
        imageUrl: null,
      }),
    );
    expect(byField(f, "publicData.availabilityPlanTimezone")[0]?.code).toBe(
      "publicData-key-mismatch",
    );
  });

  test("a key missing from the mirror is named", () => {
    const { minimumBookingHours: _omit, ...withoutMin } = pd;
    const f = diffListing(
      baseSharetribe({ publicData: pd, imageUrl: null }),
      baseMirror({ publicData: withoutMin, imageUrl: null }),
    );
    expect(byField(f, "publicData.minimumBookingHours")[0]?.code).toBe(
      "publicData-key-absent-from-mirror",
    );
  });

  test("a key the mirror kept after upstream removal is named as stale", () => {
    const { poolType: _omit, ...withoutPoolType } = pd;
    const f = diffListing(
      baseSharetribe({ publicData: withoutPoolType, imageUrl: null }),
      baseMirror({ publicData: pd, imageUrl: null }),
    );
    expect(byField(f, "publicData.poolType")[0]?.code).toBe("publicData-key-stale-in-mirror");
  });

  test("metadata is compared on the same terms as publicData", () => {
    const f = diffListing(
      baseSharetribe({ metadata: { boosted: true }, imageUrl: null }),
      baseMirror({ metadata: { boosted: false }, imageUrl: null }),
    );
    expect(byField(f, "metadata.boosted")[0]?.code).toBe("metadata-key-mismatch");
  });

  test("a scope only one source returns is not compared (absence is not a diff)", () => {
    const f = diffListing(
      baseSharetribe({ publicData: pd, imageUrl: null }),
      baseMirror({ imageUrl: null }),
    );
    expect(f.filter((x) => x.field.startsWith("publicData"))).toEqual([]);
  });

  test("nested publicData differences are caught, not shallow-compared away", () => {
    const f = diffListing(
      baseSharetribe({
        publicData: { location: { city: "Austin", zip: "78701" } },
        imageUrl: null,
      }),
      baseMirror({ publicData: { location: { city: "Austin", zip: "78702" } }, imageUrl: null }),
    );
    expect(byField(f, "publicData.location")[0]?.code).toBe("publicData-key-mismatch");
  });
});

describe("closed and deleted listings", () => {
  test("a listing Sharetribe dropped but the mirror still serves is blocking", () => {
    const f = diffListing(null, baseMirror());
    expect(f).toHaveLength(1);
    expect(f[0]?.code).toBe("listing-only-in-mirror");
    expect(f[0]?.severity).toBe("blocking");
  });

  test("a listing the mirror has not seen yet is blocking", () => {
    const f = diffListing(baseSharetribe(), null);
    expect(f).toHaveLength(1);
    expect(f[0]?.code).toBe("listing-missing-from-mirror");
  });

  test("both absent is not a finding", () => {
    expect(diffListing(null, null)).toEqual([]);
    expect(diffListing(undefined, undefined)).toEqual([]);
  });

  test("a lifecycle state difference is reported", () => {
    const f = byField(
      diffListing(
        baseSharetribe({ listingState: "published", imageUrl: null }),
        baseMirror({ listingState: "closed", imageUrl: null }),
      ),
      "listingState",
    );
    expect(f).toHaveLength(1);
    expect(f[0]?.code).toBe("field-mismatch:listingState");
  });
});

describe("malformed and partially mirrored records", () => {
  test("a mirror row with null everywhere reports each field rather than throwing", () => {
    const f = diffListing(baseSharetribe(), {
      id: baseSharetribe().id,
      slug: null,
      title: null,
      description: null,
      price: null,
      city: null,
      state: null,
      imageUrl: null,
      url: null,
      geolocation: null,
    });
    expect(codes(f)).toContain("field-mismatch:title");
    expect(codes(f)).toContain("price-mismatch");
    expect(f.every((x) => typeof x.detail === "string" && x.detail.length > 0)).toBe(true);
  });

  test("an empty mirror object reports every Sharetribe field as absent", () => {
    const f = diffListing(baseSharetribe(), {});
    const absent = f.filter((x) => x.code === "field-absent-from-mirror");
    expect(absent.length).toBeGreaterThanOrEqual(7);
  });

  test("unexpected types do not throw", () => {
    expect(() =>
      diffListing(baseSharetribe({ price: "free" }), baseMirror({ price: [] })),
    ).not.toThrow();
    expect(() =>
      diffListing(baseSharetribe({ geolocation: "here" }), baseMirror({ geolocation: 0 })),
    ).not.toThrow();
    expect(() =>
      diffListing(baseSharetribe({ publicData: "nope" }), baseMirror({ publicData: 5 })),
    ).not.toThrow();
  });

  test("a numeric id on one side and a string id on the other is still matched, then reported", () => {
    const f = byField(diffListing(baseSharetribe({ id: 7 }), baseMirror({ id: "7" })), "id");
    expect(f).toHaveLength(1);
    expect(f[0]?.severity).toBe("blocking");
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("search result parity", () => {
  const listing = (id: string, over: ListingLike = {}) =>
    baseSharetribe({ id, imageUrl: null, ...over });

  const result = (ids: string[], over: Partial<Record<string, unknown>> = {}) => ({
    listings: ids.map((id) => listing(id)),
    total: ids.length,
    page: 1,
    totalPages: 1,
    ...over,
  });

  test("identical results yield no findings", () => {
    expect(diffSearchResult(result(["a", "b", "c"]), result(["a", "b", "c"]))).toEqual([]);
  });

  test("a listing missing from the mirror page is blocking", () => {
    const f = diffSearchResult(result(["a", "b"]), result(["a"], { total: 2 }));
    expect(codes(f)).toContain("listing-missing-from-mirror-page");
  });

  test("a listing absent from the mirror is reported once, not under two codes", () => {
    // Membership already covers it. Also running the per-listing diff against
    // `undefined` would emit listing-missing-from-mirror on top, double-counting
    // one problem and inflating byCode in the report.
    const f = diffSearchResult(result(["a", "b"]), result(["a"], { total: 2 }));
    expect(codes(f).filter((c) => c === "listing-missing-from-mirror-page")).toHaveLength(1);
    expect(codes(f)).not.toContain("listing-missing-from-mirror");
  });

  test("a listing extra in the mirror is likewise reported once", () => {
    const f = diffSearchResult(result(["a"]), result(["a", "z"], { total: 1 }));
    expect(codes(f).filter((c) => c === "listing-extra-in-mirror-page")).toHaveLength(1);
    expect(codes(f)).not.toContain("listing-only-in-mirror");
  });

  test("a stale extra listing in the mirror is blocking", () => {
    const f = diffSearchResult(result(["a"]), result(["a", "z"], { total: 1 }));
    expect(codes(f)).toContain("listing-extra-in-mirror-page");
  });

  test("ordering divergence is reported separately from membership", () => {
    const f = diffSearchResult(result(["a", "b", "c"]), result(["c", "b", "a"]));
    expect(codes(f)).toContain("ordering-mismatch");
    expect(codes(f)).not.toContain("listing-missing-from-mirror-page");
    expect(codes(f)).not.toContain("listing-extra-in-mirror-page");
  });

  test("membership differences do not masquerade as an ordering bug", () => {
    const f = diffSearchResult(result(["a", "b"]), result(["a", "b", "c"], { total: 2 }));
    expect(codes(f)).toContain("listing-extra-in-mirror-page");
    expect(codes(f)).not.toContain("ordering-mismatch");
  });

  test("a total mismatch is blocking — pagination controls and 'N pools' copy depend on it", () => {
    const f = byField(
      diffSearchResult(result(["a"]), result(["a"], { total: 99 })),
      "pagination.total",
    );
    expect(f[0]?.severity).toBe("blocking");
  });

  test("a stringified total is cosmetic but still reported", () => {
    const f = byField(
      diffSearchResult(result(["a"]), result(["a"], { total: "1" })),
      "pagination.total",
    );
    expect(f[0]?.severity).toBe("cosmetic");
  });

  test("page and totalPages differences are reported", () => {
    const f = diffSearchResult(result(["a"]), result(["a"], { page: 2, totalPages: 5 }));
    expect(codes(f)).toContain("pagination-page-mismatch");
    expect(codes(f)).toContain("pagination-totalPages-mismatch");
  });

  test("per-listing diffs are matched by id, so one inserted row does not shift every index", () => {
    const st = { ...result(["a", "b", "c"]) };
    const mi = {
      ...result(["a", "b", "c"]),
      listings: [listing("a"), listing("b", { title: "Changed" }), listing("c")],
    };
    const f = diffSearchResult(st, mi);
    const titleFindings = f.filter((x) => x.code === "field-mismatch:title");
    expect(titleFindings).toHaveLength(1);
    expect(titleFindings[0]?.field).toBe("listings[1].title");
  });

  test("unsupported query opts are surfaced as unsupported, not as zero findings", () => {
    const f = diffSearchResult(result(["a"]), result(["a"]), {
      unsupportedOpts: ["origin", "keywords"],
    });
    expect(f).toHaveLength(2);
    expect(f.every((x) => x.severity === "unsupported")).toBe(true);
    expect(f.map((x) => x.field)).toEqual(["query.origin", "query.keywords"]);
  });

  test("a missing result object on either side is blocking", () => {
    expect(codes(diffSearchResult(null, result(["a"])))).toContain("search-result-absent");
    expect(codes(diffSearchResult(result(["a"]), null))).toContain("search-result-absent");
  });

  test("empty results on both sides are equal", () => {
    expect(diffSearchResult(result([]), result([]))).toEqual([]);
  });

  test("a non-array listings field does not throw", () => {
    expect(() =>
      diffSearchResult({ listings: undefined as never, total: 0 }, result([])),
    ).not.toThrow();
  });

  test("listings with null ids do not collide into one bucket", () => {
    const st = {
      listings: [
        { id: null, title: "x" },
        { id: null, title: "y" },
      ],
      total: 2,
    };
    expect(() => diffSearchResult(st, st)).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("report", () => {
  const findings: ParityFinding[] = [
    { field: "a", severity: "blocking", code: "z-block", sharetribe: 1, mirror: 2, detail: "d" },
    { field: "b", severity: "blocking", code: "z-block", sharetribe: 1, mirror: 2, detail: "d" },
    { field: "c", severity: "cosmetic", code: "a-cos", sharetribe: 1, mirror: "1", detail: "d" },
    { field: "d", severity: "degraded", code: "m-deg", sharetribe: 1, mirror: 2, detail: "d" },
    {
      field: "e",
      severity: "unsupported",
      code: "q-uns",
      sharetribe: 1,
      mirror: null,
      detail: "d",
    },
  ];

  test("counts every severity, zero-filled", () => {
    const r = buildParityReport("test", 3, findings);
    expect(r.bySeverity).toEqual({ blocking: 2, unsupported: 1, degraded: 1, cosmetic: 1 });
  });

  test("blocking or unsupported findings mean the mirror cannot serve the read", () => {
    expect(buildParityReport("t", 1, findings).mirrorCanServe).toBe(false);
    expect(buildParityReport("t", 1, [findings[2]!, findings[3]!]).mirrorCanServe).toBe(true);
    expect(buildParityReport("t", 1, [findings[4]!]).mirrorCanServe).toBe(false);
  });

  test("no findings at all means the mirror can serve it", () => {
    const r = buildParityReport("t", 10, []);
    expect(r.mirrorCanServe).toBe(true);
    expect(r.byCode).toEqual([]);
  });

  test("byCode ordering is deterministic: severity, then count desc, then code", () => {
    const r = buildParityReport("t", 1, findings);
    expect(r.byCode.map((c) => c.code)).toEqual(["z-block", "q-uns", "m-deg", "a-cos"]);
  });

  test("the same input always formats to byte-identical output", () => {
    const a = formatParityReport(buildParityReport("run", 5, findings));
    const b = formatParityReport(buildParityReport("run", 5, findings));
    expect(a).toBe(b);
  });

  test("the formatted report names the verdict and every cause", () => {
    const text = formatParityReport(buildParityReport("city=austin", 5, findings));
    expect(text).toContain("mirror CANNOT serve this read");
    expect(text).toContain("city=austin");
    for (const f of findings) expect(text).toContain(f.code);
  });
});

describe("deepEqual", () => {
  test("distinguishes the cases the diff relies on", () => {
    expect(deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toBe(true);
    expect(deepEqual({ a: 1 }, { a: "1" })).toBe(false);
    expect(deepEqual([1, 2], [2, 1])).toBe(false);
    expect(deepEqual({ a: 1 }, { a: 1, b: undefined })).toBe(false);
    expect(deepEqual(null, undefined)).toBe(false);
    expect(deepEqual(NaN, NaN)).toBe(true);
    expect(deepEqual(0, -0)).toBe(true);
  });

  test("key order does not matter but key set does", () => {
    expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });
});
