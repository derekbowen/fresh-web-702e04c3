import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useMemo, type ReactNode } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { AuthorByline } from "@/components/author-byline";
import { BreadcrumbsWithSchema } from "@/components/breadcrumbs-jsonld";
import { FaqBlock } from "@/components/faq-block";
import { RelatedPages } from "@/components/related-pages";
import { faqsForContentPage } from "@/lib/page-faqs";
import type { ContentPage } from "@/server/content-pages.functions";

const HUB_PATH = "/p/pool-maintenance";

const HUB_LINKS: Array<{ slug: string; label: string; tier: "tier2" | "tier3" | "tier4" }> = [
  { slug: "water-chemistry-basics", label: "Water chemistry basics", tier: "tier2" },
  { slug: "how-to-shock-a-pool", label: "How to shock a pool", tier: "tier2" },
  { slug: "cloudy-pool-water-fix", label: "Cloudy pool water fix", tier: "tier2" },
  { slug: "green-pool-recovery", label: "Green pool recovery", tier: "tier2" },
  { slug: "weekly-pool-cleaning-schedule", label: "Weekly cleaning schedule", tier: "tier2" },
  { slug: "pool-pump-troubleshooting", label: "Pool pump troubleshooting", tier: "tier3" },
  { slug: "pool-filter-types", label: "Pool filter types", tier: "tier3" },
  { slug: "pool-heater-guide", label: "Pool heater guide", tier: "tier3" },
  { slug: "saltwater-pool-care", label: "Saltwater pool care", tier: "tier3" },
  { slug: "pool-vacuums-cleaners", label: "Pool vacuums and cleaners", tier: "tier3" },
  { slug: "opening-a-pool", label: "Opening a pool", tier: "tier4" },
  { slug: "winterizing-a-pool", label: "Winterizing a pool", tier: "tier4" },
  { slug: "after-heavy-rain", label: "Pool care after heavy rain", tier: "tier4" },
  { slug: "pool-stains-removal", label: "Pool stains removal", tier: "tier4" },
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

/** Extract H2 headings from markdown for the table of contents. */
function extractHeadings(md: string): Array<{ id: string; text: string }> {
  if (!md) return [];
  const out: Array<{ id: string; text: string }> = [];
  const re = /^##\s+(.+?)\s*$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) {
    const text = m[1].replace(/[*_`]/g, "").trim();
    if (text) out.push({ id: slugify(text), text });
  }
  return out;
}

function readingMinutes(md: string): number {
  const words = (md || "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

/**
 * Pool Maintenance template. Handles both the pillar hub (slug =
 * "pool-maintenance") and child guides. Mobile-first, sticky desktop TOC,
 * lazy YouTube embed, FAQ accordion, related cards, PRNM CTA, author box.
 */
export function PoolMaintenanceTemplate({ page }: { page: ContentPage }) {
  const isHub = page.slug === "pool-maintenance";
  const body = (page.content || page.body_markdown || "").toString();
  const headings = useMemo(() => extractHeadings(body), [body]);
  const minutes = useMemo(() => readingMinutes(body), [body]);
  const faqs = faqsForContentPage(page);
  const relatedSlugs = (page as { related_slugs?: string[] | null }).related_slugs ?? [];

  const breadcrumbs: Array<{ name: string; path: string }> = [
    { name: "Home", path: "/" },
    { name: "Pool Maintenance", path: HUB_PATH },
  ];
  if (!isHub) {
    breadcrumbs.push({ name: page.title || page.slug || "", path: page.url_path });
  }

  // Pick siblings: prefer related_slugs from DB, else fallback to first 4 hub
  // links that aren't the current page.
  const siblings = (() => {
    const wanted = relatedSlugs && relatedSlugs.length > 0
      ? relatedSlugs
      : HUB_LINKS.filter((l) => l.slug !== page.slug).slice(0, 3).map((l) => l.slug);
    return wanted
      .map((slug) => HUB_LINKS.find((h) => h.slug === slug))
      .filter((x): x is (typeof HUB_LINKS)[number] => !!x)
      .slice(0, 3);
  })();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <BreadcrumbsWithSchema items={breadcrumbs} />

        <div className="mt-6 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
          {/* Sticky desktop TOC */}
          {!isHub && headings.length > 1 ? (
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  On this page
                </p>
                <nav className="mt-3 space-y-2 border-l border-border pl-4 text-sm">
                  {headings.map((h) => (
                    <a
                      key={h.id}
                      href={`#${h.id}`}
                      className="block text-muted-foreground hover:text-primary"
                    >
                      {h.text}
                    </a>
                  ))}
                  {faqs.length > 0 ? (
                    <a
                      href="#faq"
                      className="block font-medium text-foreground hover:text-primary"
                    >
                      FAQ
                    </a>
                  ) : null}
                </nav>
              </div>
            </aside>
          ) : (
            <div className="hidden lg:block" />
          )}

          <article className="min-w-0">
            {/* Hero */}
            <header>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                {isHub ? "Pillar guide" : "Pool maintenance"}
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                {page.title || page.seo_title || page.slug}
              </h1>
              <AuthorByline date={page.published_at ?? page.updated_at} />
              {page.description ? (
                <p className="mt-4 max-w-3xl text-lg text-muted-foreground">
                  {page.description}
                </p>
              ) : null}
              <p className="mt-4 text-sm text-muted-foreground">
                {minutes} min read
                {page.updated_at ? (
                  <>
                    {" · Updated "}
                    <time dateTime={page.updated_at}>
                      {new Date(page.updated_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </>
                ) : null}
              </p>
            </header>

            {/* 60-second quick answer */}
            {page.seo_description && !isHub ? (
              <aside
                aria-label="Quick answer"
                className="mt-8 rounded-2xl border border-primary/30 bg-primary/5 p-5 sm:p-6"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  60-second answer
                </p>
                <p className="mt-2 text-base leading-relaxed text-foreground">
                  {page.seo_description}
                </p>
                {headings.length > 0 ? (
                  <p className="mt-4 text-sm">
                    <span className="font-semibold">In a hurry?</span>{" "}
                    {headings.slice(0, 3).map((h, i) => (
                      <span key={h.id}>
                        {i > 0 ? " · " : ""}
                        <a className="text-primary hover:underline" href={`#${h.id}`}>
                          {h.text}
                        </a>
                      </span>
                    ))}
                    {faqs.length > 0 ? (
                      <>
                        {" · "}
                        <a className="text-primary hover:underline" href="#faq">
                          FAQ
                        </a>
                      </>
                    ) : null}
                  </p>
                ) : null}
              </aside>
            ) : null}

            {/* Optional YouTube embed — renders only when youtube_video_id is a
                valid 11-char ID. Dead/blank IDs render nothing. */}
            {(() => {
              const vid = (page as { youtube_video_id?: string | null }).youtube_video_id;
              if (!vid || !/^[A-Za-z0-9_-]{11}$/.test(vid)) return null;
              return (
                <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="aspect-video">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${vid}`}
                      title={page.title || "Pool maintenance video"}
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="h-full w-full"
                    />
                  </div>
                  <p className="px-4 py-3 text-xs text-muted-foreground">
                    Video embedded from YouTube. We do not own this video; it is provided as supplementary reference.
                  </p>
                </div>
              );
            })()}


            {isHub ? (
              <section className="mt-10 space-y-8">
                <PillarSection
                  title="Water chemistry & quick fixes"
                  blurb="The high-volume problems every pool owner Googles first."
                  tier="tier2"
                />
                <PillarSection
                  title="Equipment guides"
                  blurb="Pumps, filters, heaters, salt cells, and cleaners — what to buy and how to keep them running."
                  tier="tier3"
                />
                <PillarSection
                  title="Seasonal & event-driven care"
                  blurb="Opening, closing, and the unplanned moments (storms, stains) in between."
                  tier="tier4"
                />
              </section>
            ) : null}

            {/* Body markdown — split after first major H2 section to inject mid-content CTA */}
            {body ? (
              <BodyWithMidCta body={body} injectCta={!isHub} />
            ) : null}

            {/* FAQ */}
            {faqs.length > 0 ? (
              <div id="faq">
                <FaqBlock faqs={faqs} />
              </div>
            ) : null}

            {/* Related */}
            {!isHub && siblings.length > 0 ? (
              <section className="mt-14 border-t border-border pt-8">
                <h2 className="text-2xl font-semibold">Related guides</h2>
                <ul className="mt-6 grid gap-4 sm:grid-cols-3">
                  {siblings.map((s) => (
                    <li
                      key={s.slug}
                      className="rounded-xl border border-border bg-card p-5 transition hover:border-primary"
                    >
                      <a
                        href={`/p/${s.slug}`}
                       
                        className="block"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                          {s.tier === "tier2"
                            ? "Water & cleaning"
                            : s.tier === "tier3"
                              ? "Equipment"
                              : "Seasonal"}
                        </p>
                        <p className="mt-2 text-base font-semibold text-foreground">
                          {s.label}
                        </p>
                        <p className="mt-3 text-sm text-primary">Read the guide →</p>
                      </a>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 text-sm">
                  <a href="/p/pool-maintenance" className="text-primary hover:underline">
                    ← Back to the full Pool Maintenance Guide
                  </a>
                </div>
              </section>
            ) : null}

            {/* PRNM CTA */}
            <PrnmCta />

            {/* Cross-funnel related pages — keep readers on-site after the article ends */}
            <RelatedPages
              heading={isHub ? "Turn your maintenance know-how into income" : "Related on Pool Rental Near Me"}
              items={[
                { to: "/p/hosting", label: "Become a pool host", description: "Earn $3K–$10K/month renting your pool by the hour" },
                { to: "/p/earnings-calculator", label: "Pool host earnings calculator", description: "See what your pool could make this month" },
                { to: "/p/free-host-tools", label: "Free host tools", description: "Calculators, checklists, and templates" },
                { to: "/p/all-locations", label: "Browse all pool rental cities", description: "5,000+ city pages across the US" },
                { to: "/p/how-it-works", label: "How pool rental works", description: "Booking, payouts, and insurance, end to end" },
                ...(isHub
                  ? []
                  : [{ to: "/p/pool-maintenance", label: "Back to the Pool Maintenance Guide", description: "Pillar guide and every chapter in one place" }]),
              ]}
            />

            {/* Author box */}
            <section className="mt-10 rounded-2xl border border-border bg-muted/30 p-6">
              <p className="text-sm font-semibold text-foreground">Written by the PRNM team</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Pool Rental Near Me is the peer-to-peer pool rental marketplace America loves —
                connecting pool owners with guests for hourly rentals across the US. Our editorial
                team works with hosts and licensed pool pros to keep these guides current.
              </p>
            </section>
          </article>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function PillarSection({
  title,
  blurb,
  tier,
}: {
  title: string;
  blurb: string;
  tier: "tier2" | "tier3" | "tier4";
}) {
  const links = HUB_LINKS.filter((l) => l.tier === tier);
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{blurb}</p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {links.map((l) => (
          <li key={l.slug}>
            <a
              href={`/p/${l.slug}`}
             
              className="group flex items-start gap-2 rounded-lg border border-transparent p-3 transition hover:border-primary hover:bg-primary/5"
            >
              <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
              <span className="text-sm font-medium text-foreground group-hover:text-primary">
                {l.label}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MidContentCta() {
  return (
    <aside className="not-prose my-10 overflow-hidden rounded-2xl border-2 border-primary/40 bg-primary/5 p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
        Got a pool?
      </p>
      <p className="mt-2 text-base font-semibold leading-snug text-foreground sm:text-lg">
        It can pay for its own upkeep.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Owners on Pool Rental Near Me earn money renting their pool by the hour —
        no membership, flat 10% host fee, $2M liability insurance included.
      </p>
      <div className="mt-4">
        <a
          href="/l/draft/00000000-0000-0000-0000-000000000000/new/details"
          className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          List your pool →
        </a>
      </div>
    </aside>
  );
}

function PrnmCta() {
  return (
    <aside className="mt-14 overflow-hidden rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/15 to-primary/5 p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
        Turn your pool into income
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Stop paying for pool upkeep. Get paid for it instead.
      </h2>
      <p className="mt-3 max-w-2xl text-base text-muted-foreground">
        Hosts on Pool Rental Near Me earn $3K–$10K/month renting their pool by the
        hour. Flat 10% host fee (vs Swimply's 15%+), $2M liability insurance
        included, you set the rules. Listing takes 10 minutes.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href="/l/draft/00000000-0000-0000-0000-000000000000/new/details"
          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:opacity-90"
        >
          List your pool →
        </a>
        <a
          href="/s"
          className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:border-primary hover:text-primary"
        >
          Looking to rent a pool instead? Find pools near you →
        </a>
      </div>
    </aside>
  );
}

function ProseBlock({ children }: { children: ReactNode }) {
  return (
    <div
      className="prose prose-lg mt-10 max-w-none text-foreground
        prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground prose-headings:scroll-mt-24
        prose-h2:mt-12 prose-h2:text-2xl prose-h2:border-b prose-h2:border-border prose-h2:pb-2
        prose-h3:mt-8 prose-h3:text-xl
        prose-p:leading-relaxed
        prose-a:text-primary hover:prose-a:underline
        prose-strong:text-foreground
        prose-table:border prose-table:border-border
        prose-th:bg-muted/40 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold
        prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2
        prose-li:my-1
        dark:prose-invert"
    >
      {children}
    </div>
  );
}

function renderMarkdown(md: string) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h2: ({ children, ...props }) => {
          const text = Array.isArray(children) ? children.join("") : String(children ?? "");
          return (
            <h2 id={slugify(text)} {...props}>
              {children}
            </h2>
          );
        },
        blockquote: ({ children }) => (
          <aside className="not-prose my-6 flex gap-3 rounded-xl border-l-4 border-amber-400 bg-amber-50 p-4 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
            <span aria-hidden className="text-xl">💡</span>
            <div className="text-base leading-relaxed [&_p]:m-0">{children}</div>
          </aside>
        ),
      }}
    >
      {md}
    </ReactMarkdown>
  );
}

/**
 * Splits body markdown at the start of the SECOND `## ` heading so we can
 * inject the host-acquisition CTA after the first major section. Falls back
 * to a single block when the body has fewer than two H2s.
 */
function BodyWithMidCta({ body, injectCta }: { body: string; injectCta: boolean }) {
  const split = useMemo(() => {
    if (!injectCta) return { before: body, after: "" };
    const re = /\n## /g;
    const first = re.exec(body);
    if (!first) return { before: body, after: "" };
    const second = re.exec(body);
    if (!second) return { before: body, after: "" };
    return {
      before: body.slice(0, second.index),
      after: body.slice(second.index + 1), // drop the leading newline
    };
  }, [body, injectCta]);

  if (!split.after) {
    return <ProseBlock>{renderMarkdown(split.before)}</ProseBlock>;
  }
  return (
    <>
      <ProseBlock>{renderMarkdown(split.before)}</ProseBlock>
      <MidContentCta />
      <ProseBlock>{renderMarkdown(split.after)}</ProseBlock>
    </>
  );
}
