/**
 * Deterministic tests for listing URL construction.
 *
 * The `createSlug` cases below are not invented expectations — they are the
 * output of the marketplace's own `createSlug` (poolrentalnearme-web,
 * src/util/urlHelpers.js), captured by running both implementations over the
 * same inputs. A differential run of 33 hand-picked cases plus 20,000 random
 * strings drawn from an alphabet covering the full transliteration table,
 * punctuation, CJK, emoji and whitespace produced identical output for every
 * input. These lock that in so a future edit cannot silently drift from the
 * pages the marketplace actually renders.
 *
 * Run: bun test src/lib/listing-url.test.ts
 */
import { describe, expect, test } from "bun:test";
import {
  canonicalListingPath,
  canonicalListingUrl,
  createSlug,
  listingPathWithSlug,
  LISTING_PATH_PREFIX,
  parseListingPath,
  slugDrift,
} from "./listing-url";

const ID = "685b3bd3-1e5d-44b8-9483-5f6452306157";

describe("createSlug — must agree with the marketplace, which owns /l/", () => {
  test.each([
    ["Katy StayCation Saltwater Getaway", "katy-staycation-saltwater-getaway"],
    ["Sunny Backyard Pool", "sunny-backyard-pool"],
    ["MiXeD CaSe TiTlE", "mixed-case-title"],
    ["  leading and trailing  ", "leading-and-trailing"],
    ["MULTIPLE   SPACES", "multiple-spaces"],
  ])("%s → %s", (input: string, expected: string) => {
    expect(createSlug(input)).toBe(expected);
  });

  test("transliterates accents instead of stripping them", () => {
    // The three slugify() copies this replaces produced "caf" — a different URL.
    expect(createSlug("Café Pool")).toBe("cafe-pool");
    expect(createSlug("Ñoño's Piscina")).toBe("nono-s-piscina");
    // ß maps to a single s in the marketplace's table, not the German "ss".
    expect(createSlug("ßeta Straße")).toBe("seta-strase");
  });

  test("expands the two multi-character transliterations", () => {
    expect(createSlug("Œuvre")).toBe("oeuvre");
    expect(createSlug("Ĳsselmeer")).toBe("ijsselmeer");
  });

  test("folds · / _ , : ; ' to hyphens rather than deleting them", () => {
    expect(createSlug("slash/and,comma:colon;semi'apostrophe")).toBe(
      "slash-and-comma-colon-semi-apostrophe",
    );
  });

  test("drops other punctuation and collapses the resulting hyphens", () => {
    expect(createSlug("Pool #1 — Best in Town!")).toBe("pool-1-best-in-town");
    expect(createSlug("Pool (Heated) [Saltwater] {Private}")).toBe("pool-heated-saltwater-private");
    expect(createSlug("100% Private Pool")).toBe("100-private-pool");
  });

  test("trims and collapses hyphens", () => {
    expect(createSlug("-leading-hyphens-")).toBe("leading-hyphens");
    expect(createSlug("hyphen--collapse---test")).toBe("hyphen-collapse-test");
    expect(createSlug("---")).toBe("no-slug");
  });

  test("does NOT truncate at 80 characters, unlike the copies it replaces", () => {
    const long =
      "A very long pool title that goes well past eighty characters to check truncation behaviour differences";
    expect(createSlug(long).length).toBeGreaterThan(80);
  });

  test("falls back to no-slug, not pool or listing", () => {
    // The two old copies disagreed here: "pool" in sharetribe.server.ts,
    // "listing" in listing-sync.server.ts. The marketplace says "no-slug".
    expect(createSlug("")).toBe("no-slug");
    expect(createSlug("   ")).toBe("no-slug");
    expect(createSlug("!!!")).toBe("no-slug");
    expect(createSlug(null)).toBe("no-slug");
    expect(createSlug(undefined)).toBe("no-slug");
  });

  test("keeps underscores, because \\w includes them", () => {
    expect(createSlug("under_scores_kept")).toBe("under-scores-kept");
  });

  test("a title with no Latin characters at all yields the fallback", () => {
    // [^\w-] removes CJK entirely, so there is nothing left to slug.
    expect(createSlug("日本語プール")).toBe("no-slug");
  });

  test("strips emoji but keeps the surrounding words", () => {
    expect(createSlug("emoji 🏊 pool")).toBe("emoji-pool");
  });

  test("output is always safe to interpolate into a URL", () => {
    for (const t of ["Café Pool", "日本語プール", "emoji 🏊 pool", "100% Private"]) {
      expect(() => new URL(`https://example.com/l/${createSlug(t)}/${ID}`)).not.toThrow();
    }
  });

  test("is idempotent on its own output", () => {
    for (const s of ["sunny-backyard-pool", "cafe-pool", "100-private-pool", "no-slug"]) {
      expect(createSlug(s)).toBe(s);
    }
  });

  test("accepts non-string input without throwing", () => {
    expect(createSlug(42 as unknown as string)).toBe("42");
  });
});

describe("canonical path — what the marketplace puts in rel=canonical", () => {
  test("is slug-less", () => {
    expect(canonicalListingPath(ID)).toBe(`/l/${ID}`);
    expect(canonicalListingPath(ID)).not.toContain("katy");
  });

  test("matches the canonical production actually emits", () => {
    // Verified live: /l/{anything}/{id} all emit canonical
    // https://www.poolrentalnearme.com/l/685b3bd3-1e5d-44b8-9483-5f6452306157
    expect(canonicalListingUrl(ID, "https://www.poolrentalnearme.com")).toBe(
      `https://www.poolrentalnearme.com/l/${ID}`,
    );
  });

  test("tolerates a trailing slash on the site URL", () => {
    expect(canonicalListingUrl(ID, "https://www.poolrentalnearme.com/")).toBe(
      `https://www.poolrentalnearme.com/l/${ID}`,
    );
  });

  test("uses the shared prefix", () => {
    expect(canonicalListingPath(ID).startsWith(`${LISTING_PATH_PREFIX}/`)).toBe(true);
  });
});

describe("human-facing path", () => {
  test("keeps the slug for internal links", () => {
    expect(listingPathWithSlug("sunny-backyard-pool", ID)).toBe(`/l/sunny-backyard-pool/${ID}`);
  });

  test("uses an already-slugged value as-is, so stored slugs are not double-slugged", () => {
    expect(listingPathWithSlug("cafe-pool", ID)).toBe(`/l/cafe-pool/${ID}`);
  });

  test("falls back rather than emitting an empty segment", () => {
    expect(listingPathWithSlug(null, ID)).toBe(`/l/no-slug/${ID}`);
    expect(listingPathWithSlug("", ID)).toBe(`/l/no-slug/${ID}`);
    expect(listingPathWithSlug("   ", ID)).toBe(`/l/no-slug/${ID}`);
  });

  test("never produces a double slash", () => {
    expect(listingPathWithSlug(null, ID)).not.toContain("//");
  });
});

describe("parseListingPath", () => {
  test("parses the canonical form", () => {
    expect(parseListingPath(`/l/${ID}`)).toEqual({
      listingId: ID,
      slug: null,
      isCanonical: true,
    });
  });

  test("parses the slug form", () => {
    expect(parseListingPath(`/l/sunny-backyard-pool/${ID}`)).toEqual({
      listingId: ID,
      slug: "sunny-backyard-pool",
      isCanonical: false,
    });
  });

  test("ignores query strings, fragments and trailing slashes", () => {
    expect(parseListingPath(`/l/${ID}/`)?.listingId).toBe(ID);
    expect(parseListingPath(`/l/slug/${ID}?utm_source=x`)?.listingId).toBe(ID);
    expect(parseListingPath(`/l/slug/${ID}#gallery`)?.listingId).toBe(ID);
  });

  test("refuses the draft path — it is the marketplace's to route", () => {
    // /l/draft/00000000-0000-0000-0000-000000000000/new/details is the
    // list-a-pool CTA used in ~15 places. Rewriting it would break the funnel.
    expect(
      parseListingPath("/l/draft/00000000-0000-0000-0000-000000000000/new/details"),
    ).toBeNull();
  });

  test("refuses the marketplace's other /l/ routes", () => {
    expect(parseListingPath("/l/new")).toBeNull();
    expect(parseListingPath(`/l/slug/${ID}/checkout`)).toBeNull();
    expect(parseListingPath(`/l/slug/${ID}/pending-approval`)).toBeNull();
  });

  test("requires a UUID, so a non-listing path never parses", () => {
    expect(parseListingPath("/l/slug/not-a-uuid")).toBeNull();
    expect(parseListingPath("/l/not-a-uuid")).toBeNull();
  });

  test("refuses paths outside /l/", () => {
    expect(parseListingPath(`/p/${ID}`)).toBeNull();
    expect(parseListingPath(`/s?x=1`)).toBeNull();
    expect(parseListingPath("/")).toBeNull();
    expect(parseListingPath("")).toBeNull();
    expect(parseListingPath(null)).toBeNull();
    expect(parseListingPath(undefined)).toBeNull();
  });

  test("round-trips both shapes it builds", () => {
    expect(parseListingPath(canonicalListingPath(ID))?.listingId).toBe(ID);
    const p = parseListingPath(listingPathWithSlug("cafe-pool", ID));
    expect(p?.listingId).toBe(ID);
    expect(p?.slug).toBe("cafe-pool");
  });
});

describe("slugDrift", () => {
  test("is null when the stored slug already matches", () => {
    expect(slugDrift("Sunny Backyard Pool", "sunny-backyard-pool")).toBeNull();
  });

  test("reports the old mirror formula as drift", () => {
    // listing-sync.server.ts used slugify(`${title}-${id.slice(0,8)}`).
    expect(slugDrift("Sunny Backyard Pool", "sunny-backyard-pool-685b3bd3")).toEqual({
      expected: "sunny-backyard-pool",
      stored: "sunny-backyard-pool-685b3bd3",
    });
  });

  test("reports an accent-stripped slug as drift", () => {
    expect(slugDrift("Café Pool", "caf-pool")).toEqual({
      expected: "cafe-pool",
      stored: "caf-pool",
    });
  });

  test("treats a missing stored slug as drift", () => {
    expect(slugDrift("Sunny Backyard Pool", null)).toEqual({
      expected: "sunny-backyard-pool",
      stored: null,
    });
  });
});
