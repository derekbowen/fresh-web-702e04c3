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
 * Programmatic city variant of the Peerspace pillar page.
 *
 * Pulls city row from `cities` table to produce locally-relevant copy,
 * pricing context, and internal links — without thin-content duplication.
 * 404s if the city slug isn't a published city, so we don't index junk.
 */

export const Route = createFileRoute("/p/peerspace-vs-pool-rental-near-me-in-{$city}")({
  loader: async ({ params }) => {
    const fullSlug = `peerspace-vs-pool-rental-near-me-in-${params.city}`;
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
    const slug = `peerspace-vs-pool-rental-near-me-in-${city.slug}`;
    const title = `Peerspace vs Pool Rental Near Me in ${city.name}, ${city.state_code} (2026)`;
    const description = `${city.name} pool hosts: should you list on Peerspace or Pool Rental Near Me?`;
    return {
      ...buildComparisonMeta({ slug, title, description }),
      scripts: [
        articleJsonLd({ slug, title, description }),
        breadcrumbJsonLd([
          { name: "Home", url: absUrl("/") },
          { name: "Compare", url: absUrl("/p/peerspace-vs-pool-rental-near-me") },
          {
            name: `Peerspace vs PRNM in ${city.name}`,
            url: absUrl(`/p/${slug}`),
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
      q: `If hosts never pay a fee, how does Pool Rental Near Me make money?`,
      a: `Hosts never pay a fee. We make money from one clear service fee guests pay at checkout, which covers payment processing and 24/7 support. Hosts are the business — we don't tax the business.`,
    },
    {
      q: `Is Peerspace or Pool Rental Near Me better in ${city.name}?`,
      a: `For typical residential pools in ${city.name}, ${city.state} renting at $45–$150/hour for recreational use, Pool Rental Near Me is the better-fit channel: 0% host fee vs Peerspace's 20%, and pool-specific guest demand. Peerspace makes sense in ${city.name} if your pool is luxury/photogenic and you want production crew or event-planner bookings at $200+/hour.`,
    },
    {
      q: `What does Peerspace charge ${city.name} pool hosts?`,
      a: `Peerspace charges hosts in ${city.name} the same 20% service fee it charges nationally — applied to the booking subtotal plus add-ons like cleaning. Pool Rental Near Me charges ${city.name} hosts 0% commission — you keep 100%.`,
    },
    {
      q: `How much can I earn renting my pool in ${city.name}?`,
      a: `Most ${city.name} pool hosts price between $45 and $150 per hour depending on amenities, capacity, and season. With 0% Pool Rental Near Me host fees, on a $300 booking you keep the full $300; on Peerspace's 20% fee you'd keep $240 — a $60 swing per booking.`,
    },
    {
      q: `Is pool rental legal in ${city.state}?`,
      a: `Pool rentals are legal in most ${city.state} jurisdictions when you carry adequate liability coverage and follow local zoning, occupancy and noise rules. Pool Rental Near Me does not provide or arrange insurance — every booking requires a signed guest waiver, and we do not verify whether hosts carry insurance. Always check ${city.name} city ordinances before listing.`,
    },
  ];
}

function PeerspaceCityPage() {
  const { city } = Route.useLoaderData() as { city: CityRow };
  const faqs = buildFaqs(city);

  const tableRows = [
    { label: "Host service fee", prnm: <strong>0%</strong>, competitor: "20%" },
    { label: `Take-home on $300 ${city.name} booking`, prnm: <strong>$300</strong>, competitor: "$240" },
    { label: "Platform-provided insurance", prnm: "None — signed guest waiver on every booking", competitor: "$1M liability + $25K property guarantee" },
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
        platform pays you more per booking, how each handles insurance
        for residential pool hosting, and which one actually drives{" "}
        {city.name} pool-intent traffic to your listing.
      </p>

      <blockquote>
        <strong>Bottom line for {city.name} pool hosts:</strong> Pool Rental
        Near Me's 0% host fee beats Peerspace's 20%. For typical {city.name} pools renting at
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
        <li><strong>Pool Rental Near Me (0% fee, 2026):</strong> you keep $300</li>
        <li><strong>Peerspace (20% fee):</strong> you keep $240</li>
        <li><strong>Difference:</strong> $60 more per booking on Pool Rental Near Me</li>
      </ul>
      <p>
        Across a 50-booking {city.name} summer season, that's $3,000 in fee
        savings. Run your specific {city.name} numbers in the{" "}
        <a href="/p/earnings-calculator">
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
        See live {city.name} pool-rental demand in{" "}
        <a href={`/s?address=${encodeURIComponent(`${city.name}, ${city.state_code}`)}`} className="text-primary underline">
          marketplace search
        </a>{" "}
        and review the{" "}
        <a href="/p/elearning-academy-permit-licensing-requirements-pool-hosts" className="text-primary underline">
          permit and licensing guide
        </a>.
      </p>

      <h2>Insurance for a {city.state} residential pool</h2>
      <p>
        Pool injuries can be catastrophic, so understand each platform's
        model before listing. Peerspace publishes a <strong>$1M host
        liability</strong> policy plus a $25K Property Damage Guarantee for
        qualifying bookings. Pool Rental Near Me does not provide or arrange
        insurance: every booking requires a <strong>signed guest
        waiver</strong>, and we do not verify whether hosts carry insurance —
        most homeowner policies exclude paid rentals, so talk to your
        carrier before hosting in {city.name}.
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
          <a href="/p/start-hosting">poolrentalnearme.com/p/start-hosting</a>.
        </li>
        <li>Set your {city.name} hourly rate ($45–$150 is the typical band).</li>
        <li>
          Run the{" "}
          <a href="/p/learningacademy">
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
