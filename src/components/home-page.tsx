import { lazy, Suspense, useEffect, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-layout";

import { ListingCard } from "@/components/listing-card";
import { ErrorBoundary } from "@/components/error-boundary";
import type { ListingSummary } from "@/server/sharetribe.functions";
import type { HomeCity, HomeData } from "@/server/home-data.functions";
import { ACADEMY_HERO_MAP } from "@/lib/academy-images";
import { LiteYouTube } from "@/components/lite-youtube";
import { FredMascot } from "@/components/fred-mascot";

// Below-the-fold form components — pull react-hook-form + zod resolvers.
// Lazy-load so they don't bloat the homepage entry chunk.
const PoolWaitlistForm = lazy(() =>
  import("@/components/pool-waitlist-form").then((m) => ({ default: m.PoolWaitlistForm })),
);
import heroPool from "@/assets/pool-hero-default.webp";
import heroFamilyPool from "@/assets/hero-family-pool.jpg";
import laSaltwaterFeatured from "@/assets/la-saltwater/hero-night.jpg";

const HIDE_LISTING_RE = /swim\s*spa|aquatic|rehab/i;

const NEARBY_RADIUS_MILES = 500;

// Real courses from the `courses` table — link straight to /p/course/{slug}.
// Hand-picked to only include "rich" courses (cover image + video + long-form content)
// so every tile leads to a fully-populated lesson page, not a stub.
const FEATURED_OCCASIONS = [
  { slug: "pool-host-income-modeling-city-by-city-earnings-forecast", title: "Pool host income: city-by-city earnings forecast", img: "academy/income.jpg" },
  { slug: "multi-platform-hosting-cross-listing-prnm-swimply-peerspace", title: "Cross-listing on PRNM, Swimply & Peerspace", img: "academy/multi-platform.jpg" },
  { slug: "migrating-from-swimply-to-prnm-complete-switch-guide", title: "Switching from Swimply to PRNM", img: "academy/migrate.jpg" },
  { slug: "holiday-premium-playbook-memorial-day-july-4th-labor-day-halloween", title: "Holiday premium playbook: charging more on peak days", img: "academy/holiday.jpg" },
  { slug: "photoshoot-content-creator-ugc-pool-hosting", title: "Renting to photoshoots & content creators", img: "academy/photoshoot.jpg" },
  { slug: "aqua-fitness-senior-wellness-therapeutic-class-hosting", title: "Aqua fitness & wellness class hosting", img: "academy/wellness.jpg" },
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

// Family pool hero — used for the in-page hero AND the og:image / twitter:image
// share preview so social CTR matches what visitors actually see on the page.
export const HOMEPAGE_HERO_IMAGE = heroFamilyPool;
// Kept exported so existing call sites that wanted the stock fallback still resolve.
export const HOMEPAGE_HERO_FALLBACK = heroPool;

export function HomePageContent({ data }: { data: HomeData | undefined | null }) {
  return (
    <ErrorBoundary>
      <HomePageInner data={data} />
    </ErrorBoundary>
  );
}

function HomePageInner({ data }: { data: HomeData | undefined | null }) {
  // Geolocation-driven UI (the "X pools near {city}" badge, the waitlist
  // form, the personalized "Pools near {city}" heading, and the prefilled
  // search address) depends on Cloudflare request headers that exist only
  // on the server. Rendering them during SSR — but not during the first
  // client render — causes a hydration mismatch (React #418). We render
  // a neutral, location-free shell first, then reveal location-aware
  // content after hydration.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  const safe: HomeData = (data && typeof data === "object" ? data : null) ?? {
    cities: [],
    cityCount: 0,
    categories: [],
    listings: [],
    nearby: { city: null, region: null, count: 0, nearestMiles: null },
    academyAvailable: [],
    academyHealth: {},
  };
  const academyHealth: Record<string, "missing" | "short" | "published"> =
    safe.academyHealth && typeof safe.academyHealth === "object"
      ? (safe.academyHealth as Record<string, "missing" | "short" | "published">)
      : {};
  const isHealthy = (slug: string) => academyHealth[slug] === "published";
  // Real courses always render — they live in the `courses` table, not content_pages.
  const visibleOccasions = FEATURED_OCCASIONS;
  const learningAcademyAvailable = true;
  const showAcademySection = true;
  const cities = Array.isArray(safe.cities) ? safe.cities : [];
  const cityCount = typeof safe.cityCount === "number" ? safe.cityCount : cities.length;
  void safe.categories; // categories now rendered by static PoolTypeGrid below
  const rawListings = Array.isArray(safe.listings) ? safe.listings : [];
  // distanceMiles is computed server-side from Cloudflare geo headers, which
  // may differ between the upstream SSR request (proxied via /landing-page)
  // and what the client would compute on rehydration. Strip the badge until
  // after hydration to keep server and client markup identical (avoids
  // React #418 hydration mismatches on listing cards).
  const listings = hydrated
    ? rawListings
    : rawListings.map((l) => ({ ...l, distanceMiles: null }));
  const rawNearby = (safe.nearby && typeof safe.nearby === "object" ? safe.nearby : null) ?? {
    city: null,
    region: null,
    count: 0,
    nearestMiles: null,
  };
  // Until hydrated, pretend we have no location signal at all so the
  // markup is identical regardless of where the request originated.
  const nearby = hydrated
    ? rawNearby
    : { city: null, region: null, count: 0, nearestMiles: null };

  const hasNearbyPools =
    nearby.nearestMiles !== null && nearby.nearestMiles <= NEARBY_RADIUS_MILES;
  const showWaitlist =
    hydrated &&
    nearby.city !== null &&
    (nearby.nearestMiles === null || nearby.nearestMiles > NEARBY_RADIUS_MILES);
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
        {/* ── HERO ─────────────────────────────────────────────── */}
        <section
          aria-label="Rent a backyard pool by the hour"
          className="relative overflow-hidden bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url('${heroFamilyPool}')`,
            minHeight: "60vh",
          }}
        >
          <div className="relative mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 py-12 text-center text-white sm:py-16 lg:py-24">
            <h1 className="text-4xl font-bold leading-tight tracking-tight drop-shadow-md sm:text-5xl lg:text-6xl">
              Summer is better shared.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-white/95 drop-shadow sm:text-lg">
              Find a private pool for rent by the hour, anywhere in America. From quiet family days to full pool party rentals.
            </p>
            <div className="mt-7 flex flex-col items-center gap-3">
              <a
                href="/s"
                aria-label="Find a pool to rent near you"
                className="inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg transition-transform hover:scale-[1.02] sm:text-lg"
                style={{ backgroundColor: "#0EA5E9" }}
              >
                Find a pool near me&nbsp;&nbsp;&rarr;
              </a>
              <a
                href="/p/hosting"
                aria-label="Learn how to list your pool"
                className="text-sm font-medium text-white/95 underline-offset-4 hover:underline sm:text-base"
              >
                Have a pool? List it in 10 minutes &rarr;
              </a>
              <a
                href="/p/pool-rental-app"
                aria-label="Download the Pool Rental Near Me app"
                className="text-sm font-medium text-white/90 underline-offset-4 hover:underline"
              >
                Get the pool rental app &rarr;
              </a>
            </div>
          </div>
        </section>

        {/* Trust line under hero */}
        <div className="border-b border-border bg-background">
          <p className="mx-auto max-w-5xl px-4 py-3 text-center text-xs text-muted-foreground sm:text-sm">
            10% flat host fee · $2M Hartford-backed insurance · 100% US-based support
          </p>
        </div>

        {/* ── TWO DOORS ────────────────────────────────────────── */}
        <section aria-label="Two ways to use Pool Rental Near Me" className="bg-background">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <h2 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Two ways to make summer happen.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted-foreground sm:text-base">
              Book a swimming pool rental as a guest, or list your private pool and earn $3K–$10K/month as a host.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Card A — Renter */}
              <a
                href="/s"
                aria-label="I'm going swimming — find a pool to rent"
                className="group relative flex min-h-[260px] flex-col items-start overflow-hidden rounded-xl border border-border bg-secondary/30 p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                <span className="text-4xl" aria-hidden>🏖</span>
                <h3 className="mt-3 text-xl font-semibold text-foreground">I'm going swimming</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Simple, affordable, and the best Saturday your kids will remember this summer.
                </p>
                <span
                  className="mt-auto inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-white"
                  style={{ backgroundColor: "#0EA5E9" }}
                >
                  Find a pool &rarr;
                </span>
              </a>

              {/* Card B — Host */}
              <a
                href="/p/hosting"
                aria-label="I'm sharing my pool — list my pool on Pool Rental Near Me"
                className="group relative flex min-h-[260px] flex-col items-start overflow-hidden rounded-xl border border-border p-6 text-white transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #0c4a6e 0%, #0EA5E9 100%)",
                }}
              >
                <span className="text-4xl" aria-hidden>🌴</span>
                <h3 className="mt-3 text-xl font-semibold">I'm sharing my pool</h3>
                <p className="mt-2 text-sm text-white/90">
                  Earn $3K-$10K a month renting your pool by the hour. $2M Hartford-backed insurance and 10% flat fees.
                </p>
                <span
                  className="mt-auto inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-foreground"
                >
                  List my pool &rarr;
                </span>
              </a>
            </div>
          </div>
        </section>

        {/* ── EVENT TILES ──────────────────────────────────────── */}
        <section aria-label="Browse pools by occasion" className="bg-secondary/20">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
            <h2 className="text-center text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Any excuse is a good one to dive in.
            </h2>
            <div className="mx-auto mt-6 grid max-w-2xl grid-cols-2 gap-3 sm:gap-4 md:max-w-4xl md:grid-cols-3">
              {[
                { emoji: "👰", label: "Bachelorette", href: "/s?event=bachelorette", aria: "bachelorette parties" },
                { emoji: "🎂", label: "Birthday", href: "/s?event=birthday", aria: "birthday parties" },
                { emoji: "👨‍👩‍👧", label: "Family Day", href: "/s?event=family-day", aria: "family days" },
                { emoji: "🏊", label: "Swim Lesson", href: "/s?event=swim-lesson", aria: "swim lessons" },
                { emoji: "🎉", label: "Pool Party", href: "/s?event=pool-party", aria: "pool parties" },
                { emoji: "🌤", label: "Just Tuesday", href: "/s", aria: "any day of the week" },
              ].map((t) => (
                <a
                  key={t.label}
                  href={t.href}
                  aria-label={`Browse pools for ${t.aria}`}
                  className="flex aspect-square max-h-[160px] flex-col items-center justify-center gap-2 rounded-xl border border-border bg-background p-4 text-center transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-md"
                >
                  <span className="text-[36px] leading-none" aria-hidden>{t.emoji}</span>
                  <span className="text-sm font-bold text-foreground">{t.label}</span>
                </a>
              ))}
            </div>
          </div>
        </section>



        {/* Comparative trust strip */}
        <section aria-label="Why book with Pool Rental Near Me" className="border-b border-border bg-secondary/30">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 text-center sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
            <div>
              <div className="text-2xl font-bold text-primary">$2M</div>
              <div className="mt-1 text-sm font-semibold text-foreground">Insurance per booking</div>
              <div className="mt-1 text-xs text-muted-foreground">2× the industry standard</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">10%</div>
              <div className="mt-1 text-sm font-semibold text-foreground">Flat guest fee</div>
              <div className="mt-1 text-xs text-muted-foreground">Lowest of any pool platform</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">40+</div>
              <div className="mt-1 text-sm font-semibold text-foreground">U.S. states</div>
              <div className="mt-1 text-xs text-muted-foreground">From Austin to Albany</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">24/7</div>
              <div className="mt-1 text-sm font-semibold text-foreground">Live human support</div>
              <div className="mt-1 text-xs text-muted-foreground">Before, during & after</div>
            </div>
          </div>
        </section>

        {/* As Seen In media strip */}
        <section aria-label="Press" className="border-b border-border bg-background">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">As featured in</span>
              <a
                href="https://realestate.einnews.com/pr_news/908834379/two-truck-drivers-built-a-national-pool-rental-marketplace-on-their-off-hours"
                target="_blank"
                rel="noopener noreferrer"
                className="font-serif text-base font-semibold text-foreground/80 transition-colors hover:text-foreground"
              >
                EIN Presswire
              </a>
              <a
                href="https://natlawreview.com/press-releases/two-truck-drivers-built-national-pool-rental-marketplace-their-hours"
                target="_blank"
                rel="noopener noreferrer"
                className="font-serif text-base font-semibold text-foreground/80 transition-colors hover:text-foreground"
              >
                National Law Review
              </a>
              <a
                href="https://lifestyle.myeaglecountry.com/story/194280/two-truck-drivers-built-a-national-pool-rental-marketplace-on-their-off-hours/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-serif text-base font-semibold text-foreground/80 transition-colors hover:text-foreground"
              >
                Eagle Country
              </a>
              <a
                href="https://lifestyle.kbew98country.com/story/194285/two-truck-drivers-built-a-national-pool-rental-marketplace-on-their-off-hours/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-serif text-base font-semibold text-foreground/80 transition-colors hover:text-foreground"
              >
                KBEW
              </a>
            </div>
          </div>
        </section>

        {/* Featured listing video — real backyard, real host. Social proof above the academy CTA. */}
        <section aria-label="Featured pool tour" className="border-b border-border bg-background">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="grid items-center gap-10 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <LiteYouTube videoId="jJF_OyufFQs" title="Tour Katy's Staycation Saltwater Getaway" />
              </div>
              <div className="lg:col-span-5">
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">Featured pool</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Tour Katy's Staycation Saltwater Getaway
                </h2>
                <p className="mt-4 text-base text-muted-foreground">
                  Heated saltwater pool, private backyard, room for the whole crew. See what one of our top hosts built — then book it for your next reunion, birthday, or chill Sunday.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="/l/katy-staycation-saltwater-getaway/685b3bd3-1e5d-44b8-9483-5f6452306157"
                    className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105"
                  >
                    Book this pool →
                  </a>
                  <a
                    href="/s"
                    className="inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-base font-semibold text-foreground transition-colors hover:bg-secondary"
                  >
                    Browse all pools
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Free Pool Host Academy — unique e-learning differentiator */}
        {showAcademySection && (
        <section className="relative overflow-hidden border-y border-border bg-gradient-to-br from-primary/5 via-background to-primary/10">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="grid items-center gap-10 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  Free · Only on PRNM
                </span>

                {/* Fred + headline — Fred is the focal point */}
                <div className="mt-4 flex items-start gap-4 sm:gap-6">
                  <div className="relative flex-shrink-0">
                    <FredMascot
                      variant="full"
                      className="h-32 w-32 drop-shadow-xl sm:h-44 sm:w-44 lg:h-56 lg:w-56"
                    />
                    <span className="absolute -right-2 -top-1 inline-flex items-center rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yellow-950 shadow-md sm:text-xs">
                      Your coach
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                      Learn with Fred — the only Pool Host Academy on the internet.
                    </h2>
                    <div className="relative mt-3 inline-block rounded-2xl bg-card px-4 py-2 text-sm font-medium text-foreground shadow-md ring-1 ring-border sm:text-base">
                      <span className="font-semibold">Hey, I'm Fred.</span> I've coached 5,000+ hosts. I'll show you what actually works.
                      <div className="absolute -left-1.5 top-4 h-3 w-3 rotate-45 bg-card ring-1 ring-border" />
                    </div>
                  </div>
                </div>

                <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
                  135 free classes on safety, pricing, marketing, AI tools, guest experience, and the highest-paying booking niches. No other platform teaches you how to host — Fred wrote the playbook.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    "Safety & Rescue",
                    "Marketing & Pricing",
                    "AI & Automation",
                    "Occasion Playbooks",
                    "Legal & Insurance",
                    "Switch from Swimply",
                  ].map((t) => (
                    <div key={t} className="flex items-center gap-3 rounded-xl border border-border bg-card/60 px-4 py-2.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                      <span className="text-sm font-medium text-foreground">{t}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  {learningAcademyAvailable && (
                    <a
                      href="/p/learningacademy"
                      className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-base font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105"
                    >
                      Learn with Fred — 135 free classes →
                    </a>
                  )}
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  100% free · English & Español · No sign-up required
                </p>
              </div>
              <div className="lg:col-span-5">
                <div className="grid grid-cols-2 gap-3">
                  {visibleOccasions.slice(0, 4).map((o, idx) => (
                    <a
                      key={o.slug}
                      href={`/p/course/${o.slug}`}
                      className={`group relative overflow-hidden rounded-2xl shadow-md transition-all hover:-translate-y-1 hover:shadow-xl ${idx % 2 === 0 ? "translate-y-4" : ""}`}
                    >
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={ACADEMY_HERO_MAP[o.img]}
                          alt={`${o.title} hosting course`}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 p-3">
                        <div className="text-xs font-semibold uppercase tracking-wider text-white/80">Course</div>
                        <div className="text-sm font-bold text-white">{o.title}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
        )}

        {showWaitlist ? (
          <ErrorBoundary name="PoolWaitlistForm" silent>
            <Suspense fallback={null}>
              <PoolWaitlistForm
                nearestMiles={nearby.nearestMiles}
                city={nearby.city}
                region={nearby.region}
              />
            </Suspense>
          </ErrorBoundary>
        ) : (
          listings.length > 0 && (
            <ErrorBoundary name="NearbyListingsSection" silent>
              <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center text-center">
                  <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    {hasNearbyPools && nearbyLabel
                      ? `Pools near ${nearbyLabel}`
                      : "Pools near you"}
                  </h2>
                  <p className="mt-3 max-w-xl text-muted-foreground">
                    Real backyards from real hosts. Pick one and you could be poolside this weekend.
                  </p>
                </div>
                <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <a
                    href="/p/la-saltwater-featured"
                    className="group relative block overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-lg"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-muted">
                      <img
                        src={laSaltwaterFeatured}
                        alt="La Saltwater Pool & Spa, Sherman Oaks"
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 px-2.5 py-1 text-[11px] font-bold text-black shadow">
                        🏆 Top 9 Pools in LA 2025
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="line-clamp-1 text-base font-semibold text-foreground">
                        La Saltwater Pool & Spa
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Sherman Oaks, CA · Saltwater · Heated spa · Fits 45
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                          PRNM Featured
                        </span>
                        <span className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
                          View pool →
                        </span>
                      </div>
                    </div>
                  </a>
                  {listings
                    .filter((l: ListingSummary) => !HIDE_LISTING_RE.test(l.title || ""))
                    .slice(0, 11)
                    .map((l: ListingSummary) => (
                      <ErrorBoundary
                        key={l.id}
                        name={`ListingCard:${l.id}`}
                        fallback={null}
                      >
                        <ListingCard listing={l} />
                      </ErrorBoundary>
                    ))}
                </div>
                <div className="mt-10 text-center">
                  <a
                    href={searchHref}
                    className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105"
                  >
                    Find a pool near you →
                  </a>
                </div>
              </section>
            </ErrorBoundary>
          )
        )}


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

        {/* Host resources — advocacy hub + blog. Educational, not promotional. */}
        <section aria-label="Resources for pool hosts" className="border-y border-border bg-background">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">For pool hosts</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Host smarter, host legally.
              </h2>
              <p className="mt-3 text-muted-foreground">
                Free guides on local laws, permits, HOA rules, taxes, and the day-to-day playbook for renting your pool the right way.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <a
                href="/p/host-advocacy"
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                    Host advocacy hub
                  </span>
                  <h3 className="mt-4 text-2xl font-bold text-foreground">
                    State-by-state hosting laws and rights
                  </h3>
                  <p className="mt-3 text-sm text-muted-foreground">
                    What's allowed where you live, how to handle HOAs and neighbors, and how we fight for hosts when local rules get in the way.
                  </p>
                </div>
                <span className="mt-6 inline-flex items-center text-sm font-semibold text-primary">
                  Browse 50 state guides →
                </span>
              </a>
              <a
                href="/p/blog"
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-secondary/40 via-card to-card p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-foreground">
                    📝 The blog
                  </span>
                  <h3 className="mt-4 text-2xl font-bold text-foreground">
                    Honest stories from real pool hosts
                  </h3>
                  <p className="mt-3 text-sm text-muted-foreground">
                    The good, the awkward, and the lessons learned. Hosting tips, platform deep-dives, and the side of pool rentals nobody else writes about.
                  </p>
                </div>
                <span className="mt-6 inline-flex items-center text-sm font-semibold text-primary">
                  Read the blog →
                </span>
              </a>
            </div>
          </div>
        </section>

        <PoolTypeGrid />

        {cities.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Pool rentals in {cityCount.toLocaleString("en-US")}+ U.S. cities
            </h2>
            <p className="mt-2 text-muted-foreground">
              Find a private pool in your zip code.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {cities.map((c: HomeCity) => (
                <a
                  key={c.slug}
                  href={`/p/${c.slug}`}
                  className="text-sm text-muted-foreground transition-colors hover:text-primary hover:underline"
                >
                  {c.name}, {c.state_code}
                </a>
              ))}
            </div>
          </section>
        )}

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

// --- Pool type discovery grid (12 cards with image backgrounds) ---
import poolTypeSalt from "@/assets/pool-types/saltwater.jpg";
import poolTypeHeated from "@/assets/pool-types/heated.jpg";
import poolTypeResort from "@/assets/pool-types/resort-style.jpg";
import poolTypeLap from "@/assets/pool-types/lap.jpg";
import poolTypeHotTub from "@/assets/pool-types/hot-tub.jpg";
import poolTypeKitchen from "@/assets/pool-types/outdoor-kitchen.jpg";
import poolTypeFire from "@/assets/pool-types/fire-pit.jpg";
import poolTypePet from "@/assets/pool-types/pet-friendly.jpg";
import poolTypeAccessible from "@/assets/pool-types/accessible.jpg";
import poolTypeTheater from "@/assets/pool-types/outdoor-theater.jpg";
import poolTypeIndoor from "@/assets/pool-types/indoor.jpg";
import poolTypeInfinity from "@/assets/pool-types/infinity.jpg";

const POOL_TYPES: { name: string; slug: string; img: string }[] = [
  { name: "Saltwater Pools", slug: "saltwater", img: poolTypeSalt },
  { name: "Heated Pools", slug: "heated", img: poolTypeHeated },
  { name: "Resort-Style Pools", slug: "resort-style", img: poolTypeResort },
  { name: "Lap Pools", slug: "lap", img: poolTypeLap },
  { name: "Pools with Hot Tubs", slug: "hot-tub", img: poolTypeHotTub },
  { name: "Pools with Outdoor Kitchens", slug: "outdoor-kitchen", img: poolTypeKitchen },
  { name: "Pools with Fire Pits", slug: "fire-pit", img: poolTypeFire },
  { name: "Pet-Friendly Pools", slug: "pet-friendly", img: poolTypePet },
  { name: "Wheelchair-Accessible Pools", slug: "accessible", img: poolTypeAccessible },
  { name: "Pools with Outdoor Theaters", slug: "outdoor-theater", img: poolTypeTheater },
  { name: "Indoor Pools", slug: "indoor", img: poolTypeIndoor },
  { name: "Infinity Pools", slug: "infinity", img: poolTypeInfinity },
];

function PoolTypeGrid() {
  return (
    <section className="bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Browse by pool type
        </h2>
        <p className="mt-2 text-muted-foreground">
          Heated pools, hot tubs, infinity edges, fire pits, outdoor theaters — find your vibe.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {POOL_TYPES.map((t) => (
            <a
              key={t.slug}
              href={`/s?pub_category=${encodeURIComponent(t.slug)}`}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl shadow-sm ring-1 ring-border transition-transform duration-200 hover:scale-[1.03] hover:shadow-lg"
            >
              <img
                src={t.img}
                alt={t.name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <div className="text-sm font-semibold leading-tight text-white drop-shadow">
                  {t.name}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

