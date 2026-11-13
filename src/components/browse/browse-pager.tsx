import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { BrowsePager } from "@/lib/browse-search";

const PAGER_LINK =
  "inline-flex h-10 items-center justify-center rounded-full border border-border bg-card px-5 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary";

/**
 * Prev / next with real hrefs (crawlable, work without JS, survive a refresh).
 *
 * On phones the controls are left-aligned and the row keeps 88 px clear on the
 * right, so a bottom-right chat launcher can never sit on top of "Next" when
 * the pager is scrolled to the bottom of the screen.
 */
export function BrowsePagerNav({ pager, className }: { pager: BrowsePager; className?: string }) {
  return (
    <nav
      aria-label="Search results pages"
      className={cn("flex flex-col items-start gap-3 pr-[88px] sm:items-center sm:pr-0", className)}
    >
      <p className="text-sm text-muted-foreground">
        Page {pager.page.toLocaleString("en-US")} of {pager.totalPages.toLocaleString("en-US")}
      </p>
      <div className="flex flex-wrap gap-3">
        <PagerLink href={pager.prevHref} rel="prev" label="Previous page">
          ← Previous
        </PagerLink>
        <PagerLink href={pager.nextHref} rel="next" label="Next page">
          Next →
        </PagerLink>
      </div>
    </nav>
  );
}

function PagerLink({
  href,
  rel,
  label,
  children,
}: {
  href: string | null;
  rel: "prev" | "next";
  label: string;
  children: ReactNode;
}) {
  if (!href) {
    return (
      <span aria-disabled="true" className={cn(PAGER_LINK, "pointer-events-none opacity-40")}>
        {children}
      </span>
    );
  }
  return (
    <a href={href} rel={rel} aria-label={label} className={PAGER_LINK}>
      {children}
    </a>
  );
}
