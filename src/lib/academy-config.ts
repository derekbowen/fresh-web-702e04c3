/**
 * Single source of truth for academy slugs surfaced on the homepage and
 * elsewhere (landing-link-check, health metrics, content-health logging).
 * Importing this in multiple call sites keeps them in lockstep.
 */

export const ACADEMY_SHORT_THRESHOLD = 200;
export const ACADEMY_HEALTHY_THRESHOLD = 800;

export const ACADEMY_HUB_SLUGS = [
  "learning-academy",
  "host-training-academy",
] as const;

export const ACADEMY_OCCASION_SLUGS = [
  "elearning-academy-tax-deduction-tracking-guide-pool-hosts",
  "elearning-academy-dealing-with-difficult-scenarios-pool-hosts",
  "elearning-academy-hoa-navigation-guide-pool-hosts",
  "elearning-academy-dealing-with-neighbor-complaints-in-real-time",
  "elearning-academy-content-marketing-for-pool-rentals",
  "elearning-academy-listing-optimization-photography-conversion",
] as const;

export const ACADEMY_SLUGS: string[] = [
  ...ACADEMY_HUB_SLUGS,
  ...ACADEMY_OCCASION_SLUGS,
];

export type AcademyHealth = "missing" | "short" | "published";

export function classifyAcademyHealth(charLen: number): AcademyHealth {
  if (charLen >= ACADEMY_HEALTHY_THRESHOLD) return "published";
  if (charLen >= ACADEMY_SHORT_THRESHOLD) return "short";
  return "missing";
}
