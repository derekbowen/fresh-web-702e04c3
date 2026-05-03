import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { ListingCard } from "@/components/listing-card";
import type { ListingSummary } from "@/server/sharetribe.functions";
import type { HomeCategory, HomeCity, HomeData } from "@/server/home-data.functions";
import { ACADEMY_HERO_MAP } from "@/lib/academy-images";
import heroPool from "@/assets/pool-hero-default.jpg";

const FEATURED_OCCASIONS = [
  { slug: "bachelorette-pool-party-hosting-playbook", title: "Bachelorette", img: "academy/bachelorette.jpg" },
  { slug: "sweet-16-graduation-pool-party-hosting", title: "Sweet 16 & Graduation", img: "academy/sweet-16.jpg" },
  { slug: "quinceanera-pool-venue-hosting", title: "Quinceañera", img: "academy/quinceanera.jpg" },
  { slug: "family-reunion-pool-hosting", title: "Family Reunion", img: "academy/family-reunion.jpg" },
  { slug: "baby-shower-gender-reveal-pool-venue-hosting", title: "Baby Shower & Gender Reveal", img: "academy/baby-shower.jpg" },
  { slug: "photoshoot-content-creator-ugc-pool-hosting", title: "Photoshoot & UGC", img: "academy/photoshoot.jpg" },
];

export const HOMEPAGE_FAQS = [
  {
    q: "Is the pool host insured if a guest gets hurt?",
    a: "Every confirmed booking on PoolRentalNearMe includes $2M liability insurance for the host, so you're protected if a guest is injured during their reservation. Hosts also get the option to add property damage protection for higher-value pools.",
  },
  {
    q: "How do I contact a pool owner before booking?",
    a: "Once you've found a pool you like, message the host directly through the listing page. Hosts typically reply within an hour. You can ask about pool depth, parking, sound rules, and bring-your-own-food policies before you confirm.",
  },
  {
    q: "Can strangers really swim in my private pool safely?",
    a: "Yes — and the data is on your side. Swimply has hosted millions of bookings without serious incident, and PRNM bookings include built-in liability coverage, ID-verified guests, security deposits, and clear house rules you set yourself. Most hosts say guests treat the pool more carefully than friends do.",
  },
  {
    q: "Is it free for kids and families?",
    a: "Pricing is set per-hour by each host, often with a per-guest fee for groups over a threshold (e.g. 6 guests). Many family-friendly hosts include kids under 12 free. Check each listing's price breakdown before booking.",
  },
];

export const HOMEPAGE_HERO_IMAGE = heroPool;

export function HomePageContent({ data }: { data: HomeData | undefined | null }) {
  const safe = data ?? {
    cities: [],
    categories: [],
    listings: [],
    nearby: { city: null, region: null, count: 0 },
  };
  const cities = safe.cities ?? [];
  const categories = safe.categories ?? [];
  const listings = safe.listings ?? [];
  const nearby = safe.nearby ?? { city: null, region: null, count: 0 };
  const nearbyLabel = nearby.city
    ? `${nearby.city}${nearby.region ? `, ${nearby.region}` : ""}`
    : null;
  const searchHref = nearbyLabel
    ? `/s?address=${encodeURIComponent(nearbyLabel)}`
    : "/s";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-primary text-primary-foreground">
          <div className="mx-auto grid max-w-7xl items-stretch gap-8 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:py-20">
            <div className="lg:col-span-6 lg:py-8">
              {nearby.count > 0 && nearbyLabel && (
                <a
                  href={searchHref}
                  className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white ring-1 ring-white/25 backdrop-blur transition-colors hover:bg-white/25"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                  </span>
                  {nearby.count} {nearby.count === 1 ? "pool" : "pools"} available near {nearbyLabel}
                </a>
              )}
              <h1 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Backyard pools,<br />
                <span className="text-white/90">booked by the hour.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-primary-foreground/85 sm:text-xl">
                Rent a private pool near you for the day, the afternoon, or the weekend. Every booking is protected by $2M liability insurance — included, never an upsell.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={searchHref}
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-base font-semibold text-primary shadow-lg transition-transform hover:scale-105"
                >
                  {nearbyLabel ? `Find a pool in ${nearbyLabel} →` : "Find a pool near you →"}
                </a>
                <a
                  href="/l/draft/00000000-0000-0000-0000-000000000000/new/details"
                  className="inline-flex items-center justify-center rounded-full border border-white/40 bg-transparent px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10"
                >
                  List your pool
                </a>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-primary-foreground/80">
                <span className="flex items-center gap-2"><span aria-hidden>🛟</span> $2M insurance</span>
                <span className="flex items-center gap-2"><span aria-hidden>⚡</span> Instant booking</span>
                <span className="flex items-center gap-2"><span aria-hidden>✓</span> Verified hosts</span>
              </div>
            </div>
            <div className="relative lg:col-span-6">
              <div className="overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/10">
                <img
                  src={heroPool}
                  alt="A sunlit private backyard swimming pool ready to rent by the hour"
                  className="h-72 w-full object-cover sm:h-96 lg:h-full"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Two ways to make someone's day
            </h2>
            <p className="mt-3 text-muted-foreground">
              Pool owner or pool guest — start where you fit.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            <a
              href="/s"
              className="group flex items-center gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-3xl" aria-hidden>🏊</div>
              <div className="flex-1">
                <div className="text-xl font-semibold text-foreground group-hover:text-primary">I want to swim</div>
                <p className="mt-1 text-sm text-muted-foreground">Book a private pool by the hour for your group, your kids, or just for yourself.</p>
              </div>
              <span className="text-2xl text-muted-foreground group-hover:text-primary" aria-hidden>→</span>
            </a>
            <a
              href="/l/draft/00000000-0000-0000-0000-000000000000/new/details"
              className="group flex items-center gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-3xl" aria-hidden>💰</div>
              <div className="flex-1">
                <div className="text-xl font-semibold text-foreground group-hover:text-primary">I want to host my pool</div>
                <p className="mt-1 text-sm text-muted-foreground">Top hosts earn $3K–$10K/month. Free to list. Insurance included on every booking.</p>
              </div>
              <span className="text-2xl text-muted-foreground group-hover:text-primary" aria-hidden>→</span>
            </a>
          </div>
        </section>

        {listings.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Pools near you
              </h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                Real backyards from real hosts. Pick one and you could be poolside this weekend.
              </p>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.slice(0, 6).map((l: ListingSummary) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
            <div className="mt-10 text-center">
              <a
                href="/s"
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105"
              >
                Find a pool near you →
              </a>
            </div>
          </section>
        )}

        <section className="bg-primary py-16 text-primary-foreground sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Got an occasion to celebrate?
                </h2>
                <p className="mt-3 text-primary-foreground/85">
                  Every party type has its own perfect pool — and its own hosting playbook. Tap one to learn what to expect, what it costs, and how to book it right.
                </p>
              </div>
              <div className="lg:col-span-8">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {FEATURED_OCCASIONS.map((o) => (
                    <a
                      key={o.slug}
                      href={`/s?keywords=${encodeURIComponent(o.title)}`}
                      className="group relative overflow-hidden rounded-2xl bg-white text-foreground shadow-md transition-all hover:-translate-y-0.5 hover:shadow-xl"
                    >
                      <div className="aspect-[4/3] overflow-hidden">
                        <img
                          src={ACADEMY_HERO_MAP[o.img]}
                          alt={`${o.title} pool rental`}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2 px-4 py-3">
                        <span className="text-sm font-semibold">{o.title}</span>
                        <span className="text-primary" aria-hidden>→</span>
                      </div>
                    </a>
                  ))}
                </div>
                <div className="mt-8 flex justify-center lg:justify-start">
                  <a
                    href="/s"
                    className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-base font-semibold text-primary shadow-lg transition-transform hover:scale-105"
                  >
                    Browse all pools →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Questions? <span className="text-primary">We've thought of everything.</span>
              </h2>
              <p className="mt-3 text-muted-foreground">
                The four things first-time renters and hosts ask us most.
              </p>
              <div className="mt-8 space-y-3">
                {HOMEPAGE_FAQS.map((f, i) => (
                  <details key={i} className="group rounded-2xl border border-border bg-card p-5 open:shadow-md">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-foreground">
                      {f.q}
                      <span className="text-muted-foreground transition-transform group-open:rotate-45" aria-hidden>+</span>
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="sticky top-8 flex h-full min-h-[280px] flex-col items-start justify-center rounded-3xl bg-gradient-to-br from-primary to-primary-glow p-8 text-primary-foreground shadow-xl">
                <h3 className="text-2xl font-bold">Talk to a real human.</h3>
                <p className="mt-3 text-primary-foreground/85">
                  Trying to plan a wedding-weekend takeover or a film shoot? Need a custom quote for a 30-person reunion? Skip the search — we'll help you book it.
                </p>
                <a
                  href="mailto:hello@poolrentalnearme.com"
                  className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary shadow-lg transition-transform hover:scale-105"
                >
                  Contact concierge →
                </a>
              </div>
            </div>
          </div>
        </section>

        {categories.length > 0 && (
          <section className="bg-secondary/30">
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Browse by pool type
              </h2>
              <p className="mt-2 text-muted-foreground">
                Heated pools, hot tubs, infinity edges — find the right vibe.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {categories.map((c: HomeCategory) => (
                  <a
                    key={c.slug}
                    href={`/s?pub_category=${encodeURIComponent(c.slug)}`}
                    className="group rounded-2xl border border-border bg-card p-5 text-center transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    {c.icon && (
                      <div className="text-3xl" aria-hidden="true">
                        {c.icon}
                      </div>
                    )}
                    <div className="mt-2 text-sm font-semibold text-foreground group-hover:text-primary">
                      {c.name}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Pool rentals in {cities.length}+ U.S. cities
          </h2>
          <p className="mt-2 text-muted-foreground">
            Find a private pool in your zip code.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {cities.map((c: HomeCity) => (
              <a
                key={c.slug}
                href={`/s?address=${encodeURIComponent(`${c.name}, ${c.state_code}`)}`}
                className="text-sm text-muted-foreground transition-colors hover:text-primary hover:underline"
              >
                {c.name}, {c.state_code}
              </a>
            ))}
          </div>
        </section>

        <section className="bg-primary text-primary-foreground">
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-14 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">
                Got a pool? Turn it into income.
              </h2>
              <p className="mt-2 max-w-2xl text-primary-foreground/85">
                Top hosts earn $3,000–$10,000 per month renting their backyard a few hours at a time. Free to list, insured on every booking.
              </p>
            </div>
            <a
              href="/l/draft/00000000-0000-0000-0000-000000000000/new/details"
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-7 py-3 text-base font-semibold text-primary shadow-lg transition-transform hover:scale-105"
            >
              List your pool →
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
