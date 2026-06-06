/**
 * Recompute an affiliate's tier based on crew activity.
 *
 * Tiers (titles only — they don't change commission rates; per-host milestones
 * drive payouts):
 *   - starter:  default
 *   - lead:     5+ active hosts (3+ completed bookings AND last booking within 60d)
 *   - captain:  lead's crew has $10K+ gross bookings in the last 30 days
 *
 * If affiliates.tier_override is true, this fn is a no-op (admin pinned tier).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const LEAD_ACTIVE_HOSTS = 5;
const CAPTAIN_30D_GMV_CENTS = 1_000_000; // $10,000
const ACTIVE_WINDOW_DAYS = 60;

export type AffiliateTier = "starter" | "lead" | "captain";

export async function recomputeAffiliateTier(affiliateId: string): Promise<AffiliateTier> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: aff } = await supabaseAdmin
    .from("affiliates")
    .select("id,tier,tier_override")
    .eq("id", affiliateId)
    .maybeSingle();
  if (!aff) return "starter";
  if (aff.tier_override) return aff.tier as AffiliateTier;

  const activeCutoff = new Date(Date.now() - ACTIVE_WINDOW_DAYS * 86400_000).toISOString();
  const { data: refs } = await supabaseAdmin
    .from("affiliate_referrals")
    .select("id,completed_bookings_count,last_booking_at,total_gross_cents")
    .eq("affiliate_id", affiliateId);

  const activeHosts = (refs || []).filter(
    (r) => (r.completed_bookings_count ?? 0) >= 3 && r.last_booking_at && r.last_booking_at >= activeCutoff,
  ).length;

  // 30-day GMV via commissions sum (more accurate than referral totals).
  const since30 = new Date(Date.now() - 30 * 86400_000).toISOString();
  const { data: recent } = await supabaseAdmin
    .from("affiliate_commissions")
    .select("booking_gross_cents,kind")
    .eq("affiliate_id", affiliateId)
    .eq("kind", "recurring")
    .gte("booking_date", since30);
  const gmv30 = (recent || []).reduce((s, c) => s + (c.booking_gross_cents || 0), 0);

  let newTier: AffiliateTier = "starter";
  if (activeHosts >= LEAD_ACTIVE_HOSTS) newTier = "lead";
  if (newTier === "lead" && gmv30 >= CAPTAIN_30D_GMV_CENTS) newTier = "captain";

  if (newTier !== aff.tier) {
    await supabaseAdmin
      .from("affiliates")
      .update({ tier: newTier, tier_set_at: new Date().toISOString() })
      .eq("id", affiliateId);
  }
  return newTier;
}

/** Admin-only manual tier override. Pins tier so auto-recompute won't touch it. */
export const setAffiliateTierOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        affiliate_id: z.string().uuid(),
        tier: z.enum(["starter", "lead", "captain"]),
        override: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<{ ok: true; tier: AffiliateTier }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId } = context as { userId: string };
    const { data: role } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("forbidden");

    await supabaseAdmin
      .from("affiliates")
      .update({ tier: data.tier, tier_override: data.override, tier_set_at: new Date().toISOString() })
      .eq("id", data.affiliate_id);

    if (!data.override) {
      const recomputed = await recomputeAffiliateTier(data.affiliate_id);
      return { ok: true, tier: recomputed };
    }
    return { ok: true, tier: data.tier };
  });
