import { createFileRoute } from "@tanstack/react-router";
import { listAllBuilders } from "@/server/builders.functions";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { BuildersFilter } from "@/components/builders-filter";
import { buildMeta, breadcrumbJsonLd, ldJsonScript } from "@/lib/seo";

export const Route = createFileRoute("/p/pool-pros")({
  loader: async () => {
    const { providers } = await listAllBuilders();
    return { providers };
  },
  head: ({ loaderData }) => {
    const total = loaderData?.providers?.length ?? 0;
    const meta = buildMeta({
      title: "Pool Pros Directory | Pool Rental Near Me",
      description:
        "Search pool builders, cleaners, and service pros across the US. Filter by service type, city, and rating.",
      path: "/p/pool-pros",
    });
    const crumbs = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Pool Pros", path: "/p/pool-pros" },
    ]);
    return { ...meta, scripts: [ldJsonScript(crumbs)] };
  },
  component: PoolProsPage,
});

function PoolProsPage() {
  const { providers } = Route.useLoaderData();
  const total = providers.length;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <header className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Directory</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Find a pool pro near you
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Browse {total.toLocaleString()}+ verified builders, cleaners, and service pros.
            Search by name, filter by service type or city.
          </p>
        </header>
        <div className="mt-10">
          <BuildersFilter providers={providers} showCityFilter />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
