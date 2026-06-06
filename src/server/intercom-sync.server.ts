import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { upsertContact } from "@/lib/intercom.server";

/**
 * Sync subscribers to Intercom as Contacts with custom attributes.
 * Run incrementally — only rows missing intercom_id or updated since last sync.
 */
export async function syncHostSubscribersToIntercom(limit = 100): Promise<{
  considered: number;
  synced: number;
  failed: number;
}> {
  const { data: rows } = await supabaseAdmin
    .from("host_subscribers")
    .select("id, email, name, status, st_user_id, intercom_id, intercom_synced_at, updated_at, created_at")
    .eq("status", "active")
    .is("intercom_id", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!rows || rows.length === 0) return { considered: 0, synced: 0, failed: 0 };

  let synced = 0, failed = 0;
  for (const r of rows) {
    try {
      const contact = await upsertContact({
        email: r.email,
        name: r.name,
        role: "lead",
        externalId: r.st_user_id ?? undefined,
        customAttributes: {
          prnm_audience: "host",
          prnm_status: r.status,
          prnm_sharetribe_id: r.st_user_id ?? null,
        },
      });
      await supabaseAdmin
        .from("host_subscribers")
        .update({
          intercom_id: contact.id,
          intercom_synced_at: new Date().toISOString(),
        })
        .eq("id", r.id);
      synced++;
      await new Promise((res) => setTimeout(res, 120)); // rate-limit pad
    } catch (err: any) {
      failed++;
      console.warn("[intercom-sync host]", r.email, err?.message);
    }
  }
  return { considered: rows.length, synced, failed };
}

export async function syncRenterSubscribersToIntercom(limit = 100): Promise<{
  considered: number;
  synced: number;
  failed: number;
}> {
  const { data: rows } = await supabaseAdmin
    .from("renter_subscribers")
    .select("id, email, name, city, state_code, status, st_user_id, intercom_id, intercom_synced_at, updated_at, created_at")
    .eq("status", "active")
    .is("intercom_id", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!rows || rows.length === 0) return { considered: 0, synced: 0, failed: 0 };

  let synced = 0, failed = 0;
  for (const r of rows) {
    try {
      const contact = await upsertContact({
        email: r.email,
        name: r.name,
        role: "lead",
        externalId: r.st_user_id ?? undefined,
        customAttributes: {
          prnm_audience: "renter",
          prnm_status: r.status,
          prnm_city: r.city ?? null,
          prnm_state: r.state_code ?? null,
          prnm_sharetribe_id: r.st_user_id ?? null,
        },
      });
      await supabaseAdmin
        .from("renter_subscribers")
        .update({
          intercom_id: contact.id,
          intercom_synced_at: new Date().toISOString(),
        })
        .eq("id", r.id);
      synced++;
      await new Promise((res) => setTimeout(res, 120));
    } catch (err: any) {
      failed++;
      console.warn("[intercom-sync renter]", r.email, err?.message);
    }
  }
  return { considered: rows.length, synced, failed };
}

export async function syncAllToIntercom(): Promise<{
  hosts: Awaited<ReturnType<typeof syncHostSubscribersToIntercom>>;
  renters: Awaited<ReturnType<typeof syncRenterSubscribersToIntercom>>;
}> {
  const hosts = await syncHostSubscribersToIntercom(100);
  const renters = await syncRenterSubscribersToIntercom(100);
  return { hosts, renters };
}
