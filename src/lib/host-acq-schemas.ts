/**
 * Host-acquisition specific JSON-LD blocks.
 *
 * Emits structural signals so Google/AI surfaces understand these pages are
 * recruiting pool owners (B2B-ish supply-side acquisition) rather than
 * selling pool rentals to consumers:
 *   - WebPage with BusinessAudience (Pool Owners, geo-scoped)
 *   - ProfessionalService offering
 *   - Offer (the income opportunity, with earnings price range)
 *   - HowTo (the SEO unlock: "How to List Your Pool for Rent in {City}")
 *
 * Renter-facing pages (city/activity/instructor/article) MUST NOT use these.
 */
import type { ContentPage } from "@/server/content-pages.functions";
import type { CityRow } from "@/server/cities.functions";
import { cityForContentPage, parseCitySlug } from "@/lib/city-slug";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

const HOST_ACQ_TEMPLATES = new Set(["host_acq_city", "spanish_host_acq"]);

export function hostAcqSchemasForPage(
  page: ContentPage,
  city: CityRow | null,
): Array<Record<string, unknown>> {
  if (!page.template_type || !HOST_ACQ_TEMPLATES.has(page.template_type)) {
    return [];
  }

  const citySlug = cityForContentPage(page.template_type, page.slug);
  const parsed = citySlug ? parseCitySlug(citySlug) : null;
  const cityName = city?.name || parsed?.city || null;
  const stateCode = (city?.state_code || parsed?.stateCode || "").toUpperCase();
  const stateName = city?.state || stateCode || null;

  if (!cityName) return [];

  const language =
    page.language || (page.template_type === "spanish_host_acq" ? "es" : "en");
  const pageUrl = `${SITE_URL}${page.url_path}`;

  const geoArea: Record<string, unknown> = {
    "@type": "City",
    name: cityName,
    ...(stateName
      ? {
          containedInPlace: {
            "@type": "State",
            name: stateName,
            addressCountry: "US",
          },
        }
      : {}),
  };

  const poolOwnerAudience = {
    "@type": "BusinessAudience",
    audienceType: "Pool Owners",
    geographicArea: geoArea,
  };

  const webPage: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url: pageUrl,
    name: page.seo_title || page.title || `Become a pool host in ${cityName}, ${stateCode}`,
    inLanguage: language,
    audience: poolOwnerAudience,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
  };

  const professionalService: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: SITE_NAME,
    url: SITE_URL,
    serviceType: "Peer-to-peer pool hosting platform",
    areaServed: geoArea,
    audience: {
      "@type": "BusinessAudience",
      audienceType: "Homeowners with pools",
    },
  };

  const offer: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Offer",
    name: `List Your Pool in ${cityName}, ${stateCode}`,
    category: "Income Opportunity",
    eligibleCustomerType: "PropertyOwner",
    areaServed: geoArea,
    url: pageUrl,
    seller: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };

  const howTo: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to List Your Pool for Rent in ${cityName}`,
    inLanguage: language,
    totalTime: "PT15M",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Submit your pool details",
        text: "Add photos, amenities, and a short description of your backyard pool.",
        url: `${pageUrl}#step-submit`,
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Set your hourly rate",
        text: "Set a rate that reflects your pool size, location, and amenities. You stay in control.",
        url: `${pageUrl}#step-rate`,
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Get verified and insured",
        text: "Every booking includes $2M liability coverage at no extra cost to you.",
        url: `${pageUrl}#step-insured`,
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Accept your first booking",
        text: "Guests request specific dates and times — you approve, they pay, you host.",
        url: `${pageUrl}#step-booking`,
      },
    ],
  };

  // JobPosting — gets the page into the Google for Jobs widget.
  // Uses CONTRACTOR + directApply so it's honest about being independent
  // gig income, not W2 employment. Rolling 60-day validThrough that we
  // derive from the page slug so the date is stable per URL (no SSR drift).
  const slugSeed = page.slug ?? page.url_path ?? cityName;
  const slugHash = slugSeed
    .split("")
    .reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) | 0, 0);
  const dayOffset = Math.abs(slugHash) % 30; // 0–29 day jitter
  const postedAt = new Date();
  postedAt.setUTCHours(0, 0, 0, 0);
  postedAt.setUTCDate(postedAt.getUTCDate() - dayOffset);
  const validThrough = new Date(postedAt);
  validThrough.setUTCDate(validThrough.getUTCDate() + 60);

  // Lead the description with city-specific copy from the page itself when
  // we have it (better signal to Google + Indeed than the generic template),
  // then append the standard "what you do / include / requirements" block so
  // structured fields stay consistent across all 1,200+ cities.
  const cityHook =
    (page.seo_description && page.seo_description.trim().length > 60
      ? page.seo_description.trim()
      : `Turn your backyard pool in ${cityName}, ${stateCode} into income. ${SITE_NAME} connects pool owners with local guests who book by the hour. Hosts typically earn $40–$150/hour depending on pool size, location, and amenities.`);

  const jobPosting: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: `Rent your backyard pool in ${cityName}, ${stateCode} — earn $40–$150/hour`,
    description: `<p>${cityHook}</p><h3>What you do</h3><ul><li>List your pool with photos and an hourly rate</li><li>Approve booking requests on your schedule</li><li>Welcome guests, then get paid</li></ul><h3>What we include</h3><ul><li>$2,000,000 liability insurance on every booking</li><li>10% flat host fee (lower than Swimply's 15%+)</li><li>Guest verification and secure payouts</li></ul><h3>Requirements</h3><ul><li>You own (or have permission to rent) a residential pool in or near ${cityName}</li><li>Pool is clean, safe, and accessible to guests</li><li>You can respond to booking requests within 24 hours</li></ul><p><strong>This is an independent income opportunity, not W2 employment.</strong> You set your own schedule, rates, and house rules.</p>`,
    identifier: {
      "@type": "PropertyValue",
      name: SITE_NAME,
      value: `host-${slugSeed}`,
    },
    datePosted: postedAt.toISOString().slice(0, 10),
    validThrough: validThrough.toISOString().slice(0, 10),
    employmentType: "CONTRACTOR",
    hiringOrganization: {
      "@type": "Organization",
      name: SITE_NAME,
      sameAs: SITE_URL,
      logo: `${SITE_URL}/fw-assets/logo.png`,
    },
    jobLocationType: "TELECOMMUTE",
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        streetAddress: `${cityName} area (host's residence)`,
        addressLocality: cityName,
        addressRegion: stateCode,
        postalCode: "00000",
        addressCountry: "US",
      },
    },
    baseSalary: {
      "@type": "MonetaryAmount",
      currency: "USD",
      value: {
        "@type": "QuantitativeValue",
        minValue: 40,
        maxValue: 150,
        unitText: "HOUR",
      },
    },
    directApply: true,
    url: pageUrl,
    applicantLocationRequirements: {
      "@type": "City",
      name: cityName,
    },
  };

  return [webPage, professionalService, offer, howTo, jobPosting];
}
