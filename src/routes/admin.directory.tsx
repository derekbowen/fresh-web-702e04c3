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

function AdminDirectory() {
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<"pending" | "all" | "approved" | "rejected">("pending");

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

  const visible = rows.filter((r) => filter === "all" ? true : r.submission_status === filter);

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

        <div className="mt-4 flex gap-2">
          {(["pending","approved","rejected","all"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
              {f} ({rows.filter((r) => f === "all" ? true : r.submission_status === f).length})
            </button>
          ))}
          <button onClick={load} className="ml-auto rounded-full bg-card border border-border px-3 py-1 text-xs">Refresh</button>
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
                      <span className={p.listing_paid_until && new Date(p.listing_paid_until) > new Date() ? "text-green-700" : "text-muted-foreground"}>
                        Paid until: {p.listing_paid_until ? new Date(p.listing_paid_until).toLocaleDateString() : "—"}
                      </span>
                      <span className={p.featured_until && new Date(p.featured_until) > new Date() ? "text-primary" : "text-muted-foreground"}>
                        Featured until: {p.featured_until ? new Date(p.featured_until).toLocaleDateString() : "—"}
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
