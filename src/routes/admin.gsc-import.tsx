import * as React from "react";
import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { checkAdminRole } from "@/server/admin-auth.functions";
import { adminImportGscRows } from "@/server/directory.functions";
import { AdminLayout } from "@/components/admin-layout";

export const Route = createFileRoute("/admin/gsc-import")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { redirect: "/admin/gsc-import", mode: "signin" } });
    const { isAdmin } = await checkAdminRole();
    if (!isAdmin) throw redirect({ to: "/" });
  },
  head: () => ({ meta: [{ title: "GSC Import — Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: GscImport,
});

type Row = { slug: string; impressions: number; clicks: number; position: number | null };

function GscImport() {
  const [csv, setCsv] = React.useState("");
  const [parsed, setParsed] = React.useState<Row[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<{ updated: number; total: number } | null>(null);

  function parse() {
    setResult(null);
    const lines = csv.split(/\r?\n/).filter((l) => l.trim());
    if (!lines.length) { setParsed([]); return; }
    const header = lines[0].toLowerCase().split(/[\t,]/).map((h) => h.trim().replace(/^"|"$/g, ""));
    const idx = {
      page: header.findIndex((h) => h === "page" || h === "url" || h === "top pages"),
      impr: header.findIndex((h) => h.includes("impression")),
      clicks: header.findIndex((h) => h.includes("click")),
      pos: header.findIndex((h) => h.includes("position")),
    };
    if (idx.page < 0 || idx.impr < 0) { alert("CSV needs at least Page/URL and Impressions columns"); return; }
    const rows: Row[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(/\t|,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((c) => c.trim().replace(/^"|"$/g, ""));
      const url = cells[idx.page] ?? "";
      const m = url.match(/\/providers\/([^/?#]+)/);
      if (!m) continue;
      rows.push({
        slug: m[1],
        impressions: Number(cells[idx.impr]?.replace(/[,%]/g, "")) || 0,
        clicks: idx.clicks >= 0 ? Number(cells[idx.clicks]?.replace(/[,%]/g, "")) || 0 : 0,
        position: idx.pos >= 0 ? Number(cells[idx.pos]?.replace(/[,%]/g, "")) || null : null,
      });
    }
    setParsed(rows);
  }

  async function submit() {
    if (!parsed.length) return;
    setBusy(true);
    try {
      const r = await adminImportGscRows({ data: { rows: parsed } });
      setResult({ updated: r.updated, total: r.total });
    } catch (e: any) {
      alert(e?.message || "Import failed");
    } finally { setBusy(false); }
  }

  return (
    <AdminLayout>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Import Google Search Console</h1>
            <p className="text-sm text-muted-foreground">
              Export from GSC: Performance → Pages → filter URL contains <code className="rounded bg-secondary px-1">/providers/</code> → Export → CSV. Paste below.
            </p>
          </div>
          <Link to="/admin/directory" className="text-sm text-primary hover:underline">← Directory</Link>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            placeholder={"Page,Clicks,Impressions,CTR,Position\nhttps://example.com/providers/some-pool-co,12,340,3.5%,8.2"}
            rows={10}
            className="w-full rounded-lg border border-border bg-background p-3 font-mono text-xs"
          />
          <div className="mt-3 flex items-center gap-3">
            <button onClick={parse} className="rounded-full bg-secondary px-5 py-2 text-sm font-semibold">Parse CSV</button>
            <button onClick={submit} disabled={busy || !parsed.length}
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {busy ? "Importing…" : `Import ${parsed.length} rows`}
            </button>
            {result && <span className="text-sm text-muted-foreground">Updated {result.updated} / {result.total}</span>}
          </div>
        </div>

        {parsed.length > 0 && (
          <section className="mt-6">
            <h2 className="text-lg font-semibold">Preview ({parsed.length})</h2>
            <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-secondary text-xs uppercase">
                  <tr><th className="p-2 text-left">Slug</th><th className="p-2 text-right">Impressions</th><th className="p-2 text-right">Clicks</th><th className="p-2 text-right">Position</th></tr>
                </thead>
                <tbody>
                  {parsed.slice(0, 50).map((r) => (
                    <tr key={r.slug} className="border-t border-border">
                      <td className="p-2 font-mono text-xs">{r.slug}</td>
                      <td className="p-2 text-right">{r.impressions}</td>
                      <td className="p-2 text-right">{r.clicks}</td>
                      <td className="p-2 text-right">{r.position?.toFixed(1) ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsed.length > 50 && <p className="p-2 text-xs text-muted-foreground">…and {parsed.length - 50} more</p>}
            </div>
          </section>
        )}
      </AdminLayout>
  );
}
