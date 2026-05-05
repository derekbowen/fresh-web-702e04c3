import * as React from "react";
import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { checkAdminRole } from "@/server/admin-auth.functions";
import { adminListPendingProviders, adminUpdateProvider } from "@/server/directory.functions";
import { SiteHeader, SiteFooter } from "@/components/site-layout";

export const Route = createFileRoute("/admin/directory")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { redirect: "/admin/directory", mode: "signin" } });
    const { isAdmin } = await checkAdminRole();
    if (!isAdmin) throw redirect({ to: "/" });
  },
  head: () => ({ meta: [{ title: "Directory Moderation — Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminDirectory,
});

type StatusFilter = "pending" | "all" | "approved" | "rejected";
type PlanFilter = "all" | "featured_active" | "paid_active" | "expiring_soon" | "expired" | "free";
type SortKey = "newest" | "name" | "paid_until" | "featured_until";

const DAY = 86_400_000;

function planBucket(p: any): PlanFilter {
  const now = Date.now();
  const fUntil = p.featured_until ? new Date(p.featured_until).getTime() : 0;
  const pUntil = p.listing_paid_until ? new Date(p.listing_paid_until).getTime() : 0;
  if (p.is_featured && fUntil > now) return "featured_active";
  if (pUntil > now) return "paid_active";
  if ((fUntil && fUntil <= now) || (pUntil && pUntil <= now)) return "expired";
  return "free";
}

function fmtDate(d: any) {
  return d ? new Date(d).toLocaleDateString() : "—";
}

function fmtRelative(d: any) {
  if (!d) return "";
  const diff = new Date(d).getTime() - Date.now();
  const days = Math.round(diff / DAY);
  if (days === 0) return "today";
  if (days > 0) return `in ${days}d`;
  return `${-days}d ago`;
}

function AdminDirectory() {
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<StatusFilter>("pending");
  const [planFilter, setPlanFilter] = React.useState<PlanFilter>("all");
  const [sort, setSort] = React.useState<SortKey>("newest");
  const [search, setSearch] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminListPendingProviders();
      setRows(r.providers);
    } finally { setLoading(false); }
  }, []);
  React.useEffect(() => { void load(); }, [load]);

  async function act(id: string, action: any) {
    setBusy(id + action);
    try {
      await adminUpdateProvider({ data: { id, action } });
      await load();
    } catch (e: any) { alert(e?.message || "Failed"); }
    finally { setBusy(null); }
  }

  const now = Date.now();
  const visible = React.useMemo(() => {
    let list = rows.filter((r) => filter === "all" ? true : r.submission_status === filter);
    if (planFilter !== "all") {
      list = list.filter((r) => {
        if (planFilter === "expiring_soon") {
          const f = r.featured_until ? new Date(r.featured_until).getTime() : 0;
          const p = r.listing_paid_until ? new Date(r.listing_paid_until).getTime() : 0;
          const soon = (t: number) => t > now && t - now < 30 * DAY;
          return soon(f) || soon(p);
        }
        return planBucket(r) === planFilter;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        [r.name, r.slug, r.city, r.state_code, r.email, r.submitter_email]
          .filter(Boolean).some((v: string) => v.toLowerCase().includes(q)),
      );
    }
    const cmp: Record<SortKey, (a: any, b: any) => number> = {
      newest: (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      name: (a, b) => (a.name || "").localeCompare(b.name || ""),
      paid_until: (a, b) =>
        (b.listing_paid_until ? new Date(b.listing_paid_until).getTime() : 0) -
        (a.listing_paid_until ? new Date(a.listing_paid_until).getTime() : 0),
      featured_until: (a, b) =>
        (b.featured_until ? new Date(b.featured_until).getTime() : 0) -
        (a.featured_until ? new Date(a.featured_until).getTime() : 0),
    };
    return [...list].sort(cmp[sort]);
  }, [rows, filter, planFilter, sort, search, now]);

  const planCounts = React.useMemo(() => {
    const buckets = ["all","featured_active","paid_active","expiring_soon","expired","free"] as const;
    const out: Record<string, number> = {};
    for (const b of buckets) {
      if (b === "all") { out[b] = rows.length; continue; }
      if (b === "expiring_soon") {
        out[b] = rows.filter((r) => {
          const f = r.featured_until ? new Date(r.featured_until).getTime() : 0;
          const p = r.listing_paid_until ? new Date(r.listing_paid_until).getTime() : 0;
          const soon = (t: number) => t > now && t - now < 30 * DAY;
          return soon(f) || soon(p);
        }).length;
      } else {
        out[b] = rows.filter((r) => planBucket(r) === b).length;
      }
    }
    return out;
  }, [rows, now]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Directory moderation</h1>
            <p className="text-sm text-muted-foreground">Review and approve provider submissions.</p>
          </div>
          <Link to="/admin/dashboard" className="text-sm text-primary hover:underline">← Dashboard</Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(["pending","approved","rejected","all"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
              {f} ({rows.filter((r) => f === "all" ? true : r.submission_status === f).length})
            </button>
          ))}
          <button onClick={load} className="ml-auto rounded-full bg-card border border-border px-3 py-1 text-xs">Refresh</button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase text-muted-foreground">Plan:</span>
          {([
            ["all","All"],
            ["featured_active","Featured active"],
            ["paid_active","Paid active"],
            ["expiring_soon","Expiring ≤30d"],
            ["expired","Expired"],
            ["free","Free"],
          ] as [PlanFilter, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setPlanFilter(key)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${planFilter === key ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
              {label} ({planCounts[key] ?? 0})
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, slug, city, email…"
            className="flex-1 min-w-[200px] rounded-lg border border-border bg-card px-3 py-1.5 text-sm"
          />
          <label className="text-xs font-semibold uppercase text-muted-foreground">Sort:</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm"
          >
            <option value="newest">Newest</option>
            <option value="name">Name (A–Z)</option>
            <option value="paid_until">Paid until (latest)</option>
            <option value="featured_until">Featured until (latest)</option>
          </select>
          <span className="text-xs text-muted-foreground">{visible.length} shown</span>
        </div>


        {loading ? (
          <p className="mt-8 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {visible.map((p) => (
              <li key={p.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{p.name}</h3>
                      <Badge tone={p.submission_status === "pending" ? "warn" : p.submission_status === "approved" ? "ok" : "danger"}>{p.submission_status}</Badge>
                      {p.is_published && <Badge tone="ok">published</Badge>}
                      {p.is_featured && <Badge tone="primary">featured</Badge>}
                      {p.plan && p.plan !== "free" && <Badge>{p.plan}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {[p.primary_category, [p.city, p.state_code].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
                    </p>
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground line-clamp-3">{p.description}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {p.email && <span>📧 {p.email}</span>}
                      {p.phone && <span>📞 {p.phone}</span>}
                      {p.website_url && <a href={p.website_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">🔗 site</a>}
                      <a href={`/providers/${p.slug}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">/providers/{p.slug}</a>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs">
                      <span
                        title={p.listing_paid_until || ""}
                        className={p.listing_paid_until && new Date(p.listing_paid_until) > new Date() ? "text-green-700" : "text-muted-foreground"}
                      >
                        Paid until: {fmtDate(p.listing_paid_until)}
                        {p.listing_paid_until && <span className="ml-1 opacity-70">({fmtRelative(p.listing_paid_until)})</span>}
                      </span>
                      <span
                        title={p.featured_until || ""}
                        className={p.featured_until && new Date(p.featured_until) > new Date() ? "text-primary" : "text-muted-foreground"}
                      >
                        Featured until: {fmtDate(p.featured_until)}
                        {p.featured_until && <span className="ml-1 opacity-70">({fmtRelative(p.featured_until)})</span>}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {p.submission_status === "pending" && (
                      <>
                        <Btn onClick={() => act(p.id, "approve")} busy={busy === p.id + "approve"} tone="ok">Approve & publish</Btn>
                        <Btn onClick={() => act(p.id, "reject")} busy={busy === p.id + "reject"} tone="danger">Reject</Btn>
                      </>
                    )}
                    {p.submission_status === "approved" && (
                      <>
                        {p.is_published
                          ? <Btn onClick={() => act(p.id, "unpublish")} busy={busy === p.id + "unpublish"}>Unpublish</Btn>
                          : <Btn onClick={() => act(p.id, "publish")} busy={busy === p.id + "publish"} tone="ok">Publish</Btn>}
                        <Btn onClick={() => act(p.id, "mark_paid")} busy={busy === p.id + "mark_paid"} tone="ok">Mark paid ($5/yr)</Btn>
                        {p.listing_paid_until && <Btn onClick={() => act(p.id, "mark_unpaid")} busy={busy === p.id + "mark_unpaid"}>Mark unpaid</Btn>}
                        {p.is_featured
                          ? <Btn onClick={() => act(p.id, "unfeature")} busy={busy === p.id + "unfeature"}>Unfeature</Btn>
                          : <Btn onClick={() => act(p.id, "feature")} busy={busy === p.id + "feature"} tone="primary">Feature ($25/yr)</Btn>}
                      </>
                    )}
                    <Btn onClick={() => { if (confirm("Delete this listing?")) act(p.id, "delete"); }} busy={busy === p.id + "delete"} tone="danger">Delete</Btn>
                  </div>
                </div>
              </li>
            ))}
            {visible.length === 0 && <p className="text-sm text-muted-foreground">Nothing here.</p>}
          </ul>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone?: "ok" | "warn" | "danger" | "primary" }) {
  const cls = tone === "ok" ? "bg-green-500/15 text-green-700"
    : tone === "warn" ? "bg-yellow-500/15 text-yellow-700"
    : tone === "danger" ? "bg-red-500/15 text-red-700"
    : tone === "primary" ? "bg-primary text-primary-foreground"
    : "bg-secondary text-secondary-foreground";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${cls}`}>{children}</span>;
}

function Btn({ children, onClick, busy, tone }: { children: React.ReactNode; onClick: () => void; busy?: boolean; tone?: "ok" | "danger" | "primary" }) {
  const cls = tone === "ok" ? "bg-green-600 text-white"
    : tone === "danger" ? "bg-red-600 text-white"
    : tone === "primary" ? "bg-primary text-primary-foreground"
    : "bg-secondary text-secondary-foreground";
  return <button onClick={onClick} disabled={busy} className={`rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${cls}`}>{busy ? "…" : children}</button>;
}
