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
import { buildHostCityGuide } from "@/lib/host-city-guide";
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

  const guide = city ? buildHostCityGuide(city) : null;
  const hourlyRate = guide?.defaultHourlyRate ?? 75;
  const lo = Math.round(hourlyRate * 8 * 4);
  const hi = Math.round(hourlyRate * 18 * 4);
  const earningsBand = `$${lo.toLocaleString()}-$${hi.toLocaleString()}+`;

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
    name: `List Your Pool — Earn ${earningsBand}/month`,
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
        text: `Most ${cityName} hosts price between $${Math.round(hourlyRate * 0.7)}-$${Math.round(hourlyRate * 1.4)}/hour based on pool size and amenities.`,
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

  return [webPage, professionalService, offer, howTo];
}
