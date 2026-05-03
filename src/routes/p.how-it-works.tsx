import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { Breadcrumbs } from "@/components/listing-card";
import {
  buildMeta,
  breadcrumbJsonLd,
  ldJsonScript,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";

/**
 * Dedicated /p/how-it-works route. Hand-authored, SEO-optimized landing page
 * for the "how it works" query cluster. Takes precedence over the dynamic
 * /p/$slug dispatcher (TanStack matches static segments first), so this is
 * what serves on poolrentalnearme.com/p/how-it-works.
 *
 * SEO surface:
 *  - Title <60 chars, meta desc <160 chars
 *  - One H1, semantic H2/H3 outline
 *  - JSON-LD: Article, HowTo (guest), HowTo (host), FAQPage, BreadcrumbList
 *  - Internal links to /p/become-a-pool-host, /amenities, /public-pools
 *  - og:image set to homepage hero
 */

const PATH = "/p/how-it-works";
const TITLE = "How It Works — Rent or List a Pool by the Hour";
const DESCRIPTION =
  "Book a private pool by the hour or list yours to earn. See how Pool Rental Near Me handles search, payments, $2M insurance, and payouts in 3 steps.";

const GUEST_STEPS = [
  {
    name: "Search pools near you",
    text: "Enter your city, ZIP, or address. Filter by date, group size, hot tub, slides, restrooms, shade, Wi-Fi, and pet-friendly. Every listing shows photos, host reviews, house rules, and clear hourly pricing.",
  },
  {
    name: "Book by the hour",
    text: "Pick your date and time window. Booking is fully online — no phone tag, no haggling. You'll see the total upfront, including cleaning or extra-guest fees. Payment is held securely; the host is only paid after your swim.",
  },
  {
    name: "Show up and swim",
    text: "Once confirmed, you get the address and check-in details. Arrive on time, enjoy the pool with your group, and leave it the way you found it. Drop a review afterward to help future guests.",
  },
];

const HOST_STEPS = [
  {
    name: "List your pool for free",
    text: "Create your listing in under 15 minutes. Add photos, set your hourly rate, choose your availability calendar, and write your house rules. Our team reviews every listing before it goes live.",
  },
  {
    name: "Welcome guests on your schedule",
    text: "You stay in full control. Approve or decline requests, block off dates, and adjust pricing for weekends, holidays, or peak summer. Most active hosts earn $1,500–$5,000 per month in season.",
  },
  {
    name: "Get paid automatically",
    text: "Payouts deposit to your bank within 24 hours of each completed booking. We handle payment processing, tax documents, and guest messaging tools.",
  },
];

const FAQS = [
  {
    q: "How much does it cost to rent a pool?",
    a: "Hourly rates are set by each host and typically range from $40 to $150 per hour, depending on pool size, amenities, and location. The booking total includes any cleaning fee and extra-guest fees, shown upfront before you confirm.",
  },
  {
    q: "Is the pool insured during my booking?",
    a: "Yes. Every Pool Rental Near Me booking includes up to $2 million in liability protection at no extra cost — covering both the host's property and guests during the rental window.",
  },
  {
    q: "How do I know the pool is clean and safe?",
    a: "Hosts are required to maintain water chemistry and clean the deck before each booking. Listings show recent guest reviews and photos. If something is wrong on arrival, contact our 24/7 support team for a refund or rebooking.",
  },
  {
    q: "Can I cancel a booking?",
    a: "Yes. Cancellation policies are set per listing (flexible, moderate, or strict) and shown on the listing page. Most flexible listings refund in full up to 24 hours before your booking starts.",
  },
  {
    q: "How much can I earn renting out my pool?",
    a: "Earnings depend on your area, amenities, photos, and availability. Most active hosts earn $1,500–$5,000 per month during pool season; top hosts in busy markets clear $10,000+ per month.",
  },
  {
    q: "What does it cost to list my pool?",
    a: "Listing is free. Pool Rental Near Me charges a flat host service fee on completed bookings — no monthly fees, no setup costs, no upfront payment.",
  },
  {
    q: "Do I need a permit to host pool rentals?",
    a: "Some cities require a short-term-use or home-occupation permit. Requirements vary by jurisdiction. Our Host Academy walks you through how to research your local rules before listing.",
  },
];

export const Route = createFileRoute("/p/how-it-works" as any)({
  head: () => {
    const meta = buildMeta({
      title: TITLE,
      description: DESCRIPTION,
      path: PATH,
      type: "article",
    });

    const article = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "How Pool Rental Near Me Works",
      description: DESCRIPTION,
      author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      publisher: {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/og-default.jpg` },
      },
      mainEntityOfPage: `${SITE_URL}${PATH}`,
      inLanguage: "en",
    };

    const guestHowTo = {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: "How to book a private pool by the hour",
      description:
        "Find, book, and enjoy a private pool rental in three steps with Pool Rental Near Me.",
      totalTime: "PT5M",
      step: GUEST_STEPS.map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: s.name,
        text: s.text,
      })),
    };

    const hostHowTo = {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: "How to list your pool and earn",
      description:
        "List your backyard pool for free and start earning from hourly rentals in three steps.",
      totalTime: "PT15M",
      step: HOST_STEPS.map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: s.name,
        text: s.text,
      })),
    };

    const faqLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };

    return {
      ...meta,
      scripts: [
        ldJsonScript(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "How It Works", path: PATH },
          ]),
        ),
        ldJsonScript(article),
        ldJsonScript(guestHowTo),
        ldJsonScript(hostHowTo),
        ldJsonScript(faqLd),
      ],
    };
  },
  component: HowItWorksPage,
});

function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
          <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <Breadcrumbs
              items={[
                { name: "Home", path: "/" },
                { name: "How It Works", path: PATH },
              ]}
            />
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              How Pool Rental Near Me Works
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Book a private backyard pool by the hour for a birthday, family
              swim, photoshoot, or quiet afternoon — or turn your own pool into
              a stream of income. Every booking is paid securely and protected
              by up to $2&nbsp;million in liability insurance.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/s"
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                Find a pool near you
              </a>
              <a
                href="/p/become-a-pool-host"
                className="inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-base font-semibold text-foreground transition hover:bg-muted"
              >
                List your pool
              </a>
            </div>
          </div>
        </section>

        {/* Guests */}
        <section className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            For guests — book a pool in 3 steps
          </h2>
          <p className="mt-3 max-w-3xl text-base text-muted-foreground">
            No memberships, no crowded public pools, no scheduling headaches.
            Pick a pool, book a window, show up.
          </p>
          <ol className="mt-8 grid gap-6 sm:grid-cols-3">
            {GUEST_STEPS.map((s, i) => (
              <li
                key={s.name}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                  {i + 1}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {s.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {s.text}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-10 rounded-2xl border border-border bg-muted/40 p-6">
            <h3 className="text-lg font-semibold text-foreground">
              Every booking includes
            </h3>
            <ul className="mt-4 grid gap-2 text-sm text-foreground sm:grid-cols-2">
              <li>✓ Secure online payment with funds held until your swim</li>
              <li>✓ Host-verified listings with real guest reviews</li>
              <li>✓ 24/7 support team for any issue on arrival</li>
              <li>✓ Up to $2M liability protection on every booking</li>
            </ul>
          </div>
        </section>

        {/* Hosts */}
        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              For hosts — earn with your pool
            </h2>
            <p className="mt-3 max-w-3xl text-base text-muted-foreground">
              Most active hosts earn $1,500–$5,000 per month during pool
              season. You stay in full control of your calendar, your pricing,
              and your house rules.
            </p>
            <ol className="mt-8 grid gap-6 sm:grid-cols-3">
              {HOST_STEPS.map((s, i) => (
                <li
                  key={s.name}
                  className="rounded-2xl border border-border bg-background p-6 shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                    {i + 1}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">
                    {s.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {s.text}
                  </p>
                </li>
              ))}
            </ol>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/p/become-a-pool-host"
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                Start hosting
              </a>
              <Link
                to="/academy"
                className="inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-base font-semibold text-foreground transition hover:bg-muted"
              >
                Free Host Academy
              </Link>
            </div>
          </div>
        </section>

        {/* Trust / safety */}
        <section className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Safety, insurance &amp; payments
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground">
                $2M liability insurance
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Every booking includes up to $2 million in third-party
                liability protection — included for hosts and guests at no
                extra cost.
              </p>
            </div>
            <div className="rounded-2xl border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground">
                Secure payments
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Payments are processed through PCI-compliant rails. Funds are
                held until the booking is complete, then released to the host
                within 24 hours.
              </p>
            </div>
            <div className="rounded-2xl border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground">
                Verified hosts &amp; reviews
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Hosts are reviewed before listings go live. Public guest
                reviews keep the marketplace honest and help you choose the
                right pool.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Pricing &amp; fees
            </h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-background p-6">
                <h3 className="text-lg font-semibold text-foreground">
                  Guests
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  You pay the hourly rate set by the host plus any cleaning
                  fee, extra-guest fees, and a small service fee. The total is
                  always shown upfront before you confirm.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-background p-6">
                <h3 className="text-lg font-semibold text-foreground">Hosts</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Listing is free. We charge a flat service fee on completed
                  bookings — no monthly fees, no setup costs. You keep control
                  of your hourly rate and calendar.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Explore */}
        <section className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Explore the marketplace
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <a
              href="/s"
              className="group rounded-2xl border border-border p-5 transition hover:border-primary hover:shadow-sm"
            >
              <h3 className="text-base font-semibold text-foreground group-hover:text-primary">
                Browse all pool rentals →
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Search the full marketplace by city, date, and amenities.
              </p>
            </a>
            <a
              href="/amenities"
              className="group rounded-2xl border border-border p-5 transition hover:border-primary hover:shadow-sm"
            >
              <h3 className="text-base font-semibold text-foreground group-hover:text-primary">
                Pools by amenity →
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Heated, hot tub, pet-friendly, slides, lap, and more.
              </p>
            </a>
            <a
              href="/p/become-a-pool-host"
              className="group rounded-2xl border border-border p-5 transition hover:border-primary hover:shadow-sm"
            >
              <h3 className="text-base font-semibold text-foreground group-hover:text-primary">
                Become a host →
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Earn from your backyard pool with full insurance coverage.
              </p>
            </a>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border">
          <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Frequently asked questions
            </h2>
            <dl className="mt-8 space-y-6">
              {FAQS.map((f) => (
                <div
                  key={f.q}
                  className="rounded-2xl border border-border p-5"
                >
                  <dt className="text-base font-semibold text-foreground">
                    {f.q}
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {f.a}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-12 flex flex-wrap gap-3">
              <a
                href="/s"
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                Find a pool near you
              </a>
              <a
                href="/p/become-a-pool-host"
                className="inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-base font-semibold text-foreground transition hover:bg-muted"
              >
                List your pool
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
