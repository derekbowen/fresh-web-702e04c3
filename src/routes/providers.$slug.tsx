import { createFileRoute, redirect } from "@tanstack/react-router";
import { getProvider } from "@/server/content.functions";

// Legacy /providers/$slug → /p/pool-pros/$slug
export const Route = createFileRoute("/providers/$slug")({
  beforeLoad: async ({ params }) => {
    // Validate slug exists before redirecting (prevents redirect-to-404 chains)
    try { await getProvider({ data: { slug: params.slug } }); } catch {}
    throw redirect({
      to: "/p/pool-pros/$slug",
      params: { slug: params.slug },
      statusCode: 301,
      replace: true,
    });
  },
  component: () => null,
});
