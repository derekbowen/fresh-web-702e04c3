import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { AuthorByline } from "@/components/author-byline";
import { type LinkTarget } from "@/components/auto-linked-content";
import { RelatedPages } from "@/components/related-pages";
import { BreadcrumbsWithSchema } from "@/components/breadcrumbs-jsonld";
import { FounderBookingInline } from "@/components/founder-booking";
import type { ContentPage } from "@/server/content-pages.functions";

/**
 * Fallback template used when a content_page row has a template_type that
 * doesn't yet have a dedicated template. Renders bare title + content.
 */
export function GenericPageTemplate({
  page,
  linkTargets = [],
}: {
  page: ContentPage | null | undefined;
  linkTargets?: LinkTarget[];
}) {
  if (!page) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground">Page not found</h1>
          <p className="mt-4 text-muted-foreground">
            The page you're looking for isn't available. Try the homepage or search for a pool near you.
          </p>
        </main>
        <SiteFooter />
      </div>
    );
  }
  const title = page.title || page.seo_title || page.slug || "";
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <BreadcrumbsWithSchema
          items={[
            { name: "Home", path: "/" },
            { name: title, path: page.url_path },
          ]}
        />
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {title}
        </h1>
        <AuthorByline date={page.published_at ?? page.updated_at} />
        {page.description && (
          <p className="mt-4 text-lg text-muted-foreground">{page.description}</p>
        )}
        {(page.cover_image_url || page.hero_image_url) && (
          <div className="relative mt-8 aspect-video overflow-hidden rounded-2xl">
            <img
              src={(page.cover_image_url || page.hero_image_url) as string}
              alt={((page as any).hero_image_alt as string) || page.title || ""}
              className="h-full w-full object-cover"
              loading="eager"
              fetchPriority="high"
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(2,6,23,0.72) 0%, rgba(2,6,23,0.45) 35%, rgba(2,6,23,0) 70%)" }}
            />
            <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-3 p-4 sm:p-6">
              <a
                href="/s"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-bold text-[#0B4A6F] shadow-lg"
              >
                Find a pool near you
              </a>
              <a
                href="/l/draft/00000000-0000-0000-0000-000000000000/new/details"
                aria-label="List your pool — keep 100%, zero host fees"
                className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-white/90 px-6 text-sm font-semibold text-white"
              >
                Have a pool? Keep 100% &mdash; zero host fees&nbsp;&rarr;
              </a>
            </div>
          </div>
        )}
        {(page.content || page.body_markdown) && (
          <div
            className="prose prose-lg mt-8 max-w-none text-foreground
              prose-headings:font-semibold prose-headings:tracking-tight
              prose-h1:text-3xl prose-h1:mt-10
              prose-h2:mt-12 prose-h2:text-2xl prose-h2:border-b prose-h2:border-border prose-h2:pb-2
              prose-h3:mt-8 prose-h3:text-xl
              prose-p:leading-relaxed
              prose-a:text-primary hover:prose-a:underline
              prose-strong:text-foreground
              prose-ul:my-4 prose-li:my-1
              prose-blockquote:border-l-4 prose-blockquote:border-border prose-blockquote:pl-4 prose-blockquote:italic
              dark:prose-invert"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {(page.content || page.body_markdown) as string}
            </ReactMarkdown>
          </div>
        )}
        <RelatedPages />
      </main>
      {(page.template_type === "spanish_host_acq" ||
        (page.template_type as string | null) === "host_acq_city_es") && (
        <FounderBookingInline lang="es" />
      )}
      <SiteFooter />
    </div>
  );
}
