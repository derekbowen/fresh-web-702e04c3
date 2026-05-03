import { createFileRoute, Link } from "@tanstack/react-router";
import { listBuilderStates, listAllBuilders } from "@/server/builders.functions";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { JoinNetworkForm } from "@/components/recruit-forms";
import { BuildersFilter, type BuilderRow } from "@/components/builders-filter";
import { buildMeta, breadcrumbJsonLd, itemListJsonLd, ldJsonScript } from "@/lib/seo";

export const Route = createFileRoute("/pool-builders/")({
  loader: async () => {
    const [states, all] = await Promise.all([listBuilderStates(), listAllBuilders()]);
    return { ...states, ...all };
  },
  head: ({ loaderData }) => {
    const total = (loaderData?.states ?? []).reduce((sum, s) => sum + s.count, 0);
    const meta = buildMeta({
      title: `${total}+ Pool Builders by State | Pool Rental Near Me`,
      description: `Browse pool builders and contractors across ${(loaderData?.states ?? []).length} states. Compare ratings, services, and contact info.`,
      path: "/pool-builders",
    });
    const crumbs = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Pool Builders", path: "/pool-builders" },
    ]);
    const list = itemListJsonLd(
      (loaderData?.states ?? []).map((s) => ({
        name: `Pool Builders in ${s.name}`,
        path: `/pool-builders/${s.slug}`,
      })),
      "Pool Builders by State",
    );
    return { ...meta, scripts: [ldJsonScript(crumbs), ldJsonScript(list)] };
  },
  component: PoolBuildersIndex,
});

function PoolBuildersIndex() {
  const { states, providers } = Route.useLoaderData();
  const total = states.reduce((sum: number, s: { count: number }) => sum + s.count, 0);
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <header className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Directory</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {total.toLocaleString()}+ Pool Builders Across the US
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Find a verified pool builder, contractor, or service provider near you. Search by city, rating, or category.
          </p>
        </header>

        <section className="mt-10">
          <BuildersFilter
            providers={providers as unknown as BuilderRow[]}
            showCityFilter
          />
        </section>

        <section className="mt-16">
          <h2 className="text-xl font-semibold text-foreground">Browse by state</h2>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {states.map((s: { code: string; slug: string; name: string; count: number }) => (
              <Link
                key={s.code}
                to="/pool-builders/$state"
                params={{ state: s.slug }}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <span className="font-medium text-foreground">{s.name}</span>
                <span className="ml-2 shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">{s.count}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <JoinNetworkForm
            heading="Are you a pool builder or pool owner?"
            subheading="Get listed in our nationwide directory. Free, takes under 2 minutes."
            sourcePath="/pool-builders"
          />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
