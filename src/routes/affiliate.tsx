import { createFileRoute, redirect } from "@tanstack/react-router";

// Back-compat: old dashboard URL → new canonical URL.
export const Route = createFileRoute("/affiliate")({
  beforeLoad: () => {
    throw redirect({ to: "/p/affiliate-dashboard" });
  },
});
