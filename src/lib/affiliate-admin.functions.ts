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

export type AdminAffiliateRow = {
  id: string;
  code: string;
  full_name: string | null;
  email: string;
  status: string;
  tier: "starter" | "lead" | "captain";
  tier_override: boolean;
  user_id: string | null;
  created_at: string;
  referral_count: number;
  active_host_count: number;
  gmv_30d_cents: number;
  pending_cents: number;
  approved_cents: number;
  paid_cents: number;
};

export const listAffiliatesAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        status: z.enum(["all", "pending", "approved", "rejected", "paused"]).optional(),
        sort: z.enum(["recent", "gmv_30d", "approved_cents"]).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }): Promise<{ rows: AdminAffiliateRow[] }> => {
    const { userId } = context as { userId: string };
    await assertAdmin(userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let q = supabaseAdmin
      .from("affiliates")
      .select("id,code,full_name,email,status,tier,tier_override,user_id,created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    const { data: affs, error } = await q;
    if (error) throw error;

    const ids = (affs || []).map((a) => a.id);
    const since30 = new Date(Date.now() - 30 * 86400_000).toISOString();
    const activeCutoff = new Date(Date.now() - 60 * 86400_000).toISOString();

    const [refsAgg, commAgg] = await Promise.all([
      ids.length
        ? supabaseAdmin
            .from("affiliate_referrals")
            .select("affiliate_id,completed_bookings_count,last_booking_at")
            .in("affiliate_id", ids)
        : Promise.resolve({ data: [] } as any),
      ids.length
        ? supabaseAdmin
            .from("affiliate_commissions")
            .select("affiliate_id,commission_cents,booking_gross_cents,status,kind,booking_date")
            .in("affiliate_id", ids)
        : Promise.resolve({ data: [] } as any),
    ]);

    const refCounts = new Map<string, number>();
    const activeCounts = new Map<string, number>();
    for (const r of (refsAgg.data || []) as Array<{
      affiliate_id: string;
      completed_bookings_count: number | null;
      last_booking_at: string | null;
    }>) {
      refCounts.set(r.affiliate_id, (refCounts.get(r.affiliate_id) || 0) + 1);
      if ((r.completed_bookings_count ?? 0) >= 3 && r.last_booking_at && r.last_booking_at >= activeCutoff) {
        activeCounts.set(r.affiliate_id, (activeCounts.get(r.affiliate_id) || 0) + 1);
      }
    }
    const totals = new Map<string, { p: number; a: number; pd: number; gmv30: number }>();
    for (const c of (commAgg.data || []) as Array<{
      affiliate_id: string;
      commission_cents: number;
      booking_gross_cents: number;
      status: string;
      kind: string;
      booking_date: string;
    }>) {
      const t = totals.get(c.affiliate_id) || { p: 0, a: 0, pd: 0, gmv30: 0 };
      if (c.status === "pending") t.p += c.commission_cents;
      else if (c.status === "approved") t.a += c.commission_cents;
      else if (c.status === "paid") t.pd += c.commission_cents;
      if (c.kind === "recurring" && c.booking_date >= since30) t.gmv30 += c.booking_gross_cents || 0;
      totals.set(c.affiliate_id, t);
    }

    const rows: AdminAffiliateRow[] = (affs || []).map((a) => {
      const t = totals.get(a.id) || { p: 0, a: 0, pd: 0, gmv30: 0 };
      return {
        ...a,
        tier: (a.tier as any) || "starter",
        tier_override: !!a.tier_override,
        referral_count: refCounts.get(a.id) || 0,
        active_host_count: activeCounts.get(a.id) || 0,
        gmv_30d_cents: t.gmv30,
        pending_cents: t.p,
        approved_cents: t.a,
        paid_cents: t.pd,
      };
    });

    if (data.sort === "gmv_30d") rows.sort((a, b) => b.gmv_30d_cents - a.gmv_30d_cents);
    else if (data.sort === "approved_cents") rows.sort((a, b) => b.approved_cents - a.approved_cents);

    return { rows };
  });


export const setAffiliateStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "approved", "rejected", "paused"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    const { userId } = context as { userId: string };
    await assertAdmin(userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch = {
      status: data.status,
      ...(data.status === "approved"
        ? { approved_at: new Date().toISOString(), approved_by: userId }
        : {}),
    };
    const { error } = await supabaseAdmin.from("affiliates").update(patch).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const linkHostToAffiliate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        affiliate_id: z.string().uuid(),
        sharetribe_user_id: z.string().trim().min(1).max(64),
        email_seen: z.string().email().max(255).optional().or(z.literal("")),
        display_name: z.string().trim().max(255).optional().or(z.literal("")),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    const { userId } = context as { userId: string };
    await assertAdmin(userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("affiliate_referrals").upsert(
      {
        affiliate_id: data.affiliate_id,
        sharetribe_user_id: data.sharetribe_user_id,
        email_seen: data.email_seen || null,
        display_name: data.display_name || null,
        attribution_source: "manual_admin",
      },
      { onConflict: "sharetribe_user_id" },
    );
    if (error) throw error;
    return { ok: true };
  });

export const createAffiliatePayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        affiliate_id: z.string().uuid(),
        method: z.string().trim().max(40),
        reference: z.string().trim().max(255).optional().or(z.literal("")),
        notes: z.string().trim().max(1000).optional().or(z.literal("")),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<{ ok: boolean; payout_id?: string; total_cents?: number; count?: number }> => {
    const { userId } = context as { userId: string };
    await assertAdmin(userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: pending } = await supabaseAdmin
      .from("affiliate_commissions")
      .select("id,commission_cents,booking_date")
      .eq("affiliate_id", data.affiliate_id)
      .eq("status", "approved");
    const list = pending || [];
    if (!list.length) return { ok: true, count: 0, total_cents: 0 };

    const total = list.reduce((s, c) => s + (c.commission_cents || 0), 0);
    const dates = list.map((c) => c.booking_date).sort();
    const period_start = dates[0]?.slice(0, 10) ?? null;
    const period_end = dates[dates.length - 1]?.slice(0, 10) ?? null;

    const { data: payout, error: payErr } = await supabaseAdmin
      .from("affiliate_payouts")
      .insert({
        affiliate_id: data.affiliate_id,
        method: data.method,
        reference: data.reference || null,
        notes: data.notes || null,
        total_cents: total,
        period_start,
        period_end,
        paid_by: userId,
      })
      .select("id")
      .single();
    if (payErr || !payout) throw payErr || new Error("payout insert failed");

    const ids = list.map((c) => c.id);
    const { error: updErr } = await supabaseAdmin
      .from("affiliate_commissions")
      .update({ status: "paid", payout_id: payout.id })
      .in("id", ids);
    if (updErr) throw updErr;

    return { ok: true, payout_id: payout.id, total_cents: total, count: list.length };
  });

export const reverseCommission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    const { userId } = context as { userId: string };
    await assertAdmin(userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("affiliate_commissions")
      .update({ status: "reversed" })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
