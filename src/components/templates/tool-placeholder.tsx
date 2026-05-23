import { SiteHeader, SiteFooter } from "@/components/site-layout";

export interface ToolPlaceholderProps {
  eyebrow: string;
  h1: string;
  intro: string;
  heroSrc: string;
  heroAlt: string;
  bullets: string[];
  faqs: Array<{ q: string; a: string }>;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  breadcrumbItems: Array<{ name: string; path: string }>;
  /** Long-form sections (~200 words each) — depth so Google doesn't flag thin. */
  whyExists: { heading: string; paragraphs: string[] };
  whoUses: { heading: string; paragraphs: string[] };
  howItWorks: { heading: string; steps: Array<{ title: string; body: string }> };
  scenarios: { heading: string; items: Array<{ title: string; body: string }> };
}

/**
 * Shared placeholder/coming-soon template for new host-tool routes that
 * have been migrated to /p/ from subdomains. Real tool functionality is
 * ported in a follow-up phase — this page exists so the URL is live,
 * indexable, and SEO-ready first.
 */
export function ToolPlaceholderPage({
  eyebrow,
  h1,
  intro,
  heroSrc,
  heroAlt,
  bullets,
  faqs,
  primaryCta,
  secondaryCta,
  breadcrumbItems,
}: ToolPlaceholderProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <img
            src={heroSrc}
            alt={heroAlt}
            width={1600}
            height={896}
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/40" />
          <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
            {/* Breadcrumb trail (visible) */}
            <nav
              aria-label="Breadcrumb"
              className="mb-4 text-xs text-muted-foreground"
            >
              {breadcrumbItems.map((b, i) => (
                <span key={b.path}>
                  {i > 0 && <span className="mx-1">/</span>}
                  {i < breadcrumbItems.length - 1 ? (
                    <a href={b.path} className="hover:text-foreground">
                      {b.name}
                    </a>
                  ) : (
                    <span className="text-foreground">{b.name}</span>
                  )}
                </span>
              ))}
            </nav>
            <div className="max-w-2xl">
              <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                {eyebrow}
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
                {h1}
              </h1>
              <p className="mt-5 text-base text-muted-foreground sm:text-lg">
                {intro}
              </p>
              {(primaryCta || secondaryCta) && (
                <div className="mt-7 flex flex-wrap gap-3">
                  {primaryCta && (
                    <a
                      href={primaryCta.href}
                      className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90 sm:text-base"
                    >
                      {primaryCta.label}
                    </a>
                  )}
                  {secondaryCta && (
                    <a
                      href={secondaryCta.href}
                      className="inline-flex items-center justify-center rounded-full border border-border bg-background/80 px-6 py-3 text-sm font-semibold text-foreground backdrop-blur transition hover:bg-muted sm:text-base"
                    >
                      {secondaryCta.label}
                    </a>
                  )}
                </div>
              )}
              <p className="mt-4 text-xs text-muted-foreground">
                The full tool is rolling out shortly. Bookmark this page —
                we'll notify list members the day it goes live.
              </p>
            </div>
          </div>
        </section>

        {/* What's coming */}
        <section className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            What you'll be able to do
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {bullets.map((b) => (
              <li
                key={b}
                className="flex gap-3 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground"
              >
                <span
                  aria-hidden
                  className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-primary"
                />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ */}
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-3xl px-4 py-16">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Frequently asked questions
            </h2>
            <div className="mt-6 space-y-3">
              {faqs.map((f) => (
                <details
                  key={f.q}
                  className="group rounded-xl border border-border bg-card p-5"
                >
                  <summary className="cursor-pointer text-base font-semibold text-foreground">
                    {f.q}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Related */}
        <section className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Related host resources
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <a
              href="/p/hosting"
              className="rounded-xl border border-border bg-card p-4 text-sm font-medium text-foreground transition hover:border-primary/40"
            >
              List your pool — 10% flat host fee →
            </a>
            <a
              href="/p/learningacademy"
              className="rounded-xl border border-border bg-card p-4 text-sm font-medium text-foreground transition hover:border-primary/40"
            >
              Pool Host Academy — 135 free classes →
            </a>
            <a
              href="/p/free-host-tools"
              className="rounded-xl border border-border bg-card p-4 text-sm font-medium text-foreground transition hover:border-primary/40"
            >
              All free host tools →
            </a>
            <a
              href="/p/earnings-calculator"
              className="rounded-xl border border-border bg-card p-4 text-sm font-medium text-foreground transition hover:border-primary/40"
            >
              Pool rental earnings calculator →
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
