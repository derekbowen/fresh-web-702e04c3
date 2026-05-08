import { createFileRoute } from "@tanstack/react-router";
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

const SLUG = "giggster-vs-pool-rental-near-me";
const TITLE =
  "Giggster vs Pool Rental Near Me (2026): Fees, Insurance & Best Use Cases";
const DESCRIPTION =
  "Side-by-side 2026 comparison of Giggster vs Pool Rental Near Me for pool owners — verified 19% vs 10% host commission, COI vs included $2M insurance, production vs recreational buyers, and which platform pays more in LA, NYC, Atlanta, Austin, and Chicago.";

const faqs = [
  {
    q: "What is the Giggster host commission in 2026?",
    a: "Per Giggster's published Help Center article \"How much commission does Giggster take?\" (last updated by Giggster staff April 13, 2023, still live as of May 2026): \"Giggster takes a 19% commission out of the host's total payout (location fee + additional fees (if any)) for the booking.\" Giggster also collects a separate Processing Fee from the renter that scales with the overall cost and features of the booking. Pool Rental Near Me charges a flat 10% host commission plus a 10% renter service fee.",
  },
  {
    q: "Is Giggster a pool rental marketplace?",
    a: "Giggster is a production-location marketplace — film shoots, photo shoots, video, commercials, and events. Pools are listed as one Giggster category, but Giggster's buyer base is production crews and event renters, not families booking weekend swim time. Pool Rental Near Me is built specifically for recreational, hourly residential pool rentals.",
  },
  {
    q: "What insurance does Giggster require vs Pool Rental Near Me?",
    a: "Per Giggster's Help Center articles \"As a host, do I need insurance?\" and \"Do I need insurance to host production?\": Giggster hosts must carry their own homeowner's insurance, and renters must provide a Certificate of Insurance (COI) with at least $2 million in general liability + property damage before each booking. Renters can buy Giggster's optional Production/Event Insurance at checkout or supply their own. Pool Rental Near Me's parent company PRNM Corp maintains a Business Owner's Policy through Hartford Underwriters that provides $2,000,000 per-occurrence / $4,000,000 aggregate general liability, $10,000 medical-expenses-per-person, and a $150,000 STRETCH® PLUS property coverage blanket on every approved booking — no separate renter COI required.",
  },
  {
    q: "On a $400 pool booking, how much do I keep on Giggster vs PRNM?",
    a: "On Pool Rental Near Me, a $400 host payout is reduced by the 10% host commission ($40), so you keep $360 before payment processing. On Giggster, a $400 host payout is reduced by the 19% host commission ($76), so you keep $324. PRNM hosts keep approximately $36 more per $400 booking. The renter-side fees on each platform are separate and are charged to the renter, not the host.",
  },
  {
    q: "Can I list my pool on both Giggster and Pool Rental Near Me at the same time?",
    a: "Yes. Many pool owners in production-hub markets like Los Angeles, New York, Atlanta, Austin, and Chicago run both: premium per-hour production rates ($150–$500+/hour) on Giggster targeting film/photo crews, and recreational hourly rates ($45–$150/hour) on Pool Rental Near Me targeting families and small parties. Sync your calendar across both platforms to prevent conflicts.",
  },
  {
    q: "Does Giggster have a pool host training program?",
    a: "Giggster's Help Center is production-focused — COIs, location agreements, custom rates, payouts. Pool Rental Near Me ships the Pool Host Academy: 70+ free courses on pool-specific safety, liability waiver workflows, the HOA Defense Kit, marketing, listing setup, and revenue optimization, plus a free liability waiver generator at RentalWaivers.com.",
  },
  {
    q: "Which platform earns more in Los Angeles?",
    a: "It depends on your pool. If your pool is camera-ready and you can host weekday production crews, Giggster's production buyers in LA often pay $150–$500+/hour and can outpace recreational rates per booking. For weekend recreational bookings from LA-area families, friend groups, and small parties, Pool Rental Near Me's recreational buyer base is the better fit. Many LA pools list on both and segment availability.",
  },
  {
    q: "Is Giggster the same as Gigster?",
    a: "No. Giggster (with two G's) is the production-location marketplace discussed on this page. Gigster (with one G) is an unrelated software-development talent marketplace. They are different companies with different business models.",
  },
  {
    q: "Where is Giggster strongest geographically?",
    a: "Giggster was founded in 2016 in Los Angeles and is heaviest in production-hub markets — Los Angeles, New York City, Atlanta, Austin, Chicago, and select international hubs. Outside of those production hubs, Giggster's buyer demand for pools thins out, because production scouts (not local families) are the demand source.",
  },
  {
    q: "How is the renter checkout fee structured on Giggster?",
    a: "Per Giggster's Help Center, in addition to the 19% host commission Giggster collects a Processing Fee from the renter at checkout. Giggster states the percentage \"often depends on the overall cost and features of the booking\" and that the rate can decrease as booking size increases. Exact figures are disclosed at checkout. Always verify current renter-side fees against Giggster's published terms.",
  },
];

export const Route = createFileRoute("/p/giggster-vs-pool-rental-near-me")({
  component: GiggsterComparisonPage,
  head: () => ({
    ...buildComparisonMeta({ slug: SLUG, title: TITLE, description: DESCRIPTION }),
    scripts: [
      faqJsonLd(faqs.map((f) => ({ q: f.q, a: f.a }))),
      articleJsonLd({
        slug: SLUG,
        title: TITLE,
        description: DESCRIPTION,
        datePublished: "2026-01-15",
        dateModified: "2026-05-05",
      }),
      breadcrumbJsonLd([
        { name: "Home", url: absUrl("/") },
        { name: "Compare", url: absUrl("/p/") },
        {
          name: "Giggster vs Pool Rental Near Me",
          url: absUrl(`/p/${SLUG}`),
        },
      ]),
    ],
  }),
});

function GiggsterComparisonPage() {
  return (
    <ComparisonPage
      competitor="Giggster"
      title="Giggster vs Pool Rental Near Me"
      effectiveMonthYear="May 2026"
    >
      <h1>Giggster vs Pool Rental Near Me (2026): Fees, Insurance &amp; Best Use Cases</h1>

      <p className="text-sm text-muted-foreground">
        <em>
          Last updated May 5, 2026. All Giggster figures cited below are taken directly
          from Giggster's published Help Center articles and Terms of Service as of
          this date. Always verify current terms with each platform before listing.
        </em>
      </p>

      <p>
        If you own a pool and you're trying to decide between{" "}
        <strong>Giggster</strong> and <strong>Pool Rental Near Me (PRNM)</strong>,
        the short answer is that these two marketplaces serve fundamentally
        different buyers. <strong>Giggster</strong> is a{" "}
        <em>production-location</em> marketplace — film, photo, video, commercials,
        and events — so the people booking your pool are production crews
        carrying COIs and shoot calls, not families showing up for a Saturday
        birthday party. <strong>Pool Rental Near Me</strong> is built specifically
        for <em>recreational, hourly residential pool rentals</em> — families,
        friend groups, small parties, and casual swims.
      </p>

      <p>
        That single difference drives everything else: fee structure, insurance
        model, geographic reach, host-support tooling, and the kind of pool that
        actually earns on each platform. Below is the verified 2026 head-to-head.
      </p>

      <blockquote>
        <strong>TL;DR — Giggster vs Pool Rental Near Me (May 2026)</strong>
        <ul>
          <li>
            <strong>Host commission:</strong> 10% on PRNM vs{" "}
            <strong>19% on Giggster</strong> (Giggster Help Center, April 2023, still live).
          </li>
          <li>
            <strong>Insurance:</strong> PRNM includes $2M / $4M Hartford-backed general
            liability on every approved booking. Giggster requires the host to carry
            homeowner's insurance and the renter to supply a $2M COI.
          </li>
          <li>
            <strong>Buyer base:</strong> Giggster = production crews. PRNM = recreational
            renters.
          </li>
          <li>
            <strong>Geography:</strong> Giggster is strongest in LA, NYC, Atlanta,
            Austin, Chicago. PRNM is active across 40+ U.S. states.
          </li>
          <li>
            <strong>Smartest play if your pool fits both:</strong> list on both, segment
            calendars, charge production rates on Giggster and recreational rates on PRNM.
          </li>
        </ul>
      </blockquote>

      <CTAPrimary />

      <h2>At-a-glance comparison</h2>

      <ComparisonTable
        competitor="Giggster"
        rows={[
          {
            label: "Primary use case",
            prnm: "Recreational hourly pool rentals (families, parties, small events)",
            competitor:
              "Film, photo, video, commercial & event production locations",
          },
          {
            label: "Host commission",
            prnm: "10% flat on completed booking subtotal",
            competitor:
              "19% of host payout (location fee + additional fees) — per Giggster Help Center",
          },
          {
            label: "Renter-side fee",
            prnm: "10% renter service fee",
            competitor:
              "Variable Processing Fee at checkout (Giggster: \"depends on the overall cost and features of the booking\")",
          },
          {
            label: "Included liability insurance",
            prnm: "$2M per-occurrence / $4M aggregate (Hartford) on every approved booking",
            competitor:
              "Not included — host must carry homeowner's insurance; renter must supply $2M COI for production bookings",
          },
          {
            label: "Property damage coverage",
            prnm: "$150K STRETCH® PLUS blanket on every approved booking",
            competitor:
              "Per renter-supplied COI (or Giggster's optional add-on Production/Event Insurance at checkout)",
          },
          {
            label: "Medical expense coverage",
            prnm: "$10,000 per person on every approved booking",
            competitor: "Not published as a host-side included benefit",
          },
          {
            label: "Typical hourly rate range",
            prnm: "$45–$150 / hour recreational",
            competitor: "$150–$500+ / hour production (in production-hub cities)",
          },
          {
            label: "Pool-specific host training",
            prnm: "Pool Host Academy — 70+ free courses, HOA Defense Kit, waiver generator",
            competitor: "Production-focused help center — COIs, payouts, location agreements",
          },
          {
            label: "Strongest markets",
            prnm: "40+ U.S. states; suburban + urban recreational demand",
            competitor: "Los Angeles, New York, Atlanta, Austin, Chicago",
          },
          {
            label: "Best for hosts who…",
            prnm: "Want predictable recreational weekend bookings + included insurance",
            competitor:
              "Have a camera-ready pool in a production-hub city and can host weekday crews",
          },
        ]}
      />

      <h2 id="fees">Fee structure: what you actually keep</h2>

      <p>
        Giggster's Help Center article "How much commission does Giggster take?"
        states verbatim: <em>"Giggster takes a 19% commission out of the host's
        total payout (location fee + additional fees (if any)) for the
        booking."</em><sup>[¹]</sup> Giggster also collects a separate{" "}
        <strong>Processing Fee</strong> from the renter at checkout that scales
        with booking size and features.
      </p>

      <ul>
        <li>
          <strong>Pool Rental Near Me:</strong> 10% host commission + 10% renter
          service fee. Hosts keep 90% of the booking subtotal.
        </li>
        <li>
          <strong>Giggster:</strong> 19% host commission on location fee + add-ons,
          plus a separate renter-side processing fee disclosed at checkout.
        </li>
      </ul>

      <h3 id="earnings-examples">Real-money earnings examples</h3>
      <p>
        Same gross host payout, two platforms, before payment-processing nets out:
      </p>

      <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Gross host payout</th>
              <th className="px-4 py-3 text-left font-semibold text-primary">
                You keep on PRNM (10%)
              </th>
              <th className="px-4 py-3 text-left font-semibold">
                You keep on Giggster (19%)
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
        On a $3,000 production-style booking, you'd keep <strong>$270 more</strong>{" "}
        on PRNM than on Giggster from the same gross host payout. The flip side
        is that Giggster's average production booking on a camera-ready pool can
        be substantially larger than a typical recreational booking — so on volume,
        the right answer is often <em>both</em>, not <em>either</em>.
      </p>

      <h2 id="insurance">Insurance &amp; liability coverage (the most important section)</h2>

      <p>
        For a residential pool host, insurance is the single biggest risk
        consideration. The two platforms approach it very differently.
      </p>

      <h3>Giggster's insurance model</h3>
      <p>
        Giggster's Help Center article <em>"As a host, do I need insurance?"</em>{" "}
        cites Section 13 of the Giggster Terms of Service: hosts are required to
        carry sufficient homeowner's insurance, and to the extent they do not,
        they must require the renter to obtain it before the booking
        starts.<sup>[²]</sup> For production bookings specifically, Giggster's{" "}
        <em>"Do I need insurance to host production?"</em> article states that
        every renter must carry production insurance with{" "}
        <strong>at least $2 million in general liability and property damage</strong>{" "}
        and provide the host with a Certificate of Insurance (COI) before the
        shoot.<sup>[³]</sup> Renters can purchase Giggster's optional
        Production/Event Insurance at checkout, or supply their own.
      </p>
      <p>
        In other words: on Giggster, the host carries homeowner's coverage and
        the host (or Giggster's checkout) chases the renter's COI for each
        booking. This is normal and well-documented for production rentals — but
        it is operational overhead.
      </p>

      <h3>Pool Rental Near Me's insurance model</h3>
      <p>
        PRNM Corp maintains a Business Owner's Policy through Hartford Underwriters
        that automatically covers every approved booking with no separate renter
        policy required:
      </p>
      <ul>
        <li>
          <strong>$2,000,000 per-occurrence / $4,000,000 aggregate</strong> general
          liability
        </li>
        <li><strong>$10,000 medical expenses</strong> per person</li>
        <li>
          <strong>$150,000 STRETCH® PLUS</strong> property coverage blanket
        </li>
      </ul>
      <p>
        For a recreational, residential pool host the practical upshot is that
        you don't need to chase COIs per booking, and you have a verifiable
        carrier-backed liability layer on top of your own homeowner's
        coverage.<sup>[⁴]</sup>
      </p>

      <h2 id="buyers">Buyer base: who's actually booking your pool</h2>
      <p>
        This is the deciding factor for most pool owners and the one most
        comparison articles miss.
      </p>
      <ul>
        <li>
          <strong>Giggster buyers</strong> are location scouts, production
          coordinators, indie filmmakers, photographers, content creators,
          short-form video producers, and event planners. They book on weekdays,
          they bring crews and equipment, they need parking and load-in space,
          and they pay premium per-hour rates because the location is a
          production line item.
        </li>
        <li>
          <strong>Pool Rental Near Me buyers</strong> are families, friend
          groups, birthday parties, swim lessons, low-key bachelorette and
          bachelor groups, fitness clients, and small private events. They book
          mostly on weekends and in summer, they want a clean pool and clear
          house rules, and they pay typical recreational hourly rates ($45–$150
          / hour, with weekend premiums and amenity add-ons).
        </li>
      </ul>
      <p>
        If your pool is photogenic, fenced, has clean sightlines, isn't
        overlooked by neighbors, and you live in a production-hub metro,
        Giggster's buyer base is real money. If your pool is a normal nice
        backyard pool in a residential neighborhood and you're outside of LA /
        NYC / ATL / Austin / Chicago, your demand will be overwhelmingly
        recreational.
      </p>

      <h2 id="geography">Geography &amp; marketplace maturity</h2>
      <p>
        Giggster was founded in 2016 in Los Angeles and concentrates demand in
        production-hub metros — primarily Los Angeles, New York City, Atlanta,
        Austin, Chicago, and a handful of international hubs. Outside of those
        markets, Giggster pool inventory exists but the buyer flow is much
        thinner because production scouts are the demand source.
      </p>
      <p>
        Pool Rental Near Me runs across 40+ U.S. states with city-level pool
        rental hubs — see the live{" "}
        <a href="/p/all-locations">
          all PRNM cities
        </a>{" "}
        directory. Recreational pool demand is broadly distributed by population
        and weather, which is why PRNM works in suburban and secondary metros
        that production marketplaces don't reach.
      </p>

      <h3 id="city-breakdown">City-by-city: Giggster vs PRNM</h3>

      <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">City</th>
              <th className="px-4 py-3 text-left font-semibold text-primary">
                Best fit
              </th>
              <th className="px-4 py-3 text-left font-semibold">Why</th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                "Los Angeles, CA",
                "Both",
                "Strong production buyers on Giggster (weekday) + huge recreational demand on PRNM (weekend).",
              ],
              [
                "New York / NYC metro",
                "Both",
                "Production work pays well on Giggster; PRNM captures the recreational summer market in LI, NJ, Westchester.",
              ],
              [
                "Atlanta, GA",
                "Both (production tilt)",
                "Major U.S. production hub. Giggster strong; PRNM growing fast for recreational backyard rentals.",
              ],
              [
                "Austin, TX",
                "Both",
                "Production + tech events on Giggster; year-round recreational demand on PRNM.",
              ],
              [
                "Chicago, IL",
                "Both (seasonal)",
                "Giggster handles production; PRNM owns the short, intense Midwest summer recreational window.",
              ],
              [
                "Miami, FL",
                "PRNM-led",
                "Year-round recreational demand vastly outsizes production demand for residential pools.",
              ],
              [
                "Phoenix / Scottsdale, AZ",
                "PRNM-led",
                "Heat + bachelorette / party tourism = recreational pool demand. Production demand much smaller.",
              ],
              [
                "Las Vegas, NV",
                "PRNM-led",
                "Party / event recreational demand dominates; production requests exist but are secondary.",
              ],
              [
                "Dallas–Fort Worth, TX",
                "PRNM-led",
                "Suburban recreational demand is the volume play; Giggster is thinner here for pools.",
              ],
              [
                "Houston, TX",
                "PRNM-led",
                "Heat-driven recreational demand; production work concentrates further south and west.",
              ],
              [
                "Tampa / Orlando, FL",
                "PRNM-led",
                "Family + tourism recreational demand; theme-park-adjacent rentals.",
              ],
              [
                "Anywhere not listed above",
                "PRNM",
                "Production buyers don't scout outside hub metros. Recreational demand exists almost everywhere there are pools.",
              ],
            ].map(([city, fit, why]) => (
              <tr key={city} className="border-t border-border align-top">
                <td className="px-4 py-3 font-medium text-foreground">{city}</td>
                <td className="px-4 py-3 text-foreground">{fit}</td>
                <td className="px-4 py-3 text-muted-foreground">{why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 id="training">Host support &amp; training</h2>
      <p>
        Giggster's help center and resources are production-focused — Certificates
        of Insurance, Location Agreements, custom rate negotiation, payout
        mechanics, crew logistics. Useful and well-documented if production work
        is your business.
      </p>
      <p>
        Pool Rental Near Me ships the{" "}
        <a href="/p/learningacademy">
          Pool Host Academy
        </a>: 70+ free courses purpose-built for residential pool hosting,
        including pool safety,{" "}
        <a href="/p/elearning-academy-liability-waivers-that-protect-you-how-to-create-course">
          liability waivers
        </a>, the{" "}
        <a href="/p/hoa-pool-rental-defense-kit">
          HOA Defense Kit
        </a>,{" "}
        <a href="/p/elearning-academy-maximizing-revenue-upselling-pool-amenities">
          revenue optimization &amp; amenity upsells
        </a>, marketing, and listing setup. Plus a free liability waiver generator
        at{" "}
        <a href="https://www.rentalwaivers.com" rel="noopener">
          RentalWaivers.com
        </a>{" "}
        sized for recreational guest groups.
      </p>

      <h2 id="vetting">Vetting, safety, and trust standards</h2>
      <p>
        Giggster verifies renter accounts, supports custom rate negotiation per
        shoot, and routes production bookings through its Location Agreement.
        PRNM verifies guest identity at booking, lets hosts approve every
        reservation individually, and ships a free liability waiver workflow
        plus pool-specific safety training that's not part of Giggster's
        production-oriented stack.
      </p>

      <h2 id="cancellation">Cancellation policies and host control</h2>
      <p>
        Both platforms publish cancellation policies and let hosts approve
        bookings. Giggster supports custom-rate negotiations for production
        bookings; PRNM supports standard recreational hourly rate cards with
        weekday / weekend pricing tiers and amenity add-ons.
      </p>

      <h2 id="when-giggster">When Giggster is the right choice</h2>
      <p>Pick Giggster (or list there in addition to PRNM) if:</p>
      <ul>
        <li>
          Your pool is in <strong>LA, NYC, Atlanta, Austin, or Chicago</strong>{" "}
          and is genuinely camera-ready (clean sightlines, photogenic surround,
          good light).
        </li>
        <li>
          You can host production crews on <strong>weekdays</strong> at{" "}
          <strong>$150–$500+ per hour</strong> without disrupting your household.
        </li>
        <li>
          You're comfortable working with COIs, custom rates, and production-crew
          logistics.
        </li>
        <li>
          Your goal is fewer, larger production bookings rather than steady
          recreational volume.
        </li>
      </ul>

      <h2 id="when-prnm">When Pool Rental Near Me is the right choice</h2>
      <p>Pick PRNM (or list there in addition to Giggster) if:</p>
      <ul>
        <li>
          You want to <strong>keep 90%</strong> of every booking subtotal at a
          flat published rate.
        </li>
        <li>
          You want guaranteed <strong>$2M general liability</strong> on every
          approved booking — no COIs to chase.
        </li>
        <li>
          Your buyers are <strong>families, friend groups, and small parties</strong>{" "}
          paying $45–$150 / hour.
        </li>
        <li>
          You want structured{" "}
          <a href="/p/learningacademy">
            free training
          </a>{" "}
          purpose-built for residential pool hosting.
        </li>
        <li>
          You're <a href="/p/howithostsworks">
            becoming a host
          </a>{" "}
          outside the major production-hub metros, where Giggster's buyer flow
          for pools is thin.
        </li>
      </ul>

      <CTAMid />

      <h2 id="run-both">How to run both Giggster and PRNM (the smart play)</h2>
      <ol>
        <li>
          Keep your Giggster listing tuned for production crews: premium per-hour
          rates, stricter rules, weekday availability, COI-ready language.
        </li>
        <li>
          Create your free PRNM listing at{" "}
          <a href="https://earn.poolrentalnearme.com/" rel="noopener">
            earn.poolrentalnearme.com
          </a>{" "}
          with recreational pricing and weekend party capacity.
        </li>
        <li>
          Sync your calendar across both platforms (or block manually) to prevent
          double-bookings.
        </li>
        <li>
          Run the{" "}
          <a href="/p/learningacademy">
            Pool Host Academy
          </a>{" "}
          intake modules to optimize your PRNM recreational listing — listing
          photo composition, amenity upsells, waiver setup, HOA defense.
        </li>
        <li>
          Track which booking type generates more profit per weekend hour for
          <em> your</em> specific pool, then bias availability toward the higher-yield
          channel.
        </li>
      </ol>

      <h2 id="bottom-line">The honest bottom line</h2>
      <p>
        Giggster and Pool Rental Near Me are not really competitors — they are{" "}
        <em>complementary</em> marketplaces serving two different pool-rental
        economies. If we had to pick one for a typical residential pool host,
        PRNM wins on fees (10% vs 19%), included insurance ($2M / $4M Hartford
        on every booking vs renter-supplied COI), buyer fit (recreational vs
        production), and pool-specific training (Pool Host Academy vs production
        help center).
      </p>
      <p>
        If you're in a production-hub city <em>and</em> your pool is camera-ready,
        the highest-yield strategy is to run both, not to pick one.
      </p>

      <h2 id="faq">Frequently asked questions</h2>
      <FAQList faqs={faqs} />

      <AuthorBlock />

      <h2>📊 Sources &amp; footnotes</h2>
      <ol>
        <li>
          <strong>Giggster 19% host commission</strong> — Giggster Help Center,
          "How much commission does Giggster take?" (last updated by Alison
          O'Brien, April 13, 2023; verified live as of May 5, 2026):{" "}
          <em>"Giggster takes a 19% commission out of the host's total payout
          (location fee + additional fees (if any)) for the booking."</em>{" "}
          Source:{" "}
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
          Service §13). Source:{" "}
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
          <em>"a $2 million minimum in general liability and property damage"</em>{" "}
          and supply the host with a Certificate of Insurance before the shoot.
          Source:{" "}
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
          Corp maintains a Business Owner's Policy through Hartford Underwriters
          providing $2M per-occurrence / $4M aggregate general liability,
          $10,000 medical expenses per person, and a $150,000 STRETCH® PLUS
          property coverage blanket on every approved booking at no cost to
          the host. Full terms in the{" "}
          <a href="/p/terms-of-service">
            Pool Rental Near Me Terms of Service
          </a>
          .
        </li>
        <li>
          <strong>10% PRNM host commission</strong> — Pool Rental Near Me charges
          hosts a 10% platform fee on completed bookings plus a 10% renter
          service fee. Rates current as of May 2026; verify in-app at booking.
        </li>
        <li>
          <strong>70+ Pool Host Academy courses</strong> — Free training library:{" "}
          <a href="/p/learningacademy">
            poolrentalnearme.com/p/learningacademy
          </a>
          .
        </li>
      </ol>

      <p className="text-xs text-muted-foreground">
        <em>
          Disclaimer: This page is an informational comparison written by Pool
          Rental Near Me. We are not affiliated with Giggster. All Giggster facts
          are sourced from Giggster's own published Help Center articles and
          Terms of Service as of May 5, 2026 and were verified directly against
          those URLs at publication. Fees, insurance terms, and policies on
          either platform may change; before listing or booking, always verify
          the current published terms on each platform.
        </em>
      </p>

      <FooterBlock />
    </ComparisonPage>
  );
}
