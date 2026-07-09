const ACTIVITIES = [
  {
    key: "pool-party",
    slugPrefix: "pool-party-venues-",
    label: "Pool party venues",
    h1: (w) => `Pool party venues in ${w}`,
    seoTitle: (w) => `Pool party venues in ${w}: rent by the hour`,
    heroSubtitle: (w) => `Book a private backyard pool in ${w} by the hour. $2M liability included. No membership.`,
    ctaLabel: (c) => `Find a ${c} pool party venue`,
    promptTopic: "pool party venue"
  },
  {
    key: "baby-shower",
    slugPrefix: "baby-shower-venues-",
    label: "Baby shower venues",
    h1: (w) => `Baby shower venues in ${w}`,
    seoTitle: (w) => `Baby shower venues in ${w}: private pool rentals`,
    heroSubtitle: (w) => `Host a poolside baby shower in ${w}. Private backyard pools by the hour, $2M cover, instant book.`,
    ctaLabel: (c) => `Find a ${c} baby shower venue`,
    promptTopic: "baby shower venue (poolside)"
  },
  {
    key: "birthday-party",
    slugPrefix: "birthday-party-venues-",
    label: "Birthday party venues",
    h1: (w) => `Birthday party venues in ${w}`,
    seoTitle: (w) => `Birthday party at a pool in ${w}: book by the hour`,
    heroSubtitle: (w) => `Throw a birthday party at a private pool in ${w}. Hourly rates, $2M liability included, no monthly fees.`,
    ctaLabel: (c) => `Find a ${c} birthday venue`,
    promptTopic: "birthday party venue at a pool"
  },
  {
    key: "hot-tub",
    slugPrefix: "hot-tub-rental-",
    label: "Hot tub rental",
    h1: (w) => `Hot tub rental in ${w}`,
    seoTitle: (w) => `Hot tub rental in ${w}: book a private hot tub by the hour`,
    heroSubtitle: (w) => `Rent a private hot tub by the hour in ${w}. Some hosts include sauna access. $2M cover on every booking.`,
    ctaLabel: (c) => `Find a ${c} hot tub`,
    promptTopic: "private hot tub rental"
  },
  {
    key: "dog-friendly",
    slugPrefix: "dog-friendly-pools-",
    label: "Dog-friendly pools",
    h1: (w) => `Dog-friendly pools in ${w}`,
    seoTitle: (w) => `Dog-friendly pools in ${w}: rent a private pool for your dog`,
    heroSubtitle: (w) => `Filter for pet-friendly backyard pools in ${w}. Splash sessions, dog birthdays, hydrotherapy — by the hour.`,
    ctaLabel: (c) => `Find a ${c} dog-friendly pool`,
    promptTopic: "dog-friendly private pool rental"
  }
];
const ACTIVITIES_BY_KEY = new Map(ACTIVITIES.map((a) => [a.key, a]));
const ACTIVITIES_BY_PREFIX = [...ACTIVITIES].sort(
  (a, b) => b.slugPrefix.length - a.slugPrefix.length
);
function findActivity(key) {
  if (!key) return null;
  return ACTIVITIES_BY_KEY.get(key) ?? null;
}
function parseActivityCitySlug(slug) {
  if (!slug) return null;
  for (const a of ACTIVITIES_BY_PREFIX) {
    if (slug.startsWith(a.slugPrefix)) {
      const citySlug = slug.slice(a.slugPrefix.length);
      if (citySlug.length === 0) return null;
      return { activity: a, citySlug };
    }
  }
  return null;
}
function buildActivityCitySlug(activityKey, citySlug) {
  const a = ACTIVITIES_BY_KEY.get(activityKey);
  if (!a) throw new Error(`Unknown activity: ${activityKey}`);
  return `${a.slugPrefix}${citySlug}`;
}
export {
  ACTIVITIES as A,
  buildActivityCitySlug as b,
  findActivity as f,
  parseActivityCitySlug as p
};
