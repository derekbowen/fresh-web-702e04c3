import * as React from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { checkAdminRole } from "@/server/admin-auth.functions";
import { AdminLayout } from "@/components/admin-layout";
import { listContentPages, bulkUpdateContentPages, type ContentPageRow } from "@/server/admin-tools.functions";

export const Route = createFileRoute("/admin/content-pages")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { redirect: "/admin/content-pages", mode: "signin" } });
    const { isAdmin } = await checkAdminRole();
    if (!isAdmin) throw redirect({ to: "/" });
  },
  head: () => ({ meta: [{ title: "Bulk page editor — Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: BulkEditor,
});

function BulkEditor() {
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<"all" | "published" | "pending" | "draft">("all");
  const [template, setTemplate] = React.useState("");
  const [page, setPage] = React.useState(1);
  const pageSize = 50;
  const [rows, setRows] = React.useState<ContentPageRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await listContentPages({ data: { q, status, template, page, pageSize } });
      setRows(r.rows); setTotal(r.total);
    } finally { setLoading(false); }
  }, [q, status, template, page]);
  React.useEffect(() => { void load(); }, [load]);

  function toggle(id: string) {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    setSelected((s) => s.size === rows.length ? new Set() : new Set(rows.map((r) => r.id)));
  }

  async function bulk(action: "publish" | "unpublish" | "delete") {
    if (!selected.size) return;
    if (action === "delete" && !confirm(`Delete ${selected.size} pages?`)) return;
    setBusy(true);
    try {
      await bulkUpdateContentPages({ data: { ids: Array.from(selected), action } });
      setSelected(new Set());
      await load();
    } finally { setBusy(false); }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminLayout title="Bulk page editor">
      <h1 className="text-3xl font-bold">Bulk page editor</h1>
      <p className="text-sm text-muted-foreground">Filter, select, and bulk-update /p/* pages.</p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search url or title…"
          className="w-64 rounded-md border border-border bg-background px-3 py-1.5 text-sm" />
        <select value={status} onChange={(e) => { setStatus(e.target.value as any); setPage(1); }}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm">
          <option value="all">All status</option><option value="published">Published</option>
          <option value="pending">Pending</option><option value="draft">Draft</option>
        </select>
        <input value={template} onChange={(e) => { setTemplate(e.target.value); setPage(1); }} placeholder="Template type…"
          className="w-48 rounded-md border border-border bg-background px-3 py-1.5 text-sm" />
        <span className="ml-auto text-sm text-muted-foreground">{total.toLocaleString()} total</span>
      </div>

      {selected.size > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 p-3">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <button disabled={busy} onClick={() => bulk("publish")} className="ml-auto rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">Publish</button>
          <button disabled={busy} onClick={() => bulk("unpublish")} className="rounded bg-yellow-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">Unpublish</button>
          <button disabled={busy} onClick={() => bulk("delete")} className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">Delete</button>
          <button onClick={() => setSelected(new Set())} className="rounded border border-border px-3 py-1 text-xs">Clear</button>
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase">
            <tr>
              <th className="px-3 py-2"><input type="checkbox" checked={rows.length > 0 && selected.size === rows.length} onChange={toggleAll} /></th>
              <th className="px-3 py-2">URL</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Template</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Words</th>
              <th className="px-3 py-2 text-right">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-3 py-2"><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} /></td>
                <td className="px-3 py-2 font-mono text-xs"><a href={r.url_path || "#"} target="_blank" rel="noreferrer" className="hover:underline">{r.url_path}</a></td>
                <td className="px-3 py-2 max-w-xs truncate">{r.title || "—"}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{r.template_type || "—"}</td>
                <td className="px-3 py-2"><span className={`rounded px-1.5 py-0.5 text-xs ${r.status === "published" ? "bg-green-500/20 text-green-700 dark:text-green-300" : "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300"}`}>{r.status}</span></td>
                <td className="px-3 py-2 text-right">{r.words}</td>
                <td className="px-3 py-2 text-right text-xs text-muted-foreground">{new Date(r.updated_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">No matches.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded border border-border px-3 py-1 disabled:opacity-50">← Prev</button>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded border border-border px-3 py-1 disabled:opacity-50">Next →</button>
        </div>
      </div>
    </AdminLayout>
  );
}
