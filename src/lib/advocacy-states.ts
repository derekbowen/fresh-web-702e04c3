// Canonical list of state-level host advocacy pages.
// Used by AdvocacyTemplate to render hub navigation, neighbor links,
// and "view all" grids without an extra DB round-trip.

export type AdvocacyState = {
  slug: string;       // e.g. "host-advocacy-texas" — full content_pages.slug
  name: string;       // e.g. "Texas"
  code: string;       // USPS state code
};

export const ADVOCACY_HUB_SLUG = "host-advocacy";
export const ADVOCACY_HUB_PATH = "/p/host-advocacy";

export const ADVOCACY_STATES: AdvocacyState[] = [
  { slug: "host-advocacy-alabama",        name: "Alabama",        code: "AL" },
  { slug: "host-advocacy-alaska",         name: "Alaska",         code: "AK" },
  { slug: "host-advocacy-arizona",        name: "Arizona",        code: "AZ" },
  { slug: "host-advocacy-arkansas",       name: "Arkansas",       code: "AR" },
  { slug: "host-advocacy-california",     name: "California",     code: "CA" },
  { slug: "host-advocacy-colorado",       name: "Colorado",       code: "CO" },
  { slug: "host-advocacy-connecticut",    name: "Connecticut",    code: "CT" },
  { slug: "host-advocacy-delaware",       name: "Delaware",       code: "DE" },
  { slug: "host-advocacy-florida",        name: "Florida",        code: "FL" },
  { slug: "host-advocacy-georgia",        name: "Georgia",        code: "GA" },
  { slug: "host-advocacy-hawaii",         name: "Hawaii",         code: "HI" },
  { slug: "host-advocacy-idaho",          name: "Idaho",          code: "ID" },
  { slug: "host-advocacy-illinois",       name: "Illinois",       code: "IL" },
  { slug: "host-advocacy-indiana",        name: "Indiana",        code: "IN" },
  { slug: "host-advocacy-iowa",           name: "Iowa",           code: "IA" },
  { slug: "host-advocacy-kansas",         name: "Kansas",         code: "KS" },
  { slug: "host-advocacy-kentucky",       name: "Kentucky",       code: "KY" },
  { slug: "host-advocacy-louisiana",      name: "Louisiana",      code: "LA" },
  { slug: "host-advocacy-maine",          name: "Maine",          code: "ME" },
  { slug: "host-advocacy-maryland",       name: "Maryland",       code: "MD" },
  { slug: "host-advocacy-massachusetts",  name: "Massachusetts",  code: "MA" },
  { slug: "host-advocacy-michigan",       name: "Michigan",       code: "MI" },
  { slug: "host-advocacy-minnesota",      name: "Minnesota",      code: "MN" },
  { slug: "host-advocacy-mississippi",    name: "Mississippi",    code: "MS" },
  { slug: "host-advocacy-missouri",       name: "Missouri",       code: "MO" },
  { slug: "host-advocacy-montana",        name: "Montana",        code: "MT" },
  { slug: "host-advocacy-nebraska",       name: "Nebraska",       code: "NE" },
  { slug: "host-advocacy-nevada",         name: "Nevada",         code: "NV" },
  { slug: "host-advocacy-new-hampshire",  name: "New Hampshire",  code: "NH" },
  { slug: "host-advocacy-new-jersey",     name: "New Jersey",     code: "NJ" },
  { slug: "host-advocacy-new-mexico",     name: "New Mexico",     code: "NM" },
  { slug: "host-advocacy-new-york",       name: "New York",       code: "NY" },
  { slug: "host-advocacy-north-carolina", name: "North Carolina", code: "NC" },
  { slug: "host-advocacy-north-dakota",   name: "North Dakota",   code: "ND" },
  { slug: "host-advocacy-ohio",           name: "Ohio",           code: "OH" },
  { slug: "host-advocacy-oklahoma",       name: "Oklahoma",       code: "OK" },
  { slug: "host-advocacy-oregon",         name: "Oregon",         code: "OR" },
  { slug: "host-advocacy-pennsylvania",   name: "Pennsylvania",   code: "PA" },
  { slug: "host-advocacy-rhode-island",   name: "Rhode Island",   code: "RI" },
  { slug: "host-advocacy-south-carolina", name: "South Carolina", code: "SC" },
  { slug: "host-advocacy-south-dakota",   name: "South Dakota",   code: "SD" },
  { slug: "host-advocacy-tennessee",      name: "Tennessee",      code: "TN" },
  { slug: "host-advocacy-texas",          name: "Texas",          code: "TX" },
  { slug: "host-advocacy-utah",           name: "Utah",           code: "UT" },
  { slug: "host-advocacy-vermont",        name: "Vermont",        code: "VT" },
  { slug: "host-advocacy-virginia",       name: "Virginia",       code: "VA" },
  { slug: "host-advocacy-washington",     name: "Washington",     code: "WA" },
  { slug: "host-advocacy-west-virginia",  name: "West Virginia",  code: "WV" },
  { slug: "host-advocacy-wisconsin",      name: "Wisconsin",      code: "WI" },
  { slug: "host-advocacy-wyoming",        name: "Wyoming",        code: "WY" },
];

// Neighbor map for "related states" navigation on each state page.
// Geography-based; falls back to alphabetical if a state isn't in the map.
const NEIGHBORS: Record<string, string[]> = {
  AL: ["MS", "GA", "TN", "FL"],
  AK: ["WA", "OR", "HI", "CA"],
  AZ: ["CA", "NV", "UT", "NM"],
  AR: ["TX", "LA", "MS", "TN", "MO", "OK"],
  CA: ["NV", "AZ", "OR"],
  CO: ["NM", "UT", "WY", "NE", "KS", "OK"],
  CT: ["NY", "MA", "RI"],
  DE: ["NJ", "PA", "MD"],
  FL: ["GA", "AL"],
  GA: ["FL", "AL", "TN", "NC", "SC"],
  HI: ["CA", "AK"],
  ID: ["WA", "OR", "NV", "UT", "WY", "MT"],
  IL: ["IN", "IA", "MO", "KY", "WI"],
  IN: ["IL", "OH", "KY", "MI"],
  IA: ["IL", "WI", "MN", "SD", "NE", "MO"],
  KS: ["NE", "MO", "OK", "CO"],
  KY: ["TN", "VA", "WV", "OH", "IN", "IL", "MO"],
  LA: ["TX", "AR", "MS"],
  ME: ["NH", "MA", "VT"],
  MD: ["VA", "WV", "PA", "DE"],
  MA: ["NY", "CT", "RI", "NH", "VT"],
  MI: ["OH", "IN", "WI"],
  MN: ["WI", "IA", "SD", "ND"],
  MS: ["LA", "AR", "TN", "AL"],
  MO: ["KS", "NE", "IA", "IL", "KY", "TN", "AR", "OK"],
  MT: ["ID", "WY", "SD", "ND"],
  NE: ["KS", "MO", "IA", "SD", "WY", "CO"],
  NV: ["CA", "OR", "ID", "UT", "AZ"],
  NH: ["VT", "ME", "MA"],
  NJ: ["NY", "PA", "DE"],
  NM: ["AZ", "CO", "OK", "TX"],
  NY: ["NJ", "PA", "CT", "MA", "VT"],
  NC: ["SC", "GA", "TN", "VA"],
  ND: ["MN", "SD", "MT"],
  OH: ["MI", "IN", "KY", "WV", "PA"],
  OK: ["TX", "NM", "CO", "KS", "MO", "AR"],
  OR: ["CA", "NV", "ID", "WA"],
  PA: ["NY", "NJ", "DE", "MD", "WV", "OH"],
  RI: ["CT", "MA"],
  SC: ["NC", "GA"],
  SD: ["ND", "MN", "IA", "NE", "WY", "MT"],
  TN: ["KY", "VA", "NC", "GA", "AL", "MS", "AR", "MO"],
  TX: ["NM", "OK", "AR", "LA"],
  UT: ["ID", "WY", "CO", "NM", "AZ", "NV"],
  VT: ["NY", "NH", "MA"],
  VA: ["NC", "TN", "KY", "WV", "MD"],
  WA: ["OR", "ID"],
  WV: ["KY", "VA", "MD", "PA", "OH"],
  WI: ["MN", "IA", "IL", "MI"],
  WY: ["MT", "SD", "NE", "CO", "UT", "ID"],
};

const BY_CODE: Record<string, AdvocacyState> = Object.fromEntries(
  ADVOCACY_STATES.map((s) => [s.code, s]),
);

const BY_SLUG: Record<string, AdvocacyState> = Object.fromEntries(
  ADVOCACY_STATES.map((s) => [s.slug, s]),
);

/**
 * Look up a state row by the page's slug. Tolerates the legacy
 * `host-advocacy-pa-what-every-host-needs-to-know` PA variant.
 */
export function findAdvocacyState(slug: string | null | undefined): AdvocacyState | null {
  if (!slug) return null;
  const direct = BY_SLUG[slug];
  if (direct) return direct;
  if (slug.includes("-pa-")) return BY_CODE.PA ?? null;
  return null;
}

/**
 * Returns up to `limit` related state rows for a given state, preferring
 * geographic neighbors and falling back to other popular states.
 */
export function relatedAdvocacyStates(state: AdvocacyState, limit = 6): AdvocacyState[] {
  const out: AdvocacyState[] = [];
  const seen = new Set<string>([state.code]);
  for (const code of NEIGHBORS[state.code] ?? []) {
    const row = BY_CODE[code];
    if (row && !seen.has(code)) {
      out.push(row);
      seen.add(code);
      if (out.length >= limit) return out;
    }
  }
  // Top up with popular states if we don't have enough neighbors.
  const popular = ["CA", "FL", "TX", "NY", "AZ", "GA", "NC", "NJ", "PA", "OH"];
  for (const code of popular) {
    const row = BY_CODE[code];
    if (row && !seen.has(code)) {
      out.push(row);
      seen.add(code);
      if (out.length >= limit) return out;
    }
  }
  return out;
}
