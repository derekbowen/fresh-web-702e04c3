import { createFileRoute, Link, useRouter, notFound } from "@tanstack/react-router";
import { getListing } from "@/server/sharetribe.functions";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { Breadcrumbs } from "@/components/listing-card";
import { buildMeta, breadcrumbJsonLd, ldJsonScript, SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/l/$slug/$id")({
  loader: async ({ params }) => {
    const { listing } = await getListing({ data: { id: params.id } });
    if (!listing) throw notFound();
    return { listing };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData?.listing) return {};
    const l = loaderData.listing;
    const loc = [l.city, l.state].filter(Boolean).join(", ");
    const title = `${l.title}${loc ? ` — ${loc}` : ""} | Pool Rental Near Me`;
    const desc =
      (l.description || `Rent ${l.title} by the hour. Book instantly with $2M liability insurance included.`)
        .replace(/\s+/g, " ")
        .slice(0, 160);
    const meta = buildMeta({
      title,
      description: desc,
      path: `/l/${params.slug}/${params.id}`,
      image: l.imageUrl,
      type: "product",
    });
    const product: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: l.title,
      description: desc,
      image: l.imageUrl ? [l.imageUrl] : undefined,
      url: `${SITE_URL}/l/${params.slug}/${params.id}`,
      ...(l.price && {
        offers: {
          "@type": "Offer",
          priceCurrency: l.price.currency,
          price: (l.price.amount / 100).toFixed(2),
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: (l.price.amount / 100).toFixed(2),
            priceCurrency: l.price.currency,
            unitCode: "HUR",
          },
          availability: "https://schema.org/InStock",
        },
      }),
    };
    // Attach real Sharetribe reviews when present. We never ship empty
    // aggregateRating or fabricated reviews — n=0 schema gets pages
    // demoted, not promoted.
    if (l.aggregateRating && l.reviews && l.reviews.length > 0) {
      product.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: l.aggregateRating.value.toFixed(1),
        reviewCount: l.aggregateRating.count,
        bestRating: "5",
        worstRating: "1",
      };
      // Cap surfaced reviews at the most recent 5 — schema doesn't need
      // every review and the body field can be long.
      product.review = l.reviews.slice(0, 5).map((r) => ({
        "@type": "Review",
        author: { "@type": "Person", name: r.authorName },
        datePublished: r.createdAt,
        reviewBody: r.body,
        reviewRating: {
          "@type": "Rating",
          ratingValue: String(r.rating),
          bestRating: "5",
          worstRating: "1",
        },
      }));
    }
    const crumbs = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Pool Rentals", path: "/" },
      { name: l.title, path: `/l/${params.slug}/${params.id}` },
    ]);
    return {
      ...meta,
      scripts: [ldJsonScript(product), ldJsonScript(crumbs)],
    };
  },
  component: ListingPage,
  errorComponent: ListingError,
  notFoundComponent: ListingNotFound,
});

function ListingError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground">{error.message}</p>
        <button
          className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          onClick={() => {
            router.invalidate();
            reset();
          }}
        >
          Retry
        </button>
      </main>
      <SiteFooter />
    </div>
  );
}

function ListingNotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">Pool not found</h1>
        <p className="mt-2 text-muted-foreground">
          This listing is no longer available or has been removed.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Browse all pools
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}

function ListingPage() {
  const { listing } = Route.useLoaderData();
  const params = Route.useParams();
  const loc = [listing.city, listing.state].filter(Boolean).join(", ");
  const externalUrl = `https://www.poolrentalnearme.com/l/${params.slug}/${params.id}`;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: loc || "Pool Rentals", path: "/" },
            { name: listing.title, path: `/l/${params.slug}/${params.id}` },
          ]}
        />

        <div className="mt-6 grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div>
            <div className="aspect-video overflow-hidden rounded-2xl bg-muted">
              {listing.imageUrl ? (
                <img
                  src={listing.imageUrl}
                  alt={listing.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  No image available
                </div>
              )}
            </div>
            <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {listing.title}
            </h1>
            {loc && <p className="mt-2 text-base text-muted-foreground">{loc}</p>}
            {listing.description && (
              <div className="prose prose-sm mt-6 max-w-none whitespace-pre-line text-foreground">
                {listing.description}
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              {listing.price && (
                <div>
                  <span className="text-3xl font-bold text-foreground">
                    ${(listing.price.amount / 100).toFixed(0)}
                  </span>
                  <span className="ml-1 text-base text-muted-foreground">
                    / hour
                  </span>
                </div>
              )}
              <a
                href={externalUrl}
                className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-glow"
              >
                Book this pool
              </a>
              <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                <li>✓ $2M liability insurance included</li>
                <li>✓ Instant booking confirmation</li>
                <li>✓ Hourly rentals — flexible</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
