/**
 * Sync phase: rebuild host_lifecycle_state from Sharetribe, preserving
 * state_entered_at while the lifecycle state is unchanged, and cancel any
 * queued job whose campaign no longer applies (state overrides schedule).
 */
import { deriveState, isHostAccount, type HostLifecycleRow, type StBooking, type StListing, type StUser } from "../../../src/lib/host-lifecycle/state";
import { stillApplies, type CampaignKey } from "../../../src/lib/host-lifecycle/campaigns";
import type { Db } from "./db";

export interface SyncStats {
  users: number; hosts: number; listings: number; bookings: number;
  upserted: number; stateChanges: number; cancelledStale: number; byState: Record<string, number>;
}

export interface MarketplaceSnapshot { users: StUser[]; listings: StListing[]; bookings: StBooking[] }

export async function syncState(db: Db, snap: MarketplaceSnapshot, now = new Date()): Promise<SyncStats> {
  const byAuthor = new Map<string, StListing[]>();
  for (const l of snap.listings) {
    const arr = byAuthor.get(l.authorId) ?? []; arr.push(l); byAuthor.set(l.authorId, arr);
  }
  const { data: existing, error } = await db
    .from("host_lifecycle_state")
    .select("user_id, lifecycle_state, state_entered_at, published_at");
  if (error) throw new Error(`read host_lifecycle_state: ${error.message}`);
  const prev = new Map<string, { lifecycle_state: string; state_entered_at: string; published_at: string | null }>();
  for (const r of existing ?? []) prev.set(r.user_id, r);

  const rows: Array<HostLifecycleRow & { state_entered_at: string; published_at: string | null; last_synced_at: string; raw: unknown }> = [];
  const byState: Record<string, number> = {};
  let stateChanges = 0;
  const nowIso = now.toISOString();
  for (const u of snap.users) {
    const listings = byAuthor.get(u.id) ?? [];
    if (!isHostAccount(u, listings)) continue;
    const row = deriveState(u, listings, snap.bookings);
    const p = prev.get(u.id);
    const stateEnteredAt = p && p.lifecycle_state === row.lifecycle_state ? p.state_entered_at : nowIso;
    if (p && p.lifecycle_state !== row.lifecycle_state) stateChanges++;
    const publishedAt = p?.published_at ?? (row.listing_state === "published" ? nowIso : null);
    byState[row.lifecycle_state] = (byState[row.lifecycle_state] ?? 0) + 1;
    rows.push({ ...row, state_entered_at: stateEnteredAt, published_at: publishedAt, last_synced_at: nowIso, raw: null });
  }
  for (let i = 0; i < rows.length; i += 200) {
    const { error: upErr } = await db.from("host_lifecycle_state").upsert(rows.slice(i, i + 200), { onConflict: "user_id" });
    if (upErr) throw new Error(`upsert host_lifecycle_state: ${upErr.message}`);
  }

  // State overrides schedule: cancel queued jobs whose campaign no longer applies.
  const { data: queued } = await db
    .from("communication_jobs")
    .select("id, user_id, campaign_key")
    .eq("status", "queued");
  const rowsById = new Map(rows.map((r) => [r.user_id, r]));
  let cancelledStale = 0;
  for (const j of queued ?? []) {
    const r = rowsById.get(j.user_id);
    const verdict = r ? stillApplies(j.campaign_key as CampaignKey, r) : { ok: false, reason: "host no longer in sync (deleted, banned or not a host)" };
    if (!verdict.ok) {
      await db.from("communication_jobs").update({ status: "cancelled", suppressed_at: nowIso, suppressed_reason: `stale: ${verdict.reason}`, updated_at: nowIso }).eq("id", j.id);
      cancelledStale++;
    }
  }
  return { users: snap.users.length, hosts: rows.length, listings: snap.listings.length, bookings: snap.bookings.length, upserted: rows.length, stateChanges, cancelledStale, byState };
}
