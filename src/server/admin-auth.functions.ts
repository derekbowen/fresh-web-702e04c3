import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Admin role check by verified-email allowlist.
 * The previous version queried `user_roles` via supabaseAdmin, but this deploy
 * only holds the ANON key in SUPABASE_SERVICE_ROLE_KEY (the live Supabase project
 * is externally managed; its real service-role key is unavailable), so RLS blocked
 * the query and isAdmin was always false. The email below comes from the
 * cryptographically-verified JWT (requireSupabaseAuth), so it is trustworthy.
 * Restore the user_roles lookup once we control the Supabase project.
 */
function getAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS || "";
  return new Set(
    raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
  );
}

export const checkAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ isAdmin: boolean }> => {
    const ctx = context as { claims?: { email?: string }; supabase?: any };
    let email = (ctx.claims?.email ?? "").toLowerCase();
    if (!email && ctx.supabase) {
      try {
        const { data } = await ctx.supabase.auth.getUser();
        email = (data?.user?.email ?? "").toLowerCase();
      } catch {}
    }
    return { isAdmin: getAdminEmails().has(email) };
  });