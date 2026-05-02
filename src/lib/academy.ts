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
