import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AffiliateDashboard = {
  affiliate: {
    id: string;
    code: string;
    status: string;
    full_name: string | null;
    email: string;
    payout_method: string | null;
    payout_details: Record<string, string>;
  } | null;
  totals: {
    clicks: number;
    referred_hosts: number;
    pending_cents: number;
    approved_cents: number;
    paid_cents: number;
  };
  referrals: Array<{
    id: string;
    display_name: string | null;
    email_seen: string | null;
    attributed_at: string;
    first_booking_at: string | null;
  }>;
  commissions: Array<{
    id: string;
    listing_title: string | null;
    booking_gross_cents: number;
    commission_cents: number;
    currency: string;
    booking_date: string;
    status: string;
  }>;
  payouts: Array<{
    id: string;
    total_cents: number;
    method: string | null;
    reference: string | null;
    paid_at: string;
  }>;
};

export const getAffiliateDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AffiliateDashboard> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId } = context as { userId: string };

    const { data: aff } = await supabaseAdmin
      .from("affiliates")
      .select("id,code,status,full_name,email,payout_method,payout_details")
      .eq("user_id", userId)
      .maybeSingle();

    const empty = {
      affiliate: aff
        ? {
            ...aff,
            payout_details: (aff.payout_details ?? {}) as Record<string, string>,
          }
        : null,
      totals: { clicks: 0, referred_hosts: 0, pending_cents: 0, approved_cents: 0, paid_cents: 0 },
      referrals: [],
      commissions: [],
      payouts: [],
    } as AffiliateDashboard;

    if (!aff) return empty;

    const [clicksRes, refsRes, commRes, paysRes] = await Promise.all([
      supabaseAdmin.from("affiliate_clicks").select("id", { count: "exact", head: true }).eq("affiliate_id", aff.id),
      supabaseAdmin
        .from("affiliate_referrals")
        .select("id,display_name,email_seen,attributed_at,first_booking_at")
        .eq("affiliate_id", aff.id)
        .order("attributed_at", { ascending: false })
        .limit(100),
      supabaseAdmin
        .from("affiliate_commissions")
        .select("id,listing_title,booking_gross_cents,commission_cents,currency,booking_date,status")
        .eq("affiliate_id", aff.id)
        .order("booking_date", { ascending: false })
        .limit(200),
      supabaseAdmin
        .from("affiliate_payouts")
        .select("id,total_cents,method,reference,paid_at")
        .eq("affiliate_id", aff.id)
        .order("paid_at", { ascending: false })
        .limit(50),
    ]);

    const commissions = commRes.data || [];
    const totals = {
      clicks: clicksRes.count || 0,
      referred_hosts: refsRes.data?.length || 0,
      pending_cents: commissions.filter((c) => c.status === "pending").reduce((s, c) => s + (c.commission_cents || 0), 0),
      approved_cents: commissions.filter((c) => c.status === "approved").reduce((s, c) => s + (c.commission_cents || 0), 0),
      paid_cents: commissions.filter((c) => c.status === "paid").reduce((s, c) => s + (c.commission_cents || 0), 0),
    };

    return {
      affiliate: { ...aff, payout_details: (aff.payout_details ?? {}) as Record<string, string> },
      totals,
      referrals: refsRes.data || [],
      commissions,
      payouts: paysRes.data || [],
    };
  });

const PayoutMethodSchema = z.object({
  payout_method: z.enum(["paypal", "venmo", "ach", "check"]),
  payout_details: z.record(z.string(), z.string().max(500)),
});

export const updateMyPayoutMethod = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PayoutMethodSchema.parse(d))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId } = context as { userId: string };
    const { error } = await supabaseAdmin
      .from("affiliates")
      .update({ payout_method: data.payout_method, payout_details: data.payout_details })
      .eq("user_id", userId);
    if (error) {
      console.error("[affiliate-payout-method] failed", error);
      return { ok: false };
    }
    return { ok: true };
  });
