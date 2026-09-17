/**
 * Evaluate phase: decide who qualifies for which campaign today and enqueue
 * idempotent communication_jobs (one row per host per campaign, ever).
 */
import { eligibleCampaigns, explainAll, type CampaignConfig, type CampaignKey, type SentHistory } from "../../../src/lib/host-lifecycle/campaigns";
import type { HostLifecycleRow } from "../../../src/lib/host-lifecycle/state";
import { decideDelivery, type EngineConfig } from "./config";
import type { Db } from "./db";

export type StateRow = HostLifecycleRow & { state_entered_at: string; published_at: string | null; last_synced_at: string };

export interface EvaluateStats { hosts: number; eligible: number; enqueued: number; alreadyQueued: number; outsideCohort: number; byCampaign: Record<string, number>; eligibleByCampaign: Record<string, number>; reasons: Record<string, number> }

/**
 * Three histories, kept apart on purpose:
 *   sent       — genuine provider deliveries only (status 'sent'). This is the
 *                only thing that makes a campaign "already sent" for a host.
 *   inflight   — queued/leased rows carrying the PRODUCTION key; they block a
 *                second enqueue of the same intent, nothing more.
 *   simulated  — would_send rows (dry_run / allowlist record-only). Audit only;
 *                they never suppress a future real send.
 * A dry run must never consume production send state.
 */
export interface JobHistory extends SentHistory {
  inflight: Partial<Record<CampaignKey, true>>;
  simulatedOn: Partial<Record<CampaignKey, string>>; // campaign → YYYY-MM-DD of the latest would_send
  suppressedOn: Partial<Record<CampaignKey, string>>; // campaign → YYYY-MM-DD of the latest suppressed outcome (re-checked once a day, not every tick)
}
const emptyHistory = (): JobHistory => ({ sent: {}, lastEmailAt: null, inflight: {}, simulatedOn: {}, suppressedOn: {} });

export function productionKey(userId: string, campaign: string): string { return `${userId}:${campaign}`; }
/** Per-day simulation key: one would_send per host per campaign per UTC day, never colliding with the production key. */
export function simulationKey(userId: string, campaign: string, now: Date): string { return `sim:${userId}:${campaign}:${now.toISOString().slice(0, 10)}`; }
export function isProductionKey(key: string): boolean { return !key.startsWith("sim:"); }

export async function loadHistory(db: Db): Promise<Map<string, JobHistory>> {
  const { data, error } = await db
    .from("communication_jobs")
    .select("user_id, campaign_key, status, sent_at, updated_at, idempotency_key")
    .in("status", ["sent", "would_send", "suppressed", "queued", "leased"]);
  if (error) throw new Error(`read communication_jobs: ${error.message}`);
  const out = new Map<string, JobHistory>();
  for (const j of data ?? []) {
    const h = out.get(j.user_id) ?? emptyHistory();
    const c = j.campaign_key as CampaignKey;
    if (j.status === "sent") {
      const at = (j.sent_at ?? j.updated_at) as string;
      h.sent[c] = at;
      if (!h.lastEmailAt || at > h.lastEmailAt) h.lastEmailAt = at;
    } else if (j.status === "would_send") {
      const day = String(j.updated_at).slice(0, 10);
      if (!h.simulatedOn[c] || day > h.simulatedOn[c]!) h.simulatedOn[c] = day;
    } else if (j.status === "suppressed") {
      const day = String(j.updated_at).slice(0, 10);
      if (!h.suppressedOn[c] || day > h.suppressedOn[c]!) h.suppressedOn[c] = day;
    } else if (isProductionKey(String(j.idempotency_key ?? ""))) {
      h.inflight[c] = true;
    }
    out.set(j.user_id, h);
  }
  return out;
}

export interface EnqueueOptions { campaigns: CampaignConfig; delivery: Pick<EngineConfig, "enabled" | "mode" | "allowlist" | "productionCampaigns">; onlyUsers?: string[]; onlyCampaigns?: string[] }

export async function evaluateAndEnqueue(db: Db, opts: EnqueueOptions, now = new Date()): Promise<EvaluateStats & { explain: Array<{ user_id: string; state: string; campaigns: Array<{ campaign: string; eligible: boolean; reason: string }> }> }> {
  const cfg = opts.campaigns;
  const { data: rows, error } = await db.from("host_lifecycle_state").select("*");
  if (error) throw new Error(`read host_lifecycle_state: ${error.message}`);
  const history = await loadHistory(db);
  const stats: EvaluateStats = { hosts: 0, eligible: 0, enqueued: 0, alreadyQueued: 0, outsideCohort: 0, byCampaign: {}, eligibleByCampaign: {}, reasons: {} };
  const explain: Array<{ user_id: string; state: string; campaigns: Array<{ campaign: string; eligible: boolean; reason: string }> }> = [];
  for (const r of (rows ?? []) as StateRow[]) {
    stats.hosts++;
    const h = history.get(r.user_id) ?? emptyHistory();
    const input = { row: r, stateEnteredAt: r.state_entered_at, history: h, now, config: cfg };
    const all = explainAll(input);
    for (const e of all) if (!e.eligible) stats.reasons[e.reason.replace(/\d+/g, "N")] = (stats.reasons[e.reason.replace(/\d+/g, "N")] ?? 0) + 1;
    explain.push({ user_id: r.user_id, state: r.lifecycle_state, campaigns: all });
    for (const e of eligibleCampaigns(input)) {
      stats.eligible++;
      stats.eligibleByCampaign[e.campaign] = (stats.eligibleByCampaign[e.campaign] ?? 0) + 1;
      // Would this email actually leave under the current switches (kill switch,
      // mode, recipient allowlist, campaign allowlist)? Decided per campaign so a
      // record-only intent never occupies the production key.
      const real = decideDelivery(opts.delivery, r.email, e.campaign).kind === "send";
      // Hand-run restrictions: outside the cohort / campaign list nothing is enqueued at all.
      if (opts.onlyUsers?.length && !opts.onlyUsers.includes(r.user_id)) { stats.outsideCohort++; continue; }
      if (opts.onlyCampaigns?.length && !opts.onlyCampaigns.includes(e.campaign)) { stats.outsideCohort++; continue; }
      if (real && h.inflight[e.campaign]) { stats.alreadyQueued++; continue; }
      if (!real && h.simulatedOn[e.campaign] === now.toISOString().slice(0, 10)) { stats.alreadyQueued++; continue; }
      // A host suppressed today is re-checked tomorrow, not every tick (audit stays bounded).
      if (h.suppressedOn[e.campaign] === now.toISOString().slice(0, 10)) { stats.alreadyQueued++; continue; }
      const { error: insErr, data } = await db
        .from("communication_jobs")
        .upsert(
          {
            user_id: r.user_id,
            channel: "email",
            campaign_key: e.campaign,
            template_key: e.campaign,
            lifecycle_state: r.lifecycle_state,
            recipient: r.email,
            scheduled_at: now.toISOString(),
            status: "queued",
            idempotency_key: real ? productionKey(r.user_id, e.campaign) : simulationKey(r.user_id, e.campaign, now),
            eligibility_reason: e.reason,
          },
          { onConflict: "idempotency_key", ignoreDuplicates: true },
        )
        .select("id");
      if (insErr) throw new Error(`enqueue: ${insErr.message}`);
      if (data && data.length > 0) { stats.enqueued++; stats.byCampaign[e.campaign] = (stats.byCampaign[e.campaign] ?? 0) + 1; }
      else stats.alreadyQueued++;
    }
  }
  return { ...stats, explain };
}
