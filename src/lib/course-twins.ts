/**
 * Bidirectional EN <-> ES academy course twin map.
 *
 * Powers per-course hreflang alternates and the "ver en inglés / view in Spanish"
 * language switch on /p/course/{slug}. Only genuine topic counterparts are paired;
 * ES-only courses (no faithful EN equivalent) are intentionally omitted and fall
 * back to a self-referential hreflang + the hub language switch.
 *
 * All EN targets verified present + published at authoring time.
 */
const ES_TO_EN: Record<string, string> = {
  // Spanish Health pack (safety)
  "prevencion-de-ahogamientos-para-anfitriones-es": "drowning-response-in-pools",
  "como-certificarse-en-rcp-es": "how-to-get-cpr-certified",
  "equipo-de-rescate-acuatico-es": "water-rescue-equipment-life-ring-vs-shepherd-s-hook",
  "plan-de-accion-de-emergencia-para-anfitriones-es":
    "emergency-action-planning-eap-incident-response-guide-for-poolrentalnearme-hosts-instructors-and-guests",
  "supervision-designada-y-seguridad-del-agua-es": "water-safety-designated-supervision",
  "prevencion-de-resbalones-y-caidas-es": "preventing-slip-and-falls-in-your-pool-area",
  "prevencion-de-enfermedades-transmitidas-por-el-agua-es": "waterborne-illness-prevention-guide",
  // getting-started
  "de-swimply-a-pool-rental-near-me-es": "migrating-from-swimply-to-prnm-complete-switch-guide",
  "como-empezar-publica-tu-alberca-es": "market-rent-your-pool-a-hands-on-guide",
  "tu-primer-anuncio-fotos-y-descripcion-es":
    "listing-optimization-guide-photography-copy-conversion-science-for-poolrentalnearme-hosts",
  "configura-disponibilidad-y-reglas-de-la-casa-es": "pool-rental-near-me-availability-management-guide",
  // pricing
  "como-fijar-el-precio-de-tu-alberca-es": "pricing-strategy-dynamic-revenue-management-guide",
  "precios-dinamicos-alta-demanda-es": "price-variations-dynamic-pricing-guide",
  "amenidades-que-aumentan-tu-tarifa-es": "the-convenience-upsell-playbook",
  "paquetes-y-ofertas-personalizadas-es":
    "guide-designing-tiered-experience-packages-base-premium-vip-for-a-pool-clothing-optional-or-wellness-swim-venue",
  "maximiza-tus-ingresos-por-temporada-es":
    "seasonal-business-management-for-pool-rental-near-me-hosts-year-round-revenue-mastery",
  "entiende-tus-numeros-ingresos-gastos-ganancia-es": "cost-per-swim-modeling-for-pool-hosts",
  // legal
  "seguro-y-cobertura-de-responsabilidad-es": "insurance-legal-essentials-for-pool-hosts",
  "exencion-de-responsabilidad-waivers-es": "liability-waivers-that-actually-protect-you",
  "impuestos-para-anfitriones-de-alberca-es": "tax-implications-for-pool-rental-income",
  "permisos-y-regulaciones-locales-es": "regulatory-compliance-essentials-guide-for-pool-rental-hosts",
  "como-manejar-tu-hoa-es": "hoa-warfare-bypass-restrictions-rent-your-pool",
  "forma-una-llc-para-tu-negocio-de-alberca-es": "forming-an-llc-for-your-pool-business",
};

const EN_TO_ES: Record<string, string> = Object.fromEntries(
  Object.entries(ES_TO_EN).map(([es, en]) => [en, es]),
);

/** The twin course slug in the OTHER language, or null if this course is single-language. */
export function courseTwinSlug(slug: string, lang: "en" | "es"): string | null {
  return lang === "es" ? ES_TO_EN[slug] ?? null : EN_TO_ES[slug] ?? null;
}
