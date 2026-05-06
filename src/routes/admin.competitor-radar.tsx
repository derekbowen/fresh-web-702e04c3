import * as React from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { checkAdminRole } from "@/server/admin-auth.functions";
import {
  listCompetitorSites, addCompetitorSite, deleteCompetitorSite,
  runCompetitorScan, listNewCompetitorUrls, acknowledgeCompetitorUrls,
  scrapeCompetitorUrlRow,
  type CompetitorSiteRow, type CompetitorUrlRow,
} from "@/server/admin-weapons.functions";
import { AdminLayout } from "@/components/admin-layout";
import { Loader2, Plus, RefreshCw, Trash2, ExternalLink, Check, Eye, Radar } from "lucide-react";

export const Route = createFileRoute("/admin/competitor-radar")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { redirect: "/admin/competitor-radar", mode: "signin" } });
    const { isAdmin } = await checkAdminRole();
    if (!isAdmin) throw redirect({ to: "/admin/no-access" });
  },
  head: () => ({ meta: [{ title: "Competitor Radar — Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: CompetitorRadar,
});

function CompetitorRadar() {
  const [sites, setSites] = React.useState<CompetitorSiteRow[]>([]);
  const [newRows, setNewRows] = React.useState<CompetitorUrlRow[]>([]);
  const [domain, setDomain] = React.useState("");
  const [sitemap, setSitemap] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [scanning, setScanning] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [showAck, setShowAck] = React.useState(false);

  const load = React.useCallback(async () => {
    const [s, n] = await Promise.all([
      listCompetitorSites(),
      listNewCompetitorUrls({ data: { onlyUnacknowledged: !showAck, limit: 200 } }),
    ]);
    setSites(s.rows);
    setNewRows(n.rows);
  }, [showAck]);

  React.useEffect(() => { load(); }, [load]);

  async function add() {
    if (!domain.trim() || !sitemap.trim()) return;
    const r: any = await addCompetitorSite({ data: { domain: domain.trim(), sitemap_url: sitemap.trim(), label: label.trim() || undefined } });
    if (r.ok) { setDomain(""); setSitemap(""); setLabel(""); await load(); }
    else setMsg(r.error);
  }

  async function scan() {
    setScanning(true); setMsg(null);
    try {
      const r: any = await runCompetitorScan({ data: {} });
      const total = r.results?.reduce((a: number, b: any) => a + (b.new_count || 0), 0) || 0;
      setMsg(`Scan done. ${total} new pages discovered.`);
      await load();
    } catch (e: any) { setMsg(e?.message || "scan failed"); }
    finally { setScanning(false); }
  }

  async function ackOne(id: string) {
    await acknowledgeCompetitorUrls({ data: { ids: [id] } });
    await load();
  }

  async function ackAll() {
    if (!newRows.length) return;
    await acknowledgeCompetitorUrls({ data: { ids: newRows.map((r) => r.id) } });
    await load();
  }

  async function scrapeRow(id: string) {
    await scrapeCompetitorUrlRow({ data: { id } });
    await load();
  }

  async function removeSite(id: string) {
    if (!confirm("Delete this competitor site and all tracked URLs?")) return;
    await deleteCompetitorSite({ data: { id } });
    await load();
  }

  return (
    <AdminLayout title="Competitor Radar">
      <div className="mb-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
          <Radar className="h-6 w-6 text-primary" /> Competitor Radar
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor competitor sitemaps daily. The moment Swimply, Giggster, or Peerspace ship a new page, it shows up here.
        </p>
      </div>

      {/* Add site */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-semibold">Track a new competitor sitemap</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="swimply.com"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <input value={sitemap} onChange={(e) => setSitemap(e.target.value)} placeholder="https://swimply.com/sitemap.xml"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm sm:col-span-2" />
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (optional)"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <button onClick={add} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground sm:col-span-2">
            <Plus className="h-4 w-4" /> Add site
          </button>
        </div>
      </div>

      {/* Sites list */}
      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {sites.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{s.label || s.domain}</p>
              <p className="truncate text-xs text-muted-foreground">{s.sitemap_url}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {s.last_url_count} URLs · {s.last_checked_at ? `checked ${new Date(s.last_checked_at).toLocaleString()}` : "never checked"}
              </p>
            </div>
            <button onClick={() => removeSite(s.id)} className="ml-2 rounded-full border border-border p-2 text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {sites.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground md:col-span-2">
            No competitors tracked yet. Add Swimply, Giggster, Peerspace above.
          </p>
        )}
      </div>

      {/* Scan + feed */}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold">{showAck ? "All competitor URLs" : "🚨 New pages discovered"}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowAck((s) => !s)} className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold">
            {showAck ? "Show new only" : "Show all"}
          </button>
          {!showAck && newRows.length > 0 && (
            <button onClick={ackAll} className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold">
              <Check className="mr-1 inline h-3 w-3" /> Acknowledge all
            </button>
          )}
          <button onClick={scan} disabled={scanning}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {scanning ? "Scanning…" : "Scan now"}
          </button>
        </div>
      </div>
      {msg && <p className="mt-2 text-xs text-muted-foreground">{msg}</p>}

      <div className="mt-3 space-y-2">
        {newRows.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {showAck ? "No URLs tracked yet. Run a scan." : "Nothing new since the last scan. You're caught up. 🎯"}
          </p>
        )}
        {newRows.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  {r.domain && <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold">{r.domain}</span>}
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {new Date(r.first_seen_at).toLocaleDateString()}
                  </span>
                  {r.word_count != null && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold">{r.word_count} words</span>
                  )}
                </div>
                <a href={r.url} target="_blank" rel="noreferrer noopener"
                  className="mt-1 inline-flex items-center gap-1 break-all text-sm font-medium text-primary hover:underline">
                  {r.url} <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
                {r.title && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{r.title}</p>}
              </div>
              <div className="flex shrink-0 gap-1.5">
                {!r.scraped_at && (
                  <button onClick={() => scrapeRow(r.id)} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold">
                    <Eye className="h-3 w-3" /> Scrape
                  </button>
                )}
                {!r.acknowledged && (
                  <button onClick={() => ackOne(r.id)} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold">
                    <Check className="h-3 w-3" /> Got it
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
