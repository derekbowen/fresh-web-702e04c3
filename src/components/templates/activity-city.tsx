import { Link } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { AuthorByline } from "@/components/author-byline";
import { BreadcrumbsWithSchema } from "@/components/breadcrumbs-jsonld";
import { FaqBlock } from "@/components/faq-block";
import { AutoLinkedContent, type LinkTarget } from "@/components/auto-linked-content";
import { RelatedPages } from "@/components/related-pages";
import { faqsForContentPage } from "@/lib/page-faqs";
import { parseCitySlug } from "@/lib/city-slug";
import { parseActivityCitySlug } from "@/lib/activity-city";
import type { ContentPage } from "@/server/content-pages.functions";
import type { NearbyCity } from "@/server/nearby-cities.functions";

/**
 * Activity-modifier city pages: /p/{activity-prefix}{city-state}
 *
 * Targets long-tail SERPs Swimply currently owns with thin pages
 * (pool party venues, baby shower venues, hot tub rental, dog-friendly
 * pools, birthday venues). Body content is AI-generated markdown; the
 * template wraps it with consistent hero, comparison block, FAQ, and
 * nearby links.
 */
export function ActivityCityTemplate({
  page,
  nearbyCities = [],
  linkTargets = [],
}: {
  page: ContentPage;
  nearbyCities?: NearbyCity[];
  linkTargets?: LinkTarget[];
}) {
  const parsed = parseActivityCitySlug(page.slug);
  const activity = parsed?.activity;
  const citySlug = parsed?.citySlug ?? "";
  const { city, stateCode } = parseCitySlug(citySlug);
  const cityName = city || "your city";
  const where = stateCode ? `${cityName}, ${stateCode}` : cityName;
  const faqs = faqsForContentPage(page);
  const body = page.body_markdown || page.content || page.description || "";

  // Fallback labels if activity is somehow unrecognized (defensive)
  const h1 = activity?.h1(where) ?? `${page.title || "Pool rentals"} in ${where}`;
  const heroSubtitle =
    activity?.heroSubtitle(where) ??
    page.seo_description ??
    `Book a private backyard pool in ${where} by the hour.`;
  const ctaLabel = activity?.ctaLabel(cityName) ?? `Find a ${cityName} pool`;
  const searchHref = `/s?address=${encodeURIComponent(`${cityName}, ${stateCode}`)}`;
  const breadcrumbActivityLabel = activity?.label ?? "Pool rentals";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-border bg-gradient-to-br from-primary/10 via-background to-accent/10 py-12 sm:py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <BreadcrumbsWithSchema
              items={[
                { name: "Home", path: "/" },
                { name: breadcrumbActivityLabel, path: page.url_path },
                { name: where, path: page.url_path },
              ]}
            />
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              {breadcrumbActivityLabel} · {where}
            </div>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
              {h1}
            </h1>
            <AuthorByline date={page.published_at ?? page.updated_at} />
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{heroSubtitle}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={searchHref}
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:opacity-90"
              >
                {ctaLabel}
              </a>
              <a
                href={`/p/${citySlug}`}
                className="inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                See all {cityName} pools →
              </a>
            </div>
          </div>
        </section>

        <section className="border-b border-border py-12">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <AutoLinkedContent
              text=""
              targets={linkTargets}
              className="prose prose-neutral max-w-none text-base leading-relaxed text-foreground/90 dark:prose-invert"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
            </AutoLinkedContent>
          </div>
        </section>

        <section className="border-b border-border bg-muted/20 py-12">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground">
              Pool Rental Near Me vs Swimply for {breadcrumbActivityLabel.toLowerCase()}
            </h2>
            <div className="mt-6 overflow-hidden rounded-xl border border-border bg-background">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">What you care about</th>
                    <th className="px-4 py-3 text-left font-semibold text-primary">Pool Rental Near Me</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Swimply</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-4 py-3 font-medium">Host fee</td>
                    <td className="px-4 py-3">10% flat</td>
                    <td className="px-4 py-3 text-muted-foreground">15%+</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Liability insurance</td>
                    <td className="px-4 py-3">$2M, included on every booking</td>
                    <td className="px-4 py-3 text-muted-foreground">$1M self-funded guarantee</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Payout speed</td>
                    <td className="px-4 py-3">Next-day after the booking ends</td>
                    <td className="px-4 py-3 text-muted-foreground">Up to a week</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Booking model</td>
                    <td className="px-4 py-3">Hourly, instant book, no membership</td>
                    <td className="px-4 py-3 text-muted-foreground">Hourly, instant book</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Numbers reflect public information as of 2026. Verify host-specific terms before you book.
            </p>
          </div>
        </section>

        <section className="border-b border-border py-12">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-semibold text-foreground">
              Keep exploring {breadcrumbActivityLabel.toLowerCase()} near {cityName}
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <a
                href={searchHref}
                className="block rounded-lg border border-primary/40 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10"
              >
                🔍 Browse all {cityName} pools →
              </a>
              <Link
                to="/p/$slug"
                params={{ slug: citySlug }}
                className="block rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
              >
                📍 {where} pool rental overview →
              </Link>
            </div>

            {(() => {
              const list = nearbyCities.filter((c) => c.slug && c.slug !== citySlug);
              if (list.length === 0) return null;
              return (
                <>
                  <h3 className="mt-8 text-base font-semibold text-foreground">
                    Same activity, nearby cities
                  </h3>
                  <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                    {list.slice(0, 10).map((c) => {
                      const activitySlug = activity
                        ? `${activity.slugPrefix}${c.slug}`
                        : c.slug;
                      const label =
                        c.state_code && !c.slug.endsWith(`-${c.state_code.toLowerCase()}`)
                          ? `${c.name}, ${c.state_code}`
                          : c.name;
                      return (
                        <li key={c.slug}>
                          <Link
                            to="/p/$slug"
                            params={{ slug: activitySlug }}
                            className="block rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
                            title={`${breadcrumbActivityLabel} in ${label}`}
                          >
                            {label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </>
              );
            })()}
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <FaqBlock faqs={faqs} />
            <RelatedPages />
          </div>
        </section>

        <section className="bg-gradient-to-br from-primary/15 via-background to-accent/15 py-16">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Book a {cityName} pool by the hour.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Real backyard pools, real reviews, $2M liability on every booking. No membership.
            </p>
            <div className="mt-6">
              <a
                href={searchHref}
                className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-lg transition hover:opacity-90"
              >
                {ctaLabel}
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
