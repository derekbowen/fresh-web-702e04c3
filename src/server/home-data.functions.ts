import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { searchListings } from "@/server/sharetribe.server";
import type { ListingSummary } from "@/server/sharetribe.functions";
import {
  ACADEMY_SLUGS,
  ACADEMY_OCCASION_SLUGS,
  classifyAcademyHealth,
  type AcademyHealth,
} from "@/lib/academy-config";

export type HomeCity = {
  slug: string;
  name: string;
  state_code: string;
};

export type HomeCategory = {
  slug: string;
  name: string;
  icon: string | null;
};

export type HomeData = {
  cities: HomeCity[];
  cityCount: number;
  categories: HomeCategory[];
  listings: ListingSummary[];
  nearby: {
    city: string | null;
    region: string | null;
    count: number;
    /** Distance in miles to the nearest pool from the visitor location. */
    nearestMiles: number | null;
  };
  /** Slugs of academy pages that currently have published, non-empty content. */
  academyAvailable: string[];
  /**
   * Per-slug content-health for each academy page the homepage may link to.
   * - "missing":   no row, unpublished, or empty/near-empty body (<200 chars)
   * - "short":     published but body is thin (200–799 chars) — usable but
   *                low quality; UI may still link but should not feature.
   * - "published": published with substantial content (≥800 chars)
   */
  academyHealth: Record<string, AcademyHealth>;
};

const emptyListingResult = { total: 0, listings: [], page: 1, totalPages: 0 };

const EMPTY_HOME_DATA: HomeData = {
  cities: [],
  cityCount: 0,
  categories: [],
  listings: [],
  nearby: { city: null, region: null, count: 0, nearestMiles: null },
  academyAvailable: [],
  academyHealth: Object.fromEntries(
    ACADEMY_SLUGS.map((s) => [s, "missing" as const]),
  ) as Record<string, "missing" | "short" | "published">,
};

function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 3958.7613; // Earth radius in miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}


export const getHomeData = createServerFn({ method: "GET" }).handler(async (): Promise<HomeData> => {
  try {
    let cf: { city?: string; region?: string; latitude?: string; longitude?: string } = {};
    try {
      const req = getRequest() as Request & {
        cf?: { city?: string; region?: string; latitude?: string; longitude?: string };
      };
      cf = req.cf ?? {};
    } catch (err) {
      console.error("homepage getRequest failed:", err);
    }

    const visitorCity = cf.city ?? null;
    const visitorRegion = cf.region ?? null;
    const origin =
      cf.latitude && cf.longitude ? `${cf.latitude},${cf.longitude}` : undefined;

    const safe = async <T>(p: Promise<T>, label: string, fallback: T): Promise<T> => {
      try {
        return await p;
      } catch (err) {
        console.error(`homepage ${label} failed:`, err);
        return fallback;
      }
    };

    const [cities, cityCountRes, categories, californiaResult, generalResult, nearbyResult, academyRes] = await Promise.all([
      safe(
        Promise.resolve(
          supabaseAdmin
            .from("content_pages")
            .select("slug, name, state_code")
            .eq("kind", "city")
            .eq("status", "published")
            .order("name")
            .limit(72),
        ),
        "cities query",
        { data: [] as HomeCity[] } as { data: HomeCity[] | null },
      ),
      safe(
        Promise.resolve(
          supabaseAdmin
            .from("content_pages")
            .select("slug", { count: "exact", head: true })
            .eq("kind", "city")
            .eq("status", "published"),
        ),
        "cities count query",
        { count: 0 } as { count: number | null },
      ),
      safe(
        Promise.resolve(
          supabaseAdmin
            .from("categories")
            .select("slug, name, icon")
            .eq("is_published", true)
            .order("name"),
        ),
        "categories query",
        { data: [] as HomeCategory[] } as { data: HomeCategory[] | null },
      ),
      safe(searchListings({ perPage: 6, stateCode: "CA" }), "searchListings (CA)", emptyListingResult),
      safe(searchListings({ perPage: 12 }), "searchListings (featured)", emptyListingResult),
      origin
        ? safe(searchListings({ perPage: 5, origin }), "searchListings (nearby)", emptyListingResult)
        : Promise.resolve(emptyListingResult),
      safe(
        (async () => {
          const { data } = await supabaseAdmin
            .from("content_pages")
            .select("slug, body_markdown")
            .in("slug", ACADEMY_SLUGS)
            .eq("status", "published");
          return (data ?? []) as { slug: string | null; body_markdown: string | null }[];
        })(),
        "academy availability query",
        [] as { slug: string | null; body_markdown: string | null }[],
      ),
    ]);

    // Combine 6 California pools + fill to 12 with general featured (deduped by id).
    const seen = new Set<string>();
    const mergedListings = [];
    for (const l of californiaResult.listings) {
      if (l.id && !seen.has(l.id)) {
        seen.add(l.id);
        mergedListings.push(l);
      }
      if (mergedListings.length >= 6) break;
    }
    for (const l of generalResult.listings) {
      if (mergedListings.length >= 12) break;
      if (l.id && !seen.has(l.id)) {
        seen.add(l.id);
        mergedListings.push(l);
      }
    }
    const listingsResult = { ...generalResult, listings: mergedListings };

    let nearestMiles: number | null = null;
    if (cf.latitude && cf.longitude && nearbyResult.listings.length > 0) {
      const lat = Number(cf.latitude);
      const lng = Number(cf.longitude);
      for (const l of nearbyResult.listings) {
        if (l.geolocation) {
          const d = haversineMiles(lat, lng, l.geolocation.lat, l.geolocation.lng);
          if (nearestMiles === null || d < nearestMiles) nearestMiles = d;
        }
      }
    }

    const academyHealth: Record<string, AcademyHealth> = Object.fromEntries(
      ACADEMY_SLUGS.map((s) => [s, "missing" as const]),
    );
    for (const r of academyRes) {
      if (!r.slug || !ACADEMY_SLUGS.includes(r.slug)) continue;
      academyHealth[r.slug] = classifyAcademyHealth(
        (r.body_markdown ?? "").trim().length,
      );
    }
    const academyAvailable: string[] = ACADEMY_SLUGS.filter(
      (s) => academyHealth[s] !== "missing",
    );

    // Track regressions: log a structured event whenever the homepage academy
    // block would hide or render in a degraded state. Picked up by Cloudflare
    // Worker logs / server-function-logs and easily greppable by `tag`.
    const missingSlugs = ACADEMY_SLUGS.filter((s) => academyHealth[s] === "missing");
    const shortSlugs = ACADEMY_SLUGS.filter((s) => academyHealth[s] === "short");
    const healthyOccasionCount = ACADEMY_OCCASION_SLUGS.filter(
      (s) => academyHealth[s] === "published",
    ).length;
    const hubsHealthy =
      academyHealth["learning-academy"] === "published" ||
      academyHealth["host-training-academy"] === "published";
    const sectionHidden = healthyOccasionCount < 2 || !hubsHealthy;
    if (sectionHidden || missingSlugs.length > 0 || shortSlugs.length > 0) {
      console.warn(
        JSON.stringify({
          tag: "academy_health",
          sectionHidden,
          healthyOccasionCount,
          hubsHealthy,
          missing: missingSlugs,
          short: shortSlugs,
          totalTracked: ACADEMY_SLUGS.length,
        }),
      );
    }

    const cityList = (cities.data ?? []) as HomeCity[];
    return {
      cities: cityList,
      cityCount: cityCountRes.count ?? cityList.length,
      categories: (categories.data ?? []) as HomeCategory[],
      listings: listingsResult.listings,
      nearby: {
        city: visitorCity,
        region: visitorRegion,
        count: origin ? nearbyResult.total : 0,
        nearestMiles,
      },
      academyAvailable,
      academyHealth,
    };
  } catch (err) {
    console.error("homepage getHomeData fatal failure, returning empty data:", err);
    return EMPTY_HOME_DATA;
  }
});
