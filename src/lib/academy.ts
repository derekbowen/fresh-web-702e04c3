export type Lang = "en" | "es";

export interface CategoryMeta {
  label: string;
  description: string;
  emoji: string;
}

const EN: Record<string, CategoryMeta> = {
  safety: { label: "Safety & Rescue", description: "CPR, drowning response, supervision, and emergency planning.", emoji: "🛟" },
  legal: { label: "Legal & Compliance", description: "Waivers, insurance, taxes, HOAs, and regulatory essentials.", emoji: "⚖️" },
  marketing: { label: "Marketing & Pricing", description: "Photography, ads, listing optimization, and dynamic pricing.", emoji: "📈" },
  "ai-tech": { label: "AI & Technology", description: "ChatGPT, automation, and smart tools for pool hosts.", emoji: "🤖" },
  "guest-experience": { label: "Guest Experience", description: "Communication, check-in, repeat-guest mastery, and conflict resolution.", emoji: "🤝" },
  operations: { label: "Operations", description: "Equipment, water care, scheduling, and day-to-day hosting.", emoji: "🛠️" },
  occasions: { label: "Occasion Playbooks", description: "Bachelorette, Sweet 16, Quinceañera, family reunions and the highest-paying booking categories.", emoji: "🎉" },
  niche: { label: "Niche Hosting", description: "Dog days, photoshoots, swim training, productions, aqua fitness — high-margin micro-niches.", emoji: "🐾" },
  "host-acquisition": { label: "Host Growth & Migration", description: "Switch from Swimply, cross-list, model income, and price holiday premiums.", emoji: "🚀" },
  general: { label: "General", description: "Foundational courses for new pool hosts.", emoji: "📚" },
};

const ES: Record<string, CategoryMeta> = {
  spanish: { label: "Aprende a Rentar tu Piscina", description: "Cursos en español para anfitriones de piscinas.", emoji: "🇪🇸" },
};

export function getCategoryMeta(slug: string, lang: Lang = "en"): CategoryMeta {
  const map = lang === "es" ? { ...EN, ...ES } : { ...EN, ...ES };
  return (
    map[slug] ?? {
      label: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      description: "",
      emoji: "🎓",
    }
  );
}

export type Tier = "tier-1" | "tier-2" | "tier-3";

export interface TierMeta {
  slug: Tier;
  label: string;
  shortLabel: string;
  description: string;
  emoji: string;
  badgeClass: string;
}

export const TIERS: TierMeta[] = [
  {
    slug: "tier-1",
    label: "Tier 1 — Foundations",
    shortLabel: "Foundations",
    description: "Start here. Core skills every pool host needs on day one.",
    emoji: "🟢",
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
  {
    slug: "tier-2",
    label: "Tier 2 — Growth",
    shortLabel: "Growth",
    description: "Level up bookings, pricing, and guest experience.",
    emoji: "🔵",
    badgeClass: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  },
  {
    slug: "tier-3",
    label: "Tier 3 — Mastery",
    shortLabel: "Mastery",
    description: "Advanced strategy: niches, automation, and scale.",
    emoji: "🟣",
    badgeClass: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  },
];

export function getTierMeta(slug: string | null | undefined): TierMeta | null {
  if (!slug) return null;
  return TIERS.find((t) => t.slug === slug) ?? null;
}

export const I18N: Record<Lang, {
  academyTitle: string;
  academyTagline: string;
  startCourse: string;
  allCategories: string;
  page: string;
  of: string;
  prev: string;
  next: string;
  related: string;
  noCourses: string;
  searchPlaceholder: string;
  browseByTopic: string;
  inThisCourse: string;
  level: string;
  language: string;
  back: string;
}> = {
  en: {
    academyTitle: "Pool Host Learning Academy",
    academyTagline: "100+ free courses to help you launch, grow, and protect your pool rental business.",
    startCourse: "Start Course",
    allCategories: "All courses",
    page: "Page",
    of: "of",
    prev: "← Previous",
    next: "Next →",
    related: "Related courses",
    noCourses: "No courses found.",
    searchPlaceholder: "Search courses…",
    browseByTopic: "Browse by topic",
    inThisCourse: "About this course",
    level: "Level",
    language: "Language",
    back: "Back to Academy",
  },
  es: {
    academyTitle: "Aprende a Rentar tu Piscina",
    academyTagline: "Cursos gratuitos en español para anfitriones de piscinas.",
    startCourse: "Comenzar Curso",
    allCategories: "Todos los cursos",
    page: "Página",
    of: "de",
    prev: "← Anterior",
    next: "Siguiente →",
    related: "Cursos relacionados",
    noCourses: "No se encontraron cursos.",
    searchPlaceholder: "Buscar cursos…",
    browseByTopic: "Explorar por tema",
    inThisCourse: "Sobre este curso",
    level: "Nivel",
    language: "Idioma",
    back: "Volver a la Academia",
  },
};
