import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { buildMeta, breadcrumbJsonLd, ldJsonScript, SITE_URL } from "@/lib/seo";
import heroImage from "@/assets/pool-hero-default.jpg";

const PATH = "/p/pool-rental-app";
const TITLE = "Pool Rental App: Book a Private Pool From Your Phone | Pool Rental Near Me";
const DESCRIPTION =
  "Download the Pool Rental Near Me app. Find and book private pools by the hour. Heated pools, hot tubs, and backyard parties with $2M liability included.";
const LIST_HREF = "/l/draft/00000000-0000-0000-0000-000000000000/new/details";

const APP_STORE_URL = "https://apps.apple.com/us/app/pool-rental-near-me-swim-fun/id6737762373";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.poolrentalnearme.app.prod";
const APP_NAME = "Pool Rental Near Me: Swim & Fun";

const CITY_LINKS = [
  { name: "Los Angeles, CA", slug: "los-angeles-ca" },
  { name: "San Diego, CA", slug: "san-diego-ca" },
  { name: "Sacramento, CA", slug: "sacramento-ca" },
  { name: "Phoenix, AZ", slug: "phoenix-az" },
  { name: "Las Vegas, NV", slug: "las-vegas-nv" },
  { name: "Miami, FL", slug: "miami-fl" },
  { name: "Orlando, FL", slug: "orlando-fl" },
  { name: "Tampa, FL", slug: "tampa-fl" },
  { name: "Austin, TX", slug: "austin-tx" },
  { name: "Dallas, TX", slug: "dallas-tx" },
  { name: "Houston, TX", slug: "houston-tx" },
  { name: "Atlanta, GA", slug: "atlanta-ga" },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "Is the Pool Rental Near Me app free to download?",
    a: "Yes. The pool rental app is free on the App Store and Google Play. You only pay when you book a pool. Hourly rates are set by each host and run $40 to $150 per hour depending on the city, pool size, and amenities.",
  },
  {
    q: "What can I do in the app?",
    a: "Search private pools near you, filter by date, group size, heated, hot tub, saltwater, or pet-friendly, message the host, pay in-app, and manage your bookings. Every booking carries $2M in liability coverage at no extra cost.",
  },
  {
    q: "Does the app work in my city?",
    a: "Pool Rental Near Me has listings in every major US metro and thousands of smaller cities. Open the app, allow location access, and the map shows pools near you. If your city has zero listings yet, you can be the first host.",
  },
  {
    q: "Can I list my pool from the app?",
    a: "Yes. Tap List your pool in the app, add photos, set your hourly rate and house rules, and you are live. Hosts keep 90% of every booking. We eat the credit card processing fees, so 90% means 90%.",
  },
  {
    q: "Is the app safe to use?",
    a: "Hosts are reviewed before listings go live, payments run through the app, and every booking includes $2M in liability coverage. Message the host inside the app to keep your contact info private until you are ready to share.",
  },
  {
    q: "Do I need the app, or can I book on the website?",
    a: "Both work. The website at poolrentalnearme.com has the same inventory. The pool rental app is faster on a phone, shows the map by default, and sends push notifications when a host replies or your booking confirms.",
  },
];

const iosAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "MobileApplication",
  name: APP_NAME,
  operatingSystem: "iOS",
  applicationCategory: "TravelApplication",
  url: APP_STORE_URL,
  installUrl: APP_STORE_URL,
  downloadUrl: APP_STORE_URL,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  publisher: {
    "@type": "Organization",
    name: "Pool Rental Near Me",
    url: SITE_URL,
  },
};

const androidAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "MobileApplication",
  name: APP_NAME,
  operatingSystem: "Android",
  applicationCategory: "TravelApplication",
  url: PLAY_STORE_URL,
  installUrl: PLAY_STORE_URL,
  downloadUrl: PLAY_STORE_URL,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  publisher: {
    "@type": "Organization",
    name: "Pool Rental Near Me",
    url: SITE_URL,
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const breadcrumb = breadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Pool rental app", path: PATH },
]);

export const Route = createFileRoute("/p/pool-rental-app")({
  component: PoolRentalAppPage,
  head: () => ({
    ...buildMeta({
      title: TITLE,
      description: DESCRIPTION,
      path: PATH,
      image: heroImage,
      type: "website",
    }),
    scripts: [
      ldJsonScript(iosAppJsonLd),
      ldJsonScript(androidAppJsonLd),
      ldJsonScript(faqJsonLd),
      ldJsonScript(breadcrumb),
    ],
  }),
});

function PoolRentalAppPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={heroImage}
              alt="Pool Rental Near Me app on a phone next to a private backyard pool"
              className="h-full w-full object-cover"
              loading="eager"
              data-todo="hero-image-swap"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
          </div>
          <div className="relative mx-auto max-w-3xl px-4 py-20 text-center text-white sm:py-28">
            <nav className="mb-4 text-xs text-white/80">
              <Link to="/" className="hover:text-white">Home</Link>
              <span className="mx-1.5">/</span>
              <span>Pool rental app</span>
            </nav>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Pool rental app: book a private pool from your phone
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-white/90 sm:text-xl">
              Find a private pool for rent by the hour, anywhere in America. The
              Pool Rental Near Me pool rental app puts heated pools, hot tubs,
              and party-friendly backyards in your pocket. Book in minutes,
              message your host, and show up ready to swim. Every booking
              carries $2M in liability coverage at no extra cost.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={APP_STORE_URL}
                rel="noopener"
                aria-label="Download Pool Rental Near Me on the App Store"
                className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-base font-semibold text-black shadow-lg transition hover:opacity-90"
              >
                Download on the App Store
              </a>
              <a
                href={PLAY_STORE_URL}
                rel="noopener"
                aria-label="Get Pool Rental Near Me on Google Play"
                className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-8 py-3 text-base font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                Get it on Google Play
              </a>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
          <article
            className="prose prose-slate max-w-none text-foreground
              prose-headings:font-semibold prose-headings:tracking-tight
              prose-h2:mt-12 prose-h2:text-2xl prose-h2:border-b prose-h2:border-border prose-h2:pb-2
              prose-h3:mt-8 prose-h3:text-xl
              prose-p:leading-relaxed
              prose-a:text-primary hover:prose-a:underline
              prose-strong:text-foreground
              prose-ul:my-4 prose-li:my-1.5
              dark:prose-invert"
          >
            <h2>What the pool rental app does</h2>
            <p>
              The Pool Rental Near Me pool rental app turns your phone into a
              live map of every private pool you can book by the hour. Open the
              app, allow location access, and you see heated pools, hot tubs,
              saltwater backyards, and party-friendly spots near you with
              hourly rates, photos, and host reviews.
            </p>
            <p>
              Booking takes under a minute. Pick a slot on the host's calendar,
              choose how many hours you need, pay in-app, and message the host
              with any questions. Most bookings confirm in under an hour. Push
              notifications let you know the second the host replies, so you are
              not refreshing your phone all afternoon.
            </p>
            <p>
              Once your booking is confirmed, the address, parking notes, and
              house rules unlock inside the app. Pull up directions, message
              your host on arrival, and rate the space when you leave. Saved
              listings, past bookings, and refunds all live in one place.
            </p>

            {/* Screenshot placeholders */}
            <div className="not-prose my-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div
                className="aspect-[9/19] overflow-hidden rounded-2xl border border-border bg-muted"
                data-todo="app-screenshot-search"
              >
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  Search screen
                </div>
              </div>
              <div
                className="aspect-[9/19] overflow-hidden rounded-2xl border border-border bg-muted"
                data-todo="app-screenshot-listing"
              >
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  Listing detail
                </div>
              </div>
              <div
                className="aspect-[9/19] overflow-hidden rounded-2xl border border-border bg-muted"
                data-todo="app-screenshot-booking"
              >
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  Booking confirmation
                </div>
              </div>
            </div>

            <h2>Why a pool rental app beats a browser tab</h2>
            <p>
              You could book on the website, and plenty of people do. The pool
              rental app is faster on a phone because the map loads first, the
              filters are one tap away, and your saved searches sync across
              devices. Push notifications mean you find out about a host reply
              while you are still picking a date, not three hours later when
              you open your laptop.
            </p>
            <ul>
              <li>
                <strong>Map-first search.</strong> See every available pool near
                you, with hourly rates on the pins.
              </li>
              <li>
                <strong>One-tap filters.</strong> Heated, hot tub, saltwater,
                pet-friendly, party-friendly, ADA accessible.
              </li>
              <li>
                <strong>In-app messaging.</strong> Talk to the host without
                sharing your phone number or email.
              </li>
              <li>
                <strong>Push notifications.</strong> Host replies, booking
                confirmations, and reminders show up the moment they happen.
              </li>
              <li>
                <strong>Saved listings and trips.</strong> Build a shortlist for
                this weekend, plus a folder for the birthday in July.
              </li>
            </ul>

            <h2>Hosts: list your pool from the app</h2>
            <p>
              The same pool rental app lets you list your backyard pool in
              about 15 minutes. Add photos, set your hourly rate and house
              rules, pick your weekly availability, and you are live to every
              guest searching your city. Hosts on Pool Rental Near Me earn
              $1,500 to $8,000 a month renting their backyard pool by the hour.
            </p>
            <p>
              The pricing is simple. Flat 10% host fee, and we eat the credit
              card processing fees, so 90% means 90%. $2M in liability coverage
              comes with every booking at no cost to you. Most other pool
              rental platforms charge 15% or more and pass processing fees on
              top.
            </p>
            <p>
              You can also start your listing on the web at{" "}
              <a href={LIST_HREF}>List your pool free</a> and finish on the app
              later. Listings sync across both.
            </p>

            <h2 id="how-it-works">How a booking works, end to end</h2>
            <ol>
              <li>
                <strong>Download the app.</strong> Free on the App Store and
                Google Play.
              </li>
              <li>
                <strong>Search by city or current location.</strong> Filter by
                date, group size, amenities, and price.
              </li>
              <li>
                <strong>Pick a slot and pay.</strong> Each listing shows the
                host's hourly rate, minimum hours, and available time slots.
              </li>
              <li>
                <strong>Host confirms.</strong> Most bookings confirm in under
                an hour. The address and house rules unlock once confirmed.
              </li>
              <li>
                <strong>Show up, swim, head home.</strong> Stay within your
                booked window. Leave the space the way you found it.
              </li>
              <li>
                <strong>Rate your host.</strong> Every booking carries $2M in
                liability coverage at no extra cost to you.
              </li>
            </ol>

            <h2>What is not in the app</h2>
            <p>
              Real talk so you download with eyes open:
            </p>
            <ul>
              <li>
                <strong>No instant chat with support inside every screen.</strong>{" "}
                Support lives in Settings. For booking-specific questions,
                message the host first.
              </li>
              <li>
                <strong>No group-pay split.</strong> One person books and pays.
                Splitting with friends happens outside the app for now.
              </li>
              <li>
                <strong>No lifeguard service.</strong> The app books the pool.
                Adults in your group supervise swimmers.
              </li>
            </ul>

            <h2>Find a pool rental app listing in your city</h2>
            <p>
              These metros have the deepest pool inventory in the pool rental
              app right now. Tap your city for local listings and pricing:
            </p>
            <div className="not-prose my-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CITY_LINKS.map((c) => (
                <Link
                  key={c.slug}
                  to={`/p/${c.slug}`}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:bg-primary/5"
                >
                  {c.name}
                </Link>
              ))}
            </div>
            <p>
              Browse <Link to="/p/all-locations">every US city with a pool rental available</Link>{" "}
              for the full directory, or check our{" "}
              <a href="/p/private-pool-rental">private pool rental guide</a> and{" "}
              <a href="/p/pool-party-rentals">pool party rentals guide</a> for
              more on how booking works.
            </p>

            <h2>Frequently asked questions</h2>
            {FAQS.map((f) => (
              <div key={f.q}>
                <h3>{f.q}</h3>
                <p>{f.a}</p>
              </div>
            ))}
          </article>

          {/* Download CTA */}
          <div className="not-prose my-12 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
            <h2 className="m-0 text-2xl font-semibold text-foreground">
              Get the pool rental app
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
              Free on the App Store and Google Play. Find a private pool near
              you in under a minute. $2M liability coverage on every booking.
            </p>
            <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={APP_STORE_URL}
                rel="noopener"
                aria-label="Download Pool Rental Near Me on the App Store"
                className="inline-flex items-center justify-center rounded-full bg-foreground px-8 py-3 text-base font-semibold text-background shadow-sm transition hover:opacity-90"
              >
                Download on the App Store
              </a>
              <a
                href={PLAY_STORE_URL}
                rel="noopener"
                aria-label="Get Pool Rental Near Me on Google Play"
                className="inline-flex items-center justify-center rounded-full border border-border bg-card px-8 py-3 text-base font-semibold text-foreground shadow-sm transition hover:bg-muted"
              >
                Get it on Google Play
              </a>
            </div>
          </div>

          {/* Host CTA */}
          <div className="not-prose my-12 rounded-2xl border border-border bg-muted/40 p-6">
            <h2 className="m-0 text-xl font-semibold text-foreground">
              Have a pool? List it free
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Hosts on Pool Rental Near Me earn $1,500 to $8,000 a month renting
              their backyard pool by the hour. Flat 10% host fee, so you keep
              90% of every booking. We eat the credit card processing fees, so
              90% means 90%. $2M liability coverage included.
            </p>
            <a
              href={LIST_HREF}
              className="mt-5 inline-flex items-center justify-center rounded-full bg-foreground px-8 py-3 text-base font-semibold text-background shadow-sm transition hover:opacity-90"
            >
              List your pool free
            </a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
