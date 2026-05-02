import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { buildMeta, breadcrumbJsonLd, ldJsonScript, SITE_URL, SITE_NAME } from "@/lib/seo";
import { getCategoryMeta, I18N, type Lang } from "@/lib/academy";
import { getCourse, getRelatedCourses } from "@/server/courses.functions";
import { CourseCard, type CourseCardCourse } from "@/components/course-card";

export const Route = createFileRoute("/academy/$slug")({
  loader: async ({ params }) => {
    const { course } = await getCourse({ data: { slug: params.slug } });
    if (!course) throw notFound();
    const lang: Lang = course.language === "es" ? "es" : "en";
    const { related } = await getRelatedCourses({
      data: { slug: course.slug, category: course.category, language: lang },
    });
    return { course, related, lang };
  },
  head: ({ loaderData }) => {
    const c = loaderData?.course;
    if (!c) {
      return buildMeta({
        title: `Course not found | ${SITE_NAME}`,
        description: "The course you are looking for could not be found.",
        path: "/academy",
        noindex: true,
      });
    }
    const lang: Lang = c.language === "es" ? "es" : "en";
    const cat = getCategoryMeta(c.category, lang);
    const title = c.seo_title ?? `${c.title} — ${cat.label} | ${SITE_NAME}`;
    const description =
      c.seo_description ??
      c.excerpt ??
      (c.description ?? "").slice(0, 200);
    const path = `/academy/${c.slug}`;
    const meta = buildMeta({
      title,
      description,
      path,
      type: "article",
      image: c.cover_image_url ?? null,
    });

    const breadcrumbs = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: I18N[lang].academyTitle, path: "/academy" },
      { name: cat.label, path: `/academy?category=${c.category}` },
      { name: c.title, path },
    ]);

    const courseLd = {
      "@context": "https://schema.org",
      "@type": "Course",
      name: c.title,
      description: c.description ?? c.excerpt ?? "",
      provider: {
        "@type": "Organization",
        name: SITE_NAME,
        sameAs: SITE_URL,
      },
      inLanguage: lang === "es" ? "es" : "en",
      educationalLevel: c.level ?? "All levels",
      isAccessibleForFree: true,
      ...(c.cover_image_url ? { image: c.cover_image_url } : {}),
      hasCourseInstance: [
        {
          "@type": "CourseInstance",
          courseMode: "online",
          courseWorkload: c.duration_minutes ? `PT${c.duration_minutes}M` : "PT30M",
        },
      ],
    };

    return {
      ...meta,
      scripts: [ldJsonScript(breadcrumbs), ldJsonScript(courseLd)],
    };
  },
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-foreground">Something went wrong</h1>
        <p className="mt-3 text-muted-foreground">{error.message}</p>
        <Link to="/academy" className="mt-6 inline-block text-primary hover:underline">
          ← Back to Academy
        </Link>
      </main>
      <SiteFooter />
    </div>
  ),
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-foreground">Course not found</h1>
        <p className="mt-3 text-muted-foreground">This course may have been moved or unpublished.</p>
        <Link to="/academy" className="mt-6 inline-block text-primary hover:underline">
          ← Back to Academy
        </Link>
      </main>
      <SiteFooter />
    </div>
  ),
  component: CoursePage,
});

function CoursePage() {
  const { course, related, lang } = Route.useLoaderData();
  const safeLang: Lang = lang === "es" ? "es" : "en";
  const t = I18N[safeLang];
  const cat = getCategoryMeta(course.category, safeLang);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Header */}
        <section className="border-b border-border bg-gradient-to-br from-primary/10 via-primary/5 to-background">
          <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground">Home</Link>
              <span className="mx-2">/</span>
              <Link to="/academy" className="hover:text-foreground">{t.academyTitle}</Link>
              <span className="mx-2">/</span>
              <Link
                to="/academy"
                search={{ page: 1, lang, category: course.category, q: undefined }}
                className="hover:text-foreground"
              >
                {cat.label}
              </Link>
            </nav>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-medium">
              <span className="rounded-full bg-primary/15 px-3 py-1 text-primary">
                {cat.emoji} {cat.label}
              </span>
              {course.language === "es" && (
                <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">Español</span>
              )}
              {course.level && (
                <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">
                  {t.level}: {course.level}
                </span>
              )}
              {course.duration_minutes && (
                <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">
                  ⏱ {course.duration_minutes} min
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {course.title}
            </h1>
            {course.subtitle && (
              <p className="mt-3 text-lg text-muted-foreground">{course.subtitle}</p>
            )}
          </div>
        </section>

        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          {/* Embedded player */}
          {course.embed_url ? (
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-md">
              <div className="aspect-video w-full">
                <iframe
                  src={course.embed_url}
                  title={course.title}
                  loading="lazy"
                  allow="fullscreen; autoplay; encrypted-media"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                  className="h-full w-full"
                />
              </div>
            </div>
          ) : course.external_detail_url ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">
                This course is hosted on our main site.
              </p>
              <a
                href={course.external_detail_url}
                target="_blank"
                rel="noopener"
                className="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary-glow"
              >
                {t.startCourse} →
              </a>
            </div>
          ) : null}

          {/* Description */}
          {course.description && (
            <section className="mt-10">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">{t.inThisCourse}</h2>
              <div className="prose prose-neutral mt-4 max-w-none text-foreground">
                {course.description.split(/\n\n+/).map((p: string, i: number) => (
                  <p key={i} className="mb-4 text-base leading-relaxed text-muted-foreground">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* External link CTA */}
          {course.external_detail_url && course.embed_url && (
            <p className="mt-6 text-sm text-muted-foreground">
              Prefer the full page?{" "}
              <a href={course.external_detail_url} target="_blank" rel="noopener" className="text-primary hover:underline">
                Open on poolrentalnearme.com →
              </a>
            </p>
          )}

          {/* Related */}
          {related.length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">{t.related}</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((r: CourseCardCourse) => (
                  <CourseCard key={r.slug} course={r} lang={lang} />
                ))}
              </div>
            </section>
          )}

          <div className="mt-12 border-t border-border pt-6">
            <Link to="/academy" className="text-sm text-primary hover:underline">
              ← {t.back}
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
