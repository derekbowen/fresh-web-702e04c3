/**
 * Deterministic tests for listing image sourcing. Fixtures only — no network,
 * no database, no clock.
 *
 * Run: bun test src/lib/listing-images.test.ts
 */
import { describe, expect, test } from "bun:test";
import {
  buildPrnmImageColumns,
  DEFAULT_IMAGE_SOURCE,
  extensionForContentType,
  isPrnmHostedImageUrl,
  LISTING_IMAGE_BUCKET,
  preferredImageUrl,
  preferredImageUrls,
  pickRehostVariant,
  REHOST_CROP_FALLBACK_LADDER,
  REHOST_IMAGE_FIELDS,
  REHOST_VARIANT_LADDER,
  resolveImageSource,
  storagePathFor,
  type SharetribeVariant,
  type StoredAssetRow,
} from "./listing-images";

const MARKETPLACE = "672444e2-9969-433a-b885-743775a6824c";
const LISTING = "11111111-1111-4111-8111-111111111111";
const IMG = "6a74ba39-a544-4e70-9927-7e265422db70";

const stUrl = (variant: string) =>
  `https://sharetribe.imgix.net/${MARKETPLACE}/${IMG}?variant=${variant}&s=abc123`;

const variant = (name: string, width: number, height: number): SharetribeVariant => ({
  url: stUrl(name),
  width,
  height,
});

const SUPABASE = "https://ptfjspcphskifoseidut.supabase.co";
const prnmObject = `${SUPABASE}/storage/v1/object/public/${LISTING_IMAGE_BUCKET}/${LISTING}/${IMG}.jpg`;
const prnmRender = `${SUPABASE}/storage/v1/render/image/public/${LISTING_IMAGE_BUCKET}/${LISTING}/${IMG}.jpg?width=800`;

// ─────────────────────────────────────────────────────────────────────────────

describe("PRNM_IMAGE_SOURCE flag", () => {
  test("unset defaults to sharetribe so a missing var never flips the site", () => {
    const r = resolveImageSource({});
    expect(r.source).toBe("sharetribe");
    expect(r.source).toBe(DEFAULT_IMAGE_SOURCE);
    expect(r.invalid).toBe(false);
  });

  test.each(["sharetribe", "prnm"] as const)("accepts %s", (v: string) => {
    expect(resolveImageSource({ PRNM_IMAGE_SOURCE: v }).source).toBe(v);
  });

  test("is case- and whitespace-insensitive", () => {
    expect(resolveImageSource({ PRNM_IMAGE_SOURCE: " PRNM " }).source).toBe("prnm");
  });

  test("a typo falls back to sharetribe and is flagged", () => {
    const r = resolveImageSource({ PRNM_IMAGE_SOURCE: "prmn" });
    expect(r.source).toBe("sharetribe");
    expect(r.invalid).toBe(true);
    expect(r.raw).toBe("prmn");
  });

  test("empty string counts as unset, not invalid", () => {
    expect(resolveImageSource({ PRNM_IMAGE_SOURCE: "  " }).invalid).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("variant selection", () => {
  test("prefers scaled-xlarge, the largest variant Sharetribe exposes", () => {
    const pick = pickRehostVariant({
      "scaled-small": variant("scaled-small", 320, 213),
      "scaled-large": variant("scaled-large", 1024, 683),
      "scaled-xlarge": variant("scaled-xlarge", 2400, 1600),
      "landscape-crop2x": variant("landscape-crop2x", 800, 533),
    });
    expect(pick).not.toBeNull();
    expect(pick!.variant).toBe("scaled-xlarge");
    expect(pick!.width).toBe(2400);
    expect(pick!.isCrop).toBe(false);
  });

  test("walks down the uncropped ladder in order", () => {
    expect(
      pickRehostVariant({
        "scaled-large": variant("scaled-large", 1024, 683),
        default: variant("default", 1024, 683),
      })!.variant,
    ).toBe("scaled-large");

    expect(
      pickRehostVariant({
        default: variant("default", 1024, 683),
        "scaled-medium": variant("scaled-medium", 750, 500),
      })!.variant,
    ).toBe("default");

    expect(pickRehostVariant({ "scaled-small": variant("scaled-small", 320, 213) })!.variant).toBe(
      "scaled-small",
    );
  });

  test("never picks a crop while any uncropped variant exists", () => {
    const pick = pickRehostVariant({
      "landscape-crop2x": variant("landscape-crop2x", 800, 533),
      square2x: variant("square2x", 800, 800),
      "scaled-small": variant("scaled-small", 320, 213),
    });
    expect(pick!.variant).toBe("scaled-small");
    expect(pick!.isCrop).toBe(false);
  });

  test("falls back to a crop only when nothing uncropped is offered, and says so", () => {
    const pick = pickRehostVariant({
      "landscape-crop2x": variant("landscape-crop2x", 800, 533),
      square: variant("square", 400, 400),
    });
    expect(pick!.variant).toBe("landscape-crop2x");
    expect(pick!.isCrop).toBe(true);
  });

  test("returns null when there is no usable variant, so the worker can mark it unavailable", () => {
    expect(pickRehostVariant({})).toBeNull();
    expect(pickRehostVariant(null)).toBeNull();
    expect(pickRehostVariant(undefined)).toBeNull();
  });

  test("ignores variants with a missing, empty or non-string url", () => {
    expect(
      pickRehostVariant({
        "scaled-xlarge": { url: "" },
        "scaled-large": { url: "   " },
        default: undefined,
        "scaled-medium": variant("scaled-medium", 750, 500),
      })!.variant,
    ).toBe("scaled-medium");
  });

  test("tolerates variants with no dimensions", () => {
    const pick = pickRehostVariant({ "scaled-xlarge": { url: stUrl("scaled-xlarge") } });
    expect(pick!.width).toBeNull();
    expect(pick!.height).toBeNull();
  });

  test("REHOST_IMAGE_FIELDS asks for every variant in both ladders", () => {
    for (const v of [...REHOST_VARIANT_LADDER, ...REHOST_CROP_FALLBACK_LADDER]) {
      expect(REHOST_IMAGE_FIELDS).toContain(`variants.${v}`);
    }
    expect(REHOST_IMAGE_FIELDS.startsWith("variants.scaled-xlarge")).toBe(true);
  });

  test("the two ladders do not overlap", () => {
    const crops = new Set<string>(REHOST_CROP_FALLBACK_LADDER);
    expect(REHOST_VARIANT_LADDER.filter((v) => crops.has(v))).toEqual([]);
  });

  test("every rung names a variant Sharetribe actually defines", () => {
    // The test above only checks REHOST_IMAGE_FIELDS echoes whatever the ladders
    // say, so it passes for invented names too -- which is how "square" and
    // "square2x" survived. Sharetribe has no such variants; the real ones are
    // square-small / square-small2x (see the marketplace's own Avatar.js). A
    // fields.image naming a variant that does not exist is rejected outright,
    // so a typo here breaks every discovery request, not just one rung.
    const SHARETRIBE_VARIANTS = new Set([
      "default",
      "landscape-crop",
      "landscape-crop2x",
      "landscape-crop4x",
      "landscape-crop6x",
      "scaled-small",
      "scaled-medium",
      "scaled-large",
      "scaled-xlarge",
      "square-small",
      "square-small2x",
      "facebook",
      "twitter",
    ]);
    const unknown = [...REHOST_VARIANT_LADDER, ...REHOST_CROP_FALLBACK_LADDER].filter(
      (v) => !SHARETRIBE_VARIANTS.has(v),
    );
    expect(unknown).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("storage paths", () => {
  test("maps content types to extensions", () => {
    expect(extensionForContentType("image/jpeg")).toBe("jpg");
    expect(extensionForContentType("image/png")).toBe("png");
    expect(extensionForContentType("image/webp")).toBe("webp");
    expect(extensionForContentType("image/avif")).toBe("avif");
    expect(extensionForContentType("image/gif")).toBe("gif");
  });

  test("strips charset parameters and is case-insensitive", () => {
    expect(extensionForContentType("image/JPEG; charset=binary")).toBe("jpg");
    expect(extensionForContentType("  IMAGE/PNG  ")).toBe("png");
  });

  test("unknown and missing types fall back to jpg", () => {
    expect(extensionForContentType("application/octet-stream")).toBe("jpg");
    expect(extensionForContentType(null)).toBe("jpg");
    expect(extensionForContentType(undefined)).toBe("jpg");
    expect(extensionForContentType("")).toBe("jpg");
  });

  test("path is listingId/imageId.ext", () => {
    expect(storagePathFor(LISTING, IMG, "image/jpeg")).toBe(`${LISTING}/${IMG}.jpg`);
  });

  test("path is deterministic, so a retry overwrites instead of orphaning", () => {
    expect(storagePathFor(LISTING, IMG, "image/jpeg")).toBe(
      storagePathFor(LISTING, IMG, "image/jpeg"),
    );
    expect(storagePathFor(LISTING, IMG, "image/jpeg")).not.toContain(
      String(Date.now()).slice(0, 6),
    );
  });

  test("different content types give different objects for the same image", () => {
    expect(storagePathFor(LISTING, IMG, "image/webp")).toBe(`${LISTING}/${IMG}.webp`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("host classification", () => {
  test("recognises our Supabase object and render URLs", () => {
    expect(isPrnmHostedImageUrl(prnmObject)).toBe(true);
    expect(isPrnmHostedImageUrl(prnmRender)).toBe(true);
  });

  test("does not claim Sharetribe URLs", () => {
    expect(isPrnmHostedImageUrl(stUrl("scaled-xlarge"))).toBe(false);
  });

  test("does not claim a different Supabase bucket", () => {
    expect(
      isPrnmHostedImageUrl(`${SUPABASE}/storage/v1/object/public/city-heroes/austin.jpg`),
    ).toBe(false);
  });

  test("non-URL values are not PRNM-hosted and do not throw", () => {
    for (const v of ["", "  ", "not a url", null, undefined, 42, {}]) {
      expect(isPrnmHostedImageUrl(v as unknown)).toBe(false);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("serving preference — fallback is per listing, not global", () => {
  const st = stUrl("landscape-crop2x");

  test("sharetribe mode ignores a PRNM URL even when one exists", () => {
    expect(preferredImageUrl(prnmObject, st, "sharetribe")).toBe(st);
  });

  test("prnm mode uses the PRNM URL when the listing has one", () => {
    expect(preferredImageUrl(prnmObject, st, "prnm")).toBe(prnmObject);
  });

  test("prnm mode keeps the Sharetribe URL for a listing not yet migrated", () => {
    // The whole point: during a long migration the site is never worse than today.
    expect(preferredImageUrl(null, st, "prnm")).toBe(st);
    expect(preferredImageUrl("", st, "prnm")).toBe(st);
    expect(preferredImageUrl("   ", st, "prnm")).toBe(st);
  });

  test("a PRNM URL is used when Sharetribe has none, in either mode", () => {
    expect(preferredImageUrl(prnmObject, null, "prnm")).toBe(prnmObject);
    expect(preferredImageUrl(prnmObject, null, "sharetribe")).toBe(prnmObject);
  });

  test("no URLs at all yields null", () => {
    expect(preferredImageUrl(null, null, "prnm")).toBeNull();
    expect(preferredImageUrl(undefined, undefined, "sharetribe")).toBeNull();
    expect(preferredImageUrl("", "  ", "prnm")).toBeNull();
  });

  test("galleries switch as a set, preserving order", () => {
    const stAll = [stUrl("a"), stUrl("b")];
    const prnmAll = [prnmObject, prnmRender];
    expect(preferredImageUrls(prnmAll, stAll, "prnm")).toEqual(prnmAll);
    expect(preferredImageUrls(prnmAll, stAll, "sharetribe")).toEqual(stAll);
  });

  test("a gallery with no PRNM images keeps the Sharetribe set", () => {
    const stAll = [stUrl("a"), stUrl("b")];
    expect(preferredImageUrls([], stAll, "prnm")).toEqual(stAll);
    expect(preferredImageUrls(null, stAll, "prnm")).toEqual(stAll);
  });

  test("empty entries are dropped rather than rendered as broken images", () => {
    expect(preferredImageUrls(["", "  "], [stUrl("a")], "prnm")).toEqual([stUrl("a")]);
  });

  test("returns copies, so callers cannot mutate the stored arrays", () => {
    const prnmAll = [prnmObject];
    const out = preferredImageUrls(prnmAll, [], "prnm");
    out.push("x");
    expect(prnmAll).toEqual([prnmObject]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("rebuilding the denormalized columns", () => {
  const row = (over: Partial<StoredAssetRow>): StoredAssetRow => ({
    sharetribe_image_id: "img-a",
    position: 0,
    public_url: prnmObject,
    status: "stored",
    ...over,
  });

  test("orders by position", () => {
    const out = buildPrnmImageColumns([
      row({ sharetribe_image_id: "c", position: 2, public_url: "u-c" }),
      row({ sharetribe_image_id: "a", position: 0, public_url: "u-a" }),
      row({ sharetribe_image_id: "b", position: 1, public_url: "u-b" }),
    ]);
    expect(out.prnm_image_urls).toEqual(["u-a", "u-b", "u-c"]);
    expect(out.prnm_primary_image_url).toBe("u-a");
  });

  test("only stored rows contribute — no holes, no dead URLs", () => {
    const out = buildPrnmImageColumns([
      row({ sharetribe_image_id: "a", position: 0, public_url: "u-a" }),
      row({ sharetribe_image_id: "b", position: 1, status: "pending", public_url: null }),
      row({ sharetribe_image_id: "c", position: 2, status: "failed", public_url: null }),
      row({ sharetribe_image_id: "d", position: 3, status: "unavailable", public_url: null }),
      row({ sharetribe_image_id: "e", position: 4, public_url: "u-e" }),
    ]);
    expect(out.prnm_image_urls).toEqual(["u-a", "u-e"]);
    expect(out.prnm_primary_image_url).toBe("u-a");
  });

  test("status gates inclusion even when a non-stored row still holds a URL", () => {
    // Real case: an asset stored successfully, a later re-run failed, and
    // public_url was left behind. Filtering on public_url alone would publish a
    // URL for an image we no longer believe is good.
    const out = buildPrnmImageColumns([
      row({ sharetribe_image_id: "a", position: 0, public_url: "u-a" }),
      row({ sharetribe_image_id: "b", position: 1, status: "failed", public_url: "u-stale-b" }),
      row({ sharetribe_image_id: "c", position: 2, status: "pending", public_url: "u-stale-c" }),
      row({
        sharetribe_image_id: "d",
        position: 3,
        status: "unavailable",
        public_url: "u-stale-d",
      }),
    ]);
    expect(out.prnm_image_urls).toEqual(["u-a"]);
    expect(out.prnm_primary_image_url).toBe("u-a");
  });

  test("a failed first image does not become the primary", () => {
    const out = buildPrnmImageColumns([
      row({ sharetribe_image_id: "a", position: 0, status: "failed", public_url: "u-stale-a" }),
      row({ sharetribe_image_id: "b", position: 1, public_url: "u-b" }),
    ]);
    expect(out.prnm_primary_image_url).toBe("u-b");
  });

  test("a stored row with no public_url is excluded", () => {
    const out = buildPrnmImageColumns([row({ public_url: null }), row({ public_url: "" })]);
    expect(out.prnm_image_urls).toEqual([]);
    expect(out.prnm_primary_image_url).toBeNull();
  });

  test("ties on position break on image id, so ordering is stable across runs", () => {
    const a = buildPrnmImageColumns([
      row({ sharetribe_image_id: "zzz", position: 0, public_url: "u-z" }),
      row({ sharetribe_image_id: "aaa", position: 0, public_url: "u-a" }),
    ]);
    const b = buildPrnmImageColumns([
      row({ sharetribe_image_id: "aaa", position: 0, public_url: "u-a" }),
      row({ sharetribe_image_id: "zzz", position: 0, public_url: "u-z" }),
    ]);
    expect(a.prnm_image_urls).toEqual(["u-a", "u-z"]);
    expect(a).toEqual(b);
  });

  test("a null position sorts as 0 rather than throwing", () => {
    const out = buildPrnmImageColumns([
      row({ sharetribe_image_id: "b", position: 1, public_url: "u-b" }),
      row({ sharetribe_image_id: "a", position: null, public_url: "u-a" }),
    ]);
    expect(out.prnm_image_urls).toEqual(["u-a", "u-b"]);
  });

  test("no assets yields empty column values, not null array", () => {
    const out = buildPrnmImageColumns([]);
    expect(out.prnm_image_urls).toEqual([]);
    expect(out.prnm_primary_image_url).toBeNull();
  });

  test("does not mutate its input", () => {
    const input = [
      row({ sharetribe_image_id: "b", position: 1, public_url: "u-b" }),
      row({ sharetribe_image_id: "a", position: 0, public_url: "u-a" }),
    ];
    const snapshot = input.map((r) => r.sharetribe_image_id);
    buildPrnmImageColumns(input);
    expect(input.map((r) => r.sharetribe_image_id)).toEqual(snapshot);
  });
});
