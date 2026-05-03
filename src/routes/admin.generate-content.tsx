import * as React from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
// route: /admin/generate-content
import { supabase } from "@/integrations/supabase/client";
import { checkAdminRole } from "@/server/admin-auth.functions";
import { generateContentBatch } from "@/server/generate-content-batch.functions";
import { SiteHeader, SiteFooter } from "@/components/site-layout";

export const Route = createFileRoute("/admin/generate-content")({
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user)
      throw redirect({
        to: "/auth",
        search: { redirect: "/admin/generate-content", mode: "signin" },
      });
    const { isAdmin } = await checkAdminRole();
    if (!isAdmin) throw redirect({ to: "/" });
  },
  component: GenerateContentPage,
});

function GenerateContentPage() {
  const [theme, setTheme] = React.useState("");
  const [model, setModel] = React.useState("google/gemini-2.5-pro");
  const [busy, setBusy] = React.useState(false);
  const [dryRun, setDryRun] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await generateContentBatch({
        data: { theme: theme || undefined, model, dryRun },
      });
      setResult(res);
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
        <h1 className="text-3xl font-bold">Generate Content Batch</h1>
        <p className="mt-2 text-muted-foreground">
          Generates 10 unique, long-form, internally-linked PRNM pages via Gemini
          and inserts them into <code>content_pages</code>. No SQL copy-paste.
        </p>

        <div className="mt-6 space-y-4 rounded-lg border border-border bg-card p-6">
          <div>
            <label className="block text-sm font-medium">
              Theme (optional)
            </label>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="e.g. Texas summer events, bachelorette parties, host pricing strategies"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="google/gemini-2.5-pro">
                Gemini 2.5 Pro (best quality)
              </option>
              <option value="google/gemini-3.1-pro-preview">
                Gemini 3.1 Pro Preview
              </option>
              <option value="google/gemini-2.5-flash">
                Gemini 2.5 Flash (faster)
              </option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
            />
            Dry run (validate only, do not insert)
          </label>

          <button
            onClick={run}
            disabled={busy}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {busy
              ? "Generating… (60–120s)"
              : dryRun
                ? "Generate & Validate"
                : "Generate & Insert 10 Pages"}
          </button>

          {error && (
            <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        {result && (
          <div className="mt-6 rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {result.ok ? "✓ Success" : "✗ Issues"}
              </h2>
              <div className="text-sm text-muted-foreground">
                {result.inserted ?? 0} inserted / {result.attempted} attempted
              </div>
            </div>
            {result.validationErrors?.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium">
                  {result.validationErrors.length} validation note(s)
                </summary>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {result.validationErrors.map((e: string, i: number) => (
                    <li key={i}>• {e}</li>
                  ))}
                </ul>
              </details>
            )}
            <ul className="mt-4 space-y-2">
              {result.pages?.map((p: any) => (
                <li key={p.slug} className="text-sm">
                  <a
                    href={`/p/${p.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    /p/{p.slug}
                  </a>
                  <span className="ml-2 text-muted-foreground">{p.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
