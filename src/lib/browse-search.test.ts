/**
 * /s browse page — pure decision logic.
 *
 * No network, no database. What is under test: that junk URLs normalise to a
 * safe query instead of a 500, that exactly the right options reach the
 * listing-read facade, that legacy marketplace params survive to the facade so
 * mirror-only can name what it dropped, that the banner never lets an
 * unfiltered list pass as a filtered one, and that pager hrefs are stable.
 *
 * Run: bun test src/lib/browse-search.test.ts
 */
import { describe, expect, test } from "bun:test";
import { defaultParseSearch, defaultStringifySearch } from "@tanstack/react-router";
import {
  appliedExtras,
  BROWSE_MAX_PAGE,
  BROWSE_URL_KEYS,
  BROWSE_PER_PAGE,
  BROWSE_STATE_OPTIONS,
  browseHeading,
  browseSeo,
  buildBrowseHref,
  buildPager,
  cityDisplayName,
  decideBrowseBody,
  decideBrowseNotice,
  describeResultCount,
  isFilteredOrPaged,
  parseBrowseQuery,
  parseBrowseRouteSearch,
  parseBrowseSearch,
  resolveAddressScope,
  scopeLabel,
  toBrowseQuery,
  toBrowseResult,
  toMirrorCitySlug,
  toSearchOptions,
  unappliedOpts,
  unavailableBrowseResult,
  type BrowseResult,
} from "./browse-search";
import { mirrorUnsupportedOptsFor } from "./listing-read-source";

const LISTING = {
  id: "685b3bd3-1e5d-44b8-9483-5f6452306157",
  slug: "katy-staycation-saltwater-getaway",
  title: "Katy StayCation Saltwater Getaway",
  description: "A long description that ListingCard never renders.",
  price: { amount: 8050, currency: "USD" },
  city: "Katy",
  state: "TX",
  imageUrl: "https://example.invalid/a.jpg",
  url: "/l/katy-staycation-saltwater-getaway/685b3bd3-1e5d-44b8-9483-5f6452306157",
  geolocation: null,
};

const served = (
  servedBy: BrowseResult["servedBy"],
  degraded: BrowseResult["degraded"] = null,
): Pick<BrowseResult, "servedBy" | "degraded"> => ({ servedBy, degraded });

// ─────────────────────────────────────────────────────────────────────────────

describe("parseBrowseSearch — normalisation", () => {
  test("empty, null and non-object input give the unfiltered page", () => {
    expect(parseBrowseSearch({})).toEqual({});
    expect(parseBrowseSearch(null)).toEqual({});
    expect(parseBrowseSearch(undefined)).toEqual({});
    expect(parseBrowseSearch("state=TX")).toEqual({});
    expect(parseBrowseSearch(42)).toEqual({});
  });

  test("state accepts a code or a name, any case; anything else is dropped", () => {
    expect(parseBrowseSearch({ state: "TX" })).toEqual({ state: "TX" });
    expect(parseBrowseSearch({ state: "tx" })).toEqual({ state: "TX" });
    expect(parseBrowseSearch({ state: " Texas " })).toEqual({ state: "TX" });
    expect(parseBrowseSearch({ state: "new-york" })).toEqual({ state: "NY" });
    expect(parseBrowseSearch({ state: "District of Columbia" })).toEqual({ state: "DC" });
    expect(parseBrowseSearch({ state: "ZZ" })).toEqual({});
    expect(parseBrowseSearch({ state: "Texass" })).toEqual({});
    expect(parseBrowseSearch({ state: "" })).toEqual({});
  });

  test("city is reduced to the synced_listings.city_slug formula", () => {
    expect(parseBrowseSearch({ city: "austin" })).toEqual({ city: "austin" });
    expect(parseBrowseSearch({ city: "San Antonio" })).toEqual({ city: "san-antonio" });
    expect(parseBrowseSearch({ city: "St. Louis" })).toEqual({ city: "st-louis" });
    expect(parseBrowseSearch({ city: "!!!" })).toEqual({});
    expect(parseBrowseSearch({ city: "   " })).toEqual({});
    expect(parseBrowseSearch({ city: "x".repeat(121) })).toEqual({});
  });

  test("page must be an integer 2..max; 1 is represented by absence", () => {
    expect(parseBrowseSearch({ page: 2 })).toEqual({ page: 2 });
    expect(parseBrowseSearch({ page: "3" })).toEqual({ page: 3 });
    expect(parseBrowseSearch({ page: 1 })).toEqual({});
    expect(parseBrowseSearch({ page: 0 })).toEqual({});
    expect(parseBrowseSearch({ page: -2 })).toEqual({});
    expect(parseBrowseSearch({ page: 2.5 })).toEqual({});
    expect(parseBrowseSearch({ page: "banana" })).toEqual({});
    expect(parseBrowseSearch({ page: "" })).toEqual({});
    expect(parseBrowseSearch({ page: BROWSE_MAX_PAGE })).toEqual({ page: BROWSE_MAX_PAGE });
    expect(parseBrowseSearch({ page: BROWSE_MAX_PAGE + 1 })).toEqual({});
  });

  test("TanStack's JSON-parsed values (numbers, booleans, arrays, objects) never throw", () => {
    expect(parseBrowseSearch({ keywords: 123 })).toEqual({ keywords: "123" });
    expect(parseBrowseSearch({ keywords: true })).toEqual({ keywords: "true" });
    expect(parseBrowseSearch({ state: ["TX", "CA"] })).toEqual({ state: "TX" });
    expect(parseBrowseSearch({ state: { a: 1 } })).toEqual({});
    expect(parseBrowseSearch({ city: null })).toEqual({});
    expect(parseBrowseSearch({ page: [2, 3] })).toEqual({ page: 2 });
  });

  test("unknown params are stripped; one bad param never takes the good ones with it", () => {
    expect(
      parseBrowseSearch({ state: "TX", utm_source: "x", event: "bachelorette", page: "nope" }),
    ).toEqual({ state: "TX" });
  });

  test("category comes from pub_category (or category), lowercase slug only", () => {
    expect(parseBrowseSearch({ pub_category: "saltwater" })).toEqual({ category: "saltwater" });
    expect(parseBrowseSearch({ pub_category: "Hot-Tub" })).toEqual({ category: "hot-tub" });
    expect(parseBrowseSearch({ category: "indoor" })).toEqual({ category: "indoor" });
    expect(parseBrowseSearch({ pub_category: "hot tub" })).toEqual({});
    expect(parseBrowseSearch({ pub_category: "<script>" })).toEqual({});
  });

  test("whitespace in free text is collapsed; over-long values are dropped", () => {
    expect(parseBrowseSearch({ keywords: "  heated   salt  " })).toEqual({
      keywords: "heated salt",
    });
    expect(parseBrowseSearch({ keywords: "k".repeat(201) })).toEqual({});
  });

  test("parse is idempotent over its own query output", () => {
    const once = parseBrowseSearch({
      state: "texas",
      city: "San Antonio",
      pub_category: "saltwater",
      page: "4",
      q: "heated",
      origin: "29.42, -98.49",
      bounds: "29.6,-98.3,29.2,-98.7",
    });
    expect(parseBrowseQuery(toBrowseQuery(once))).toEqual(toBrowseQuery(once));
  });
});

/**
 * What the router does with validateSearch, reproduced with its own parse and
 * stringify: `match.search = { ...raw, ...validated }`, and on SSR a redirect
 * whenever the href rebuilt from that differs from the request.
 */
function routerPass(query: string) {
  const raw = defaultParseSearch(query) as Record<string, unknown>;
  const merged = { ...raw, ...parseBrowseRouteSearch(raw) };
  const rebuilt = defaultStringifySearch(merged);
  return { merged, rebuilt, redirects: rebuilt !== defaultStringifySearch(raw) };
}

describe("parseBrowseRouteSearch — the route's validateSearch", () => {
  test("every href this page builds survives the SSR check with no redirect", () => {
    const hrefs = [
      buildBrowseHref({}),
      buildBrowseHref({ state: "TX" }),
      buildBrowseHref({ state: "TX", city: "san-antonio", page: 3 }),
      buildBrowseHref({ category: "saltwater", keywords: "pool party", page: 2 }),
      buildBrowseHref({ keywords: "123" }),
      buildBrowseHref({ origin: "30.2,-97.7", bounds: "30.5,-97.5,30.1,-97.9" }),
    ];
    for (const href of hrefs) {
      const q = href.includes("?") ? href.slice(href.indexOf("?")) : "";
      expect(routerPass(q).redirects).toBe(false);
    }
  });

  test("inbound links already on the site do not redirect either", () => {
    for (const q of [
      "?pub_category=hot-tub", // homepage pool-type grid
      "?address=Austin%2C%20TX", // activity-city template
      "?address=Texas", // state hub, advocacy
      "?keyword=pool%20party", // p.pool-party-rentals
      "?q=heated", // WebSite SearchAction urlTemplate
      "?state=texas&city=San+Antonio", // the no-JS form submit
      "?event=bachelorette", // homepage chips: unknown, left alone
      "?state=TX&utm_source=newsletter",
    ]) {
      expect(routerPass(q).redirects).toBe(false);
    }
  });

  test("an unusable param is overridden in the merge and redirects to the URL without it", () => {
    // Omitting it would not be enough: the merge would keep "ZZ" and head an
    // unfiltered list "Pool rentals in ZZ".
    const r = routerPass("?state=ZZ&page=banana&city=%21%21%21&keywords=&utm_source=x");
    expect(r.merged.state).toBeUndefined();
    expect(r.merged.page).toBeUndefined();
    expect(r.redirects).toBe(true);
    expect(r.rebuilt).toBe("?utm_source=x");
    expect(parseBrowseSearch(r.merged)).toEqual({});
  });

  test("derived state never reaches the URL", () => {
    const r = routerPass("?address=Austin%2C%20TX%2C%20USA&bounds=30.5%2C-97.5%2C30.1%2C-97.9");
    expect(r.redirects).toBe(false);
    expect(r.rebuilt).not.toMatch(/addressScope|addressUnmatched|stateCode|citySlug/);
    expect(parseBrowseSearch(r.merged)).toEqual({
      bounds: "30.5,-97.5,30.1,-97.9",
      addressScope: { state: "TX", city: "austin" },
    });
  });

  test("values keep their router-parsed type (page 2 stays a number)", () => {
    const r = routerPass("?page=2&keywords=123");
    expect(r.merged.page).toBe(2);
    expect(r.merged.keywords).toBe(123);
    expect(parseBrowseSearch(r.merged)).toEqual({ page: 2, keywords: "123" });
  });

  test("every URL key is written, so nothing raw slips through", () => {
    expect(Object.keys(parseBrowseRouteSearch({})).sort()).toEqual([...BROWSE_URL_KEYS].sort());
  });
});

describe("legacy marketplace params", () => {
  test("keywords | keyword | q all become keywords, in that precedence", () => {
    expect(parseBrowseSearch({ keyword: "pool party" })).toEqual({ keywords: "pool party" });
    expect(parseBrowseSearch({ q: "heated" })).toEqual({ keywords: "heated" });
    expect(parseBrowseSearch({ keywords: "a", keyword: "b", q: "c" })).toEqual({ keywords: "a" });
  });

  test("origin and bounds are validated and passed through", () => {
    expect(parseBrowseSearch({ origin: "30.27,-97.74" })).toEqual({ origin: "30.27,-97.74" });
    expect(parseBrowseSearch({ origin: "30.27, -97.74" })).toEqual({ origin: "30.27,-97.74" });
    expect(parseBrowseSearch({ origin: "91,0" })).toEqual({});
    expect(parseBrowseSearch({ origin: "30.27" })).toEqual({});
    expect(parseBrowseSearch({ bounds: "30.51,-97.56,30.09,-97.93" })).toEqual({
      bounds: "30.51,-97.56,30.09,-97.93",
    });
    // NE south of SW is not a box.
    expect(parseBrowseSearch({ bounds: "30.09,-97.56,30.51,-97.93" })).toEqual({});
    expect(parseBrowseSearch({ bounds: "1,2,3" })).toEqual({});
  });

  test("address resolves to a scope when nothing more precise is present", () => {
    expect(parseBrowseSearch({ address: "Texas" })).toEqual({ state: "TX" });
    expect(parseBrowseSearch({ address: "Austin, TX" })).toEqual({ state: "TX", city: "austin" });
    expect(parseBrowseSearch({ address: "Austin, Texas" })).toEqual({
      state: "TX",
      city: "austin",
    });
  });

  test("explicit state/city win over address", () => {
    expect(parseBrowseSearch({ state: "CA", address: "Austin, TX" })).toEqual({ state: "CA" });
    expect(parseBrowseSearch({ city: "dallas", address: "Austin, TX" })).toEqual({
      city: "dallas",
    });
  });

  test("with bounds/origin, address is kept as a suggestion, not applied", () => {
    expect(
      parseBrowseSearch({ address: "Austin, TX, USA", bounds: "30.51,-97.56,30.09,-97.93" }),
    ).toEqual({
      bounds: "30.51,-97.56,30.09,-97.93",
      addressScope: { state: "TX", city: "austin" },
    });
  });

  test("an address that cannot be matched is flagged, never guessed", () => {
    expect(parseBrowseSearch({ address: "Melbourne" })).toEqual({ addressUnmatched: true });
    expect(parseBrowseSearch({ address: "Toronto, ON, Canada" })).toEqual({
      addressUnmatched: true,
    });
  });

  test("toBrowseQuery strips the address bookkeeping", () => {
    expect(
      toBrowseQuery({ bounds: "1,1,0,0", addressScope: { state: "TX" }, addressUnmatched: true }),
    ).toEqual({ bounds: "1,1,0,0" });
  });
});

describe("resolveAddressScope", () => {
  test.each([
    ["Texas", { state: "TX" }],
    ["TX", { state: "TX" }],
    ["tx", { state: "TX" }],
    ["Austin, TX", { state: "TX", city: "austin" }],
    ["Austin, tx", { state: "TX", city: "austin" }],
    ["Austin, TX 78701", { state: "TX", city: "austin" }],
    ["Austin, TX 78701-1234, USA", { state: "TX", city: "austin" }],
    ["Austin, Texas, United States", { state: "TX", city: "austin" }],
    ["123 Main St, Austin, TX", { state: "TX", city: "austin" }],
    ["Hollywood, Los Angeles, CA", { state: "CA", city: "los-angeles" }],
    ["Washington, DC", { state: "DC", city: "washington" }],
    ["Melbourne, FL", { state: "FL", city: "melbourne" }],
    ["Austin TX", { state: "TX", city: "austin" }],
    ["Lake Placid NY", { state: "NY", city: "lake-placid" }],
    // A street in the city slot keeps only the state.
    ["123 Main St, TX", { state: "TX" }],
  ])("%p → %p", (input, expected) => {
    expect(resolveAddressScope(input)).toEqual(expected);
  });

  test.each([
    ["Austin"],
    ["Melbourne"],
    ["Melbourne, Victoria, Australia"],
    ["Toronto, ON, Canada"],
    ["Austin tx"], // no comma: only an uppercase trailing code counts
    ["Ozark hi"],
    ["pool party ok"],
    ["United States"],
    [""],
    [", ,"],
  ])("%p → null", (input) => {
    expect(resolveAddressScope(input)).toBeNull();
  });
});

describe("toMirrorCitySlug — must match listing-sync's slugify", () => {
  test.each([
    ["Austin", "austin"],
    ["San Antonio", "san-antonio"],
    ["St. Louis", "st-louis"],
    ["Winston-Salem", "winston-salem"],
    ["  Coeur d'Alene ", "coeur-d-alene"],
    ["São Paulo", "s-o-paulo"],
    ["!!!", ""],
  ])("%p → %p", (input, expected) => {
    expect(toMirrorCitySlug(input)).toBe(expected);
  });

  test("truncates at 80 like the stored column", () => {
    expect(toMirrorCitySlug("a".repeat(100))).toHaveLength(80);
  });

  test("cityDisplayName reverses it for display", () => {
    expect(cityDisplayName("san-antonio")).toBe("San Antonio");
    expect(cityDisplayName("austin")).toBe("Austin");
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("toSearchOptions — what reaches readListingSearch", () => {
  test("unfiltered page 1", () => {
    expect(toSearchOptions({})).toEqual({ page: 1, perPage: BROWSE_PER_PAGE });
  });

  test("state/city/category/page map to the facade's names", () => {
    expect(
      toSearchOptions({ state: "TX", city: "austin", category: "saltwater", page: 3 }),
    ).toEqual({
      page: 3,
      perPage: BROWSE_PER_PAGE,
      stateCode: "TX",
      citySlug: "austin",
      pub_category: "saltwater",
    });
  });

  test("legacy keywords/origin/bounds pass through so the facade can name them", () => {
    const opts = toSearchOptions(
      parseBrowseQuery({ q: "heated", origin: "30.2,-97.7", bounds: "30.5,-97.5,30.1,-97.9" }),
    );
    expect(opts).toEqual({
      page: 1,
      perPage: BROWSE_PER_PAGE,
      keywords: "heated",
      origin: "30.2,-97.7",
      bounds: "30.5,-97.5,30.1,-97.9",
    });
    expect(mirrorUnsupportedOptsFor(opts as Record<string, unknown>).sort()).toEqual([
      "bounds",
      "keywords",
      "origin",
    ]);
  });

  test("address never reaches the facade (neither backend reads it)", () => {
    const opts = toSearchOptions(parseBrowseQuery({ address: "Austin, TX" }));
    expect(opts).toEqual({
      page: 1,
      perPage: BROWSE_PER_PAGE,
      stateCode: "TX",
      citySlug: "austin",
    });
    expect("address" in opts).toBe(false);
  });

  test("unset filters are omitted, never sent as empty strings", () => {
    const opts = toSearchOptions({ state: "TX" }) as Record<string, unknown>;
    for (const k of [
      "citySlug",
      "city",
      "keywords",
      "origin",
      "bounds",
      "pub_category",
      "address",
    ]) {
      expect(k in opts).toBe(false);
    }
  });
});

describe("toBrowseResult", () => {
  test("passes the facade's degraded/servedBy/source through and blanks descriptions only", () => {
    const out = toBrowseResult({
      result: { listings: [LISTING], total: 1, page: 1, totalPages: 1 },
      servedBy: "mirror",
      source: "mirror-only",
      degraded: { droppedOpts: ["keywords"], message: "m" },
    });
    expect(out.servedBy).toBe("mirror");
    expect(out.source).toBe("mirror-only");
    expect(out.degraded).toEqual({ droppedOpts: ["keywords"], message: "m" });
    expect(out.listings[0]).toEqual({ ...LISTING, description: "" });
    expect(out.listings[0]!.price).toEqual({ amount: 8050, currency: "USD" });
    expect(out.perPage).toBe(BROWSE_PER_PAGE);
  });

  test("no degraded → null; negative totalPages clamps", () => {
    const out = toBrowseResult({
      result: { listings: [], total: 0, page: 1, totalPages: -1 },
      servedBy: "sharetribe",
      source: "sharetribe",
    });
    expect(out.degraded).toBeNull();
    expect(out.totalPages).toBe(0);
  });

  test("unavailableBrowseResult is shaped like the facade's unserviceable answer", () => {
    const out = unavailableBrowseResult("mirror-only", 3);
    expect(out.servedBy).toBe("unserviceable");
    expect(out.listings).toEqual([]);
    expect(out.page).toBe(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("unappliedOpts — what the shown results do not reflect", () => {
  test("mirror-only: the facade's droppedOpts are reported", () => {
    expect(
      unappliedOpts(
        { keywords: "heated", state: "TX" },
        served("mirror", { droppedOpts: ["keywords"], message: "" }),
      ),
    ).toEqual(["keywords"]);
  });

  test("pub_category answered by the mirror is unapplied even though no source flags it", () => {
    expect(unappliedOpts({ category: "saltwater" }, served("mirror"))).toEqual(["pub_category"]);
    expect(
      unappliedOpts(
        { category: "saltwater", keywords: "x" },
        served("mirror", { droppedOpts: ["keywords"], message: "" }),
      ),
    ).toEqual(["keywords", "pub_category"]);
  });

  test("default source with a city/state: the legacy router used the mirror", () => {
    expect(unappliedOpts({ state: "TX", keywords: "heated" }, served("sharetribe"))).toEqual([
      "keywords",
    ]);
  });

  test("default source without a city/state: the Marketplace API applied everything", () => {
    expect(
      unappliedOpts({ keywords: "heated", category: "saltwater" }, served("sharetribe")),
    ).toEqual([]);
  });

  test("sharetribe-fallback applied everything; legacy (shadow + geo) applied nothing", () => {
    expect(unappliedOpts({ keywords: "heated" }, served("sharetribe-fallback"))).toEqual([]);
    expect(unappliedOpts({ state: "TX", origin: "1,1" }, served("legacy"))).toEqual(["origin"]);
  });

  test("unknown dropped opts from a future facade are kept, after the known ones", () => {
    expect(
      unappliedOpts(
        { keywords: "a" },
        served("mirror", { droppedOpts: ["zzz", "keywords"], message: "" }),
      ),
    ).toEqual(["keywords", "zzz"]);
  });

  test("unserviceable reports nothing here (the banner says unavailable instead)", () => {
    expect(unappliedOpts({ keywords: "a" }, served("unserviceable"))).toEqual([]);
  });
});

describe("decideBrowseNotice — the aria-live banner", () => {
  test("nothing to say for a clean mirror answer", () => {
    const n = decideBrowseNotice({ state: "TX" }, served("mirror"));
    expect(n).toEqual({ kind: "none", message: "", unapplied: [], action: null });
  });

  test("unserviceable and transport failure both say unavailable, with no promise of when", () => {
    for (const r of [served("unserviceable", { droppedOpts: [], message: "x" }), null]) {
      const n = decideBrowseNotice({ state: "TX" }, r);
      expect(n.kind).toBe("unavailable");
      expect(n.message).toBe("Pool listings are temporarily unavailable. Please try again later.");
    }
  });

  test("mirror-only drops keywords in a state: names it and names the scope", () => {
    const n = decideBrowseNotice(
      { state: "TX", keywords: "saltwater" },
      served("mirror", { droppedOpts: ["keywords"], message: "" }),
    );
    expect(n.kind).toBe("degraded");
    expect(n.message).toBe(
      "Keyword search is temporarily unavailable, so we're showing all pools in Texas.",
    );
  });

  test("city scope and multiple dropped filters", () => {
    const n = decideBrowseNotice(
      { state: "TX", city: "austin", keywords: "x", bounds: "1,1,0,0" },
      served("mirror", { droppedOpts: ["bounds", "keywords"], message: "" }),
    );
    expect(n.message).toBe(
      "Keyword search and map-area search are temporarily unavailable, so we're showing all pools in Austin, TX.",
    );
  });

  test("no scope: 'all available pools'", () => {
    const n = decideBrowseNotice({ category: "saltwater" }, served("mirror"));
    expect(n.message).toBe(
      "Filtering by pool type is temporarily unavailable, so we're showing all available pools.",
    );
  });

  test("origin alone is about order, not membership", () => {
    const n = decideBrowseNotice(
      { origin: "30.2,-97.7" },
      served("mirror", { droppedOpts: ["origin"], message: "" }),
    );
    expect(n.message).toBe(
      "Sorting by distance is temporarily unavailable, so these pools are not in distance order.",
    );
  });

  test("filters plus origin", () => {
    const n = decideBrowseNotice(
      { keywords: "x", origin: "1,1" },
      served("mirror", { droppedOpts: ["keywords", "origin"], message: "" }),
    );
    expect(n.message).toBe(
      "Keyword search is temporarily unavailable, so we're showing all available pools, not sorted by distance.",
    );
  });

  test("an unknown dropped opt is not hidden", () => {
    const n = decideBrowseNotice({}, served("mirror", { droppedOpts: ["amenities"], message: "" }));
    expect(n.kind).toBe("degraded");
    expect(n.message).toBe(
      "Some search filters are temporarily unavailable, so we're showing all available pools.",
    );
  });

  test("unmatched address is said plainly", () => {
    const n = decideBrowseNotice({ addressUnmatched: true }, served("mirror"));
    expect(n.message).toBe(
      "We couldn't match that location to a US state or city, so we're showing all available pools.",
    );
  });

  test("unmatched address plus a dropped filter", () => {
    const n = decideBrowseNotice(
      { addressUnmatched: true, keywords: "x" },
      served("mirror", { droppedOpts: ["keywords"], message: "" }),
    );
    expect(n.message).toBe(
      "We couldn't match that location to a US state or city, and keyword search is temporarily unavailable, so we're showing all available pools.",
    );
  });

  test("a dropped map search offers the address scope instead", () => {
    const n = decideBrowseNotice(
      { bounds: "30.5,-97.5,30.1,-97.9", addressScope: { state: "TX", city: "austin" } },
      served("mirror", { droppedOpts: ["bounds"], message: "" }),
    );
    expect(n.message).toBe(
      "Map-area search is temporarily unavailable, so we're showing all available pools.",
    );
    expect(n.action).toEqual({
      href: "/s?state=TX&city=austin",
      label: "Show pools in Austin, TX",
    });
  });

  test("when the map search WAS applied, no notice and no suggestion", () => {
    const n = decideBrowseNotice(
      { bounds: "30.5,-97.5,30.1,-97.9", addressScope: { state: "TX", city: "austin" } },
      served("sharetribe"),
    );
    expect(n).toEqual({ kind: "none", message: "", unapplied: [], action: null });
  });

  test("default source, applied keywords: no notice", () => {
    expect(decideBrowseNotice({ keywords: "heated" }, served("sharetribe")).kind).toBe("none");
  });
});

describe("appliedExtras", () => {
  test("labels only what the results reflect", () => {
    expect(
      appliedExtras({ keywords: "heated", category: "saltwater" }, served("sharetribe")),
    ).toEqual(["Matching “heated”", "Pool type: saltwater"]);
    expect(
      appliedExtras(
        { keywords: "heated" },
        served("mirror", { droppedOpts: ["keywords"], message: "" }),
      ),
    ).toEqual([]);
    expect(appliedExtras({ keywords: "heated" }, served("unserviceable"))).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("decideBrowseBody", () => {
  test("unavailable / results / empty / out-of-range", () => {
    expect(decideBrowseBody(null)).toBe("unavailable");
    expect(decideBrowseBody({ servedBy: "unserviceable", listings: [], total: 0 })).toBe(
      "unavailable",
    );
    expect(decideBrowseBody({ servedBy: "mirror", listings: [LISTING], total: 1 })).toBe("results");
    expect(decideBrowseBody({ servedBy: "mirror", listings: [], total: 0 })).toBe("empty");
    expect(decideBrowseBody({ servedBy: "mirror", listings: [], total: 30 })).toBe("out-of-range");
  });
});

describe("buildBrowseHref / buildPager", () => {
  test("bare page and fixed key order", () => {
    expect(buildBrowseHref({})).toBe("/s");
    expect(buildBrowseHref({ page: 1 })).toBe("/s");
    expect(
      buildBrowseHref({
        page: 2,
        bounds: "1,1,0,0",
        origin: "1,1",
        keywords: "pool party",
        category: "saltwater",
        city: "austin",
        state: "TX",
      }),
    ).toBe(
      "/s?state=TX&city=austin&pub_category=saltwater&keywords=pool+party&origin=1%2C1&bounds=1%2C1%2C0%2C0&page=2",
    );
  });

  test("an href round-trips through the parser", () => {
    const q = {
      state: "TX",
      city: "san-antonio",
      category: "saltwater",
      keywords: "pool party",
      page: 3,
    };
    const href = buildBrowseHref(q);
    const params = Object.fromEntries(new URL(href, "https://x.invalid").searchParams);
    expect(parseBrowseQuery(params)).toEqual(q);
  });

  test("single page → no pager", () => {
    expect(buildPager({ state: "TX" }, 1)).toBeNull();
    expect(buildPager({ state: "TX" }, 0)).toBeNull();
  });

  test("first, middle and last pages", () => {
    expect(buildPager({ state: "TX" }, 3)).toEqual({
      page: 1,
      totalPages: 3,
      prevHref: null,
      nextHref: "/s?state=TX&page=2",
    });
    expect(buildPager({ state: "TX", page: 2 }, 3)).toEqual({
      page: 2,
      totalPages: 3,
      prevHref: "/s?state=TX",
      nextHref: "/s?state=TX&page=3",
    });
    expect(buildPager({ state: "TX", page: 3 }, 3)).toEqual({
      page: 3,
      totalPages: 3,
      prevHref: "/s?state=TX&page=2",
      nextHref: null,
    });
  });

  test("beyond the end, prev lands on the last real page", () => {
    expect(buildPager({ page: 9 }, 4)).toEqual({
      page: 9,
      totalPages: 4,
      prevHref: "/s?page=4",
      nextHref: null,
    });
    expect(buildPager({ page: 3 }, 0)!.prevHref).toBe("/s");
  });

  test("legacy params survive paging, so page 2 is the same query as page 1", () => {
    expect(buildPager({ keywords: "heated", page: 1 }, 2)!.nextHref).toBe(
      "/s?keywords=heated&page=2",
    );
  });
});

describe("labels and counts", () => {
  test("scope and heading", () => {
    expect(scopeLabel({})).toBeNull();
    expect(scopeLabel({ state: "TX" })).toBe("Texas");
    expect(scopeLabel({ state: "TX", city: "austin" })).toBe("Austin, TX");
    expect(scopeLabel({ city: "springfield" })).toBe("Springfield");
    expect(browseHeading({})).toBe("Pool rentals");
    expect(browseHeading({ state: "TX", city: "san-antonio" })).toBe(
      "Pool rentals in San Antonio, TX",
    );
  });

  test("result count", () => {
    expect(describeResultCount(0, 1, 24, 0)).toBeNull();
    expect(describeResultCount(1, 1, 24, 1)).toBe("1 pool");
    expect(describeResultCount(18, 1, 24, 18)).toBe("18 pools");
    expect(describeResultCount(113, 1, 24, 24)).toBe("Showing 1–24 of 113 pools");
    expect(describeResultCount(113, 2, 24, 24)).toBe("Showing 25–48 of 113 pools");
    expect(describeResultCount(113, 5, 24, 17)).toBe("Showing 97–113 of 113 pools");
    expect(describeResultCount(1200, 2, 24, 24)).toBe("Showing 25–48 of 1,200 pools");
    expect(describeResultCount(30, 9, 24, 0)).toBeNull();
  });

  test("state options cover STATE_NAMES, sorted by name", () => {
    expect(BROWSE_STATE_OPTIONS).toHaveLength(51);
    expect(BROWSE_STATE_OPTIONS[0]).toEqual({ code: "AL", name: "Alabama" });
    const names = BROWSE_STATE_OPTIONS.map((o) => o.name);
    expect([...names].sort((a, b) => a.localeCompare(b, "en-US"))).toEqual(names);
  });
});

describe("browseSeo", () => {
  test("canonical is always the bare page", () => {
    expect(browseSeo({ state: "TX", page: 3 }, "results").canonicalPath).toBe("/s");
    expect(browseSeo({}, "results").canonicalPath).toBe("/s");
  });

  test("every filtered or paged variant is noindex, follow", () => {
    const variants = [
      { state: "TX" },
      { city: "austin" },
      { category: "saltwater" },
      { page: 2 },
      { keywords: "x" },
      { origin: "1,1" },
      { bounds: "1,1,0,0" },
      { addressUnmatched: true as const },
      { addressScope: { state: "TX" } },
    ];
    for (const v of variants) {
      expect(isFilteredOrPaged(v)).toBe(true);
      expect(browseSeo(v, "results").robots).toBe("noindex, follow");
    }
  });

  test("bare /s is indexable only while it actually lists pools", () => {
    expect(isFilteredOrPaged({})).toBe(false);
    expect(browseSeo({}, "results").robots).toBeNull();
    expect(browseSeo({}, "empty").robots).toBe("noindex, follow");
    expect(browseSeo({}, "unavailable").robots).toBe("noindex, follow");
  });

  test("titles and descriptions make no claims beyond the scope", () => {
    const s = browseSeo({ state: "TX", city: "austin", page: 2 }, "results");
    expect(s.title).toBe("Pool rentals in Austin, TX (page 2) | Pool Rental Near Me");
    expect(s.description).toBe(
      "Browse private pools listed for hourly rental in Austin, TX on Pool Rental Near Me.",
    );
    const bare = browseSeo({}, "results");
    for (const text of [s.title, s.description, bare.title, bare.description]) {
      expect(text).not.toMatch(/insur|liabilit|coverage|\$|%|\d+\s*(pools|cities|hosts)/i);
    }
  });
});
