import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Star, Search, LocateFixed, Waves, X } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { searchPools, type PoolCardData } from "@/lib/pool-search.functions";

export const Route = createFileRoute("/s")({
  loader: async () => await searchPools({ data: { perPage: 100 } }),
  head: () => ({
    meta: [
      { title: "Find a pool to rent near you — Pool Rental Near Me" },
      {
        name: "description",
        content: "Browse private pools you can rent by the hour near you. Book a backyard pool for the day.",
      },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  component: SearchPage,
});

const R_MILES = 3958.8;
function haversineMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R_MILES * Math.asin(Math.sqrt(h));
}

type Located = PoolCardData & { _dist?: number };

function SearchPage() {
  const { pools, total } = Route.useLoaderData();
  const [query, setQuery] = React.useState("");
  const [userLoc, setUserLoc] = React.useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = React.useState(false);

  const results: Located[] = React.useMemo(() => {
    const qq = query.trim().toLowerCase();
    let list: Located[] = (pools as PoolCardData[]).filter((p) =>
      !qq
        ? true
        : p.title?.toLowerCase().includes(qq) ||
          p.city?.toLowerCase().includes(qq) ||
          p.state?.toLowerCase().includes(qq),
    );
    if (userLoc) {
      list = list
        .map((p) => ({
          ...p,
          _dist: p.lat != null && p.lng != null ? haversineMiles(userLoc, { lat: p.lat, lng: p.lng }) : Infinity,
        }))
        .sort((a, b) => (a._dist ?? Infinity) - (b._dist ?? Infinity));
    }
    return list;
  }, [pools, query, userLoc]);

  const locate = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />

      {/* Hero search band */}
      <section className="bg-gradient-to-b from-cyan-50 to-white">
        <div className="mx-auto w-full max-w-6xl px-4 pt-10 pb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Find a pool to rent near you
          </h1>
          <p className="mt-2 text-slate-500">
            {userLoc ? "Sorted by distance from you." : "Private backyard pools, booked by the hour."}
          </p>

          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by city or pool name…"
                className="w-full pl-12 pr-10 py-3.5 rounded-xl border-2 border-slate-200 bg-white text-slate-800 outline-none transition-colors focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Clear"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={locate}
              disabled={locating}
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-white bg-cyan-500 hover:bg-cyan-600 active:scale-[0.98] shadow-lg shadow-cyan-200 transition-all disabled:opacity-60"
            >
              <LocateFixed className={locating ? "w-5 h-5 animate-pulse" : "w-5 h-5"} />
              {locating ? "Locating…" : userLoc ? "Near you" : "Use my location"}
            </button>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <p className="text-sm text-slate-500 mb-5">
          {results.length === total
            ? `${total} pool${total === 1 ? "" : "s"} available`
            : `${results.length} of ${total} pools`}
        </p>

        {results.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center">
            <Waves className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="mt-3 font-semibold text-slate-700">No pools match that search</p>
            <p className="text-sm text-slate-500">Try a different city or clear the search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
            {results.map((p) => (
              <PoolCard key={p.id} p={p} distance={p._dist} />
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

function PoolCard({ p, distance }: { p: Located; distance?: number }) {
  const place = [p.city, p.state].filter(Boolean).join(", ");
  return (
    <a href={p.url} className="group block">
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 shadow-sm">
        {p.imageUrl ? (
          <img
            src={p.imageUrl}
            alt={p.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <Waves className="w-10 h-10" />
          </div>
        )}

        {p.priceCents != null && (
          <div className="absolute bottom-3 left-3 px-3.5 py-1.5 bg-cyan-600 rounded-lg shadow-md">
            <span className="text-white font-bold">${Math.round(p.priceCents / 100)}</span>
            <span className="text-white/80 text-sm"> /hr</span>
          </div>
        )}

        {distance != null && isFinite(distance) && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-cyan-600" />
            <span className="text-sm font-semibold text-slate-700">
              {distance < 1 ? "<1" : Math.round(distance)} mi
            </span>
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-slate-900 leading-snug line-clamp-1 group-hover:text-cyan-700 transition-colors">
            {p.title}
          </h3>
          <span className="flex items-center gap-1 flex-shrink-0 text-sm">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="font-semibold text-slate-700">New</span>
          </span>
        </div>
        {place && (
          <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
            <MapPin className="w-3.5 h-3.5" />
            {place}
          </p>
        )}
      </div>
    </a>
  );
}
