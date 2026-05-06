import * as React from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { checkAdminRole } from "@/server/admin-auth.functions";
import {
  listCompetitorSites, addCompetitorSite, deleteCompetitorSite,
  runCompetitorScan, listNewCompetitorUrls, acknowledgeCompetitorUrls,
  scrapeCompetitorUrlRow, listHostMatches, updateHostMatchStatus, runHostMatchOne,
  enrichHostMatchOne, getEnrichmentSpend,
  type CompetitorSiteRow, type CompetitorUrlRow, type CompetitorHostMatchRow,
} from "@/server/admin-weapons.functions";
import { AdminLayout } from "@/components/admin-layout";
import { Loader2, Plus, RefreshCw, Trash2, ExternalLink, Check, Eye, Radar, Target, Mail, Phone, X, Sparkles, DollarSign } from "lucide-react";

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
  const [matches, setMatches] = React.useState<CompetitorHostMatchRow[]>([]);
  const [matchStatus, setMatchStatus] = React.useState<"new" | "review" | "contacted" | "converted" | "dismissed" | "all">("new");
  const [tab, setTab] = React.useState<"feed" | "matches">("feed");
  const [domain, setDomain] = React.useState("");
  const [sitemap, setSitemap] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [scanning, setScanning] = React.useState(false);
  const [matchingId, setMatchingId] = React.useState<string | null>(null);
  const [enrichingId, setEnrichingId] = React.useState<string | null>(null);
  const [spend, setSpend] = React.useState<{ today_spend_usd: number; today_calls: number; today_hits: number; month_spend_usd: number; daily_cap_usd: number; monthly_target_usd: number } | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [showAck, setShowAck] = React.useState(false);

  const load = React.useCallback(async () => {
    const [s, n, m, sp] = await Promise.all([
      listCompetitorSites(),
      listNewCompetitorUrls({ data: { onlyUnacknowledged: !showAck, limit: 200 } }),
      listHostMatches({ data: { status: matchStatus, minConfidence: 40, limit: 200 } }),
      getEnrichmentSpend().catch(() => null),
    ]);
    setSites(s.rows);
    setNewRows(n.rows);
    setMatches(m.rows);
    setSpend(sp);
  }, [showAck, matchStatus]);

  React.useEffect(() => { load(); }, [load]);

  async function findHostFor(id: string) {
    setMatchingId(id);
    try {
      const r: any = await runHostMatchOne({ data: { competitor_url_id: id } });
      setMsg(r.ok ? `Matcher: ${r.inserted} candidate(s) found${r.reason ? ` (${r.reason})` : ""}` : `Matcher failed: ${r.reason}`);
      await load();
    } finally { setMatchingId(null); }
  }

  async function setStatus(id: string, status: "contacted" | "converted" | "dismissed") {
    await updateHostMatchStatus({ data: { id, status } });
    await load();
  }

  async function enrich(id: string) {
    setEnrichingId(id);
    try {
      const r: any = await enrichHostMatchOne({ data: { match_id: id } });
      setMsg(r.ok ? `Enriched (${r.tier_reached}): ${r.emails_found} email(s), ${r.phones_found} phone(s), $${(r.cost_usd || 0).toFixed(2)}${r.reason ? ` — ${r.reason}` : ""}` : `Enrich failed: ${r.reason}`);
      await load();
    } finally { setEnrichingId(null); }
  }

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

      {/* Tabs */}
      <div className="mt-6 flex gap-2 border-b border-border">
        <button onClick={() => setTab("feed")} className={`px-4 py-2 text-sm font-semibold ${tab === "feed" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>
          New pages
        </button>
        <button onClick={() => setTab("matches")} className={`px-4 py-2 text-sm font-semibold ${tab === "matches" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>
          <Target className="mr-1 inline h-3.5 w-3.5" /> Host matches ({matches.length})
        </button>
      </div>

      {tab === "feed" && (
        <>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    {!r.scraped_at && (
                      <button onClick={() => scrapeRow(r.id)} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold">
                        <Eye className="h-3 w-3" /> Scrape
                      </button>
                    )}
                    <button onClick={() => findHostFor(r.id)} disabled={matchingId === r.id}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary disabled:opacity-50">
                      {matchingId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Target className="h-3 w-3" />}
                      Find host
                    </button>
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
        </>
      )}

      {tab === "matches" && (
        <div className="mt-3">
          {spend && (
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3 text-xs">
              <DollarSign className="h-4 w-4 text-primary" />
              <span><strong>${spend.today_spend_usd.toFixed(2)}</strong> / ${spend.daily_cap_usd} today</span>
              <span className="text-muted-foreground">· {spend.today_calls} calls, {spend.today_hits} hits</span>
              <span className="text-muted-foreground">· <strong>${spend.month_spend_usd.toFixed(2)}</strong> month-to-date (target ${spend.monthly_target_usd})</span>
              {spend.today_spend_usd >= spend.daily_cap_usd && <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">Cap hit — paid tiers paused</span>}
            </div>
          )}
          <div className="mb-3 flex flex-wrap gap-2">
            {(["new", "review", "contacted", "converted", "dismissed", "all"] as const).map((s) => (
              <button key={s} onClick={() => setMatchStatus(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${matchStatus === s ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                {s}
              </button>
            ))}
          </div>
          {matches.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No matches yet. The agent runs automatically on every new competitor URL discovered by the daily scan, or click <strong>Find host</strong> on a URL above to run it manually.
            </p>
          )}
          <div className="space-y-2">
            {matches.map((m) => (
              <div key={m.id} className="rounded-2xl border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${m.match_confidence >= 70 ? "bg-emerald-100 text-emerald-800" : m.match_confidence >= 50 ? "bg-amber-100 text-amber-800" : "bg-secondary"}`}>
                        {m.match_confidence}% match
                      </span>
                      {m.domain && <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold">{m.domain}</span>}
                      {m.candidate_source && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{m.candidate_source}</span>}
                      <span className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="mt-1 text-sm font-bold">
                      {m.candidate_name || m.candidate_business_name || "Unknown"}
                      {m.host_first_name && <span className="ml-2 text-xs font-normal text-muted-foreground">(listing host: {m.host_first_name}{m.host_city && `, ${m.host_city}`})</span>}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs">
                      {m.candidate_email && <a href={`mailto:${m.candidate_email}`} className="inline-flex items-center gap-1 text-primary hover:underline"><Mail className="h-3 w-3" />{m.candidate_email}</a>}
                      {m.candidate_phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{m.candidate_phone}</span>}
                      {m.candidate_website && <a href={m.candidate_website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline"><ExternalLink className="h-3 w-3" />website</a>}
                      {m.candidate_social_url && <a href={m.candidate_social_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline"><ExternalLink className="h-3 w-3" />social</a>}
                    </div>
                    {m.candidate_evidence && <p className="mt-1 text-xs text-muted-foreground">{m.candidate_evidence}</p>}
                    {m.enriched_at && (
                      <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">enriched · {m.enriched_tier}</span>
                          {m.revenue_signal_score != null && m.revenue_signal_score > 0 && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">revenue {m.revenue_signal_score}</span>
                          )}
                          {m.enrichment_cost_usd != null && m.enrichment_cost_usd > 0 && (
                            <span className="text-[10px] text-muted-foreground">${Number(m.enrichment_cost_usd).toFixed(2)}</span>
                          )}
                        </div>
                        {(m.enriched_emails?.length || 0) > 0 && (
                          <div className="mt-1 flex flex-wrap gap-2">{m.enriched_emails!.map((e) => <a key={e} href={`mailto:${e}`} className="inline-flex items-center gap-1 text-primary hover:underline"><Mail className="h-3 w-3" />{e}</a>)}</div>
                        )}
                        {(m.enriched_phones?.length || 0) > 0 && (
                          <div className="mt-1 flex flex-wrap gap-2">{m.enriched_phones!.map((p) => <span key={p} className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{p}</span>)}</div>
                        )}
                        {(m.enriched_socials?.length || 0) > 0 && (
                          <div className="mt-1 flex flex-wrap gap-2">{m.enriched_socials!.slice(0, 4).map((u) => <a key={u} href={u} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline"><ExternalLink className="h-3 w-3" />{new URL(u).hostname.replace("www.", "")}</a>)}</div>
                        )}
                        {m.property_address && <p className="mt-1 text-[11px] text-muted-foreground">📍 {m.property_address}</p>}
                        {m.revenue_signal_notes && <p className="mt-1 text-[11px] text-muted-foreground">{m.revenue_signal_notes}</p>}
                      </div>
                    )}
                    <a href={m.competitor_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 break-all text-[11px] text-muted-foreground hover:underline">
                      {m.competitor_url}
                    </a>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button onClick={() => enrich(m.id)} disabled={enrichingId === m.id}
                      className="inline-flex items-center justify-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary disabled:opacity-50">
                      {enrichingId === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      {m.enriched_at ? "Re-enrich" : "Enrich"}
                    </button>
                    {m.status === "new" && (
                      <>
                        <button onClick={() => setStatus(m.id, "contacted")} className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold">Mark contacted</button>
                        <button onClick={() => setStatus(m.id, "converted")} className="rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white">Converted</button>
                        <button onClick={() => setStatus(m.id, "dismissed")} className="rounded-full border border-border px-3 py-1 text-[11px] font-semibold text-muted-foreground"><X className="mr-1 inline h-2.5 w-2.5" />Dismiss</button>
                      </>
                    )}
                    {m.status !== "new" && <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold">{m.status}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
