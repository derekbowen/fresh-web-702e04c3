import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { getCityBySlug, type CityRow } from "@/server/cities.functions";
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

/**
 * Programmatic city variant of the Peerspace pillar page.
 *
 * Pulls city row from `cities` table to produce locally-relevant copy,
 * pricing context, and internal links — without thin-content duplication.
 * 404s if the city slug isn't a published city, so we don't index junk.
 */

export const Route = createFileRoute("/p/peerspace-vs-pool-rental-near-me-in-$city")({
  loader: async ({ params }) => {
    const city = await getCityBySlug({ data: { slug: params.city } });
    if (!city) throw notFound();
    return { city };
  },
  head: ({ loaderData }) => {
    const city = loaderData?.city;
    if (!city) return { meta: [{ title: "City not found" }] };
    const slug = `peerspace-vs-pool-rental-near-me-in-${city.slug}`;
    const title = `Peerspace vs Pool Rental Near Me in ${city.name}, ${city.state_code} (2026)`;
    const description = `${city.name} pool hosts: should you list on Peerspace or Pool Rental Near Me? 10% vs 20% host fee, $2M vs $1M liability, local pricing benchmarks for ${city.name}, ${city.state}.`;
    return {
      ...buildComparisonMeta({ slug, title, description }),
      scripts: [
        articleJsonLd({ slug, title, description }),
        breadcrumbJsonLd([
          { name: "Home", url: "https://www.poolrentalnearme.com/" },
          { name: "Compare", url: "https://www.poolrentalnearme.com/p/peerspace-vs-pool-rental-near-me" },
          {
            name: `Peerspace vs PRNM in ${city.name}`,
            url: `https://www.poolrentalnearme.com/p/${slug}`,
          },
        ]),
        faqJsonLd(buildFaqs(city).map((f) => ({ q: f.q, a: f.a }))),
      ],
    };
  },
  component: PeerspaceCityPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="text-3xl font-bold">City not found</h1>
      <p className="mt-3 text-muted-foreground">
        Try the main{" "}
        <Link to="/p/peerspace-vs-pool-rental-near-me" className="text-primary underline">
          Peerspace vs Pool Rental Near Me comparison
        </Link>{" "}
        instead.
      </p>
    </div>
  ),
});

function buildFaqs(city: CityRow) {
  return [
    {
      q: `Is Peerspace or Pool Rental Near Me better in ${city.name}?`,
      a: `For typical residential pools in ${city.name}, ${city.state} renting at $45–$150/hour for recreational use, Pool Rental Near Me is the better-fit channel: 10% host fee vs Peerspace's 20%, $2M liability vs $1M, and pool-specific guest demand. Peerspace makes sense in ${city.name} if your pool is luxury/photogenic and you want production crew or event-planner bookings at $200+/hour.`,
    },
    {
      q: `What does Peerspace charge ${city.name} pool hosts?`,
      a: `Peerspace charges hosts in ${city.name} the same 20% service fee it charges nationally — applied to the booking subtotal plus add-ons like cleaning. Pool Rental Near Me charges ${city.name} hosts a flat 10% commission.`,
    },
    {
      q: `How much can I earn renting my pool in ${city.name}?`,
      a: `Most ${city.name} pool hosts price between $45 and $150 per hour depending on amenities, capacity, and season. At a 10% Pool Rental Near Me fee on a $300 booking you keep $270; on Peerspace's 20% fee you'd keep $240 — a $30 swing per booking.`,
    },
    {
      q: `Is pool rental legal in ${city.state}?`,
      a: `Pool rentals are legal in most ${city.state} jurisdictions when you carry adequate liability coverage and follow local zoning, occupancy and noise rules. Pool Rental Near Me's $2M liability policy is structured for residential pool hosting. Always check ${city.name} city ordinances before listing.`,
    },
  ];
}

function PeerspaceCityPage() {
  const { city } = Route.useLoaderData() as { city: CityRow };
  const faqs = buildFaqs(city);

  const tableRows = [
    { label: "Host service fee", prnm: <strong>10% flat</strong>, competitor: "20%" },
    { label: `Take-home on $300 ${city.name} booking`, prnm: <strong>$270</strong>, competitor: "$240" },
    { label: "General liability", prnm: <strong>$2M / $4M</strong>, competitor: "$1M" },
    { label: "Property protection", prnm: <strong>$150K STRETCH® PLUS</strong>, competitor: "$25K" },
    { label: `Built for ${city.name} pool guests`, prnm: "Yes — pool-specialized", competitor: "No — general venue marketplace" },
    { label: "Free pool host training", prnm: "70+ courses", competitor: "Generic venue support" },
  ];

  return (
    <ComparisonPage
      competitor="Peerspace"
      title={`Peerspace vs Pool Rental Near Me in ${city.name}`}
      effectiveMonthYear="May 2026"
    >
      <h1>
        Peerspace vs Pool Rental Near Me in {city.name}, {city.state_code} (2026)
      </h1>

      <p>
        If you own a pool in <strong>{city.name}, {city.state}</strong> and
        you're deciding between <strong>Peerspace</strong> and{" "}
        <strong>Pool Rental Near Me</strong>, this guide breaks down which
        platform pays you more per booking, which carries the right insurance
        for residential pool hosting, and which one actually drives{" "}
        {city.name} pool-intent traffic to your listing.
      </p>

      <blockquote>
        <strong>Bottom line for {city.name} pool hosts:</strong> Pool Rental
        Near Me's 10% host fee is half of Peerspace's 20%, and the $2M
        liability is double. For typical {city.name} pools renting at
        $45–$150/hr, Pool Rental Near Me wins on economics. Peerspace wins for
        production-grade luxury pools chasing $200+/hr event bookings.
      </blockquote>

      <CTAPrimary />

      <h2>Quick comparison for {city.name} pool hosts</h2>
      <ComparisonTable competitor="Peerspace" rows={tableRows} />

      <h2>How much can you earn in {city.name}?</h2>
      <p>
        {city.name} pool hosts typically price between <strong>$45 and
        $150 per hour</strong> depending on capacity, amenities, and season.
        On a $300 {city.name} booking:
      </p>
      <ul>
        <li><strong>Pool Rental Near Me (10% fee):</strong> you keep $270</li>
        <li><strong>Peerspace (20% fee):</strong> you keep $240</li>
        <li><strong>Difference:</strong> $30 more per booking on Pool Rental Near Me</li>
      </ul>
      <p>
        Across a 50-booking {city.name} summer season, that's $1,500 in fee
        savings. Run your specific {city.name} numbers in the{" "}
        <a href="https://www.poolrentalnearme.com/p/earnings-calculator">
          earnings calculator
        </a>.
      </p>

      <h2>Why pool-specific demand matters in {city.name}</h2>
      <p>
        Peerspace lists {city.name} pools alongside lofts, studios, and event
        halls — guests browsing Peerspace are often searching for a "venue,"
        not a pool. Pool Rental Near Me's {city.name} traffic comes from
        people who specifically searched for a pool to rent, so listings
        convert at a higher rate per impression.
      </p>
      <p>
        See live {city.name} pool-rental demand on the{" "}
        <Link to="/pool-rental/$city" params={{ city: city.slug }} className="text-primary underline">
          Pool Rental Near Me {city.name} page
        </Link>{" "}
        and the{" "}
        <Link to="/pool-rental-laws/$city" params={{ city: city.slug }} className="text-primary underline">
          {city.name} pool rental laws guide
        </Link>.
      </p>

      <h2>Insurance that actually fits a {city.state} residential pool</h2>
      <p>
        Pool injuries can be catastrophic. Peerspace's <strong>$1M general
        liability</strong> is supplemental coverage built around general
        venue rentals. Pool Rental Near Me's <strong>$2M per-occurrence /
        $4M aggregate</strong> Hartford-backed policy is sized for
        residential pool exposure — plus a $150K STRETCH® PLUS property
        blanket on every approved booking.
      </p>

      <CTAMid />

      <h2>When to list a {city.name} pool on both platforms</h2>
      <p>
        If your {city.name} pool is high-end and photogenic, listing on
        Peerspace for production / event bookings ($200+/hr) and on Pool
        Rental Near Me for recreational hourly rentals ($45–$150/hr) is a
        proven dual-channel strategy. Just sync your calendar to avoid
        double-bookings.
      </p>

      <h2>Get started in {city.name}</h2>
      <ol>
        <li>
          Create your free Pool Rental Near Me listing at{" "}
          <a href="https://earn.poolrentalnearme.com/">earn.poolrentalnearme.com</a>.
        </li>
        <li>Set your {city.name} hourly rate ($45–$150 is the typical band).</li>
        <li>
          Run the{" "}
          <a href="https://www.poolrentalnearme.com/p/learningacademy">
            Pool Host Academy
          </a>{" "}
          intake to optimize your listing.
        </li>
        <li>
          Read the{" "}
          <Link to="/p/$slug" params={{ slug: "peerspace-vs-pool-rental-near-me" }} className="text-primary underline">
            full Peerspace vs Pool Rental Near Me comparison
          </Link>{" "}
          for fees, insurance, and platform-fit detail.
        </li>
      </ol>

      <h2>Frequently asked questions — {city.name}</h2>
      <FAQList faqs={faqs} />

      <AuthorBlock />
      <FooterBlock city={city.name} />
    </ComparisonPage>
  );
}
