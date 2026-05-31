import { createFileRoute } from "@tanstack/react-router";
import { runListingSync } from "@/server/listing-sync.server";
import { authorizeHookRequest } from "@/server/hook-auth.server";

async function handle(request: Request) {
  const unauth = await authorizeHookRequest(request);
  if (unauth) return unauth;
  const result = await runListingSync();
  return new Response(JSON.stringify(result), {
    status: result.status === "success" ? 200 : 500,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/public/hooks/sync-listings")({
  server: {
    handlers: {
      POST: async ({ request }) => handle(request),
      GET: async ({ request }) => handle(request),
    },
  },
});
