import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { Breadcrumbs } from "@/components/listing-card";
import { AutoLinkedContent } from "@/components/auto-linked-content";
import { NearbyCities } from "@/components/nearby-cities";
import { FaqBlock } from "@/components/faq-block";
import { EarningsCalculator } from "@/components/earnings-calculator";
import { faqsForContentPage } from "@/lib/page-faqs";
import { buildHostCityGuide } from "@/lib/host-city-guide";
import type { ContentPage } from "@/server/content-pages.functions";
import type { NearbyCity } from "@/server/nearby-cities.functions";
import type { CityRow } from "@/server/cities.functions";

/**
 * Premium Airbnb-style template for /p/become-a-pool-host-{city}-{state}.
 * Hero sells the income upside in the host's own city, then walks them
 * through earnings → leadership/why-PRNM → live calculator → local guide
 * → nearby cities → FAQ → final CTA. Sticky mobile CTA always visible.
 */
export function HostAcqCityTemplate({
  page,
  nearbyCities = [],
  city = null,
}: {
  page: ContentPage;
  nearbyCities?: NearbyCity[];
  city?: CityRow | null;
}) {
  const title = page.title || page.seo_title || "Become a pool host";
  const description = page.seo_description || page.description || null;
  const body = page.body_markdown || page.content || null;
  const faqs = faqsForContentPage(page);
  const guide = city ? buildHostCityGuide(city) : null;
  const cityName = city?.name || "your city";
  const stateCode = (city?.state_code || "").toUpperCase();
  const tier = guide?.cityTier ?? "standard";
  const hourlyRate = guide?.defaultHourlyRate ?? 75;

  // Tier-tuned monthly earnings band (gross, before 10% fee)
  const lo = Math.round(hourlyRate * 8 * 4); // ~8 hrs/wk
  const hi = Math.round(hourlyRate * 18 * 4); // ~18 hrs/wk
  const earningsBand = `$${lo.toLocaleString()}–$${hi.toLocaleString()}+`;

  const tierLabel =
    tier === "premium"
      ? `${cityName} is a top-tier U.S. pool rental market`
      : tier === "emerging"
        ? `${cityName} is wide open — early hosts have first-mover advantage`
        : `${cityName} has steady, growing pool rental demand`;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 pb-24 lg:pb-0">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-border">
          {page.hero_image_url && (
            <>
              <img
                src={page.hero_image_url}
                alt={`${cityName} backyard pool`}
                className="absolute inset-0 h-full w-full object-cover"
                loading="eager"
                fetchPriority="high"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" />
            </>
          )}
          {!page.hero_image_url && (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-accent/20" />
          )}

          <div className="relative mx-auto max-w-6xl px-4 pt-10 sm:px-6 lg:px-8">
            <Breadcrumbs
              items={[
                { name: "Home", path: "/" },
                { name: "Become a host", path: "/p/hosting" },
                { name: title, path: page.url_path },
              ]}
            />
          </div>

          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-5 lg:px-8 lg:py-28">
            <div className="lg:col-span-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {stateCode ? `${cityName}, ${stateCode}` : cityName} · For pool owners
              </div>
              <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Rent your {cityName} pool by the hour.{" "}
                <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Earn {earningsBand}/mo.
                </span>
              </h1>
              {description ? (
                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                  {description}
                </p>
              ) : (
                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                  Join the homeowners turning their backyard into income on
                  Pool Rental Near Me — the fastest-growing hourly pool
                  marketplace, with the lowest host fee in the industry.
                </p>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/auth"
                  className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-lg transition hover:opacity-90"
                >
                  List my pool — it's free
                </a>
                <a
                  href="#calculator"
                  className="inline-flex items-center justify-center rounded-full border border-border bg-background/80 px-7 py-3.5 text-base font-semibold text-foreground backdrop-blur transition hover:bg-muted"
                >
                  Estimate my income →
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="text-primary">✓</span> 10% flat fee
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-primary">✓</span> $2M coverage included
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-primary">✓</span> Paid in 24 hours
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-primary">✓</span> Live in 15 min
                </span>
              </div>
            </div>

            {/* Floating earnings card */}
            <div className="lg:col-span-2">
              <div className="rounded-3xl border border-border bg-card/95 p-6 shadow-2xl backdrop-blur">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Typical {cityName} host earns
                </div>
                <div className="mt-1 text-4xl font-bold text-foreground">
                  ${(hourlyRate * 12 * 4).toLocaleString()}
                  <span className="text-lg font-medium text-muted-foreground">
                    /mo
                  </span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  at ~${hourlyRate}/hr · 12 booked hrs/week
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-5 text-center">
                  <Stat label="Host fee" value="10%" sub="vs 15%+" />
                  <Stat label="Coverage" value="$2M" sub="included" />
                  <Stat label="Payout" value="24h" sub="direct" />
                </div>
                <a
                  href="#calculator"
                  className="mt-5 block w-full rounded-full bg-foreground px-4 py-2.5 text-center text-sm font-semibold text-background transition hover:opacity-90"
                >
                  Run my own numbers
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* LEADERSHIP / WHY PRNM */}
        <section className="border-b border-border bg-muted/20 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                Why {cityName} hosts pick PRNM
              </div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                The leader in hourly pool rentals — built for hosts, not
                investors.
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {tierLabel}. We give you more of every booking, real liability
                coverage, and payouts before your skimmer's even dry.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <Pillar
                kicker="Lowest fee"
                title="Keep 90%"
                body="Flat 10% host fee. Swimply takes 15%+ once you stack their host fee, guest fee, and processing. On a $200 booking that's real money — every time."
              />
              <Pillar
                kicker="Real protection"
                title="$2M liability"
                body="Every booking is auto-covered up to $2 million in third-party liability. No add-ons, no separate premium, no fine print games."
              />
              <Pillar
                kicker="Fast money"
                title="24-hour payouts"
                body="Direct deposit within 24 hours of each booking ending. Most platforms hold for 2–5 days. We trust our hosts."
              />
              <Pillar
                kicker="You're in charge"
                title="Total host control"
                body="Approve every guest. Block any date. Set your rules — group size, pets, alcohol, age minimums. Decline anyone, no explanation needed."
              />
            </div>
          </div>
        </section>

        {/* COMPARISON */}
        <section className="border-b border-border py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              On a $200 booking in {cityName}, you keep more with PRNM.
            </h2>
            <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-5 py-4 text-left font-semibold text-foreground">
                      Feature
                    </th>
                    <th className="px-5 py-4 text-left font-semibold text-primary">
                      Pool Rental Near Me
                    </th>
                    <th className="px-5 py-4 text-left font-semibold text-muted-foreground">
                      Swimply
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ["Host service fee", "10% flat", "15%+"],
                    ["You take home on $200", "$180", "≈ $170 or less"],
                    ["Liability coverage", "$2M included", "$1M"],
                    ["Payout speed", "24 hours", "2–5 days"],
                    ["Listing fee", "Free", "Free"],
                    ["Guest approval", "Full host approval", "Auto-approve default"],
                  ].map(([label, prnm, sw]) => (
                    <tr key={label}>
                      <td className="px-5 py-3.5 font-medium text-foreground">
                        {label}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-primary">
                        {prnm}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">{sw}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CALCULATOR */}
        <section
          id="calculator"
          className="scroll-mt-20 border-b border-border bg-muted/20 py-16 sm:py-20"
        >
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                {cityName} earnings calculator
              </div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Run the numbers for your pool.
              </h2>
              <p className="mt-3 text-muted-foreground">
                Move the sliders to see what your {cityName} pool could pull
                in across a season. Defaults are pre-tuned to local pricing.
              </p>
            </div>
            <div className="mt-8">
              <EarningsCalculator
                cityName={cityName}
                defaultHourlyRate={hourlyRate}
              />
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="border-b border-border py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              From sign-up to first booking — usually under a week.
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                {
                  n: "01",
                  title: "List in 15 minutes",
                  body: `Photos, hourly rate, calendar, house rules. Our team reviews every ${cityName} pool before going live.`,
                },
                {
                  n: "02",
                  title: "Approve guests on your terms",
                  body: "Auto-approve trusted guests or hand-approve every request. Block dates anytime, raise weekend prices.",
                },
                {
                  n: "03",
                  title: "Get paid in 24 hours",
                  body: "Direct deposit within 24 hours of booking end. We handle payments, taxes, and guest messaging.",
                },
              ].map((s) => (
                <div
                  key={s.n}
                  className="relative rounded-2xl border border-border bg-card p-6 shadow-sm"
                >
                  <div className="text-sm font-bold tracking-wider text-primary">
                    {s.n}
                  </div>
                  <h3 className="mt-3 text-xl font-semibold text-foreground">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* LOCAL GUIDE — long-form content */}
        <section className="border-b border-border py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            {body ? (
              <AutoLinkedContent
                text={body}
                targets={[]}
                className="prose prose-lg max-w-none whitespace-pre-line text-foreground"
              />
            ) : guide ? (
              <article>
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  The {cityName} pool host playbook
                </h2>
                <p className="mt-5 text-lg leading-relaxed text-foreground">
                  {guide.intro}
                </p>
                {guide.sections.map((s) => (
                  <div key={s.heading} className="mt-10">
                    <h3 className="text-2xl font-semibold text-foreground">
                      {s.heading}
                    </h3>
                    {s.paragraphs.map((p, i) => (
                      <p
                        key={i}
                        className="mt-3 text-base leading-relaxed text-foreground/90"
                      >
                        {p}
                      </p>
                    ))}
                  </div>
                ))}
              </article>
            ) : (
              <p className="text-sm text-muted-foreground">
                Detailed local guide coming soon.
              </p>
            )}
          </div>
        </section>

        {/* NEARBY + FAQ */}
        <section className="border-b border-border py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <NearbyCities
              cities={nearbyCities}
              slugPrefix="become-a-swimming-pool-host-"
              heading={`Become a host near ${cityName}`}
            />
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <FaqBlock faqs={faqs} />
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="bg-gradient-to-br from-primary/15 via-background to-accent/15 py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Your {cityName} pool could be earning this week.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Free to list. No monthly fees. $2M coverage on every booking.
              Live in 15 minutes.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href="/auth"
                className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg transition hover:opacity-90"
              >
                List my pool — it's free
              </a>
              <a
                href="/p/hosting"
                className="inline-flex items-center justify-center rounded-full border border-border bg-background px-8 py-3.5 text-base font-semibold text-foreground transition hover:bg-muted"
              >
                Learn more about hosting
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-xs text-muted-foreground">
              {cityName} hosts earn
            </div>
            <div className="truncate text-sm font-bold text-foreground">
              {earningsBand}/mo
            </div>
          </div>
          <a
            href="/auth"
            className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md"
          >
            List my pool
          </a>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-lg font-bold text-foreground">{value}</div>
      <div className="text-[10px] text-muted-foreground">{sub}</div>
    </div>
  );
}

function Pillar({
  kicker,
  title,
  body,
}: {
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md">
      <div className="text-xs font-semibold uppercase tracking-wider text-primary">
        {kicker}
      </div>
      <div className="mt-2 text-xl font-bold text-foreground">{title}</div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  );
}
