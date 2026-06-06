import { createFileRoute, redirect } from "@tanstack/react-router";

// Canonical, memorable URL for the affiliate dashboard.
// The actual UI lives in /affiliate (kept for back-compat).
export const Route = createFileRoute("/referral/dashboard")({
  beforeLoad: () => {
    throw redirect({ to: "/affiliate" });
  },
});
