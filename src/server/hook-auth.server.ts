/**
 * Shared auth helper for /api/public/hooks/* background-worker endpoints.
 *
 * These hooks trigger paid third-party API calls (Firecrawl, Lovable AI),
 * outbound email, and bulk DB writes. They must never be callable by an
 * unauthenticated visitor. They are normally invoked by pg_cron, which can
 * include the `x-admin-token` header.
 *
 * Token source: `HOOKS_ADMIN_TOKEN` env var (with `BACKFILL_ADMIN_TOKEN` and
 * `SUPABASE_SERVICE_ROLE_KEY` accepted as fallbacks for compatibility).
 */
export function authorizeHookRequest(request: Request): Response | null {
  const expected =
    process.env.HOOKS_ADMIN_TOKEN ||
    process.env.BACKFILL_ADMIN_TOKEN ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!expected) {
    return new Response(
      JSON.stringify({ error: "Server misconfigured: no hook admin token set" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const provided =
    request.headers.get("x-admin-token") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    new URL(request.url).searchParams.get("token");

  if (!provided || provided !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}
