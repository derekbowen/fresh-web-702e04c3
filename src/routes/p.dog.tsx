import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/p/dog")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/dashboard", replace: true });
  },
  head: () => ({
    meta: [{ name: "robots", content: "noindex,nofollow" }],
  }),
  component: () => null,
});
