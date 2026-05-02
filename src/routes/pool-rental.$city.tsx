import { createFileRoute, Link, useRouter, notFound } from "@tanstack/react-router";
import { getCity, getNearbyCities, listCategories } from "@/server/content.functions";
import { queryListings, type ListingSummary } from "@/server/sharetribe.functions";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { Breadcrumbs, ListingCard } from "@/components/listing-card";
import { buildMeta, breadcrumbJsonLd, ldJsonScript, SITE_URL } from "@/lib/seo";
import { resolveCityHero } from "@/lib/city-hero";
import poolHeroDefault from "@/assets/pool-hero-default.jpg";



const OCCASIONS = [
  "Birthday party",
  "Bachelorette party",
  "Bachelor party",
  "Family gathering",
  "Photo shoot",
  "Pool party",
  "Kids' party",
  "Date night",
  "Corporate event",
  "Graduation party",
  "Anniversary party",
  "Baby shower",
];

const FAQS = (cityName: string, stateCode: string) => [
  {
    q: `How much does it cost to rent a pool in ${cityName}, ${stateCode}?`,
    a: `Private pool rentals in ${cityName} typically range from $25 to $150 per hour depending on the pool's size, amenities (heated, hot tub, slides), and the time of day. You can filter by price on the search page.`,
  },
  {
    q: `How do I book a pool in ${cityName}, ${stateCode}?`,
    a: `Pick a pool, choose your date and time slot, and book instantly. Every reservation includes confirmation with the host's address and access details. $2M liability insurance is included in every booking.`,
  },
  {
    q: `Are pool rentals in ${cityName} safe and insured?`,
    a: `Yes — every booking on Pool Rental Near Me automatically comes with $2M of liability insurance covering both the host and guests. Hosts are verified with real photos, ratings, and reviews.`,
  },
  {
    q: `What can I bring to a pool rental?`,
    a: `Bring towels, swimsuits, food, and drinks. Each listing details what the host provides (floats, grill, sound system) and any restrictions (no glass, no smoking, pet rules).`,
  },
  {
    q: `Can I host a party at a pool I rent in ${cityName}?`,
    a: `Most pools welcome parties — birthdays, bachelorettes, kids' parties, photo shoots and more. Check the listing's guest limit and house rules before booking, or message the host for special requests.`,
  },
  {
    q: `Can I list my own pool in ${cityName} to earn money?`,
    a: `Absolutely. Hosts in ${cityName} earn an average of $1,200–$5,000+ per month. Listing is free and takes about 10 minutes. Insurance is included and you set your own price and availability.`,
  },
];

export const Route = createFileRoute("/pool-rental/$city")({
  loader: async ({ params }) => {
    const { city } = await getCity({ data: { slug: params.city } });
    if (!city) throw notFound();

    const [search, nearby, cats] = await Promise.all([
      queryListings({
        data: city.latitude && city.longitude
          ? { origin: `${city.latitude},${city.longitude}`, perPage: 24 }
          : { keywords: city.name, perPage: 24 },
      }),
      getNearbyCities({
        data: { slug: city.slug, state_code: city.state_code, limit: 12 },
      }),
      listCategories(),
    ]);

    return {
      city,
      listings: search.listings,
      total: search.total,
      nearby: nearby.cities,
      categories: cats.categories,
    };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData?.city) return {};
    const c = loaderData.city;
    const title =
      c.seo_title || `Pool Rentals in ${c.name}, ${c.state_code} — From $25/hr`;
    const description =
      c.seo_description ||
      `Rent a private pool in ${c.name}, ${c.state_code} by the hour. Heated pools, hot tubs, and luxury backyards — book instantly with $2M liability insurance included.`;
    const meta = buildMeta({
      title,
      description,
      path: `/pool-rental/${params.city}`,
      image: resolveCityHero(params.city, c.hero_image_url),
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
    const faqLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS(c.name, c.state_code).map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };
    return {
      ...meta,
      scripts: [ldJsonScript(business), ldJsonScript(crumbs), ldJsonScript(faqLd)],
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
  const { city, listings, total, nearby, categories } = Route.useLoaderData();
  const params = Route.useParams();
  const heroImg = resolveCityHero(city.slug, city.hero_image_url);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative isolate overflow-hidden">
          <img
            src={heroImg}
            alt={`Private pool rental in ${city.name}, ${city.state_code}`}
            width={1920}
            height={1080}
            className="absolute inset-0 -z-10 h-full w-full object-cover"
            onError={(e) => {
              const img = e.currentTarget;
              if (img.src !== poolHeroDefault) img.src = poolHeroDefault;
            }}
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/75 via-black/55 to-black/30" />
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
            <div className="text-white/90">
              <Breadcrumbs
                items={[
                  { name: "Home", path: "/" },
                  { name: city.state, path: "/" },
                  { name: city.name, path: `/pool-rental/${params.city}` },
                ]}
              />
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-white drop-shadow sm:text-5xl lg:text-6xl">
              Find pools in <br className="hidden sm:block" />
              {city.name}, {city.state_code}
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-white/90 drop-shadow">
              {city.description ||
                `Discover private pool rentals for your next swim, gathering, or party in ${city.name}. Book by the hour with $2M liability insurance included.`}
            </p>
            <form
              action={`/s`}
              method="get"
              className="mt-8 flex max-w-xl items-center gap-2 rounded-full bg-white p-2 shadow-lg ring-1 ring-black/5"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="ml-3 h-5 w-5 text-muted-foreground"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                name="address"
                defaultValue={`${city.name}, ${city.state_code}`}
                aria-label="Search location"
                className="flex-1 bg-transparent px-2 py-2 text-sm text-foreground outline-none"
              />
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-glow"
              >
                Find pools
              </button>
            </form>
          </div>
        </section>

        {/* STATS */}
        <section className="border-b border-border bg-card">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:grid-cols-4 sm:px-6 lg:px-8">
            {[
              { v: "4M+", l: "Guests" },
              { v: "600K", l: "Bookings" },
              { v: "4.9★", l: "225K reviews" },
              { v: "20,000+", l: "Pools nationwide" },
            ].map((s) => (
              <div key={s.l} className="text-center">
                <div className="text-2xl font-bold text-foreground sm:text-3xl">{s.v}</div>
                <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* LISTINGS */}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Popular pools in {city.name}, {city.state_code}
              </h2>
              {total > 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Showing {Math.min(listings.length, total)} of {total} pools available
                </p>
              )}
            </div>
            <a
              href={`/s?address=${encodeURIComponent(`${city.name}, ${city.state_code}`)}`}
              className="hidden text-sm font-semibold text-primary hover:underline sm:inline"
            >
              See all pools in {city.name} →
            </a>
          </div>

          {listings.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <h3 className="text-xl font-semibold text-foreground">
                No pools listed in {city.name} yet
              </h3>
              <p className="mt-2 text-muted-foreground">
                Be the first to list your pool and start earning.
              </p>
              <a
                href={`/signup`}
                className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                List your pool
              </a>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {listings.map((l: ListingSummary) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          )}
        </section>

        {/* HOW IT WORKS */}
        <section className="bg-secondary/30">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              How renting a pool in {city.name} works
            </h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Search & filter",
                  desc: `Browse verified private pools in ${city.name}. Filter by price, amenities, pool size, and date.`,
                },
                {
                  step: "2",
                  title: "Book instantly",
                  desc: "Pick a time slot and confirm in seconds. $2M liability insurance is automatically included.",
                },
                {
                  step: "3",
                  title: "Show up & swim",
                  desc: "Get the host's access details, arrive, and enjoy your private pool with friends and family.",
                },
              ].map((s) => (
                <div key={s.step} className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                    {s.step}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CATEGORIES */}
        {categories.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Pool types & amenities
            </h2>
            <p className="mt-2 text-muted-foreground">
              Filter pools in {city.name} by what matters to you.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {categories.map((c: { slug: string; name: string; icon: string | null }) => (
                <Link
                  key={c.slug}
                  to="/category/$slug"
                  params={{ slug: c.slug }}
                  className="group rounded-2xl border border-border bg-card p-5 text-center transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  {c.icon && <div className="text-3xl" aria-hidden="true">{c.icon}</div>}
                  <div className="mt-2 text-sm font-semibold text-foreground group-hover:text-primary">
                    {c.name}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="bg-secondary/30">
          <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Frequently asked questions
            </h2>
            <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card">
              {FAQS(city.name, city.state_code).map((f) => (
                <details key={f.q} className="group p-5 sm:p-6">
                  <summary className="flex cursor-pointer items-start justify-between gap-4 text-base font-semibold text-foreground">
                    <span>{f.q}</span>
                    <span className="mt-0.5 text-primary transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* OCCASIONS — internal linking */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Perfect for every occasion in {city.name}
          </h2>
          <p className="mt-2 text-muted-foreground">
            Find the right private pool for any kind of get-together.
          </p>
          <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3 lg:grid-cols-4">
            {OCCASIONS.map((occ) => (
              <li key={occ}>
                <a
                  href={`/s?address=${encodeURIComponent(`${city.name}, ${city.state_code}`)}&pub_occasions=${encodeURIComponent(occ)}`}
                  className="text-muted-foreground hover:text-primary hover:underline"
                >
                  {occ} venues in {city.name}
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* NEARBY CITIES — internal linking */}
        <NearbyCities
          cities={nearby as Array<{ slug: string; name: string; state: string; state_code: string; distance_km: number | null }>}
          currentStateCode={city.state_code}
          currentStateName={city.state}
        />

        {/* HOST CTA */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-glow p-8 text-primary-foreground sm:p-12">
            <div className="grid items-center gap-6 md:grid-cols-3">
              <div className="md:col-span-2">
                <h2 className="text-2xl font-bold sm:text-3xl">
                  Own a pool in {city.name}? Earn $1,200–$5,000+ per month.
                </h2>
                <p className="mt-3 text-primary-foreground/90">
                  List your pool free in 10 minutes. Set your own price and schedule. $2M liability insurance is included on every booking.
                </p>
              </div>
              <div className="md:text-right">
                <a
                  href={`/signup`}
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-base font-semibold text-primary shadow-md transition-transform hover:scale-105"
                >
                  List your pool free
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

type NearbyCity = {
  slug: string;
  name: string;
  state: string;
  state_code: string;
  distance_km: number | null;
};

function NearbyCities({
  cities,
  currentStateCode,
  currentStateName,
}: {
  cities: NearbyCity[];
  currentStateCode: string;
  currentStateName: string;
}) {
  const sameState = cities.filter((c) => c.state_code === currentStateCode);
  const otherState = cities.filter((c) => c.state_code !== currentStateCode);

  return (
    <section className="border-t border-border bg-secondary/20">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Nearby pool rentals
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Explore private pools in cities close by.
        </p>

        {cities.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            More cities coming soon.
          </p>
        ) : (
          <>
            {sameState.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  More in {currentStateName}
                </h3>
                <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  {sameState.map((n) => (
                    <li key={n.slug}>
                      <Link
                        to="/pool-rental/$city"
                        params={{ city: n.slug }}
                        className="text-muted-foreground hover:text-primary hover:underline"
                      >
                        Pool rentals in {n.name}, {n.state_code}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {otherState.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Nearby cities
                </h3>
                <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  {otherState.map((n) => (
                    <li key={n.slug}>
                      <Link
                        to="/pool-rental/$city"
                        params={{ city: n.slug }}
                        className="text-muted-foreground hover:text-primary hover:underline"
                      >
                        Pool rentals in {n.name}, {n.state_code}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
