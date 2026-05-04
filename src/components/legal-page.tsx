import * as React from "react";
import { SiteHeader, SiteFooter } from "@/components/site-layout";

interface LegalPageProps {
  title: string;
  effectiveDate: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalPage({ title, effectiveDate, lastUpdated, children }: LegalPageProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <header className="mb-10 border-b border-border pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            <span className="font-semibold">Effective:</span> {effectiveDate} ·{" "}
            <span className="font-semibold">Last updated:</span> {lastUpdated}
          </p>
        </header>
        <article
          className="prose prose-slate max-w-none text-foreground
            prose-headings:font-semibold prose-headings:tracking-tight
            prose-h2:mt-10 prose-h2:text-2xl prose-h2:border-b prose-h2:border-border prose-h2:pb-2
            prose-h3:mt-8 prose-h3:text-xl
            prose-p:leading-relaxed
            prose-a:text-primary hover:prose-a:underline
            prose-strong:text-foreground
            prose-ul:my-4 prose-li:my-1
            dark:prose-invert"
        >
          {children}
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
