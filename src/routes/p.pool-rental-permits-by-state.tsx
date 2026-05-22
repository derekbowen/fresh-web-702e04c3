import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import {
  buildMeta,
  breadcrumbJsonLd,
  ldJsonScript,
  SITE_URL,
  SITE_NAME,
} from "@/lib/seo";
import { ADVOCACY_STATES } from "@/lib/advocacy-states";

const PATH = "/p/pool-rental-permits-by-state";
const TITLE =
  "Pool rental permits by state: 50-state guide for hourly pool hosts (2026)";
const DESCRIPTION =
  "What you legally need to host an hourly pool rental in each US state. Short-term rental registrations, business licenses, health-department rules, HOA exposure, and county-level callouts. Sourced from state and city code.";
const LAST_UPDATED = "2026-05-22";

type StateRow = {
  code: string;
  name: string;
  difficulty: "Easy" | "Moderate" | "Hard";
  permitNeeded: "No" | "Sometimes" | "Often" | "Yes";
  notableCounties: string;
};

// Quick-reference difficulty grading. Detailed per-state code, ordinances,
// and county callouts live on each state's /p/host-advocacy-{state} page.
const ROWS: StateRow[] = [
  { code: "AL", name: "Alabama",        difficulty: "Easy",     permitNeeded: "No",        notableCounties: "Most counties unregulated; Mobile and Baldwin tax STR through county lodging tax" },
  { code: "AK", name: "Alaska",         difficulty: "Easy",     permitNeeded: "No",        notableCounties: "Anchorage and Juneau collect bed tax on STR; no state pool rental statute" },
  { code: "AZ", name: "Arizona",        difficulty: "Moderate", permitNeeded: "Often",     notableCounties: "Scottsdale, Paradise Valley, Sedona, and Phoenix all require STR registration; Maricopa County permits residential pools" },
  { code: "AR", name: "Arkansas",       difficulty: "Easy",     permitNeeded: "No",        notableCounties: "No statewide registry; Little Rock and Fayetteville require business privilege license" },
  { code: "CA", name: "California",     difficulty: "Hard",     permitNeeded: "Often",     notableCounties: "Los Angeles, San Diego, Orange (Newport Beach, Laguna), Riverside (Palm Springs, La Quinta), and Sonoma counties have aggressive STR and event-rental ordinances; Title 24 pool barrier rules apply statewide" },
  { code: "CO", name: "Colorado",       difficulty: "Moderate", permitNeeded: "Sometimes", notableCounties: "Denver, Boulder, and most mountain resort counties (Summit, Eagle, Pitkin) require STR license; Front Range cities increasingly fold pool rentals into STR code" },
  { code: "CT", name: "Connecticut",    difficulty: "Easy",     permitNeeded: "No",        notableCounties: "No statewide STR registry; some shoreline towns (Westport, Greenwich) restrict commercial backyard use through zoning" },
  { code: "DE", name: "Delaware",       difficulty: "Easy",     permitNeeded: "No",        notableCounties: "Sussex County (beach towns) applies lodging tax to STR; no pool-specific rule" },
  { code: "FL", name: "Florida",        difficulty: "Hard",     permitNeeded: "Often",     notableCounties: "Miami-Dade, Broward, Orange (Orlando), Osceola, Pinellas, and Collier all enforce STR registration with inspections; HOA pre-emption under FL 720 limits but does not eliminate HOA pushback" },
  { code: "GA", name: "Georgia",        difficulty: "Moderate", permitNeeded: "Sometimes", notableCounties: "Atlanta (Fulton, DeKalb), Savannah (Chatham), and Tybee Island require STR permits; rural counties unregulated" },
  { code: "HI", name: "Hawaii",         difficulty: "Hard",     permitNeeded: "Yes",       notableCounties: "Honolulu (Oahu) caps STR by zone with Bill 41; Maui and Kauai counties enforce strict TVR rules; pool rentals fall under same code" },
  { code: "ID", name: "Idaho",          difficulty: "Easy",     permitNeeded: "Sometimes", notableCounties: "Boise and McCall require STR registration; Idaho state law (HB 216) preempts outright bans" },
  { code: "IL", name: "Illinois",       difficulty: "Moderate", permitNeeded: "Sometimes", notableCounties: "Chicago requires STR license through BACP; Cook County collects hotel accommodations tax; downstate largely unregulated" },
  { code: "IN", name: "Indiana",        difficulty: "Easy",     permitNeeded: "Sometimes", notableCounties: "Indianapolis (Marion) and Bloomington (Monroe) require STR registration; state law (HEA 1035) limits municipal bans" },
  { code: "IA", name: "Iowa",           difficulty: "Easy",     permitNeeded: "No",        notableCounties: "No state STR registry; Des Moines and Iowa City require local rental permits" },
  { code: "KS", name: "Kansas",         difficulty: "Easy",     permitNeeded: "No",        notableCounties: "No state pool-rental statute; Wichita and Overland Park apply general business license" },
  { code: "KY", name: "Kentucky",       difficulty: "Easy",     permitNeeded: "Sometimes", notableCounties: "Louisville (Jefferson) and Lexington (Fayette) require STR registration; rural and bourbon-trail counties largely open" },
  { code: "LA", name: "Louisiana",      difficulty: "Moderate", permitNeeded: "Often",     notableCounties: "Orleans Parish (New Orleans) enforces strict STR permitting with primary-residence rule; East Baton Rouge and Lafayette require STR license" },
  { code: "ME", name: "Maine",          difficulty: "Easy",     permitNeeded: "Sometimes", notableCounties: "Portland (Cumberland) and Bar Harbor (Hancock) require STR registration; most rural counties unregulated" },
  { code: "MD", name: "Maryland",       difficulty: "Moderate", permitNeeded: "Sometimes", notableCounties: "Montgomery and Baltimore counties enforce STR licensing; Ocean City (Worcester) charges short-term lodging tax" },
  { code: "MA", name: "Massachusetts",  difficulty: "Hard",     permitNeeded: "Yes",       notableCounties: "State STR registration required statewide since 2019; Boston (Suffolk), Cape Cod (Barnstable), Nantucket, and Martha's Vineyard add local layers" },
  { code: "MI", name: "Michigan",       difficulty: "Easy",     permitNeeded: "Sometimes", notableCounties: "No state STR statute; Traverse City (Grand Traverse), Saugatuck (Allegan), and Ann Arbor (Washtenaw) regulate locally" },
  { code: "MN", name: "Minnesota",      difficulty: "Easy",     permitNeeded: "Sometimes", notableCounties: "Minneapolis (Hennepin) and St. Paul (Ramsey) require STR license; lake counties (Cass, Crow Wing) increasingly add fees" },
  { code: "MS", name: "Mississippi",    difficulty: "Easy",     permitNeeded: "No",        notableCounties: "Gulf Coast counties (Harrison, Hancock) collect tourism tax; no state pool rule" },
  { code: "MO", name: "Missouri",       difficulty: "Easy",     permitNeeded: "Sometimes", notableCounties: "St. Louis and Kansas City both require STR license; Branson (Taney) and Lake of the Ozarks counties enforce resort-area rules" },
  { code: "MT", name: "Montana",        difficulty: "Easy",     permitNeeded: "Sometimes", notableCounties: "Bozeman (Gallatin), Missoula, and Whitefish (Flathead) require STR registration; rural counties largely open" },
  { code: "NE", name: "Nebraska",       difficulty: "Easy",     permitNeeded: "No",        notableCounties: "Omaha and Lincoln apply general occupation tax; no STR-specific rule" },
  { code: "NV", name: "Nevada",         difficulty: "Hard",     permitNeeded: "Yes",       notableCounties: "Clark County (Las Vegas, Henderson, Paradise) caps STR with new licensing regime under AB 363; Washoe (Reno) enforces local STR permitting" },
  { code: "NH", name: "New Hampshire",  difficulty: "Easy",     permitNeeded: "Sometimes", notableCounties: "Portsmouth, Conway, and lake-region towns require STR license; rural counties unregulated" },
  { code: "NJ", name: "New Jersey",     difficulty: "Moderate", permitNeeded: "Sometimes", notableCounties: "Jersey Shore towns (Cape May, Ocean, Monmouth) enforce STR registration; state imposes occupancy tax on short-term lodging" },
  { code: "NM", name: "New Mexico",     difficulty: "Easy",     permitNeeded: "Sometimes", notableCounties: "Santa Fe and Taos require STR permits; Albuquerque (Bernalillo) registers STR with the city" },
  { code: "NY", name: "New York",       difficulty: "Hard",     permitNeeded: "Yes",       notableCounties: "NYC (Local Law 18) effectively bans most unhosted STR; Hudson Valley (Ulster, Dutchess) and Hamptons (Suffolk) enforce strict local rules; upstate counties more permissive" },
  { code: "NC", name: "North Carolina", difficulty: "Moderate", permitNeeded: "Sometimes", notableCounties: "Asheville (Buncombe), Wilmington (New Hanover), and Outer Banks (Dare, Currituck) require STR registration; mountain and coastal counties most active" },
  { code: "ND", name: "North Dakota",   difficulty: "Easy",     permitNeeded: "No",        notableCounties: "No statewide registry; Fargo and Bismarck apply general business license" },
  { code: "OH", name: "Ohio",           difficulty: "Easy",     permitNeeded: "Sometimes", notableCounties: "Columbus (Franklin), Cleveland (Cuyahoga), and Cincinnati (Hamilton) require STR registration; rural counties unregulated" },
  { code: "OK", name: "Oklahoma",       difficulty: "Easy",     permitNeeded: "No",        notableCounties: "Oklahoma City and Tulsa apply general business license; no STR-specific rule" },
  { code: "OR", name: "Oregon",         difficulty: "Moderate", permitNeeded: "Often",     notableCounties: "Portland (Multnomah), Bend (Deschutes), and coastal counties (Lincoln, Clatsop) enforce STR permits; Ashland and Hood River have strict caps" },
  { code: "PA", name: "Pennsylvania",   difficulty: "Easy",     permitNeeded: "Sometimes", notableCounties: "Philadelphia and Pittsburgh require STR registration; Poconos (Monroe, Pike) tightening rules; rural counties open" },
  { code: "RI", name: "Rhode Island",   difficulty: "Moderate", permitNeeded: "Yes",       notableCounties: "State requires STR registration through DBR; Newport and Providence add local layers" },
  { code: "SC", name: "South Carolina", difficulty: "Moderate", permitNeeded: "Sometimes", notableCounties: "Charleston (Charleston County), Myrtle Beach (Horry), and Hilton Head (Beaufort) enforce STR permitting; HOAs in master-planned communities common obstacle" },
  { code: "SD", name: "South Dakota",   difficulty: "Easy",     permitNeeded: "No",        notableCounties: "No state STR statute; Sioux Falls and Rapid City (Pennington) apply general business license" },
  { code: "TN", name: "Tennessee",      difficulty: "Moderate", permitNeeded: "Often",     notableCounties: "Nashville (Davidson) caps non-owner-occupied STR; Memphis (Shelby) requires permit; Gatlinburg and Pigeon Forge (Sevier) enforce resort-area STR code" },
  { code: "TX", name: "Texas",          difficulty: "Moderate", permitNeeded: "Sometimes", notableCounties: "Austin (Travis), Dallas, and San Antonio (Bexar) require STR registration; Houston (Harris) more permissive; HOA pre-emption under Texas Property Code limits outright bans" },
  { code: "UT", name: "Utah",           difficulty: "Moderate", permitNeeded: "Often",     notableCounties: "Park City (Summit), Moab (Grand), and St. George (Washington) enforce STR permits; Salt Lake County varies by city" },
  { code: "VT", name: "Vermont",        difficulty: "Easy",     permitNeeded: "Sometimes", notableCounties: "Burlington (Chittenden) and most ski-region towns (Windham, Windsor) require STR registration" },
  { code: "VA", name: "Virginia",       difficulty: "Moderate", permitNeeded: "Sometimes", notableCounties: "Virginia Beach, Norfolk, Richmond, and Arlington enforce STR permitting; Loudoun and Fairfax counties tighten HOA-heavy suburbs" },
  { code: "WA", name: "Washington",     difficulty: "Moderate", permitNeeded: "Often",     notableCounties: "Seattle (King), Spokane, and Tacoma (Pierce) require STR license; Chelan County (Lake Chelan, Leavenworth) enforces strict resort-area rules" },
  { code: "WV", name: "West Virginia",  difficulty: "Easy",     permitNeeded: "No",        notableCounties: "No state STR registry; Charleston and Morgantown apply general business license" },
  { code: "WI", name: "Wisconsin",      difficulty: "Easy",     permitNeeded: "Sometimes", notableCounties: "Milwaukee and Madison (Dane) require STR permits; Door County (lakefront) enforces local rules; rural counties open" },
  { code: "WY", name: "Wyoming",        difficulty: "Easy",     permitNeeded: "Sometimes", notableCounties: "Jackson (Teton) tightly regulates STR with overlay zones; Cheyenne and Casper unregulated" },
];

const DIFFICULTY_STYLE: Record<StateRow["difficulty"], string> = {
  Easy: "bg-green-50 text-green-800",
  Moderate: "bg-amber-50 text-amber-800",
  Hard: "bg-red-50 text-red-800",
};

const faqs = [
  {
    q: "Do I need a permit to rent out my pool by the hour?",
    a: "It depends on the state and city. Most US cities do not have a pool-specific permit because hourly pool rental is too new to have its own ordinance category. The legal layer that typically applies is the short-term rental (STR) ordinance, which folds pool rentals in when the booking is paid and includes the property. Roughly 35 states require some form of STR registration in at least their largest cities; about 15 states have no statewide rule and let municipalities decide. The 50-state table above shows where each state currently sits.",
  },
  {
    q: "Which states are hardest for pool rental hosts?",
    a: "California, Florida, Hawaii, Massachusetts, Nevada, and New York are the most regulated. Each has either a statewide STR registry, an aggressive municipal layer in major counties, or both. Within those states, the toughest counties are typically Los Angeles, Riverside (Palm Springs/La Quinta), Miami-Dade, Honolulu, Clark (Las Vegas), and any of the five NYC boroughs.",
  },
  {
    q: "Which states are easiest for pool rental hosts?",
    a: "Alabama, Arkansas, Mississippi, North Dakota, Oklahoma, South Dakota, and West Virginia currently have no statewide STR registry and minimal municipal layers outside their largest cities. A general business license and a sales-tax registration is usually the entire compliance footprint.",
  },
  {
    q: "Does my HOA matter more than state law?",
    a: "Yes, for most hosts. Even in states that pre-empt outright municipal STR bans (Texas, Florida, Indiana, Idaho, Arizona), HOAs and master-planned communities can still enforce their CC&Rs against commercial use of a residential property. Read your HOA documents before listing. Our HOA defense kit covers the most common arguments and includes letter templates.",
  },
  {
    q: "What about the pool itself — drainage, fencing, alarms?",
    a: "Pool barrier and safety requirements come from your state building code, not from STR law. California Title 24, Florida's Residential Swimming Pool Safety Act, Arizona's Pool Barrier Law, and most state codes require some combination of fencing, self-closing gates, and alarms. A pool that complies with state code as a private residential pool generally complies as a rental pool, but commercial use can trigger additional health-department review in a handful of jurisdictions (Hawaii, parts of Florida).",
  },
];

export const Route = createFileRoute("/p/pool-rental-permits-by-state")({
  head: () => {
    const meta = buildMeta({
      title: TITLE,
      description: DESCRIPTION,
      path: PATH,
      type: "article",
    });
    return {
      meta: meta.meta,
      links: meta.links,
      scripts: [
        ldJsonScript({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: TITLE,
          description: DESCRIPTION,
          datePublished: LAST_UPDATED,
          dateModified: LAST_UPDATED,
          author: {
            "@type": "Person",
            name: "Derek Bowen",
            jobTitle: "CEO, PRNM Corp",
            url: `${SITE_URL}/p/about-our-company`,
          },
          publisher: {
            "@type": "Organization",
            name: SITE_NAME,
            url: SITE_URL,
            logo: { "@type": "ImageObject", url: `${SITE_URL}/og-default.jpg` },
          },
          mainEntityOfPage: `${SITE_URL}${PATH}`,
        }),
        ldJsonScript({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: f.a,
              speakable: {
                "@type": "SpeakableSpecification",
                cssSelector: [".faq-answer"],
              },
            },
          })),
        }),
        ldJsonScript(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Pool Rental Permits by State", path: PATH },
          ]),
        ),
      ],
    };
  },
  component: PermitsByStatePage,
});

function PermitsByStatePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10 text-slate-900">
        <nav className="mb-4 text-xs text-slate-500">
          <Link to="/" className="hover:underline">Home</Link>
          <span className="mx-2">/</span>
          <span>Pool rental permits by state</span>
        </nav>

        <h1 className="text-3xl font-bold leading-tight md:text-4xl">
          Pool rental permits by state: what you legally need before you list
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Last updated {LAST_UPDATED} · Reviewed by Derek Bowen, CEO, PRNM Corp
        </p>

        <p className="mt-6 text-lg leading-relaxed">
          There is no federal pool rental permit. Compliance lives at the state,
          county, city, and HOA level, in that order. The table below grades
          every US state by how hard it currently is to legally host an hourly
          pool rental, calls out the specific counties that drive the rule, and
          links to a state-specific guide for each one.
        </p>

        <section className="mt-10">
          <h2 className="text-2xl font-bold">50-state permit difficulty</h2>
          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2">State</th>
                  <th className="px-3 py-2">Difficulty</th>
                  <th className="px-3 py-2">Permit needed</th>
                  <th className="px-3 py-2">Notable counties</th>
                  <th className="px-3 py-2">Guide</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.code} className="border-t border-slate-200 align-top">
                    <td className="px-3 py-3 font-semibold whitespace-nowrap">{r.name}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${DIFFICULTY_STYLE[r.difficulty]}`}>
                        {r.difficulty}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">{r.permitNeeded}</td>
                    <td className="px-3 py-3 text-slate-700">{r.notableCounties}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <Link
                        to="/p/$slug"
                        params={{ slug: `host-advocacy-${r.name.toLowerCase().replace(/\s+/g, "-")}` }}
                        className="text-blue-700 hover:underline"
                      >
                        {r.name} guide →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Sources: each state's short-term rental statute, the relevant
            county and city code, and reporting from local government for the
            named jurisdictions. Last reviewed {LAST_UPDATED}. Always confirm
            current requirements with your city or county clerk before listing.
          </p>
        </section>

        <section className="mt-10 rounded-lg border-l-4 border-blue-600 bg-blue-50 p-5">
          <h3 className="text-lg font-bold text-blue-900">
            How to read this table
          </h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm leading-relaxed text-blue-950">
            <li><strong>Easy</strong>: no state STR registry, minimal municipal layer outside the largest city. A general business license is usually the entire footprint.</li>
            <li><strong>Moderate</strong>: state defers to municipalities, but several large counties enforce STR registration with inspections.</li>
            <li><strong>Hard</strong>: statewide registry or aggressive county-level rules in the population centers. Plan on real paperwork.</li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold">Frequently asked questions</h2>
          <div className="mt-4 space-y-6">
            {faqs.map((f) => (
              <div key={f.q}>
                <h3 className="font-semibold">{f.q}</h3>
                <p className="faq-answer mt-1 text-sm leading-relaxed text-slate-700">
                  {f.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-lg bg-slate-50 p-5">
          <h2 className="text-xl font-bold">Related reading</h2>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-blue-700">
            <li><Link to="/p/host-advocacy" className="hover:underline">Host advocacy hub (all 50 state guides)</Link></li>
            <li><Link to="/p/pool-rental-insurance-explained" className="hover:underline">Pool rental insurance, explained</Link></li>
            <li><Link to="/p/pool-rental-host-fees-compared" className="hover:underline">Pool rental host fees compared</Link></li>
            <li><Link to="/p/hoa-pool-rental-defense-kit" className="hover:underline">HOA defense kit</Link></li>
            <li><Link to="/p/earnings-calculator" className="hover:underline">Pool rental earnings calculator</Link></li>
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
