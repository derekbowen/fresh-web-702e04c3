import { createFileRoute } from "@tanstack/react-router";

// The "/" route on poolrentalnearme.com is served by Sharetribe via the
// reverse proxy. The fresh-web app should never render or redirect here —
// keeping this route as a no-op prevents a client-side redirect loop on
// the production domain.
export const Route = createFileRoute("/")({
  component: () => null,
});
