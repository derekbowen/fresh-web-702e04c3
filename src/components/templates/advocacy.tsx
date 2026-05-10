import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useMemo } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { BreadcrumbsWithSchema } from "@/components/breadcrumbs-jsonld";
import { FaqBlock } from "@/components/faq-block";
import { faqsForContentPage } from "@/lib/page-faqs";
import type { ContentPage } from "@/server/content-pages.functions";
import {
  ADVOCACY_HUB_PATH,
  ADVOCACY_STATES,
  findAdvocacyState,
  relatedAdvocacyStates,
  type AdvocacyState,
} from "@/lib/advocacy-states";

// ---------- helpers ----------

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

type TocItem = { id: string; text: string };

function extractToc(markdown: string): TocItem[] {
  const out: TocItem[] = [];
  const seen = new Set<string>();
  const lines = markdown.split("\n");
  let inFence = false;
  for (const raw of lines) {
    if (raw.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^##\s+(.+?)\s*#*\s*$/.exec(raw);
    if (!m) continue;
    const text = m[1].replace(/[*_`]/g, "").trim();
    if (!text) continue;
    let id = slugifyHeading(text);
    if (!id) continue;
    let n = 2;
    while (seen.has(id)) id = `${slugifyHeading(text)}-${n++}`;
    seen.add(id);
    out.push({ id, text });
  }
  return out;
}

function nodeToText(children: unknown): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(nodeToText).join("");
  if (children && typeof children === "object" && "props" in children) {
    const props = (children as { props?: { children?: unknown } }).props;
    return nodeToText(props?.children);
  }
  return "";
}

// ---------- shared UI ----------

function StatStrip() {
  return (
    <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        { k: "$2M", v: "Liability per booking" },
        { k: "10%", v: "Flat host fee" },
        { k: "$0", v: "To list your pool" },
        { k: "24/7", v: "US-based support" },
      ].map((s) => (
        <div
          key={s.v}
          className="rounded-2xl border border-border bg-card/60 px-4 py-3 backdrop-blur"
        >
          <div className="text-xl font-bold text-primary">{s.k}</div>
          <div className="mt-0.5 text-xs font-medium text-muted-foreground">{s.v}</div>
        </div>
      ))}
    </div>
  );
}

function SidebarCTA({ stateName }: { stateName?: string | null }) {
  const findHref = stateName
    ? `/s?address=${encodeURIComponent(stateName)}`
    : "/s";
  return (
    <div className="rounded-3xl bg-gradient-to-br from-primary to-primary-glow p-6 text-primary-foreground shadow-xl">
      <h3 className="text-lg font-bold">
        Ready to host{stateName ? ` in ${stateName}` : ""}?
      </h3>
      <p className="mt-2 text-sm text-primary-foreground/85">
        Free to list. $2M liability on every confirmed booking.
      </p>
      <a
        href="/l/draft/00000000-0000-0000-0000-000000000000/new/details"
        className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-primary shadow transition-transform hover:scale-[1.02]"
      >
        List your pool →
      </a>
      <a
        href={findHref}
        className="mt-2 inline-flex w-full items-center justify-center rounded-full border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/20"
      >
        Find pools{stateName ? ` in ${stateName}` : ""} →
      </a>
    </div>
  );
}

function StateGrid({
  states,
  currentSlug,
  compact = false,
}: {
  states: AdvocacyState[];
  currentSlug?: string | null;
  compact?: boolean;
}) {
  const cols = compact
    ? "grid-cols-2 sm:grid-cols-3"
    : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";
  return (
    <ul className={`grid ${cols} gap-x-4 gap-y-2`}>
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

// ---------- template ----------

export function AdvocacyTemplate({ page }: { page: ContentPage }) {
  const isHub = page.template_type === "host_advocacy_hub";
  const state = isHub ? null : findAdvocacyState(page.slug);
  const title = state?.name
    ? `${state.name} pool host guide`
    : page.title || page.seo_title || page.slug || "Pool host advocacy hub";
  const lede =
    page.description ||
    (isHub
      ? "State-by-state guides on what's allowed, what's required, and how to host your pool the right way — wherever you live."
      : `What you need to know about hosting a private pool in ${state?.name ?? "your state"}: local rules, HOA tips, taxes, and what we do when neighbors have questions.`);
  const body = (page.content || page.body_markdown || "") as string;
  const toc = useMemo(() => extractToc(body), [body]);
  const faqs = useMemo(() => faqsForContentPage(page), [page]);

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

  // Custom heading components: stable ids for TOC, accent rule on h2.
  const proseComponents = {
    h2: ({ children, ...rest }: { children?: React.ReactNode }) => {
      const id = slugifyHeading(nodeToText(children));
      return (
        <h2
          id={id}
          className="group mt-14 flex scroll-mt-24 items-center gap-3 border-b border-border pb-3 text-2xl font-bold tracking-tight text-foreground"
          {...rest}
        >
          <span aria-hidden className="block h-6 w-1 rounded-full bg-primary" />
          <span>{children}</span>
        </h2>
      );
    },
    h3: ({ children, ...rest }: { children?: React.ReactNode }) => {
      const id = slugifyHeading(nodeToText(children));
      return (
        <h3
          id={id}
          className="mt-8 scroll-mt-24 text-xl font-semibold tracking-tight text-foreground"
          {...rest}
        >
          {children}
        </h3>
      );
    },
    table: ({ children }: { children?: React.ReactNode }) => (
      <div className="my-6 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    ),
    th: ({ children }: { children?: React.ReactNode }) => (
      <th className="bg-secondary/60 px-4 py-2 text-left font-semibold text-foreground">
        {children}
      </th>
    ),
    td: ({ children }: { children?: React.ReactNode }) => (
      <td className="border-t border-border px-4 py-2 align-top text-muted-foreground">
        {children}
      </td>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="my-6 rounded-r-2xl border-l-4 border-primary bg-primary/5 px-5 py-4 text-foreground">
        {children}
      </blockquote>
    ),
    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
      <a
        href={href}
        className="font-medium text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:decoration-primary"
      >
        {children}
      </a>
    ),
  } as const;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-background to-primary/5">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <BreadcrumbsWithSchema items={breadcrumbs} />
            <div className="mt-6 max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                {isHub ? "⚖️ Host advocacy hub" : `⚖️ ${state?.name ?? "State"} host guide`}
              </span>
              <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                {title}
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground sm:text-xl">
                {lede}
              </p>
              <StatStrip />
            </div>
          </div>
        </section>

        {/* Body + sidebar */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-12">
            <article className="lg:col-span-8">
              {!isHub && (
                <p className="mb-6 text-sm">
                  <a
                    href={ADVOCACY_HUB_PATH}
                    className="text-primary hover:underline"
                  >
                    ← All 50 state host guides
                  </a>
                </p>
              )}

              {body ? (
                <div className="prose prose-lg max-w-none text-foreground prose-p:leading-relaxed prose-p:text-muted-foreground prose-strong:text-foreground prose-ul:my-4 prose-li:my-1 prose-li:text-muted-foreground dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={proseComponents}>
                    {body}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Guide content is being updated. In the meantime, browse other state guides below.
                </p>
              )}

              {/* Bottom CTA card */}
              <div className="mt-14 rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-8">
                <h3 className="text-2xl font-bold tracking-tight text-foreground">
                  Hosting{state?.name ? ` in ${state.name}` : ""} starts here.
                </h3>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                  Free to list. $2M liability insurance on every confirmed booking. 10% flat host fee — the lowest of any pool rental platform.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="/l/draft/00000000-0000-0000-0000-000000000000/new/details"
                    className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105"
                  >
                    List your pool →
                  </a>
                  <a
                    href={state?.name ? `/s?address=${encodeURIComponent(state.name)}` : "/s"}
                    className="inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                  >
                    Find pools{state?.name ? ` in ${state.name}` : ""} →
                  </a>
                </div>
              </div>

              {/* Related states (state pages only) */}
              {!isHub && state && (
                <section aria-label="Nearby state guides" className="mt-14">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Nearby state guides
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Hosting rules vary by state. Compare what's allowed nearby.
                  </p>
                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {relatedAdvocacyStates(state, 8).map((s) => (
                      <a
                        key={s.slug}
                        href={`/p/${s.slug}`}
                        className="group flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                      >
                        <span className="text-sm font-semibold text-foreground">
                          {s.name}
                        </span>
                        <span
                          aria-hidden
                          className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                        >
                          →
                        </span>
                      </a>
                    ))}
                  </div>
                </section>
              )}

              {/* FAQ block (matches FAQPage JSON-LD emitted by dispatcher) */}
              {faqs.length > 0 && (
                <section aria-label="Frequently asked questions" className="mt-14">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Frequently asked questions
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {isHub
                      ? "Quick answers about hosting a pool legally in the US."
                      : `Quick answers for ${state?.name ?? "your state"} hosts.`}
                  </p>
                  <div className="mt-6">
                    <FaqBlock faqs={faqs} />
                  </div>
                </section>
              )}
            </article>

            {/* Sidebar */}
            <aside className="lg:col-span-4">
              <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1 space-y-6">
                {toc.length > 1 && (
                  <nav
                    aria-label="On this page"
                    className="rounded-3xl border border-border bg-card p-5"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      On this page
                    </p>
                    <ul className="mt-3 space-y-2">
                      {toc.map((t) => (
                        <li key={t.id}>
                          <a
                            href={`#${t.id}`}
                            className="block text-sm leading-snug text-muted-foreground transition-colors hover:text-primary"
                          >
                            {t.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                )}

                <SidebarCTA stateName={state?.name ?? null} />

                {!isHub && (
                  <div className="rounded-3xl border border-border bg-card p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      More state guides
                    </p>
                    <div className="mt-3">
                      <StateGrid
                        states={ADVOCACY_STATES.slice(0, 12)}
                        currentSlug={page.slug}
                        compact
                      />
                    </div>
                    <a
                      href={ADVOCACY_HUB_PATH}
                      className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline"
                    >
                      View all 50 →
                    </a>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </section>

        {/* Full state index */}
        <section className="border-t border-border bg-secondary/30">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {isHub ? "Browse every state guide" : "All 50 state host guides"}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Pick your state to see local laws, permits, HOA tips, and what to do when neighbors have questions.
                </p>
              </div>
              {!isHub && (
                <a
                  href={ADVOCACY_HUB_PATH}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  Back to hub →
                </a>
              )}
            </div>
            <div className="mt-8 rounded-3xl border border-border bg-card p-6 sm:p-8">
              <StateGrid states={ADVOCACY_STATES} currentSlug={page.slug} />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
