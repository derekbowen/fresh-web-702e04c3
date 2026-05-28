import { Link } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { AuthorByline } from "@/components/author-byline";
import { BreadcrumbsWithSchema } from "@/components/breadcrumbs-jsonld";
import { HeroImage } from "@/components/hero-image";
import { RelatedPages } from "@/components/related-pages";
import { FaqBlock } from "@/components/faq-block";
import { FounderBookingInline } from "@/components/founder-booking";
import { faqsForContentPage } from "@/lib/page-faqs";
import type { LinkTarget } from "@/components/auto-linked-content";
import type { ContentPage } from "@/server/content-pages.functions";
import type { RelatedPostMeta } from "@/server/blog-enrichment.functions";
import { TldrCard } from "@/components/blog/tldr-card";
import {
  RelatedPostsCard,
  InlineRelatedCallout,
} from "@/components/blog/related-posts-card";

function topicLabel(topic: string | null | undefined): string | null {
  if (!topic) return null;
  return topic
    .replace(/[-_]+/g, " ")
    .trim()
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

/** Split markdown roughly in half on a paragraph boundary near 50%. */
function splitMarkdownInHalf(body: string): [string, string] | null {
  if (!body) return null;
  const paras = body.split(/\n\n+/);
  if (paras.length < 6) return null;
  const mid = Math.floor(paras.length / 2);
  return [paras.slice(0, mid).join("\n\n"), paras.slice(mid).join("\n\n")];
}

/**
 * Generic article template — also serves blog posts (synthesized as
 * template_type=resource via lookupContentPage). Renders TL;DR card,
 * topic-aware breadcrumbs, an inline 'keep reading' callout mid-article,
 * and a related-posts grid at the bottom.
 */
export function ResourceArticleTemplate({
  page,
  linkTargets: _linkTargets = [],
  relatedPosts = [],
}: {
  page: ContentPage;
  linkTargets?: LinkTarget[];
  relatedPosts?: RelatedPostMeta[];
}) {
  const publishedAt = page.published_at ?? null;
  const body = (page.content || page.body_markdown || "").toString();
  const faqs = faqsForContentPage(page);
  const tldr =
    Array.isArray((page as { tldr_bullets?: string[] | null }).tldr_bullets)
      ? ((page as { tldr_bullets?: string[] | null }).tldr_bullets as string[])
      : [];
  const topic = (page as { topic?: string | null }).topic ?? null;
  const topicName = topicLabel(topic);
  const isBlogPost = page.category === "blog" || !!topic;

  const breadcrumbItems: Array<{ name: string; path: string }> = [
    { name: "Home", path: "/" },
  ];
  if (isBlogPost) {
    breadcrumbItems.push({ name: "Blog", path: "/p/blog" });
    if (topicName && topic) {
      breadcrumbItems.push({
        name: topicName,
        path: `/p/blog?topic=${encodeURIComponent(topic)}`,
      });
    }
  }
  breadcrumbItems.push({
    name: page.title || page.slug || "",
    path: page.url_path,
  });

  const halves = splitMarkdownInHalf(body);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <BreadcrumbsWithSchema items={breadcrumbItems} />
        <article className="mt-6">
          {topicName ? (
            <Link
              to="/p/blog"
              search={{ topic: topic ?? undefined } as never}
              className="text-xs font-semibold uppercase tracking-wider text-primary hover:underline"
            >
              {topicName}
            </Link>
          ) : null}
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {page.title || page.seo_title || page.slug}
          </h1>
          <AuthorByline date={publishedAt} />

          {(page.cover_image_url || page.hero_image_url) && (
            <div className="mt-8 aspect-video overflow-hidden rounded-2xl">
              <HeroImage
                src={(page.cover_image_url || page.hero_image_url) as string}
                alt={page.title || ""}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          {tldr.length > 0 ? <TldrCard bullets={tldr} /> : null}
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
              {halves && relatedPosts.length > 0 ? (
                <>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{halves[0]}</ReactMarkdown>
                  <InlineRelatedCallout posts={relatedPosts} />
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{halves[1]}</ReactMarkdown>
                </>
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
              )}
            </div>
          )}
          <FaqBlock faqs={faqs} />
        </article>
        {relatedPosts.length > 0 ? (
          <RelatedPostsCard posts={relatedPosts} />
        ) : (
          <RelatedPages />
        )}
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
