import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import {
  buildMeta,
  breadcrumbJsonLd,
  ldJsonScript,
  SITE_URL,
} from "@/lib/seo";
import heroImage from "@/assets/host-pro-hero.jpg";

const PATH = "/p/free-host-tools";
const APP_URL = "https://hostpro.poolrentalnearme.com/";
const TITLE = "Host Pro — Free Tools for Pool Hosts | Pool Rental Near Me";
const DESCRIPTION =
  "Free app for pool hosts: smart pricing, booking calendar, guest screening, waivers, earnings tracker, and tax-ready reports. No subscription, no credit card.";

const TOOLS = [
  {
    title: "Smart Pricing",
    body: "See what comparable pools in your zip code charge by hour, day, and season — and get suggested rates that maximize bookings.",
  },
  {
    title: "Booking Calendar",
    body: "Sync availability across PRNM and Swimply in one calendar. Block dates, set buffer times, and avoid double-bookings automatically.",
  },
  {
    title: "Guest Screening",
    body: "Run lightweight checks on guests before approving — verified phone, ID, payment method, and prior host reviews.",
  },
  {
    title: "Digital Waivers",
    body: "Send a liability waiver for every booking. Guests sign on their phone before arrival. PDF stored in your dashboard.",
  },
  {
    title: "Earnings Tracker",
    body: "Real-time payout dashboard. See gross bookings, fees, net deposits, and projected monthly income on one screen.",
  },
  {
    title: "Tax-Ready Reports",
    body: "Export 1099-K and Schedule E friendly summaries every January. Mileage, supplies, and depreciation tracking included.",
  },
  {
    title: "Auto Messaging",
    body: "Templated check-in instructions, gate codes, and review-request follow-ups send automatically at the right time.",
  },
  {
    title: "Damage Claims",
    body: "File a claim in 60 seconds with photos. Claims sync with PRNM's $2M liability coverage on every booking.",
  },
];

export const Route = createFileRoute("/p/free-host-tools")({
  head: () => {
    const meta = buildMeta({
      title: TITLE,
      description: DESCRIPTION,
      path: PATH,
      type: "website",
      image: `${SITE_URL}${heroImage}`,
    });
    return {
      meta: meta.meta,
      links: meta.links,
      scripts: [
        ldJsonScript(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Free Host Tools", path: PATH },
          ]),
        ),
        ldJsonScript({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Host Pro by Pool Rental Near Me",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          url: APP_URL,
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.8",
            ratingCount: "127",
          },
        }),
      ],
    };
  },
  component: FreeHostToolsPage,
});

function FreeHostToolsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <img
            src={heroImage}
            alt="Host Pro app dashboard shown on laptop and phone next to a backyard pool"
            width={1600}
            height={896}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/40" />
          <div className="relative mx-auto max-w-6xl px-4 py-24 sm:py-32">
            <div className="max-w-2xl">
              <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                Free App · No Credit Card
              </div>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
                Host Pro — free tools for{" "}
                <span className="text-primary">pool hosts</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                Pricing intelligence, unified calendar, guest screening,
                waivers, payouts, and tax reports — everything you need to run
                your pool rental like a pro. Free forever for PRNM hosts.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={APP_URL}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90"
                >
                  Open Host Pro →
                </a>
                <a
                  href="/auth"
                  className="inline-flex items-center justify-center rounded-full border border-border bg-background/80 px-6 py-3 text-base font-semibold text-foreground backdrop-blur transition hover:bg-muted"
                >
                  Create free account
                </a>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Live at{" "}
                <a
                  href={APP_URL}
                  target="_blank"
                  rel="noopener"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  hostpro.poolrentalnearme.com
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Tools grid */}
        <section className="mx-auto max-w-6xl px-4 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Eight tools. One app. Zero cost.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Built by pool hosts, for pool hosts. Replaces $200+/mo of
              standalone tools.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TOOLS.map((t) => (
              <div
                key={t.title}
                className="rounded-2xl border border-border bg-card p-6 transition hover:border-primary/40 hover:shadow-lg"
              >
                <h3 className="text-base font-semibold text-foreground">
                  {t.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{t.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 py-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Ready to host smarter?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Host Pro is free for every Pool Rental Near Me host. Open the
              app and connect your listing in under two minutes.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href={APP_URL}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90"
              >
                Launch Host Pro
              </a>
              <a
                href="/p/hosting"
                className="inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-base font-semibold text-foreground transition hover:bg-muted"
              >
                Become a host
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
