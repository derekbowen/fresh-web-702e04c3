import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getCategoryStateProviders } from "@/server/directory.functions";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { buildMeta, breadcrumbJsonLd, itemListJsonLd, ldJsonScript } from "@/lib/seo";

export const Route = createFileRoute("/directory/$category/$state")({
  loader: async ({ params }) => {
    if (!/^[a-z]{2}$/i.test(params.state)) throw notFound();
    const res = await getCategoryStateProviders({ data: { slug: params.category, state: params.state } });
    if (!res.category) throw notFound();
    return res;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData?.category) return {};
    const c = loaderData.category;
    const sn = loaderData.stateName;
    const title = `${c.plural_name} in ${sn} | Pool Rental Near Me`;
    const description = `Find ${c.plural_name.toLowerCase()} across ${sn}. Browse vetted local pool pros by city.`;
    const meta = buildMeta({
      title,
      description,
      path: `/directory/${params.category}/${params.state.toLowerCase()}`,
      image: c.hero_image_url,
    });
    const crumbs = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Pool Pros Directory", path: "/directory" },
      { name: c.plural_name, path: `/directory/${params.category}` },
      { name: sn, path: `/directory/${params.category}/${params.state.toLowerCase()}` },
    ]);
    const list = itemListJsonLd(
      (loaderData.cities ?? []).slice(0, 50).map((city: { name: string; slug: string }) => ({
        name: `${c.plural_name} in ${city.name}, ${loaderData.stateCode}`,
        path: `/directory/${params.category}/${params.state.toLowerCase()}/${city.slug}`,
      })),
      `${c.plural_name} in ${sn}`,
    );
    return { ...meta, scripts: [ldJsonScript(crumbs), ldJsonScript(list)] };
  },
  component: StateHub,
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">Not found</h1>
        <Link to="/directory" className="mt-6 inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Browse directory</Link>
      </main>
      <SiteFooter />
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground">{error.message}</p>
      </main>
      <SiteFooter />
    </div>
  ),
});

function StateHub() {
  const { category, stateCode, stateName, providers, cities } = Route.useLoaderData();
  const params = Route.useParams();
  const stateLower = params.state.toLowerCase();
  const featured = providers.filter((p: any) => p.is_featured);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span className="mx-1.5">/</span>
          <Link to="/directory" className="hover:text-primary">Directory</Link>
          <span className="mx-1.5">/</span>
          <Link to="/directory/$category" params={{ category: params.category }} className="hover:text-primary">{category!.plural_name}</Link>
          <span className="mx-1.5">/</span>
          <span className="text-foreground">{stateName}</span>
        </nav>

        <header className="mt-4 max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {category!.plural_name} in {stateName}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            {providers.length} {providers.length === 1 ? "pro" : "pros"} listed across {cities.length} {cities.length === 1 ? "city" : "cities"} in {stateName}.
          </p>
          <div className="mt-5">
            <Link to="/directory/list" className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
              List your business in {stateCode}
            </Link>
          </div>
        </header>

        {cities.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold text-foreground">Browse by city</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {cities.map((city: { name: string; slug: string; count: number }) => (
                <Link
                  key={city.slug}
                  to="/directory/$category/$state/$city"
                  params={{ category: params.category, state: stateLower, city: city.slug }}
                  className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm transition hover:border-primary hover:bg-muted/40"
                >
                  <span className="font-medium text-foreground">{city.name}</span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">{city.count}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {featured.length > 0 && (
          <section className="mt-12">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">Featured in {stateName}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p: any) => (
                <Link
                  key={p.slug}
                  to="/providers/$slug"
                  params={{ slug: p.slug }}
                  className="rounded-2xl border border-primary/40 bg-card p-5 ring-1 ring-primary/20 transition hover:shadow-md"
                >
                  <h3 className="font-semibold text-foreground">{p.name}</h3>
                  {p.city && <p className="text-sm text-muted-foreground">{p.city}, {p.state_code}</p>}
                </Link>
              ))}
            </div>
          </section>
        )}

        {providers.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <p className="text-muted-foreground">No {category!.plural_name.toLowerCase()} listed in {stateName} yet.</p>
            <Link to="/directory/list" className="mt-4 inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
              Be the first to list
            </Link>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
