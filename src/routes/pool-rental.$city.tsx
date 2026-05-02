import { createFileRoute, Link, useRouter, notFound } from "@tanstack/react-router";
import { getCity } from "@/server/content.functions";
import { queryListings } from "@/server/sharetribe.functions";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { Breadcrumbs, ListingCard } from "@/components/listing-card";
import { buildMeta, breadcrumbJsonLd, ldJsonScript, SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/pool-rental/$city")({
  loader: async ({ params }) => {
    const { city } = await getCity({ data: { slug: params.city } });
    if (!city) throw notFound();
    const search = await queryListings({
      data: city.latitude && city.longitude
        ? { origin: `${city.latitude},${city.longitude}`, perPage: 24 }
        : { keywords: city.name, perPage: 24 },
    });
    return { city, listings: search.listings, total: search.total };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData?.city) return {};
    const c = loaderData.city;
    const title =
      c.seo_title || `Pool Rentals in ${c.name}, ${c.state_code} — From $25/hr`;
    const description =
      c.seo_description ||
      `Rent a private pool in ${c.name}, ${c.state_code} by the hour. Heated pools, hot tubs, and more — book instantly with $2M liability insurance included.`;
    const meta = buildMeta({
      title,
      description,
      path: `/pool-rental/${params.city}`,
      image: c.hero_image_url,
    });
    const business = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: `Pool Rental Near Me — ${c.name}`,
      url: `${SITE_URL}/pool-rental/${params.city}`,
      areaServed: { "@type": "City", name: c.name },
      address: {
        "@type": "PostalAddress",
        addressLocality: c.name,
        addressRegion: c.state_code,
        addressCountry: "US",
      },
      ...(c.latitude && c.longitude && {
        geo: { "@type": "GeoCoordinates", latitude: c.latitude, longitude: c.longitude },
      }),
    };
    const crumbs = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: c.state, path: "/" },
      { name: c.name, path: `/pool-rental/${params.city}` },
    ]);
    return {
      ...meta,
      scripts: [ldJsonScript(business), ldJsonScript(crumbs)],
    };
  },
  component: CityPage,
  errorComponent: CityError,
  notFoundComponent: CityNotFound,
});

function CityError({ error, reset }: { error: Error; reset: () => void }) {
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
        >
          Retry
        </button>
      </main>
      <SiteFooter />
    </div>
  );
}

function CityNotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">City not found</h1>
        <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
          Browse all locations
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}

function CityPage() {
  const { city, listings, total } = Route.useLoaderData();
  const params = Route.useParams();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <Breadcrumbs
              items={[
                { name: "Home", path: "/" },
                { name: city.state, path: "/" },
                { name: city.name, path: `/pool-rental/${params.city}` },
              ]}
            />
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Pool Rentals in {city.name}, {city.state_code}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              {city.description ||
                `Browse private pool rentals in ${city.name}. Book by the hour, with $2M liability insurance included on every booking.`}
            </p>
            {total > 0 && (
              <p className="mt-3 text-sm font-medium text-foreground">
                {total} {total === 1 ? "pool" : "pools"} available near {city.name}
              </p>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {listings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <h2 className="text-xl font-semibold text-foreground">
                No pools listed in {city.name} yet
              </h2>
              <p className="mt-2 text-muted-foreground">
                Be the first to list your pool and start earning.
              </p>
              <a
                href="https://www.poolrentalnearme.com/signup"
                className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                List your pool
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {listings.map((l: import("@/server/sharetribe.functions").ListingSummary) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
