/**
 * Deterministic ~1,000-word local "Become a pool host" guide for any U.S.
 * city. We can't rely on cities.description (only 3 of 702 rows have one),
 * so this generator interpolates city + state into a structured template.
 *
 * Every section name-checks the city or state at least once so each of the
 * 1,267 host_acq_city pages has unique on-page text.
 */
import type { CityRow } from "@/server/cities.functions";

export interface HostCityGuideSection {
  heading: string;
  paragraphs: string[];
}

export interface HostCityGuide {
  intro: string;
  sections: HostCityGuideSection[];
  cityTier: "premium" | "standard" | "emerging";
  defaultHourlyRate: number;
}

/** Loose tiering used for default hourly rate + tone of the guide. */
const PREMIUM_STATES = new Set(["CA", "NY", "FL", "TX", "AZ", "NV", "HI", "MA", "WA", "CO"]);
const EMERGING_STATES = new Set(["WV", "MS", "AR", "AL", "KY", "OK", "ND", "SD", "MT", "WY"]);

export function tierForCity(city: { state_code: string | null }): HostCityGuide["cityTier"] {
  const code = (city.state_code || "").toUpperCase();
  if (PREMIUM_STATES.has(code)) return "premium";
  if (EMERGING_STATES.has(code)) return "emerging";
  return "standard";
}

function defaultRateForTier(tier: HostCityGuide["cityTier"]): number {
  switch (tier) {
    case "premium":
      return 95;
    case "emerging":
      return 55;
    default:
      return 75;
  }
}

function seasonsForState(stateCode: string): string {
  const code = stateCode.toUpperCase();
  if (["FL", "HI", "AZ", "TX", "CA", "NV", "LA", "GA", "AL", "MS", "SC"].includes(code)) {
    return "year-round, with peak demand from April through October";
  }
  if (["WA", "OR", "ID", "MT", "WY", "ND", "SD", "MN", "WI", "MI", "ME", "VT", "NH", "MA"].includes(code)) {
    return "concentrated between Memorial Day and mid-September";
  }
  return "running from late April through early October, with shoulder bookings on warm spring and fall weekends";
}

/**
 * Generate the guide. Aims for ~1,000 words across all sections combined.
 * Output is intentionally Markdown-light (no headings inside paragraphs)
 * so the template can render it as semantic HTML.
 */
export function buildHostCityGuide(city: CityRow): HostCityGuide {
  const cityName = city.name;
  const state = city.state;
  const stateCode = (city.state_code || "").toUpperCase();
  const tier = tierForCity(city);
  const seasons = seasonsForState(stateCode);
  const tierBlurb = {
    premium: `${cityName} sits in one of the strongest pool-rental markets in the country`,
    standard: `${cityName} has a healthy, growing pool-rental scene`,
    emerging: `${cityName} is an emerging pool-rental market where early hosts have a real first-mover advantage`,
  }[tier];

  const intro =
    city.description?.trim() ||
    `If you own a backyard pool in ${cityName}, ${state}, you're sitting on one of the most under-monetized assets in your neighborhood. ${tierBlurb}, and Pool Rental Near Me is the fastest way to turn unused afternoons into real income — without giving up control of your schedule, your guests, or your space.`;

  const sections: HostCityGuideSection[] = [
    {
      heading: `The local market opportunity in ${cityName}`,
      paragraphs: [
        `${cityName} renters are looking for the same thing renters everywhere want: a private, well-kept pool they can book by the hour for a birthday, a small gathering, a swim lesson, or a quiet afternoon away from a crowded public pool. What makes ${cityName} different is the supply side — most homeowners don't know hourly pool rental is legal or that platforms like Pool Rental Near Me even exist. That gap is the opportunity. Hosts who list early in a ${state} market typically capture the lion's share of local search and review volume before competition tightens up.`,
        `Demand in ${cityName} is driven by a mix of families, friend groups, fitness clients, and event planners. Listings that book consistently tend to share three things: clear photos, accurate descriptions, and responsive hosts. None of that requires a renovation — it requires showing up.`,
      ],
    },
    {
      heading: `What kinds of pools do well in ${cityName}`,
      paragraphs: [
        `In ${cityName} specifically, three pool types tend to perform best on Pool Rental Near Me. Mid-size in-ground pools (roughly 12x24 to 16x32) hit the sweet spot — large enough for a family gathering, small enough to keep clean between bookings. Resort-style backyards with shade, seating, a grill, and a sound system command premium hourly rates because guests are effectively renting the whole experience, not just the water. And smaller plunge pools or saltwater spas do surprisingly well for couples, photoshoots, and recovery sessions for athletes.`,
        `If your ${cityName} pool is heated, mention it everywhere — heated pools in ${state} routinely book at 20–40% above unheated comps because they extend the rentable season on either end.`,
      ],
    },
    {
      heading: `Best seasons to host in ${cityName}, ${stateCode}`,
      paragraphs: [
        `Booking demand in ${cityName} is ${seasons}. Saturday and Sunday afternoons consistently fill first; smart hosts open up 2–3 weekday slots after 4pm to capture the after-work and after-school crowd. Long weekends (Memorial Day, July 4th, Labor Day) book out 2–3 weeks in advance — set your prices higher and require longer minimum durations on those dates.`,
        `Off-season is not dead time. ${cityName} hosts with heated pools or hot tubs see steady bookings from physical therapy clients, swim instructors, and content creators who specifically want quieter, off-peak hours.`,
      ],
    },
    {
      heading: `Neighborhoods and guest expectations in ${cityName}`,
      paragraphs: [
        `Guests booking in ${cityName} skew toward locals — neighbors a few zip codes away who'd rather drive 15 minutes than fight crowds at a public facility. That means the bar for cleanliness and safety is the same bar your own family would expect. Skim the surface, wipe down chairs, restock towels, and make sure the gate latches properly between bookings.`,
        `Listings that mention specific ${cityName} neighborhood landmarks — schools, parks, freeway exits — tend to convert better in search because guests are scanning for proximity, not just price.`,
      ],
    },
    {
      heading: `Pricing tips specific to the ${cityName} market`,
      paragraphs: [
        `For a ${tier === "premium" ? "premium" : tier === "emerging" ? "newer" : "standard"} ${cityName} listing, an hourly rate in the $${defaultRateForTier(tier) - 15}–$${defaultRateForTier(tier) + 25} range per hour for up to 5 guests is a healthy starting point. Add $10–$15 per additional guest. Charge a small cleaning fee ($25–$50) on every booking — it covers chemicals and time, and guests expect it.`,
        `Use the calculator below to model what your week could look like at different rates and availability. Most ${cityName} hosts who treat hosting like a real side business — not a hobby — clear $1,500–$5,000+ a month in the high season.`,
      ],
    },
    {
      heading: `How PRNM's 10% fee compares to alternatives`,
      paragraphs: [
        `Pool Rental Near Me charges hosts a flat 10% fee on each booking. That's roughly a third of what the largest competitor (Swimply) takes once you stack their host fee, guest fee, and processing — typically 15%+ on the host side and another markup baked into the guest's total. On a $200 booking in ${cityName}, that fee difference is real money: roughly $20 to PRNM versus $30+ to Swimply, every single time. Multiply that across a busy ${state} weekend and the gap pays for itself.`,
        `Beyond the fee, PRNM was built for hosts who want to keep more of what they earn, set their own rules, and stop competing on a platform that quietly takes a bigger cut every year. Listing on PRNM is free, there's no exclusivity, and you can publish your ${cityName} pool today.`,
      ],
    },
  ];

  return {
    intro,
    sections,
    cityTier: tier,
    defaultHourlyRate: defaultRateForTier(tier),
  };
}
