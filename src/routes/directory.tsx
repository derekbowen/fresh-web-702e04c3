import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy /directory URL — redirect to the proxied content path.
export const Route = createFileRoute("/directory")({
  beforeLoad: () => {
    throw redirect({ to: "/p/pool-pros", statusCode: 301 });
  },
  component: () => null,
});
