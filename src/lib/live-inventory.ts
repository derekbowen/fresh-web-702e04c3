// Live inventory from a build-time snapshot of published Sharetribe listings.
// Baked into the bundle on purpose: hub pages must render with zero runtime
// dependency on Sharetribe or Supabase. Refresh = regenerate the JSON + rebuild.
import snapshot from "@/lib/data/listings-snapshot.json";

export type LiveListing = {
  id: string; slug: string; title: string; city: string; state: string;
  price: number | null; currency: string; img: string | null;
  lat: number | null; lng: number | null;
};

export const LISTINGS: LiveListing[] = snapshot as LiveListing[];

const toRad = (d: number) => (d * Math.PI) / 180;
function miles(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 3958.8;
  const dLat = toRad(bLat - aLat), dLng = toRad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function listingsNear(lat: number, lng: number, radiusMi: number): (LiveListing & { mi: number })[] {
  return LISTINGS
    .filter((l) => l.lat != null && l.lng != null)
    .map((l) => ({ ...l, mi: miles(lat, lng, l.lat as number, l.lng as number) }))
    .filter((l) => l.mi <= radiusMi)
    .sort((a, b) => a.mi - b.mi);
}

export function listingsInCity(city: string, state: string): LiveListing[] {
  const c = city.trim().toLowerCase(), s = state.trim().toUpperCase();
  return LISTINGS.filter((l) => l.city.toLowerCase() === c && l.state === s);
}
