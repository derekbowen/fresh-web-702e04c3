import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Canonical URL resolver for `/p/*` legacy nested paths.
 *
 * Sharetribe historically published pages under nested URLs such as
 * `/p/{parent_slug}/{child_slug}`. The canonical home for every content page
 * in fresh-web is `/p/{slug}` (single segment). This splat route catches any
 * multi-segment `/p/...` request, takes the LAST segment as the canonical
 * slug, and issues a 301 redirect — preventing duplicate-content indexing.
 *
 * Single-segment requests (`/p/{slug}`) are matched by `p.$slug.tsx` first
 * because TanStack Router prefers more specific routes over splats.
 */
export const Route = createFileRoute("/p/$")({
  beforeLoad: ({ params }) => {
    const splat = (params as { _splat?: string })._splat ?? "";
    const segments = splat.split("/").filter(Boolean);
    const canonicalSlug = segments[segments.length - 1];

    if (!canonicalSlug) {
      throw redirect({ to: "/", statusCode: 301, replace: true });
    }

    throw redirect({
      to: "/p/$slug",
      params: { slug: canonicalSlug },
      statusCode: 301,
      replace: true,
    });
  },
  component: () => null,
});
