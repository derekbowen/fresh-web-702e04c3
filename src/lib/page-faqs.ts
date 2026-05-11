/**
 * Templated FAQs for /p/{slug} pages.
 *
 * The brief calls for FAQPage JSON-LD on host-acq, city-rental, and host-
 * advocacy pages. content_pages doesn't currently store per-page FAQs, so
 * we synthesize them from the page's template_type + city/state slug.
 *
 * Used by both the dispatcher (to emit JSON-LD) and the templates (to render
 * the visible FAQ block) so the two never drift apart.
 */
import type { ContentPage } from "@/server/content-pages.functions";
import { cityForContentPage } from "@/server/nearby-cities.functions";
import { findAdvocacyState } from "@/lib/advocacy-states";

export interface FaqItem {
  question: string;
  answer: string;
}

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", DC: "Washington, D.C.",
};

/**
 * Pretty-print "city-name-tx" → { city: "City Name", state: "TX" }.
 */
function parseCitySlug(citySlug: string): { city: string; stateCode: string | null } {
  const parts = citySlug.split("-");
  const last = parts[parts.length - 1]?.toUpperCase() ?? "";
  const isState = last.length === 2 && STATE_NAMES[last];
  const stateCode = isState ? last : null;
  const cityParts = isState ? parts.slice(0, -1) : parts;
  const city = cityParts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
  return { city, stateCode };
}

function hostAcqFaqs(city: string, stateCode: string | null): FaqItem[] {
  const where = stateCode ? `${city}, ${stateCode}` : city;
  return [
    {
      question: `How much can I earn renting out my pool in ${where}?`,
      answer: `Most Pool Rental Near Me hosts in ${where} earn $5,000–$15,000 per month during peak season. Earnings depend on your pool's amenities, photos, and how many hours you make it available.`,
    },
    {
      question: `What does it cost to list my pool in ${where}?`,
      answer: `Listing is free. Pool Rental Near Me charges a flat 10% host fee on completed bookings — no monthly fees, no setup costs, no upfront payment.`,
    },
    {
      question: `Is my pool covered by insurance when I host in ${where}?`,
      answer: `Yes. Every booking includes $2 million in liability protection at no extra cost to the host.`,
    },
    {
      question: `How is Pool Rental Near Me different from Swimply?`,
      answer: `Pool Rental Near Me charges a flat 10% host fee — significantly less than Swimply's 15%+ fees — and our team prioritizes host support, including the free Pool Host Academy with 70+ training courses.`,
    },
    {
      question: `How quickly can I start accepting bookings in ${where}?`,
      answer: `Most ${where} hosts go live within 24–48 hours of submitting their listing. Add 6+ photos, your hourly rate, and your availability, and you can be booked the same week.`,
    },
  ];
}

function hostAdvocacyFaqs(stateName: string): FaqItem[] {
  return [
    {
      question: `Is it legal to rent out my pool in ${stateName}?`,
      answer: `Renting your residential pool is legal in every US state, including ${stateName}. The specific rules come from four layers: state pool safety code, county and city ordinances, your HOA covenants, and your homeowner's insurance contract. Most ${stateName} hosts can list legally as long as their pool meets state barrier code and they notify their insurance carrier in writing.`,
    },
    {
      question: `Do I need a permit to host pool rentals in ${stateName}?`,
      answer: `Most ${stateName} cities do not require a separate permit for hourly pool rentals because guests do not stay overnight. A growing number of cities (especially in Florida, Arizona, and parts of California) fold pool rentals into their short-term rental ordinance and require a $50–$400 annual registration. Check your city or county clerk before listing.`,
    },
    {
      question: `What pool barrier requirements apply in ${stateName}?`,
      answer: `${stateName} follows some version of the International Swimming Pool and Spa Code. Expect a continuous barrier at least 48 inches high (60 inches in a few states), self-closing and self-latching gates that open outward, anti-entrapment drain covers compliant with the federal VGB Act, and in some states an additional layer such as door alarms or a safety cover.`,
    },
    {
      question: `Will hosting affect my homeowner's insurance in ${stateName}?`,
      answer: `Standard homeowner's policies contain a business-pursuits exclusion that can void coverage for guest injuries during a paid rental. Every Pool Rental Near Me booking includes $2 million in liability protection, but you should still notify your homeowner's carrier in writing so unrelated claims are not affected.`,
    },
    {
      question: `How much can I earn renting my pool in ${stateName}?`,
      answer: `${stateName} hosts typically charge $40–$150 per hour and earn $3,000–$10,000 per month during peak season, depending on location, amenities, and how many hours the pool is available. Pool Rental Near Me charges a flat 10% host fee, lower than competing platforms.`,
    },
    {
      question: `Can my HOA stop me from renting my pool in ${stateName}?`,
      answer: `An HOA can enforce its CC&Rs, which often include a "no commercial use" clause. The rule is enforceable through fines or a lien but it is private contract law, not state law. Many ${stateName} HOAs approve pool rentals when given a written hosting plan, proof of $2M liability coverage, and clear house rules.`,
    },
  ];
}

function hostAdvocacyHubFaqs(): FaqItem[] {
  return [
    {
      question: `Is renting your pool by the hour legal in the United States?`,
      answer: `Yes. Hourly pool rentals are legal in every US state. There is no federal law that specifically regulates private short-term pool rentals. All governance comes from state pool safety codes, county and city ordinances, HOA covenants, and your homeowner's insurance contract.`,
    },
    {
      question: `What pool safety code applies to a rental pool?`,
      answer: `Almost every state has adopted some version of the International Swimming Pool and Spa Code (ISPSC) or the federal Virginia Graeme Baker Pool and Spa Safety Act standards. The baseline: a continuous 48-inch barrier (60 inches in some states), self-closing self-latching gates, anti-entrapment drain covers, and in some states pool or door alarms.`,
    },
    {
      question: `Do I need to register as a short-term rental?`,
      answer: `Most short-term rental ordinances regulate overnight transient lodging and do not apply to pool-only rentals. A growing number of cities (Scottsdale, parts of Los Angeles County, Miami-Dade) treat any commercial use of a residence as subject to STR registration. Check your city's specific rule before listing.`,
    },
    {
      question: `Does my homeowner's insurance cover pool rental income?`,
      answer: `Standard HO-3 and HO-5 policies contain a business-pursuits exclusion that typically denies coverage for guest injuries during a paid rental. Pool Rental Near Me includes $2 million in per-booking liability coverage, and we recommend notifying your homeowner's carrier in writing as well.`,
    },
    {
      question: `How is pool rental income taxed?`,
      answer: `Federally, hosting income is reportable on Schedule C if you host actively or Schedule E if hosting is more passive. State income tax applies in any state with one. A small but growing number of cities (mostly in FL, AZ, and CA) require collection of a transient occupancy tax even on day-only pool rentals.`,
    },
    {
      question: `Where do I find the rules for my state?`,
      answer: `Use the state index on this page. Each state guide covers specific code citations, fence heights, alarm rules, HOA prevalence, short-term rental treatment, and tax notes for that state.`,
    },
  ];
}

function swimInstructorCityFaqs(city: string, stateCode: string | null): FaqItem[] {
  const where = stateCode ? `${city}, ${stateCode}` : city;
  return [
    {
      question: `Can I rent a private pool to teach swim lessons in ${where}?`,
      answer: `Yes. Pool Rental Near Me lets certified swim instructors book private backyard pools in ${where} by the hour — perfect for private and small-group lessons without the overhead of a public facility.`,
    },
    {
      question: `How much does it cost to rent a pool for swim lessons in ${where}?`,
      answer: `Pool rentals in ${where} typically run $40–$120 per hour. Most instructors price private lessons at $60–$100 and group lessons at $25–$40 per swimmer to clear a healthy margin after the rental fee.`,
    },
    {
      question: `Do I need lifeguard or swim instructor certification to teach in a rented pool?`,
      answer: `Hosts generally expect instructors to carry current Red Cross WSI, ASCA, or equivalent certification, plus CPR/First Aid. We recommend showing certifications to the host before booking.`,
    },
    {
      question: `Am I covered by insurance when teaching lessons in a rented ${where} pool?`,
      answer: `Pool Rental Near Me bookings include $2M in property liability for the host. Instructors should carry their own professional liability policy (commonly through K&K or a swim-school carrier) to cover the lessons themselves.`,
    },
    {
      question: `How do I find pools in ${where} that allow swim instruction?`,
      answer: `Search ${where} on Pool Rental Near Me, filter for shallow-end depth and pool size that fits your students, and message hosts to confirm they're comfortable with paid lessons on-site.`,
    },
  ];
}

function swimInstructorHubFaqs(): FaqItem[] {
  return [
    {
      question: `Can swim instructors rent private pools to teach lessons?`,
      answer: `Yes. Pool Rental Near Me is one of the most popular ways for independent swim instructors and small swim schools to access private backyard pools by the hour, without signing a long-term lease.`,
    },
    {
      question: `What does a swim instructor typically pay to rent a pool?`,
      answer: `Most instructors pay $40–$120 per hour for a backyard pool, depending on size, location, and amenities. Many hosts offer recurring weekly discounts for ongoing lesson schedules.`,
    },
    {
      question: `What certifications do swim instructors need?`,
      answer: `Hosts generally expect Red Cross Water Safety Instructor (WSI), ASCA Level 1+, or equivalent, plus current CPR and First Aid. Some hosts may also ask for proof of liability insurance.`,
    },
    {
      question: `Is there liability coverage when teaching in a rented pool?`,
      answer: `Each booking includes $2M in property liability for the host. Instructors should carry their own professional liability insurance for the lessons themselves.`,
    },
  ];
}

function eventGuideFaqs(eventLabel: string, where: string): FaqItem[] {
  return [
    {
      question: `How much does it cost to rent a pool for a ${eventLabel} in ${where}?`,
      answer: `Most ${where} pool rentals run $40–$150 per hour. Total cost depends on group size, time of day, and add-ons like a hot tub, BBQ, or covered patio. You'll see the full price before booking.`,
    },
    {
      question: `How many guests can I bring to a ${eventLabel} pool rental in ${where}?`,
      answer: `Each ${where} listing sets its own guest cap, typically 10–25 people. Filter by guest count when you search to find pools that fit your group.`,
    },
    {
      question: `Can I host a ${eventLabel} at a private pool with food and music?`,
      answer: `Most hosts allow food, drinks, and reasonable music — many even include a grill or BBQ area. Check the listing's house rules and message the host before booking if you're planning catering or amplified sound.`,
    },
    {
      question: `Is there liability coverage for a ${eventLabel} pool rental?`,
      answer: `Yes. Every Pool Rental Near Me booking includes $2 million in liability coverage at no extra cost to the guest or host.`,
    },
    {
      question: `How far in advance should I book a pool for a ${eventLabel} in ${where}?`,
      answer: `For weekends in peak summer, book 2–4 weeks ahead. Mid-week and shoulder-season ${where} bookings are usually available within a few days.`,
    },
  ];
}

function genericResourceFaqs(title: string): FaqItem[] {
  return [
    {
      question: `What is Pool Rental Near Me?`,
      answer: `Pool Rental Near Me is a peer-to-peer marketplace where homeowners rent out their backyard pools by the hour. Guests get a private pool, hosts earn money, and every booking includes $2M in liability coverage.`,
    },
    {
      question: `How much does a private pool rental cost?`,
      answer: `Most pool rentals range from $40 to $150 per hour depending on the pool, amenities, location, and time of day. You see the full price before you book.`,
    },
    {
      question: `How much can I earn renting out my pool?`,
      answer: `Typical hosts earn $3,000–$10,000 per month during peak season, with top hosts clearing $15,000+. Pool Rental Near Me charges a flat 10% host fee — lower than Swimply's 15%+.`,
    },
    {
      question: `Is there liability insurance included?`,
      answer: `Yes. Every booking includes $2 million in liability protection at no extra cost to the host or guest. (Reference: ${title}.)`,
    },
  ];
}

/** Parse "guide-to-{event}-pool-rental-{city-slug}" → { eventLabel, citySlug }. */
function parseEventGuideSlug(slug: string): { eventLabel: string; citySlug: string } | null {
  const m = slug.match(/^guide-to-(.+?)-pool-rental-(.+)$/);
  if (!m) return null;
  const eventLabel = m[1].split("-").join(" ");
  return { eventLabel, citySlug: m[2] };
}

/**
 * Returns FAQs for a content page, or [] if the template type doesn't get FAQs.
 */
export function faqsForContentPage(page: ContentPage): FaqItem[] {
  // Stored per-page FAQs (AI generator) take precedence over template defaults.
  const stored = (page as { faq_items?: Array<{ question?: unknown; answer?: unknown }> | null }).faq_items;
  if (Array.isArray(stored) && stored.length > 0) {
    const cleaned = stored
      .filter((f): f is { question: string; answer: string } =>
        !!f && typeof f.question === "string" && typeof f.answer === "string" &&
        f.question.trim() !== "" && f.answer.trim() !== "")
      .map((f) => ({ question: f.question, answer: f.answer }));
    if (cleaned.length > 0) return cleaned;
  }
  const t = page.template_type;
  if (t === "host_acq_city" || t === "spanish_host_acq") {
    const citySlug = cityForContentPage(t, page.slug);
    if (!citySlug) return [];
    const { city, stateCode } = parseCitySlug(citySlug);
    return hostAcqFaqs(city, stateCode);
  }
  if (t === "swim_instructor_city") {
    const citySlug = cityForContentPage(t, page.slug);
    if (!citySlug) return [];
    const { city, stateCode } = parseCitySlug(citySlug);
    return swimInstructorCityFaqs(city, stateCode);
  }
  if (t === "swim_instructor_hub") {
    return swimInstructorHubFaqs();
  }
  if (t === "host_advocacy_hub") {
    return hostAdvocacyHubFaqs();
  }
  if (t === "host_advocacy_state" && page.slug) {
    const state = findAdvocacyState(page.slug);
    if (state) return hostAdvocacyFaqs(state.name);
    // Fallback: legacy slugs ending in -XX state code
    const m = page.slug.match(/-([a-z]{2})$/i);
    if (m) {
      const code = m[1].toUpperCase();
      return hostAdvocacyFaqs(STATE_NAMES[code] ?? code);
    }
  }
  if (t === "event_guide" && page.slug) {
    const parsed = parseEventGuideSlug(page.slug);
    if (parsed) {
      const { city, stateCode } = parseCitySlug(parsed.citySlug);
      const where = stateCode ? `${city}, ${stateCode}` : city;
      return eventGuideFaqs(parsed.eventLabel, where);
    }
    return [];
  }
  if (t === "resource" || t === "spanish_resource") {
    const title = page.title || page.seo_title || "this guide";
    return genericResourceFaqs(title);
  }
  return [];
}

/** Build FAQPage JSON-LD object for a list of FAQs. */
export function faqPageJsonLd(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}
