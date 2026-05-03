import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { AutoLinkedContent } from "@/components/auto-linked-content";
import type { ContentPage } from "@/server/content-pages.functions";

/**
 * Fallback template used when a content_page row has a template_type that
 * doesn't yet have a dedicated template. Renders bare title + content.
 *
 * As specialized templates ship (host_acquisition_city, event_city_guide, etc.)
 * the dispatcher in routes/p.$slug.tsx will branch to those instead.
 */
export function GenericPageTemplate({ page }: { page: ContentPage }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {page.title || page.seo_title || page.slug}
        </h1>
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
          <AutoLinkedContent
            text={(page.content || page.body_markdown) as string}
            targets={[]}
            className="prose prose-lg mt-8 max-w-none whitespace-pre-line text-foreground"
          />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
