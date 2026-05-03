import {
  createFileRoute,
  Link,
  useRouter,
  notFound,
  redirect,
} from "@tanstack/react-router";
import {
  lookupContentPage,
  type ContentPage,
} from "@/server/content-pages.functions";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import {
  buildMeta,
  breadcrumbJsonLd,
  ldJsonScript,
  SITE_URL,
  SITE_NAME,
} from "@/lib/seo";
import { ResourceArticleTemplate } from "@/components/templates/resource-article";
import { GenericPageTemplate } from "@/components/templates/generic-page";

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
    const result = await lookupContentPage({ data: { slug: params.slug } });
    if (result.kind === "redirect") {
      throw redirect({
        to: "/p/$slug",
        params: { slug: result.canonicalSlug },
        statusCode: 301,
        replace: true,
      });
    }
    if (result.kind === "not_found") {
      throw notFound();
    }
    // Pass the loaded page through to the loader to avoid a second query
    return { page: result.page };
  },
  loader: ({ context }) => {
    return { page: (context as { page: ContentPage }).page };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData?.page) return {};
    const p = loaderData.page;
    const path = `/p/${params.slug}`;
    const title = p.seo_title || `${p.title} | ${SITE_NAME}`;
    const description = (p.seo_description || p.description || p.title).slice(0, 160);

    // Hreflang — emit only when this page is part of an EN↔ES pair.
    // The other-language slug is fetched in the loader so we always have it
    // available here. (Skipped on simple en pages with no Spanish twin.)
    const hreflang = buildHreflangLinks(p);

    const meta = buildMeta({
      title,
      description,
      path,
      image: p.cover_image_url,
      type: isArticleType(p.template_type) ? "article" : "website",
      hreflang,
    });

    const scripts = [];

    // BreadcrumbList JSON-LD — universal
    scripts.push(
      ldJsonScript(
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: p.title, path },
        ]),
      ),
    );

    // Article JSON-LD — for content-style template types
    if (isArticleType(p.template_type)) {
      const article = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: p.title,
        description,
        image: p.cover_image_url ? [p.cover_image_url] : undefined,
        author: { "@type": "Person", name: p.author || SITE_NAME },
        datePublished: p.published_at || undefined,
        dateModified: p.updated_at,
        mainEntityOfPage: `${SITE_URL}${path}`,
        publisher: {
          "@type": "Organization",
          name: SITE_NAME,
          url: SITE_URL,
        },
        inLanguage: p.language,
      };
      scripts.push(ldJsonScript(article));
    }

    return { ...meta, scripts };
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

function isArticleType(t: ContentPage["template_type"]): boolean {
  return (
    t === "resource_article" ||
    t === "academy_article" ||
    t === "event_city_guide" ||
    t === "host_advocacy" ||
    t === "state_advocacy_guide" ||
    t === "spanish_resource"
  );
}

function buildHreflangLinks(_p: ContentPage): Array<{ lang: string; href: string }> | undefined {
  // Wired in once the EN↔ES sibling lookup is available in the loader. For now
  // emit nothing rather than half-correct hreflang. Spanish content_pages will
  // populate hreflang_alt -> sibling slug in their seed data.
  return undefined;
}

function ContentPageDispatcher() {
  const { page } = Route.useLoaderData();

  switch (page.template_type) {
    case "resource_article":
      return <ResourceArticleTemplate page={page} />;
    // Specialized templates land here as they ship:
    //   case "host_acquisition_city":   return <HostAcquisitionCityTemplate page={page} />;
    //   case "event_city_guide":        return <EventCityGuideTemplate page={page} />;
    //   case "city_main":               return <CityMainTemplate page={page} />;
    //   case "spanish_host_acquisition": return <SpanishHostAcquisitionTemplate page={page} />;
    //   case "host_advocacy":           return <HostAdvocacyTemplate page={page} />;
    //   case "academy_article":         return <AcademyArticleTemplate page={page} />;
    //   case "money_page":              return <MoneyPageTemplate page={page} />;
    default:
      return <GenericPageTemplate page={page} />;
  }
}
