import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getCategoryWithProviders } from "@/server/directory.functions";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { buildMeta, breadcrumbJsonLd, itemListJsonLd, ldJsonScript, SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/directory/$category")({
  loader: async ({ params }) => {
    const res = await getCategoryWithProviders({ data: { slug: params.category } });
    if (!res.category) throw notFound();
    return res;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData?.category) return {};
    const c = loaderData.category;
    const title = c.seo_title || `${c.plural_name} Directory | Pool Rental Near Me`;
    const description = c.seo_description || `Browse ${c.plural_name.toLowerCase()} across the US.`;
    const meta = buildMeta({ title, description, path: `/directory/${params.category}`, image: c.hero_image_url });
    const crumbs = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Pool Pros Directory", path: "/directory" },
      { name: c.plural_name, path: `/directory/${params.category}` },
    ]);
    const list = itemListJsonLd(
      (loaderData.providers ?? []).slice(0, 50).map((p: any) => ({
        name: p.name,
        path: `/providers/${p.slug}`,
        image: p.logo_url,
      })),
      c.plural_name,
    );
    return { ...meta, scripts: [ldJsonScript(crumbs), ldJsonScript(list)] };
  },
  component: CategoryPage,
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">Category not found</h1>
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

function CategoryPage() {
  const { category, providers } = Route.useLoaderData() as any;
  const featured = (providers as any[]).filter((p: any) => p.is_featured);
  const standard = (providers as any[]).filter((p: any) => !p.is_featured);
  const url = `${SITE_URL}/directory/${category!.slug}`;

  // Group standard providers by state for browseable structure
  const byState = new Map<string, typeof standard>();
  for (const p of standard) {
    const k = p.state_code || "—";
    if (!byState.has(k)) byState.set(k, []);
    byState.get(k)!.push(p);
  }
  const states = [...byState.keys()].sort();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span className="mx-1.5">/</span>
          <Link to="/directory" className="hover:text-primary">Directory</Link>
          <span className="mx-1.5">/</span>
          <span className="text-foreground">{category!.plural_name}</span>
        </nav>

        <header className="mt-4 max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {category!.plural_name}
          </h1>
          {category!.intro_markdown && (
            <p
              className="mt-4 text-lg text-muted-foreground"
              dangerouslySetInnerHTML={{
                __html: category!.intro_markdown.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"),
              }}
            />
          )}
          <p className="mt-2 text-sm text-muted-foreground">{providers.length} listed nationwide</p>
          <div className="mt-5 flex gap-3">
            <Link to="/directory/list" search={{ category: category!.slug }} className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
              List your business
            </Link>
            <a href={url} className="inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-muted/50">
              Share this directory
            </a>
          </div>
        </header>

        {featured.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">Featured</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p: any) => <ProviderCard key={p.slug} p={p} featured />)}
            </div>
          </section>
        )}

        {providers.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <p className="text-muted-foreground">No {category!.plural_name.toLowerCase()} listed yet.</p>
            <Link to="/directory/list" search={{ category: category!.slug }} className="mt-4 inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
              Be the first to list
            </Link>
          </div>
        ) : (
          <section className="mt-10 space-y-10">
            {states.map((state) => (
              <div key={state}>
                <div className="flex items-baseline justify-between">
                  <h2 className="text-lg font-semibold text-foreground">{state === "—" ? "Other locations" : state}</h2>
                  {state !== "—" && /^[A-Z]{2}$/.test(state) && (
                    <Link
                      to="/directory/$category/$state"
                      params={{ category: category!.slug, state: state.toLowerCase() }}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Browse {state} →
                    </Link>
                  )}
                </div>
                <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {byState.get(state)!.map((p: any) => <ProviderCard key={p.slug} p={p} />)}
                </div>
              </div>
            ))}
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function ProviderCard({ p, featured = false }: { p: any; featured?: boolean }) {
  return (
    <Link
      to="/providers/$slug"
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
        <div className="flex items-center gap-2">
          <h3 className="truncate font-semibold text-foreground">{p.name}</h3>
          {featured && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">Featured</span>}
        </div>
        {(p.city || p.state_code) && (
          <p className="text-sm text-muted-foreground">{[p.city, p.state_code].filter(Boolean).join(", ")}</p>
        )}
        {typeof p.rating === "number" && (
          <p className="mt-1 text-xs text-muted-foreground">★ {p.rating.toFixed(1)} {p.rating_count ? `(${p.rating_count})` : ""}</p>
        )}
      </div>
    </Link>
  );
}
