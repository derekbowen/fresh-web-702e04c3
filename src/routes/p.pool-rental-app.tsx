import { createFileRoute, redirect } from "@tanstack/react-router";

// The native app is being deprecated (Phase 4): this former app-download
// landing page now sends visitors to the live web experience. The App Store /
// Play Store listings themselves stay up for organic store search until the
// formal deprecation call.
export const Route = createFileRoute("/p/pool-rental-app")({
  beforeLoad: () => {
    throw redirect({ to: "/", statusCode: 301 });
  },
});
