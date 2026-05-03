// no-op import removed
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { Breadcrumbs } from "@/components/listing-card";
import { AutoLinkedContent } from "@/components/auto-linked-content";
import type { ContentPage } from "@/server/content-pages.functions";

/**
 * Template for /p/become-a-pool-host-{city}-{state} pages
 * (template_type = "host_acq_city"). ~1,267 pSEO pages targeting prospective
 * pool hosts in specific U.S. cities. Renders title, hero, optional scraped
 * markdown body, plus a strong "Apply to host" CTA.
 */
export function HostAcqCityTemplate({ page }: { page: ContentPage }) {
  const title = page.title || page.seo_title || "Become a pool host";
  const description = page.seo_description || page.description || null;
  const body = page.body_markdown || page.content || null;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Become a host", path: "/p/become-a-pool-host" },
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
              Earn $5,000–$15,000+ per month renting out your pool
            </h2>
            <p className="mt-2 text-muted-foreground">
              Join thousands of homeowners turning their backyard pool into a
              steady income stream. Free to list, no upfront cost, you set
              your own price.
            </p>
            <a
              href="/auth"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              Apply to host →
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
