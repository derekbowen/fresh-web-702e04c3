import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { AuthorByline } from "@/components/author-byline";
import { type LinkTarget } from "@/components/auto-linked-content";
import { RelatedPages } from "@/components/related-pages";
import { BreadcrumbsWithSchema } from "@/components/breadcrumbs-jsonld";
import type { ContentPage } from "@/server/content-pages.functions";

/**
 * Fallback template used when a content_page row has a template_type that
 * doesn't yet have a dedicated template. Renders bare title + content.
 */
export function GenericPageTemplate({
  page,
  linkTargets = [],
}: {
  page: ContentPage;
  linkTargets?: LinkTarget[];
}) {
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
          <div className="mt-8 aspect-video overflow-hidden rounded-2xl">
            <img
              src={(page.cover_image_url || page.hero_image_url) as string}
              alt={page.title || ""}
              className="h-full w-full object-cover"
              loading="eager"
              fetchPriority="high"
            />
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
      <SiteFooter />
    </div>
  );
}
