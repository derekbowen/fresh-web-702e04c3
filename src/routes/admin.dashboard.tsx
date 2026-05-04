import * as React from "react";
import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { checkAdminRole } from "@/server/admin-auth.functions";
import { getDashboardStats, type DashboardStats } from "@/server/admin-dashboard.functions";
import { SiteHeader, SiteFooter } from "@/components/site-layout";

export const Route = createFileRoute("/admin/dashboard")({
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { redirect: "/admin/dashboard", mode: "signin" } });
    }
    const { isAdmin } = await checkAdminRole();
    if (!isAdmin) throw redirect({ to: "/" });
  },
  head: () => ({
    meta: [
      { title: "Admin Dashboard — PRNM" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminDashboard,
});

function StatCard({ label, value, hint, tone }: { label: string; value: React.ReactNode; hint?: string; tone?: "ok" | "warn" | "danger" }) {
  const toneCls =
    tone === "ok" ? "border-green-500/30 bg-green-500/5" :
    tone === "warn" ? "border-yellow-500/30 bg-yellow-500/5" :
    tone === "danger" ? "border-red-500/30 bg-red-500/5" :
    "border-border bg-card";
  return (
    <div className={`rounded-xl border p-4 ${toneCls}`}>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function AdminDashboard() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true); setErr(null);
    try { setStats(await getDashboardStats()); }
    catch (e: any) { setErr(e?.message || "Failed to load"); }
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => { void load(); const id = setInterval(load, 30_000); return () => clearInterval(id); }, [load]);

  const pct = stats ? Math.round((stats.contentPages.published / Math.max(stats.contentPages.total, 1)) * 100) : 0;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Live snapshot of the platform. Auto-refreshes every 30s.
              {stats && <> · Updated {new Date(stats.generatedAt).toLocaleTimeString()}</>}
            </p>
          </div>
          <button onClick={load} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {err && <div className="mt-6 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm">{err}</div>}

        {stats && (
          <>
            {/* Content generation */}
            <section className="mt-8">
              <h2 className="text-xl font-semibold">Content pages (/p/*)</h2>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-sm font-semibold">{pct}%</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Total" value={stats.contentPages.total.toLocaleString()} />
                <StatCard label="Published" value={stats.contentPages.published.toLocaleString()} tone="ok" />
                <StatCard label="Pending" value={stats.contentPages.pending.toLocaleString()} tone={stats.contentPages.pending > 0 ? "warn" : "ok"} />
                <StatCard label="Published last 24h" value={stats.contentPages.last24h.toLocaleString()} hint="Generation activity" />
              </div>
            </section>

            {/* By template */}
            <section className="mt-8">
              <h2 className="text-xl font-semibold">By template type</h2>
              <div className="mt-3 overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase">
                    <tr>
                      <th className="px-3 py-2">Template</th>
                      <th className="px-3 py-2 text-right">Total</th>
                      <th className="px-3 py-2 text-right">Published</th>
                      <th className="px-3 py-2 text-right">% done</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.byTemplate.map((t) => {
                      const p = Math.round((t.published / Math.max(t.total, 1)) * 100);
                      return (
                        <tr key={t.template_type || "(none)"} className="border-t border-border">
                          <td className="px-3 py-2 font-mono text-xs">{t.template_type || "(none)"}</td>
                          <td className="px-3 py-2 text-right">{t.total.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right">{t.published.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right">{p}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Other content */}
            <section className="mt-8">
              <h2 className="text-xl font-semibold">Content inventory</h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <StatCard label="Blog posts" value={`${stats.blog.published}/${stats.blog.total}`} hint="published / total" />
                <StatCard label="Courses" value={`${stats.courses.published}/${stats.courses.total}`} hint="published / total" />
                <StatCard label="Help articles" value={`${stats.helpArticles.published}/${stats.helpArticles.total}`} hint="published / total" />
                <StatCard label="Cities" value={`${stats.cities.published}/${stats.cities.total}`} hint="published / total" />
                <StatCard label="Providers" value={`${stats.providers.published}/${stats.providers.total}`} hint="published / total" />
                <StatCard label="Listings (synced)" value={stats.listings.total.toLocaleString()} hint={stats.listings.lastSync ? `Last sync ${new Date(stats.listings.lastSync).toLocaleString()}` : "No sync yet"} />
              </div>
            </section>

            {/* Users & engagement */}
            <section className="mt-8">
              <h2 className="text-xl font-semibold">Users & leads</h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Profiles" value={stats.users.profiles.toLocaleString()} />
                <StatCard label="Admins" value={stats.users.admins.toLocaleString()} />
                <StatCard label="Waitlist (7d)" value={`${stats.waitlist.last7d} / ${stats.waitlist.total}`} hint="last 7d / all-time" />
                <StatCard label="Provider leads" value={`${stats.leads.new} new / ${stats.leads.total}`} tone={stats.leads.new > 0 ? "warn" : undefined} />
              </div>
            </section>

            {/* Health */}
            <section className="mt-8">
              <h2 className="text-xl font-semibold">Health</h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <StatCard label="Unresolved 404s" value={stats.missing404s.unresolved.toLocaleString()} hint={`${stats.missing404s.total} total logged`} tone={stats.missing404s.unresolved > 10 ? "warn" : undefined} />
              </div>
            </section>

            {/* Recently published */}
            <section className="mt-8">
              <h2 className="text-xl font-semibold">Recently published</h2>
              <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
                {stats.recentlyPublished.map((r) => (
                  <li key={r.url_path} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                    <Link to={r.url_path} className="truncate font-medium hover:underline">{r.title || r.url_path}</Link>
                    <div className="flex shrink-0 gap-3 text-xs text-muted-foreground">
                      <span>{r.words} words</span>
                      <span>{new Date(r.updated_at).toLocaleString()}</span>
                    </div>
                  </li>
                ))}
                {stats.recentlyPublished.length === 0 && (
                  <li className="px-4 py-6 text-center text-sm text-muted-foreground">Nothing yet.</li>
                )}
              </ul>
            </section>

            {/* Quick links */}
            <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <AdminLink to="/admin/quick-page" label="Quick page builder" />
              <AdminLink to="/admin/generate-content" label="Generate content" />
              <AdminLink to="/admin/content-migration" label="Content migration" />
              <AdminLink to="/admin/missing-pages" label="Missing pages (404s)" />
              <AdminLink to="/admin/blog" label="Blog admin" />
              <AdminLink to="/admin/learning" label="Learning admin" />
              <AdminLink to="/admin/cities-heroes" label="City heroes" />
              <AdminLink to="/admin/click-report" label="Click report" />
            </section>
          </>
        )}

        {loading && !stats && <div className="mt-12 text-center text-sm text-muted-foreground">Loading…</div>}
      </main>
      <SiteFooter />
    </div>
  );
}

function AdminLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="rounded-xl border border-border bg-card p-4 text-sm font-medium hover:bg-muted/50">
      {label} →
    </Link>
  );
}
