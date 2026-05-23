import { createFileRoute, notFound, redirect, Link } from "@tanstack/react-router";
import { getCityBySlug, type CityRow } from "@/server/cities.functions";
import { lookupContentPage } from "@/server/content-pages.functions";
import {
  ComparisonPage,
  ComparisonTable,
  CTAPrimary,
  CTAMid,
  AuthorBlock,
  FooterBlock,
  FAQList,
  buildComparisonMeta,
  faqJsonLd,
  articleJsonLd,
  breadcrumbJsonLd,
} from "@/components/comparison-page";
import { absUrl } from "@/lib/site-origin";

/**
 * Programmatic city variant of the Giggster pillar comparison.
 *
 * Captures long-tail "giggster vs pool rental near me {city}" intent.
 * - Pulls live city row from `cities` table; 404s on unknown slugs so
 *   we don't index thin/junk pages.
 * - Adapts copy by city tier: production-hub cities (LA, NYC, Atlanta,
 *   Austin, Chicago) get a "list on both" angle; non-hub cities get a
 *   "PRNM is the realistic recreational channel" angle.
 * - All Giggster facts are sourced verbatim from Giggster's Help Center
 *   (verified May 5, 2026 via Firecrawl); no unverifiable claims.
 */

const PRODUCTION_HUB_SLUGS = new Set<string>([
  "los-angeles",
  "new-york",
  "new-york-city",
  "nyc",
  "brooklyn",
  "atlanta",
  "austin",
  "chicago",
]);

type CityTier = "hub" | "secondary";

function cityTier(city: CityRow): CityTier {
  return PRODUCTION_HUB_SLUGS.has(city.slug) ? "hub" : "secondary";
}

export const Route = createFileRoute("/p/giggster-vs-pool-rental-near-me-in-{$city}")({
  loader: async ({ params }) => {
    const fullSlug = `giggster-vs-pool-rental-near-me-in-${params.city}`;
    const lookup = await lookupContentPage({ data: { slug: fullSlug } });
    if (lookup.kind === "redirect" && lookup.redirectPath) {
      throw redirect({ href: lookup.redirectPath, statusCode: 301 });
    }
    const city = await getCityBySlug({ data: { slug: params.city } });
    if (!city) throw notFound();
    return { city };
  },
  head: ({ loaderData }) => {
    const city = loaderData?.city;
    if (!city) return { meta: [{ title: "City not found" }] };
    const slug = `giggster-vs-pool-rental-near-me-in-${city.slug}`;
    const title = `Giggster vs Pool Rental Near Me in ${city.name}, ${city.state_code} (2026): Fees, Insurance & Best Use`;
    const description = `${city.name}, ${city.state} pool hosts: Giggster vs Pool Rental Near Me compared with verified 2026 facts — 19% vs 10% host commission, renter COI vs included $2M Hartford liability, production vs recreational buyers, and the smart play for a ${city.name} pool.`;
    return {
      ...buildComparisonMeta({ slug, title, description }),
      scripts: [
        articleJsonLd({
          slug,
          title,
          description,
          datePublished: "2026-01-15",
          dateModified: "2026-05-05",
        }),
        breadcrumbJsonLd([
          { name: "Home", url: absUrl("/") },
          {
            name: "Giggster vs Pool Rental Near Me",
            url: absUrl("/p/giggster-vs-pool-rental-near-me"),
          },
          {
            name: `Giggster vs PRNM in ${city.name}`,
            url: absUrl(`/p/${slug}`),
          },
        ]),
        faqJsonLd(buildFaqs(city).map((f) => ({ q: f.q, a: f.a }))),
      ],
    };
  },
  component: GiggsterCityPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="text-3xl font-bold">City not found</h1>
      <p className="mt-3 text-muted-foreground">
        Try the main{" "}
        <Link
          to="/p/$slug"
          params={{ slug: "giggster-vs-pool-rental-near-me" }}
          className="text-primary underline"
        >
          Giggster vs Pool Rental Near Me comparison
        </Link>{" "}
        instead.
      </p>
    </div>
  ),
});

function buildFaqs(city: CityRow) {
  const isHub = cityTier(city) === "hub";
  return [
    {
      q: `Is Giggster or Pool Rental Near Me better for a pool in ${city.name}?`,
      a: isHub
        ? `${city.name} is one of Giggster's strongest production-hub markets, so a camera-ready ${city.name} pool can earn premium per-hour production rates ($150–$500+/hour) on Giggster while still capturing recreational weekend bookings ($45–$150/hour) on Pool Rental Near Me. The smart play in ${city.name} is to list on both, segment your calendar (weekday production / weekend recreational), and let each platform's buyer base do its job.`
        : `For a typical residential pool in ${city.name}, ${city.state}, Pool Rental Near Me is the realistic channel. Giggster's buyer base is film and photo production crews concentrated in production-hub metros — outside of those metros, Giggster's pool-buyer flow is thin. Pool Rental Near Me is built specifically for recreational hourly pool rentals to families, friend groups, and small parties at $45–$150 / hour, which matches typical ${city.name} demand.`,
    },
    {
      q: `What does Giggster charge ${city.name} pool hosts in 2026?`,
      a: `Giggster's national rate applies in ${city.name}: per Giggster's Help Center article "How much commission does Giggster take?" (verified May 2026), Giggster takes a 19% commission out of the host's total payout (location fee + additional fees) for the booking, plus a separate Processing Fee charged to the renter at checkout that scales with booking size. Pool Rental Near Me charges ${city.name} hosts a flat 10% host commission plus a 10% renter service fee.`,
    },
    {
      q: `On a $400 ${city.name} booking, how much do I keep on each platform?`,
      a: `On Pool Rental Near Me a $400 host payout becomes $360 after the 10% host commission. On Giggster a $400 host payout becomes $324 after the 19% host commission. That's $36 more per booking on Pool Rental Near Me from the same gross payout, before payment processing on either side.`,
    },
    {
      q: `What insurance do I need to host a pool in ${city.name} on Giggster?`,
      a: `Per Giggster's Help Center articles "As a host, do I need insurance?" and "Do I need insurance to host production?", ${city.name} hosts on Giggster must carry their own homeowner's insurance, and renters (production crews) must supply a Certificate of Insurance with at least $2 million in general liability and property damage before each shoot. Renters can purchase Giggster's optional Production/Event Insurance at checkout or use their own. Pool Rental Near Me automatically covers every approved ${city.name} booking with $2,000,000 per-occurrence / $4,000,000 aggregate Hartford-backed general liability — no separate renter COI required.`,
    },
    {
      q: `Can I list my ${city.name} pool on Giggster and Pool Rental Near Me at the same time?`,
      a: `Yes. Many ${city.name} pool owners run both platforms. Use Giggster for production / photo / event bookings and Pool Rental Near Me for recreational hourly rentals to local families and small groups. Sync your calendar across both to prevent double-bookings.`,
    },
    {
      q: `Is pool rental legal in ${city.state}?`,
      a: `Hosting recreational pool rentals is legal in most ${city.state} jurisdictions when the host carries adequate liability insurance and follows local zoning, occupancy, noise, parking, and short-term-rental rules. Always verify ${city.name} city ordinances and any HOA covenants before listing. Pool Rental Near Me's Pool Host Academy includes a free HOA Defense Kit and a liability waiver generator built for residential pool hosting.`,
    },
  ];
}

function GiggsterCityPage() {
  const { city } = Route.useLoaderData() as { city: CityRow };
  const tier = cityTier(city);
  const isHub = tier === "hub";
  const faqs = buildFaqs(city);

  const tableRows = [
    {
      label: "Primary buyer in " + city.name,
      prnm: "Recreational renters (families, friend groups, small parties)",
      competitor: isHub
        ? "Production crews + event renters (film, photo, video, commercials)"
        : "Production crews — limited inventory of pool buyers in " + city.name,
    },
    {
      label: "Host commission",
      prnm: <strong>10% flat</strong>,
      competitor: "19% (per Giggster Help Center)",
    },
    {
      label: `Take-home on a $400 ${city.name} booking`,
      prnm: <strong>$360</strong>,
      competitor: "$324",
    },
    {
      label: "Included general liability",
      prnm: <strong>$2M / $4M Hartford on every approved booking</strong>,
      competitor:
        "Not included — host carries homeowner's; renter must supply $2M COI for production",
    },
    {
      label: "Property damage coverage",
      prnm: "$150K STRETCH® PLUS blanket",
      competitor: "Per renter-supplied COI (or Giggster's optional add-on at checkout)",
    },
    {
      label: "Typical hourly rate band",
      prnm: "$45–$150 / hour recreational",
      competitor: isHub
        ? "$150–$500+ / hour production (in " + city.name + ")"
        : "Production rates exist on the platform, but " +
          city.name +
          " production-buyer demand is thin",
    },
    {
      label: "Pool-specific host training",
      prnm: "Pool Host Academy — 70+ free courses, HOA Defense Kit, waiver generator",
      competitor: "Production-focused help center — COIs, payouts, location agreements",
    },
  ];

  return (
    <ComparisonPage
      competitor="Giggster"
      title={`Giggster vs Pool Rental Near Me in ${city.name}`}
      effectiveMonthYear="May 2026"
    >
      <h1>
        Giggster vs Pool Rental Near Me in {city.name}, {city.state_code} (2026):
        Fees, Insurance &amp; Best Use
      </h1>

      <p className="text-sm text-muted-foreground">
        <em>
          Last updated May 5, 2026. All Giggster facts on this page are taken
          directly from Giggster's published Help Center and Terms of Service
          and were verified live on the source URLs at publication. Always
          confirm current terms on each platform before listing.
        </em>
      </p>

      <p>
        If you own a pool in <strong>{city.name}, {city.state}</strong> and
        you're trying to decide between <strong>Giggster</strong> and{" "}
        <strong>Pool Rental Near Me (PRNM)</strong>, the right answer depends
        on what kind of buyer you actually have in {city.name}. Giggster is a
        production-location marketplace — film, photo, video, commercials, and
        events. Pool Rental Near Me is built specifically for recreational
        hourly pool rentals to families, friend groups, and small parties.
        That single difference drives fees, insurance, the kind of guests who
        show up, and how much your {city.name} pool can actually earn.
      </p>

      <blockquote>
        <strong>Bottom line for {city.name} pool hosts:</strong>{" "}
        {isHub ? (
          <>
            {city.name} is one of Giggster's strongest production-hub markets,
            so the highest-yield strategy for a camera-ready pool is to list on
            <em> both</em>: production rates on Giggster (weekday) and
            recreational rates on Pool Rental Near Me (weekend). On a same-size
            host payout, PRNM's 10% commission keeps more in your pocket per
            booking; Giggster's premium per-hour production rates can make up
            the difference on a smaller number of larger bookings.
          </>
        ) : (
          <>
            For a typical residential pool in {city.name}, Pool Rental Near Me
            is the realistic channel — recreational demand is broadly
            distributed, while Giggster's production buyers concentrate in a
            handful of hub metros. PRNM's 10% host commission, included
            $2M Hartford liability on every approved booking, and pool-specific
            training are sized for residential pool hosting in {city.name}.
          </>
        )}
      </blockquote>

      <CTAPrimary />

      <h2>At-a-glance comparison for {city.name}</h2>
      <ComparisonTable competitor="Giggster" rows={tableRows} />

      <h2 id="fees">Fees: what you actually keep on a {city.name} booking</h2>
      <p>
        Giggster's Help Center article <em>"How much commission does Giggster
        take?"</em> states verbatim: <em>"Giggster takes a 19% commission out
        of the host's total payout (location fee + additional fees (if any))
        for the booking."</em><sup>[¹]</sup> Giggster also collects a separate
        Processing Fee from the renter at checkout that scales with booking
        size and features.
      </p>
      <p>
        Pool Rental Near Me charges {city.name} hosts a flat 10% host
        commission plus a 10% renter service fee. Hosts keep 90% of the
        booking subtotal.
      </p>

      <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">
                {city.name} gross host payout
              </th>
              <th className="px-4 py-3 text-left font-semibold text-primary">
                Keep on PRNM (10%)
              </th>
              <th className="px-4 py-3 text-left font-semibold">
                Keep on Giggster (19%)
              </th>
              <th className="px-4 py-3 text-left font-semibold">PRNM advantage</th>
            </tr>
          </thead>
          <tbody>
            {[
              [200, 180, 162, 18],
              [400, 360, 324, 36],
              [800, 720, 648, 72],
              [1500, 1350, 1215, 135],
              [3000, 2700, 2430, 270],
            ].map(([g, p, gg, diff]) => (
              <tr key={g} className="border-t border-border">
                <td className="px-4 py-3 font-medium text-foreground">${g}</td>
                <td className="px-4 py-3 text-foreground">${p}</td>
                <td className="px-4 py-3 text-muted-foreground">${gg}</td>
                <td className="px-4 py-3 font-semibold text-primary">+${diff}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p>
        Across a typical {city.name} season of 40–60 bookings, the fee delta
        compounds. Run your specific {city.name} numbers in the{" "}
        <a href="/p/earnings-calculator">
          earnings calculator
        </a>
        .
      </p>

      <h2 id="insurance">Insurance &amp; liability for a {city.state} residential pool</h2>
      <p>
        Pool incidents can be catastrophic — drownings, slip-and-falls,
        property damage. The two platforms handle insurance very differently,
        and this is the most important section for any {city.name} pool host
        to understand before listing.
      </p>

      <h3>Giggster's insurance model in {city.name}</h3>
      <p>
        Per Giggster's Help Center article <em>"As a host, do I need
        insurance?"</em>, Giggster hosts in {city.name} (and everywhere else)
        must carry sufficient homeowner's insurance, and Giggster's Terms of
        Service §13 require the host or the renter to obtain "Sufficient
        Insurance" before the booking start date.<sup>[²]</sup> For
        production bookings specifically, Giggster's <em>"Do I need insurance
        to host production?"</em> article states that every renter must carry
        production insurance with a $2 million minimum in general liability
        and property damage and supply the host with a Certificate of
        Insurance (COI) before the shoot.<sup>[³]</sup> Renters can purchase
        Giggster's optional Production/Event Insurance at checkout or supply
        their own.
      </p>

      <h3>Pool Rental Near Me's insurance model in {city.name}</h3>
      <p>
        PRNM Corp maintains a Business Owner's Policy through Hartford
        Underwriters that automatically covers every approved {city.name}{" "}
        booking with no separate renter policy required:
      </p>
      <ul>
        <li>
          <strong>$2,000,000 per-occurrence / $4,000,000 aggregate</strong>{" "}
          general liability
        </li>
        <li>
          <strong>$10,000 medical expenses</strong> per person
        </li>
        <li>
          <strong>$150,000 STRETCH® PLUS</strong> property coverage blanket
        </li>
      </ul>
      <p>
        For a residential {city.name} pool host, the practical upshot is that
        you don't have to chase a COI per booking — coverage attaches the
        moment a booking is approved.<sup>[⁴]</sup>
      </p>

      <h2 id="buyers">Who actually books pools in {city.name}?</h2>
      {isHub ? (
        <>
          <p>
            {city.name} is one of Giggster's strongest production-hub markets.
            Real production buyers — location scouts, photographers, indie
            filmmakers, content creators, commercial production companies —
            actively scout {city.name} pools on Giggster, and they pay
            premium per-hour rates ($150–$500+/hour) when the pool is
            camera-ready (clean sightlines, photogenic surround, good light,
            parking and load-in space).
          </p>
          <p>
            At the same time, {city.name}'s recreational pool demand is huge:
            families, friend groups, birthday parties, swim lessons,
            bachelorette and bachelor groups, and small private events looking
            for a nice backyard pool to rent for a few hours. That's the
            buyer base on Pool Rental Near Me.
          </p>
          <p>
            <strong>The smart play in {city.name} is to run both</strong> —
            premium production rates on Giggster (weekday availability,
            stricter rules), recreational rates on Pool Rental Near Me
            (weekend availability, party-friendly capacity).
          </p>
        </>
      ) : (
        <>
          <p>
            {city.name} is not one of Giggster's production-hub metros, so
            production buyers actively scouting pools in {city.name} on
            Giggster are limited. You can list there, but expect thin demand
            for residential pools relative to the production-hub cities.
          </p>
          <p>
            Recreational pool demand in {city.name} is the realistic
            opportunity: families, friend groups, small parties, birthday
            celebrations, swim lessons, fitness clients. That's the buyer
            base Pool Rental Near Me is built for, and it's broadly
            distributed across {city.state} markets like {city.name}.
          </p>
        </>
      )}

      <h2 id="local-demand">Live {city.name} pool-rental demand</h2>
      <p>
        See current {city.name} pool inventory on the{" "}
        <a
          href={`/s?address=${encodeURIComponent(`${city.name}, ${city.state_code}`)}`}
          className="text-primary underline"
        >
          {city.name} pool search
        </a>
        . Browse what locals are renting and how hosts price their hours.
      </p>

      <CTAMid />

      <h2 id="strategy">
        {isHub ? `${city.name} dual-channel strategy` : `Smartest ${city.name} listing strategy`}
      </h2>
      {isHub ? (
        <ol>
          <li>
            Tune your Giggster listing for production crews: premium per-hour
            rates, weekday availability, COI-ready language, stricter house
            rules.
          </li>
          <li>
            Create your free Pool Rental Near Me listing at{" "}
            <a href="/p/start-hosting" rel="noopener">
              poolrentalnearme.com/p/start-hosting
            </a>{" "}
            with recreational pricing and weekend party capacity.
          </li>
          <li>
            Sync calendars across both platforms to prevent double-bookings.
          </li>
          <li>
            Run the{" "}
            <a href="/p/learningacademy">
              Pool Host Academy
            </a>{" "}
            intake modules to optimize your PRNM recreational listing — photo
            composition, amenity upsells, waiver setup, HOA defense.
          </li>
          <li>
            After 60 days, look at profit per weekend hour by channel and bias
            availability toward the higher-yield channel for <em>your</em>{" "}
            specific {city.name} pool.
          </li>
        </ol>
      ) : (
        <ol>
          <li>
            Create your free Pool Rental Near Me listing at{" "}
            <a href="/p/start-hosting" rel="noopener">
              poolrentalnearme.com/p/start-hosting
            </a>
            .
          </li>
          <li>
            Set your {city.name} hourly rate in the typical $45–$150 range
            depending on capacity, amenities, and season.
          </li>
          <li>
            Run the{" "}
            <a href="/p/learningacademy">
              Pool Host Academy
            </a>{" "}
            intake modules to optimize photos, amenity upsells, waiver setup,
            and HOA defense.
          </li>
          <li>
            If your {city.name} pool is genuinely camera-ready, you can also
            test a Giggster listing — but treat it as a low-priority secondary
            channel given {city.name}'s production-buyer thinness.
          </li>
        </ol>
      )}

      <h2 id="related">Related comparisons</h2>
      <p>
        Read the full pillar comparison:{" "}
        <Link
          to="/p/$slug"
          params={{ slug: "giggster-vs-pool-rental-near-me" }}
          className="text-primary underline"
        >
          Giggster vs Pool Rental Near Me (2026): Fees, Insurance &amp; Best
          Use Cases
        </Link>
        . Or compare other platforms:{" "}
        <Link
          to="/p/$slug"
          params={{ slug: "peerspace-vs-pool-rental-near-me" }}
          className="text-primary underline"
        >
          Peerspace vs Pool Rental Near Me
        </Link>
        {" "}·{" "}
        <Link
          to="/p/$slug"
          params={{ slug: "swimply-alternative-vs-pool-rental-near-me" }}
          className="text-primary underline"
        >
          Swimply alternative vs Pool Rental Near Me
        </Link>
        .
      </p>

      <h2 id="faq">Frequently asked questions — {city.name}</h2>
      <FAQList faqs={faqs} />

      <AuthorBlock />

      <h2>📊 Sources &amp; footnotes</h2>
      <ol>
        <li>
          <strong>Giggster 19% host commission</strong> — Giggster Help Center,
          "How much commission does Giggster take?" (verified live May 5,
          2026):{" "}
          <a
            href="https://help.giggster.com/en/articles/2832062-how-much-commission-does-giggster-take"
            rel="noopener nofollow"
          >
            help.giggster.com/en/articles/2832062
          </a>
          .
        </li>
        <li>
          <strong>Giggster host insurance requirements</strong> — Giggster Help
          Center, "As a host, do I need insurance?" (citing Giggster Terms of
          Service §13):{" "}
          <a
            href="https://help.giggster.com/en/articles/8076417-as-a-host-do-i-need-insurance"
            rel="noopener nofollow"
          >
            help.giggster.com/en/articles/8076417
          </a>
          .
        </li>
        <li>
          <strong>Giggster production-renter $2M COI requirement</strong> —
          Giggster Help Center, "Do I need insurance to host production?":
          renters must carry production insurance with{" "}
          <em>"a $2 million minimum in general liability and property
          damage"</em> and supply the host with a Certificate of Insurance
          before the shoot:{" "}
          <a
            href="https://help.giggster.com/en/articles/8076412-do-i-need-insurance-to-host-production"
            rel="noopener nofollow"
          >
            help.giggster.com/en/articles/8076412
          </a>
          .
        </li>
        <li>
          <strong>$2,000,000 PRNM general liability insurance</strong> — PRNM
          Corp's Business Owner's Policy through Hartford Underwriters. Full
          terms in the{" "}
          <a href="/p/terms-of-service">
            Pool Rental Near Me Terms of Service
          </a>
          .
        </li>
      </ol>

      <p className="text-xs text-muted-foreground">
        <em>
          Disclaimer: This page is an informational comparison written by Pool
          Rental Near Me. We are not affiliated with Giggster. {city.name}-
          and {city.state}-specific commentary reflects general 2026 market
          context, not legal or tax advice. Fees, insurance terms, and
          policies on either platform may change at any time; always verify
          the current published terms on each platform before listing or
          booking.
        </em>
      </p>

      <FooterBlock city={city.name} />
    </ComparisonPage>
  );
}
