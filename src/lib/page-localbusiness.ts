/**
 * LocalBusiness/Service JSON-LD for city-scoped /p/{slug} pages.
 * Returns null when the page isn't city-scoped or the city can't be resolved.
 */
import type { ContentPage } from "@/server/content-pages.functions";
import { cityForContentPage, parseCitySlug } from "@/lib/city-slug";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

const CITY_TEMPLATE_TYPES = new Set([
  "host_acq_city",
  "public_pool_city",
  "spanish_host_acq",
]);

export function localBusinessForContentPage(
  page: ContentPage,
): Record<string, unknown> | null {
  if (!page.template_type || !CITY_TEMPLATE_TYPES.has(page.template_type)) {
    return null;
  }
  const citySlug = cityForContentPage(page.template_type, page.slug);
  if (!citySlug) return null;

  const { city, stateCode } = parseCitySlug(citySlug);
  if (!city) return null;

  const language =
    page.language || (page.template_type === "spanish_host_acq" ? "es" : "en");

  const areaServed: Record<string, unknown> = {
    "@type": "City",
    name: city,
  };
  if (stateCode) {
    areaServed.containedInPlace = {
      "@type": "State",
      name: stateCode,
      addressCountry: "US",
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Pool rental marketplace",
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    areaServed,
    url: `${SITE_URL}${page.url_path}`,
    inLanguage: language,
  };
}
