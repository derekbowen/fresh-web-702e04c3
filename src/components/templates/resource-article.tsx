import { Link } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { BreadcrumbsWithSchema } from "@/components/breadcrumbs-jsonld";
import { RelatedPages } from "@/components/related-pages";
import { FaqBlock } from "@/components/faq-block";
import { faqsForContentPage } from "@/lib/page-faqs";
import type { LinkTarget } from "@/components/auto-linked-content";
import type { ContentPage } from "@/server/content-pages.functions";

/**
 * Generic article template — used for /p/{slug} pages with
 * template_type='resource_article'. Renders title, cover image, optional
 * excerpt, and the full markdown body.
 */
export function ResourceArticleTemplate({
  page,
  linkTargets: _linkTargets = [],
}: {
  page: ContentPage;
  linkTargets?: LinkTarget[];
}) {
  const publishedAt = page.published_at ?? null;
  const body = (page.content || page.body_markdown || "").toString();
  const faqs = faqsForContentPage(page);
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <BreadcrumbsWithSchema
          items={[
            { name: "Home", path: "/" },
            { name: page.title || page.slug || "", path: page.url_path },
          ]}
        />
        <article className="mt-6">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {page.title || page.seo_title || page.slug}
          </h1>
          <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
            {page.author && <span>By {page.author}</span>}
            {publishedAt && (
              <time dateTime={publishedAt}>
                {new Date(publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            )}
          </div>
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
          {page.description && (
            <p className="mt-8 text-lg text-muted-foreground">{page.description}</p>
          )}
          {body && (
            <div
              className="prose prose-lg mt-8 max-w-none text-foreground
                prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground
                prose-h2:mt-12 prose-h2:text-2xl prose-h2:border-b prose-h2:border-border prose-h2:pb-2
                prose-h3:mt-8 prose-h3:text-xl
                prose-p:leading-relaxed
                prose-a:text-primary hover:prose-a:underline
                prose-strong:text-foreground
                prose-ul:my-4 prose-li:my-1
                dark:prose-invert"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
            </div>
          )}
          <FaqBlock faqs={faqs} />
        </article>
        <RelatedPages />
        <div className="mt-12 border-t border-border pt-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            ← Back home
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
