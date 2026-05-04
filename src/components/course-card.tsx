import { Link } from "@tanstack/react-router";
import { getCategoryMeta, getTierMeta, I18N, type Lang } from "@/lib/academy";
import { resolveAcademyHero } from "@/lib/academy-images";

export interface CourseCardCourse {
  slug: string;
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  cover_image_url?: string | null;
  category: string;
  language: string;
  level?: string | null;
  duration_minutes?: number | null;
  tier?: string | null;
}

export function CourseCard({
  course,
  lang,
  featured,
}: {
  course: CourseCardCourse;
  lang: Lang;
  featured?: boolean;
}) {
  const t = I18N[lang];
  const cat = getCategoryMeta(course.category, lang);
  const tier = getTierMeta(course.tier);
  const heroUrl = resolveAcademyHero(course.cover_image_url);
  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40 hover:shadow-lg ${
        featured ? "ring-1 ring-primary/20" : ""
      }`}
    >
      <Link to="/academy/$slug" params={{ slug: course.slug }} className="block">
        <div className="aspect-[16/10] overflow-hidden bg-muted">
          {heroUrl ? (
            <img
              src={heroUrl}
              alt={course.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 text-5xl">
              {cat.emoji}
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium">
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-primary">
            {cat.emoji} {cat.label}
          </span>
          {tier && (
            <span className={`rounded-full px-2.5 py-0.5 ${tier.badgeClass}`}>
              {tier.emoji} {tier.shortLabel}
            </span>
          )}
          {course.language === "es" && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground">ES</span>
          )}
        </div>
        <h3 className="text-lg font-semibold leading-snug text-foreground">
          <Link to="/academy/$slug" params={{ slug: course.slug }} className="hover:text-primary">
            {course.title}
          </Link>
        </h3>
        {course.excerpt && (
          <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{course.excerpt}</p>
        )}
        <div className="mt-auto pt-4">
          <Link
            to="/academy/$slug"
            params={{ slug: course.slug }}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            {t.startCourse} →
          </Link>
        </div>
      </div>
    </article>
  );
}
