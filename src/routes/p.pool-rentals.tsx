import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { BreadcrumbsWithSchema } from "@/components/breadcrumbs-jsonld";
import { buildMeta } from "@/lib/seo";
import { getAllStateHubs, type StateIndexEntry } from "@/server/state-hub.functions";

export const Route = createFileRoute("/p/pool-rentals")({
  loader: async (): Promise<{ states: StateIndexEntry[] }> => {
    const states = await getAllStateHubs();
    return { states };
  },
  head: () => {
    const meta = buildMeta({
      title: "Pool rentals by state — Browse all 50 states | Pool Rental Near Me",
      description:
        "Find private backyard pool rentals in every U.S. state. Browse 3,400+ cities across all 50 states and book a pool by the hour near you.",
      path: "/p/pool-rentals",
    });
    return { meta: meta.meta, links: meta.links };
  },
  errorComponent: () => (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-center">
        <h1 className="text-3xl font-bold">Something went wrong</h1>
      </main>
      <SiteFooter />
    </div>
  ),
  component: PoolRentalsIndex,
});

function PoolRentalsIndex() {
  const { states } = Route.useLoaderData();
  const totalCities = states.reduce((s, x) => s + x.cityCount, 0);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <BreadcrumbsWithSchema
          items={[
            { name: "Home", path: "/" },
            { name: "Pool rentals by state", path: "/p/pool-rentals" },
          ]}
        />

        <header className="mt-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Pool rentals by state
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Browse private backyard pool rentals across{" "}
            <strong className="text-foreground">{totalCities.toLocaleString()}</strong>{" "}
            cities in {states.length} states. Pick your state to see every city
            we cover.
          </p>
        </header>

        <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {states.map((s) => (
            <li key={s.stateCode}>
              <Link
                to="/p/pool-rentals-$state"
                params={{ state: s.citySlug }}
                className="group block rounded-md border border-border bg-card px-4 py-3 transition hover:border-primary"
              >
                <span className="block text-sm font-semibold text-foreground group-hover:text-primary">
                  {s.stateName}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {s.cityCount} {s.cityCount === 1 ? "city" : "cities"}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <aside className="mt-12 rounded-2xl border border-border bg-muted/30 p-6">
          <h2 className="text-xl font-semibold">Don't see your city?</h2>
          <p className="mt-2 text-muted-foreground">
            New cities get added every week. Search the marketplace directly or
            list your own pool to be the first host in your area.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="/s"
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              Search all pools
            </a>
            <a
              href="/l/draft/00000000-0000-0000-0000-000000000000/new/details"
              className="inline-flex items-center justify-center rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition hover:border-primary"
            >
              List your pool
            </a>
          </div>
        </aside>
      </main>
      <SiteFooter />
    </div>
  );
}
