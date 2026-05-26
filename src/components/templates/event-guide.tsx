import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { AuthorByline } from "@/components/author-byline";
import { BreadcrumbsWithSchema } from "@/components/breadcrumbs-jsonld";
import { HeroImage } from "@/components/hero-image";
import { AutoLinkedContent, type LinkTarget } from "@/components/auto-linked-content";
import { RelatedPages } from "@/components/related-pages";
import { NearbyCities } from "@/components/nearby-cities";
import { FaqBlock } from "@/components/faq-block";
import { faqsForContentPage } from "@/lib/page-faqs";
import type { ContentPage } from "@/server/content-pages.functions";
import type { NearbyCity } from "@/server/nearby-cities.functions";

/**
 * Template for /p/{slug} pages where template_type = "event_guide".
 */
export function EventGuideTemplate({
  page,
  linkTargets = [],
  nearbyCities = [],
}: {
  page: ContentPage;
  linkTargets?: LinkTarget[];
  nearbyCities?: NearbyCity[];
}) {
  const title = page.title || page.seo_title || "Event pool rental guide";
  const description = page.seo_description || page.description || null;
  const body = page.body_markdown || page.content || null;
  const faqs = faqsForContentPage(page);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <BreadcrumbsWithSchema
          items={[
            { name: "Home", path: "/" },
            { name: "Event guides", path: "/p/learningacademy" },
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
              <HeroImage
                src={page.hero_image_url}
                alt={title}
                className="h-full w-full object-cover"
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
              href="/s" target="_blank" rel="noopener noreferrer"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              Find a pool near you
            </a>
          </div>

          {body ? (
            <AutoLinkedContent
              text={body}
              targets={linkTargets}
              className="prose prose-lg mt-10 max-w-none whitespace-pre-line text-foreground"
            />
          ) : (
            <p className="mt-10 text-sm text-muted-foreground">
              Detailed local guide coming soon.
            </p>
          )}

          {nearbyCities.length > 0 && (
            <NearbyCities
              cities={nearbyCities}
              slugPrefix=""
              heading="Pool rentals in nearby cities"
            />
          )}

          <FaqBlock faqs={faqs} />

          <RelatedPages />
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
