import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { buildMeta, breadcrumbJsonLd, ldJsonScript, SITE_URL } from "@/lib/seo";
import heroImage from "@/assets/hero-family-pool.jpg";

const PATH = "/p/private-pool-rental";
const TITLE = "Private Pool Rental by the Hour | Pool Rental Near Me";
const DESCRIPTION =
  "Book a private pool rental by the hour. Heated pools, hot tubs, saltwater backyards. $2M liability included, hosts keep 90% of every booking.";
const LIST_HREF = "/l/draft/00000000-0000-0000-0000-000000000000/new/details";

const CITY_LINKS = [
  { name: "Los Angeles, CA", slug: "los-angeles-ca" },
  { name: "San Diego, CA", slug: "san-diego-ca" },
  { name: "Phoenix, AZ", slug: "phoenix-az" },
  { name: "Houston, TX", slug: "houston-tx" },
  { name: "Dallas, TX", slug: "dallas-tx" },
  { name: "Austin, TX", slug: "austin-tx" },
  { name: "Miami, FL", slug: "miami-fl" },
  { name: "Orlando, FL", slug: "orlando-fl" },
  { name: "Tampa, FL", slug: "tampa-fl" },
  { name: "Las Vegas, NV", slug: "las-vegas-nv" },
  { name: "Atlanta, GA", slug: "atlanta-ga" },
  { name: "Charlotte, NC", slug: "charlotte-nc" },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "How much does a private pool rental cost?",
    a: "Most private pools rent for $40 to $100 per hour. Heated pools and luxury backyards with hot tubs and outdoor kitchens run $100 to $150 per hour. You pay only for the hours you book, with a typical two-hour minimum.",
  },
  {
    q: "What is included in a private pool rental?",
    a: "Exclusive use of the pool and yard for your group during your booking, plus seating, restroom access, and any amenities the host lists (hot tub, grill, sound system, shade). Every booking on Pool Rental Near Me includes $2M in liability coverage at no extra cost.",
  },
  {
    q: "How many people can I bring?",
    a: "Each listing sets its own guest limit, usually between 5 and 25 people. Filter by group size when you search. Going over the limit risks cancellation, so book a larger pool if you are unsure.",
  },
  {
    q: "Can I rent a private pool for just an hour?",
    a: "Most hosts require a two-hour minimum. A few accept one-hour bookings during off-peak times. Use the calendar on each listing to see the host's minimum and available slots.",
  },
  {
    q: "Are private pool rentals safe?",
    a: "Hosts on Pool Rental Near Me are reviewed before going live and rated by every guest. There is no lifeguard on site, so adults are responsible for supervising swimmers. Every booking carries $2M in liability insurance.",
  },
  {
    q: "Can I bring my dog?",
    a: "Some hosts allow pets, most do not. The listing shows the host's pet policy. Filter by pet-friendly when you search if a dog needs to come along.",
  },
];

const PRICING_ROWS = [
  { tier: "Standard private pool", range: "$40 to $75 / hour", note: "Typical backyard pool, seating, basic amenities" },
  { tier: "Heated pool or hot tub access", range: "$60 to $100 / hour", note: "Year-round bookable, hot tub or heated pool" },
  { tier: "Luxury backyard", range: "$100 to $150 / hour", note: "Resort-style: hot tub, outdoor kitchen, cabana" },
];

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Private pool rental",
  name: "Private pool rental by the hour",
  description:
    "Hourly private pool rental marketplace. Heated pools, hot tubs, and luxury backyards with $2M liability insurance included on every booking.",
  provider: {
    "@type": "Organization",
    name: "Pool Rental Near Me",
    url: SITE_URL,
  },
  areaServed: { "@type": "Country", name: "United States" },
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: "40",
    highPrice: "150",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      priceCurrency: "USD",
      unitText: "HUR",
    },
  },
  url: `${SITE_URL}${PATH}`,
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
  { name: "Private pool rental", path: PATH },
]);

export const Route = createFileRoute("/p/private-pool-rental")({
  component: PrivatePoolRentalPage,
  head: () => ({
    ...buildMeta({
      title: TITLE,
      description: DESCRIPTION,
      path: PATH,
      image: heroImage,
      type: "website",
    }),
    scripts: [
      ldJsonScript(serviceJsonLd),
      ldJsonScript(faqJsonLd),
      ldJsonScript(breadcrumb),
    ],
  }),
});

function PrivatePoolRentalPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={heroImage}
              alt="Family enjoying a private backyard pool rental"
              className="h-full w-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
          </div>
          <div className="relative mx-auto max-w-3xl px-4 py-20 text-center text-white sm:py-28">
            <nav className="mb-4 text-xs text-white/80">
              <Link to="/" className="hover:text-white">Home</Link>
              <span className="mx-1.5">/</span>
              <span>Private pool rental</span>
            </nav>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Private pool rental by the hour
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-white/90 sm:text-xl">
              Book a private pool for an afternoon, an evening, or a full day.
              Heated pools, hot tubs, and saltwater backyards across America. You
              get the whole place to yourself, with $2M in liability coverage
              included on every booking.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="/s"
                className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-lg transition hover:opacity-90"
              >
                Find a private pool near you
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-8 py-3 text-base font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                How it works
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
            <h2>Why people book a private pool by the hour</h2>
            <p>
              Public pools are crowded, hotel pools are off-limits unless you are
              a guest, and a backyard pool of your own costs $40,000 plus
              chemicals, repairs, and time. Renting a private pool for a few
              hours solves all of that. You get water, sunshine, and space for
              your people, and you go home when you are done.
            </p>
            <p>
              Most guests on Pool Rental Near Me book for one of five reasons:
              family swim time, a small party, a date or anniversary, a workout
              or therapy session, or a photo or video shoot. The marketplace is
              hourly, so you pay for the time you actually use.
            </p>

            <h3>Family days and quiet swims</h3>
            <p>
              Parents with toddlers want a shallow, fenced, sunscreen-friendly
              spot without 200 strangers and a chlorine fog. A two-hour booking
              at a fenced backyard pool, with a hot tub on the side for grandma,
              runs $80 to $150 total. That is less than a single day pass for
              four people at most resort pools.
            </p>

            <h3>Birthday parties and small celebrations</h3>
            <p>
              Birthdays, graduations, baby showers, and bachelorette weekends do
              well in backyard settings. A private pool with seating for 15 and
              a grill turns into the whole event. For larger parties, see our{" "}
              <a href="/p/pool-party-rentals">pool party rentals guide</a> for
              listings sized for 20 to 50 guests.
            </p>

            <h3>Therapy, recovery, and accessibility</h3>
            <p>
              Warm water helps people who cannot use a crowded public pool.
              Wheelchair users, seniors easing back into movement, kids with
              sensory sensitivities, and adults working through joint pain often
              book heated private pools by the hour because the space is calm,
              the entry is private, and the schedule is theirs. Look for
              listings tagged step entry, zero entry, heated, or ADA when you
              search.
            </p>

            <h3>Photoshoots and content</h3>
            <p>
              Photographers, brands, and creators rent pools for shoots that
              need water, sun, and a clean backyard. Permits for public pools
              are slow and expensive. A two-hour private booking gets you the
              location, the privacy, and a host who can point you to the best
              light.
            </p>

            <h2>What a private pool rental costs</h2>
            <p>
              Pricing is set by each host and varies by city, pool size, and
              amenities. Across the marketplace, three patterns hold:
            </p>
            <div className="not-prose my-8 overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Tier</th>
                    <th className="px-4 py-3 text-left font-semibold">Hourly range</th>
                    <th className="px-4 py-3 text-left font-semibold">What you usually get</th>
                  </tr>
                </thead>
                <tbody>
                  {PRICING_ROWS.map((r) => (
                    <tr key={r.tier} className="border-t border-border align-top">
                      <td className="px-4 py-3 font-medium">{r.tier}</td>
                      <td className="px-4 py-3">{r.range}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              Most listings have a two-hour minimum. Weekends and holidays
              command higher rates. Off-peak weekday mornings are the cheapest
              way to try a private pool for the first time.
            </p>

            <h2>What to look for in a listing</h2>
            <p>
              Filter by what actually matters to your group. Three of the most
              useful keyword searches:
            </p>
            <ul>
              <li>
                <a href="/s?keyword=heated">Heated pools</a>{" "}
                for cooler months and year-round bookings.
              </li>
              <li>
                <a href="/s?keyword=hot%20tub">Hot tub listings</a>{" "}
                for year-round bookable spots, great for cold-weather dates and
                small gatherings.
              </li>
              <li>
                <a href="/s?keyword=saltwater">Saltwater pools</a>{" "}
                for people with chlorine sensitivities or kids with eczema.
              </li>
            </ul>
            <p>
              Read the house rules before you book. Hosts list group size,
              whether glass is allowed, pet policy, music and noise cutoffs,
              parking, and what comes with the space (towels, restroom access,
              shade, grill, sound system). Photos tell the rest.
            </p>

            <h2>What is not included, and what to know</h2>
            <p>
              Real talk so you book with eyes open. A private pool rental is
              exclusive use of a stranger's backyard for a few hours, not a
              hotel resort:
            </p>
            <ul>
              <li>
                <strong>No lifeguard on site.</strong> Adults in your group are
                responsible for supervising swimmers. Bring an adult who knows
                how to swim.
              </li>
              <li>
                <strong>Pool depth varies.</strong> Many backyard pools are 3 to
                6 feet, not diving depth. Check the listing if you need deep
                water.
              </li>
              <li>
                <strong>Glass is usually prohibited.</strong> Most hosts ban
                glass containers in the pool area for safety. Bring plastic or
                cans.
              </li>
              <li>
                <strong>Restroom access varies.</strong> Some hosts offer a
                pool-house bathroom, others ask guests to use a designated
                indoor bathroom. Check before you book a long session.
              </li>
              <li>
                <strong>Weather is your risk.</strong> Hosts set their own
                cancellation windows. Read the policy on the listing before you
                book a date with iffy forecast.
              </li>
            </ul>

            <h2 id="how-it-works">How booking works</h2>
            <ol>
              <li>
                <strong>Search by city or address.</strong> Filter by date,
                group size, amenities, and price.
              </li>
              <li>
                <strong>Pick a slot and pay.</strong> Each listing shows the
                host's hourly rate, minimum hours, and available time slots.
              </li>
              <li>
                <strong>Host confirms.</strong> Most bookings confirm in under
                an hour. You get the address and house rules once confirmed.
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

            <h2>Find a private pool in your city</h2>
            <p>
              These metros have the deepest pool inventory on Pool Rental Near
              Me. Click your city for local listings and pricing:
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
              Browse <Link to="/p/all-locations">every US city with a private pool rental available</Link>{" "}
              for the full directory.
            </p>

            <h2>Frequently asked questions</h2>
            {FAQS.map((f) => (
              <div key={f.q}>
                <h3>{f.q}</h3>
                <p>{f.a}</p>
              </div>
            ))}
          </article>

          {/* Guest CTA */}
          <div className="not-prose my-12 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
            <h2 className="m-0 text-2xl font-semibold text-foreground">
              Ready to book a private pool?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
              Browse heated pools, hot tubs, and luxury backyards in your city.
              $2M liability coverage included on every booking.
            </p>
            <a
              href="/s"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              Find a private pool near you
            </a>
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
