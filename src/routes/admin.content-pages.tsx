import * as React from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { checkAdminRole } from "@/server/admin-auth.functions";
import { AdminLayout } from "@/components/admin-layout";
import {
  listContentPages,
  bulkUpdateContentPages,
  getContentPage,
  updateContentPage,
  appendAiContentToPage,
  type ContentPageRow,
  type ContentPageFull,
} from "@/server/admin-tools.functions";

export const Route = createFileRoute("/admin/content-pages")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { redirect: "/admin/content-pages", mode: "signin" } });
    const { isAdmin } = await checkAdminRole();
    if (!isAdmin) throw redirect({ to: "/admin/no-access" });
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
  const [editingId, setEditingId] = React.useState<string | null>(null);

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
      <p className="text-sm text-muted-foreground">Filter, select, and bulk-update /p/* pages. Click <span className="font-medium">Edit</span> on any row to add content with AI or edit manually.</p>

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
              <th className="px-3 py-2 text-right">Actions</th>
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
                <td className="px-3 py-2 text-right">
                  <button onClick={() => setEditingId(r.id)} className="rounded border border-border px-2 py-1 text-xs hover:bg-muted">Edit</button>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">No matches.</td></tr>
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

      {editingId && (
        <PageEditorModal
          id={editingId}
          onClose={() => setEditingId(null)}
          onSaved={() => { void load(); }}
        />
      )}
    </AdminLayout>
  );
}

function PageEditorModal({ id, onClose, onSaved }: { id: string; onClose: () => void; onSaved: () => void }) {
  const [page, setPage] = React.useState<ContentPageFull | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [aiBusy, setAiBusy] = React.useState(false);
  const [aiPrompt, setAiPrompt] = React.useState("");
  const [aiAppend, setAiAppend] = React.useState(true);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await getContentPage({ data: { id } });
        if (cancelled) return;
        if (r.ok) setPage(r.page);
        else setErr(r.error);
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [id]);

  async function save() {
    if (!page) return;
    setSaving(true); setMsg(null); setErr(null);
    try {
      const r = await updateContentPage({
        data: {
          id: page.id,
          title: page.title ?? undefined,
          seo_title: page.seo_title ?? undefined,
          seo_description: page.seo_description ?? undefined,
          body_markdown: page.body_markdown ?? undefined,
          status: page.status as any,
        },
      });
      if (r.ok) { setMsg("Saved."); onSaved(); }
      else setErr(r.error || "Save failed");
    } finally { setSaving(false); }
  }

  async function runAi() {
    if (!page || !aiPrompt.trim()) return;
    setAiBusy(true); setMsg(null); setErr(null);
    try {
      const r = await appendAiContentToPage({ data: { id: page.id, prompt: aiPrompt.trim(), append: aiAppend } });
      if (r.ok) {
        setPage({ ...page, body_markdown: r.body_markdown });
        setAiPrompt("");
        setMsg(aiAppend ? "Section appended and saved." : "Body replaced and saved.");
        onSaved();
      } else {
        setErr(r.error || "AI failed");
      }
    } finally { setAiBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-border bg-background shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <h2 className="text-lg font-semibold">Edit page</h2>
            {page && <p className="font-mono text-xs text-muted-foreground">{page.url_path}</p>}
          </div>
          <div className="flex items-center gap-2">
            {page?.url_path && (
              <a href={page.url_path} target="_blank" rel="noreferrer" className="rounded border border-border px-3 py-1 text-xs hover:bg-muted">Open page ↗</a>
            )}
            <button onClick={onClose} className="rounded border border-border px-3 py-1 text-xs hover:bg-muted">Close</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {err && <div className="mb-3 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">{err}</div>}
          {msg && <div className="mb-3 rounded border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-300">{msg}</div>}

          {page && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block font-medium">Title (H1)</span>
                  <input value={page.title || ""} onChange={(e) => setPage({ ...page, title: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm" />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium">Status</span>
                  <select value={page.status} onChange={(e) => setPage({ ...page, status: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm">
                    <option value="draft">draft</option>
                    <option value="pending">pending</option>
                    <option value="published">published</option>
                  </select>
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium">SEO title <span className="text-xs text-muted-foreground">(≤60)</span></span>
                  <input value={page.seo_title || ""} onChange={(e) => setPage({ ...page, seo_title: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm" />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium">SEO description <span className="text-xs text-muted-foreground">(≤155)</span></span>
                  <input value={page.seo_description || ""} onChange={(e) => setPage({ ...page, seo_description: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm" />
                </label>
              </div>

              <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Add a section with AI</span>
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    <input type="checkbox" checked={aiAppend} onChange={(e) => setAiAppend(e.target.checked)} />
                    Append (uncheck to replace body)
                  </label>
                </div>
                <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Add an FAQ section with 5 common questions about pool rental insurance in this city."
                  rows={3}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
                <div className="mt-2 flex justify-end">
                  <button disabled={aiBusy || !aiPrompt.trim()} onClick={runAi}
                    className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">
                    {aiBusy ? "Generating…" : "Generate & save"}
                  </button>
                </div>
              </div>

              <label className="block text-sm">
                <span className="mb-1 flex items-center justify-between font-medium">
                  <span>Body (Markdown)</span>
                  <span className="text-xs text-muted-foreground">{(page.body_markdown || "").split(/\s+/).filter(Boolean).length} words</span>
                </span>
                <textarea value={page.body_markdown || ""} onChange={(e) => setPage({ ...page, body_markdown: e.target.value })}
                  rows={20}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs" />
              </label>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3">
          <button onClick={onClose} className="rounded border border-border px-4 py-1.5 text-sm">Cancel</button>
          <button disabled={saving || !page} onClick={save}
            className="rounded bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
