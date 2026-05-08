import { createFileRoute, Link, useRouter, notFound } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { BreadcrumbsWithSchema } from "@/components/breadcrumbs-jsonld";
import { CourseCard, type CourseCardCourse } from "@/components/course-card";
import { CourseLearningControls } from "@/components/course-learning-controls";
import { getCourse, getRelatedCourses } from "@/server/courses.functions";
import { getCategoryMeta, I18N, getTierMeta, type Lang } from "@/lib/academy";
import { resolveAcademyHero } from "@/lib/academy-images";
import { academyHubPath, coursePath } from "@/lib/course-urls";
import { buildMeta, breadcrumbJsonLd, ldJsonScript, SITE_URL, SITE_NAME } from "@/lib/seo";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Course detail page at /p/course/{slug}.
 * Reads from the `courses` table (separate from content_pages) and renders
 * a video/embed, description, learning controls (enrollment + completion),
 * and related courses in the same category and language.
 */
export const Route = createFileRoute("/p/course/$slug")({
  loader: async ({ params }) => {
    const { course } = await getCourse({ data: { slug: params.slug } });
    if (!course) throw notFound();
    let related: CourseCardCourse[] = [];
    try {
      const r = await getRelatedCourses({
        data: {
          slug: course.slug,
          category: course.category,
          language: (course.language === "es" ? "es" : "en"),
        },
      });
      related = (r.related ?? []) as CourseCardCourse[];
    } catch {
      related = [];
    }
    return { course, related };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData?.course) return {};
    const c = loaderData.course;
    const path = `/p/course/${params.slug}`;
    const lang: Lang = c.language === "es" ? "es" : "en";
    const titleBase = c.title;
    const title = c.seo_title || `${titleBase} | ${SITE_NAME}`;
    const description = (c.seo_description || c.excerpt || c.subtitle || titleBase || "").slice(0, 160);
    const image = c.cover_image_url || undefined;

    const meta = buildMeta({
      title,
      description,
      path,
      canonicalPath: path,
      image: image ?? null,
      type: "article",
    });

    const hubPath = academyHubPath(lang);
    const scripts = [
      ldJsonScript(
        breadcrumbJsonLd([
          { name: lang === "es" ? "Inicio" : "Home", path: "/" },
          { name: lang === "es" ? "Academia" : "Academy", path: hubPath },
          { name: titleBase, path },
        ]),
      ),
      ldJsonScript({
        "@context": "https://schema.org",
        "@type": "Course",
        name: titleBase,
        description,
        provider: {
          "@type": "Organization",
          name: SITE_NAME,
          sameAs: SITE_URL,
        },
        inLanguage: lang,
        url: `${SITE_URL}${path}`,
        ...(image ? { image } : {}),
      }),
    ];

    return {
      ...meta,
      htmlAttrs: lang === "es" ? { lang: "es" } : undefined,
      scripts,
    };
  },
  component: CoursePage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-muted-foreground">{error.message}</p>
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Retry
          </button>
        </main>
        <SiteFooter />
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">Course not found</h1>
        <p className="mt-2 text-muted-foreground">
          This course doesn't exist or has been unpublished.
        </p>
        <Link
          to={ACADEMY_HUB_PATH_TYPED}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Back to Academy
        </Link>
      </main>
      <SiteFooter />
    </div>
  ),
});

const ACADEMY_HUB_PATH_TYPED = "/p/$slug" as const;

function CoursePage() {
  const { course, related } = Route.useLoaderData();
  const lang: Lang = course.language === "es" ? "es" : "en";
  const t = I18N[lang];
  const cat = getCategoryMeta(course.category, lang);
  const tier = getTierMeta(course.tier);
  const heroUrl = resolveAcademyHero(course.cover_image_url);
  const hubPath = academyHubPath(lang);

  // Long-form content can be markdown string or jsonb
  const longFormText =
    typeof course.long_form_content === "string"
      ? course.long_form_content
      : course.long_form_content && typeof course.long_form_content === "object" && "markdown" in (course.long_form_content as Record<string, unknown>)
        ? String((course.long_form_content as { markdown: string }).markdown)
        : null;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <BreadcrumbsWithSchema
          items={[
            { name: lang === "es" ? "Inicio" : "Home", path: "/" },
            { name: lang === "es" ? "Academia" : "Academy", path: hubPath },
            { name: course.title, path: `/p/course/${course.slug}` },
          ]}
        />

        <article className="mt-6">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-medium">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-primary">
              {cat.emoji} {cat.label}
            </span>
            {tier && (
              <span className={`rounded-full px-2.5 py-0.5 ${tier.badgeClass}`}>
                {tier.emoji} {tier.shortLabel}
              </span>
            )}
            {course.duration_minutes ? (
              <span className="text-muted-foreground">{course.duration_minutes} min</span>
            ) : null}
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {course.title}
          </h1>
          {course.subtitle && (
            <p className="mt-3 text-xl text-muted-foreground">{course.subtitle}</p>
          )}

          {heroUrl && (
            <div className="mt-8 aspect-video overflow-hidden rounded-2xl">
              <img
                src={heroUrl}
                alt={course.title}
                className="h-full w-full object-cover"
                loading="eager"
                fetchPriority="high"
              />
            </div>
          )}

          {course.embed_url && (
            <div className="mt-8 aspect-video overflow-hidden rounded-2xl bg-black">
              <iframe
                src={course.embed_url}
                title={course.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          )}

          {course.excerpt && (
            <p className="mt-8 text-lg text-muted-foreground">{course.excerpt}</p>
          )}

          <div className="mt-8">
            <CourseLearningControls
              courseSlug={course.slug}
              courseTitle={course.title}
              expectedMinutes={course.duration_minutes ?? undefined}
            />
          </div>

          {(course.description || longFormText) && (
            <div className="prose prose-lg mt-10 max-w-none text-foreground dark:prose-invert">
              <h2>{t.inThisCourse}</h2>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {(longFormText || course.description || "") as string}
              </ReactMarkdown>
            </div>
          )}
        </article>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-semibold text-foreground">{t.related}</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((c: CourseCardCourse) => (
                <CourseCard key={c.slug} course={c} lang={lang} />
              ))}
            </div>
          </section>
        )}

        <div className="mt-12 border-t border-border pt-8">
          <a
            href={hubPath}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            ← {t.back}
          </a>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
