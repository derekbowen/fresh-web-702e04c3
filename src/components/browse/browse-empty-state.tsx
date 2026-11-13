import { BROWSE_PATH } from "@/lib/browse-search";

/**
 * Non-result bodies for /s. Every one of them points somewhere useful that this
 * app serves itself: the state index and the all-locations directory.
 */

const PRIMARY =
  "inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90";
const SECONDARY =
  "inline-flex h-10 items-center justify-center rounded-full border border-border bg-card px-6 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary";

const BOX = "rounded-2xl border border-border bg-muted/30 p-6 sm:p-8";

function OtherPlaces() {
  return (
    <>
      <a href="/p/pool-rentals" className={SECONDARY}>
        Browse by state
      </a>
      <a href="/p/all-locations" className={SECONDARY}>
        All locations
      </a>
    </>
  );
}

/** Zero rows for a real, served query. */
export function BrowseEmptyState({
  scope,
  hasFilters,
  refined,
  className,
}: {
  scope: string | null;
  /** Anything narrowing the read, so "Show all pools" would show more. */
  hasFilters: boolean;
  /** A keyword / pool-type filter was actually applied. */
  refined: boolean;
  className?: string;
}) {
  const where = scope ? ` in ${scope}` : "";
  const heading = refined
    ? `No pools match your search${where} right now`
    : `No pools listed${where} right now`;
  return (
    <section aria-labelledby="browse-empty-title" className={`${BOX} ${className ?? ""}`}>
      <h2 id="browse-empty-title" className="break-words text-xl font-semibold text-foreground">
        {heading}
      </h2>
      <p className="mt-2 text-muted-foreground">
        Try another city or state, or browse every location we cover.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        {hasFilters && (
          <a href={BROWSE_PATH} className={PRIMARY}>
            Show all pools
          </a>
        )}
        <OtherPlaces />
      </div>
    </section>
  );
}

/** The read failed or nothing could serve it. The banner carries the message. */
export function BrowseUnavailable({
  retryHref,
  className,
}: {
  retryHref: string;
  className?: string;
}) {
  return (
    <section aria-label="Other ways to find a pool" className={`${BOX} ${className ?? ""}`}>
      <p className="text-muted-foreground">
        You can reload this page, or look through pools by location instead.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <a href={retryHref} className={PRIMARY}>
          Reload
        </a>
        <OtherPlaces />
      </div>
    </section>
  );
}

/** A page number past the end of a non-empty result. */
export function BrowseOutOfRange({
  page,
  totalPages,
  lastPageHref,
  className,
}: {
  page: number;
  totalPages: number;
  lastPageHref: string;
  className?: string;
}) {
  return (
    <section aria-labelledby="browse-oor-title" className={`${BOX} ${className ?? ""}`}>
      <h2 id="browse-oor-title" className="text-xl font-semibold text-foreground">
        There is no page {page.toLocaleString("en-US")}
      </h2>
      <p className="mt-2 text-muted-foreground">
        These results end at page {totalPages.toLocaleString("en-US")}.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <a href={lastPageHref} className={PRIMARY}>
          Go to page {totalPages.toLocaleString("en-US")}
        </a>
      </div>
    </section>
  );
}
