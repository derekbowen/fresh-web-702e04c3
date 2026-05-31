import {
  createFileRoute,
  Link,
  useRouter,
  notFound,
  redirect,
} from "@tanstack/react-router";
import {
  lookupContentPage,
  getHreflangSibling,
  type ContentPage,
} from "@/server/content-pages.functions";
import {
  getNearbyCitiesForPage,
  cityForContentPage,
  type NearbyCity,
} from "@/server/nearby-cities.functions";
import { getCityBySlug, type CityRow } from "@/server/cities.functions";
import { getCitySources, type CitySource } from "@/server/city-sources.functions";
import { getInternalLinkTargets } from "@/server/internal-links.functions";
import type { LinkTarget } from "@/components/auto-linked-content";
import { log404 } from "@/server/content-404-log.functions";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import {
  buildMeta,
  breadcrumbJsonLd,
  ldJsonScript,
  SITE_URL,
  SITE_NAME,
  AUTHOR_PERSON_JSONLD_REF,
  AUTHOR_PERSON_URL,
} from "@/lib/seo";
import { ResourceArticleTemplate } from "@/components/templates/resource-article";
import { GenericPageTemplate } from "@/components/templates/generic-page";
import { AdvocacyTemplate } from "@/components/templates/advocacy";
import { HostAcqCityTemplate } from "@/components/templates/host-acq-city";

import { EventGuideTemplate } from "@/components/templates/event-guide";
import { SwimInstructorCityTemplate } from "@/components/templates/swim-instructor-city";
import { SwimInstructorHubTemplate } from "@/components/templates/swim-instructor-hub";
import { PoolMaintenanceTemplate } from "@/components/templates/pool-maintenance";
import { ActivityCityTemplate } from "@/components/templates/activity-city";
import { faqsForContentPage, faqPageJsonLd } from "@/lib/page-faqs";
import { heroPreloadLinks } from "@/lib/hero-image";
import { localBusinessForContentPage } from "@/lib/page-localbusiness";
import { hostAcqSchemasForPage } from "@/lib/host-acq-schemas";
import { normalizeTitleVariant, getVariantCopy } from "@/lib/host-acq-variants";
import { parseCitySlug } from "@/lib/city-slug";
import { getAcademyHub, type AcademyHubData } from "@/server/academy-hub.functions";
import { AcademyHubTemplate } from "@/components/templates/academy-hub";
import { ACADEMY_HUB_SLUGS, academyHubPath } from "@/lib/course-urls";
import {
  getRelatedBlogMeta,
  type RelatedPostMeta,
} from "@/server/blog-enrichment.functions";

function academyLangForSlug(slug: string | null | undefined): "en" | "es" | null {
  if (!slug) return null;
  if (slug === ACADEMY_HUB_SLUGS.en) return "en";
  if (slug === ACADEMY_HUB_SLUGS.es) return "es";
  return null;
}

/**
 * Dispatcher route for /p/{slug}.
 *
 * Sharetribe puts ALL custom content pages under /p/{slug} — homepage variants,
 * city pages, host acquisition, event guides, articles, etc. fresh-web mirrors
 * this URL structure. A single route looks up the slug in `content_pages`,
 * checks for legacy_slug aliases (301 redirect), and dispatches to the
 * appropriate template based on `template_type`.
 *
 * See migration-plan/01-route-structure.md for the dispatcher design rationale.
 */

export const Route = createFileRoute("/p/$slug")({
  beforeLoad: async ({ params }) => {
    // 301 known junk slugs to home (external LLM hallucinations / stale caches).
    // /p/null, /p/details, /p/mailto:* leak into GSC 404 reports; redirect
    // to silence them rather than continuing to serve 404s.
    if (
      params.slug === "null" ||
      params.slug === "details" ||
      params.slug.startsWith("mailto:")
    ) {
      throw redirect({ href: "/", statusCode: 301, replace: true });
    }
    // Lowercase normalization: all canonical slugs in content_pages are lowercase
    // (built via slugify()). Issue a 301 to the lowercase variant before any DB
    // hit so Mixed-Case URLs collapse cleanly in GSC. Phase 2 Ship B.
    const lower = params.slug.toLowerCase();
    if (lower !== params.slug) {
      throw redirect({
        to: "/p/$slug",
        params: { slug: lower },
        statusCode: 301,
        replace: true,
      });
    }
    const result = await lookupContentPage({ data: { slug: params.slug } });
    if (result.kind === "redirect") {
      if (result.redirectPath?.startsWith("/")) {
        throw redirect({ href: result.redirectPath, statusCode: 301, replace: true });
      }
      throw redirect({
        to: "/p/$slug",
        params: { slug: result.canonicalSlug },
        statusCode: 301,
        replace: true,
      });
    }
    if (result.kind === "not_found") {
      // Fire-and-forget: log the missing slug for admin review. The server fn
      // captures referer/user-agent from the request context server-side.
      void log404({ data: { urlPath: `/p/${params.slug}`, slug: params.slug } });
      throw notFound();
    }
    // Pass the loaded page through to the loader to avoid a second query
    return { page: result.page };
  },
  loader: async ({ context }) => {
    const page = (context as { page: ContentPage }).page;
    let nearbyCities: NearbyCity[] = [];
    let city: CityRow | null = null;
    let citySources: CitySource[] = [];
    if (
      page.template_type === "host_acq_city" ||
      page.template_type === "spanish_host_acq" ||
      page.template_type === "swim_instructor_city" ||
      page.template_type === "activity_city"
    ) {
      try {
        const requirePathPrefix =
          page.template_type === "host_acq_city"
            ? "become-a-swimming-pool-host-"
            : page.template_type === "swim_instructor_city"
              ? "swim-instructor-pool-rental-"
              : undefined;
        nearbyCities = await getNearbyCitiesForPage({
          data: {
            templateType: page.template_type,
            slug: page.slug,
            limit: 6,
            ...(requirePathPrefix ? { requirePathPrefix } : {}),
          },
        });
      } catch {
        nearbyCities = [];
      }
      const citySlug = cityForContentPage(page.template_type, page.slug);
      if (citySlug) {
        try {
          city = await getCityBySlug({ data: { slug: citySlug } });
        } catch {
          city = null;
        }
        if (page.template_type === "host_acq_city") {
          try {
            citySources = await getCitySources({ data: { slug: citySlug } });
          } catch {
            citySources = [];
          }
        }
      }
    }
    let linkTargets: LinkTarget[] = [];
    try {
      const citySlug = cityForContentPage(page.template_type, page.slug);
      linkTargets = await getInternalLinkTargets({
        data: {
          citySlug: citySlug ?? null,
          nearbyCitySlugs: nearbyCities.map((c) => c.slug),
        },
      });
    } catch {
      linkTargets = [];
    }
    let academyHub: AcademyHubData | null = null;
    const academyLang = academyLangForSlug(page.slug);
    if (academyLang) {
      try {
        academyHub = await getAcademyHub({ data: { language: academyLang } });
      } catch {
        academyHub = null;
      }
    }
    let hreflangSibling: { slug: string; language: string } | null = null;
    const pageForSibling = page as { hreflang_group?: string | null };
    if (pageForSibling.hreflang_group) {

      try {
        const res = await getHreflangSibling({ data: { pageId: page.id } });
        hreflangSibling = res.sibling;
      } catch {
        hreflangSibling = null;
      }
    }

    let relatedPosts: RelatedPostMeta[] = [];
    const relatedSlugs = (page as { related_slugs?: string[] | null }).related_slugs;
    if (Array.isArray(relatedSlugs) && relatedSlugs.length > 0) {
      try {
        const r = await getRelatedBlogMeta({ data: { slugs: relatedSlugs.slice(0, 8) } });
        relatedPosts = r.posts;
      } catch {
        relatedPosts = [];
      }
    }
    return { page, nearbyCities, city, citySources, linkTargets, academyHub, hreflangSibling, relatedPosts };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData?.page) return {};
    const p = loaderData.page;
    const path = `/p/${params.slug}`;
    // Canonical always points at the page's stored url_path (which uses the
    // canonical slug), so legacy/case/duplicate slug variants all collapse to
    // a single canonical URL — even before the 301 redirect fires.
    const canonicalPath = p.url_path || `/p/${p.slug ?? params.slug}`;
    const titleBase = p.title || p.seo_title || params.slug;
    let title = p.seo_title || `${titleBase} | ${SITE_NAME}`;
    let description = (p.seo_description || p.description || titleBase || "").slice(0, 160);

    // A/B/C/D title-test override (host_acq_city only; NULL = control = no change)
    const variant = p.template_type === "host_acq_city"
      ? normalizeTitleVariant((p as { title_variant?: string | null }).title_variant)
      : null;
    if (variant) {
      const citySlug = cityForContentPage(p.template_type, p.slug);
      const parsed = citySlug ? parseCitySlug(citySlug) : null;
      const cityName = loaderData.city?.name || parsed?.city || "your city";
      const stateCode = (loaderData.city?.state_code || parsed?.stateCode || "").toUpperCase();
      const copy = getVariantCopy(variant, cityName, stateCode);
      title = copy.title;
      description = copy.metaDescription;
    }

    // Hreflang — emit the EN↔ES pair for the academy hubs and any other
    // page that has a known twin. (Skipped on simple en pages with no twin.)
    const academyLang = academyLangForSlug(p.slug);
    let hreflang: Array<{ lang: string; href: string }> | undefined;
    if (academyLang) {
      hreflang = [
        { lang: "en", href: `${SITE_URL}${academyHubPath("en")}` },
        { lang: "es", href: `${SITE_URL}${academyHubPath("es")}` },
        { lang: "x-default", href: `${SITE_URL}${academyHubPath("en")}` },
      ];
    } else {
      hreflang = buildHreflangLinks(p, loaderData.hreflangSibling ?? null);
    }

    const pAny = p as unknown as {
      og_title?: string | null;
      og_description?: string | null;
      canonical_override?: string | null;
    };
    const meta = buildMeta({
      title,
      description,
      path,
      canonicalPath,
      canonicalUrl: pAny.canonical_override?.trim() || undefined,
      ogTitle: pAny.og_title?.trim() || undefined,
      ogDescription: pAny.og_description?.trim() || undefined,
      image: p.cover_image_url || p.hero_image_url || undefined,
      type: isArticleType(p.template_type) || academyLang ? "article" : "website",
      hreflang,
    });

    // Article OpenGraph metadata — for resource/event_guide/guide templates.
    // Boosts AEO and helps Google/social cards show publish date + author.
    const ARTICLE_OG_TYPES = new Set(["resource", "resource_article", "event_guide", "guide"]);
    if (ARTICLE_OG_TYPES.has((p.template_type ?? "") as string)) {
      const publishedIso = toIsoOrUndefined(p.published_at) ?? toIsoOrUndefined(p.scraped_at);
      const modifiedIso = toIsoOrUndefined(p.updated_at);
      const articleMeta: Array<{ property: string; content: string }> = [
        { property: "article:author", content: p.author || "Pool Rental Near Me" },
      ];
      if (publishedIso) articleMeta.push({ property: "article:published_time", content: publishedIso });
      if (modifiedIso) articleMeta.push({ property: "article:modified_time", content: modifiedIso });
      meta.meta = [...(meta.meta ?? []), ...articleMeta];
    }

    // Hidden verification tag for the host_acq_city title-test variant pages.
    if (variant) {
      meta.meta = [
        ...(meta.meta ?? []),
        { name: "title_test_variant", content: variant },
      ];
    }

    const scripts = [];

    // BreadcrumbList JSON-LD — Home > Blog > {Topic} > {Title} for blog posts.
    const blogTopic = (p as { topic?: string | null }).topic ?? null;
    const blogCrumbs =
      p.template_type === "resource" && (blogTopic || p.category === "blog" || blogTopic !== null);
    if (blogCrumbs) {
      const topicLabel = blogTopic
        ? blogTopic.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : null;
      const crumbs: Array<{ name: string; path: string }> = [
        { name: "Home", path: "/" },
        { name: "Blog", path: "/p/blog" },
      ];
      if (topicLabel && blogTopic) {
        crumbs.push({ name: topicLabel, path: `/p/blog?topic=${encodeURIComponent(blogTopic)}` });
      }
      crumbs.push({ name: titleBase || path, path });
      scripts.push(ldJsonScript(breadcrumbJsonLd(crumbs)));
    } else {
      scripts.push(
        ldJsonScript(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: titleBase || path, path },
          ]),
        ),
      );
    }

    // Article JSON-LD — for content-style template types
    if (isArticleType(p.template_type)) {
      const authorName = p.author || "Derek Bowen";
      const isDerek = authorName === "Derek Bowen";
      const article = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: p.title,
        description,
        image: p.cover_image_url ? [p.cover_image_url] : undefined,
        author: isDerek
          ? AUTHOR_PERSON_JSONLD_REF
          : { "@type": "Person", name: authorName },
        datePublished: toIsoOrUndefined(p.published_at),
        dateModified: toIsoOrUndefined(p.updated_at) ?? toIsoOrUndefined(p.published_at),
        mainEntityOfPage: `${SITE_URL}${path}`,
        publisher: {
          "@type": "Organization",
          name: SITE_NAME,
          url: SITE_URL,
          logo: {
            "@type": "ImageObject",
            url: `${SITE_URL}/icon-512.png`,
          },
        },
        inLanguage: p.language,
      };
      scripts.push(ldJsonScript(article));
    }

    // FAQPage JSON-LD — synthesized from template_type + city/state slug
    const faqs = faqsForContentPage(p);
    if (faqs.length > 0) {
      scripts.push(ldJsonScript(faqPageJsonLd(faqs)));
    }

    // LocalBusiness/Service JSON-LD — city-scoped templates only
    const localBiz = localBusinessForContentPage(p);
    if (localBiz) {
      scripts.push(ldJsonScript(localBiz));
    }

    // Host-acquisition structural signals (WebPage+audience, ProfessionalService,
    // Offer, HowTo) — host-acq templates only. Renter-facing pages skip these.
    for (const block of hostAcqSchemasForPage(p, loaderData.city ?? null)) {
      scripts.push(ldJsonScript(block));
    }

    // State-scoped Service JSON-LD — advocacy state pages
    if (p.template_type === "host_advocacy_state" && p.slug) {
      const stateMatch = p.slug.match(/^host-advocacy-(.+)$/);
      const stateName = stateMatch
        ? stateMatch[1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : null;
      if (stateName) {
        scripts.push(
          ldJsonScript({
            "@context": "https://schema.org",
            "@type": "Service",
            serviceType: "Pool rental marketplace",
            provider: {
              "@type": "Organization",
              name: SITE_NAME,
              url: SITE_URL,
            },
            areaServed: {
              "@type": "State",
              name: stateName,
              addressCountry: "US",
            },
            url: `${SITE_URL}${path}`,
            inLanguage: p.language || "en",
          }),
        );
      }
    }

    // CollectionPage + ItemList for the learning academy hubs
    const hub = (loaderData as { academyHub?: AcademyHubData | null }).academyHub;
    if (academyLang && hub && hub.total > 0) {
      const allCourses = hub.categories.flatMap((g) => g.courses);
      scripts.push(
        ldJsonScript({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: titleBase,
          description,
          url: `${SITE_URL}${canonicalPath}`,
          inLanguage: academyLang,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: allCourses.length,
            itemListElement: allCourses.map((c, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${SITE_URL}/p/course/${c.slug}`,
              name: c.title,
            })),
          },
        }),
      );
    }

    // LCP preload — kicks off the hero image fetch in parallel with the JS
    // chunks. Only preload when the page actually has a stored hero (the
    // templates only render <img> in that case).
    const heroForPreload = p.hero_image_url || p.cover_image_url || null;
    const links = [
      ...(meta.links ?? []),
      ...heroPreloadLinks(heroForPreload),
    ];

    return { ...meta, links, scripts };
  },
  component: ContentPageDispatcher,
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
        <h1 className="text-3xl font-bold">Page not found</h1>
        <p className="mt-2 text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Go home
        </Link>
      </main>
      <SiteFooter />
    </div>
  ),
});

function toIsoOrUndefined(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function isArticleType(t: ContentPage["template_type"]): boolean {
  const v = t as string | null;
  return (
    v === "resource" ||
    v === "elearning" ||
    v === "event_guide" ||
    v === "host_advocacy_hub" ||
    v === "host_advocacy_state" ||
    v === "spanish_resource" ||
    v === "pool_maintenance" ||
    v === "pool_maintenance_hub"
  );
}

function buildHreflangLinks(
  p: ContentPage,
  sibling: { slug: string; language: string } | null,
): Array<{ lang: string; href: string }> | undefined {
  const pAny = p as { hreflang_group?: string | null };
  if (!sibling || !pAny.hreflang_group) return undefined;


  const pagePath = p.url_path || `/p/${p.slug ?? ""}`;
  const siblingPath = `/p/${sibling.slug}`;
  const pageLang = p.locale || p.language || "en";

  // US-targeted EN↔ES pairs use regional codes so Google clusters them per
  // market. x-default points at the English variant.
  const regional = (lang: string) =>
    lang === "en" ? "en-US" : lang === "es" ? "es-US" : lang;

  const englishHref =
    pageLang === "en"
      ? `${SITE_URL}${pagePath}`
      : sibling.language === "en"
        ? `${SITE_URL}${siblingPath}`
        : `${SITE_URL}${pagePath}`;

  return [
    { lang: regional(pageLang), href: `${SITE_URL}${pagePath}` },
    { lang: regional(sibling.language), href: `${SITE_URL}${siblingPath}` },
    { lang: "x-default", href: englishHref },
  ];
}


function ContentPageDispatcher() {
  const loaderData = Route.useLoaderData();
  const { page, nearbyCities, city, citySources, linkTargets, academyHub, relatedPosts } =
    (loaderData ?? {}) as ReturnType<typeof Route.useLoaderData>;

  // Defensive guard: if the page object is missing entirely, show a friendly
  // not-found view instead of crashing downstream templates that all assume
  // `page` is defined and read `page.template_type` / `page.title`. This was
  // the source of the "undefined is not an object (evaluating
  // 't.template_type')" crash some users hit when navigating between
  // /p/* pages — the generic fallback itself reads page.template_type.
  if (!page) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-3xl font-bold">Page not found</h1>
          <p className="mt-2 text-muted-foreground">
            The page you're looking for is unavailable. Try refreshing, or head back home.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Go home
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }
  if (!page.template_type) {
    return <GenericPageTemplate page={page} linkTargets={linkTargets} />;
  }

  // Academy hubs (en + es) override their stored template_type so they always
  // render the rich hub UI even though the row's template_type may be
  // "resource" or "spanish_resource".
  const academyLang = academyLangForSlug(page.slug);
  if (academyLang && academyHub) {
    return (
      <AcademyHubTemplate
        page={page}
        hub={academyHub}
        lang={academyLang}
        twinPath={academyHubPath(academyLang === "en" ? "es" : "en")}
      />
    );
  }

  switch (page.template_type as string | null) {
    case "host_acq_city":
      return <HostAcqCityTemplate page={page} nearbyCities={nearbyCities} city={city} linkTargets={linkTargets} citySources={citySources} />;
    case "event_guide":
      return <EventGuideTemplate page={page} linkTargets={linkTargets} nearbyCities={nearbyCities} />;
    case "swim_instructor_city":
      return <SwimInstructorCityTemplate page={page} nearbyCities={nearbyCities} linkTargets={linkTargets} />;
    case "swim_instructor_hub":
      return <SwimInstructorHubTemplate page={page} linkTargets={linkTargets} />;
    case "resource":
      return <ResourceArticleTemplate page={page} linkTargets={linkTargets} relatedPosts={relatedPosts} />;
    case "pool_maintenance":
    case "pool_maintenance_hub":
      return <PoolMaintenanceTemplate page={page} />;
    case "host_advocacy_hub":
    case "host_advocacy_state":
      return <AdvocacyTemplate page={page} />;
    case "activity_city":
      return <ActivityCityTemplate page={page} nearbyCities={nearbyCities} linkTargets={linkTargets} />;
    default:
      return <GenericPageTemplate page={page} linkTargets={linkTargets} />;
  }
}
