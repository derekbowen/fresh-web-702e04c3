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
} from "@/lib/seo";
import { GenericPageTemplate } from "@/components/templates/generic-page";

/**
 * Spanish pSEO pages live at /p/es/{slug}. The DB row stores the composite
 * slug as "es/{slug}" so it sorts/queries cleanly alongside English content.
 */
export const Route = createFileRoute("/p/es/$slug")({
  beforeLoad: async ({ params }) => {
    const compositeSlug = `es/${params.slug}`;
    const result = await lookupContentPage({ data: { slug: compositeSlug } });
    if (result.kind === "redirect") {
      const stripped = result.canonicalSlug.startsWith("es/")
        ? result.canonicalSlug.slice(3)
        : result.canonicalSlug;
      throw redirect({
        to: "/p/es/$slug",
        params: { slug: stripped },
        statusCode: 301,
        replace: true,
      });
    }
    if (result.kind === "not_found") {
      void log404({
        data: { urlPath: `/p/es/${params.slug}`, slug: compositeSlug },
      });
      throw notFound();
    }
    return { page: result.page };
  },
  loader: async ({ context }) => {
    const page = (context as { page: ContentPage }).page;
    let linkTargets: LinkTarget[] = [];
    try {
      linkTargets = await getInternalLinkTargets({
        data: { citySlug: null, nearbyCitySlugs: [] },
      });
    } catch {
      linkTargets = [];
    }
    return { page, linkTargets };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData?.page) return {};
    const p = loaderData.page;
    const path = `/p/es/${params.slug}`;
    const canonicalPath = p.url_path || path;
    const titleBase = p.title || p.seo_title || params.slug;
    const title = p.seo_title || `${titleBase} | ${SITE_NAME}`;
    const description = (p.seo_description || p.description || titleBase || "").slice(0, 160);

    // EN ↔ ES hreflang pairing for the Texas launch.
    const enTwin = ES_TO_EN_SLUG[params.slug];
    const hreflang = enTwin
      ? [
          { lang: "es", href: `${SITE_URL}${path}` },
          { lang: "en", href: `${SITE_URL}/p/${enTwin}` },
          { lang: "x-default", href: `${SITE_URL}/p/${enTwin}` },
        ]
      : undefined;

    const meta = buildMeta({
      title,
      description,
      path,
      canonicalPath,
      image: p.cover_image_url || p.hero_image_url || undefined,
      type: "article",
      hreflang,
    });

    const scripts = [
      ldJsonScript(
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: titleBase || path, path },
        ]),
      ),
      ldJsonScript({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: p.title,
        description,
        image: p.cover_image_url ? [p.cover_image_url] : undefined,
        author: { "@type": "Person", name: SITE_NAME },
        dateModified: p.updated_at,
        mainEntityOfPage: `${SITE_URL}${path}`,
        publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
        inLanguage: "es",
      }),
    ];

    return {
      ...meta,
      htmlAttrs: { lang: "es" },
      scripts,
    };
  },
  component: SpanishContentPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Algo salió mal</h1>
          <p className="mt-2 text-muted-foreground">{error.message}</p>
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Reintentar
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
        <h1 className="text-3xl font-bold">Página no encontrada</h1>
        <p className="mt-2 text-muted-foreground">
          La página que buscas no existe o fue movida.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Inicio
        </Link>
      </main>
      <SiteFooter />
    </div>
  ),
});

function SpanishContentPage() {
  const { page, linkTargets } = Route.useLoaderData();
  return <GenericPageTemplate page={page} linkTargets={linkTargets} />;
}
