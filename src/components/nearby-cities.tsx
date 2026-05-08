import { Link } from "@tanstack/react-router";
import type { NearbyCity } from "@/server/nearby-cities.functions";

interface Props {
  cities: NearbyCity[];
  /** Slug prefix to prepend to each city slug, e.g. "become-a-swimming-pool-host-". Empty string for /p/{citySlug}. */
  slugPrefix?: string;
  heading?: string;
  subheading?: string;
}

/**
 * Renders up to N nearby cities as internal links. Used by host-acq + public-pool
 * templates to satisfy the pSEO brief (6 nearby cities, same-state fallback).
 */
export function NearbyCities({
  cities,
  slugPrefix = "",
  heading = "Nearby cities",
  subheading,
}: Props) {
  if (!cities || cities.length === 0) return null;

  // If any city carries a pre-validated linkSlug, prefer those (they point to
  // verified-published pages). Otherwise fall back to prefix+slug.
  const hasValidated = cities.some((c) => c.linkSlug);
  const renderable = hasValidated ? cities.filter((c) => c.linkSlug) : cities;
  if (renderable.length === 0) return null;

  return (
    <section className="mt-12 border-t border-border pt-8">
      <h2 className="text-xl font-semibold text-foreground">{heading}</h2>
      {subheading && (
        <p className="mt-1 text-sm text-muted-foreground">{subheading}</p>
      )}
      <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {renderable.map((c) => {
          const slug = c.linkSlug ?? `${slugPrefix}${c.slug}`;
          const label =
            c.state_code && !c.slug.endsWith(`-${c.state_code.toLowerCase()}`)
              ? `${c.name}, ${c.state_code}`
              : c.name;
          return (
            <li key={c.slug}>
              <Link
                to="/p/$slug"
                params={{ slug }}
                className="block rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
