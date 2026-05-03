import * as React from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  nextPendingPage,
  scrapeContentPage,
} from "@/server/content-scrape.functions";
import { SiteHeader, SiteFooter } from "@/components/site-layout";

export const Route = createFileRoute("/admin/content-migration")({
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { redirect: "/admin/content-migration", mode: "signin" } });
  },
  component: AdminContentMigration,
});

function AdminContentMigration() {
  const [templateType, setTemplateType] = React.useState("host_acq_city");
  const [next, setNext] = React.useState<any>(null);
  const [scraped, setScraped] = React.useState<any>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadNext = React.useCallback(async () => {
    setError(null);
    setScraped(null);
    setBusy(true);
    try {
      const res = await nextPendingPage({
        data: { template_type: templateType },
      });
      setNext(res.page);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }, [templateType]);

  React.useEffect(() => {
    void loadNext();
  }, [loadNext]);

  const runScrape = async () => {
    if (!next?.id) return;
    setError(null);
    setBusy(true);
    try {
      const res = await scrapeContentPage({ data: { id: next.id } });
      setScraped(res.page);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-bold">Content migration scraper</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pulls one pending row at a time via Firecrawl so you can review
          before bulk-running.
        </p>

        <div className="mt-6 flex items-center gap-3">
          <label className="text-sm font-medium">template_type:</label>
          <select
            value={templateType}
            onChange={(e) => setTemplateType(e.target.value)}
            className="rounded border border-border bg-background px-2 py-1 text-sm"
          >
            <option value="host_acq_city">host_acq_city</option>
            <option value="public_pool">public_pool</option>
            <option value="event_guide">event_guide</option>
            <option value="resource">resource</option>
          </select>
          <button
            onClick={loadNext}
            disabled={busy}
            className="rounded-full border border-border px-4 py-1.5 text-sm"
          >
            Reload next
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {next ? (
          <div className="mt-6 rounded-2xl border border-border p-5">
            <div className="text-sm text-muted-foreground">Next pending</div>
            <div className="mt-1 font-mono text-sm">{next.url_path}</div>
            <a
              href={next.source_url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block text-xs text-primary underline"
            >
              {next.source_url}
            </a>
            <button
              onClick={runScrape}
              disabled={busy}
              className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
            >
              {busy ? "Scraping…" : "Scrape this page"}
            </button>
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">
            No pending rows for {templateType}.
          </p>
        )}

        {scraped && (
          <div className="mt-8 rounded-2xl border border-border p-5">
            <div className="text-sm text-muted-foreground">Scraped result</div>
            <div className="mt-1 font-semibold">{scraped.title}</div>
            <div className="text-xs text-muted-foreground">
              {scraped.seo_description}
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm">
                body_markdown ({scraped.body_markdown?.length ?? 0} chars)
              </summary>
              <pre className="mt-2 max-h-96 overflow-auto rounded bg-muted p-3 text-xs whitespace-pre-wrap">
                {scraped.body_markdown}
              </pre>
            </details>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm">
                raw_html ({scraped.raw_html?.length ?? 0} chars)
              </summary>
              <pre className="mt-2 max-h-96 overflow-auto rounded bg-muted p-3 text-xs">
                {scraped.raw_html?.slice(0, 5000)}
              </pre>
            </details>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
