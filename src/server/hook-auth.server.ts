/**
 * Shared auth helper for /api/public/hooks/* background-worker endpoints.
 *
 * Token sources accepted (any one match):
 *  - env: HOOKS_ADMIN_TOKEN, BACKFILL_ADMIN_TOKEN, SUPABASE_SERVICE_ROLE_KEY
 *  - vault: public.get_hooks_admin_token() (refreshed in background; lets pg_cron
 *    authenticate without env-var coordination)
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

let vaultToken: string | null = null;
let lastFetch = 0;
let inflight: Promise<void> | null = null;
const TTL_MS = 5 * 60_000;

function refreshVaultToken(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const { data } = await (supabaseAdmin as any).rpc("get_hooks_admin_token");
      if (data) {
        vaultToken = String(data);
        lastFetch = Date.now();
      }
    } catch {
      // ignore
    } finally {
      inflight = null;
    }
  })();
  return inflight;
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

  // Kick off background refresh if cache is stale
  if (Date.now() - lastFetch > TTL_MS) refreshVaultToken();

  if (!provided) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json" },
    });
  }

  if (envExpected && provided === envExpected) return null;
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

// Warm the cache at module load
refreshVaultToken();
