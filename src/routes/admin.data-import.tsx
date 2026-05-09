import * as React from "react";
import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { checkAdminRole } from "@/server/admin-auth.functions";
import { AdminLayout } from "@/components/admin-layout";
import { previewImport, importTable } from "@/server/admin-data-io.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Upload,
  FileText,
  X,
} from "lucide-react";

type TableName = "content_plan" | "content_pages";

type Preview = Awaited<ReturnType<typeof previewImport>>;

export const Route = createFileRoute("/admin/data-import")({
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user)
      throw redirect({
        to: "/auth",
        search: { redirect: "/admin/data-import", mode: "signin" },
      });
    const { isAdmin } = await checkAdminRole();
    if (!isAdmin) throw redirect({ to: "/admin/no-access" });
  },
  component: DataImportPage,
});

function DataImportPage() {
  const [table, setTable] = React.useState<TableName>("content_plan");
  const [file, setFile] = React.useState<File | null>(null);
  const [csv, setCsv] = React.useState<string>("");
  const [preview, setPreview] = React.useState<Preview | null>(null);
  const [busy, setBusy] = React.useState<"preview" | "commit" | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<{
    inserted: number;
    totalRows: number;
    rowErrors: { row: number; slug?: string; reason: string }[];
    chunkErrors: string[];
    droppedColumns: string[];
  } | null>(null);
  const [mode, setMode] = React.useState<"upsert" | "insert">("upsert");
  const [ignoreUnknown, setIgnoreUnknown] = React.useState(true);
  const [confirmText, setConfirmText] = React.useState("");
  const fileRef = React.useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setCsv("");
    setPreview(null);
    setError(null);
    setResult(null);
    setConfirmText("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFile = async (f: File) => {
    reset();
    setFile(f);
    const text = await f.text();
    setCsv(text);
    setBusy("preview");
    try {
      const res = await previewImport({ data: { table, csv: text } });
      setPreview(res);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy(null);
    }
  };

  const handleCommit = async () => {
    if (!csv) return;
    setBusy("commit");
    setError(null);
    setResult(null);
    try {
      const res = await importTable({
        data: { table, csv, mode, dryRun: false, ignoreUnknownColumns: ignoreUnknown },
      });
      setResult({
        inserted: res.inserted,
        totalRows: res.totalRows,
        rowErrors: res.rowErrors,
        chunkErrors: res.chunkErrors,
        droppedColumns: res.droppedColumns,
      });
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy(null);
    }
  };

  const blockingIssues: string[] = [];
  if (preview) {
    if (!preview.hasConflictColumn && mode === "upsert") {
      blockingIssues.push(
        `CSV is missing the "${preview.conflictColumn}" column required for upsert.`,
      );
    }
    if (preview.unknownColumns.length > 0 && !ignoreUnknown) {
      blockingIssues.push(
        `CSV has ${preview.unknownColumns.length} unknown column(s). Enable "Ignore unknown columns" or fix the CSV.`,
      );
    }
  }
  const requiredConfirm = `${table} ${mode}`;
  const canCommit =
    !!preview &&
    blockingIssues.length === 0 &&
    !busy &&
    confirmText.trim() === requiredConfirm;

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <div>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Import CSV into table</h1>
            <Link
              to="/admin/data-export"
              className="text-sm text-muted-foreground underline-offset-2 hover:underline"
            >
              Need an export? →
            </Link>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload a CSV, review the preview, then explicitly confirm to write
            to the database. No rows are touched until you commit.
          </p>
        </div>

        {/* Step 1: Pick table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Target table</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {(["content_plan", "content_pages"] as TableName[]).map((t) => (
                <label
                  key={t}
                  className={`flex cursor-pointer items-center gap-2 rounded border px-3 py-2 font-mono text-sm ${
                    table === t ? "border-primary bg-primary/10" : ""
                  }`}
                >
                  <input
                    type="radio"
                    checked={table === t}
                    onChange={() => {
                      setTable(t);
                      reset();
                    }}
                  />
                  {t}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Upload CSV</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              disabled={busy === "commit"}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
              className="block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-2 file:text-primary-foreground hover:file:bg-primary/90"
            />
            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span className="font-mono">{file.name}</span>
                <span>·</span>
                <span>{(file.size / 1024).toFixed(1)} KB</span>
                <button
                  onClick={reset}
                  className="ml-auto text-destructive hover:underline"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            {busy === "preview" && (
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Parsing and validating...
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <div className="rounded border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Step 3: Preview */}
        {preview && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">3. Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Stat label="Rows in CSV" value={preview.totalRows} />
                <Stat
                  label="Existing matches"
                  value={preview.existingMatches}
                  hint={`by ${preview.conflictColumn}`}
                />
                <Stat
                  label="New rows"
                  value={preview.newRowsEstimate}
                  hint="if upsert/insert"
                />
                <Stat label="CSV columns" value={preview.header.length} />
              </div>

              {preview.unknownColumns.length > 0 && (
                <div className="rounded border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
                  <div className="mb-1 flex items-center gap-2 font-medium text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    Unknown columns ({preview.unknownColumns.length})
                  </div>
                  <div className="font-mono text-xs">
                    {preview.unknownColumns.join(", ")}
                  </div>
                </div>
              )}

              {preview.missingColumns.length > 0 && (
                <div className="rounded border bg-muted p-3 text-sm">
                  <div className="mb-1 font-medium">
                    Table columns not in CSV ({preview.missingColumns.length})
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {preview.missingColumns.join(", ")}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    These will be left at their existing value (upsert) or
                    default (insert).
                  </p>
                </div>
              )}

              <div>
                <div className="mb-2 text-sm font-medium">
                  Sample rows ({preview.sample.length})
                </div>
                <div className="max-h-64 overflow-auto rounded border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted">
                      <tr>
                        {preview.header.map((h) => (
                          <th key={h} className="px-2 py-1 text-left font-mono">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.sample.map((row, i) => (
                        <tr key={i} className="border-t">
                          {preview.header.map((h) => (
                            <td
                              key={h}
                              className="max-w-[200px] truncate px-2 py-1"
                            >
                              {row[h] === null
                                ? <span className="text-muted-foreground">null</span>
                                : typeof row[h] === "object"
                                ? JSON.stringify(row[h])
                                : String(row[h])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Options + commit */}
        {preview && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">4. Confirm and import</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Mode</Label>
                <div className="flex flex-wrap gap-3 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={mode === "upsert"}
                      onChange={() => setMode("upsert")}
                    />
                    Upsert <Badge variant="secondary">match by {preview.conflictColumn}</Badge>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={mode === "insert"}
                      onChange={() => setMode("insert")}
                    />
                    Insert only <Badge variant="outline">fails on duplicates</Badge>
                  </label>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={ignoreUnknown}
                  onChange={(e) => setIgnoreUnknown(e.target.checked)}
                />
                Ignore unknown columns ({preview.unknownColumns.length})
              </label>

              {blockingIssues.length > 0 && (
                <div className="rounded border border-destructive/50 bg-destructive/10 p-3 text-sm">
                  <div className="mb-1 flex items-center gap-2 font-medium text-destructive">
                    <AlertTriangle className="h-4 w-4" /> Cannot proceed
                  </div>
                  <ul className="list-inside list-disc space-y-1">
                    {blockingIssues.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-2 rounded border bg-muted/30 p-3">
                <Label className="text-sm">
                  Type{" "}
                  <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs">
                    {requiredConfirm}
                  </code>{" "}
                  to confirm
                </Label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={requiredConfirm}
                  className="block w-full rounded border bg-background px-3 py-2 font-mono text-sm"
                />
              </div>

              <Button
                onClick={handleCommit}
                disabled={!canCommit}
                className="w-full sm:w-auto"
                variant={mode === "insert" ? "default" : "destructive"}
              >
                {busy === "commit" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {mode === "upsert" ? "Upsert" : "Insert"} {preview.totalRows} rows into {table}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Result */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {result.rowErrors.length === 0 && result.chunkErrors.length === 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                )}
                Import complete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                Wrote <strong>{result.inserted}</strong> of{" "}
                <strong>{result.totalRows}</strong> rows.{" "}
                {result.rowErrors.length > 0 && (
                  <span className="text-amber-700 dark:text-amber-400">
                    {result.rowErrors.length} row(s) skipped.
                  </span>
                )}
              </div>
              {result.droppedColumns.length > 0 && (
                <div className="text-muted-foreground">
                  Dropped columns: {result.droppedColumns.join(", ")}
                </div>
              )}
              {result.rowErrors.length > 0 && (
                <div className="rounded border border-destructive/50 bg-destructive/10 p-3 text-xs">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium">
                      Bad rows ({result.rowErrors.length})
                    </span>
                    <button
                      onClick={() => {
                        const csv =
                          "csv_row,key,reason\n" +
                          result.rowErrors
                            .map(
                              (e) =>
                                `${e.row},"${(e.slug ?? "").replace(/"/g, '""')}","${e.reason.replace(/"/g, '""')}"`,
                            )
                            .join("\n");
                        const blob = new Blob([csv], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `import-errors-${Date.now()}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="underline-offset-2 hover:underline"
                    >
                      Download error report
                    </button>
                  </div>
                  <div className="max-h-64 overflow-auto rounded border bg-background">
                    <table className="w-full text-xs">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-2 py-1 text-left">Row</th>
                          <th className="px-2 py-1 text-left">Key</th>
                          <th className="px-2 py-1 text-left">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.rowErrors.slice(0, 100).map((e, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-2 py-1">{e.row}</td>
                            <td className="px-2 py-1 font-mono">{e.slug ?? ""}</td>
                            <td className="px-2 py-1">{e.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {result.rowErrors.length > 100 && (
                      <div className="border-t bg-muted px-2 py-1 text-muted-foreground">
                        Showing 100 of {result.rowErrors.length}. Download the
                        report for the full list.
                      </div>
                    )}
                  </div>
                </div>
              )}
              {result.chunkErrors.length > 0 && (
                <div className="rounded border bg-muted p-3 text-xs">
                  <div className="mb-1 font-medium">Chunk notes:</div>
                  <ul className="list-inside list-disc space-y-1">
                    {result.chunkErrors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={reset}>
                Import another file
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded border p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value.toLocaleString()}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
