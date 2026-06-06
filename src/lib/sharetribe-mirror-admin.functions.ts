import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("forbidden");
}

export type STDashboard = {
  syncState: Array<{
    resource: string;
    last_synced_at: string | null;
    last_run_at: string | null;
    last_run_status: string | null;
    last_run_rows: number;
    last_run_error: string | null;
  }>;
  counts: {
    users: number;
    listings: number;
    transactions: number;
    messages: number;
    open_alerts: number;
  };
  funnel: {
    tx_with_messages: number;
    tx_confirmed: number;
    rate: number;
  };
  recent_transactions: Array<{
    sharetribe_id: string;
    last_transition: string | null;
    state: string | null;
    listing_title: string | null;
    payin_total_cents: number | null;
    currency: string | null;
    last_transitioned_at: string | null;
    provider_st_id: string | null;
    customer_st_id: string | null;
  }>;
  recent_messages: Array<{
    id: string;
    sharetribe_id: string;
    transaction_st_id: string | null;
    sender_st_id: string | null;
    content: string;
    created_at_st: string;
  }>;
  alerts: Array<{
    id: string;
    message_st_id: string;
    transaction_st_id: string | null;
    sender_st_id: string | null;
    category: string;
    severity: string;
    matched_terms: string[];
    snippet: string;
    status: string;
    created_at: string;
  }>;
};

export const getSharetribeDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<STDashboard> => {
    const { userId } = context as { userId: string };
    await assertAdmin(userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [usersC, listingsC, txC, msgsC, alertsC, sync, recentTx, recentMsg, alerts, txWithMsg, txConfirmed] =
      await Promise.all([
        supabaseAdmin.from("st_users").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("st_listings").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("st_transactions").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("st_messages").select("*", { count: "exact", head: true }),
        supabaseAdmin
          .from("st_security_alerts")
          .select("*", { count: "exact", head: true })
          .eq("status", "open"),
        supabaseAdmin
          .from("st_sync_state")
          .select("resource,last_synced_at,last_run_at,last_run_status,last_run_rows,last_run_error")
          .order("resource"),
        supabaseAdmin
          .from("st_transactions")
          .select(
            "sharetribe_id,last_transition,state,listing_title,payin_total_cents,currency,last_transitioned_at,provider_st_id,customer_st_id",
          )
          .order("last_transitioned_at", { ascending: false, nullsFirst: false })
          .limit(50),
        supabaseAdmin
          .from("st_messages")
          .select("id,sharetribe_id,transaction_st_id,sender_st_id,content,created_at_st")
          .order("created_at_st", { ascending: false })
          .limit(50),
        supabaseAdmin
          .from("st_security_alerts")
          .select(
            "id,message_st_id,transaction_st_id,sender_st_id,category,severity,matched_terms,snippet,status,created_at",
          )
          .order("created_at", { ascending: false })
          .limit(100),
        supabaseAdmin
          .from("st_transactions")
          .select("sharetribe_id", { count: "exact", head: true })
          .not("last_transition", "is", null),
        supabaseAdmin
          .from("st_transactions")
          .select("sharetribe_id", { count: "exact", head: true })
          .in("state", ["confirm-payment", "complete", "reviewed"]),
      ]);

    const total = txWithMsg.count || 0;
    const confirmed = txConfirmed.count || 0;
    return {
      syncState: sync.data || [],
      counts: {
        users: usersC.count || 0,
        listings: listingsC.count || 0,
        transactions: txC.count || 0,
        messages: msgsC.count || 0,
        open_alerts: alertsC.count || 0,
      },
      funnel: {
        tx_with_messages: total,
        tx_confirmed: confirmed,
        rate: total > 0 ? confirmed / total : 0,
      },
      recent_transactions: recentTx.data || [],
      recent_messages: recentMsg.data || [],
      alerts: alerts.data || [],
    };
  });

export const setAlertStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["open", "reviewed", "dismissed", "escalated"]),
        notes: z.string().max(1000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    const { userId } = context as { userId: string };
    await assertAdmin(userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("st_security_alerts")
      .update({
        status: data.status,
        notes: data.notes ?? null,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const triggerSharetribeSyncNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ ok: boolean; result?: any; error?: string }> => {
    const { userId } = context as { userId: string };
    await assertAdmin(userId);
    try {
      const { syncSharetribeMirror } = await import("@/server/sharetribe-mirror.server");
      const result = await syncSharetribeMirror();
      return { ok: true, result };
    } catch (e: any) {
      return { ok: false, error: e?.message || String(e) };
    }
  });
