/**
 * Which amenity claims a public page may make. Mirrors poolrentalnearme-web
 * src/util/amenityClaims.js (and its tests) -- keep the two in step.
 *
 * `poolAmenities` is the host's factual checklist and is authoritative.
 * `advantagesSelection` is a marketing picker; on 2026-09-22 it had 93 of 125
 * listings saying "Heated pool" while only 46 hosts had ticked `heated`.
 * A highlight shows only when the host selected the EXACT factual amenity.
 * No equivalence is inferred: hot_tub is not heated-pool, and it is not
 * spa-and-sauna. Host data is never modified here.
 */
export const ADVANTAGE_FACT_KEYS: Readonly<Record<string, string>> = Object.freeze({
  "heated-pool": "heated",
  "night-lighting": "evening_lights",
  "diving-board": "diving_board",
  "water-slide": "slide",
  "music-system": "sound_system",
});

export function corroboratedAdvantages(pd: Record<string, unknown> | null | undefined): string[] {
  const selected = Array.isArray(pd?.advantagesSelection) ? (pd!.advantagesSelection as unknown[]) : [];
  const facts = new Set(
    (Array.isArray(pd?.poolAmenities) ? (pd!.poolAmenities as unknown[]) : []).filter(
      (v): v is string => typeof v === "string",
    ),
  );
  const out: string[] = [];
  for (const slug of selected) {
    if (typeof slug !== "string") continue;
    const key = ADVANTAGE_FACT_KEYS[slug];
    if (key && facts.has(key) && !out.includes(slug)) out.push(slug);
  }
  return out;
}

/** Guest-facing labels for poolAmenities codes, as the marketplace listing page shows them. */
export const POOL_AMENITY_FACT_LABELS: Readonly<Record<string, string>> = Object.freeze({
  fenced: "Fully fenced",
  deep_end: "Deep end",
  evening_lights: "Evening lights",
  parking: "Parking",
  bbq: "BBQ grill",
  restroom: "Restroom",
  covered_seating: "Covered seating",
  wifi: "WiFi",
  cameras: "Security cameras",
  changing_area: "Changing area",
  heated: "Heated",
  sound_system: "Sound system",
  hot_tub: "Hot tub",
  saltwater: "Saltwater",
  pet_friendly: "Pet friendly",
  diving_board: "Diving board",
  ada: "ADA accessible",
  slide: "Water slide",
});

/** Only codes we can label exactly; anything else (including non-strings) is dropped. */
export function poolAmenityLabels(codes: unknown): string[] {
  if (!Array.isArray(codes)) return [];
  return codes
    .filter((c): c is string => typeof c === "string")
    .map((c) => POOL_AMENITY_FACT_LABELS[c])
    .filter((l): l is string => !!l);
}
