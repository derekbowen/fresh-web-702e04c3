import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { Breadcrumbs } from "@/components/listing-card";
import { AutoLinkedContent } from "@/components/auto-linked-content";
import type { ContentPage } from "@/server/content-pages.functions";

/**
 * Template for /p/{slug} pages where template_type = "event_guide".
 * ~566 city + event-type guides (e.g. "guide to family reunion pool rental
 * dearborn mi"). High commercial intent — the visitor is planning a specific
 * event in a specific city. Goal: convert to a Swimply pool search for that
 * city/event combo.
 */
export function EventGuideTemplate({ page }: { page: ContentPage }) {
  const title = page.title || page.seo_title || "Event pool rental guide";
  const description = page.seo_description || page.description || null;
  const body = page.body_markdown || page.content || null;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Event guides", path: "/p/event-guides" },
            { name: title, path: page.url_path },
          ]}
        />
        <article className="mt-6">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="mt-4 text-lg text-muted-foreground">{description}</p>
          )}
          {page.hero_image_url && (
            <div className="mt-8 aspect-video overflow-hidden rounded-2xl">
              <img
                src={page.hero_image_url}
                alt={title}
                className="h-full w-full object-cover"
                loading="eager"
                fetchPriority="high"
              />
            </div>
          )}

          <div className="mt-8 rounded-2xl border border-border bg-muted/30 p-6">
            <h2 className="text-xl font-semibold text-foreground">
              Book a private pool for your event
            </h2>
            <p className="mt-2 text-muted-foreground">
              Browse local backyard pools by the hour. Filter by group size,
              amenities (BBQ, hot tub, restrooms), and pet-friendliness — then
              book instantly.
            </p>
            <a
              href="/s"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              Find a pool near you
            </a>
          </div>

          {body ? (
            <AutoLinkedContent
              text={body}
              targets={[]}
              className="prose prose-lg mt-10 max-w-none whitespace-pre-line text-foreground"
            />
          ) : (
            <p className="mt-10 text-sm text-muted-foreground">
              Detailed local guide coming soon.
            </p>
          )}
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
