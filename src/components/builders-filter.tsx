import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";

export type BuilderRow = {
  slug: string;
  name: string;
  city?: string | null;
  city_slug?: string | null;
  state_code?: string | null;
  rating?: number | null;
  rating_count?: number | null;
  business_type?: string | null;
  logo_url?: string | null;
  address?: string | null;
};

type Props = {
  providers: BuilderRow[];
  /** Show city filter dropdown (state page yes, city page no) */
  showCityFilter?: boolean;
  /** Optional fallback state code shown next to city when row is missing one */
  fallbackStateCode?: string;
};

const RATING_OPTIONS = [
  { value: "0", label: "Any rating" },
  { value: "3", label: "3.0+ stars" },
  { value: "4", label: "4.0+ stars" },
  { value: "4.5", label: "4.5+ stars" },
];

export function BuildersFilter({ providers, showCityFilter = false, fallbackStateCode }: Props) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("all");
  const [minRating, setMinRating] = useState("0");
  const [category, setCategory] = useState("all");

  const cities = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of providers) {
      if (p.city && p.city_slug) map.set(p.city_slug, p.city);
    }
    return Array.from(map.entries())
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [providers]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of providers) {
      if (p.business_type) set.add(p.business_type);
    }
    return Array.from(set).sort();
  }, [providers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const minR = Number(minRating);
    return providers.filter((p) => {
      if (q) {
        const hay = `${p.name} ${p.city ?? ""} ${p.business_type ?? ""} ${p.address ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (city !== "all" && p.city_slug !== city) return false;
      if (category !== "all" && p.business_type !== category) return false;
      if (minR > 0 && (typeof p.rating !== "number" || p.rating < minR)) return false;
      return true;
    });
  }, [providers, query, city, category, minRating]);

  const reset = () => {
    setQuery("");
    setCity("all");
    setMinRating("0");
    setCategory("all");
  };

  const hasFilters = query !== "" || city !== "all" || minRating !== "0" || category !== "all";

  return (
    <div>
      <div className="rounded-2xl border border-border bg-card/50 p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-12">
          <div className="md:col-span-5">
            <label className="sr-only" htmlFor="builders-q">Search builders</label>
            <Input
              id="builders-q"
              type="search"
              placeholder="Search by name, address, or service…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {showCityFilter && (
            <div className="md:col-span-3">
              <select
                aria-label="Filter by city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="all">All cities ({cities.length})</option>
                {cities.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className={showCityFilter ? "md:col-span-2" : "md:col-span-3"}>
            <select
              aria-label="Filter by minimum rating"
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {RATING_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className={showCityFilter ? "md:col-span-2" : "md:col-span-4"}>
            <select
              aria-label="Filter by category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
          <p className="text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {providers.length} builders
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={reset}
              className="text-sm font-medium text-primary hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="mt-6">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-foreground">No builders match your filters.</p>
            <button onClick={reset} className="mt-3 text-sm font-medium text-primary hover:underline">
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <Link
                key={p.slug}
                to="/providers/$slug"
                params={{ slug: p.slug }}
                className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
              >
                {p.logo_url ? (
                  <img src={p.logo_url} alt="" className="h-14 w-14 rounded-lg object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
                    {p.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-foreground">{p.name}</h3>
                  {p.city && (
                    <p className="text-sm text-muted-foreground">
                      {p.city}{p.state_code || fallbackStateCode ? `, ${p.state_code ?? fallbackStateCode}` : ""}
                    </p>
                  )}
                  {typeof p.rating === "number" && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      ★ {p.rating} {p.rating_count ? `(${p.rating_count})` : ""}
                    </p>
                  )}
                  {p.business_type && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{p.business_type}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
