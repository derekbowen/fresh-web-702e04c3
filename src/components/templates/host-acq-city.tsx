import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { AUTHOR_PERSON_JSONLD_REF } from "@/lib/seo";
import { AuthorByline } from "@/components/author-byline";
import { BreadcrumbsWithSchema } from "@/components/breadcrumbs-jsonld";
import { HeroImage } from "@/components/hero-image";
import { type LinkTarget } from "@/components/auto-linked-content";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { NearbyCities } from "@/components/nearby-cities";
import { FaqBlock } from "@/components/faq-block";
import { RelatedPages, type RelatedPagesItem } from "@/components/related-pages";
import { relatedSlugsToItems } from "@/lib/related-city-anchors";
import { ADVOCACY_STATES } from "@/lib/advocacy-states";
import { EarningsCalculator } from "@/components/earnings-calculator";
import { HostLeadPopup } from "@/components/host-lead-popup";
import { FounderBookingInline } from "@/components/founder-booking";
import { faqsForContentPage } from "@/lib/page-faqs";
import { buildHostCityGuide } from "@/lib/host-city-guide";
import { cityForContentPage, parseCitySlug } from "@/lib/city-slug";
import type { ContentPage } from "@/server/content-pages.functions";
import type { NearbyCity } from "@/server/nearby-cities.functions";
import type { CityRow } from "@/server/cities.functions";
import type { CitySource } from "@/server/city-sources.functions";

const SOURCE_BUCKET_LABEL: Record<string, string> = {
  ordinance: "City ordinances",
  hoa_str: "HOA & short-term rental rules",
  noaa: "Climate & swim season",
  demand: "Local demand",
  insurance: "Insurance & liability",
};

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
  linkTargets = [],
  citySources = [],
}: {
  page: ContentPage;
  nearbyCities?: NearbyCity[];
  city?: CityRow | null;
  linkTargets?: LinkTarget[];
  citySources?: CitySource[];
}) {
  const title = page.title || page.seo_title || "Become a pool host";
  const description = page.seo_description || page.description || null;
  const body = page.body_markdown || page.content || null;
  const faqs = faqsForContentPage(page);
  const guide = city ? buildHostCityGuide(city) : null;
  const fallbackCitySlug = cityForContentPage(page.template_type, page.slug);
  const fallbackCity = fallbackCitySlug ? parseCitySlug(fallbackCitySlug) : null;
  const cityName = city?.name || fallbackCity?.city || "your city";
  const stateCode = (city?.state_code || fallbackCity?.stateCode || "").toUpperCase();
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

  // SEO: schema + bio
  const stateName = city?.state || fallbackCity?.stateCode || stateCode;
  
  const dateModified = new Date().toISOString().slice(0, 10);
  const dateFormatted = new Date(dateModified).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
  const pageUrl = `https://www.poolrentalnearme.com${page.url_path}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: `Become a Pool Host in ${cityName}, ${stateCode} — Earn ${earningsBand}/Month`,
        author: AUTHOR_PERSON_JSONLD_REF,
        publisher: {
          "@type": "Organization",
          name: "Pool Rental Near Me",
          logo: { "@type": "ImageObject", url: "https://www.poolrentalnearme.com/logo.png" },
        },
        datePublished: "2026-01-01",
        dateModified,
        mainEntityOfPage: pageUrl,
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.poolrentalnearme.com/" },
          { "@type": "ListItem", position: 2, name: "Become a Host", item: "https://www.poolrentalnearme.com/p/hosting" },
          { "@type": "ListItem", position: 3, name: `${cityName}, ${stateCode}` },
        ],
      },
      {
        "@type": "LocalBusiness",
        name: `Pool Rental Near Me — ${cityName}`,
        description: `Peer-to-peer pool rental marketplace in ${cityName}, ${stateName}`,
        areaServed: {
          "@type": "City",
          name: cityName,
          containedInPlace: { "@type": "State", name: stateName },
        },
        url: pageUrl,
        telephone: "+1-888-940-4247",
        priceRange: `$${hourlyRate}/hr`,
      },
      {
        "@type": "Organization",
        name: "Pool Rental Near Me",
        url: "https://www.poolrentalnearme.com",
        telephone: "+1-888-940-4247",
        sameAs: [
          "https://www.facebook.com/poolrentalnearme",
          "https://www.instagram.com/poolrentalnearme",
          "https://x.com/poolrentalnearme",
        ],
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <main className="flex-1 pb-24 lg:pb-0">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-border">
          {page.hero_image_url && (
            <>
              <HeroImage
                src={page.hero_image_url}
                alt={`${cityName} backyard pool`}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" />
            </>
          )}
          {!page.hero_image_url && (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-accent/20" />
          )}

          <div className="relative mx-auto max-w-6xl px-4 pt-10 sm:px-6 lg:px-8">
            <BreadcrumbsWithSchema
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
              <AuthorByline date={dateModified} />
              <p className="mt-1 text-xs text-muted-foreground">
                <time dateTime={dateModified}>Last updated: {dateFormatted}</time>
              </p>
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
                  href="/signup"
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

        {/* HARTFORD INSURANCE CALLOUT */}
        <section className="border-b border-border py-12 sm:py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border-l-4 border-primary bg-primary/5 p-6 sm:p-8">
              <div>
                <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                  Real insurance, not a self-funded guarantee
                </h2>
                <p className="mt-3 text-base leading-relaxed text-foreground/90">
                  Pool Rental Near Me's <strong>$2M per-occurrence / $4M aggregate general liability</strong>{" "}
                  is carrier-backed third-party insurance underwritten by{" "}
                  <strong>Hartford Underwriters Insurance Company</strong> — not a self-funded host
                  guarantee. Includes <strong>$150K STRETCH® PLUS property coverage</strong> and{" "}
                  <strong>$10K medical expenses per person</strong>.
                </p>
              </div>
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
              <div className="prose prose-lg max-w-none text-foreground prose-headings:text-foreground prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3 prose-p:text-foreground/90 prose-p:leading-relaxed prose-a:text-primary prose-strong:text-foreground prose-table:text-sm prose-th:text-left prose-th:bg-muted prose-th:p-3 prose-td:p-3 prose-td:border prose-th:border prose-table:border prose-ul:list-disc prose-ol:list-decimal">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // The page H1 is rendered by the hero. Any `#` heading in
                    // the markdown body must downgrade to H2 to avoid two H1s
                    // on the page (SEO: duplicate H1 across 3,234 host-city
                    // pages was the #4 audit finding).
                    h1: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
                  }}
                >
                  {body}
                </ReactMarkdown>
              </div>
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

        {/* AUTHOR BIO */}
        <section className="border-b border-border bg-muted/20 py-12">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-primary">
                About the author
              </h2>
              <div className="mt-3 text-xl font-bold text-foreground">Derek Bowen</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Founder &amp; CEO, PRNM Corp
              </p>
              <p className="mt-4 text-base leading-relaxed text-foreground/90">
                Derek Bowen is the founder and CEO of PRNM Corp, the parent
                company behind Pool Rental Near Me. A lifelong entrepreneur
                with 20+ years of marketplace and e-commerce experience, Derek
                launched Pool Rental Near Me to give pool owners a host-first
                alternative to high-fee competitors. He is the author of
                multiple Amazon-published books on pool hosting, including{" "}
                <em>Pool Host Riches</em>, <em>The Backyard Entrepreneur</em>,
                and the Pool Host Academy companion guides.
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
                <a
                  href="https://www.linkedin.com/in/derekcbowen/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-border bg-background px-4 py-2 text-foreground transition hover:bg-muted"
                >
                  LinkedIn
                </a>
                <a
                  href="https://www.amazon.com/stores/Derek-Bowen/author"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-border bg-background px-4 py-2 text-foreground transition hover:bg-muted"
                >
                  Amazon author page
                </a>
                <a
                  href="/p/learningacademy"
                  className="rounded-full border border-border bg-background px-4 py-2 text-foreground transition hover:bg-muted"
                >
                  Pool Host Academy
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Founder booking — all become-a-host pages */}
        <FounderBookingInline lang="en" />


        <section className="py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <FaqBlock faqs={faqs} />
            {citySources.length > 0 ? (
              <aside className="mt-12 rounded-2xl border border-border bg-muted/40 p-6">
                <h2 className="text-xl font-semibold text-foreground">
                  Sources for this {cityName} guide
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Every local rule, climate stat and demand figure on this page
                  is grounded in a public, primary source.
                </p>
                <ul className="mt-4 space-y-3 text-sm">
                  {citySources.map((s) => (
                    <li key={s.id}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {s.title}
                      </a>
                      <span className="ml-1 text-muted-foreground">
                        — {s.publisher}
                        {SOURCE_BUCKET_LABEL[s.bucket]
                          ? ` · ${SOURCE_BUCKET_LABEL[s.bucket]}`
                          : ""}
                      </span>
                      <p className="mt-1 text-muted-foreground">{s.key_fact}</p>
                    </li>
                  ))}
                </ul>
              </aside>
            ) : null}
            <RelatedPages
              heading={`More for ${cityName} pool hosts`}
              items={(() => {
                const items: RelatedPagesItem[] = [];
                // Geo-relevant city-to-city links first (internal linking backfill).
                items.push(
                  ...relatedSlugsToItems(page.related_slugs, { max: 10 }),
                );
                const advocacy = stateCode
                  ? ADVOCACY_STATES.find((s) => s.code === stateCode)
                  : null;
                if (advocacy) {
                  items.push({
                    to: `/p/${advocacy.slug}`,
                    label: `${advocacy.name} pool host laws & advocacy`,
                    description: `Permits, HOA defense, and what's legal in ${advocacy.name}`,
                  });
                }
                items.push(
                  { to: "/p/learningacademy", label: "Pool Host Academy", description: "70+ free courses for new and growing hosts" },
                  { to: "/p/earnings-calculator", label: "Pool host earnings calculator", description: `Estimate your monthly income in ${cityName}` },
                  { to: "/p/swimply-alternative-vs-pool-rental-near-me", label: "Swimply alternative — PRNM compared", description: "Side-by-side fees, payouts, and coverage" },
                  { to: "/p/peerspace-vs-pool-rental-near-me", label: "Peerspace vs Pool Rental Near Me", description: "Why pool-first beats general venue rental" },
                  { to: "/p/giggster-vs-pool-rental-near-me", label: "Giggster vs Pool Rental Near Me", description: "Pool hosts vs film/event rentals" },
                  { to: "/p/hoa-pool-rental-defense-kit", label: "HOA pool rental defense kit", description: "What to send your HOA before they push back" },
                  { to: `/p/pool-pros?city=${encodeURIComponent(cityName)}`, label: `Pool pros in ${cityName}`, description: "Vetted local cleaners, techs, and repair" },
                  { to: "/p/hosting", label: "Become a pool host", description: "Everything new hosts should know before listing" },
                  { to: "/p/all-locations", label: "All pool rental locations", description: "Browse host pools across the US" },
                );
                return items;
              })()}
            />

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
                href="/signup"
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
            href="/signup"
            className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md"
          >
            List my pool
          </a>
        </div>
      </div>

      {page.slug !== "become-a-swimming-pool-host-tracy-ca" && (
        <HostLeadPopup cityName={cityName} stateCode={stateCode} />
      )}

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
