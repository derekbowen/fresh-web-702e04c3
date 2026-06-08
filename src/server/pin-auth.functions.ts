import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// PIN-based admin sign-in. The PIN field on /auth is a hidden backdoor:
// if the user submits this PIN (email/password ignored), they get signed in
// as the designated admin account via a single-use magic-link OTP exchange.
//
// Bind: derekbowencorp@gmail.com (admin role verified in DB).
const ADMIN_PIN = "608400";
const ADMIN_EMAIL = "derekbowencorp@gmail.com";

export const pinSignIn = createServerFn({ method: "POST" })
  .inputValidator((data: { pin: string }) =>
    z.object({ pin: z.string().min(1).max(32) }).parse(data),
  )
  .handler(async ({ data }): Promise<{ ok: true; hashed_token: string; email: string } | { ok: false }> => {
    if (data.pin !== ADMIN_PIN) return { ok: false };

    const { data: link, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: ADMIN_EMAIL,
    });
    if (error || !link?.properties?.hashed_token) {
      console.error("[pin-auth] generateLink failed", error);
      return { ok: false };
    }
    return { ok: true, hashed_token: link.properties.hashed_token, email: ADMIN_EMAIL };
  });
