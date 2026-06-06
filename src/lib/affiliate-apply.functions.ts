import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ApplySchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  audience: z.string().trim().max(1000).optional().or(z.literal("")),
  promo_plan: z.string().trim().max(2000).optional().or(z.literal("")),
});

/**
 * Magic-link affiliate signup.
 * - Creates (or finds) the Supabase auth user with NO password.
 * - Inserts an `affiliates` row pre-linked to the user.
 * - The client then calls supabase.auth.signInWithOtp() to email the magic link.
 */
export const applyAsAffiliate = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ApplySchema.parse(d))
  .handler(async ({ data }): Promise<{
    ok: boolean;
    accountCreated?: boolean;
    alreadyExists?: boolean;
    status?: string;
    error?: string;
  }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();

    // 1) Ensure passwordless auth user exists
    let authUserId: string | null = null;
    let accountCreated = false;

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true, // skip email verification — magic link is the verification
      user_metadata: { full_name: data.full_name },
    });

    if (created?.user) {
      authUserId = created.user.id;
      accountCreated = true;
    } else if (createErr) {
      const msg = createErr.message || "";
      const exists =
        /already|exists|registered/i.test(msg) || (createErr as any)?.status === 422;
      if (!exists) {
        console.error("[affiliate-apply] createUser failed", createErr);
        return { ok: false, error: "Could not create account. Try again." };
      }
      // Existing user — look them up
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const match = list?.users?.find((u) => (u.email || "").toLowerCase() === email);
      authUserId = match?.id ?? null;
    }

    // 2) Check existing affiliate row
    const { data: existing } = await supabaseAdmin
      .from("affiliates")
      .select("id, status, user_id")
      .ilike("email", email)
      .maybeSingle();

    if (existing) {
      if (!existing.user_id && authUserId) {
        await supabaseAdmin
          .from("affiliates")
          .update({ user_id: authUserId })
          .eq("id", existing.id);
      }
      return {
        ok: true,
        alreadyExists: true,
        accountCreated,
        status: existing.status as string,
      };
    }

    // 3) Insert affiliate record, pre-linked to auth user
    const { error: insErr } = await supabaseAdmin.from("affiliates").insert({
      full_name: data.full_name,
      email,
      phone: data.phone || null,
      audience: data.audience || null,
      promo_plan: data.promo_plan || null,
      status: "pending",
      user_id: authUserId,
    });
    if (insErr) {
      console.error("[affiliate-apply] insert failed", insErr);
      return { ok: false, error: "Could not save application." };
    }
    return { ok: true, accountCreated };
  });
