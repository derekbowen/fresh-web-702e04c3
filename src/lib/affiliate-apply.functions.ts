import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ApplySchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  audience: z.string().trim().max(1000).optional().or(z.literal("")),
  promo_plan: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const applyAsAffiliate = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ApplySchema.parse(d))
  .handler(async ({ data }): Promise<{ ok: boolean; alreadyExists?: boolean; status?: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();

    const { data: existing } = await supabaseAdmin
      .from("affiliates")
      .select("id, status")
      .ilike("email", email)
      .maybeSingle();

    if (existing) return { ok: true, alreadyExists: true, status: existing.status as string };

    const { error } = await supabaseAdmin.from("affiliates").insert({
      full_name: data.full_name,
      email,
      phone: data.phone || null,
      audience: data.audience || null,
      promo_plan: data.promo_plan || null,
      status: "pending",
    });
    if (error) {
      console.error("[affiliate-apply] insert failed", error);
      return { ok: false };
    }
    return { ok: true };
  });
