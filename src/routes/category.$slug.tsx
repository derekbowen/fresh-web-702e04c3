import { createFileRoute, Link, useRouter, notFound } from "@tanstack/react-router";
import { getCategory } from "@/server/content.functions";
import { queryListings } from "@/server/sharetribe.functions";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { Breadcrumbs, ListingCard } from "@/components/listing-card";
import { buildMeta, breadcrumbJsonLd, ldJsonScript } from "@/lib/seo";

export const Route = createFileRoute("/category/$slug")({
  loader: async ({ params }) => {
    const { category } = await getCategory({ data: { slug: params.slug } });
    if (!category) throw notFound();
    const search = await queryListings({
      data: { pub_category: params.slug, perPage: 24 },
    });
    return { category, listings: search.listings, total: search.total };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData?.category) return {};
    const c = loaderData.category;
    const title = c.seo_title || `${c.name} Pool Rentals — Book by the Hour`;
    const description =
      c.seo_description ||
      `Browse ${c.name.toLowerCase()} pool rentals. Hourly bookings with $2M liability insurance included.`;
    const meta = buildMeta({
      title,
      description,
      path: `/category/${params.slug}`,
      image: c.hero_image_url,
    });
    const crumbs = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Categories", path: "/" },
      { name: c.name, path: `/category/${params.slug}` },
    ]);
    return { ...meta, scripts: [ldJsonScript(crumbs)] };
  },
  component: CategoryPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-muted-foreground">{error.message}</p>
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >Retry</button>
        </main>
        <SiteFooter />
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">Category not found</h1>
        <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Home</Link>
      </main>
      <SiteFooter />
    </div>
  ),
});

function CategoryPage() {
  const { category, listings, total } = Route.useLoaderData();
  const params = Route.useParams();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <Breadcrumbs items={[
              { name: "Home", path: "/" },
              { name: "Categories", path: "/" },
              { name: category.name, path: `/category/${params.slug}` },
            ]}/>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              {category.name} Pool Rentals
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              {category.description || `Find ${category.name.toLowerCase()} pools available to rent by the hour.`}
            </p>
            {total > 0 && <p className="mt-3 text-sm font-medium text-foreground">{total} pools</p>}
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {listings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <p className="text-muted-foreground">No listings in this category yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {listings.map((l: import("@/server/sharetribe.functions").ListingSummary) => <ListingCard key={l.id} listing={l} />)}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
