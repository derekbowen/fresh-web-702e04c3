import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DORMANT_DAYS = 60;
const LEAD_ACTIVE_HOSTS = 5;
const CAPTAIN_30D_GMV_CENTS = 1_000_000;

export type CrewHost = {
  id: string;
  display_name: string | null;
  email_seen: string | null;
  attributed_at: string;
  first_booking_at: string | null;
  last_booking_at: string | null;
  completed_bookings_count: number;
  activation_paid_at: string | null;
  recurring_unlocked_at: string | null;
  total_gross_cents: number;
  total_earned_cents: number;
  status: "new" | "warming" | "active" | "dormant"; // traffic light
};

export type AffiliateDashboard = {
  affiliate: {
    id: string;
    code: string;
    status: string;
    tier: "starter" | "lead" | "captain";
    full_name: string | null;
    email: string;
    payout_method: string | null;
    payout_details: Record<string, string>;
  } | null;
  totals: {
    clicks: number;
    referred_hosts: number;
    active_hosts: number;
    pending_cents: number;
    approved_cents: number;
    paid_cents: number;
    activation_bonus_cents: number;
    recurring_cents: number;
    gmv_30d_cents: number;
  };
  tier_progress: {
    next: "lead" | "captain" | null;
    active_hosts_current: number;
    active_hosts_required: number;
    gmv30_current_cents: number;
    gmv30_required_cents: number;
  };
  crew: CrewHost[];
  commissions: Array<{
    id: string;
    listing_title: string | null;
    booking_gross_cents: number;
    commission_cents: number;
    currency: string;
    booking_date: string;
    status: string;
    kind: "activation_bonus" | "recurring";
  }>;
  payouts: Array<{
    id: string;
    total_cents: number;
    method: string | null;
    reference: string | null;
    paid_at: string;
  }>;
};

function hostStatus(r: {
  completed_bookings_count: number;
  last_booking_at: string | null;
  recurring_unlocked_at: string | null;
}): CrewHost["status"] {
  const now = Date.now();
  if (r.last_booking_at) {
    const ageDays = (now - new Date(r.last_booking_at).getTime()) / 86400_000;
    if (ageDays > DORMANT_DAYS) return "dormant";
    if (r.recurring_unlocked_at) return "active";
    return "warming";
  }
  return "new";
}

export const getAffiliateDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AffiliateDashboard> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId } = context as { userId: string };

    const { data: aff } = await supabaseAdmin
      .from("affiliates")
      .select("id,code,status,tier,full_name,email,payout_method,payout_details")
      .eq("user_id", userId)
      .maybeSingle();

    const empty: AffiliateDashboard = {
      affiliate: aff
        ? {
            ...aff,
            tier: (aff.tier as any) || "starter",
            payout_details: (aff.payout_details ?? {}) as Record<string, string>,
          }
        : null,
      totals: {
        clicks: 0,
        referred_hosts: 0,
        active_hosts: 0,
        pending_cents: 0,
        approved_cents: 0,
        paid_cents: 0,
        activation_bonus_cents: 0,
        recurring_cents: 0,
        gmv_30d_cents: 0,
      },
      tier_progress: {
        next: "lead",
        active_hosts_current: 0,
        active_hosts_required: LEAD_ACTIVE_HOSTS,
        gmv30_current_cents: 0,
        gmv30_required_cents: CAPTAIN_30D_GMV_CENTS,
      },
      crew: [],
      commissions: [],
      payouts: [],
    };

    if (!aff) return empty;

    const since30 = new Date(Date.now() - 30 * 86400_000).toISOString();

    const [clicksRes, refsRes, commRes, paysRes] = await Promise.all([
      supabaseAdmin.from("affiliate_clicks").select("id", { count: "exact", head: true }).eq("affiliate_id", aff.id),
      supabaseAdmin
        .from("affiliate_referrals")
        .select(
          "id,display_name,email_seen,attributed_at,first_booking_at,last_booking_at,completed_bookings_count,activation_paid_at,recurring_unlocked_at,total_gross_cents",
        )
        .eq("affiliate_id", aff.id)
        .order("attributed_at", { ascending: false })
        .limit(200),
      supabaseAdmin
        .from("affiliate_commissions")
        .select("id,referral_id,listing_title,booking_gross_cents,commission_cents,currency,booking_date,status,kind")
        .eq("affiliate_id", aff.id)
        .order("booking_date", { ascending: false })
        .limit(500),
      supabaseAdmin
        .from("affiliate_payouts")
        .select("id,total_cents,method,reference,paid_at")
        .eq("affiliate_id", aff.id)
        .order("paid_at", { ascending: false })
        .limit(50),
    ]);

    const commissions = (commRes.data || []) as AffiliateDashboard["commissions"] & Array<{ referral_id: string }>;

    // Sum earned per referral
    const earnedByRef = new Map<string, number>();
    for (const c of commissions) {
      earnedByRef.set(c.referral_id, (earnedByRef.get(c.referral_id) || 0) + (c.commission_cents || 0));
    }

    const crew: CrewHost[] = (refsRes.data || []).map((r: any) => ({
      id: r.id,
      display_name: r.display_name,
      email_seen: r.email_seen,
      attributed_at: r.attributed_at,
      first_booking_at: r.first_booking_at,
      last_booking_at: r.last_booking_at,
      completed_bookings_count: r.completed_bookings_count ?? 0,
      activation_paid_at: r.activation_paid_at,
      recurring_unlocked_at: r.recurring_unlocked_at,
      total_gross_cents: r.total_gross_cents ?? 0,
      total_earned_cents: earnedByRef.get(r.id) || 0,
      status: hostStatus(r),
    }));

    const activeHosts = crew.filter((c) => c.status === "active").length;
    const gmv30 = commissions
      .filter((c) => c.booking_date >= since30 && c.kind === "recurring")
      .reduce((s, c) => s + (c.booking_gross_cents || 0), 0);

    const sum = (status: string) =>
      commissions.filter((c) => c.status === status).reduce((s, c) => s + (c.commission_cents || 0), 0);
    const sumKind = (k: "activation_bonus" | "recurring") =>
      commissions.filter((c) => c.kind === k).reduce((s, c) => s + (c.commission_cents || 0), 0);

    const tier = (aff.tier as "starter" | "lead" | "captain") || "starter";
    const nextTier: "lead" | "captain" | null =
      tier === "starter" ? "lead" : tier === "lead" ? "captain" : null;

    return {
      affiliate: {
        ...aff,
        tier,
        payout_details: (aff.payout_details ?? {}) as Record<string, string>,
      },
      totals: {
        clicks: clicksRes.count || 0,
        referred_hosts: crew.length,
        active_hosts: activeHosts,
        pending_cents: sum("pending"),
        approved_cents: sum("approved"),
        paid_cents: sum("paid"),
        activation_bonus_cents: sumKind("activation_bonus"),
        recurring_cents: sumKind("recurring"),
        gmv_30d_cents: gmv30,
      },
      tier_progress: {
        next: nextTier,
        active_hosts_current: activeHosts,
        active_hosts_required: LEAD_ACTIVE_HOSTS,
        gmv30_current_cents: gmv30,
        gmv30_required_cents: CAPTAIN_30D_GMV_CENTS,
      },
      crew,
      commissions: commissions.map((c) => ({
        id: c.id,
        listing_title: c.listing_title,
        booking_gross_cents: c.booking_gross_cents,
        commission_cents: c.commission_cents,
        currency: c.currency,
        booking_date: c.booking_date,
        status: c.status,
        kind: c.kind,
      })),
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
