/**
 * /s — browse pool listings.
 *
 * Reads through the listing-read facade (src/server/browse.functions.ts →
 * readListingSearch), so PRNM_LISTING_READ_SOURCE picks the backend like every
 * other listing read. Built for `mirror-only`: synced_listings answers, the
 * page says so when a filter had to be dropped, and says "unavailable" — never
 * "no pools" — when the read fails.
 *
 * In production /s is currently served by the WEST marketplace via nginx, so
 * this route is shadowed until routing changes. Nothing here changes routing.
 *
 * SEO: canonical is always /s. Filtered or paged variants are noindex, follow
 * (robots.txt also disallows `/s?`). Bare /s is left indexable while it lists
 * pools — robots.txt already allows it as the search hub, and it is a crawl
 * path to every listing — and drops to noindex when empty or unavailable. Not
 * in any sitemap. No JSON-LD.
 */
import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { ListingCard } from "@/components/listing-card";
import { BrowseFilterForm, MobileBrowseFilters } from "@/components/browse/browse-filters";
import { BrowseNoticeBanner } from "@/components/browse/browse-notice";
import { BrowsePagerNav } from "@/components/browse/browse-pager";
import {
  BrowseEmptyState,
  BrowseOutOfRange,
  BrowseUnavailable,
} from "@/components/browse/browse-empty-state";
import { buildMeta } from "@/lib/seo";
import { getRouteOrigin } from "@/lib/route-origin";
import { PROD_ORIGIN } from "@/lib/site-origin";
import {
  BROWSE_PATH,
  appliedExtras,
  browseHeading,
  browseSeo,
  buildBrowseHref,
  buildPager,
  decideBrowseBody,
  decideBrowseNotice,
  describeResultCount,
  parseBrowseRouteSearch,
  parseBrowseSearch,
  scopeLabel,
  toBrowseQuery,
  type BrowseQuery,
  type BrowseResult,
  type BrowseSearch,
  type BrowseUrlSearch,
} from "@/lib/browse-search";
import { browseListings } from "@/server/browse.functions";

/**
 * The router has no `Register` declaration, so useLoaderData() is untyped
 * app-wide; other routes annotate it the same way.
 */
interface BrowseLoaderData {
  search: BrowseSearch;
  query: BrowseQuery;
  origin: string;
  /** null = the server call itself failed. */
  data: BrowseResult | null;
}

export const Route = createFileRoute("/s")({
  // Lenient by design: zod coerces each param and `.catch`es per field, so an
  // unusable value is dropped (one redirect on SSR to the URL without it) and
  // `/s?page=banana` renders page 1, never a 500. URL vocabulary only; see
  // parseBrowseRouteSearch for why.
  validateSearch: (raw: Record<string, unknown>): BrowseUrlSearch => parseBrowseRouteSearch(raw),
  // The semantic search (aliases resolved, address → scope). Built from known
  // keys only, so utm_* and other extras never split the loader cache.
  loaderDeps: ({ search }) => ({ search: parseBrowseSearch(search) }),
  loader: async ({ deps }): Promise<BrowseLoaderData> => {
    const query = toBrowseQuery(deps.search);
    const [origin, data] = await Promise.all([
      getRouteOrigin().catch(() => PROD_ORIGIN),
      // null = the call itself failed (network on a client-side navigation,
      // serialisation). The page renders "unavailable", never an empty grid.
      browseListings({ data: query }).catch((err: unknown) => {
        console.error("[/s] browse read failed:", err);
        return null;
      }),
    ]);
    return { search: deps.search, query, origin, data };
  },
  head: ({ loaderData }) => {
    const ld = loaderData as BrowseLoaderData | undefined;
    const seo = browseSeo(ld?.search ?? {}, decideBrowseBody(ld?.data ?? null));
    const meta = buildMeta({
      title: seo.title,
      description: seo.description,
      path: BROWSE_PATH,
      canonicalPath: seo.canonicalPath,
      origin: ld?.origin,
    });
    return {
      // buildMeta's own `noindex` emits "noindex, nofollow"; this page wants
      // crawlers to keep following through to listings, so set robots here.
      meta: seo.robots ? [...meta.meta, { name: "robots", content: seo.robots }] : meta.meta,
      links: meta.links,
    };
  },
  errorComponent: BrowseErrorPage,
  component: BrowsePage,
});

function BrowsePage() {
  const { search, query, data } = Route.useLoaderData() as BrowseLoaderData;

  const page = query.page ?? 1;
  const body = decideBrowseBody(data);
  const notice = decideBrowseNotice(search, data);
  const scope = scopeLabel(query);
  const extras = data ? appliedExtras(query, data) : [];
  const count =
    data && body === "results"
      ? describeResultCount(data.total, page, data.perPage, data.listings.length)
      : null;
  const pager = data && body === "results" ? buildPager(query, data.totalPages) : null;
  // toBrowseQuery never writes an unset key, so "any key but page" = filtered.
  const hasFilters = Object.keys(query).some((k) => k !== "page");

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main
        className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-8 sm:px-6 lg:px-8"
        // Which backend answered, for checking a deploy from the outside
        // (same idea as the asset-hash marker). Already public in the
        // dehydrated loader data; this just makes it greppable.
        data-served-by={data?.servedBy ?? "none"}
        data-read-source={data?.source ?? "unknown"}
      >
        <header className="min-w-0">
          <h1 className="break-words text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {browseHeading(query)}
          </h1>
          {count && <p className="mt-2 text-muted-foreground">{count}</p>}
          {extras.length > 0 && (
            <p className="mt-1 break-words text-sm text-muted-foreground">{extras.join(" · ")}</p>
          )}
        </header>

        <section aria-label="Filters" className="mt-6">
          <div className="hidden rounded-2xl border border-border bg-card p-4 md:block">
            <BrowseFilterForm idPrefix="browse-inline" values={query} layout="inline" />
          </div>
          <div className="flex flex-wrap items-center gap-3 md:hidden">
            <MobileBrowseFilters values={query} />
            {(query.state || query.city) && (
              <a href={BROWSE_PATH} className="text-sm font-semibold text-primary hover:underline">
                Clear filters
              </a>
            )}
          </div>
        </section>

        <BrowseNoticeBanner notice={notice} className="mt-6" />

        {body === "results" && data && (
          <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.listings.map((listing) => (
              <li key={listing.id} className="min-w-0">
                <ListingCard listing={listing} />
              </li>
            ))}
          </ul>
        )}

        {body === "empty" && (
          <BrowseEmptyState
            className="mt-6"
            scope={scope}
            hasFilters={hasFilters}
            refined={extras.length > 0}
          />
        )}

        {body === "out-of-range" && data && (
          <BrowseOutOfRange
            className="mt-6"
            page={page}
            totalPages={data.totalPages}
            lastPageHref={buildBrowseHref({ ...query, page: data.totalPages })}
          />
        )}

        {body === "unavailable" && (
          <BrowseUnavailable className="mt-6" retryHref={buildBrowseHref(query)} />
        )}

        {pager && <BrowsePagerNav pager={pager} className="mt-10" />}
      </main>
      <SiteFooter />
    </div>
  );
}

/** A render error. Same honest message as an unavailable read, never a stack trace. */
function BrowseErrorPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Pool rentals
        </h1>
        <BrowseNoticeBanner notice={decideBrowseNotice({}, null)} className="mt-6" />
        <BrowseUnavailable className="mt-6" retryHref={BROWSE_PATH} />
      </main>
      <SiteFooter />
    </div>
  );
}
