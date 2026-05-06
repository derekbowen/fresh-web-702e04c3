import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/directory/$category/$state/$city")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/p/pool-pros/c/$category/$state/$city",
      params: {
        category: params.category,
        state: params.state.toLowerCase(),
        city: params.city.toLowerCase(),
      },
      statusCode: 301,
      replace: true,
    });
  },
  component: () => null,
});
