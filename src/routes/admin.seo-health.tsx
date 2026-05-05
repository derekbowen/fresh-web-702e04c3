import * as React from "react";
import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { checkAdminRole } from "@/server/admin-auth.functions";
import { AdminLayout } from "@/components/admin-layout";
import { listSeoIssues, type SeoIssueRow } from "@/server/admin-tools.functions";

export const Route = createFileRoute("/admin/seo-health")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { redirect: "/admin/seo-health", mode: "signin" } });
    const { isAdmin } = await checkAdminRole();
    if (!isAdmin) throw redirect({ to: "/" });
  },
  head: () => ({ meta: [{ title: "SEO Health — Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: SeoHealth,
});

const KINDS = [
  { id: "thin", label: "Thin pages (<500 words)" },
  { id: "empty", label: "Empty body" },
  { id: "missing_meta", label: "Missing meta description" },
  { id: "title_is_slug", label: "Title is just slug" },
] as const;

function SeoHealth() {
  const [kind, setKind] = React.useState<typeof KINDS[number]["id"]>("thin");
  const [rows, setRows] = React.useState<SeoIssueRow[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try { const r = await listSeoIssues({ data: { kind, limit: 200 } }); setRows(r.rows); }
    finally { setLoading(false); }
  }, [kind]);
  React.useEffect(() => { void load(); }, [load]);

  return (
    <AdminLayout title="SEO Health">
      <h1 className="text-3xl font-bold">SEO Health</h1>
      <p className="text-sm text-muted-foreground">Drill into published /p/* pages with quality issues.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button key={k.id} onClick={() => setKind(k.id)}
            className={`rounded-full border px-3 py-1.5 text-sm ${kind === k.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"}`}>
            {k.label}
          </button>
        ))}
      </div>

      <div className="mt-4 text-sm text-muted-foreground">{loading ? "Loading…" : `${rows.length} pages`}</div>

      <div className="mt-3 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase">
            <tr>
              <th className="px-3 py-2">URL</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Template</th>
              <th className="px-3 py-2 text-right">Words</th>
              <th className="px-3 py-2 text-right">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-3 py-2 font-mono text-xs">
                  <a href={r.url_path || "#"} target="_blank" rel="noreferrer" className="hover:underline">{r.url_path}</a>
                </td>
                <td className="px-3 py-2 max-w-md truncate">{r.title || <span className="text-muted-foreground">—</span>}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{r.template_type || "—"}</td>
                <td className="px-3 py-2 text-right">{r.words.toLocaleString()}</td>
                <td className="px-3 py-2 text-right text-xs text-muted-foreground">{new Date(r.updated_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">No issues 🎉</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <Link to="/admin/generate-content" className="text-sm font-semibold text-primary hover:underline">Open Generate content tool →</Link>
      </div>
    </AdminLayout>
  );
}
