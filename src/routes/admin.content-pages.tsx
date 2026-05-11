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
  generateFullPageContent,
  improvePageContent,
  generateSeoMeta,
  generateSectionPreset,
  SECTION_PRESETS,
  autoFixSeo,
  enqueueSeoFixJobs,
  processSeoFixQueue,
  getSeoJobStatus,
  listSectionPresets,
  saveSectionPreset,
  deleteSectionPreset,
  generateCustomSection,
  type ContentPageRow,
  type ContentPageFull,
  type CustomSectionPreset,
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

type SortKey = "url" | "title" | "template" | "status" | "words" | "score" | "updated";
type SortDir = "asc" | "desc";
type Insight = "all" | "missing_meta" | "no_keyword" | "thin" | "no_hero" | "low_score";

const INSIGHTS: { key: Insight; label: string; test: (r: ContentPageRow) => boolean }[] = [
  { key: "all", label: "All", test: () => true },
  { key: "missing_meta", label: "Missing meta", test: (r) => r.seo_title_len === 0 || r.seo_desc_len === 0 },
  { key: "no_keyword", label: "No focus keyword", test: (r) => !r.has_keyword },
  { key: "thin", label: "Thin (<400w)", test: (r) => r.words < 400 },
  { key: "no_hero", label: "No hero image", test: (r) => !r.has_hero },
  { key: "low_score", label: "Low SEO score (<60)", test: (r) => r.score < 60 },
];

function ScorePill({ score }: { score: number }) {
  const tone = score >= 80 ? "bg-green-500/20 text-green-700 dark:text-green-300"
    : score >= 60 ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
    : "bg-red-500/20 text-red-700 dark:text-red-300";
  return <span className={`inline-block min-w-[2.25rem] rounded px-1.5 py-0.5 text-center text-xs font-semibold tabular-nums ${tone}`}>{score}</span>;
}

function BulkEditor() {
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<"all" | "published" | "pending" | "draft" | "scraped">("all");
  const [template, setTemplate] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState<number>(50);
  const [rows, setRows] = React.useState<ContentPageRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [busy, setBusy] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [insight, setInsight] = React.useState<Insight>("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("updated");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const [cursor, setCursor] = React.useState<number>(0); // keyboard row cursor
  const [inlineEditing, setInlineEditing] = React.useState<{ id: string; field: "title"; value: string } | null>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await listContentPages({ data: { q, status, template, page, pageSize } });
      setRows(r.rows); setTotal(r.total);
    } finally { setLoading(false); }
  }, [q, status, template, page, pageSize]);
  React.useEffect(() => { void load(); }, [load]);

  // Apply insight filter + sorting (client-side over current page)
  const visibleRows = React.useMemo(() => {
    const ins = INSIGHTS.find((i) => i.key === insight)!.test;
    const filtered = rows.filter(ins);
    const dir = sortDir === "asc" ? 1 : -1;
    const key = sortKey;
    const sorted = [...filtered].sort((a, b) => {
      const av: any = key === "url" ? (a.url_path || "")
        : key === "title" ? (a.title || "")
        : key === "template" ? (a.template_type || "")
        : key === "status" ? a.status
        : key === "words" ? a.words
        : key === "score" ? a.score
        : new Date(a.updated_at).getTime();
      const bv: any = key === "url" ? (b.url_path || "")
        : key === "title" ? (b.title || "")
        : key === "template" ? (b.template_type || "")
        : key === "status" ? b.status
        : key === "words" ? b.words
        : key === "score" ? b.score
        : new Date(b.updated_at).getTime();
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return sorted;
  }, [rows, insight, sortKey, sortDir]);

  React.useEffect(() => {
    if (cursor >= visibleRows.length) setCursor(Math.max(0, visibleRows.length - 1));
  }, [visibleRows.length, cursor]);

  function toggle(id: string) {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAllVisible() {
    setSelected((s) => {
      const allOn = visibleRows.length > 0 && visibleRows.every((r) => s.has(r.id));
      const n = new Set(s);
      if (allOn) visibleRows.forEach((r) => n.delete(r.id));
      else visibleRows.forEach((r) => n.add(r.id));
      return n;
    });
  }
  function selectAllOnPage() {
    setSelected((s) => { const n = new Set(s); rows.forEach((r) => n.add(r.id)); return n; });
  }
  function changeSort(k: SortKey) {
    setSortKey((cur) => {
      if (cur === k) { setSortDir((d) => d === "asc" ? "desc" : "asc"); return cur; }
      setSortDir(k === "updated" || k === "words" || k === "score" ? "desc" : "asc");
      return k;
    });
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (editingId || inlineEditing) return;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        if (e.key === "Escape") (e.target as HTMLElement).blur();
        return;
      }
      if (e.key === "/") { e.preventDefault(); searchRef.current?.focus(); return; }
      if (e.key === "j") { e.preventDefault(); setCursor((c) => Math.min(visibleRows.length - 1, c + 1)); return; }
      if (e.key === "k") { e.preventDefault(); setCursor((c) => Math.max(0, c - 1)); return; }
      if (e.key === "x") {
        e.preventDefault();
        const r = visibleRows[cursor]; if (r) toggle(r.id); return;
      }
      if (e.key === "e" || e.key === "Enter") {
        e.preventDefault();
        const r = visibleRows[cursor]; if (r) setEditingId(r.id); return;
      }
      if (e.key === "a" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault(); toggleAllVisible(); return;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visibleRows, cursor, editingId, inlineEditing]);

  // ── Bulk AI (mode-aware) ──────────────────────────────────────────────────
  const [fixProgress, setFixProgress] = React.useState<{ done: number; failed: number; total: number; mode: string } | null>(null);
  const [cancelRequested, setCancelRequested] = React.useState(false);

  async function bulkAi(mode: "full" | "meta_only" | "title_only") {
    if (!selected.size) return;
    const ids = Array.from(selected);
    const label = mode === "full" ? "Auto-fix everything (meta + body if thin)" : mode === "meta_only" ? "Generate SEO meta only" : "Rewrite title only";
    if (!confirm(`${label} on ${ids.length} page${ids.length > 1 ? "s" : ""}? Runs in background queue. Uses AI credits.`)) return;
    setBusy(true);
    setCancelRequested(false);
    setFixProgress({ done: 0, failed: 0, total: ids.length, mode });
    try {
      let batchId: string | undefined;
      for (let i = 0; i < ids.length; i += 500) {
        const chunk = ids.slice(i, i + 500);
        const r: any = await enqueueSeoFixJobs({ data: { pageIds: chunk, mode } });
        if (!r?.ok) throw new Error(r?.error || "Failed to enqueue");
        if (!batchId) batchId = r.batchId;
      }
      if (!batchId) throw new Error("No batch created");
      let safety = 0;
      while (safety++ < 2000) {
        if (cancelRequested) break;
        await processSeoFixQueue({ data: { batchId, max: 10 } });
        const status: any = await getSeoJobStatus({ data: { batchId } });
        const s = status?.summary || {};
        setFixProgress({ done: s.done || 0, failed: s.failed || 0, total: ids.length, mode });
        if (((s.queued || 0) + (s.processing || 0)) === 0) break;
      }
      const status: any = await getSeoJobStatus({ data: { batchId } });
      const s = status?.summary || {};
      alert(`Done. Ok: ${s.done || 0}, failed: ${s.failed || 0}, cancelled: ${s.cancelled || 0}.`);
      setSelected(new Set());
      await load();
    } catch (e) {
      alert(`Bulk AI error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
      setFixProgress(null);
      setCancelRequested(false);
    }
  }

  async function bulk(action: "publish" | "unpublish" | "delete") {
    if (!selected.size) return;
    if (action === "delete" && !confirm(`Delete ${selected.size} pages?`)) return;
    setBusy(true);
    try {
      const r: any = await bulkUpdateContentPages({ data: { ids: Array.from(selected), action } });
      if (action === "publish" && r?.ok) {
        const skipped = r.skipped ?? 0;
        const count = r.count ?? 0;
        if (skipped > 0) {
          const sample = (r.skippedSlugs || []).slice(0, 5).join(", ");
          const more = (r.skippedSlugs || []).length > 5 ? ` (+${r.skippedSlugs.length - 5} more)` : "";
          alert(`Published ${count}. Kept ${skipped} as draft (fewer than 300 words):\n${sample}${more}`);
        }
      }
      setSelected(new Set());
      await load();
    } finally { setBusy(false); }
  }

  async function commitInlineTitle() {
    if (!inlineEditing) return;
    const { id, value } = inlineEditing;
    setInlineEditing(null);
    if (!value.trim()) return;
    const original = rows.find((r) => r.id === id);
    if (original?.title === value) return;
    // Optimistic update
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, title: value } : r)));
    try { await updateContentPage({ data: { id, title: value } }); }
    catch (e) { await load(); alert(`Title save failed: ${e instanceof Error ? e.message : String(e)}`); }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function HeaderCell({ k, label, className }: { k: SortKey; label: string; className?: string }) {
    const active = sortKey === k;
    return (
      <th className={`px-3 py-2 ${className || ""}`}>
        <button onClick={() => changeSort(k)} className={`inline-flex items-center gap-1 hover:text-foreground ${active ? "text-foreground" : ""}`}>
          {label}
          <span className="text-[10px] opacity-60">{active ? (sortDir === "asc" ? "▲" : "▼") : "↕"}</span>
        </button>
      </th>
    );
  }

  return (
    <AdminLayout title="Bulk page editor">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Bulk page editor</h1>
          <p className="text-sm text-muted-foreground">
            Filter, sort, select, and bulk-fix /p/* pages. Press <kbd className="rounded border border-border bg-muted px-1 text-[10px]">/</kbd> to search, <kbd className="rounded border border-border bg-muted px-1 text-[10px]">j</kbd>/<kbd className="rounded border border-border bg-muted px-1 text-[10px]">k</kbd> to move, <kbd className="rounded border border-border bg-muted px-1 text-[10px]">x</kbd> to select, <kbd className="rounded border border-border bg-muted px-1 text-[10px]">e</kbd> to edit.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <input ref={searchRef} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search url or title… (/)"
          className="w-64 rounded-md border border-border bg-background px-3 py-1.5 text-sm" />
        <select value={status} onChange={(e) => { setStatus(e.target.value as any); setPage(1); }}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm">
          <option value="all">All status</option>
          <option value="published">Published</option>
          <option value="draft">Unpublished (draft)</option>
          <option value="pending">Pending</option>
          <option value="scraped">Scraped</option>
        </select>
        <input value={template} onChange={(e) => { setTemplate(e.target.value); setPage(1); }} placeholder="Template type…"
          className="w-48 rounded-md border border-border bg-background px-3 py-1.5 text-sm" />
        <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
          title="Rows per page"
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm">
          {[50, 100, 250, 500, 1000].map((n) => <option key={n} value={n}>{n} / page</option>)}
        </select>
        <span className="ml-auto text-sm text-muted-foreground">
          {visibleRows.length.toLocaleString()} shown · {total.toLocaleString()} total
        </span>
      </div>

      {/* Insight chips */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">Insights:</span>
        {INSIGHTS.map((i) => {
          const count = i.key === "all" ? rows.length : rows.filter(i.test).length;
          const active = insight === i.key;
          return (
            <button key={i.key} onClick={() => setInsight(i.key)}
              className={`rounded-full border px-3 py-1 text-xs transition ${active ? "border-primary bg-primary/10 text-primary" : "border-border bg-background hover:border-primary/40"}`}>
              {i.label} <span className="ml-1 tabular-nums opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {selected.size > 0 && (
        <div className="sticky top-0 z-30 mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 p-3 backdrop-blur">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <button onClick={selectAllOnPage} className="rounded border border-border bg-background px-2 py-1 text-xs hover:bg-muted">+ all on page ({rows.length})</button>
          <button onClick={() => setSelected(new Set())} className="rounded border border-border bg-background px-2 py-1 text-xs hover:bg-muted">Clear</button>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {fixProgress ? (
              <>
                <span className="text-xs tabular-nums">{fixProgress.mode}: {fixProgress.done + fixProgress.failed}/{fixProgress.total} ({fixProgress.failed} failed)</span>
                <button onClick={() => setCancelRequested(true)} className="rounded border border-border bg-background px-2 py-1 text-xs">Cancel</button>
              </>
            ) : (
              <>
                <BulkAiMenu disabled={busy} onPick={bulkAi} count={selected.size} />
                <button disabled={busy} onClick={() => bulk("publish")} className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">Publish</button>
                <button disabled={busy} onClick={() => bulk("unpublish")} className="rounded bg-yellow-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">Unpublish</button>
                <button disabled={busy} onClick={() => bulk("delete")} className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">Delete</button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-muted/80 text-left text-xs uppercase backdrop-blur">
            <tr>
              <th className="px-3 py-2">
                <input type="checkbox"
                  checked={visibleRows.length > 0 && visibleRows.every((r) => selected.has(r.id))}
                  onChange={toggleAllVisible} />
              </th>
              <HeaderCell k="url" label="URL" />
              <HeaderCell k="title" label="Title" />
              <HeaderCell k="template" label="Template" />
              <HeaderCell k="status" label="Status" />
              <HeaderCell k="words" label="Words" className="text-right" />
              <HeaderCell k="score" label="SEO" className="text-right" />
              <HeaderCell k="updated" label="Updated" className="text-right" />
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((r, idx) => {
              const isCursor = idx === cursor;
              const isSelected = selected.has(r.id);
              const issues: string[] = [];
              if (r.seo_title_len === 0) issues.push("no SEO title");
              else if (r.seo_title_len < 40 || r.seo_title_len > 65) issues.push(`title len ${r.seo_title_len}`);
              if (r.seo_desc_len === 0) issues.push("no SEO desc");
              else if (r.seo_desc_len < 120 || r.seo_desc_len > 165) issues.push(`desc len ${r.seo_desc_len}`);
              if (!r.has_keyword) issues.push("no focus kw");
              if (!r.has_hero) issues.push("no hero");
              if (r.words < 400) issues.push(`thin (${r.words}w)`);
              if (r.internal_links < 3) issues.push(`${r.internal_links} internal links`);
              return (
                <tr key={r.id}
                  onClick={() => setCursor(idx)}
                  className={`border-t border-border ${isSelected ? "bg-primary/5" : ""} ${isCursor ? "ring-1 ring-inset ring-primary/40" : ""} hover:bg-muted/40`}>
                  <td className="px-3 py-2"><input type="checkbox" checked={isSelected} onChange={() => toggle(r.id)} onClick={(e) => e.stopPropagation()} /></td>
                  <td className="px-3 py-2 font-mono text-xs">
                    <a href={r.url_path || "#"} target="_blank" rel="noreferrer" className="hover:underline" onClick={(e) => e.stopPropagation()}>{r.url_path}</a>
                  </td>
                  <td className="max-w-xs truncate px-3 py-2"
                    onDoubleClick={(e) => { e.stopPropagation(); setInlineEditing({ id: r.id, field: "title", value: r.title || "" }); }}
                    title="Double-click to edit title inline">
                    {inlineEditing?.id === r.id ? (
                      <input autoFocus value={inlineEditing.value}
                        onChange={(e) => setInlineEditing({ ...inlineEditing, value: e.target.value })}
                        onBlur={commitInlineTitle}
                        onKeyDown={(e) => { if (e.key === "Enter") commitInlineTitle(); if (e.key === "Escape") setInlineEditing(null); }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full rounded border border-primary/50 bg-background px-2 py-1 text-sm" />
                    ) : (
                      <span>{r.title || <span className="text-muted-foreground">—</span>}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{r.template_type || "—"}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded px-1.5 py-0.5 text-xs ${r.status === "published" ? "bg-green-500/20 text-green-700 dark:text-green-300" : "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300"}`}>{r.status}</span>
                  </td>
                  <td className={`px-3 py-2 text-right tabular-nums ${r.words < 400 ? "text-amber-600" : ""}`}>{r.words}</td>
                  <td className="px-3 py-2 text-right">
                    <span title={issues.length ? issues.join(" · ") : "Looks good"}><ScorePill score={r.score} /></span>
                  </td>
                  <td className="px-3 py-2 text-right text-xs text-muted-foreground">{new Date(r.updated_at).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={(e) => { e.stopPropagation(); setEditingId(r.id); }} className="rounded border border-border px-2 py-1 text-xs hover:bg-muted">Edit</button>
                  </td>
                </tr>
              );
            })}
            {!loading && visibleRows.length === 0 && (
              <tr><td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">No matches{insight !== "all" ? ` for "${INSIGHTS.find((i) => i.key === insight)?.label}"` : ""}.</td></tr>
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

function BulkAiMenu({ disabled, onPick, count }: { disabled: boolean; onPick: (m: "full" | "meta_only" | "title_only") => void; count: number }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    function onClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button disabled={disabled} onClick={() => setOpen((v) => !v)}
        className="rounded bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground disabled:opacity-50">
        ✨ AI fix {count} ▾
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-md border border-border bg-popover shadow-lg">
          <button onClick={() => { setOpen(false); onPick("full"); }} className="block w-full px-3 py-2 text-left text-xs hover:bg-muted">
            <div className="font-semibold">Auto-fix everything</div>
            <div className="text-muted-foreground">Meta + body if thin or under-linked</div>
          </button>
          <button onClick={() => { setOpen(false); onPick("meta_only"); }} className="block w-full px-3 py-2 text-left text-xs hover:bg-muted">
            <div className="font-semibold">Generate SEO meta only</div>
            <div className="text-muted-foreground">SEO title, description, OG fields</div>
          </button>
          <button onClick={() => { setOpen(false); onPick("title_only"); }} className="block w-full px-3 py-2 text-left text-xs hover:bg-muted">
            <div className="font-semibold">Rewrite title only</div>
            <div className="text-muted-foreground">Page H1 / SEO title</div>
          </button>
        </div>
      )}
    </div>
  );
}

function PageEditorModal({ id, onClose, onSaved }: { id: string; onClose: () => void; onSaved: () => void }) {
  const [page, setPage] = React.useState<ContentPageFull | null>(null);
  const [original, setOriginal] = React.useState<ContentPageFull | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [aiBusy, setAiBusy] = React.useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = React.useState("");
  const [aiAppend, setAiAppend] = React.useState(true);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [bodyView, setBodyView] = React.useState<"edit" | "preview">("edit");
  const [preview, setPreview] = React.useState<
    | null
    | { kind: "body"; markdown: string; label: string; before: string }
    | { kind: "meta"; seo_title: string; seo_description: string; og_title: string; og_description: string; before: { seo_title: string; seo_description: string; og_title: string; og_description: string } }
    | { kind: "section"; markdown: string; label: string }
  >(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await getContentPage({ data: { id } });
        if (cancelled) return;
        if (r.ok) { setPage(r.page); setOriginal(r.page); }
        else setErr(r.error);
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [id]);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !preview) onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); void save(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, page]);

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
          og_title: page.og_title ?? null,
          og_description: page.og_description ?? null,
          focus_keyword: page.focus_keyword ?? null,
          canonical_override: page.canonical_override ?? null,
          hero_image_url: page.hero_image_url ?? null,
          body_markdown: page.body_markdown ?? undefined,
          status: page.status as any,
        },
      });
      if (r.ok) { setMsg("Saved."); setOriginal(page); onSaved(); }
      else setErr(r.error || "Save failed");
    } finally { setSaving(false); }
  }

  async function runSection(presetKeyOrPrompt: { presetKey: string } | { prompt: string }) {
    if (!page) return;
    setAiBusy("section"); setMsg(null); setErr(null); setPreview(null);
    try {
      if ("presetKey" in presetKeyOrPrompt) {
        const r = await generateSectionPreset({ data: { id: page.id, preset_key: presetKeyOrPrompt.presetKey } });
        if (r.ok) {
          const label = SECTION_PRESETS.find((p) => p.key === presetKeyOrPrompt.presetKey)?.label ?? "Section";
          setPreview({ kind: "section", markdown: r.markdown, label });
        } else setErr(r.error);
      } else {
        const r = await appendAiContentToPage({ data: { id: page.id, prompt: presetKeyOrPrompt.prompt, append: aiAppend } });
        if (r.ok) {
          setPage({ ...page, body_markdown: r.body_markdown });
          setAiPrompt("");
          setMsg(aiAppend ? "Section appended and saved." : "Body replaced and saved.");
          onSaved();
        } else setErr(r.error);
      }
    } finally { setAiBusy(null); }
  }

  async function runFullPage() {
    if (!page) return;
    setAiBusy("full"); setMsg(null); setErr(null); setPreview(null);
    try {
      const r = await generateFullPageContent({ data: { id: page.id } });
      if (r.ok) setPreview({ kind: "body", markdown: r.body_markdown, label: "Generated full page", before: page.body_markdown || "" });
      else setErr(r.error);
    } finally { setAiBusy(null); }
  }

  async function runImprove() {
    if (!page) return;
    setAiBusy("improve"); setMsg(null); setErr(null); setPreview(null);
    try {
      const r = await improvePageContent({ data: { id: page.id } });
      if (r.ok) setPreview({ kind: "body", markdown: r.body_markdown, label: "Improved page", before: page.body_markdown || "" });
      else setErr(r.error);
    } finally { setAiBusy(null); }
  }

  async function runMeta() {
    if (!page) return;
    setAiBusy("meta"); setMsg(null); setErr(null); setPreview(null);
    try {
      const r = await generateSeoMeta({ data: { id: page.id } });
      if (r.ok) setPreview({
        kind: "meta",
        seo_title: r.seo_title, seo_description: r.seo_description, og_title: r.og_title, og_description: r.og_description,
        before: {
          seo_title: page.seo_title || "",
          seo_description: page.seo_description || "",
          og_title: page.og_title || "",
          og_description: page.og_description || "",
        },
      });
      else setErr(r.error);
    } finally { setAiBusy(null); }
  }

  async function runAutoFix() {
    if (!page) return;
    if (!confirm("Auto-fix SEO will overwrite focus keyword, SEO title/description, OG fields — and may rewrite the body if it's thin or under-linked. Continue?")) return;
    setAiBusy("autofix"); setMsg(null); setErr(null); setPreview(null);
    try {
      const r = await autoFixSeo({ data: { id: page.id } });
      if (r.ok) {
        setPage({ ...page, ...r.page });
        setOriginal({ ...page, ...r.page });
        setMsg(`Auto-fix saved. Updated: ${r.changed.join(", ")}.`);
        onSaved();
      } else setErr(r.error);
    } finally { setAiBusy(null); }
  }

  // ─── Custom AI section presets ─────────────────────────────────────────────
  const [customPresets, setCustomPresets] = React.useState<CustomSectionPreset[]>([]);
  const [presetMgrOpen, setPresetMgrOpen] = React.useState(false);
  const [editingPreset, setEditingPreset] = React.useState<{ id?: string; label: string; prompt: string }>({ label: "", prompt: "" });

  const loadPresets = React.useCallback(async () => {
    try { const r = await listSectionPresets(); setCustomPresets(r.rows); } catch {/* ignore */}
  }, []);
  React.useEffect(() => { void loadPresets(); }, [loadPresets]);

  async function runCustomPreset(presetId: string) {
    if (!page) return;
    setAiBusy("section"); setMsg(null); setErr(null); setPreview(null);
    try {
      const r = await generateCustomSection({ data: { id: page.id, preset_id: presetId } });
      if (r.ok) setPreview({ kind: "section", markdown: r.markdown, label: r.label });
      else setErr(r.error);
    } finally { setAiBusy(null); }
  }

  async function savePreset() {
    if (!editingPreset.label.trim() || editingPreset.prompt.trim().length < 5) {
      setErr("Label and prompt are required (prompt at least 5 chars)."); return;
    }
    const r = await saveSectionPreset({ data: { id: editingPreset.id, label: editingPreset.label.trim(), prompt: editingPreset.prompt.trim(), sort_order: 0 } });
    if (r.ok) { setEditingPreset({ label: "", prompt: "" }); await loadPresets(); }
    else setErr(r.error);
  }

  async function removePreset(id: string) {
    if (!confirm("Delete this custom prompt?")) return;
    const r = await deleteSectionPreset({ data: { id } });
    if (r.ok) await loadPresets();
    else setErr(r.error);
  }

  function acceptPreview() {
    if (!page || !preview) return;
    if (preview.kind === "body") {
      setPage({ ...page, body_markdown: preview.markdown });
    } else if (preview.kind === "section") {
      const next = aiAppend
        ? `${(page.body_markdown ?? "").trimEnd()}\n\n${preview.markdown}\n`
        : preview.markdown;
      setPage({ ...page, body_markdown: next });
    } else if (preview.kind === "meta") {
      setPage({
        ...page,
        seo_title: preview.seo_title,
        seo_description: preview.seo_description,
        og_title: preview.og_title,
        og_description: preview.og_description,
      });
    }
    setPreview(null);
    setMsg("Applied. Press ⌘S to save.");
  }

  // ── SEO score calculations ───────────────────────────────────────────────
  const score = React.useMemo(() => {
    if (!page) return null;
    const body = page.body_markdown ?? "";
    const wordCount = body.split(/\s+/).filter(Boolean).length;
    const titleLen = (page.seo_title ?? "").length;
    const descLen = (page.seo_description ?? "").length;
    const fk = (page.focus_keyword ?? "").trim().toLowerCase();
    const hasH1 = !!(page.title && page.title.trim());
    const internalLinks = (body.match(/\]\(\/[^)]+\)/g) ?? []).length;
    const fkInTitle = !!fk && (page.seo_title ?? "").toLowerCase().includes(fk);
    const fkInDesc = !!fk && (page.seo_description ?? "").toLowerCase().includes(fk);
    const fkInBody = !!fk && body.slice(0, 800).toLowerCase().includes(fk);
    return { wordCount, titleLen, descLen, fk, hasH1, internalLinks, fkInTitle, fkInDesc, fkInBody };
  }, [page]);

  function ScoreRow({ ok, warn, label }: { ok: boolean; warn?: boolean; label: string }) {
    const cls = ok ? "text-green-600" : warn ? "text-amber-600" : "text-red-600";
    const icon = ok ? "✓" : warn ? "⚠" : "✗";
    return <div className={`flex items-start gap-1.5 text-xs ${cls}`}><span className="font-bold">{icon}</span><span>{label}</span></div>;
  }

  const dirty = !!(page && original && (
    page.title !== original.title ||
    page.seo_title !== original.seo_title ||
    page.seo_description !== original.seo_description ||
    page.og_title !== original.og_title ||
    page.og_description !== original.og_description ||
    page.focus_keyword !== original.focus_keyword ||
    page.canonical_override !== original.canonical_override ||
    page.hero_image_url !== original.hero_image_url ||
    page.body_markdown !== original.body_markdown ||
    page.status !== original.status
  ));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => { if (!dirty || confirm("Discard unsaved changes?")) onClose(); }}>
      <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-border bg-background shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              Edit page
              {dirty && <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-700 dark:text-amber-300">unsaved</span>}
            </h2>
            {page && <p className="font-mono text-xs text-muted-foreground">{page.url_path}</p>}
          </div>
          <div className="flex items-center gap-2">
            {page?.url_path && <a href={page.url_path} target="_blank" rel="noreferrer" className="rounded border border-border px-3 py-1 text-xs hover:bg-muted">Open page ↗</a>}
            <button onClick={() => { if (!dirty || confirm("Discard unsaved changes?")) onClose(); }} className="rounded border border-border px-3 py-1 text-xs hover:bg-muted">Close (esc)</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {err && <div className="mb-3 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">{err}</div>}
          {msg && <div className="mb-3 rounded border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-300">{msg}</div>}

          {page && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_240px]">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Field label="Title (H1)" value={page.title || ""} onChange={(v) => setPage({ ...page, title: v })} />
                  <label className="text-sm">
                    <span className="mb-1 block font-medium">Status</span>
                    <select value={page.status} onChange={(e) => setPage({ ...page, status: e.target.value })}
                      className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm">
                      <option value="draft">draft</option>
                      <option value="pending">pending</option>
                      <option value="published">published</option>
                    </select>
                  </label>
                  <Field label={`SEO title (${(page.seo_title || "").length}/60)`} value={page.seo_title || ""} onChange={(v) => setPage({ ...page, seo_title: v })} />
                  <Field label={`SEO description (${(page.seo_description || "").length}/155)`} value={page.seo_description || ""} onChange={(v) => setPage({ ...page, seo_description: v })} />
                  <Field label="OG title" value={page.og_title || ""} onChange={(v) => setPage({ ...page, og_title: v })} placeholder="Falls back to SEO title" />
                  <Field label="OG description" value={page.og_description || ""} onChange={(v) => setPage({ ...page, og_description: v })} placeholder="Falls back to SEO description" />
                  <Field label="Hero / OG image URL" value={page.hero_image_url || ""} onChange={(v) => setPage({ ...page, hero_image_url: v })} placeholder="https://…/image.jpg" />
                  <Field label="Focus keyword" value={page.focus_keyword || ""} onChange={(v) => setPage({ ...page, focus_keyword: v })} placeholder="e.g. pool rental Los Angeles" />
                  <div className="md:col-span-2"><Field label="Canonical URL override (rare)" value={page.canonical_override || ""} onChange={(v) => setPage({ ...page, canonical_override: v })} placeholder="Leave empty unless this page should canonical to a different URL" /></div>
                </div>

                {/* AI tools */}
                <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
                  <div className="mb-2 text-sm font-semibold">AI tools</div>
                  <div className="flex flex-wrap gap-2">
                    <button disabled={!!aiBusy} onClick={runFullPage} className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">
                      {aiBusy === "full" ? "Generating…" : "✨ Generate full page"}
                    </button>
                    <button disabled={!!aiBusy} onClick={runImprove} className="rounded border border-primary px-3 py-1.5 text-xs font-semibold text-primary disabled:opacity-50">
                      {aiBusy === "improve" ? "Improving…" : "🪄 Improve this page"}
                    </button>
                    <button disabled={!!aiBusy} onClick={runMeta} className="rounded border border-primary px-3 py-1.5 text-xs font-semibold text-primary disabled:opacity-50">
                      {aiBusy === "meta" ? "Generating…" : "🏷️ Generate SEO meta"}
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">Each shows a side-by-side diff before changing your page.</p>
                </div>

                {/* Diff preview */}
                {preview && page && (
                  <DiffPreview preview={preview} currentBody={page.body_markdown || ""} onAccept={acceptPreview} onReject={() => setPreview(null)} />
                )}

                {/* Add a section — preset chips + custom */}
                <div className="rounded-lg border border-border bg-card p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">Add a section with AI</span>
                    <label className="flex items-center gap-1 text-xs text-muted-foreground">
                      <input type="checkbox" checked={aiAppend} onChange={(e) => setAiAppend(e.target.checked)} />
                      Append (uncheck to replace body)
                    </label>
                  </div>
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {SECTION_PRESETS.map((p) => (
                      <button key={p.key} disabled={!!aiBusy} onClick={() => runSection({ presetKey: p.key })}
                        className="rounded-full border border-border bg-background px-3 py-1 text-xs hover:border-primary hover:bg-primary/10 disabled:opacity-50">
                        + {p.label}
                      </button>
                    ))}
                    {customPresets.map((cp) => (
                      <span key={cp.id} className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/5 pr-1 text-xs">
                        <button disabled={!!aiBusy} onClick={() => runCustomPreset(cp.id)} className="rounded-l-full px-3 py-1 hover:bg-primary/10 disabled:opacity-50">
                          ★ {cp.label}
                        </button>
                        <button title="Edit" onClick={() => { setEditingPreset({ id: cp.id, label: cp.label, prompt: cp.prompt }); setPresetMgrOpen(true); }} className="px-1 text-muted-foreground hover:text-foreground">✎</button>
                        <button title="Delete" onClick={() => removePreset(cp.id)} className="px-1 text-muted-foreground hover:text-red-600">✕</button>
                      </span>
                    ))}
                    <button onClick={() => { setPresetMgrOpen((v) => !v); setEditingPreset({ label: "", prompt: "" }); }}
                      className="rounded-full border border-dashed border-border bg-background px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary">
                      ⚙ {presetMgrOpen ? "Close manager" : "Manage prompts"}
                    </button>
                  </div>

                  {presetMgrOpen && (
                    <div className="mb-3 space-y-2 rounded-md border border-border bg-muted/30 p-2">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {editingPreset.id ? "Edit custom prompt" : "New custom prompt"}
                      </div>
                      <input value={editingPreset.label} onChange={(e) => setEditingPreset({ ...editingPreset, label: e.target.value })}
                        placeholder="Button label (e.g. Local SEO block)"
                        className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs" />
                      <textarea value={editingPreset.prompt} onChange={(e) => setEditingPreset({ ...editingPreset, prompt: e.target.value })}
                        placeholder="Prompt sent to AI. e.g. 'Add a section listing 5 local pool-permit rules with citations.'"
                        rows={3} className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs" />
                      <div className="flex justify-end gap-2">
                        {editingPreset.id && <button onClick={() => setEditingPreset({ label: "", prompt: "" })} className="rounded border border-border px-2 py-1 text-[11px]">Cancel edit</button>}
                        <button onClick={savePreset} className="rounded bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground">
                          {editingPreset.id ? "Update prompt" : "Save prompt"}
                        </button>
                      </div>
                    </div>
                  )}

                  <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Or write a one-off prompt. e.g. Add an FAQ about pool rental insurance in this city."
                    rows={3} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
                  <div className="mt-2 flex justify-end">
                    <button disabled={!!aiBusy || !aiPrompt.trim()} onClick={() => runSection({ prompt: aiPrompt.trim() })}
                      className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">
                      {aiBusy === "section" ? "Generating…" : "Generate & save"}
                    </button>
                  </div>
                </div>

                {/* Body — edit / preview toggle */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium">Body (Markdown)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{(page.body_markdown || "").split(/\s+/).filter(Boolean).length} words</span>
                      <div className="inline-flex overflow-hidden rounded border border-border text-xs">
                        <button onClick={() => setBodyView("edit")} className={`px-2 py-0.5 ${bodyView === "edit" ? "bg-muted" : ""}`}>Edit</button>
                        <button onClick={() => setBodyView("preview")} className={`px-2 py-0.5 ${bodyView === "preview" ? "bg-muted" : ""}`}>Preview</button>
                      </div>
                    </div>
                  </div>
                  {bodyView === "edit" ? (
                    <textarea value={page.body_markdown || ""} onChange={(e) => setPage({ ...page, body_markdown: e.target.value })}
                      rows={20} className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs" />
                  ) : (
                    <div className="prose prose-sm max-w-none rounded-md border border-border bg-card px-4 py-3 text-sm dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(page.body_markdown || "") }} />
                  )}
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    Markdown: <code>##</code> H2, <code>**bold**</code>, <code>- item</code>, <code>[text](/p/slug)</code>.
                  </span>
                </div>
              </div>

              <aside className="hidden lg:block">
                <div className="sticky top-0 space-y-3">
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">SEO score</div>
                      <button disabled={!!aiBusy} onClick={runAutoFix}
                        title="Use AI to set focus keyword, perfect-length meta, and (if needed) rewrite the body so every check passes."
                        className="rounded bg-green-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                        {aiBusy === "autofix" ? "Fixing…" : "✨ Auto-fix all"}
                      </button>
                    </div>
                    {score && (
                      <div className="space-y-1.5">
                        <ScoreRow ok={score.titleLen >= 50 && score.titleLen <= 60} warn={score.titleLen >= 40 && score.titleLen < 50} label={`Title length: ${score.titleLen}/60`} />
                        <ScoreRow ok={score.descLen >= 140 && score.descLen <= 155} warn={score.descLen >= 120 && score.descLen < 140} label={`Description: ${score.descLen}/155`} />
                        <ScoreRow ok={score.hasH1} label="H1 present" />
                        <ScoreRow ok={score.wordCount >= 800} warn={score.wordCount >= 400 && score.wordCount < 800} label={`Word count: ${score.wordCount}`} />
                        <ScoreRow ok={score.internalLinks >= 3} warn={score.internalLinks >= 1 && score.internalLinks < 3} label={`Internal links: ${score.internalLinks}`} />
                        {score.fk ? (
                          <>
                            <ScoreRow ok={score.fkInTitle} label="Keyword in SEO title" />
                            <ScoreRow ok={score.fkInDesc} label="Keyword in description" />
                            <ScoreRow ok={score.fkInBody} label="Keyword in first 800 chars" />
                          </>
                        ) : (
                          <ScoreRow ok={false} warn label="No focus keyword set" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
                    <div>Last edited: {new Date(page.updated_at).toLocaleDateString()}</div>
                    <div>Created: {new Date(page.created_at).toLocaleDateString()}</div>
                    <div className="mt-2 break-all font-mono text-[10px]">{page.url_path}</div>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3">
          <span className="mr-auto text-[11px] text-muted-foreground">⌘S to save · esc to close</span>
          <button onClick={() => { if (!dirty || confirm("Discard unsaved changes?")) onClose(); }} className="rounded border border-border px-4 py-1.5 text-sm">Cancel</button>
          <button disabled={saving || !page || !dirty} onClick={save}
            className="rounded bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm" />
    </label>
  );
}

// ── Diff preview component ────────────────────────────────────────────────
function DiffPreview({
  preview, currentBody, onAccept, onReject,
}: {
  preview:
    | { kind: "body"; markdown: string; label: string; before: string }
    | { kind: "meta"; seo_title: string; seo_description: string; og_title: string; og_description: string; before: { seo_title: string; seo_description: string; og_title: string; og_description: string } }
    | { kind: "section"; markdown: string; label: string };
  currentBody: string;
  onAccept: () => void;
  onReject: () => void;
}) {
  const heading = preview.kind === "meta" ? "SEO metadata" : preview.kind === "body" ? preview.label : `Section — ${preview.label}`;
  return (
    <div className="rounded-lg border border-amber-500/50 bg-amber-50 p-3 dark:bg-amber-950/30">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold">Preview: {heading}</span>
        <div className="flex gap-2">
          <button onClick={onAccept} className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700">Accept</button>
          <button onClick={onReject} className="rounded border border-border bg-background px-3 py-1 text-xs hover:bg-muted">Reject</button>
        </div>
      </div>

      {preview.kind === "meta" ? (
        <div className="grid grid-cols-1 gap-2 text-xs md:grid-cols-2">
          <DiffField label="SEO title" before={preview.before.seo_title} after={preview.seo_title} />
          <DiffField label="SEO description" before={preview.before.seo_description} after={preview.seo_description} />
          <DiffField label="OG title" before={preview.before.og_title} after={preview.og_title} />
          <DiffField label="OG description" before={preview.before.og_description} after={preview.og_description} />
        </div>
      ) : preview.kind === "body" ? (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Current ({preview.before.split(/\s+/).filter(Boolean).length}w)</div>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded bg-background p-2 font-mono text-[11px]">{preview.before || "(empty)"}</pre>
          </div>
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Proposed ({preview.markdown.split(/\s+/).filter(Boolean).length}w)</div>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded bg-background p-2 font-mono text-[11px]">{preview.markdown}</pre>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">New section to append (current body: {currentBody.split(/\s+/).filter(Boolean).length}w)</div>
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded bg-background p-2 font-mono text-[11px]">{preview.markdown}</pre>
        </div>
      )}
    </div>
  );
}

function DiffField({ label, before, after }: { label: string; before: string; after: string }) {
  const changed = before !== after;
  return (
    <div className={`rounded border p-2 ${changed ? "border-amber-400/60" : "border-border"}`}>
      <div className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">{label} {changed && <span className="text-amber-600">(changed)</span>}</div>
      <div className="space-y-1">
        <div className="rounded bg-red-500/10 px-1.5 py-1 text-[11px] line-through opacity-80">{before || <span className="opacity-50">(empty)</span>}</div>
        <div className="rounded bg-green-500/10 px-1.5 py-1 text-[11px]">{after || <span className="opacity-50">(empty)</span>}</div>
      </div>
    </div>
  );
}

// Tiny markdown → HTML for preview (intentionally minimal, NOT for production rendering)
function renderMarkdown(src: string): string {
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = src.split(/\r?\n/);
  let html = ""; let inList = false; let inPara = false;
  const close = () => { if (inList) { html += "</ul>"; inList = false; } if (inPara) { html += "</p>"; inPara = false; } };
  const inline = (s: string) => escape(s)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { close(); continue; }
    let m;
    if ((m = line.match(/^######\s+(.*)$/))) { close(); html += `<h6>${inline(m[1])}</h6>`; }
    else if ((m = line.match(/^#####\s+(.*)$/))) { close(); html += `<h5>${inline(m[1])}</h5>`; }
    else if ((m = line.match(/^####\s+(.*)$/))) { close(); html += `<h4>${inline(m[1])}</h4>`; }
    else if ((m = line.match(/^###\s+(.*)$/))) { close(); html += `<h3>${inline(m[1])}</h3>`; }
    else if ((m = line.match(/^##\s+(.*)$/))) { close(); html += `<h2>${inline(m[1])}</h2>`; }
    else if ((m = line.match(/^#\s+(.*)$/))) { close(); html += `<h1>${inline(m[1])}</h1>`; }
    else if ((m = line.match(/^[-*]\s+(.*)$/))) { if (inPara) { html += "</p>"; inPara = false; } if (!inList) { html += "<ul>"; inList = true; } html += `<li>${inline(m[1])}</li>`; }
    else { if (inList) { html += "</ul>"; inList = false; } if (!inPara) { html += "<p>"; inPara = true; } else html += " "; html += inline(line); }
  }
  close();
  return html;
}
