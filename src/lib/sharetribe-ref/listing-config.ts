// Mirrors the live Sharetribe config (listings/listing-fields.json,
// listings/listing-categories.json, listings/listing-types.json) for the
// `trading_card` listing type. Keep in sync with Console.

export type FieldType = "enum" | "text" | "number";

export interface ListingFieldConfig {
  key: string; // publicData key — matches Sharetribe schema key exactly
  label: string;
  type: FieldType;
  required?: boolean;
  helper?: string;
  options?: Array<{ value: string; label: string }>;
  filterable?: boolean;
}

export const CARD_FIELDS: ListingFieldConfig[] = [
  {
    key: "card_condition",
    label: "Card Condition",
    type: "enum",
    required: true,
    filterable: true,
    options: [
      { value: "mint", label: "Mint (M)" },
      { value: "near_mint", label: "Near Mint (NM)" },
      { value: "lightly_played", label: "Lightly Played (LP)" },
      { value: "moderately_played", label: "Moderately Played (MP)" },
      { value: "heavily_played", label: "Heavily Played (HP)" },
      { value: "damaged", label: "Damaged (DMG)" },
    ],
  },
  {
    key: "rarity",
    label: "Rarity",
    type: "enum",
    required: true,
    filterable: true,
    helper: "How rare is this card",
    options: [
      { value: "common", label: "Common" },
      { value: "uncommon", label: "Uncommon" },
      { value: "rare", label: "Rare" },
      { value: "holo_rare", label: "Holo/Foil Rare" },
      { value: "ultra_rare", label: "Ultra Rare" },
      { value: "secret_rare", label: "Secret Rare" },
      { value: "promo", label: "Promo" },
      { value: "other_rarity", label: "Other" },
    ],
  },
  {
    key: "language",
    label: "Language",
    type: "enum",
    required: true,
    filterable: true,
    helper: "The language of the card",
    options: [
      { value: "en", label: "English" },
      { value: "jp", label: "Japanese" },
      { value: "de", label: "German" },
      { value: "fr", label: "French" },
      { value: "es", label: "Spanish" },
      { value: "it", label: "Italian" },
      { value: "other_lang", label: "Other" },
    ],
  },
  {
    key: "set_name",
    label: "Set / Expansion",
    type: "text",
    required: true,
    helper: "The name of the set",
  },
  {
    key: "card_number",
    label: "Card Number",
    type: "text",
    helper: "e.g. 025/165",
  },
  {
    key: "year",
    label: "Year Printed",
    type: "text",
    helper: "The year the card was printed",
  },
  {
    key: "is_graded",
    label: "Graded",
    type: "enum",
    required: true,
    filterable: true,
    helper: "Who has graded the card",
    options: [
      { value: "no", label: "Not graded / raw" },
      { value: "psa", label: "PSA" },
      { value: "bgs", label: "Beckett (BGS)" },
      { value: "cgc", label: "CGC" },
      { value: "sgc", label: "SGC" },
      { value: "other_grade", label: "Other grader" },
    ],
  },
  {
    key: "grade",
    label: "Grade",
    type: "text",
    helper: "e.g. 10, 9.5",
  },
  {
    key: "is_first_edition",
    label: "Edition",
    type: "enum",
    filterable: true,
    helper: "1st edition or later print",
    options: [
      { value: "yes", label: "1st Edition" },
      { value: "no", label: "Unlimited / Later Print" },
    ],
  },
  {
    key: "is_signed",
    label: "Signed",
    type: "enum",
    filterable: true,
    options: [
      { value: "yes", label: "Signed / autographed" },
      { value: "no", label: "Not signed" },
    ],
  },
  {
    key: "lot_size",
    label: "Number of cards in lot",
    type: "text",
    helper: "Number of cards in the lot (leave blank for single card)",
  },
];

export interface CategoryNode {
  value: string;
  label: string;
  subcategories?: CategoryNode[];
}

export const CARD_CATEGORIES: CategoryNode[] = [
  {
    value: "tcg",
    label: "Trading Card Games",
    subcategories: [
      { value: "pokemon", label: "Pokemon" },
      { value: "magic", label: "Magic: The Gathering" },
      { value: "yugioh", label: "Yu-Gi-Oh!" },
      { value: "lorcana", label: "Disney Lorcana" },
      { value: "one_piece", label: "One Piece TCG" },
      { value: "other_tcg", label: "Other TCG" },
    ],
  },
  {
    value: "sports",
    label: "Sports Cards",
    subcategories: [
      { value: "football", label: "Football / Soccer" },
      { value: "basketball", label: "Basketball" },
      { value: "baseball", label: "Baseball" },
      { value: "f1", label: "Formula 1" },
      { value: "other_sports", label: "Other Sports" },
    ],
  },
  {
    value: "non_sport",
    label: "Non-Sport & Entertainment",
    subcategories: [
      { value: "movies_tv", label: "Movies & TV" },
      { value: "gaming", label: "Video Games" },
      { value: "music", label: "Music" },
      { value: "anime", label: "Anime & Manga" },
    ],
  },
  {
    value: "vintage",
    label: "Vintage & Collectible",
    subcategories: [
      { value: "pre_1980", label: "Pre-1980" },
      { value: "graded", label: "Graded slabs" },
      { value: "sealed", label: "Sealed product" },
    ],
  },
  {
    value: "accessories",
    label: "Accessories",
    subcategories: [
      { value: "sleeves_toploaders", label: "Sleeves & Toploaders" },
      { value: "binders", label: "Binders & Storage" },
      { value: "display", label: "Display cases" },
    ],
  },
];

export const LISTING_TYPE_ID = "trading_card";

export function fieldByKey(key: string): ListingFieldConfig | undefined {
  return CARD_FIELDS.find((f) => f.key === key);
}

export function formatFieldValue(field: ListingFieldConfig, value: unknown): string {
  if (value == null || value === "") return "—";
  if (field.type === "enum") {
    const opt = field.options?.find((o) => o.value === value);
    return opt?.label ?? String(value);
  }
  return String(value);
}

export function categoryLabel(level1: string | undefined, level2?: string): string {
  if (!level1) return "—";
  const l1 = CARD_CATEGORIES.find((c) => c.value === level1);
  if (!l1) return level1;
  if (!level2) return l1.label;
  const l2 = l1.subcategories?.find((s) => s.value === level2);
  return l2 ? `${l1.label} → ${l2.label}` : l1.label;
}
