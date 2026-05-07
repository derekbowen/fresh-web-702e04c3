import { createServerFn } from "@tanstack/react-start";
import jwt from "jsonwebtoken";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Returns the public Intercom workspace ID. Safe to call unauthenticated. */
export const getIntercomAppId = createServerFn({ method: "GET" }).handler(async () => {
  return { appId: process.env.INTERCOM_APP_ID ?? "" };
});

/**
 * Mints a short-lived Intercom Identity Verification JWT for the signed-in user.
 * Signed HS256 with INTERCOM_IDENTITY_SECRET (Intercom → Settings → Authentication
 * → Identity Verification → Web). Returns null if IV is not configured.
 */
export const getIntercomUserJwt = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const secret = process.env.INTERCOM_IDENTITY_SECRET;
    if (!secret) return { token: null as string | null };

    const { userId, claims } = context as {
      userId: string;
      claims: { email?: string } & Record<string, unknown>;
    };

    const token = jwt.sign(
      {
        user_id: userId,
        ...(claims.email ? { email: claims.email } : {}),
      },
      secret,
      { expiresIn: "1h", algorithm: "HS256" },
    );
    return { token };
  });
