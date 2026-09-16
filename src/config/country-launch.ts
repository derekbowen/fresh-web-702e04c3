/**
 * Country launch pages (template_type = "country_launch").
 *
 * Nine rows in content_pages: three country hubs (uk, canada, australia) and
 * six city pages (london, manchester, toronto, vancouver, sydney, melbourne).
 * Each ccTLD root 302s to its hub, so these are the front doors of
 * poolrentalnearme.co.uk / .ca / .com.au.
 *
 * Everything market-specific lives here, not in JSX. Content rules: no
 * invented statistics, no host quotes, no earnings projections, no insurance
 * or coverage language. Every claim rendered by the template is either in the
 * page's own stored body or is existing site copy.
 */

export type CountryCode = "GB" | "CA" | "AU";

export interface CountryLaunchCountry {
  code: CountryCode;
  /** As used mid-sentence: "in the UK", "in Canada". */
  name: string;
  /** Short label for chips/badges. */
  label: string;
  /** Slug of the country hub page. */
  hubSlug: string;
  /** ISO currency code the host is paid in. */
  currency: string;
  /** As used mid-sentence: "paid in pounds (GBP)". */
  currencyLabel: string;
  /** Local word for renting a pool by the hour. */
  hireWord: "hire" | "rental";
  /** City launch pages under this hub, display order. */
  cities: Array<{ name: string; slug: string }>;
  /**
   * Existing resource pages for this market, display order. Titles, blurbs
   * and cover images are fetched live from content_pages; a slug that is
   * missing or unpublished simply does not render.
   */
  guideSlugs: string[];
}

export const COUNTRY_LAUNCH: Record<CountryCode, CountryLaunchCountry> = {
  GB: {
    code: "GB",
    name: "the UK",
    label: "United Kingdom",
    hubSlug: "rent-out-your-pool-uk",
    currency: "GBP",
    currencyLabel: "pounds (GBP)",
    hireWord: "hire",
    cities: [
      { name: "London", slug: "rent-out-your-pool-london" },
      { name: "Manchester", slug: "rent-out-your-pool-manchester" },
    ],
    guideSlugs: [
      "hosting-uk",
      "how-it-works-uk",
      "swimply-alternative-vs-pool-rental-near-me-uk",
      "top-pool-rental-platforms-uk",
      "pool-hire-tax-deductions-uk",
      "pool-maintenance-uk",
    ],
  },
  CA: {
    code: "CA",
    name: "Canada",
    label: "Canada",
    hubSlug: "rent-out-your-pool-canada",
    currency: "CAD",
    currencyLabel: "Canadian dollars (CAD)",
    hireWord: "rental",
    cities: [
      { name: "Toronto", slug: "rent-out-your-pool-toronto" },
      { name: "Vancouver", slug: "rent-out-your-pool-vancouver" },
    ],
    guideSlugs: [
      "hosting-canada",
      "how-it-works-canada",
      "swimply-alternative-vs-pool-rental-near-me-canada",
      "top-pool-rental-platforms-canada",
      "pool-rental-tax-write-offs-canada",
      "pool-maintenance-canada",
    ],
  },
  AU: {
    code: "AU",
    name: "Australia",
    label: "Australia",
    hubSlug: "rent-out-your-pool-australia",
    currency: "AUD",
    currencyLabel: "Australian dollars (AUD)",
    hireWord: "hire",
    cities: [
      { name: "Sydney", slug: "rent-out-your-pool-sydney" },
      { name: "Melbourne", slug: "rent-out-your-pool-melbourne" },
    ],
    guideSlugs: [
      "hosting-australia",
      "how-it-works-australia",
      "swimply-alternative-vs-pool-rental-near-me-australia",
      "top-pool-rental-platforms-australia",
      "pool-hire-tax-deductions-australia",
      "pool-maintenance-australia",
    ],
  },
};

/** Marketplace URLs. Always absolute: /wizard/, /s and /signup exist only on
 *  the .com origin, and these pages are served on the ccTLDs too. */
export const COUNTRY_LAUNCH_URLS = {
  wizard: "https://www.poolrentalnearme.com/wizard/",
  signup: "https://www.poolrentalnearme.com/signup",
  hosting: "/p/hosting",
} as const;

export interface CountryLaunchMarket {
  country: CountryLaunchCountry;
  /** Set on the six city pages; null on the three country hubs. */
  city: { name: string; slug: string } | null;
}

/** Resolve a country_launch page to its market. Slug first, locale second. */
export function countryLaunchMarket(
  slug: string | null | undefined,
  locale: string | null | undefined,
): CountryLaunchMarket | null {
  const s = (slug ?? "").toLowerCase();
  for (const country of Object.values(COUNTRY_LAUNCH)) {
    if (s === country.hubSlug) return { country, city: null };
    const city = country.cities.find((c) => c.slug === s);
    if (city) return { country, city };
  }
  const byLocale: Record<string, CountryCode> = { "en-gb": "GB", "en-ca": "CA", "en-au": "AU" };
  const code = byLocale[(locale ?? "").toLowerCase()];
  return code ? { country: COUNTRY_LAUNCH[code], city: null } : null;
}
