import { createFileRoute, Link, useRouter, notFound } from "@tanstack/react-router";
import { getBuildersByState } from "@/server/builders.functions";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { Breadcrumbs } from "@/components/listing-card";
import { JoinNetworkForm } from "@/components/recruit-forms";
import { BuildersFilter, type BuilderRow } from "@/components/builders-filter";
import { buildMeta, breadcrumbJsonLd, itemListJsonLd, ldJsonScript } from "@/lib/seo";

export const Route = createFileRoute("/pool-builders/$state")({
  loader: async ({ params }) => {
    const result = await getBuildersByState({ data: { state: params.state.toLowerCase() } });
    if (!result.providers.length) throw notFound();
    return result;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return {};
    const { state, providers, cities } = loaderData;
    const title = `${state.count}+ Pool Builders in ${state.name} | Pool Rental Near Me`;
    const description = `Browse ${state.count} pool builders, contractors, and pool service providers across ${cities.length} cities in ${state.name}. Free directory.`;
    const meta = buildMeta({
      title, description,
      path: `/pool-builders/${params.state}`,
    });
    const crumbs = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Pool Builders", path: "/pool-builders" },
      { name: state.name, path: `/pool-builders/${params.state}` },
    ]);
    const list = itemListJsonLd(
      providers.slice(0, 50).map((p) => ({
        name: p.name as string,
        path: `/providers/${p.slug as string}`,
        image: (p.logo_url as string | null) ?? undefined,
      })),
      `Pool Builders in ${state.name}`,
    );
    return { ...meta, scripts: [ldJsonScript(crumbs), ldJsonScript(list)] };
  },
  component: StateBuildersPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-muted-foreground">{error.message}</p>
          <button onClick={() => { router.invalidate(); reset(); }}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Retry</button>
        </main>
        <SiteFooter />
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">No builders found</h1>
        <p className="mt-2 text-muted-foreground">We don't have pool builders listed in this state yet.</p>
        <Link to="/pool-builders" className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">All states</Link>
      </main>
      <SiteFooter />
    </div>
  ),
});

function StateBuildersPage() {
  const { state, providers, cities } = Route.useLoaderData();
  const params = Route.useParams();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs items={[
          { name: "Home", path: "/" },
          { name: "Pool Builders", path: "/pool-builders" },
          { name: state.name, path: `/pool-builders/${params.state}` },
        ]}/>

        <header className="mt-6">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Pool Builders in {state.name}
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            {state.count} verified pool builders across {cities.length} cities in {state.name}. Browse by city or scroll the full list.
          </p>
        </header>

        {cities.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold text-foreground">Top cities</h2>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {cities.slice(0, 30).map((c) => (
                <Link
                  key={c.slug}
                  to="/pool-builders/$state/$city"
                  params={{ state: params.state, city: c.slug }}
                  className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <span className="truncate font-medium text-foreground">{c.city}</span>
                  <span className="ml-2 shrink-0 text-xs text-muted-foreground">{c.count}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-12">
          <h2 className="text-xl font-semibold text-foreground">All builders ({providers.length})</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map((p) => (
              <Link
                key={p.slug as string}
                to="/providers/$slug"
                params={{ slug: p.slug as string }}
                className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
              >
                {p.logo_url ? (
                  <img src={p.logo_url as string} alt="" className="h-14 w-14 rounded-lg object-cover" loading="lazy"/>
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
                    {(p.name as string).charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-foreground">{p.name as string}</h3>
                  {p.city && <p className="text-sm text-muted-foreground">{p.city as string}, {state.code}</p>}
                  {typeof p.rating === "number" && (
                    <p className="mt-1 text-xs text-muted-foreground">★ {p.rating} {p.rating_count ? `(${p.rating_count})` : ""}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <JoinNetworkForm
            heading={`Are you a pool pro in ${state.name}?`}
            subheading="Get listed in our directory and turn your pool into income. Free for hosts."
            defaultState={state.code}
            sourcePath={`/pool-builders/${params.state}`}
          />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
