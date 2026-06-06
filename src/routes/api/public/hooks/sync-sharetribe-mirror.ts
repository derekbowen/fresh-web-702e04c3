import { createFileRoute } from "@tanstack/react-router";
import { authorizeHookRequest } from "@/server/hook-auth.server";
import { syncSharetribeMirror } from "@/server/sharetribe-mirror.server";

async function run(request: Request) {
  const unauth = await authorizeHookRequest(request);
  if (unauth) return unauth;
  try {
    const result = await syncSharetribeMirror();
    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[sync-sharetribe-mirror]", e);
    return new Response(
      JSON.stringify({ ok: false, error: e?.message || String(e) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

export const Route = createFileRoute("/api/public/hooks/sync-sharetribe-mirror")({
  server: {
    handlers: {
      GET: async ({ request }) => run(request),
      POST: async ({ request }) => run(request),
    },
  },
});
