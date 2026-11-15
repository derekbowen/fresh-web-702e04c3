// Unit tests for host_acq_city intent (src/lib/city-intent.ts) and the one
// marketplace-search link form (src/lib/search-links.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  classifyCityIntent,
  cityPartOfSlug,
  titlePlace,
  slugIdentity,
  placeForPage,
  cityPageCopy,
  renterIntro,
  renterMetaDescription,
  renterInventoryState,
  formatMiles,
  hasEarningsFigure,
  similarPlaceName,
  cleanStoredDescription,
  hostValueSentence,
  cityMetaDescription,
  inventorySummaryOf,
} from "../src/lib/city-intent.ts";
import { getVariantCopy } from "../src/lib/host-acq-variants.ts";
import {
  searchHrefForPlace,
  searchHrefForState,
  normalizeSearchHref,
} from "../src/lib/search-links.ts";

const copyFor = (slug, title, row = null, extra = {}) => {
  const page = { slug, title, ...extra };
  const place = placeForPage(page, row);
  return { place, copy: cityPageCopy(page, place, row) };
};

test("classifier: become-a-* is HOST, everything else is RENTER", () => {
  assert.equal(classifyCityIntent("become-a-swimming-pool-host-aberdeen-sd"), "host");
  assert.equal(classifyCityIntent("become-a-pool-host-highlands-ranch-co"), "host");
  assert.equal(classifyCityIntent("become-a-swimming-pool-host-akron"), "host");
  assert.equal(classifyCityIntent("san-diego-ca"), "renter");
  assert.equal(classifyCityIntent("chapel-hill"), "renter");
  assert.equal(classifyCityIntent("birthday-pool-party-austin-tx"), "renter");
  assert.equal(classifyCityIntent("renta-de-alberca-austin-tx"), "renter");
  assert.equal(classifyCityIntent(null), "renter");
  assert.equal(classifyCityIntent(""), "renter");
});

test("cityPartOfSlug strips the host prefix (and a doubled hyphen)", () => {
  assert.equal(cityPartOfSlug("become-a-swimming-pool-host-aberdeen-sd"), "aberdeen-sd");
  assert.equal(cityPartOfSlug("become-a-pool-host-highlands-ranch-co"), "highlands-ranch-co");
  assert.equal(cityPartOfSlug("become-a-swimming-pool-host--ofallon-mo"), "ofallon-mo");
  assert.equal(cityPartOfSlug("san-diego-ca"), "san-diego-ca");
});

test("titlePlace reads 'in/en City, ST' and rejects a non-state code", () => {
  assert.deepEqual(titlePlace("Pool Rental in Chapel Hill, NC"), {
    city: "Chapel Hill",
    stateCode: "NC",
  });
  assert.deepEqual(titlePlace("Renta de Alberca en Austin, TX | Albercas Privadas por Hora"), {
    city: "Austin",
    stateCode: "TX",
  });
  assert.equal(titlePlace("Become a swimming pool host in Santa, FE"), null);
  assert.equal(titlePlace("San Diego Ca"), null);
  assert.equal(titlePlace(null), null);
});

test("lookup slug: state-suffixed whenever a state is known", () => {
  assert.equal(
    slugIdentity({ slug: "become-a-swimming-pool-host-aberdeen-sd" }).lookupSlug,
    "aberdeen-sd",
  );
  // bare host slug with no state anywhere: unchanged (cities row decides)
  assert.equal(
    slugIdentity({
      slug: "become-a-swimming-pool-host-akron",
      title: "Become a pool host in Akron",
    }).lookupSlug,
    "akron",
  );
  // full state name in the slug, confirmed by the title
  assert.equal(
    slugIdentity({
      slug: "become-a-swimming-pool-host-boise-idaho",
      title: "Become a Pool Host in Boise, ID",
    }).lookupSlug,
    "boise-id",
  );
  // ...but not without the title: "fort-washington" is not Fort, WA
  assert.equal(
    slugIdentity({ slug: "become-a-swimming-pool-host-fort-washington" }).lookupSlug,
    "fort-washington",
  );
  // bare renter slug: state from the title, so "jackson" can never resolve to another state
  assert.equal(
    slugIdentity({ slug: "jackson", title: "Pool Rental in Jackson, MS" }).lookupSlug,
    "jackson-ms",
  );
  // truncated slug repaired from the title
  assert.equal(
    slugIdentity({
      slug: "become-a-swimming-pool-host-newbury-park-a",
      title: "Become a Pool Host in Newbury Park, CA",
    }).lookupSlug,
    "newbury-park-ca",
  );
  // topic renter slug: the city the title names
  assert.equal(
    slugIdentity({
      slug: "birthday-pool-party-austin-tx",
      title: "Birthday Pool Party Rental in Austin, TX",
    }).lookupSlug,
    "austin-tx",
  );
});

test("place: cities row name wins, state token in the name is stripped", () => {
  const p = placeForPage(
    { slug: "become-a-swimming-pool-host-new-haven-ct" },
    { name: "New Haven CT", state_code: "CT" },
  );
  assert.equal(p.cityName, "New Haven");
  assert.equal(p.label, "New Haven, CT");
  const akron = placeForPage(
    { slug: "become-a-swimming-pool-host-akron" },
    { name: "Akron", state_code: "OH" },
  );
  assert.equal(akron.label, "Akron, OH");
  const sd = placeForPage({ slug: "san-diego-ca", title: "San Diego Ca" });
  assert.equal(sd.label, "San Diego, CA");
  const lower = placeForPage({
    slug: "become-a-swimming-pool-host-buffalo",
    title: "Become a Pool Host in buffalo, NY",
  });
  assert.equal(lower.label, "Buffalo, NY");
});

test("HOST H1 and title: host value, state always present", () => {
  const { copy } = copyFor(
    "become-a-swimming-pool-host-aberdeen-sd",
    "Become a Pool Host in Aberdeen, SD",
  );
  assert.equal(copy.intent, "host");
  assert.equal(
    copy.h1.text,
    "Rent out your pool in Aberdeen, SD by the hour. 0% host fees. Keep 100%.",
  );
  assert.equal(copy.h1.lead + " " + copy.h1.accent, copy.h1.text);
  // No stored seo_title: "{title} | Pool Rental Near Me", as before.
  assert.equal(copy.title, "Become a Pool Host in Aberdeen, SD | Pool Rental Near Me");
});

test("HOST <title>: the stored seo_title (title-test control arm) is kept unless it states a figure", () => {
  const kept = copyFor("become-a-swimming-pool-host-cabot-ar", "Become a Pool Host in Cabot, AR", null, {
    seo_title: "Cabot, AR: Make Money Renting Your Pool | Host Guide",
  }).copy;
  assert.equal(kept.title, "Cabot, AR: Make Money Renting Your Pool | Host Guide");
  for (const seo_title of [
    "Become a swimming pool host in Eureka, MO | Earn $40-$150/hr",
    "Become a Swimming Pool Host in Calipatria, CA | Earn $3K+/Mo",
    "Rent out your pool in Arlington, VA, earn 3k-10k/month",
  ]) {
    const c = copyFor("become-a-swimming-pool-host-eureka-mo", "Become a Pool Host in Eureka, MO", null, {
      seo_title,
    }).copy;
    assert.equal(c.title, "Become a Pool Host in Eureka, MO | 0% Host Fees", seo_title);
  }
  // A stored title with no figure ("Earn Extra Income in …") is a proposition, not a number.
  assert.equal(hasEarningsFigure("Earn Extra Income in Solon, OH Renting Your Pool"), false);
  assert.equal(hasEarningsFigure("earn up to $10,000/month"), true);
  assert.equal(hasEarningsFigure("Earn $3k+/mo"), true);
  assert.equal(hasEarningsFigure("0% host fees. Keep 100%."), false);
});

test("same-name cities in different states get different H1s", () => {
  const a = copyFor("become-a-swimming-pool-host-springfield-mo", "x").copy;
  const b = copyFor("become-a-swimming-pool-host-springfield-il", "x").copy;
  assert.notEqual(a.h1.text, b.h1.text);
  const ta = copyFor("become-a-swimming-pool-host-springfield-mo", "x", null, { seo_title: "Earn $3k in Springfield" }).copy;
  const tb = copyFor("become-a-swimming-pool-host-springfield-il", "x", null, { seo_title: "Earn $3k in Springfield" }).copy;
  assert.notEqual(ta.title, tb.title);
});

test("HOST hero and meta: a stored description with an earnings figure is not shown", () => {
  const page = {
    slug: "become-a-swimming-pool-host-newport-ky",
    title: "Become a Pool Host in Newport, KY",
    seo_description:
      "Host a pool in Newport, KY and earn $40-$150/hour. Start your side hustle and earn up to $10,000/month.",
  };
  const place = placeForPage(page, null);
  const copy = cityPageCopy(page, place, null);
  assert.equal(cleanStoredDescription(page), null);
  const meta = cityMetaDescription(page, place, copy, inventorySummaryOf({ exact: [], nearby: [], radiusMi: null }));
  assert.doesNotMatch(meta, /\$|\d+k/i);
  assert.match(meta, /^Rent out your pool in Newport, KY by the hour/);
  assert.match(hostValueSentence(place), /0% host fees: you keep 100% of your listed price/);
  assert.doesNotMatch(hostValueSentence(place), /\$/);
  const clean = { ...page, seo_description: "Turn your backyard pool into income in Newport, KY." };
  assert.equal(cityMetaDescription(clean, place, copy, inventorySummaryOf({ exact: [], nearby: [], radiusMi: null })), clean.seo_description);
});

test("place names: the stored title's spelling beats a misspelled slug or a census-style row name", () => {
  const cases = [
    ["become-a-swimming-pool-host-liguna-niguel-ca", "Become a Pool Host in Laguna Niguel, CA", null, "Laguna Niguel, CA"],
    ["become-a-swimming-pool-host-los-alamintos-ca", "Become a Pool Host in Los Alamitos, CA", null, "Los Alamitos, CA"],
    ["become-a-swimming-pool-host-eastion-pa", "Become a Pool Host in Easton, PA", null, "Easton, PA"],
    ["become-a-swimming-pool-host-moore-park-ca", "Become a Pool Host in Moorpark, CA", null, "Moorpark, CA"],
    ["become-a-swimming-pool-host-tuolumne-ca", "Become a Pool Host in Tuolumne City, CA", null, "Tuolumne City, CA"],
    ["become-a-swimming-pool-host-anchorage-ak", "Become a Pool Host in Anchorage, AK", { name: "Anchorage Municipality", state_code: "AK" }, "Anchorage, AK"],
    ["become-a-swimming-pool-host-anchorage-municipality-ak", "Become a swimming pool host in anchorage, AK", null, "Anchorage, AK"],
    ["become-a-swimming-pool-host-lexington-fayette-urban-county-ky", "Become a pool host in lexington-fayette, KY", null, "Lexington-Fayette, KY"],
    ["become-a-swimming-pool-host-bethel-park-municipality-pa", "Become a Pool Host in Bethel Park, PA", null, "Bethel Park, PA"],
  ];
  for (const [slug, title, row, want] of cases) {
    assert.equal(placeForPage({ slug, title }, row).label, want, slug);
  }
  // A different place in the title is not a respelling.
  assert.equal(similarPlaceName("north hollywood", "Los Angeles"), false);
  assert.equal(
    placeForPage({ slug: "become-a-swimming-pool-host-north-hollywood-ca", title: "Pool Rental in Los Angeles, CA" }).label,
    "North Hollywood, CA",
  );
  // The respelled city drives the cities lookup.
  assert.equal(
    slugIdentity({ slug: "become-a-swimming-pool-host-liguna-niguel-ca", title: "Become a Pool Host in Laguna Niguel, CA" }).lookupSlug,
    "laguna-niguel-ca",
  );
});

test("inventory centre: the bare cities slug is read for coordinates when a state is known", () => {
  assert.equal(slugIdentity({ slug: "houston", title: "Pool Rental in Houston, TX" }).centroidSlug, "houston");
  assert.equal(slugIdentity({ slug: "become-a-swimming-pool-host-houston-tx" }).centroidSlug, "houston");
  assert.equal(slugIdentity({ slug: "become-a-swimming-pool-host-akron" }).centroidSlug, null);
});

test("title_variant rows keep exactly the b3e2ace variant copy (cities row name, unstripped in <title>)", () => {
  const row = { name: "Washington DC", state_code: "DC" };
  const { copy } = copyFor("become-a-swimming-pool-host-washington-dc", "x", row, { title_variant: "C" });
  assert.equal(copy.title, getVariantCopy("C", "Washington DC", "DC").title);
  assert.equal(copy.h1.text, getVariantCopy("C", "Washington", "DC").h1);
  const mc = copyFor("become-a-swimming-pool-host-mcallen-tx", "Become a Pool Host in McAllen, TX", null, { title_variant: "B" }).copy;
  assert.equal(mc.title, getVariantCopy("B", "Mcallen", "TX").title);
});

test("RENTER H1 and title differ from the HOST page for the same city", () => {
  const host = copyFor(
    "become-a-swimming-pool-host-san-diego-ca",
    "Become a Pool Host in San Diego, CA",
  ).copy;
  const renter = copyFor("san-diego-ca", "San Diego Ca").copy;
  assert.equal(renter.intent, "renter");
  assert.equal(renter.h1.text, "Private pool rentals in San Diego, CA");
  assert.equal(renter.title, "Private Pool Rentals in San Diego, CA | Pool Rental Near Me");
  assert.notEqual(renter.h1.text, host.h1.text);
  assert.notEqual(renter.title, host.title);
});

test("RENTER topic pages keep their own stored title as H1", () => {
  const { copy, place } = copyFor(
    "birthday-pool-party-austin-tx",
    "Birthday Pool Party Rental in Austin, TX",
  );
  assert.equal(place.isTopic, true);
  assert.equal(copy.h1.text, "Birthday Pool Party Rental in Austin, TX");
  assert.equal(copy.title, "Birthday Pool Party Rental in Austin, TX | Pool Rental Near Me");
  const es = copyFor(
    "renta-de-alberca-austin-tx",
    "Renta de Alberca en Austin, TX | Albercas Privadas por Hora",
  ).copy;
  assert.equal(es.h1.text, "Renta de Alberca en Austin, TX");
  assert.equal(es.title, "Renta de Alberca en Austin, TX | Albercas Privadas por Hora");
  const city = copyFor("austin-tx", "Pool Rental in Austin, TX").copy;
  assert.notEqual(city.h1.text, copy.h1.text);
});

test("title_variant overrides apply to HOST pages unchanged, never to RENTER pages", () => {
  const { copy } = copyFor("become-a-swimming-pool-host-reston-va", "x", null, {
    title_variant: "b",
  });
  assert.equal(copy.variant, "B");
  assert.equal(copy.title, "Rent Out Your Pool in Reston, VA | List for Free");
  assert.equal(copy.h1.text, "Rent Out Your Pool in Reston, VA");
  assert.ok(copy.variantMetaDescription);
  const renter = copyFor("reston-va", "Pool Rental in Reston, VA", null, {
    title_variant: "A",
  }).copy;
  assert.equal(renter.variant, null);
  assert.equal(renter.h1.text, "Private pool rentals in Reston, VA");
});

test("renter wording states only the counts and distances it is given", () => {
  const place = placeForPage({ slug: "tempe-az", title: "Pool Rental in Tempe, AZ" });
  const base = {
    exactTotal: 0,
    nearbyTotal: 0,
    nearestMi: null,
    radiusMi: null,
    readFailed: false,
    nearbyChecked: true,
  };
  assert.equal(renterInventoryState(base), "none");
  // No coordinates: nearby was not checked, so nothing is said about "near".
  const unchecked = { ...base, nearbyChecked: false };
  assert.equal(renterInventoryState(unchecked), "unchecked");
  assert.equal(
    renterIntro(place, unchecked),
    "No pools are listed with Tempe, AZ as their city on Pool Rental Near Me yet. Search the map to see the pools listed near Tempe.",
  );
  assert.doesNotMatch(renterIntro(place, unchecked), /browse every pool|no pools near/i);
  assert.equal(
    renterIntro(place, base),
    "No pools are listed in Tempe, AZ yet. You can browse every pool listed on Pool Rental Near Me.",
  );
  assert.equal(
    renterIntro(place, { ...base, exactTotal: 1 }),
    "1 private pool is listed in Tempe, AZ on Pool Rental Near Me. Open a listing to see its photos and details.",
  );
  assert.equal(
    renterIntro(place, { ...base, exactTotal: 3, nearbyTotal: 2, radiusMi: 60 }),
    "3 private pools are listed in Tempe, AZ on Pool Rental Near Me. Open a listing to see its photos and details. 2 more are listed within 60 miles.",
  );
  assert.equal(
    renterIntro(place, { ...base, nearbyTotal: 4, nearestMi: 6.4, radiusMi: 60 }),
    "4 private pools are listed within 60 miles of Tempe, AZ on Pool Rental Near Me. The nearest is 6 miles from Tempe.",
  );
  // Nearby wording never claims the city itself has none (Queens: nearest 0.8 mi,
  // filed under the neighbourhood "Jamaica").
  assert.doesNotMatch(
    renterIntro(place, { ...base, nearbyTotal: 9, nearestMi: 0.8, radiusMi: 60 }),
    /No pools/,
  );
  // A failed read says nothing about how many pools there are.
  const failed = renterIntro(place, { ...base, readFailed: true });
  assert.equal(renterInventoryState({ ...base, readFailed: true }), "unknown");
  assert.doesNotMatch(failed, /\d|No pools/);
  for (const s of [
    base,
    { ...base, exactTotal: 2 },
    { ...base, nearbyTotal: 1, nearestMi: 0.4, radiusMi: 60 },
  ]) {
    const text = renterIntro(place, s);
    assert.doesNotMatch(text, /availab|book now|today|tonight|this week|reviews?|rated/i);
    assert.ok(renterMetaDescription(place, s).length <= 160);
  }
  assert.equal(formatMiles(0.4), "under 1 mile");
  assert.equal(formatMiles(1.2), "1 mile");
  assert.equal(formatMiles(12.6), "13 miles");
});

test("search links: one form per place", () => {
  assert.equal(searchHrefForPlace("Akron", "OH"), "/s?address=Akron%2C%20OH");
  assert.equal(searchHrefForPlace("akron", "oh"), "/s?address=Akron%2C%20OH");
  assert.equal(searchHrefForPlace("St. Louis", "MO"), "/s?address=St%20Louis%2C%20MO");
  assert.equal(searchHrefForPlace("New Haven CT", "CT"), "/s?address=New%20Haven%2C%20CT");
  assert.equal(searchHrefForPlace("Akron", null), "/s?address=Akron");
  assert.equal(searchHrefForPlace("Akron", ""), "/s?address=Akron");
  assert.equal(searchHrefForPlace(null, null), "/s");
  assert.equal(searchHrefForState("Ohio"), "/s?address=Ohio");
  assert.equal(searchHrefForState(null), "/s");
  for (const stored of [
    "/s?address=Akron%2C+OH",
    "/s?address=Akron%2C%20OH",
    "/s?address=akron%2C%20oh",
    "/s?address=Akron,%20OH",
    "/s?address=Akron%2COH",
  ]) {
    assert.equal(normalizeSearchHref(stored), "/s?address=Akron%2C%20OH", stored);
  }
  // Not a plain address-only search link: left alone.
  assert.equal(normalizeSearchHref("/s?keywords=party"), "/s?keywords=party");
  assert.equal(normalizeSearchHref("/s?address=X&bounds=1,2,3,4"), "/s?address=X&bounds=1,2,3,4");
  assert.equal(normalizeSearchHref("/p/hosting"), "/p/hosting");
  assert.equal(normalizeSearchHref("/s?address=%E0%A4%A"), "/s?address=%E0%A4%A");
});

test("RENTER topic and non-English pages keep their stored meta description", () => {
  const inv = inventorySummaryOf({ exact: [], nearby: [{ mi: 9 }], nearbyTotal: 4, radiusMi: 60, nearbyChecked: true });
  const topic = { slug: "birthday-pool-party-austin-tx", title: "Birthday Pool Party Rental in Austin, TX", seo_description: "Plan a birthday pool party in Austin." };
  const tp = placeForPage(topic, null);
  assert.equal(cityMetaDescription(topic, tp, cityPageCopy(topic, tp), inv), "Plan a birthday pool party in Austin.");
  const es = { slug: "renta-de-alberca-austin-tx", title: "Renta de Alberca en Austin, TX | Albercas", seo_description: "Encuentra renta de albercas privadas en Austin.", locale: "es" };
  const ep = placeForPage(es, null);
  assert.equal(cityMetaDescription(es, ep, cityPageCopy(es, ep), inv), es.seo_description);
  const city = { slug: "austin-tx", title: "Pool Rental in Austin, TX", seo_description: "Browse Austin pools with reviews." };
  const cp = placeForPage(city, null);
  assert.equal(
    cityMetaDescription(city, cp, cityPageCopy(city, cp), inv),
    "4 private pools are listed within 60 miles of Austin, TX on Pool Rental Near Me. The nearest is 9 miles from Austin.",
  );
});
