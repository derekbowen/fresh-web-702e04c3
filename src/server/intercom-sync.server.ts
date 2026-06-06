import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { upsertContact, findContactByEmail } from "@/lib/intercom.server";

type Audience = "host" | "renter";

interface Diff {
  email: string;
  action: "create" | "update" | "noop";
  intercom_id: string | null;
  changes: Record<string, { from: any; to: any }>;
}

interface SyncResult {
  considered: number;
  synced: number;
  failed: number;
  dryRun?: boolean;
  diffs?: Diff[];
}

// Set to `true` ONLY after the matching custom attributes have been created in
// Intercom (Settings → Data → People data). Until then we sync standard fields
// only (name, email, external_id) so Intercom doesn't 400 on every contact.
const SEND_CUSTOM_ATTRS = false;

function buildHostAttrs(r: any) {
  if (!SEND_CUSTOM_ATTRS) return undefined;
  return {
    prnm_audience: "host" as const,
    prnm_status: r.status,
    prnm_sharetribe_id: r.st_user_id ?? null,
  };
}

function buildRenterAttrs(r: any) {
  if (!SEND_CUSTOM_ATTRS) return undefined;
  return {
    prnm_audience: "renter" as const,
    prnm_status: r.status,
    prnm_city: r.city ?? null,
    prnm_state: r.state_code ?? null,
    prnm_sharetribe_id: r.st_user_id ?? null,
  };
}

function diffAttrs(
  proposed: Record<string, any>,
  existing: Record<string, any> | undefined,
): Record<string, { from: any; to: any }> {
  const out: Record<string, { from: any; to: any }> = {};
  for (const [k, v] of Object.entries(proposed)) {
    const cur = existing?.[k];
    // Treat null/undefined/empty-string as equivalent "absent"
    const a = cur === undefined || cur === "" ? null : cur;
    const b = v === undefined || v === "" ? null : v;
    if (a !== b) out[k] = { from: cur ?? null, to: v ?? null };
  }
  return out;
}

async function syncTable(
  audience: Audience,
  rows: any[],
  buildAttrs: (r: any) => Record<string, any>,
  table: "host_subscribers" | "renter_subscribers",
  dryRun: boolean,
): Promise<SyncResult> {
  if (rows.length === 0)
    return { considered: 0, synced: 0, failed: 0, dryRun, diffs: dryRun ? [] : undefined };

  let synced = 0, failed = 0;
  const diffs: Diff[] = [];

  for (const r of rows) {
    try {
      const proposed = buildAttrs(r);

      if (dryRun) {
        const existing = await findContactByEmail(r.email);
        const changes = diffAttrs(proposed, existing?.custom_attributes);
        // Name change?
        if (existing && r.name && existing.name !== r.name) {
          changes.name = { from: existing.name ?? null, to: r.name };
        }
        // external_id change?
        if (existing && r.st_user_id && existing.external_id !== r.st_user_id) {
          changes.external_id = { from: existing.external_id ?? null, to: r.st_user_id };
        }
        diffs.push({
          email: r.email,
          intercom_id: existing?.id ?? null,
          action: !existing ? "create" : Object.keys(changes).length === 0 ? "noop" : "update",
          changes,
        });
        await new Promise((res) => setTimeout(res, 120));
        continue;
      }

      const contact = await upsertContact({
        email: r.email,
        name: r.name,
        role: "lead",
        externalId: r.st_user_id ?? undefined,
        customAttributes: proposed,
      });
      await supabaseAdmin
        .from(table)
        .update({
          intercom_id: contact.id,
          intercom_synced_at: new Date().toISOString(),
        })
        .eq("id", r.id);
      synced++;
      await new Promise((res) => setTimeout(res, 120));
    } catch (err: any) {
      failed++;
      console.warn(`[intercom-sync ${audience}]`, r.email, err?.message);
    }
  }
  return {
    considered: rows.length,
    synced,
    failed,
    dryRun,
    diffs: dryRun ? diffs : undefined,
  };
}

export async function syncHostSubscribersToIntercom(
  limit = 100,
  opts: { dryRun?: boolean } = {},
): Promise<SyncResult> {
  const dryRun = !!opts.dryRun;
  let q = supabaseAdmin
    .from("host_subscribers")
    .select("id, email, name, status, st_user_id, intercom_id, intercom_synced_at, updated_at, created_at")
    .eq("status", "active");
  // In real mode only target unsynced; in dry-run include everyone so users can
  // preview attribute updates against contacts that already have intercom_id.
  if (!dryRun) q = q.is("intercom_id", null);
  const { data: rows } = await q.order("created_at", { ascending: false }).limit(limit);
  return syncTable("host", rows ?? [], buildHostAttrs, "host_subscribers", dryRun);
}

export async function syncRenterSubscribersToIntercom(
  limit = 100,
  opts: { dryRun?: boolean } = {},
): Promise<SyncResult> {
  const dryRun = !!opts.dryRun;
  let q = supabaseAdmin
    .from("renter_subscribers")
    .select("id, email, name, city, state_code, status, st_user_id, intercom_id, intercom_synced_at, updated_at, created_at")
    .eq("status", "active");
  if (!dryRun) q = q.is("intercom_id", null);
  const { data: rows } = await q.order("created_at", { ascending: false }).limit(limit);
  return syncTable("renter", rows ?? [], buildRenterAttrs, "renter_subscribers", dryRun);
}

export async function syncAllToIntercom(opts: { dryRun?: boolean; limit?: number } = {}): Promise<{
  dryRun: boolean;
  hosts: SyncResult;
  renters: SyncResult;
}> {
  const limit = opts.limit ?? 100;
  const hosts = await syncHostSubscribersToIntercom(limit, { dryRun: opts.dryRun });
  const renters = await syncRenterSubscribersToIntercom(limit, { dryRun: opts.dryRun });
  return { dryRun: !!opts.dryRun, hosts, renters };
}
