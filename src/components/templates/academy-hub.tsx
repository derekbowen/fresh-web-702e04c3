import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { BreadcrumbsWithSchema } from "@/components/breadcrumbs-jsonld";
import { CourseCard, type CourseCardCourse } from "@/components/course-card";
import { LanguageSwitcher } from "@/components/language-switcher";
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
          <div className="mb-4">
            <LanguageSwitcher current={lang} alternateHref={twinPath ?? null} />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{description}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {hub.total} {lang === "es" ? "cursos gratuitos" : "free courses"}
          </p>
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

        {lang === "en" && (
          <section className="mt-20 border-t border-border pt-12">
            <h2 className="text-2xl font-semibold text-foreground">
              Free host tools
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Pair the academy with the tools top earners use every week.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { href: "/p/start-hosting", title: "Start hosting", body: "Earn $1,500–$8,000/month renting your pool." },
                { href: "/p/ai-listing-generator", title: "AI listing generator", body: "Turn one photo into a booking-ready listing." },
                { href: "/p/pool-heating-cost-calculator", title: "Pool heating cost calculator", body: "Gas vs heat pump vs solar — monthly cost." },
                { href: "/p/pool-rules-generator", title: "Pool rules generator", body: "Printable house rules in under a minute." },
                { href: "/p/waiver-generator", title: "Waiver generator", body: "Digital liability waivers, signed on phone." },
                { href: "/p/host-marketing-playbook", title: "Host marketing playbook", body: "Flyers, captions, seasonal campaigns." },
              ].map((t) => (
                <a
                  key={t.href}
                  href={t.href}
                  className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-sm"
                >
                  <h3 className="text-sm font-semibold text-foreground">
                    {t.title} →
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">{t.body}</p>
                </a>
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

