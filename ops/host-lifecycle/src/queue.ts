/**
 * Evaluate phase: decide who qualifies for which campaign today and enqueue
 * idempotent communication_jobs (one row per host per campaign, ever).
 */
import { eligibleCampaigns, explainAll, type CampaignConfig, type CampaignKey, type SentHistory } from "../../../src/lib/host-lifecycle/campaigns";
import type { HostLifecycleRow } from "../../../src/lib/host-lifecycle/state";
import type { Db } from "./db";

export type StateRow = HostLifecycleRow & { state_entered_at: string; published_at: string | null; last_synced_at: string };

export interface EvaluateStats { hosts: number; eligible: number; enqueued: number; alreadyQueued: number; byCampaign: Record<string, number>; reasons: Record<string, number> }

/** Sent history from communication_jobs: anything that reached a terminal "we would have sent / did send" state counts. */
export async function loadHistory(db: Db): Promise<Map<string, SentHistory>> {
  const { data, error } = await db
    .from("communication_jobs")
    .select("user_id, campaign_key, status, sent_at, updated_at")
    .in("status", ["sent", "dry_run", "queued", "leased"]);
  if (error) throw new Error(`read communication_jobs: ${error.message}`);
  const out = new Map<string, SentHistory>();
  for (const j of data ?? []) {
    const h = out.get(j.user_id) ?? { sent: {}, lastEmailAt: null };
    const at = (j.sent_at ?? j.updated_at) as string;
    h.sent[j.campaign_key as CampaignKey] = at;
    if (j.status === "sent" && (!h.lastEmailAt || at > h.lastEmailAt)) h.lastEmailAt = at;
    out.set(j.user_id, h);
  }
  return out;
}

export async function evaluateAndEnqueue(db: Db, cfg: CampaignConfig, now = new Date()): Promise<EvaluateStats & { explain: Array<{ user_id: string; state: string; campaigns: Array<{ campaign: string; eligible: boolean; reason: string }> }> }> {
  const { data: rows, error } = await db.from("host_lifecycle_state").select("*");
  if (error) throw new Error(`read host_lifecycle_state: ${error.message}`);
  const history = await loadHistory(db);
  const stats: EvaluateStats = { hosts: 0, eligible: 0, enqueued: 0, alreadyQueued: 0, byCampaign: {}, reasons: {} };
  const explain: Array<{ user_id: string; state: string; campaigns: Array<{ campaign: string; eligible: boolean; reason: string }> }> = [];
  for (const r of (rows ?? []) as StateRow[]) {
    stats.hosts++;
    const input = { row: r, stateEnteredAt: r.state_entered_at, history: history.get(r.user_id) ?? { sent: {}, lastEmailAt: null }, now, config: cfg };
    const all = explainAll(input);
    for (const e of all) if (!e.eligible) stats.reasons[e.reason.replace(/\d+/g, "N")] = (stats.reasons[e.reason.replace(/\d+/g, "N")] ?? 0) + 1;
    explain.push({ user_id: r.user_id, state: r.lifecycle_state, campaigns: all });
    for (const e of eligibleCampaigns(input)) {
      stats.eligible++;
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
            idempotency_key: `${r.user_id}:${e.campaign}`,
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
