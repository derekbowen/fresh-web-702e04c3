import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/directory/$category/$state")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/p/pool-pros/c/$category/$state",
      params: { category: params.category, state: params.state.toLowerCase() },
      statusCode: 301,
      replace: true,
    });
  },
  component: () => null,
});
