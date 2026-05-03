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

export const getHomeData = createServerFn({ method: "GET" }).handler(async (): Promise<HomeData> => {
  const req = getRequest() as Request & {
    cf?: { city?: string; region?: string; latitude?: string; longitude?: string };
  };
  const cf = req.cf ?? {};
  const visitorCity = cf.city ?? null;
  const visitorRegion = cf.region ?? null;
  const origin =
    cf.latitude && cf.longitude ? `${cf.latitude},${cf.longitude}` : undefined;

  const [cities, categories, listingsResult, nearbyResult] = await Promise.all([
    supabaseAdmin
      .from("cities")
      .select("slug, name, state_code")
      .eq("is_published", true)
      .order("name")
      .limit(60),
    supabaseAdmin
      .from("categories")
      .select("slug, name, icon")
      .eq("is_published", true)
      .order("name"),
    searchListings({ perPage: 6 }).catch((err) => {
      console.error("homepage searchListings (featured) failed:", err);
      return emptyListingResult;
    }),
    origin
      ? searchListings({ perPage: 1, origin }).catch((err) => {
          console.error("homepage searchListings (nearby) failed:", err);
          return emptyListingResult;
        })
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
});
