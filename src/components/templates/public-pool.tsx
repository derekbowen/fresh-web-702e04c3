import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { Breadcrumbs } from "@/components/listing-card";
import { AutoLinkedContent } from "@/components/auto-linked-content";
import type { ContentPage } from "@/server/content-pages.functions";

/**
 * Template for /p/{slug} pages where template_type = "public_pool".
 * ~895 individual public-pool listings sourced from the legacy
 * /public-pools/{state}/{city}/{pool-slug} URLs. Each page introduces a single
 * municipal/community pool and points visitors toward private Swimply rentals
 * nearby when the public pool is closed, crowded, or not a fit.
 */
export function PublicPoolTemplate({ page }: { page: ContentPage }) {
  const title = page.title || page.seo_title || "Public pool";
  const description = page.seo_description || page.description || null;
  const body = page.body_markdown || page.content || null;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Public pools", path: "/p/public-pools" },
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

          {body && (
            <AutoLinkedContent
              text={body}
              targets={[]}
              className="prose prose-lg mt-10 max-w-none whitespace-pre-line text-foreground"
            />
          )}

          <aside className="mt-12 rounded-2xl border border-border bg-muted/30 p-6">
            <h2 className="text-xl font-semibold text-foreground">
              Public pool closed or crowded? Try a private pool nearby.
            </h2>
            <p className="mt-2 text-muted-foreground">
              Book a private backyard pool by the hour on Swimply. No crowds,
              no lap lanes, no schedule restrictions — just your group.
            </p>
            <a
              href="/s"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              Find a private pool
            </a>
          </aside>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
