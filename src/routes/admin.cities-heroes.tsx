import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { runHeroBackfill } from "@/server/cities-hero-backfill.functions";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-layout";

export const Route = createFileRoute("/admin/cities-heroes")({
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth" as never });
    }
  },
  component: AdminHeroBackfillPage,
  head: () => ({ meta: [{ title: "Backfill city heroes — Admin" }] }),
});

type Result = {
  slug: string;
  name: string;
  source_url: string;
  status: "ok" | "miss" | "error" | "skipped";
  hero_url?: string;
  error?: string;
};

function AdminHeroBackfillPage() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [summary, setSummary] = useState<Record<string, number> | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  async function run(force: boolean) {
    if (running) return;
    setRunning(true);
    setErrMsg(null);
    setResults([]);
    setSummary(null);
    try {
      const out = await runHeroBackfill({ data: { force } });
      setResults(out.results);
      setSummary(out.summary);
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  }

  function downloadMissesCsv() {
    const misses = results.filter((r) => r.status !== "ok");
    const csv =
      "slug,name,status,source_url,error\n" +
      misses
        .map((r) =>
          [
            r.slug,
            JSON.stringify(r.name),
            r.status,
            r.source_url,
            JSON.stringify(r.error ?? ""),
          ].join(","),
        )
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "city-hero-misses.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link to="/" className="text-sm text-muted-foreground hover:underline">
            ← Home
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            City hero image backfill
          </h1>
          <p className="mt-2 text-muted-foreground">
            Scrapes the source page for each city and saves the unique hero into
            the database. Admin only.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            disabled={running}
            onClick={() => run(false)}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {running ? "Running…" : "Backfill missing only"}
          </button>
          <button
            disabled={running}
            onClick={() => run(true)}
            className="inline-flex items-center justify-center rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary disabled:opacity-50"
          >
            {running ? "Running…" : "Force re-scrape all"}
          </button>
          {results.length > 0 && (
            <button
              onClick={downloadMissesCsv}
              className="inline-flex items-center justify-center rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"
            >
              Download misses CSV
            </button>
          )}
        </div>

        {errMsg && (
          <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {errMsg}
          </div>
        )}

        {summary && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Object.entries(summary).map(([k, v]) => (
              <div
                key={k}
                className="rounded-lg border border-border bg-card p-4 text-center"
              >
                <div className="text-2xl font-bold">{v}</div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {k}
                </div>
              </div>
            ))}
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-8 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">City</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Hero / error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {results.map((r) => (
                  <tr key={r.slug} className="align-top">
                    <td className="px-3 py-2 font-mono text-xs">
                      <span
                        className={
                          r.status === "ok"
                            ? "text-emerald-600"
                            : r.status === "miss"
                              ? "text-amber-600"
                              : "text-destructive"
                        }
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.slug}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <a
                        href={r.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        {r.source_url.replace("https://www.", "")}
                      </a>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {r.hero_url ? (
                        <a
                          href={r.hero_url}
                          target="_blank"
                          rel="noreferrer"
                          className="break-all text-primary hover:underline"
                        >
                          {r.hero_url.slice(0, 80)}…
                        </a>
                      ) : (
                        <span className="text-muted-foreground">
                          {r.error ?? "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
