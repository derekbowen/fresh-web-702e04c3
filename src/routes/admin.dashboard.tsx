import * as React from "react";
import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { checkAdminRole } from "@/server/admin-auth.functions";
import { getDashboardStats, type DashboardStats } from "@/server/admin-dashboard.functions";
import { listPendingFailures, retryPendingTemplate, queueSpanishCityBatch, type FailedPage } from "@/server/admin-pending-actions.functions";
import { AdminLayout, ADMIN_NAV_GROUPS } from "@/components/admin-layout";

export const Route = createFileRoute("/admin/dashboard")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { redirect: "/admin/dashboard", mode: "signin" } });
    }
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
  const [authorized, setAuthorized] = React.useState(false);
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (cancelled) return;
      if (error || !data.user) {
        window.location.href = "/auth?redirect=%2Fadmin%2Fdashboard&mode=signin";
        return;
      }
      try {
        const { isAdmin } = await checkAdminRole();
        if (cancelled) return;
        if (!isAdmin) {
          window.location.replace("/admin/no-access");
          return;
        }
        setAuthorized(true);
      } catch {
        if (!cancelled) window.location.href = "/auth?redirect=%2Fadmin%2Fdashboard&mode=signin";
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const load = React.useCallback(async () => {
    setLoading(true); setErr(null);
    try { setStats(await getDashboardStats()); }
    catch (e: any) { setErr(e?.message || "Failed to load"); }
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => {
    if (!authorized) return;
    void load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [authorized, load]);

  const pct = stats ? Math.round((stats.contentPages.published / Math.max(stats.contentPages.total, 1)) * 100) : 0;

  return (
    <AdminLayout title="Dashboard">
      {!authorized ? (
        <div className="mt-12 text-center text-sm text-muted-foreground">Checking admin access…</div>
      ) : (
        <>
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

            {/* Critical issues banner */}
            {(() => {
              const i = stats.quality?.siteIssues;
              if (!i) return null;
              const lines: Array<{ key: string; label: string; n: number }> = [
                { key: "thin", label: "thin (<500w)", n: i.thin_published_total },
                { key: "empty", label: "empty body", n: i.empty_published_total },
                { key: "meta", label: "missing meta description", n: i.missing_meta_published },
                { key: "schema", label: "missing JSON-LD schema", n: i.missing_schema_published },
                { key: "links", label: "no internal links", n: i.no_links_published },
                { key: "title", label: "title is just slug", n: i.title_is_slug_published },
              ].filter((x) => x.n > 0);
              if (lines.length === 0) return null;
              return (
                <section className="mt-8 rounded-xl border border-red-500/40 bg-red-500/5 p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-red-700 dark:text-red-300">Critical issues — published pages</h2>
                    <Link to="/admin/seo-health" className="text-xs font-semibold text-red-700 underline dark:text-red-300">Open SEO health →</Link>
                  </div>
                  <ul className="mt-2 grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
                    {lines.map((l) => (
                      <li key={l.key} className="flex items-baseline gap-2">
                        <span className="inline-flex min-w-[3rem] justify-end rounded bg-red-500/15 px-2 py-0.5 text-xs font-bold text-red-700 dark:text-red-300">{l.n.toLocaleString()}</span>
                        <span className="text-muted-foreground">{l.label}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })()}

            {/* By template */}
            <section className="mt-8">
              <h2 className="text-xl font-semibold">By template type</h2>
              <p className="text-xs text-muted-foreground">Quality buckets count published pages only. Thin = &lt;500 words, Medium = 500–999, Healthy = 1000+.</p>
              <div className="mt-3 overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase">
                    <tr>
                      <th className="px-3 py-2">Template</th>
                      <th className="px-3 py-2 text-right">Total</th>
                      <th className="px-3 py-2 text-right">Published</th>
                      <th className="px-3 py-2 text-right">% done</th>
                      <th className="px-3 py-2 text-right">Thin</th>
                      <th className="px-3 py-2 text-right">Medium</th>
                      <th className="px-3 py-2 text-right">Healthy</th>
                      <th className="px-3 py-2 text-right">Missing body</th>
                      <th className="px-3 py-2 text-right">Avg words</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.byTemplate.map((t) => {
                      const p = Math.round((t.published / Math.max(t.total, 1)) * 100);
                      const q = stats.quality?.byTemplate.find((x) => (x.template_type || "(none)") === (t.template_type || "(none)"));
                      const thin = q?.published_thin ?? 0;
                      const medium = q?.published_medium ?? 0;
                      const healthy = q?.published_healthy ?? 0;
                      const missingBody = q?.published_missing_body ?? 0;
                      const avg = q?.avg_words_published ?? null;
                      return (
                        <tr key={t.template_type || "(none)"} className="border-t border-border">
                          <td className="px-3 py-2 font-mono text-xs">{t.template_type || "(none)"}</td>
                          <td className="px-3 py-2 text-right">{t.total.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right">{t.published.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right">{p}%</td>
                          <td className="px-3 py-2 text-right">
                            {thin > 0 ? <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-xs font-bold text-red-700 dark:text-red-300">{thin}</span> : <span className="text-muted-foreground">0</span>}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {medium > 0 ? <span className="rounded bg-yellow-500/15 px-1.5 py-0.5 text-xs font-bold text-yellow-700 dark:text-yellow-300">{medium}</span> : <span className="text-muted-foreground">0</span>}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {healthy > 0 ? <span className="rounded bg-green-500/15 px-1.5 py-0.5 text-xs font-bold text-green-700 dark:text-green-300">{healthy}</span> : <span className="text-muted-foreground">0</span>}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {missingBody > 0 ? <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-xs font-bold text-red-700 dark:text-red-300">{missingBody}</span> : <span className="text-muted-foreground">0</span>}
                          </td>
                          <td className="px-3 py-2 text-right text-muted-foreground">{avg == null ? "—" : avg.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Pending Queue Diagnostics */}
            <PendingDiagnosticsSection diagnostics={stats.pendingDiagnostics} />

            {/* Spanish Content Engine */}
            <SpanishEngineSection spanish={stats.spanish} onQueued={load} />

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

            {/* Tool grid grouped */}
            <section className="mt-10">
              <h2 className="text-xl font-semibold">All tools</h2>
              <div className="mt-4 grid gap-6 lg:grid-cols-2">
                {ADMIN_NAV_GROUPS.filter((g) => g.label !== "Overview").map((g) => (
                  <div key={g.label} className="rounded-xl border border-border bg-card p-4">
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">{g.label}</h3>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {g.items.map((it) => (
                        <Link key={it.to} to={it.to} className="group flex items-center gap-2.5 rounded-lg border border-border bg-background p-3 text-sm font-medium hover:border-primary hover:bg-primary/5">
                          <it.icon className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                          <span className="truncate">{it.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {loading && !stats && <div className="mt-12 text-center text-sm text-muted-foreground">Loading…</div>}
        </>
      )}
    </AdminLayout>
  );
}

function PendingDiagnosticsSection({ diagnostics }: { diagnostics: DashboardStats["pendingDiagnostics"] }) {
  const [busy, setBusy] = React.useState<string | null>(null);
  const [failedFor, setFailedFor] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState<FailedPage[] | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);

  if (!diagnostics || diagnostics.length === 0) return null;

  async function retry(t: string) {
    setBusy(t); setMsg(null);
    try {
      const r = await retryPendingTemplate({ data: { template_type: t, limit: 500 } });
      setMsg(`Re-queued ${r.retried} pending pages for ${t}.`);
    } catch (e: any) {
      setMsg(e?.message || "Retry failed");
    } finally { setBusy(null); }
  }
  async function viewFailed(t: string) {
    setBusy(t); setFailedFor(t); setFailed(null);
    try {
      const list = await listPendingFailures({ data: { template_type: t, limit: 100 } });
      setFailed(list);
    } catch (e: any) {
      setMsg(e?.message || "Load failed");
    } finally { setBusy(null); }
  }

  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold">Pending queue diagnostics</h2>
      <p className="text-xs text-muted-foreground">Templates with &gt;10 pending pages. Errors come from content_plan.last_error joined by slug.</p>
      {msg && <div className="mt-2 rounded border border-border bg-muted/30 p-2 text-xs">{msg}</div>}
      <div className="mt-3 space-y-3">
        {diagnostics.map((d) => (
          <div key={d.template_type || "(none)"} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-mono text-sm font-bold">{d.template_type || "(none)"}</div>
                <div className="text-xs text-muted-foreground">
                  {d.pending} pending · {d.missing_body} missing body · {d.missing_title} missing title · {d.missing_meta} missing meta · {d.missing_slug} missing slug
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => retry(d.template_type || "")} disabled={busy === d.template_type} className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">
                  {busy === d.template_type ? "…" : "Retry all pending"}
                </button>
                <button onClick={() => viewFailed(d.template_type || "")} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold">
                  View failed
                </button>
              </div>
            </div>
            {d.top_errors.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs">
                {d.top_errors.map((e, i) => (
                  <li key={i} className="flex gap-2"><span className="rounded bg-red-500/15 px-1.5 font-bold text-red-700 dark:text-red-300">{e.count}×</span><span className="text-muted-foreground">{e.reason}</span></li>
                ))}
              </ul>
            )}
            {failedFor === d.template_type && failed && (
              <div className="mt-3 max-h-64 overflow-auto rounded border border-border bg-background">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 text-left"><tr><th className="px-2 py-1">Slug</th><th className="px-2 py-1">Status</th><th className="px-2 py-1">Last error</th></tr></thead>
                  <tbody>
                    {failed.map((p) => (
                      <tr key={p.slug} className="border-t border-border">
                        <td className="px-2 py-1 font-mono">{p.slug}</td>
                        <td className="px-2 py-1">{p.status}</td>
                        <td className="px-2 py-1 text-muted-foreground">{p.last_error || "—"}</td>
                      </tr>
                    ))}
                    {failed.length === 0 && <tr><td colSpan={3} className="px-2 py-3 text-center text-muted-foreground">No pending pages.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function SpanishEngineSection({ spanish, onQueued }: { spanish: DashboardStats["spanish"]; onQueued: () => void }) {
  const [count, setCount] = React.useState(100);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  async function queue() {
    setBusy(true); setMsg(null);
    try {
      const r = await queueSpanishCityBatch({ data: { count } });
      setMsg(`Queued ${r.inserted} new Spanish city plan rows (skipped ${r.skipped} already covered).`);
      onQueued();
    } catch (e: any) {
      setMsg(e?.message || "Queue failed");
    } finally { setBusy(false); }
  }

  const queuedPct = spanish.cities_eligible > 0
    ? Math.round((spanish.cities_with_es / spanish.cities_eligible) * 100)
    : 0;

  return (
    <section className="mt-8 rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Spanish content engine</h2>
        <span className="text-xs text-muted-foreground">{queuedPct}% city coverage</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
        <div><div className="text-xs uppercase text-muted-foreground">Spanish pages</div><div className="font-bold">{spanish.pages_published}/{spanish.pages_total}</div></div>
        <div><div className="text-xs uppercase text-muted-foreground">Pending</div><div className="font-bold">{spanish.pages_pending}</div></div>
        <div><div className="text-xs uppercase text-muted-foreground">Plan rows pending</div><div className="font-bold">{spanish.plan_pending}</div></div>
        <div><div className="text-xs uppercase text-muted-foreground">Cities w/ ES</div><div className="font-bold">{spanish.cities_with_es}/{spanish.cities_eligible}</div></div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-emerald-500" style={{ width: `${queuedPct}%` }} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="text-xs text-muted-foreground">Cities to queue:</label>
        <input type="number" min={1} max={500} value={count} onChange={(e) => setCount(Math.max(1, Math.min(500, Number(e.target.value) || 0)))} className="w-24 rounded border border-border bg-background px-2 py-1 text-sm" />
        <button onClick={queue} disabled={busy} className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? "Queueing…" : "Generate Spanish city batch"}
        </button>
        <span className="text-xs text-muted-foreground">Sorted by population, skips existing.</span>
      </div>
      {msg && <div className="mt-2 text-xs">{msg}</div>}
    </section>
  );
}
