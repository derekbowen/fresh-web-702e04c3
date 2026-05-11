import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { checkAdminRole } from "@/server/admin-auth.functions";
import { AdminLayout } from "@/components/admin-layout";
import {
  getRefreshQueue,
  getRefreshHistory,
  runAiRefresh,
  type RefreshCandidate,
  type RefreshJobRow,
} from "@/lib/refresh-queue.functions";

export const Route = createFileRoute("/admin/auto-refresh")({
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" as never });
    const { isAdmin } = await checkAdminRole();
    if (!isAdmin) throw redirect({ to: "/admin/no-access" });
  },
  component: AutoRefreshPage,
  head: () => ({ meta: [{ title: "Auto-refresh queue — Admin" }] }),
});

type ReasonFilter = "all" | "decaying" | "stale" | "zero-click";

function reasonBadge(r: RefreshCandidate["reason"]) {
  const map: Record<RefreshCandidate["reason"], { label: string; cls: string }> = {
    decaying: { label: "Decaying", cls: "bg-red-100 text-red-800" },
    "zero-click": { label: "Zero-click", cls: "bg-orange-100 text-orange-800" },
    stale: { label: "Stale", cls: "bg-amber-100 text-amber-800" },
    manual: { label: "Manual", cls: "bg-slate-100 text-slate-800" },
  };
  return map[r] ?? map.manual;
}

function AutoRefreshPage() {
  const [tab, setTab] = useState<"queue" | "history">("queue");
  const [queue, setQueue] = useState<RefreshCandidate[] | null>(null);
  const [history, setHistory] = useState<RefreshJobRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [reasonFilter, setReasonFilter] = useState<ReasonFilter>("all");
  const [search, setSearch] = useState("");
  const [running, setRunning] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<
    Record<string, { ok: boolean; msg: string; before: number; after: number }>
  >({});

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [q, h] = await Promise.all([
        getRefreshQueue({ data: { limit: 300 } }),
        getRefreshHistory({ data: { limit: 50 } }),
      ]);
      setQueue(q.candidates);
      setHistory(h.jobs);
      if (q.error) setErr(q.error);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = useMemo(() => {
    if (!queue) return [];
    let rows = queue;
    if (reasonFilter !== "all") rows = rows.filter((r) => r.reason === reasonFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((r) => r.url_path.toLowerCase().includes(q));
    }
    return rows;
  }, [queue, reasonFilter, search]);

  async function refreshOne(c: RefreshCandidate) {
    setRunning((s) => new Set(s).add(c.url_path));
    try {
      const res = await runAiRefresh({
        data: { url_path: c.url_path, reason: c.reason },
      });
      setResults((m) => ({
        ...m,
        [c.url_path]: {
          ok: res.success,
          msg: res.success
            ? res.diff_summary ?? "Refreshed"
            : res.error ?? "Failed",
          before: res.before_word_count,
          after: res.after_word_count,
        },
      }));
      if (res.success) {
        // Mark as recently refreshed in local queue list
        setQueue((q) =>
          q ? q.map((x) => (x.url_path === c.url_path ? { ...x, has_recent_job: true } : x)) : q,
        );
      }
    } catch (e: any) {
      setResults((m) => ({
        ...m,
        [c.url_path]: { ok: false, msg: e?.message ?? "Failed", before: 0, after: 0 },
      }));
    } finally {
      setRunning((s) => {
        const n = new Set(s);
        n.delete(c.url_path);
        return n;
      });
    }
  }

  async function refreshTopN(n: number) {
    const top = visible.filter((c) => !c.has_recent_job).slice(0, n);
    for (const c of top) {
      // Sequential to avoid hammering the AI gateway and to surface 429s clearly.
      // eslint-disable-next-line no-await-in-loop
      await refreshOne(c);
    }
    // Re-pull history after batch.
    try {
      const h = await getRefreshHistory({ data: { limit: 50 } });
      setHistory(h.jobs);
    } catch {}
  }

  const counts = useMemo(() => {
    if (!queue) return { all: 0, decaying: 0, stale: 0, zero: 0 };
    return {
      all: queue.length,
      decaying: queue.filter((q) => q.reason === "decaying").length,
      stale: queue.filter((q) => q.reason === "stale").length,
      zero: queue.filter((q) => q.reason === "zero-click").length,
    };
  }, [queue]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Auto-refresh queue</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Pages flagged for AI rewrite based on GSC trends. One click rewrites
              the body, meta title, and meta description, then stamps{" "}
              <code>content_refreshed_at</code>.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="px-3 py-1.5 text-sm border rounded hover:bg-muted disabled:opacity-50"
            >
              {loading ? "Loading…" : "Reload"}
            </button>
            <button
              onClick={() => refreshTopN(5)}
              disabled={loading || !queue || running.size > 0}
              className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
            >
              Refresh top 5
            </button>
            <Link
              to={"/admin/page-health" as never}
              className="px-3 py-1.5 text-sm border rounded hover:bg-muted"
            >
              Page health →
            </Link>
          </div>
        </div>

        {err && (
          <div className="bg-red-50 text-red-800 text-sm p-3 rounded border border-red-200">
            {err}
          </div>
        )}

        <div className="flex gap-2 border-b">
          <button
            onClick={() => setTab("queue")}
            className={`px-3 py-2 text-sm border-b-2 -mb-px ${tab === "queue" ? "border-primary font-medium" : "border-transparent text-muted-foreground"}`}
          >
            Queue ({counts.all})
          </button>
          <button
            onClick={() => setTab("history")}
            className={`px-3 py-2 text-sm border-b-2 -mb-px ${tab === "history" ? "border-primary font-medium" : "border-transparent text-muted-foreground"}`}
          >
            History ({history?.length ?? 0})
          </button>
        </div>

        {tab === "queue" && (
          <>
            <div className="flex flex-wrap gap-2 items-center">
              {(
                [
                  { k: "all", label: `All (${counts.all})` },
                  { k: "decaying", label: `Decaying (${counts.decaying})` },
                  { k: "zero-click", label: `Zero-click (${counts.zero})` },
                  { k: "stale", label: `Stale (${counts.stale})` },
                ] as { k: ReasonFilter; label: string }[]
              ).map((f) => (
                <button
                  key={f.k}
                  onClick={() => setReasonFilter(f.k)}
                  className={`px-3 py-1 text-xs rounded border ${reasonFilter === f.k ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}
                >
                  {f.label}
                </button>
              ))}
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by URL…"
                className="ml-auto px-3 py-1 text-sm border rounded w-64"
              />
            </div>

            <div className="border rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted text-left">
                  <tr>
                    <th className="px-3 py-2">URL</th>
                    <th className="px-3 py-2">Reason</th>
                    <th className="px-3 py-2 text-right">Clicks 28d</th>
                    <th className="px-3 py-2 text-right">Δ vs prev</th>
                    <th className="px-3 py-2 text-right">Impr</th>
                    <th className="px-3 py-2 text-right">Pos</th>
                    <th className="px-3 py-2 text-right">Words</th>
                    <th className="px-3 py-2 text-right">Days</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 && !loading && (
                    <tr>
                      <td colSpan={9} className="px-3 py-6 text-center text-muted-foreground">
                        No pages flagged. Either everything is healthy or GSC data hasn't synced.
                      </td>
                    </tr>
                  )}
                  {visible.map((c) => {
                    const b = reasonBadge(c.reason);
                    const isRunning = running.has(c.url_path);
                    const result = results[c.url_path];
                    return (
                      <tr key={c.url_path} className="border-t align-top">
                        <td className="px-3 py-2">
                          <a
                            href={c.url_path}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-xs hover:underline"
                          >
                            {c.url_path}
                          </a>
                          {c.template_type && (
                            <div className="text-xs text-muted-foreground">
                              {c.template_type}
                            </div>
                          )}
                          {result && (
                            <div
                              className={`text-xs mt-1 ${result.ok ? "text-green-700" : "text-red-700"}`}
                            >
                              {result.ok ? "✓ " : "✗ "}
                              {result.msg}
                              {result.ok && (
                                <span className="text-muted-foreground">
                                  {" "}
                                  ({result.before}→{result.after} words)
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${b.cls}`}>
                            {b.label}
                          </span>
                          <div className="text-xs text-muted-foreground mt-1">
                            {c.reason_label}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{c.clicks_28d}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {c.clicks_delta_pct == null
                            ? "—"
                            : `${c.clicks_delta_pct > 0 ? "+" : ""}${Math.round(c.clicks_delta_pct)}%`}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{c.impressions_28d}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {c.position_28d == null ? "—" : c.position_28d.toFixed(1)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{c.word_count}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {c.days_since_refresh}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => refreshOne(c)}
                            disabled={isRunning}
                            className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
                          >
                            {isRunning
                              ? "Rewriting…"
                              : c.has_recent_job
                                ? "Refresh again"
                                : "AI refresh"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "history" && (
          <div className="border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="px-3 py-2">URL</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Reason</th>
                  <th className="px-3 py-2 text-right">Words</th>
                  <th className="px-3 py-2">Summary</th>
                  <th className="px-3 py-2">When</th>
                </tr>
              </thead>
              <tbody>
                {(history ?? []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                      No refresh runs yet.
                    </td>
                  </tr>
                )}
                {(history ?? []).map((j) => (
                  <tr key={j.id} className="border-t align-top">
                    <td className="px-3 py-2 font-mono text-xs">{j.url_path}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          j.status === "success"
                            ? "bg-green-100 text-green-800"
                            : j.status === "error"
                              ? "bg-red-100 text-red-800"
                              : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {j.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs">{j.reason ?? "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-xs">
                      {j.before_word_count ?? "—"} → {j.after_word_count ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-xs max-w-md">
                      {j.diff_summary ?? j.error_message ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(j.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
