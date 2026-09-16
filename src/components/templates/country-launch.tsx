import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { AuthorByline } from "@/components/author-byline";
import { BreadcrumbsWithSchema, type Crumb } from "@/components/breadcrumbs-jsonld";
import { FaqBlock } from "@/components/faq-block";
import { FounderBookingInline } from "@/components/founder-booking";
import { faqsForContentPage } from "@/lib/page-faqs";
import {
  COUNTRY_LAUNCH_URLS,
  countryLaunchMarket,
  type CountryLaunchMarket,
} from "@/config/country-launch";
import type { ContentPage } from "@/server/content-pages.functions";
import type { CountryLaunchGuide } from "@/server/country-launch.functions";
import heroDesktop from "@/assets/paradise-hero.webp";
import heroMobile from "@/assets/paradise-hero-mobile.webp";

/**
 * Country launch template (template_type = "country_launch") — the front door
 * of poolrentalnearme.co.uk / .ca / .com.au and their city pages.
 *
 * Until 2026-09-16 these nine pages fell through to GenericPageTemplate: a
 * bare H1, a byline and unstyled markdown. This gives them the same visual
 * language as the homepage (full-bleed pool hero, cards, gradient host band)
 * without inventing anything: every claim on the page is either in the row's
 * own stored body or is existing site copy. No earnings figures, no quotes,
 * no coverage language.
 *
 * Marketplace CTAs are absolute .com URLs on purpose — /wizard/, /s and
 * /signup do not exist on the ccTLD origins (fresh-web 404s them there).
 */
export function CountryLaunchTemplate({
  page,
  guides = [],
}: {
  page: ContentPage;
  guides?: CountryLaunchGuide[];
}) {
  const market = countryLaunchMarket(page.slug, page.locale);
  const title = page.title || page.seo_title || "Rent out your pool";
  const description = page.description || page.seo_description || null;
  const body = page.content || page.body_markdown || null;
  const faqs = faqsForContentPage(page);
  const hubPath = market ? `/p/${market.country.hubSlug}` : null;

  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    { name: "Become a host", path: COUNTRY_LAUNCH_URLS.hosting },
  ];
  if (market?.city && hubPath) crumbs.push({ name: market.country.label, path: hubPath });
  crumbs.push({ name: title, path: page.url_path || `/p/${page.slug}` });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <Hero page={page} market={market} crumbs={crumbs} description={description} />
        <TrustStrip market={market} />
        <MoneySection market={market} />
        <HostingSteps />
        <CitiesSection market={market} />
        {body ? <LaunchNote body={body} /> : null}
        <GuidesSection market={market} guides={guides} />
        <FounderBookingInline lang="en" />
        {faqs.length > 0 ? (
          <section className="bg-background">
            <div className="mx-auto max-w-3xl px-4 pb-4 sm:px-6 lg:px-8">
              <FaqBlock faqs={faqs} heading={market ? `Questions ${market.country.label} hosts ask` : "Frequently asked questions"} />
            </div>
          </section>
        ) : null}
        <FinalCta market={market} />
      </main>
      <SiteFooter />
    </div>
  );
}

/* ────────────────────────────── Hero ────────────────────────────── */

function Hero({
  page,
  market,
  crumbs,
  description,
}: {
  page: ContentPage;
  market: CountryLaunchMarket | null;
  crumbs: Crumb[];
  description: string | null;
}) {
  const where = market?.city
    ? `Rent out your ${market.city.name} pool by the hour.`
    : market
      ? `Rent out your pool in ${market.country.name}.`
      : "Rent out your pool by the hour.";
  const kicker = market?.city
    ? `Now launching · ${market.city.name}, ${market.country.label}`
    : market
      ? `Now launching · ${market.country.label}`
      : "Now launching";
  const currency = market?.country.currency ?? "your local currency";
  const currencyLabel = market?.country.currencyLabel ?? "your local currency";

  return (
    <section aria-label={where} className="relative overflow-hidden text-white">
      <picture>
        <source media="(max-width: 767px)" srcSet={heroMobile} type="image/webp" />
        <img
          src={heroDesktop}
          alt=""
          width={1024}
          height={768}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </picture>
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(11,39,51,0.92) 0%, rgba(11,39,51,0.78) 45%, rgba(11,39,51,0.35) 100%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="text-white/80 [&_a]:text-white/80 [&_a:hover]:text-white [&_span]:text-white">
          <BreadcrumbsWithSchema items={crumbs} />
        </div>
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-14 pt-8 sm:px-6 sm:pb-20 sm:pt-12 lg:grid-cols-5 lg:px-8 lg:pb-24 lg:pt-16">
        <div className="lg:col-span-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-[2px]">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
            {kicker}
          </div>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight drop-shadow-md sm:text-5xl lg:text-6xl">
            {where}{" "}
            <span className="bg-gradient-to-r from-sky-300 to-white bg-clip-text text-transparent">
              0% host fees. Keep 100%.
            </span>
          </h1>
          {description ? (
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/90 drop-shadow">{description}</p>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={COUNTRY_LAUNCH_URLS.wizard}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-7 text-base font-bold text-[#0B4A6F] shadow-xl transition-transform hover:scale-[1.03]"
            >
              List your pool — it's free
            </a>
            <a
              href="#how-hosting-works"
              className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-white/80 px-7 text-base font-semibold text-white backdrop-blur-[2px] transition-colors hover:bg-white/10"
            >
              See how it works
            </a>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-white/90">
            <li className="flex items-center gap-1.5"><span className="text-sky-300">✓</span> 0% host fees, forever for founding hosts</li>
            <li className="flex items-center gap-1.5"><span className="text-sky-300">✓</span> Paid in {currencyLabel} via Stripe</li>
            <li className="flex items-center gap-1.5"><span className="text-sky-300">✓</span> Listing takes about ten minutes</li>
          </ul>
          <div className="mt-6 [&_p]:text-white/75 [&_a]:text-white">
            <AuthorByline date={page.published_at ?? page.updated_at} />
          </div>
        </div>

        {/* Founding-host card */}
        <div className="lg:col-span-2">
          <div className="rounded-3xl border border-white/20 bg-white/95 p-6 text-foreground shadow-2xl backdrop-blur">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Founding host status
            </div>
            <div className="mt-1 text-4xl font-extrabold text-[#0B4A6F]">
              0% <span className="text-lg font-semibold text-muted-foreground">host fees, forever</span>
            </div>
            <dl className="mt-5 divide-y divide-border border-t border-border text-sm">
              {[
                ["Listing fee", "None"],
                ["Subscription", "None"],
                ["Payouts", `${currency} via Stripe`],
                ["Guest approval", "You decide"],
                ["Setup", "About ten minutes"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-semibold text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
            <a
              href={COUNTRY_LAUNCH_URLS.wizard}
              className="mt-5 block w-full rounded-full px-4 py-3 text-center text-sm font-bold text-white shadow-md transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: "#0EA5E9" }}
            >
              Claim founding-host status
            </a>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Already listed elsewhere? Paste the link and we import your photos and description.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── Trust strip ────────────────────────── */

function TrustStrip({ market }: { market: CountryLaunchMarket | null }) {
  const currency = market?.country.currency ?? "your local currency";
  const items = [
    "You keep 100% of your hourly price",
    `Paid in ${currency} to your local bank via Stripe`,
    "Your calendar, your rules, your guest count",
  ];
  return (
    <section aria-label="Why host here" className="border-b border-border bg-secondary/30">
      <ul className="mx-auto grid max-w-5xl grid-cols-1 gap-x-8 gap-y-2 px-4 py-4 text-center text-sm font-semibold text-foreground sm:grid-cols-3 sm:py-5">
        {items.map((t) => (
          <li key={t} className="min-h-6">{t}</li>
        ))}
      </ul>
    </section>
  );
}

/* ─────────────────────────── The money ──────────────────────────── */

function MoneySection({ market }: { market: CountryLaunchMarket | null }) {
  const currencyLabel = market?.country.currencyLabel ?? "your local currency";
  const cards = [
    {
      kicker: "Your price",
      title: "You set your hourly price",
      body: "Prices currently display in US dollars — we're a US-built platform expanding out, and we'd rather tell you that plainly than pretend otherwise.",
    },
    {
      kicker: "Your payout",
      title: `Guests pay by card. You're paid in ${currencyLabel}.`,
      body: "Straight to your local bank account through Stripe, the same payments company behind Shopify and Airbnb-scale marketplaces.",
    },
    {
      kicker: "Our cut",
      title: "You keep 100% of your price",
      body: "Our revenue comes from a small service fee guests pay on top — your payout is your price. No listing fee, no host commission, no subscription.",
    },
  ];
  return (
    <section aria-label="How the money works" className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">No surprises</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">How the money works</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3 sm:gap-6">
          {cards.map((c) => (
            <div key={c.title} className="rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md">
              <div className="text-xs font-semibold uppercase tracking-wider text-primary">{c.kicker}</div>
              <h3 className="mt-2 text-lg font-bold text-foreground">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── How hosting works ────────────────────── */

function HostingSteps() {
  const steps = [
    {
      icon: "📝",
      title: "List in about ten minutes",
      text: "Our listing wizard builds your page for you. Already on another platform? Paste the link and we import your photos and description automatically.",
    },
    {
      icon: "🗓️",
      title: "You control everything",
      text: "Your calendar, your rules, your minimum booking length, your guest count. Approve the bookings you want.",
    },
    {
      icon: "🏊",
      title: "Guests come, swim, and leave",
      text: "Hourly bookings mean afternoon pool parties, birthday swims and family sessions. Payouts are initiated after each completed booking; bank arrival times may vary.",
    },
  ];
  return (
    <section id="how-hosting-works" aria-label="How hosting works" className="scroll-mt-20 border-y border-border bg-secondary/20">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">How hosting works</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-3 sm:gap-6">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-border bg-card p-5">
              <span className="text-2xl" aria-hidden>{s.icon}</span>
              <h3 className="mt-2 text-base font-semibold text-foreground">{i + 1}. {s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ─────────────────────────────── Cities ─────────────────────────── */

const CITY_GRADIENTS = [
  "linear-gradient(135deg, #0B4A6F 0%, #0EA5E9 100%)",
  "linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)",
  "linear-gradient(135deg, #0369A1 0%, #22D3EE 100%)",
];

function CitiesSection({ market }: { market: CountryLaunchMarket | null }) {
  if (!market) return null;
  const { country, city } = market;
  const cards: Array<{ name: string; path: string; sub: string }> = country.cities
    .filter((c) => c.slug !== city?.slug)
    .map((c) => ({ name: c.name, path: `/p/${c.slug}`, sub: "Founding hosts wanted" }));
  if (city) {
    cards.unshift({ name: country.label, path: `/p/${country.hubSlug}`, sub: `The ${country.label} launch page` });
  }
  if (cards.length === 0) return null;
  return (
    <section aria-label="Launch cities" className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {city ? `More of the ${country.label} launch` : `Founding hosts wanted across ${country.name}`}
        </h2>
        <p className="mt-2 text-muted-foreground">
          The first pools listed in each city get founding-host status: 0% host fees, locked in forever.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {cards.map((c, i) => (
            <a
              key={c.path}
              href={c.path}
              className="group relative block overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-lg"
            >
              <div
                className="flex aspect-[16/9] items-end p-5 text-white"
                style={{ background: CITY_GRADIENTS[i % CITY_GRADIENTS.length] }}
              >
                <div>
                  <div className="text-2xl font-extrabold drop-shadow">{c.name}</div>
                  <div className="text-sm font-medium text-white/90">{c.sub}</div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 p-4">
                <span className="text-sm font-semibold text-foreground">Rent out your {c.name === country.label ? "pool" : `${c.name} pool`}</span>
                <span className="text-sm font-semibold text-primary transition-transform group-hover:translate-x-0.5">→</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────── Launch note ───────────────────────── */

function LaunchNote({ body }: { body: string }) {
  return (
    <section aria-label="The launch note" className="border-t border-border bg-secondary/20">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">From the founder</p>
        <div
          className="prose prose-lg mt-3 max-w-none text-foreground
            prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
            prose-h2:mt-10 prose-h2:text-2xl
            prose-h3:mt-8 prose-h3:text-xl
            prose-p:leading-relaxed prose-p:text-foreground/90
            prose-a:font-semibold prose-a:text-primary hover:prose-a:underline
            prose-strong:text-foreground
            prose-ul:my-4 prose-li:my-1
            dark:prose-invert"
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // The hero renders the page H1; any `#` in the stored body
              // becomes an H2 so the page never carries two H1s.
              h1: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
            }}
          >
            {body}
          </ReactMarkdown>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── Guides ─────────────────────────── */

function GuidesSection({ market, guides }: { market: CountryLaunchMarket | null; guides: CountryLaunchGuide[] }) {
  if (!market || guides.length === 0) return null;
  return (
    <section aria-label="Guides for hosts" className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Guides for {market.country.label} hosts
        </h2>
        <p className="mt-2 text-muted-foreground">
          Written for {market.country.label} pools — pricing, payouts, tax, heating and the full founding-host guide.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {guides.map((g) => (
            <a
              key={g.slug}
              href={`/p/${g.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-lg"
            >
              <div className="aspect-[16/9] w-full shrink-0 overflow-hidden bg-muted">
                {g.cover_image_url ? (
                  <img
                    src={g.cover_image_url}
                    alt=""
                    width={800}
                    height={450}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-400 to-cyan-500" />
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="line-clamp-2 text-base font-semibold text-foreground">{g.title}</h3>
                {g.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{g.description}</p>
                ) : null}
                <span className="mt-auto pt-3 text-sm font-semibold text-primary">Read the guide →</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────── Final CTA ───────────────────────── */

function FinalCta({ market }: { market: CountryLaunchMarket | null }) {
  const where = market?.city ? market.city.name : market?.country.name ?? "your area";
  return (
    <section
      aria-label="List your pool"
      className="relative overflow-hidden text-white"
      style={{ background: "linear-gradient(135deg, #0B4A6F 0%, #0EA5E9 62%, #38BDF8 100%)" }}
    >
      <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 lg:px-8 lg:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/85 sm:text-sm">Founding hosts</p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Be one of the first pools in {where}.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg font-medium text-white/95">
          Free to list. 0% host fees, forever. Listing takes about ten minutes.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href={COUNTRY_LAUNCH_URLS.wizard}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-8 text-base font-bold text-[#0B4A6F] shadow-xl transition-transform hover:scale-[1.03]"
          >
            List your pool
          </a>
          <a
            href={COUNTRY_LAUNCH_URLS.signup}
            className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-white/80 px-8 text-base font-semibold text-white transition-colors hover:bg-white/10"
          >
            Questions first? Create a free account
          </a>
        </div>
        <p className="mt-4 text-sm text-white/85">A real person answers, usually the same day.</p>
      </div>
    </section>
  );
}
