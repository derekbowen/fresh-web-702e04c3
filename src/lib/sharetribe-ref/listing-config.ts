// Mirrors the live Sharetribe config (listings/listing-fields.json,
// listings/listing-categories.json, listings/listing-types.json) for the
// `pool` listing type used by poolrentalnearme.com.
//
// Keep keys aligned with what the live sync reads in
// src/server/sharetribe.server.ts: pool_type, poolsize, pool_depth,
// poolAmenities, city. Update Console + this file together.

export type FieldType = "enum" | "text" | "number" | "multi-enum";

export interface ListingFieldConfig {
  key: string; // publicData key — matches Sharetribe schema key exactly
  label: string;
  type: FieldType;
  required?: boolean;
  helper?: string;
  options?: Array<{ value: string; label: string }>;
  filterable?: boolean;
}

export const POOL_FIELDS: ListingFieldConfig[] = [
  {
    key: "pool_type",
    label: "Pool type",
    type: "enum",
    required: true,
    filterable: true,
    options: [
      { value: "inground", label: "Inground" },
      { value: "above_ground", label: "Above ground" },
      { value: "semi_inground", label: "Semi-inground" },
      { value: "indoor", label: "Indoor" },
      { value: "infinity", label: "Infinity edge" },
      { value: "natural", label: "Natural / pond" },
    ],
  },
  {
    key: "poolsize",
    label: "Pool size",
    type: "text",
    required: true,
    helper: "e.g. 16x32 ft, 20,000 gallons",
  },
  {
    key: "pool_depth",
    label: "Pool depth",
    type: "text",
    required: true,
    helper: "Shallow to deep end, in feet",
  },
  {
    key: "is_heated",
    label: "Heated",
    type: "enum",
    filterable: true,
    options: [
      { value: "yes", label: "Heated" },
      { value: "no", label: "Not heated" },
    ],
  },
  {
    key: "max_guests",
    label: "Max guests",
    type: "number",
    required: true,
    helper: "Total people allowed at the pool",
  },
  {
    key: "poolAmenities",
    label: "Amenities",
    type: "multi-enum",
    filterable: true,
    options: [
      { value: "bathroom", label: "Bathroom access" },
      { value: "outdoor_shower", label: "Outdoor shower" },
      { value: "changing_area", label: "Changing area" },
      { value: "lounge_chairs", label: "Lounge chairs" },
      { value: "umbrellas", label: "Umbrellas / shade" },
      { value: "grill", label: "Grill / BBQ" },
      { value: "hot_tub", label: "Hot tub" },
      { value: "pool_toys", label: "Pool toys / floats" },
      { value: "speaker", label: "Bluetooth speaker" },
      { value: "wifi", label: "Wi-Fi" },
      { value: "pet_friendly", label: "Pet friendly" },
      { value: "kid_friendly", label: "Kid friendly" },
      { value: "wheelchair_accessible", label: "Wheelchair accessible" },
      { value: "parking", label: "On-site parking" },
    ],
  },
  {
    key: "city",
    label: "City",
    type: "text",
    required: true,
    filterable: true,
  },
];

export interface CategoryNode {
  value: string;
  label: string;
  subcategories?: CategoryNode[];
}

export const POOL_CATEGORIES: CategoryNode[] = [
  { value: "residential", label: "Residential backyard" },
  { value: "estate", label: "Estate / luxury" },
  { value: "indoor", label: "Indoor pool" },
  { value: "commercial", label: "Commercial / venue" },
];

export const LISTING_TYPE_ID = "pool";

// Back-compat aliases — older code referenced CARD_*; keep names exported so
// nothing breaks while we migrate.
export const CARD_FIELDS = POOL_FIELDS;
export const CARD_CATEGORIES = POOL_CATEGORIES;

export function fieldByKey(key: string): ListingFieldConfig | undefined {
  return POOL_FIELDS.find((f) => f.key === key);
}

export function formatFieldValue(field: ListingFieldConfig, value: unknown): string {
  if (value == null || value === "") return "—";
  if (field.type === "enum") {
    const opt = field.options?.find((o) => o.value === value);
    return opt?.label ?? String(value);
  }
  if (field.type === "multi-enum" && Array.isArray(value)) {
    return value
      .map((v) => field.options?.find((o) => o.value === v)?.label ?? String(v))
      .join(", ");
  }
  return String(value);
}

export function categoryLabel(level1: string | undefined, level2?: string): string {
  if (!level1) return "—";
  const l1 = POOL_CATEGORIES.find((c) => c.value === level1);
  if (!l1) return level1;
  if (!level2) return l1.label;
  const l2 = l1.subcategories?.find((s) => s.value === level2);
  return l2 ? `${l1.label} → ${l2.label}` : l1.label;
}
