import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { BreadcrumbsWithSchema } from "@/components/breadcrumbs-jsonld";
import { FaqBlock } from "@/components/faq-block";
import { AutoLinkedContent, type LinkTarget } from "@/components/auto-linked-content";
import { RelatedPages } from "@/components/related-pages";
import { faqsForContentPage } from "@/lib/page-faqs";
import type { ContentPage } from "@/server/content-pages.functions";

export function SwimInstructorHubTemplate({ page, linkTargets = [] }: { page: ContentPage; linkTargets?: LinkTarget[] }) {
  const body = page.body_markdown || page.content || "";
  const faqs = faqsForContentPage(page);
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-border bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <BreadcrumbsWithSchema items={[{ name: "Home", path: "/" }, { name: "Swim instructor pool rentals", path: page.url_path }]} />
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">{page.title}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{page.seo_description}</p>
          </div>
        </section>
        <section className="border-b border-border py-12">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <AutoLinkedContent text={body} targets={linkTargets} className="prose prose-lg max-w-none whitespace-pre-line text-foreground" />
          </div>
        </section>
        <section className="py-12">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <FaqBlock faqs={faqs} />
            <RelatedPages />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
