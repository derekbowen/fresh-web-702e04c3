import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { checkAdminRole } from "@/server/admin-auth.functions";
import { AdminLayout } from "@/components/admin-layout";
import {
  generateActivityCityPages,
  listActivityCityPages,
  listCandidateCities,
  publishActivityCityPages,
} from "@/server/activity-city-generator.functions";

export const Route = createFileRoute("/admin/activity-cities")({
  component: ActivityCitiesAdmin,
});

function useAdminGate() {
  const navigate = useNavigate();
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!data.user) {
        navigate({ to: "/auth", search: { redirect: "/admin/activity-cities", mode: "signin" } });
        return;
      }
      const { isAdmin } = await checkAdminRole();
      if (cancelled) return;
      if (!isAdmin) {
        navigate({ to: "/admin/no-access" });
        return;
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);
  return ready;
}

type Activity = { key: string; label: string; slugPrefix: string };
type ListRow = { slug: string; seo_title: string | null; status: string; updated_at: string; word_count: number };
type City = { slug: string; name: string; state_code: string };
type GenResult = {
  slug: string;
  citySlug: string;
  cityName: string;
  status: string;
  error?: string;
  wordCount?: number;
  seoTitle?: string;
};

const PILOT_CITY_SLUGS = [
  "los-angeles-ca",
  "new-york-ny",
  "houston-tx",
  "miami-fl",
  "phoenix-az",
  "san-diego-ca",
  "chicago-il",
  "dallas-tx",
  "austin-tx",
];

function ActivityCitiesAdmin() {
  const ready = useAdminGate();
  if (!ready) {
    return (
      <AdminLayout>
        <p className="text-sm text-muted-foreground">Checking admin access…</p>
      </AdminLayout>
    );
  }
  return <ActivityCitiesInner />;
}

function ActivityCitiesInner() {
  const [activities, setActivities] = React.useState<Activity[]>([]);
  const [rows, setRows] = React.useState<ListRow[]>([]);
  const [cities, setCities] = React.useState<City[]>([]);
  const [activity, setActivity] = React.useState<string>("pool-party");
  const [selectedCities, setSelectedCities] = React.useState<string[]>(PILOT_CITY_SLUGS);
  const [busy, setBusy] = React.useState(false);
  const [results, setResults] = React.useState<GenResult[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [dryRun, setDryRun] = React.useState(false);

  const refresh = React.useCallback(async () => {
    try {
      const list = await listActivityCityPages();
      setActivities(list.activities);
      setRows(list.rows);
      const c = await listCandidateCities({ data: { limit: 50 } });
      setCities(c.cities);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleCity = (slug: string) => {
    setSelectedCities((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const runGenerate = async () => {
    setBusy(true);
    setError(null);
    setResults([]);
    try {
      const res = await generateActivityCityPages({
        data: { activity: activity as any, citySlugs: selectedCities, dryRun },
      });
      setResults(res.pages);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const publishAllDrafts = async () => {
    const draftSlugs = rows.filter((r) => r.status === "draft").map((r) => r.slug);
    if (draftSlugs.length === 0) return;
    if (!confirm(`Publish ${draftSlugs.length} draft pages?`)) return;
    setBusy(true);
    try {
      await publishActivityCityPages({ data: { slugs: draftSlugs } });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const draftCount = rows.filter((r) => r.status === "draft").length;
  const publishedCount = rows.filter((r) => r.status === "published").length;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <header>
          <h1 className="text-2xl font-bold">Activity-modifier city pages</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate /p/{`{activity}-{city-state}`} pages targeting Swimply's long-tail queries
            (pool party, baby shower, birthday party, hot tub, dog-friendly).
          </p>
          <div className="mt-3 flex gap-4 text-xs">
            <span className="rounded-full bg-muted px-3 py-1">
              {rows.length} total
            </span>
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-amber-700 dark:text-amber-300">
              {draftCount} drafts
            </span>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-700 dark:text-emerald-300">
              {publishedCount} published
            </span>
          </div>
        </header>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Generate batch</h2>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium">Activity</label>
              <select
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {activities.map((a) => (
                  <option key={a.key} value={a.key}>
                    {a.label} ({a.slugPrefix}*)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Cities ({selectedCities.length} selected)
                </label>
                <div className="flex gap-2 text-xs">
                  <button
                    onClick={() => setSelectedCities(PILOT_CITY_SLUGS)}
                    className="rounded border border-border px-2 py-1 hover:bg-muted"
                  >
                    Pilot 9
                  </button>
                  <button
                    onClick={() => setSelectedCities(cities.map((c) => c.slug))}
                    className="rounded border border-border px-2 py-1 hover:bg-muted"
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSelectedCities([])}
                    className="rounded border border-border px-2 py-1 hover:bg-muted"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="mt-2 grid max-h-64 grid-cols-2 gap-1 overflow-y-auto rounded-md border border-border bg-background p-2 text-xs sm:grid-cols-3">
                {cities.map((c) => (
                  <label key={c.slug} className="flex cursor-pointer items-center gap-2 px-2 py-1 hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={selectedCities.includes(c.slug)}
                      onChange={() => toggleCity(c.slug)}
                    />
                    <span>
                      {c.name}, {c.state_code}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
              Dry run (skip AI call & insert; preview slugs only)
            </label>

            <div className="flex gap-3">
              <button
                onClick={runGenerate}
                disabled={busy || selectedCities.length === 0}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {busy ? "Generating…" : `Generate ${selectedCities.length} page${selectedCities.length === 1 ? "" : "s"}`}
              </button>
              <button
                onClick={publishAllDrafts}
                disabled={busy || draftCount === 0}
                className="rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50"
              >
                Publish {draftCount} drafts
              </button>
            </div>

            {error && (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}
          </div>
        </section>

        {results.length > 0 && (
          <section className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold">Latest run</h2>
            <ul className="mt-3 divide-y divide-border text-sm">
              {results.map((r) => (
                <li key={r.slug} className="py-2">
                  <div className="flex items-baseline justify-between">
                    <a href={`/p/${r.slug}`} target="_blank" rel="noreferrer" className="font-mono text-xs text-primary hover:underline">
                      /p/{r.slug}
                    </a>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        r.status === "inserted"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : r.status === "skipped_exists"
                            ? "bg-muted text-muted-foreground"
                            : r.status === "dry_run"
                              ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                              : "bg-red-500/15 text-red-700 dark:text-red-300"
                      }`}
                    >
                      {r.status}
                      {r.wordCount ? ` · ${r.wordCount}w` : ""}
                    </span>
                  </div>
                  {r.seoTitle && <p className="mt-1 text-xs text-foreground/80">{r.seoTitle}</p>}
                  {r.error && <p className="mt-1 text-xs text-red-600">{r.error}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">All activity-city pages</h2>
          {rows.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">None yet. Generate your first batch above.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border text-sm">
              {rows.map((r) => (
                <li key={r.slug} className="py-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <a href={`/p/${r.slug}`} target="_blank" rel="noreferrer" className="truncate font-mono text-xs text-primary hover:underline">
                      /p/{r.slug}
                    </a>
                    <span className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">{r.word_count}w</span>
                      <span
                        className={`rounded-full px-2 py-0.5 ${
                          r.status === "published"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {r.status}
                      </span>
                    </span>
                  </div>
                  {r.seo_title && <p className="mt-1 text-xs text-foreground/70">{r.seo_title}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
