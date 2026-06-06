import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CoachingLogEntry = {
  id: string;
  referral_id: string | null;
  note: string;
  template_used: string | null;
  created_at: string;
};

const InputSchema = z.object({
  referral_id: z.string().uuid().nullable().optional(),
  note: z.string().trim().min(1).max(2000),
  template_used: z.string().trim().max(64).nullable().optional(),
});

export const logCoachingActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true; id: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId } = context as { userId: string };

    const { data: aff } = await supabaseAdmin
      .from("affiliates")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!aff) throw new Error("Not an affiliate");

    // If referral_id given, validate it belongs to this affiliate
    if (data.referral_id) {
      const { data: ref } = await supabaseAdmin
        .from("affiliate_referrals")
        .select("id")
        .eq("id", data.referral_id)
        .eq("affiliate_id", aff.id)
        .maybeSingle();
      if (!ref) throw new Error("Referral not in your crew");
    }

    const { data: row, error } = await supabaseAdmin
      .from("affiliate_coaching_log")
      .insert({
        affiliate_id: aff.id,
        referral_id: data.referral_id || null,
        note: data.note,
        template_used: data.template_used || null,
      })
      .select("id")
      .single();
    if (error || !row) throw error || new Error("insert failed");
    return { ok: true, id: row.id };
  });

export const listMyCoachingLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ entries: CoachingLogEntry[] }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId } = context as { userId: string };
    const { data: aff } = await supabaseAdmin
      .from("affiliates")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!aff) return { entries: [] };
    const { data } = await supabaseAdmin
      .from("affiliate_coaching_log")
      .select("id,referral_id,note,template_used,created_at")
      .eq("affiliate_id", aff.id)
      .order("created_at", { ascending: false })
      .limit(200);
    return { entries: data || [] };
  });

export const listCoachingForAffiliate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ affiliate_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<{ entries: CoachingLogEntry[] }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId } = context as { userId: string };
    const { data: role } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("forbidden");
    const { data: rows } = await supabaseAdmin
      .from("affiliate_coaching_log")
      .select("id,referral_id,note,template_used,created_at")
      .eq("affiliate_id", data.affiliate_id)
      .order("created_at", { ascending: false })
      .limit(500);
    return { entries: rows || [] };
  });
