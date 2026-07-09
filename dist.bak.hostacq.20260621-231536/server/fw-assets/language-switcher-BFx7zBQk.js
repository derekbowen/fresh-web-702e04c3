import { jsxs, jsx } from "react/jsx-runtime";
import { aN as resolveAcademyHero, aJ as FredMascot, h as coursePath } from "./router-OI82CwOi.js";
const EN = {
  safety: { label: "Safety & Rescue", description: "CPR, drowning response, supervision, and emergency planning.", emoji: "" },
  legal: { label: "Legal & Compliance", description: "Waivers, insurance, taxes, HOAs, and regulatory essentials.", emoji: "" },
  marketing: { label: "Marketing & Pricing", description: "Photography, ads, listing optimization, and dynamic pricing.", emoji: "" },
  "ai-tech": { label: "AI & Technology", description: "ChatGPT, automation, and smart tools for pool hosts.", emoji: "" },
  "guest-experience": { label: "Guest Experience", description: "Communication, check-in, repeat-guest mastery, and conflict resolution.", emoji: "" },
  operations: { label: "Operations", description: "Equipment, water care, scheduling, and day-to-day hosting.", emoji: "" },
  occasions: { label: "Occasion Playbooks", description: "Bachelorette, Sweet 16, Quinceañera, family reunions and the highest-paying booking categories.", emoji: "" },
  niche: { label: "Niche Hosting", description: "Dog days, photoshoots, swim training, productions, aqua fitness — high-margin micro-niches.", emoji: "" },
  "host-acquisition": { label: "Host Growth & Migration", description: "Switch from Swimply, cross-list, model income, and price holiday premiums.", emoji: "" },
  general: { label: "General", description: "Foundational courses for new pool hosts.", emoji: "" }
};
const ES = {
  spanish: { label: "Aprende a Rentar tu Piscina", description: "Cursos en español para anfitriones de piscinas.", emoji: "🇪🇸" }
};
function getCategoryMeta(slug, lang = "en") {
  const map = lang === "es" ? { ...EN, ...ES } : { ...EN, ...ES };
  return map[slug] ?? {
    label: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    description: "",
    emoji: ""
  };
}
const TIERS = [
  {
    slug: "tier-1",
    label: "Tier 1 — Foundations",
    shortLabel: "Foundations",
    description: "Start here. Core skills every pool host needs on day one.",
    emoji: "",
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
  },
  {
    slug: "tier-2",
    label: "Tier 2 — Growth",
    shortLabel: "Growth",
    description: "Level up bookings, pricing, and guest experience.",
    emoji: "",
    badgeClass: "bg-sky-500/15 text-sky-700 dark:text-sky-300"
  },
  {
    slug: "tier-3",
    label: "Tier 3 — Mastery",
    shortLabel: "Mastery",
    description: "Advanced strategy: niches, automation, and scale.",
    emoji: "",
    badgeClass: "bg-violet-500/15 text-violet-700 dark:text-violet-300"
  }
];
function getTierMeta(slug) {
  if (!slug) return null;
  return TIERS.find((t) => t.slug === slug) ?? null;
}
const I18N = {
  en: {
    academyTitle: "Learn with Fred",
    academyTagline: "100+ free classes with Fred, our pool-hosting mascot, to help you launch, grow, and protect your pool rental business.",
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
    back: "Back to Learn with Fred"
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
    back: "Volver a la Academia"
  }
};
function CourseCard({
  course,
  lang,
  featured
}) {
  const t = I18N[lang];
  const cat = getCategoryMeta(course.category, lang);
  const tier = getTierMeta(course.tier);
  const heroUrl = resolveAcademyHero(course.cover_image_url);
  return /* @__PURE__ */ jsxs(
    "article",
    {
      className: `group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40 hover:shadow-lg ${featured ? "ring-1 ring-primary/20" : ""}`,
      children: [
        /* @__PURE__ */ jsx("a", { href: coursePath(course.slug), className: "block", children: /* @__PURE__ */ jsxs("div", { className: "relative aspect-[16/10] overflow-hidden bg-muted", children: [
          heroUrl ? /* @__PURE__ */ jsx(
            "img",
            {
              src: heroUrl,
              alt: course.title,
              loading: "lazy",
              className: "h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            }
          ) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 text-5xl", children: cat.emoji }),
          /* @__PURE__ */ jsxs("div", { className: "absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-white/95 py-1 pl-1 pr-2.5 shadow-md backdrop-blur-sm", children: [
            /* @__PURE__ */ jsx(FredMascot, { variant: "avatar", className: "h-6 w-6 rounded-full object-cover", alt: "Fred" }),
            /* @__PURE__ */ jsx("span", { className: "text-[11px] font-semibold text-foreground", children: lang === "es" ? "Con Fred" : "With Fred" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-1 flex-col p-5", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-2 flex flex-wrap items-center gap-2 text-xs font-medium", children: [
            /* @__PURE__ */ jsxs("span", { className: "rounded-full bg-primary/10 px-2.5 py-0.5 text-primary", children: [
              cat.emoji,
              " ",
              cat.label
            ] }),
            tier && /* @__PURE__ */ jsxs("span", { className: `rounded-full px-2.5 py-0.5 ${tier.badgeClass}`, children: [
              tier.emoji,
              " ",
              tier.shortLabel
            ] }),
            course.language === "es" && /* @__PURE__ */ jsx("span", { className: "rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground", children: "ES" })
          ] }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold leading-snug text-foreground", children: /* @__PURE__ */ jsx("a", { href: coursePath(course.slug), className: "hover:text-primary", children: course.title }) }),
          course.excerpt && /* @__PURE__ */ jsx("p", { className: "mt-2 line-clamp-3 text-sm text-muted-foreground", children: course.excerpt }),
          /* @__PURE__ */ jsx("div", { className: "mt-auto pt-4", children: /* @__PURE__ */ jsxs(
            "a",
            {
              href: coursePath(course.slug),
              className: "inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline",
              children: [
                t.startCourse,
                " →"
              ]
            }
          ) })
        ] })
      ]
    }
  );
}
function LanguageSwitcher({
  current,
  alternateHref
}) {
  const isEn = current === "en";
  const altLang = isEn ? "es" : "en";
  const altLabel = isEn ? "Español" : "English";
  const currentLabel = isEn ? "English" : "Español";
  return /* @__PURE__ */ jsxs(
    "div",
    {
      role: "group",
      "aria-label": isEn ? "Language" : "Idioma",
      className: "inline-flex items-center rounded-full border border-border bg-card p-1 text-xs font-semibold",
      children: [
        /* @__PURE__ */ jsx(
          "span",
          {
            "aria-current": "true",
            className: "rounded-full bg-primary px-3 py-1 text-primary-foreground",
            children: currentLabel
          }
        ),
        alternateHref ? /* @__PURE__ */ jsx(
          "a",
          {
            href: alternateHref,
            hrefLang: altLang,
            lang: altLang,
            className: "rounded-full px-3 py-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
            children: altLabel
          }
        ) : /* @__PURE__ */ jsx(
          "span",
          {
            "aria-disabled": "true",
            title: isEn ? "Not available in Spanish" : "No disponible en inglés",
            className: "rounded-full px-3 py-1 text-muted-foreground",
            children: altLabel
          }
        )
      ]
    }
  );
}
export {
  CourseCard as C,
  I18N as I,
  LanguageSwitcher as L,
  getTierMeta as a,
  getCategoryMeta as g
};
