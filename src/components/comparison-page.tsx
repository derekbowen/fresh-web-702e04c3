import * as React from "react";
import { Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-layout";

export interface ComparisonPageProps {
  competitor: string;
  title: string;
  effectiveMonthYear: string;
  children: React.ReactNode;
}

export function ComparisonPage({ title, children }: ComparisonPageProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <nav className="mb-6 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span className="mx-1.5">/</span>
          <span>Compare</span>
          <span className="mx-1.5">/</span>
          <span className="text-foreground">{title}</span>
        </nav>
        <article
          className="prose prose-slate max-w-none text-foreground
            prose-headings:font-semibold prose-headings:tracking-tight
            prose-h1:text-3xl sm:prose-h1:text-4xl prose-h1:mb-6
            prose-h2:mt-12 prose-h2:text-2xl prose-h2:border-b prose-h2:border-border prose-h2:pb-2
            prose-h3:mt-8 prose-h3:text-xl
            prose-p:leading-relaxed
            prose-a:text-primary hover:prose-a:underline
            prose-strong:text-foreground
            prose-ul:my-4 prose-li:my-1.5
            prose-blockquote:border-l-primary prose-blockquote:bg-muted/40 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic
            dark:prose-invert"
        >
          {children}
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}

export function CTAPrimary() {
  return (
    <div className="not-prose my-8 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
      <a
        href="https://earn.poolrentalnearme.com/"
        className="inline-block rounded-full bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
      >
        🏊 List Your Pool Free →
      </a>
      <p className="mt-3 text-sm font-medium text-foreground">
        Keep 90% · $2M Insurance · 70+ Free Courses · You Control Everything
      </p>
    </div>
  );
}

export function CTAMid() {
  return (
    <div className="not-prose my-8 grid gap-3 sm:grid-cols-2">
      <a
        href="https://www.poolrentalnearme.com/p/learningacademy"
        className="rounded-xl border border-border bg-card p-5 text-center font-semibold text-foreground shadow-sm transition hover:border-primary hover:bg-primary/5"
      >
        📚 Browse 70+ Free Pool Host Courses →
      </a>
      <a
        href="https://go.poolrentalnearme.com/app"
        className="rounded-xl border border-border bg-card p-5 text-center font-semibold text-foreground shadow-sm transition hover:border-primary hover:bg-primary/5"
      >
        📲 Download the PRNM App →
      </a>
    </div>
  );
}

export function AuthorBlock() {
  return (
    <>
      <h2>About the Author</h2>
      <p>
        <strong>Derek Bowen</strong> is the founder and CEO of PRNM Corp, the
        parent company behind Pool Rental Near Me. A lifelong entrepreneur with
        20+ years of marketplace and e-commerce experience, Derek launched Pool
        Rental Near Me to give pool owners a host-first alternative to high-fee
        competitors. He is the author of multiple Amazon-published books on
        pool hosting, including <em>Pool Host Riches</em>,{" "}
        <em>The Backyard Entrepreneur</em>, and the Pool Host Academy companion
        guides.
      </p>
      <p>
        Connect:{" "}
        <a href="https://www.linkedin.com/in/derekcbowen/">LinkedIn</a> ·{" "}
        <a href="https://www.poolrentalnearme.com/p/learningacademy">
          Pool Host Academy
        </a>
      </p>
    </>
  );
}

export function FooterBlock({ city }: { city?: string }) {
  return (
    <>
      <hr />
      <h2>🌐 Connect with Pool Rental Near Me</h2>
      <ul>
        <li>📸 <strong>Instagram:</strong> <a href="https://instagram.com/poolrentalnearme">@poolrentalnearme</a></li>
        <li>👍 <strong>Facebook:</strong> <a href="https://facebook.com/poolrentalnearme">/poolrentalnearme</a></li>
        <li>💼 <strong>LinkedIn:</strong> <a href="https://www.linkedin.com/in/derekcbowen/">Derek Bowen</a></li>
      </ul>
      <hr />
      <CTAPrimary />
      <p>
        <strong>Contact:</strong> 888-940-4247 (10am – 5pm PST) ·{" "}
        <a href="mailto:support@poolrentalnearme.com">
          support@poolrentalnearme.com
        </a>
      </p>
      <p className="text-sm text-muted-foreground">
        © 2026 PRNM Corp. All rights reserved. ·{" "}
        <Link to="/privacy-policy">Privacy Policy</Link> ·{" "}
        <a href="https://www.poolrentalnearme.com/terms-of-service">
          Terms of Service
        </a>
      </p>
    </>
  );
}

export function buildComparisonMeta(opts: {
  slug: string;
  title: string;
  description: string;
}) {
  const url = `https://www.poolrentalnearme.com/p/${opts.slug}`;
  return {
    meta: [
      { title: opts.title },
      { name: "description", content: opts.description },
      { property: "og:title", content: opts.title },
      { property: "og:description", content: opts.description },
      { property: "og:url", content: url },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: opts.title },
      { name: "twitter:description", content: opts.description },
      { name: "robots", content: "index,follow" },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    type: "application/ld+json",
    children: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    }),
  };
}

export function FAQList({ faqs }: { faqs: { q: string; a: React.ReactNode }[] }) {
  return (
    <>
      {faqs.map((f, i) => (
        <div key={i}>
          <h3>{f.q}</h3>
          <p>{f.a}</p>
        </div>
      ))}
    </>
  );
}

export function ComparisonTable({
  competitor,
  rows,
}: {
  competitor: string;
  rows: { label: string; prnm: React.ReactNode; competitor: React.ReactNode }[];
}) {
  return (
    <div className="not-prose my-8 overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-foreground">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Feature</th>
            <th className="px-4 py-3 text-left font-semibold text-primary">Pool Rental Near Me</th>
            <th className="px-4 py-3 text-left font-semibold">{competitor}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border align-top">
              <td className="px-4 py-3 font-medium text-foreground">{r.label}</td>
              <td className="px-4 py-3 text-foreground">{r.prnm}</td>
              <td className="px-4 py-3 text-muted-foreground">{r.competitor}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function articleJsonLd(opts: {
  slug: string;
  title: string;
  description: string;
  datePublished?: string;
  dateModified?: string;
}) {
  const url = `https://www.poolrentalnearme.com/p/${opts.slug}`;
  return {
    type: "application/ld+json",
    children: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: opts.title,
      description: opts.description,
      author: {
        "@type": "Person",
        name: "Derek Bowen",
        url: "https://www.linkedin.com/in/derekcbowen/",
      },
      publisher: {
        "@type": "Organization",
        name: "Pool Rental Near Me",
        logo: {
          "@type": "ImageObject",
          url: "https://www.poolrentalnearme.com/favicon.ico",
        },
      },
      datePublished: opts.datePublished ?? "2026-01-15",
      dateModified: opts.dateModified ?? "2026-05-01",
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
    }),
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    type: "application/ld+json",
    children: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: it.name,
        item: it.url,
      })),
    }),
  };
}

