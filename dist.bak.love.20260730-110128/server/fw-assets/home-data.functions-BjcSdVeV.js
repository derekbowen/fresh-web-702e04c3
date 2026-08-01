import { c as createServerRpc } from "./createServerRpc-D_-6bKnO.js";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import { searchListings, fetchShareListing } from "./sharetribe.server-BZ7y3aGI.js";
import { A as ACADEMY_SLUGS, c as classifyAcademyHealth, a as ACADEMY_OCCASION_SLUGS } from "./academy-config-B5vgptOj.js";
import { c as createServerFn, g as getRequest } from "../server.js";
import "@supabase/supabase-js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "react";
import "@tanstack/react-router";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
const JAN_LISTING_ID = "6a1a4c13-02fe-458e-89ba-e33b5fc7612b";
const emptyListingResult = {
  total: 0,
  listings: [],
  page: 1,
  totalPages: 0
};
const EMPTY_HOME_DATA = {
  cities: [],
  cityCount: 0,
  categories: [],
  listings: [],
  nearby: {
    city: null,
    region: null,
    count: 0,
    nearestMiles: null
  },
  academyAvailable: [],
  academyHealth: Object.fromEntries(ACADEMY_SLUGS.map((s) => [s, "missing"])),
  janFeatured: null
};
function haversineMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.7613;
  const toRad = (d) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
const getHomeData_createServerFn_handler = createServerRpc({
  id: "946ed872e43e051c3166418ae18f78cd38726d78075996dd9d4bf32abbebaea3",
  name: "getHomeData",
  filename: "src/server/home-data.functions.ts"
}, (opts) => getHomeData.__executeServer(opts));
const getHomeData = createServerFn({
  method: "GET"
}).handler(getHomeData_createServerFn_handler, async () => {
  try {
    let cf = {};
    try {
      const req = getRequest();
      cf = req.cf ?? {};
    } catch (err) {
      console.error("homepage getRequest failed:", err);
    }
    const visitorCity = cf.city ?? null;
    const visitorRegion = cf.region ?? null;
    const origin = cf.latitude && cf.longitude ? `${cf.latitude},${cf.longitude}` : void 0;
    const safe = async (p, label, fallback) => {
      try {
        return await p;
      } catch (err) {
        console.error(`homepage ${label} failed:`, err);
        return fallback;
      }
    };
    const [cities, cityCountRes, categories, featuredResult, nearbyResult, academyRes, janListing] = await Promise.all([safe(Promise.resolve(supabaseAdmin.from("cities").select("slug, name, state_code").eq("is_published", true).order("name").limit(60)), "cities query", {
      data: []
    }), safe(Promise.resolve(supabaseAdmin.from("cities").select("*", {
      count: "exact",
      head: true
    }).eq("is_published", true)), "city count query", {
      count: 0
    }), safe(Promise.resolve(supabaseAdmin.from("categories").select("slug, name, icon").eq("is_published", true).order("name")), "categories query", {
      data: []
    }), safe(searchListings({
      perPage: 24
    }), "searchListings (featured)", emptyListingResult), origin ? safe(searchListings({
      perPage: 5,
      origin
    }), "searchListings (nearby)", emptyListingResult) : Promise.resolve(emptyListingResult), safe((async () => {
      const {
        data
      } = await supabaseAdmin.from("content_pages").select("slug, body_markdown").in("slug", ACADEMY_SLUGS).eq("status", "published");
      return data ?? [];
    })(), "academy availability query", []), safe(fetchShareListing(JAN_LISTING_ID), "Jan featured listing", null)]);
    const filteredFeatured = featuredResult.listings.filter((l) => typeof l.imageUrl === "string" && l.imageUrl.length > 0);
    const listingsResult = {
      ...featuredResult,
      listings: filteredFeatured.slice(0, 12)
    };
    let visitorLat = null;
    let visitorLng = null;
    if (cf.latitude && cf.longitude) {
      const lat = Number(cf.latitude);
      const lng = Number(cf.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        visitorLat = lat;
        visitorLng = lng;
      }
    }
    if (visitorLat !== null && visitorLng !== null) {
      for (const l of listingsResult.listings) {
        if (l.geolocation) {
          l.distanceMiles = haversineMiles(visitorLat, visitorLng, l.geolocation.lat, l.geolocation.lng);
        }
      }
    }
    let nearestMiles = null;
    if (visitorLat !== null && visitorLng !== null && nearbyResult.listings.length > 0) {
      for (const l of nearbyResult.listings) {
        if (l.geolocation) {
          const d = haversineMiles(visitorLat, visitorLng, l.geolocation.lat, l.geolocation.lng);
          if (nearestMiles === null || d < nearestMiles) nearestMiles = d;
        }
      }
    }
    const academyHealth = Object.fromEntries(ACADEMY_SLUGS.map((s) => [s, "missing"]));
    for (const r of academyRes) {
      if (!r.slug || !ACADEMY_SLUGS.includes(r.slug)) continue;
      academyHealth[r.slug] = classifyAcademyHealth((r.body_markdown ?? "").trim().length);
    }
    const academyAvailable = ACADEMY_SLUGS.filter((s) => academyHealth[s] !== "missing");
    const missingSlugs = ACADEMY_SLUGS.filter((s) => academyHealth[s] === "missing");
    const shortSlugs = ACADEMY_SLUGS.filter((s) => academyHealth[s] === "short");
    const healthyOccasionCount = ACADEMY_OCCASION_SLUGS.filter((s) => academyHealth[s] === "published").length;
    const hubsHealthy = academyHealth["learning-academy"] === "published" || academyHealth["host-training-academy"] === "published";
    const sectionHidden = healthyOccasionCount < 2 || !hubsHealthy;
    if (sectionHidden || missingSlugs.length > 0 || shortSlugs.length > 0) {
      console.warn(JSON.stringify({
        tag: "academy_health",
        sectionHidden,
        healthyOccasionCount,
        hubsHealthy,
        missing: missingSlugs,
        short: shortSlugs,
        totalTracked: ACADEMY_SLUGS.length
      }));
    }
    const cityList = cities.data ?? [];
    return {
      cities: cityList,
      cityCount: cityCountRes.count ?? cityList.length,
      categories: categories.data ?? [],
      listings: listingsResult.listings,
      nearby: {
        city: visitorCity,
        region: visitorRegion,
        count: origin ? nearbyResult.total : 0,
        nearestMiles
      },
      academyAvailable,
      academyHealth,
      janFeatured: janListing ? {
        heroImage: janListing.heroImage
      } : null
    };
  } catch (err) {
    console.error("homepage getHomeData fatal failure, returning empty data:", err);
    return EMPTY_HOME_DATA;
  }
});
export {
  getHomeData_createServerFn_handler
};
