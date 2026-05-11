import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import {
  previewFaqForUrl,
  insertFaqIntoPage,
  bulkGenerateFaqs,
  type FaqPreview,
  type FaqItem,
  type BulkFaqResponse,
} from "@/lib/faq-generator.functions";

export const Route = createFileRoute("/admin/faq-generator")({
  component: FaqGeneratorPage,
});

function FaqGeneratorPage() {
  const [urlPath, setUrlPath] = React.useState("");
  const [count, setCount] = React.useState(6);
  const [replace, setReplace] = React.useState(true);
  const [preview, setPreview] = React.useState<FaqPreview | null>(null);
  const [editable, setEditable] = React.useState<FaqItem[]>([]);
  const [insertMsg, setInsertMsg] = React.useState<string | null>(null);

  const previewFn = useServerFn(previewFaqForUrl);
  const insertFn = useServerFn(insertFaqIntoPage);

  const previewMut = useMutation({
    mutationFn: () => previewFn({ data: { url_path: urlPath.trim(), count } }),
    onSuccess: (res) => {
      setPreview(res);
      setEditable(res.faqs);
      setInsertMsg(null);
    },
  });

  const insertMut = useMutation({
    mutationFn: () =>
      insertFn({ data: { url_path: urlPath.trim(), faqs: editable, replace_existing: replace } }),
    onSuccess: (res) => {
      setInsertMsg(res.success ? "Inserted into page." : `Failed: ${res.error}`);
    },
  });

  const updateFaq = (i: number, patch: Partial<FaqItem>) =>
    setEditable((arr) => arr.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const removeFaq = (i: number) => setEditable((arr) => arr.filter((_, idx) => idx !== i));

  return (
    <AdminLayout title="FAQ generator">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">AI FAQ generator</h1>
          <p className="text-sm text-muted-foreground">
            Pull the top Google Search queries for a URL and turn them into a FAQ block, then insert
            it into the page.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
            <input
              value={urlPath}
              onChange={(e) => setUrlPath(e.target.value)}
              placeholder="/p/los-angeles-ca"
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>{n} FAQs</option>
              ))}
            </select>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
              Replace existing
            </label>
            <button
              onClick={() => previewMut.mutate()}
              disabled={!urlPath.trim() || previewMut.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {previewMut.isPending ? "Generating…" : "Generate preview"}
            </button>
          </div>
          {previewMut.error && (
            <div className="text-sm text-destructive">{(previewMut.error as Error).message}</div>
          )}
          {preview?.error && <div className="text-sm text-destructive">{preview.error}</div>}
        </div>

        {preview && preview.queries.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-2 text-sm font-semibold">Source queries (last 90 days)</h2>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {preview.queries.slice(0, 20).map((q) => (
                <span key={q.query} className="rounded bg-muted px-2 py-1">
                  {q.query}
                  <span className="ml-1 text-muted-foreground">({q.impressions})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {editable.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Edit before insert</h2>
            {editable.map((f, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    value={f.question}
                    onChange={(e) => updateFaq(i, { question: e.target.value })}
                    className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm font-medium"
                  />
                  <button
                    onClick={() => removeFaq(i)}
                    className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                  >
                    Remove
                  </button>
                </div>
                <textarea
                  value={f.answer}
                  onChange={(e) => updateFaq(i, { answer: e.target.value })}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                />
              </div>
            ))}
            <div className="flex items-center gap-3">
              <button
                onClick={() => insertMut.mutate()}
                disabled={insertMut.isPending}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {insertMut.isPending ? "Inserting…" : "Insert into page"}
              </button>
              {insertMsg && <span className="text-sm text-muted-foreground">{insertMsg}</span>}
            </div>
          </div>
        )}

        {preview?.markdown && (
          <details className="rounded-lg border border-border bg-card p-4">
            <summary className="cursor-pointer text-sm font-semibold">Markdown preview</summary>
            <pre className="mt-3 overflow-x-auto rounded bg-muted p-3 text-xs">{preview.markdown}</pre>
          </details>
        )}
        {preview?.jsonLd && (
          <details className="rounded-lg border border-border bg-card p-4">
            <summary className="cursor-pointer text-sm font-semibold">FAQPage JSON-LD</summary>
            <pre className="mt-3 overflow-x-auto rounded bg-muted p-3 text-xs">{preview.jsonLd}</pre>
          </details>
        )}

        <BulkFaqSection />
      </div>
    </AdminLayout>
  );
}

function BulkFaqSection() {
  const [text, setText] = React.useState("");
  const [count, setCount] = React.useState(6);
  const [replace, setReplace] = React.useState(true);
  const [skipExisting, setSkipExisting] = React.useState(true);
  const [result, setResult] = React.useState<BulkFaqResponse | null>(null);

  const bulkFn = useServerFn(bulkGenerateFaqs);
  const bulkMut = useMutation({
    mutationFn: () => {
      const url_paths = text
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      return bulkFn({
        data: {
          url_paths,
          count,
          replace_existing: replace,
          skip_if_has_faq: skipExisting,
          delay_ms: 800,
        },
      });
    },
    onSuccess: (res) => setResult(res),
  });

  const paths = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div>
        <h2 className="text-lg font-semibold">Bulk generate FAQs</h2>
        <p className="text-xs text-muted-foreground">
          Paste up to 50 url_paths (one per line). For each page, this pulls top GSC queries,
          generates FAQs with AI, and inserts the block into the page body.
        </p>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder={"/p/los-angeles-ca\n/p/dallas-tx\n/p/host-acquisition/jurupa-valley-ca"}
        className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
      />
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-xs text-muted-foreground">{paths.length} url_paths</span>
        <select
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="rounded-md border border-input bg-background px-2 py-1 text-sm"
        >
          {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <option key={n} value={n}>{n} FAQs each</option>
          ))}
        </select>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
          Replace existing FAQ
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={skipExisting}
            onChange={(e) => setSkipExisting(e.target.checked)}
          />
          Skip pages that already have a FAQ
        </label>
        <button
          onClick={() => bulkMut.mutate()}
          disabled={paths.length === 0 || bulkMut.isPending || paths.length > 50}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {bulkMut.isPending ? `Processing ${paths.length}…` : `Generate & insert (${paths.length})`}
        </button>
      </div>
      {bulkMut.error && (
        <div className="text-sm text-destructive">{(bulkMut.error as Error).message}</div>
      )}
      {result && (
        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-medium text-emerald-600 dark:text-emerald-400">{result.inserted} inserted</span>
            {" • "}
            <span className="font-medium text-red-600 dark:text-red-400">{result.failed} failed</span>
            {" • "}
            <span className="text-muted-foreground">{result.total} total</span>
            {result.error && <span className="ml-2 text-destructive">{result.error}</span>}
          </div>
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-2 py-1 text-left">URL path</th>
                  <th className="px-2 py-1 text-left">Status</th>
                  <th className="px-2 py-1 text-right">FAQs</th>
                  <th className="px-2 py-1 text-right">Queries</th>
                  <th className="px-2 py-1 text-left">Note</th>
                </tr>
              </thead>
              <tbody>
                {result.results.map((r) => (
                  <tr key={r.url_path} className="border-t border-border">
                    <td className="px-2 py-1 font-mono">{r.url_path}</td>
                    <td className="px-2 py-1">
                      <span
                        className={
                          r.status === "inserted"
                            ? "rounded bg-emerald-500/15 px-2 py-0.5 text-emerald-700 dark:text-emerald-300"
                            : r.status === "skipped"
                              ? "rounded bg-muted px-2 py-0.5 text-muted-foreground"
                              : "rounded bg-red-500/15 px-2 py-0.5 text-red-700 dark:text-red-300"
                        }
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-2 py-1 text-right tabular-nums">{r.faq_count ?? "—"}</td>
                    <td className="px-2 py-1 text-right tabular-nums">{r.queries ?? "—"}</td>
                    <td className="px-2 py-1 text-muted-foreground">{r.error ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
