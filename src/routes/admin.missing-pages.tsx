import * as React from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  list404s,
  resolve404,
  type Content404Row,
} from "@/server/content-404-log.functions";
import { checkAdminRole } from "@/server/admin-auth.functions";
import { AdminLayout } from "@/components/admin-layout";

export const Route = createFileRoute("/admin/missing-pages")({
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: "/auth",
        search: { redirect: "/admin/missing-pages", mode: "signin" },
      });
    }
    const { isAdmin } = await checkAdminRole();
    if (!isAdmin) throw redirect({ to: "/" });
  },
  head: () => ({
    meta: [
      { title: "Missing /p/* pages — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminMissingPages,
});

function AdminMissingPages() {
  const [rows, setRows] = React.useState<Content404Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [unresolvedOnly, setUnresolvedOnly] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await list404s({ data: { unresolvedOnly, limit: 200 } });
      setRows(res.rows);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [unresolvedOnly]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const markResolved = async (id: string) => {
    await resolve404({ data: { id } });
    await load();
  };

  const totalHits = rows.reduce((acc, r) => acc + (r.hit_count ?? 0), 0);

  return (
    <AdminLayout>
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Missing /p/* pages
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {rows.length} unique URL{rows.length === 1 ? "" : "s"} ·{" "}
              {totalHits} total 404 hit{totalHits === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={unresolvedOnly}
                onChange={(e) => setUnresolvedOnly(e.target.checked)}
              />
              Unresolved only
            </label>
            <button
              onClick={load}
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              Refresh
            </button>
          </div>
        </header>

        {error && (
          <div className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">URL</th>
                <th className="px-4 py-3">Hits</th>
                <th className="px-4 py-3">Last seen</th>
                <th className="px-4 py-3">Referrer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                    No 404s logged. Nice.
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((r) => (
                  <tr key={r.id} className="align-top">
                    <td className="px-4 py-3 font-mono text-xs">
                      <a
                        href={r.url_path}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        {r.url_path}
                      </a>
                    </td>
                    <td className="px-4 py-3 font-semibold">{r.hit_count}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(r.last_seen_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground break-all">
                      {r.referrer || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {r.resolved_at ? (
                        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                          Resolved
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                          Open
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!r.resolved_at && (
                        <button
                          onClick={() => markResolved(r.id)}
                          className="rounded-full border border-border px-3 py-1 text-xs font-semibold hover:bg-muted"
                        >
                          Mark resolved
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </AdminLayout>
  );
}
