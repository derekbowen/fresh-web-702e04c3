import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { buildMeta, breadcrumbJsonLd, ldJsonScript, SITE_URL, SITE_NAME } from "@/lib/seo";
import { getCategoryMeta, getTierMeta, TIERS, I18N, type Lang } from "@/lib/academy";
import { listCourses, listCourseCategories, listFeaturedCourses, listCourseTiers } from "@/server/courses.functions";
import { CourseCard } from "@/components/course-card";

const PAGE_SIZE = 12;

const searchSchema = z.object({
  page: fallback(z.number().int().min(1).max(500), 1).default(1),
  category: z.string().min(1).max(48).regex(/^[a-z0-9-]+$/).optional().catch(undefined),
  lang: fallback(z.enum(["en", "es"]), "en").default("en"),
  q: z.string().min(1).max(80).optional().catch(undefined),
  tier: z.enum(["tier-1", "tier-2", "tier-3"]).optional().catch(undefined),
});

export const Route = createFileRoute("/academy/")({
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search }) => ({
    page: search.page,
    category: search.category,
    lang: search.lang,
    q: search.q,
    tier: search.tier,
  }),
  loader: async ({ deps }) => {
    const language: Lang = deps.lang === "es" ? "es" : "en";
    const [list, cats, tiersRes, featured] = await Promise.all([
      listCourses({
        data: {
          page: deps.page,
          pageSize: PAGE_SIZE,
          category: deps.category,
          language,
          search: deps.q,
          tier: deps.tier,
        },
      }),
      listCourseCategories({ data: { language } }),
      listCourseTiers({ data: { language } }),
      deps.page === 1 && !deps.category && !deps.q && !deps.tier
        ? listFeaturedCourses({ data: { language, limit: 3 } })
        : Promise.resolve({ courses: [] as Awaited<ReturnType<typeof listFeaturedCourses>>["courses"] }),
    ]);
    return {
      ...list,
      categories: cats.categories,
      tiers: tiersRes.tiers,
      featured: featured.courses,
      languageActive: language,
    };
  },
  head: ({ loaderData, match }) => {
    const search = (match?.search ?? {}) as {
      page?: number;
      category?: string;
      lang?: Lang;
      q?: string;
      tier?: "tier-1" | "tier-2" | "tier-3";
    };
    const page = search.page ?? 1;
    const lang: Lang = (search.lang ?? "en") === "es" ? "es" : "en";
    const t = I18N[lang];
    const total = loaderData?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const catMeta = search.category ? getCategoryMeta(search.category, lang) : null;
    const tierMeta = getTierMeta(search.tier);
    const scopeLabel = tierMeta?.label ?? catMeta?.label ?? null;
    const scopeDesc = tierMeta?.description ?? catMeta?.description ?? null;
    const baseTitle = scopeLabel
      ? `${scopeLabel} — ${t.academyTitle} | ${SITE_NAME}`
      : `${t.academyTitle} — Free Courses for Pool Hosts | ${SITE_NAME}`;
    const title = page > 1 ? `${baseTitle} (Page ${page})` : baseTitle;
    const baseDesc = scopeDesc
      ? `${scopeDesc} ${total} expert courses for pool rental hosts.`
      : `${t.academyTagline} ${total}+ courses on safety, marketing, legal, AI, and more.`;
    const description = page > 1 ? `${baseDesc} Page ${page} of ${totalPages}.` : baseDesc;

    const queryStr = (p: number) => {
      const parts: string[] = [];
      if (search.category) parts.push(`category=${search.category}`);
      if (search.tier) parts.push(`tier=${search.tier}`);
      if (lang === "es") parts.push(`lang=es`);
      if (search.q) parts.push(`q=${encodeURIComponent(search.q)}`);
      if (p > 1) parts.push(`page=${p}`);
      return parts.length ? `?${parts.join("&")}` : "";
    };
    const path = `/academy${queryStr(page)}`;
    const prevPath = page > 1 ? `/academy${queryStr(page - 1)}` : null;
    const nextPath = page < totalPages ? `/academy${queryStr(page + 1)}` : null;

    const meta = buildMeta({
      title,
      description,
      path,
      canonicalPath: path,
      type: "website",
      prevPath,
      nextPath,
      noindex: page > totalPages,
    });

    const breadcrumbs = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: t.academyTitle, path: "/academy" },
      ...(tierMeta ? [{ name: tierMeta.label, path: `/academy?tier=${search.tier}` }] : []),
      ...(catMeta ? [{ name: catMeta.label, path: `/academy?category=${search.category}` }] : []),
    ]);

    const itemList = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: (loaderData?.courses ?? []).map((c, i) => ({
        "@type": "ListItem",
        position: (page - 1) * PAGE_SIZE + i + 1,
        url: `${SITE_URL}/academy/${c.slug}`,
        name: c.title,
      })),
    };

    return {
      ...meta,
      scripts: [ldJsonScript(breadcrumbs), ldJsonScript(itemList)],
    };
  },
  component: AcademyIndex,
});

function AcademyIndex() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const lang: Lang = data.languageActive;
  const t = I18N[lang];
  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  const activeCat = search.category ?? null;
  const activeMeta = activeCat ? getCategoryMeta(activeCat, lang) : null;
  const activeTier = search.tier ?? null;
  const activeTierMeta = getTierMeta(activeTier);
  const heroLabel = activeTierMeta?.label ?? activeMeta?.label ?? null;
  const heroEmoji = activeTierMeta?.emoji ?? activeMeta?.emoji ?? null;
  const heroDesc = activeTierMeta?.description ?? activeMeta?.description ?? t.academyTagline;
  const tierCountMap = new Map(data.tiers.map((tier: { slug: string; count: number }) => [tier.slug, tier.count]));

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border bg-gradient-to-br from-primary/10 via-primary/5 to-background">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground">Home</Link>
              <span className="mx-2">/</span>
              <Link to="/academy" search={{ page: 1, lang, category: undefined, q: undefined, tier: undefined }} className="hover:text-foreground">
                {t.academyTitle}
              </Link>
              {activeTierMeta && (<><span className="mx-2">/</span><span className="text-foreground">{activeTierMeta.label}</span></>)}
              {activeMeta && (<><span className="mx-2">/</span><span className="text-foreground">{activeMeta.label}</span></>)}
            </nav>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {heroLabel ? (
                <>
                  {heroEmoji && <span className="mr-3">{heroEmoji}</span>}
                  {heroLabel}
                </>
              ) : (
                t.academyTitle
              )}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              {heroDesc}
            </p>

            {/* Language toggle */}
            <div className="mt-6 inline-flex rounded-full border border-border bg-background p-1 text-sm font-medium">
              <Link
                to="/academy"
                search={{ page: 1, lang: "en", category: undefined, q: undefined, tier: activeTier ?? undefined }}
                className={`rounded-full px-4 py-1.5 transition ${
                  lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                English
              </Link>
              <Link
                to="/academy"
                search={{ page: 1, lang: "es", category: undefined, q: undefined, tier: activeTier ?? undefined }}
                className={`rounded-full px-4 py-1.5 transition ${
                  lang === "es" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Español
              </Link>
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Category pills */}
          <div className="flex flex-wrap gap-2" role="navigation" aria-label={t.browseByTopic}>
            <Link
              to="/academy"
              search={{ page: 1, lang, category: undefined, q: undefined }}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                !activeCat
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:border-primary/50"
              }`}
            >
              {t.allCategories} ({data.total + (activeCat ? 0 : 0)})
            </Link>
            {data.categories.map((c: { slug: string; count: number }) => {
              const meta = getCategoryMeta(c.slug, lang);
              const active = activeCat === c.slug;
              return (
                <Link
                  key={c.slug}
                  to="/academy"
                  search={{ page: 1, lang, category: c.slug, q: undefined }}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:border-primary/50"
                  }`}
                >
                  <span className="mr-1.5">{meta.emoji}</span>
                  {meta.label} ({c.count})
                </Link>
              );
            })}
          </div>

          {/* Featured */}
          {data.featured.length > 0 && (
            <section className="mt-12">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">⭐ Featured courses</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {(data.featured as unknown as import("@/components/course-card").CourseCardCourse[]).map((c) => (
                  <CourseCard key={c.slug} course={c} lang={lang} featured />
                ))}
              </div>
            </section>
          )}

          {/* Grid */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {activeMeta ? activeMeta.label : t.allCategories}
              <span className="ml-3 text-base font-normal text-muted-foreground">
                {data.total} {data.total === 1 ? "course" : "courses"}
              </span>
            </h2>

            {data.courses.length === 0 ? (
              <p className="mt-6 text-muted-foreground">{t.noCourses}</p>
            ) : (
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data.courses.map((c: import("@/components/course-card").CourseCardCourse) => (
                  <CourseCard key={c.slug} course={c} lang={lang} />
                ))}
              </div>
            )}
          </section>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="mt-12 flex items-center justify-between" aria-label="Pagination">
              <Link
                to="/academy"
                search={{
                  page: Math.max(1, search.page - 1),
                  lang,
                  category: activeCat ?? undefined,
                  q: search.q,
                }}
                disabled={search.page <= 1}
                className={`rounded-md border px-4 py-2 text-sm font-medium ${
                  search.page <= 1
                    ? "pointer-events-none border-border text-muted-foreground opacity-50"
                    : "border-border text-foreground hover:border-primary"
                }`}
                rel="prev"
              >
                {t.prev}
              </Link>
              <p className="text-sm text-muted-foreground">
                {t.page}{" "}
                <span className="font-semibold text-foreground">{search.page}</span> {t.of}{" "}
                <span className="font-semibold text-foreground">{totalPages}</span>
              </p>
              <Link
                to="/academy"
                search={{
                  page: Math.min(totalPages, search.page + 1),
                  lang,
                  category: activeCat ?? undefined,
                  q: search.q,
                }}
                disabled={search.page >= totalPages}
                className={`rounded-md border px-4 py-2 text-sm font-medium ${
                  search.page >= totalPages
                    ? "pointer-events-none border-border text-muted-foreground opacity-50"
                    : "border-border text-foreground hover:border-primary"
                }`}
                rel="next"
              >
                {t.next}
              </Link>
            </nav>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
