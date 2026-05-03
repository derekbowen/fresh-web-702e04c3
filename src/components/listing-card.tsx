import { Link } from "@tanstack/react-router";
import type { ListingSummary } from "@/server/sharetribe.functions";

export function ListingCard({ listing }: { listing: ListingSummary }) {
  return (
    <Link
      to="/l/$slug/$id"
      params={{ slug: listing.slug, id: listing.id }}
      className="group block overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-lg"
    >
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        {listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-1 text-base font-semibold text-foreground">
          {listing.title}
        </h3>
        {(listing.city || listing.state) && (
          <p className="mt-1 text-sm text-muted-foreground">
            {[listing.city, listing.state].filter(Boolean).join(", ")}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between gap-3">
          {listing.price ? (
            <p className="text-sm font-semibold text-foreground">
              ${(listing.price.amount / 100).toFixed(0)}{" "}
              <span className="font-normal text-muted-foreground">/ hour</span>
            </p>
          ) : (
            <span />
          )}
          <span className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
            Book now →
          </span>
        </div>
      </div>
    </Link>
  );
}

export function Breadcrumbs({
  items,
}: {
  items: Array<{ name: string; path: string }>;
}) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, i) => (
          <li key={item.path} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true">/</span>}
            {i === items.length - 1 ? (
              <span className="text-foreground" aria-current="page">
                {item.name}
              </span>
            ) : (
              <Link to={item.path} className="hover:text-foreground hover:underline">
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
