import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { BreadcrumbsWithSchema } from "@/components/breadcrumbs-jsonld";
import { CourseCard, type CourseCardCourse } from "@/components/course-card";
import { getCategoryMeta, I18N, type Lang } from "@/lib/academy";
import { academyHubPath } from "@/lib/course-urls";
import type { ContentPage } from "@/server/content-pages.functions";
import type { AcademyHubData } from "@/server/academy-hub.functions";

/**
 * Learning Academy hub. Used for both /p/learningacademy (en) and
 * /p/aprende-a-rentar-tu-piscina (es). Renders featured courses and a
 * section per category, all reading from the `courses` table.
 */
export function AcademyHubTemplate({
  page,
  hub,
  lang,
  twinPath,
}: {
  page: ContentPage;
  hub: AcademyHubData;
  lang: Lang;
  twinPath?: string | null;
}) {
  const t = I18N[lang];
  const title = page.title || page.seo_title || t.academyTitle;
  const description = page.description || page.seo_description || t.academyTagline;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <BreadcrumbsWithSchema
          items={[
            { name: lang === "es" ? "Inicio" : "Home", path: "/" },
            { name: title, path: page.url_path || academyHubPath(lang) },
          ]}
        />

        <header className="mt-6 max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{description}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {hub.total} {lang === "es" ? "cursos gratuitos" : "free courses"}
          </p>
          {twinPath && (
            <p className="mt-3 text-sm">
              <a href={twinPath} className="text-primary hover:underline" hrefLang={lang === "en" ? "es" : "en"}>
                {lang === "en" ? "Ver en español →" : "View in English →"}
              </a>
            </p>
          )}
        </header>

        {hub.featured.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-semibold text-foreground">
              {lang === "es" ? "Cursos destacados" : "Featured courses"}
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {hub.featured.map((c) => (
                <CourseCard key={c.slug} course={c as CourseCardCourse} lang={lang} featured />
              ))}
            </div>
          </section>
        )}

        {hub.categories.map((group) => {
          const meta = getCategoryMeta(group.category, lang);
          return (
            <section key={group.category} className="mt-16" id={`cat-${group.category}`}>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">
                    <span aria-hidden>{meta.emoji}</span> {meta.label}
                  </h2>
                  {meta.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{meta.description}</p>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {group.count} {lang === "es" ? "cursos" : "courses"}
                </span>
              </div>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {group.courses.map((c) => (
                  <CourseCard key={c.slug} course={c as CourseCardCourse} lang={lang} />
                ))}
              </div>
            </section>
          );
        })}

        {hub.total === 0 && (
          <p className="mt-12 text-muted-foreground">{t.noCourses}</p>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
