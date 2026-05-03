import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import {
  buildMeta,
  breadcrumbJsonLd,
  ldJsonScript,
  SITE_URL,
} from "@/lib/seo";
import heroImage from "@/assets/hosting-hero.jpg";

/**
 * Dedicated /p/hosting route. Hand-authored, SEO-optimized hub page for the
 * "become a pool host" query cluster. Takes precedence over the dynamic
 * /p/$slug dispatcher (TanStack matches static segments first).
 */

const PATH = "/p/hosting";
const TITLE = "Become a Pool Host — Earn $1,500–$5,000/mo Renting Your Pool";
const DESCRIPTION =
  "List your backyard pool by the hour. Keep 90% — flat 10% fee, $2M liability coverage included, payouts within 24 hours. Free to list.";

const STEPS = [
  {
    n: "1",
    title: "Create your free listing",
    body: "Photos, hourly rate, availability calendar, and house rules — under 15 minutes. Our team reviews every pool before it goes live to keep quality high for guests.",
  },
  {
    n: "2",
    title: "Approve bookings on your schedule",
    body: "You stay in full control. Auto-approve trusted guests or review every request. Block off dates anytime, raise prices on weekends and holidays, set minimum group sizes.",
  },
  {
    n: "3",
    title: "Get paid in 24 hours",
    body: "Direct deposit to your bank within 24 hours of each booking ending. We handle payments, taxes (1099-K), and guest messaging — you just host.",
  },
];

const WHY = [
  {
    title: "Keep 90% of every booking",
    body: "Flat 10% host fee — the lowest in pool sharing. Swimply takes 15%+. On a $200 booking, you keep $180. Over a season that's thousands more in your pocket.",
  },
  {
    title: "$2M liability coverage included",
    body: "Every booking is automatically protected by up to $2 million in third-party liability insurance, included in the host fee. No add-ons, no separate premium.",
  },
  {
    title: "You control everything",
    body: "Your pool, your rules. Set your hours, group size limits, pet policy, alcohol policy, and house rules. Decline any request without explanation.",
  },
  {
    title: "Real demand, real bookings",
    body: "We drive guests to your listing through 5,100+ SEO pages, paid search, and partnerships. Active hosts in summer markets average 8–20 bookings per month.",
  },
];

const EARNINGS = [
  { rate: "$50/hr", monthly: "$1,500", desc: "Smaller pool, weekends only" },
  { rate: "$85/hr", monthly: "$3,400", desc: "Average pool, 4 days/week" },
  { rate: "$125/hr", monthly: "$6,000+", desc: "Premium pool with hot tub & shade" },
];

const FAQS = [
  {
    q: "How much does it cost to list my pool?",
    a: "Listing is 100% free. There are no monthly fees, setup costs, or upfront payments. Pool Rental Near Me only earns when you do — we charge a flat 10% host service fee on completed bookings.",
  },
  {
    q: "How is my pool insured?",
    a: "Every booking includes up to $2 million in third-party liability insurance, automatically applied to the rental window at no extra cost. This covers guest injury claims and property damage caused by guests during the booking.",
  },
  {
    q: "How much can I realistically earn?",
    a: "Earnings depend on your area, amenities, photos, and availability. Most active hosts earn $1,500–$5,000 per month during pool season. Hosts in busy summer markets with premium pools (hot tub, shade, restroom) regularly clear $8,000–$10,000+ per month.",
  },
  {
    q: "Do I need a permit to host pool rentals?",
    a: "Some cities require a short-term-use permit, home-occupation permit, or business license. Requirements vary widely. Our Host Academy has city-by-city research guides, and we publish state-level legality summaries for all 50 states.",
  },
  {
    q: "What happens if a guest damages my pool or property?",
    a: "Report the damage within 24 hours of the booking ending. Our claims team works with the included $2M liability coverage to assess and reimburse legitimate damage claims. We also hold guest payment for 24 hours after each booking as an additional buffer.",
  },
  {
    q: "Who is allowed to book my pool?",
    a: "All guests verify a phone number, email, and payment method. You can require ID verification, set a minimum age, and require a security deposit. You can decline any booking request without giving a reason.",
  },
  {
    q: "When and how do I get paid?",
    a: "Payouts deposit to your linked bank account within 24 hours of each booking ending. We send a 1099-K at year end if you cross the IRS threshold ($5,000 in 2025). All earnings are tracked in your host dashboard.",
  },
  {
    q: "Can I block off dates I don't want to host?",
    a: "Yes — your calendar is fully under your control. Block individual hours, full days, or entire weeks. Many hosts only open weekends, or block off when family is using the pool.",
  },
];

export const Route = createFileRoute("/p/hosting")({
  head: () => {
    const meta = buildMeta({
      title: TITLE,
      description: DESCRIPTION,
      path: PATH,
      type: "article",
      image: `${SITE_URL}${heroImage}`,
    });
    return {
      meta: meta.meta,
      links: meta.links,
      scripts: [
        ldJsonScript(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Become a Pool Host", path: PATH },
          ]),
        ),
        ldJsonScript({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
        ldJsonScript({
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "How to become a pool host",
          description:
            "Three steps to list your backyard pool on Pool Rental Near Me and start earning.",
          step: STEPS.map((s, i) => ({
            "@type": "HowToStep",
            position: i + 1,
            name: s.title,
            text: s.body,
          })),
        }),
      ],
    };
  },
  component: HostingPage,
});

function HostingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <img
            src={heroImage}
            alt="Backyard swimming pool at golden hour with patio furniture"
            width={1600}
            height={900}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
          <div className="relative mx-auto max-w-6xl px-4 py-24 sm:py-32">
            <div className="max-w-2xl">
              <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                For Pool Owners
              </div>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
                Turn your pool into{" "}
                <span className="text-primary">$1,500–$5,000/month</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                List your backyard pool by the hour. Keep 90% of every booking,
                set your own schedule, and get paid in 24 hours — with $2M in
                liability coverage included on every reservation.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/auth"
                  className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90"
                >
                  List my pool — it's free
                </a>
                <Link
                  to="/p/$slug"
                  params={{ slug: "earnings-calculator" }}
                  className="inline-flex items-center justify-center rounded-full border border-border bg-background/80 px-6 py-3 text-base font-semibold text-foreground backdrop-blur transition hover:bg-muted"
                >
                  Estimate my earnings →
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="text-primary">✓</span> Free to list
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-primary">✓</span> 10% flat fee
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-primary">✓</span> $2M coverage
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-primary">✓</span> 24-hr payouts
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Earnings table */}
        <section className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            What hosts actually earn
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Real monthly take-home for hosts in active pool markets, after the
            10% platform fee. Adjust your rate, hours, and amenities to match.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {EARNINGS.map((e) => (
              <div
                key={e.rate}
                className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm"
              >
                <div className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  {e.rate}
                </div>
                <div className="mt-2 text-4xl font-bold text-primary">
                  {e.monthly}
                </div>
                <div className="mt-3 text-sm text-muted-foreground">
                  {e.desc}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section className="bg-muted/30 py-16">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              How it works
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {STEPS.map((s) => (
                <div key={s.n} className="rounded-2xl bg-card p-6 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                    {s.n}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why */}
        <section className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Why hosts choose Pool Rental Near Me
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {WHY.map((w) => (
              <div
                key={w.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-foreground">
                  {w.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{w.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Comparison */}
        <section className="bg-muted/30 py-16">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Pool Rental Near Me vs. Swimply
            </h2>
            <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">
                      Feature
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-primary">
                      PRNM
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      Swimply
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ["Host service fee", "10% flat", "15%+"],
                    ["Liability coverage", "$2M included", "$1M"],
                    ["Payout speed", "24 hours", "2–5 days"],
                    ["Listing fee", "Free", "Free"],
                    ["Host control over guests", "Full approval", "Auto-approve default"],
                  ].map(([label, prnm, sw]) => (
                    <tr key={label}>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {label}
                      </td>
                      <td className="px-4 py-3 font-semibold text-primary">
                        {prnm}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{sw}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Host FAQ
          </h2>
          <div className="mt-8 space-y-3">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="group rounded-xl border border-border bg-card p-5 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between text-base font-semibold text-foreground">
                  {f.q}
                  <span className="ml-4 text-primary transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Ready to start earning?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Free to list. No monthly fees. Be live in 15 minutes.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href="/auth"
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90"
              >
                List my pool
              </a>
              <Link
                to="/referral"
                className="inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-base font-semibold text-foreground transition hover:bg-muted"
              >
                Or refer a host →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
