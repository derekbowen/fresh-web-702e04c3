import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { BreadcrumbsWithSchema } from "@/components/breadcrumbs-jsonld";
import { buildMeta } from "@/lib/seo";
import { getStateHub } from "@/server/state-hub.functions";

export const Route = createFileRoute("/p/pool-rentals-$state")({
  loader: async ({ params }) => {
    const data = await getStateHub({ data: { state: params.state } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [], links: [] };
    const { stateName, cities } = loaderData;
    const title = `Pool rentals in ${stateName} — ${cities.length} cities | Pool Rental Near Me`;
    const description = `Browse private backyard pool rentals across ${cities.length} cities in ${stateName}. Book by the hour, $40–150/hour typical, with $2M liability insurance included.`;
    const stateSlug = stateName.toLowerCase().replace(/\s+/g, "-");
    const meta = buildMeta({
      title,
      description,
      path: `/p/pool-rentals-${stateSlug}`,
    });
    return { meta: meta.meta, links: meta.links };
  },
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-center">
        <h1 className="text-3xl font-bold">State not found</h1>
        <p className="mt-4 text-muted-foreground">
          We don't have a hub page for that state yet.
        </p>
        <Link to="/p/pool-rentals" className="mt-6 inline-block text-primary hover:underline">
          Browse all states →
        </Link>
      </main>
      <SiteFooter />
    </div>
  ),
  errorComponent: () => (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-center">
        <h1 className="text-3xl font-bold">Something went wrong</h1>
        <p className="mt-4 text-muted-foreground">Please try again in a moment.</p>
      </main>
      <SiteFooter />
    </div>
  ),
  component: StateHubPage,
});

function StateHubPage() {
  const { stateName, stateCode, cities } = Route.useLoaderData();

  // Group cities alphabetically into A, B, C... buckets for scannability.
  type City = (typeof cities)[number];
  const buckets = new Map<string, City[]>();
  for (const c of cities) {
    const letter = (c.cityName[0] ?? "#").toUpperCase();
    const key = /[A-Z]/.test(letter) ? letter : "#";
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(c);
  }
  const letters = [...buckets.keys()].sort();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <BreadcrumbsWithSchema
          items={[
            { name: "Home", path: "/" },
            { name: "Pool rentals by state", path: "/p/pool-rentals" },
            { name: stateName, path: `/p/pool-rentals-${stateName.toLowerCase().replace(/\s+/g, "-")}` },
          ]}
        />

        <header className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            {stateCode}
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Pool rentals in {stateName}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Browse private backyard pool rentals across{" "}
            <strong className="text-foreground">{cities.length}</strong>{" "}
            {stateName} cities. Book by the hour, $40–150/hour typical, with $2M
            liability insurance included on every booking.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={`/s?address=${encodeURIComponent(stateName)}`}
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              Find a pool in {stateName}
            </a>
            <a
              href="/l/draft/00000000-0000-0000-0000-000000000000/new/details"
              className="inline-flex items-center justify-center rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary"
            >
              List your pool
            </a>
          </div>
        </header>

        {/* Letter jump nav */}
        {letters.length > 1 && (
          <nav aria-label="Jump to letter" className="mt-10 flex flex-wrap gap-2">
            {letters.map((l) => (
              <a
                key={l}
                href={`#letter-${l}`}
                className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
              >
                {l}
              </a>
            ))}
          </nav>
        )}

        {/* Cities */}
        <section className="mt-10">
          {letters.map((letter) => (
            <div key={letter} id={`letter-${letter}`} className="scroll-mt-24 border-b border-border py-6 last:border-b-0">
              <h2 className="text-2xl font-bold tracking-tight">{letter}</h2>
              <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {buckets.get(letter)!.map((c) => (
                  <li key={c.citySlug} className="leading-snug">
                    <Link
                      to="/p/$slug"
                      params={{ slug: c.pageSlug }}
                      className="block truncate text-sm text-foreground hover:text-primary hover:underline"
                      title={`${c.cityName}, ${stateCode}`}
                    >
                      {c.cityName}, {stateCode}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <aside className="mt-12 rounded-2xl border border-border bg-muted/30 p-6">
          <h2 className="text-xl font-semibold">Want to host?</h2>
          <p className="mt-2 text-muted-foreground">
            Pool owners in {stateName} typically earn $3,000–$10,000 per month
            renting their backyard pool. You keep 90%, we charge a flat 10% host
            fee, and every booking includes $2M liability coverage.
          </p>
          <a
            href="/l/draft/00000000-0000-0000-0000-000000000000/new/details"
            className="mt-5 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            Get started in {stateName}
          </a>
        </aside>

        <p className="mt-10 text-center text-sm">
          <Link to="/p/pool-rentals" className="text-primary hover:underline">
            ← Browse pool rentals in all 50 states
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
