import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getCategoryCityProviders } from "@/server/directory.functions";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { buildMeta, breadcrumbJsonLd, itemListJsonLd, ldJsonScript } from "@/lib/seo";
import { ProviderPlanBadges } from "@/components/provider-plan-badges";

export const Route = createFileRoute("/p/pool-pros/c/$category/$state/$city")({
  loader: async ({ params }) => {
    if (!/^[a-z]{2}$/i.test(params.state)) throw notFound();
    const res = await getCategoryCityProviders({
      data: { slug: params.category, state: params.state, city: params.city },
    });
    if (!res.category) throw notFound();
    return res;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData?.category) return {};
    const c = loaderData.category;
    const title = `${c.plural_name} in ${loaderData.cityName}, ${loaderData.stateCode}`;
    const description = `Top ${c.plural_name.toLowerCase()} serving ${loaderData.cityName}, ${loaderData.stateName}. Compare local pool pros, ratings and contact info.`;
    const path = `/p/pool-pros/c/${params.category}/${params.state.toLowerCase()}/${params.city.toLowerCase()}`;
    const meta = buildMeta({ title: `${title} | Pool Rental Near Me`, description, path, image: c.hero_image_url });
    const crumbs = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Pool Pros", path: "/p/pool-pros" },
      { name: c.plural_name, path: `/p/pool-pros/c/${params.category}` },
      { name: loaderData.stateName, path: `/p/pool-pros/c/${params.category}/${params.state.toLowerCase()}` },
      { name: loaderData.cityName, path },
    ]);
    const list = itemListJsonLd(
      (loaderData.providers ?? []).slice(0, 50).map((p: any) => ({
        name: p.name,
        path: `/p/pool-pros/${p.slug}`,
        image: p.logo_url,
      })),
      title,
    );
    return { ...meta, scripts: [ldJsonScript(crumbs), ldJsonScript(list)] };
  },
  component: CityCategoryPage,
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">Not found</h1>
        <Link to="/p/pool-pros" className="mt-6 inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Browse pool pros</Link>
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

function CityCategoryPage() {
  const { category, stateCode, stateName, cityName, providers } = Route.useLoaderData();
  const params = Route.useParams();
  const stateLower = params.state.toLowerCase();
  const featured = providers.filter((p: any) => p.is_featured);
  const standard = providers.filter((p: any) => !p.is_featured);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span className="mx-1.5">/</span>
          <Link to="/p/pool-pros" className="hover:text-primary">Pool Pros</Link>
          <span className="mx-1.5">/</span>
          <Link to="/p/pool-pros/c/$category" params={{ category: params.category }} className="hover:text-primary">{category!.plural_name}</Link>
          <span className="mx-1.5">/</span>
          <Link to="/p/pool-pros/c/$category/$state" params={{ category: params.category, state: stateLower }} className="hover:text-primary">{stateName}</Link>
          <span className="mx-1.5">/</span>
          <span className="text-foreground">{cityName}</span>
        </nav>

        <header className="mt-4 max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {category!.plural_name} in {cityName}, {stateCode}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            {providers.length === 0
              ? `We don't have ${category!.plural_name.toLowerCase()} listed in ${cityName} yet.`
              : `${providers.length} ${providers.length === 1 ? "pro" : "pros"} serving ${cityName} and the surrounding area.`}
          </p>
        </header>

        {featured.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">Featured</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p: any) => <ProviderCard key={p.slug} p={p} featured />)}
            </div>
          </section>
        )}

        {standard.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold text-foreground">All {category!.plural_name.toLowerCase()} in {cityName}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {standard.map((p: any) => <ProviderCard key={p.slug} p={p} />)}
            </div>
          </section>
        )}

        <section className="mt-12 rounded-2xl border border-border bg-muted/30 p-6">
          <h2 className="text-lg font-semibold text-foreground">More {category!.plural_name.toLowerCase()} nearby</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            <Link to="/p/pool-pros/c/$category/$state" params={{ category: params.category, state: stateLower }} className="text-primary hover:underline">
              Browse all {category!.plural_name.toLowerCase()} in {stateName}
            </Link>{" "}
            or{" "}
            <Link to="/p/pool-pros/c/$category" params={{ category: params.category }} className="text-primary hover:underline">
              see every {category!.name.toLowerCase()} nationwide
            </Link>.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function ProviderCard({ p, featured = false }: { p: any; featured?: boolean }) {
  return (
    <Link
      to="/p/pool-pros/$slug"
      params={{ slug: p.slug }}
      className={`flex items-start gap-4 rounded-2xl border bg-card p-5 transition hover:shadow-md ${featured ? "border-primary/40 ring-1 ring-primary/20" : "border-border"}`}
    >
      {p.logo_url ? (
        <img src={p.logo_url} alt={p.name} className="h-14 w-14 rounded-lg object-cover" />
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
          {p.name.charAt(0)}
        </div>
      )}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-semibold text-foreground">{p.name}</h3>
          <ProviderPlanBadges p={p} />
        </div>
        {p.address && <p className="truncate text-xs text-muted-foreground">{p.address}</p>}
        {typeof p.rating === "number" && (
          <p className="mt-1 text-xs text-muted-foreground">★ {p.rating.toFixed(1)} {p.rating_count ? `(${p.rating_count})` : ""}</p>
        )}
        {p.phone && <p className="mt-1 text-xs text-muted-foreground">{p.phone}</p>}
      </div>
    </Link>
  );
}
