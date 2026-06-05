import { createFileRoute } from "@tanstack/react-router";
import { authorizeHookRequest } from "@/server/hook-auth.server";
import { pollSharetribeHosts } from "@/server/host-drip.server";

async function run(request: Request) {
  const unauth = await authorizeHookRequest(request);
  if (unauth) return unauth;
  try {
    const out = await pollSharetribeHosts();
    return new Response(JSON.stringify({ ok: true, ...out }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ ok: false, error: e?.message || String(e) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

export const Route = createFileRoute("/api/public/hooks/poll-sharetribe-hosts")({
  server: {
    handlers: {
      GET: async ({ request }) => run(request),
      POST: async ({ request }) => run(request),
    },
  },
});
