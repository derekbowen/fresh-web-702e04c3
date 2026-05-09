import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { BreadcrumbsWithSchema } from "@/components/breadcrumbs-jsonld";
import type { ContentPage } from "@/server/content-pages.functions";
import {
  ADVOCACY_HUB_PATH,
  ADVOCACY_STATES,
  findAdvocacyState,
  relatedAdvocacyStates,
  type AdvocacyState,
} from "@/lib/advocacy-states";

const PROSE_CLASS = `prose prose-lg mt-8 max-w-none text-foreground
  prose-headings:font-semibold prose-headings:tracking-tight
  prose-h1:text-3xl prose-h1:mt-10
  prose-h2:mt-12 prose-h2:text-2xl prose-h2:border-b prose-h2:border-border prose-h2:pb-2
  prose-h3:mt-8 prose-h3:text-xl
  prose-p:leading-relaxed
  prose-a:text-primary hover:prose-a:underline
  prose-strong:text-foreground
  prose-ul:my-4 prose-li:my-1
  prose-blockquote:border-l-4 prose-blockquote:border-border prose-blockquote:pl-4 prose-blockquote:italic
  dark:prose-invert`;

function BookingCTAs({ stateName }: { stateName?: string | null }) {
  const findHref = stateName
    ? `/s?address=${encodeURIComponent(stateName)}`
    : "/s";
  return (
    <section
      aria-label="Get started"
      className="mt-12 grid gap-4 rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:grid-cols-2 sm:p-8"
    >
      <div>
        <h3 className="text-xl font-bold text-foreground">
          Ready to host {stateName ? `in ${stateName}` : "your pool"}?
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Free to list. $2M liability insurance on every confirmed booking. 10% flat host fee.
        </p>
        <a
          href="/l/draft/00000000-0000-0000-0000-000000000000/new/details"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105"
        >
          List your pool →
        </a>
      </div>
      <div>
        <h3 className="text-xl font-bold text-foreground">
          Looking for a pool {stateName ? `in ${stateName}` : "instead"}?
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Browse verified hosts and book by the hour with insurance included.
        </p>
        <a
          href={findHref}
          className="mt-4 inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
        >
          Find pools{stateName ? ` in ${stateName}` : ""} →
        </a>
      </div>
    </section>
  );
}

function StateGrid({
  states,
  currentSlug,
}: {
  states: AdvocacyState[];
  currentSlug?: string | null;
}) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {states.map((s) => {
        const isCurrent = s.slug === currentSlug;
        return (
          <li key={s.slug}>
            {isCurrent ? (
              <span className="block py-1 text-sm font-semibold text-foreground">
                {s.name}
              </span>
            ) : (
              <a
                href={`/p/${s.slug}`}
                className="block py-1 text-sm text-muted-foreground transition-colors hover:text-primary hover:underline"
              >
                {s.name}
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function AdvocacyTemplate({ page }: { page: ContentPage }) {
  const isHub = page.template_type === "host_advocacy_hub";
  const state = isHub ? null : findAdvocacyState(page.slug);
  const title = page.title || page.seo_title || page.slug || "";
  const body = (page.content || page.body_markdown || "") as string;

  const breadcrumbs = isHub
    ? [
        { name: "Home", path: "/" },
        { name: "Host advocacy", path: page.url_path || ADVOCACY_HUB_PATH },
      ]
    : [
        { name: "Home", path: "/" },
        { name: "Host advocacy", path: ADVOCACY_HUB_PATH },
        { name: state?.name || title, path: page.url_path || `/p/${page.slug}` },
      ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <BreadcrumbsWithSchema items={breadcrumbs} />

        <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {title}
        </h1>
        {page.description && (
          <p className="mt-4 text-lg text-muted-foreground">{page.description}</p>
        )}

        {!isHub && (
          <p className="mt-4 text-sm">
            <a href={ADVOCACY_HUB_PATH} className="text-primary hover:underline">
              ← Back to all 50 state host guides
            </a>
          </p>
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

        {body && (
          <div className={PROSE_CLASS}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
          </div>
        )}

        <BookingCTAs stateName={state?.name ?? null} />

        {!isHub && state && (
          <section aria-label="Nearby state guides" className="mt-12">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Nearby state guides
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Hosting rules vary by state. Compare what's allowed in neighboring states.
            </p>
            <div className="mt-6">
              <StateGrid states={relatedAdvocacyStates(state, 8)} currentSlug={page.slug} />
            </div>
            <p className="mt-6 text-sm">
              <a href={ADVOCACY_HUB_PATH} className="text-primary hover:underline">
                View all 50 state host guides →
              </a>
            </p>
          </section>
        )}

        <section aria-label="All state host guides" className="mt-12 rounded-3xl border border-border bg-card p-6 sm:p-8">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {isHub ? "Browse every state guide" : "All 50 state host guides"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick your state to see local laws, permits, HOA tips, and what to do when neighbors have questions.
          </p>
          <div className="mt-6">
            <StateGrid states={ADVOCACY_STATES} currentSlug={page.slug} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
