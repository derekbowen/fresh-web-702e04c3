import { createFileRoute } from "@tanstack/react-router";
import { runListingSync } from "@/server/listing-sync.server";

export const Route = createFileRoute("/api/public/hooks/sync-listings")({
  server: {
    handlers: {
      POST: async () => {
        const result = await runListingSync();
        return new Response(JSON.stringify(result), {
          status: result.status === "success" ? 200 : 500,
          headers: { "Content-Type": "application/json" },
        });
      },
      GET: async () => {
        // Allow manual trigger via browser/curl
        const result = await runListingSync();
        return new Response(JSON.stringify(result), {
          status: result.status === "success" ? 200 : 500,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
