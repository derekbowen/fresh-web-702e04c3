import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { searchListings } from "@/server/sharetribe.server";
import type { ListingSummary } from "@/server/sharetribe.functions";

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
  categories: HomeCategory[];
  listings: ListingSummary[];
  nearby: {
    city: string | null;
    region: string | null;
    count: number;
  };
};

const emptyListingResult = { total: 0, listings: [], page: 1, totalPages: 0 };

const EMPTY_HOME_DATA: HomeData = {
  cities: [],
  categories: [],
  listings: [],
  nearby: { city: null, region: null, count: 0 },
};

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

    const [cities, categories, listingsResult, nearbyResult] = await Promise.all([
      safe(
        supabaseAdmin
          .from("cities")
          .select("slug, name, state_code")
          .eq("is_published", true)
          .order("name")
          .limit(60)
          .then((r) => r),
        "cities query",
        { data: [] as HomeCity[] } as { data: HomeCity[] | null },
      ),
      safe(
        supabaseAdmin
          .from("categories")
          .select("slug, name, icon")
          .eq("is_published", true)
          .order("name")
          .then((r) => r),
        "categories query",
        { data: [] as HomeCategory[] } as { data: HomeCategory[] | null },
      ),
      safe(searchListings({ perPage: 6 }), "searchListings (featured)", emptyListingResult),
      origin
        ? safe(searchListings({ perPage: 1, origin }), "searchListings (nearby)", emptyListingResult)
        : Promise.resolve(emptyListingResult),
    ]);

    return {
      cities: (cities.data ?? []) as HomeCity[],
      categories: (categories.data ?? []) as HomeCategory[],
      listings: listingsResult.listings,
      nearby: {
        city: visitorCity,
        region: visitorRegion,
        count: origin ? nearbyResult.total : 0,
      },
    };
  } catch (err) {
    console.error("homepage getHomeData fatal failure, returning empty data:", err);
    return EMPTY_HOME_DATA;
  }
});
