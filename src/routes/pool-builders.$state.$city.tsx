import { createFileRoute, Link, useRouter, notFound } from "@tanstack/react-router";
import { getBuildersByCity } from "@/server/builders.functions";
import { stateName } from "@/lib/states";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { Breadcrumbs } from "@/components/listing-card";
import { JoinNetworkForm } from "@/components/recruit-forms";
import { buildMeta, breadcrumbJsonLd, itemListJsonLd, ldJsonScript } from "@/lib/seo";

export const Route = createFileRoute("/pool-builders/$state/$city")({
  loader: async ({ params }) => {
    const result = await getBuildersByCity({
      data: { state: params.state.toLowerCase(), city: params.city.toLowerCase() },
    });
    if (!result.providers.length || !result.city) throw notFound();
    return result;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData?.city) return {};
    const { state, city, providers } = loaderData;
    const title = `${providers.length} Best Pool Builders in ${city.name}, ${state.code} | Pool Rental Near Me`;
    const description = `Browse ${providers.length} top-rated pool builders and contractors in ${city.name}, ${state.name}. Compare ratings, services, and contact info.`;
    const meta = buildMeta({
      title, description,
      path: `/pool-builders/${params.state}/${params.city}`,
    });
    const crumbs = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Pool Builders", path: "/pool-builders" },
      { name: state.name, path: `/pool-builders/${params.state}` },
      { name: city.name, path: `/pool-builders/${params.state}/${params.city}` },
    ]);
    const list = itemListJsonLd(
      providers.slice(0, 50).map((p) => ({
        name: p.name as string,
        path: `/providers/${p.slug as string}`,
        image: (p.logo_url as string | null) ?? undefined,
      })),
      `Pool Builders in ${city.name}, ${state.code}`,
    );
    return { ...meta, scripts: [ldJsonScript(crumbs), ldJsonScript(list)] };
  },
  component: CityBuildersPage,
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
  notFoundComponent: () => {
    const params = Route.useParams();
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-3xl font-bold">No builders here yet</h1>
          <p className="mt-2 text-muted-foreground">We haven't indexed pool builders for this city. Try the state page.</p>
          <Link to="/pool-builders/$state" params={{ state: params.state }}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            See {stateName(params.state.toUpperCase())} builders
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  },
});

function CityBuildersPage() {
  const { state, city, providers } = Route.useLoaderData();
  const params = Route.useParams();
  if (!city) return null;
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs items={[
          { name: "Home", path: "/" },
          { name: "Pool Builders", path: "/pool-builders" },
          { name: state.name, path: `/pool-builders/${params.state}` },
          { name: city.name, path: `/pool-builders/${params.state}/${params.city}` },
        ]}/>

        <header className="mt-6">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Pool Builders in {city.name}, {state.code}
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            {providers.length} verified pool builders and contractors serving {city.name} and the surrounding {state.name} area.
          </p>
        </header>

        <section className="mt-10">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map((p) => (
              <Link
                key={p.slug as string}
                to="/providers/$slug"
                params={{ slug: p.slug as string }}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  {p.logo_url ? (
                    <img src={p.logo_url as string} alt="" className="h-14 w-14 rounded-lg object-cover" loading="lazy"/>
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
                      {(p.name as string).charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-foreground">{p.name as string}</h3>
                    {typeof p.rating === "number" && (
                      <p className="text-xs text-muted-foreground">★ {p.rating} {p.rating_count ? `(${p.rating_count})` : ""}</p>
                    )}
                    {p.business_type && <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{p.business_type as string}</p>}
                  </div>
                </div>
                {p.address && <p className="text-xs text-muted-foreground line-clamp-2">{p.address as string}</p>}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <JoinNetworkForm
            heading={`Pool builder or pool owner in ${city.name}?`}
            subheading={`Add your business to the ${city.name} directory or list your pool for rent. Free.`}
            defaultCity={city.name}
            defaultState={state.code}
            sourcePath={`/pool-builders/${params.state}/${params.city}`}
          />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
