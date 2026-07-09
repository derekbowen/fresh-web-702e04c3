import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { buildMeta, breadcrumbJsonLd, ldJsonScript, SITE_URL } from "@/lib/seo";
import heroImage from "@/assets/hero-pool-party.jpg";

const PATH = "/p/pool-party-rentals";
const TITLE = "Pool Party Rentals by the Hour | Pool Rental Near Me";
const DESCRIPTION =
  "Book a private backyard for your birthday, graduation, baby shower, or company offsite. Pool party rentals across America with $2M liability included.";
const LIST_HREF = "/l/draft/00000000-0000-0000-0000-000000000000/new/details";

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
    q: "How much do pool party rentals cost?",
    a: "Most backyard pool party rentals run $40 to $200 per hour depending on group size, amenities, and city. A small birthday for 10 guests usually books for $60 to $100 per hour. A 30-guest graduation or quinceañera with a heated pool and hot tub runs $120 to $200 per hour. Most listings have a two-hour minimum.",
  },
  {
    q: "How many guests can I bring to a pool party rental?",
    a: "Each host sets a maximum guest count, usually between 10 and 50 people. Filter listings by group size when you search. Going over the limit can get the booking cancelled, so pick a pool sized for your full group plus a few extra.",
  },
  {
    q: "Can I bring catering or hire a food truck?",
    a: "Most hosts allow outside catering and food trucks with advance notice. Glass containers are usually banned in the pool area, so plan for plastic or cans. Ask the host before booking if you plan to set up tents, bounce houses, or a DJ.",
  },
  {
    q: "Can I bring inflatables or a bounce house?",
    a: "Pool floats and inflatables are usually fine. Bounce houses, water slides, and anchored structures need host approval and yard space. Mention it in your booking request so the host can confirm.",
  },
  {
    q: "Is there a lifeguard at pool party rentals?",
    a: "No, there is no lifeguard on site. Adults in your group are responsible for supervising swimmers, especially when kids are present. Many cities have private lifeguard services that come to the pool. Pricing varies by city.",
  },
  {
    q: "What happens if it rains?",
    a: "Each host sets a cancellation and rain policy on their listing. Read the policy before you book a date with iffy weather. Many hosts offer free reschedule with 24 to 48 hours notice for weather.",
  },
  {
    q: "Can I book a pool party for under 3 hours?",
    a: "Most hosts require a two or three hour minimum. A few accept shorter bookings on weekday off-peak slots. Check the booking calendar on each listing for the host's minimum hours.",
  },
];

const PRICING_ROWS = [
  { tier: "Small gathering (5 to 15 guests)", range: "$40 to $75 / hour", note: "Birthdays, family swim, small showers" },
  { tier: "Mid-size party (16 to 30 guests)", range: "$75 to $120 / hour", note: "Graduations, quinceañeras, bachelorettes" },
  { tier: "Large party (31 to 50 guests)", range: "$120 to $200 / hour", note: "Company offsites, milestone birthdays" },
];

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Pool party rental",
  name: "Pool party rentals by the hour",
  description:
    "Hourly pool party rentals across America. Birthdays, graduations, baby showers, bachelorettes, and company offsites with $2M liability insurance included on every booking.",
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
    highPrice: "200",
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
  { name: "Pool party rentals", path: PATH },
]);

export const Route = createFileRoute("/p/pool-party-rentals")({
  component: PoolPartyRentalsPage,
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

function PoolPartyRentalsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={heroImage}
              alt="Backyard pool party at golden hour with guests gathered around the water"
              className="h-full w-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
          </div>
          <div className="relative mx-auto max-w-3xl px-4 py-20 text-center text-white sm:py-28">
            <nav className="mb-4 text-xs text-white/80">
              <Link to="/" className="hover:text-white">Home</Link>
              <span className="mx-1.5">/</span>
              <span>Pool party rentals</span>
            </nav>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Pool party rentals by the hour
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-white/90 sm:text-xl">
              Book a private backyard for your birthday, graduation, baby
              shower, or company offsite. Pool party rentals across America,
              hourly pricing, and $2M in liability coverage on every booking.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="/s?keyword=pool%20party"
                className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-lg transition hover:opacity-90"
              >
                Find a pool party rental near you
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
            <h2>Why people book pool party rentals</h2>
            <p>
              Hosting a party at home means cleaning the house, parking traffic
              on your street, and hoping the weather plays nice. Booking a
              backyard at a public park means permits, shared space, and a
              two-hour window. Pool party rentals solve both. You get a private
              backyard with a pool, hot tub, seating, and shade for a few
              hours. You bring the people, the food, and the music. When the
              party ends you go home, and someone else cleans up.
            </p>
            <p>
              Most pool party rentals on Pool Rental Near Me cost $40 to $200
              per hour depending on group size, amenities, and city. Hosts set
              their own pricing, minimum hours, and house rules. You pay a flat
              10% guest service fee on top of the hourly rate. Hosts keep 90%
              of every booking. We eat the credit card processing fees, so 90%
              means 90%.
            </p>

            <h2>Party types that work great in a backyard pool</h2>

            <h3>Birthday parties</h3>
            <p>
              Kid birthdays, adult milestone birthdays, and surprise parties
              all run well in a backyard with a pool. A two or three hour
              booking covers swim time, cake, and presents without rushing.
              Pick a host with shaded seating if you have grandparents or
              little kids who need to step out of the sun.
            </p>

            <h3>Graduations, sweet 16s, and quinceañeras</h3>
            <p>
              These need space for 20 to 50 guests, room for a DJ or playlist
              setup, and somewhere to take photos. Filter for backyards with a
              pool deck, outdoor sound system, and a lawn area for tables.
              Three to four hour bookings are typical.
            </p>

            <h3>Baby showers and bridal showers</h3>
            <p>
              Daytime, mid-sized, and photo-friendly. A heated pool extends the
              shower season into spring and fall. Look for listings with a
              covered patio so food and gifts stay out of the sun.
            </p>

            <h3>Bachelorette weekends</h3>
            <p>
              Group photos, day drinking, and pool floats. Pick a host that
              allows music and check the noise cutoff before booking. Many
              hosts allow extended afternoon bookings on Saturdays.
            </p>

            <h3>Company offsites and team events</h3>
            <p>
              Quarterly team gatherings, small holiday parties, and client
              appreciation days work well in a backyard pool setting. Most
              hosts welcome catering and food trucks with advance notice. Ask
              about parking for larger teams.
            </p>

            <h3>Content shoots and influencer days</h3>
            <p>
              Music videos, influencer content, brand shoots, and product
              photography. Commercial shoots require host approval upfront, so
              note it in your booking request. Two to four hour blocks are
              typical, and hosts usually charge a small commercial premium.
            </p>

            <h2>What a pool party rental costs</h2>
            <p>
              Pricing scales with group size and amenities. These ranges hold
              across most cities on the marketplace:
            </p>
            <div className="not-prose my-8 overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Tier</th>
                    <th className="px-4 py-3 text-left font-semibold">Hourly range</th>
                    <th className="px-4 py-3 text-left font-semibold">Best for</th>
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
              Weekends and holidays cost more than weekday afternoons. If your
              date is flexible, a Friday afternoon booking can run 20% to 30%
              less than the same slot on Saturday.
            </p>

            <h2>What to filter for when you search</h2>
            <ul>
              <li>
                <a href="/s?keyword=heated">Heated pools</a>{" "}
                so cool mornings and shoulder-season dates still work.
              </li>
              <li>
                <a href="/s?keyword=hot%20tub">Hot tub listings</a>{" "}
                for bachelorettes, anniversaries, and adult-only parties.
              </li>
              <li>
                <a href="/s?keyword=saltwater">Saltwater pools</a>{" "}
                for guests with chlorine sensitivities or kids with eczema.
              </li>
            </ul>
            <p>
              Read each listing's house rules before you book. Hosts spell out
              maximum guest count, music cutoff time, whether glass is allowed,
              pet policy, parking, and what comes with the space.
            </p>

            <h2>What is not included</h2>
            <p>
              A pool party rental is exclusive use of a private backyard for a
              few hours. Things to plan for separately:
            </p>
            <ul>
              <li>
                <strong>Food and drink.</strong> Bring your own or hire
                catering. Most hosts allow outside food. Glass is usually
                banned in the pool area.
              </li>
              <li>
                <strong>Lifeguard.</strong> Not included. Adults in your group
                supervise swimmers. Bring a designated water-watcher when kids
                are present.
              </li>
              <li>
                <strong>Music cutoff.</strong> Most cities have noise
                ordinances. Hosts typically cut amplified music at 9 or 10pm.
                Check the listing before you hire a DJ.
              </li>
              <li>
                <strong>Trash and cleanup.</strong> Bag your trash, leave the
                space the way you found it. Some hosts charge a cleaning fee
                if the yard is left a mess.
              </li>
              <li>
                <strong>Inflatables and bounce houses.</strong> Pool floats
                are fine. Anything anchored to the yard needs host approval.
              </li>
              <li>
                <strong>Weather.</strong> Each host sets their own rain and
                cancellation policy. Read it before booking a date with iffy
                forecast.
              </li>
            </ul>

            <h2 id="how-it-works">How booking a pool party works</h2>
            <ol>
              <li>
                <strong>Search by city.</strong>{" "}
                <a href="/s?keyword=pool%20party">Browse pool party listings</a>{" "}
                near you and filter by date, group size, and amenities.
              </li>
              <li>
                <strong>Pick a slot and submit.</strong> Each listing shows the
                host's hourly rate, minimum hours, and available time blocks.
              </li>
              <li>
                <strong>Host confirms.</strong> Most bookings confirm in under
                an hour. You get the address and house rules once confirmed.
              </li>
              <li>
                <strong>Show up, swim, party.</strong> Stay within your booked
                window. Respect house rules and the music cutoff.
              </li>
              <li>
                <strong>Pack out, rate your host.</strong> Bag your trash and
                head home. Every booking carries $2M in liability coverage at
                no extra cost.
              </li>
            </ol>

            <h2>Pool party rentals in your city</h2>
            <p>
              These metros have the deepest party-friendly inventory on Pool
              Rental Near Me. Click your city for local listings and pricing:
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
              Looking for a quieter, smaller booking instead of a party? See{" "}
              <Link to="/p/private-pool-rental">private pool rental by the hour</Link>{" "}
              for family swims, date afternoons, and therapy sessions. Browse{" "}
              <Link to="/p/all-locations">every US city with pools available</Link>{" "}
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
              Ready to book a pool party rental?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
              Browse party-friendly backyards in your city. $2M liability
              coverage included on every booking.
            </p>
            <a
              href="/s?keyword=pool%20party"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              Find a pool party rental near you
            </a>
          </div>

          {/* Host CTA */}
          <div className="not-prose my-12 rounded-2xl border border-border bg-muted/40 p-6">
            <h2 className="m-0 text-xl font-semibold text-foreground">
              Have a pool? Host parties and earn
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Hosts who allow parties earn $2,000 to $10,000 a month renting
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
