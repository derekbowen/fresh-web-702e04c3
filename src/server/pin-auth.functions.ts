import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// PIN-based admin sign-in. The PIN field on /auth is a hidden backdoor:
// if the user submits this PIN (email/password ignored), they get signed in
// as the designated admin account via a single-use magic-link OTP exchange.
//
// PIN and email are read from server-side env (ADMIN_PIN, ADMIN_EMAIL).
// If either env var is unset, the PIN sign-in is disabled.

export const pinSignIn = createServerFn({ method: "POST" })
  .inputValidator((data: { pin: string }) =>
    z.object({ pin: z.string().min(1).max(64) }).parse(data),
  )
  .handler(async ({ data }): Promise<{ ok: true; hashed_token: string; email: string } | { ok: false }> => {
    const ADMIN_PIN = process.env.ADMIN_PIN;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    if (!ADMIN_PIN || !ADMIN_EMAIL) return { ok: false };
    // Constant-time-ish compare to avoid trivial timing leaks on short PINs.
    if (data.pin.length !== ADMIN_PIN.length) return { ok: false };
    let diff = 0;
    for (let i = 0; i < ADMIN_PIN.length; i++) {
      diff |= data.pin.charCodeAt(i) ^ ADMIN_PIN.charCodeAt(i);
    }
    if (diff !== 0) return { ok: false };

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
