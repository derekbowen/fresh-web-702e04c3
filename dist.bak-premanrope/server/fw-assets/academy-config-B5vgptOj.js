const ACADEMY_SHORT_THRESHOLD = 200;
const ACADEMY_HEALTHY_THRESHOLD = 800;
const ACADEMY_HUB_SLUGS = [
  "learning-academy",
  "host-training-academy"
];
const ACADEMY_OCCASION_SLUGS = [
  "elearning-academy-tax-deduction-tracking-guide-pool-hosts",
  "elearning-academy-dealing-with-difficult-scenarios-pool-hosts",
  "elearning-academy-hoa-navigation-guide-pool-hosts",
  "elearning-academy-dealing-with-neighbor-complaints-in-real-time",
  "elearning-academy-content-marketing-for-pool-rentals",
  "elearning-academy-listing-optimization-photography-conversion"
];
const ACADEMY_SLUGS = [
  ...ACADEMY_HUB_SLUGS,
  ...ACADEMY_OCCASION_SLUGS
];
function classifyAcademyHealth(charLen) {
  if (charLen >= ACADEMY_HEALTHY_THRESHOLD) return "published";
  if (charLen >= ACADEMY_SHORT_THRESHOLD) return "short";
  return "missing";
}
export {
  ACADEMY_SLUGS as A,
  ACADEMY_OCCASION_SLUGS as a,
  ACADEMY_HUB_SLUGS as b,
  classifyAcademyHealth as c
};
