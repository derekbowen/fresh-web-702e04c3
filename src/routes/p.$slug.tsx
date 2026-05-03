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
import {
  getNearbyCitiesForPage,
  type NearbyCity,
} from "@/server/nearby-cities.functions";
import { log404 } from "@/server/content-404-log.functions";
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
import { HostAcqCityTemplate } from "@/components/templates/host-acq-city";
import { PublicPoolTemplate } from "@/components/templates/public-pool";
import { EventGuideTemplate } from "@/components/templates/event-guide";
import { faqsForContentPage, faqPageJsonLd } from "@/lib/page-faqs";
import { localBusinessForContentPage } from "@/lib/page-localbusiness";

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
    if (
      page.template_type === "host_acq_city" ||
      page.template_type === "public_pool_city" ||
      page.template_type === "spanish_host_acq"
    ) {
      try {
        nearbyCities = await getNearbyCitiesForPage({
          data: { templateType: page.template_type, slug: page.slug, limit: 6 },
        });
      } catch {
        nearbyCities = [];
      }
    }
    return { page, nearbyCities };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData?.page) return {};
    const p = loaderData.page;
    const path = `/p/${params.slug}`;
    const titleBase = p.title || p.seo_title || params.slug;
    const title = p.seo_title || `${titleBase} | ${SITE_NAME}`;
    const description = (p.seo_description || p.description || titleBase || "").slice(0, 160);

    // Hreflang — emit only when this page is part of an EN↔ES pair.
    // The other-language slug is fetched in the loader so we always have it
    // available here. (Skipped on simple en pages with no Spanish twin.)
    const hreflang = buildHreflangLinks(p);

    const meta = buildMeta({
      title,
      description,
      path,
      image: p.cover_image_url || p.hero_image_url || undefined,
      type: isArticleType(p.template_type) ? "article" : "website",
      hreflang,
    });

    const scripts = [];

    // BreadcrumbList JSON-LD — universal
    scripts.push(
      ldJsonScript(
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: titleBase || path, path },
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
    t === "resource" ||
    t === "elearning" ||
    t === "event_guide" ||
    t === "host_advocacy_hub" ||
    t === "host_advocacy_state" ||
    t === "spanish_resource"
  );
}

function buildHreflangLinks(_p: ContentPage): Array<{ lang: string; href: string }> | undefined {
  return undefined;
}

function ContentPageDispatcher() {
  const { page, nearbyCities } = Route.useLoaderData();

  switch (page.template_type) {
    case "host_acq_city":
      return <HostAcqCityTemplate page={page} nearbyCities={nearbyCities} />;
    case "public_pool":
      return <PublicPoolTemplate page={page} />;
    case "public_pool_city":
      return <PublicPoolTemplate page={page} nearbyCities={nearbyCities} />;
    case "event_guide":
      return <EventGuideTemplate page={page} />;
    case "resource":
      return <ResourceArticleTemplate page={page} />;
    default:
      return <GenericPageTemplate page={page} />;
  }
}
