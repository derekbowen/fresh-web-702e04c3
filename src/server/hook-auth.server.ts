/**
 * Shared auth helper for /api/public/hooks/* background-worker endpoints.
 *
 * Token sources accepted (any one match):
 *  - env: HOOKS_ADMIN_TOKEN, BACKFILL_ADMIN_TOKEN, SUPABASE_SERVICE_ROLE_KEY
 *  - vault: public.get_hooks_admin_token() (so pg_cron can call without env coordination)
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

let cachedVaultToken: string | null = null;
let cachedAt = 0;
const VAULT_TTL_MS = 5 * 60_000;

async function getVaultToken(): Promise<string | null> {
  if (cachedVaultToken && Date.now() - cachedAt < VAULT_TTL_MS) return cachedVaultToken;
  try {
    const { data, error } = await (supabaseAdmin as any).rpc("get_hooks_admin_token");
    if (error || !data) return null;
    cachedVaultToken = String(data);
    cachedAt = Date.now();
    return cachedVaultToken;
  } catch {
    return null;
  }
}

export async function authorizeHookRequest(request: Request): Promise<Response | null> {
  const envExpected =
    process.env.HOOKS_ADMIN_TOKEN ||
    process.env.BACKFILL_ADMIN_TOKEN ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  const provided =
    request.headers.get("x-admin-token") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    new URL(request.url).searchParams.get("token");

  if (!provided) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json" },
    });
  }

  if (envExpected && provided === envExpected) return null;

  const vaultToken = await getVaultToken();
  if (vaultToken && provided === vaultToken) return null;

  if (!envExpected && !vaultToken) {
    return new Response(
      JSON.stringify({ error: "Server misconfigured: no hook admin token set" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401, headers: { "Content-Type": "application/json" },
  });
}
