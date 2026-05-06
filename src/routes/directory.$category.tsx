import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy /directory/$category → /p/pool-pros/c/$category
export const Route = createFileRoute("/directory/$category")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/p/pool-pros/c/$category",
      params: { category: params.category },
      statusCode: 301,
      replace: true,
    });
  },
  component: () => null,
});
