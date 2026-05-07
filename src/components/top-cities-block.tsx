import { Link } from "@tanstack/react-router";
import type { TopCity } from "@/server/top-cities.functions";

/**
 * Reciprocal "Top cities" block used on hub pages (hosting, all-locations).
 * Surfaces curated outbound links to high-value city host-acq pages.
 */
export function TopCitiesBlock({
  cities,
  heading = "Top pool rental cities",
  subheading = "Become a host in popular markets",
  className,
}: {
  cities: TopCity[];
  heading?: string;
  subheading?: string;
  className?: string;
}) {
  if (!cities?.length) return null;
  return (
    <section className={["mt-12 border-t border-border pt-10", className].filter(Boolean).join(" ")}>
      <h2 className="text-2xl font-bold text-foreground">{heading}</h2>
      {subheading && <p className="mt-1 text-sm text-muted-foreground">{subheading}</p>}
      <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {cities.map((c) => (
          <li key={c.slug}>
            <Link
              to={c.hostAcqHref}
              className="block rounded-lg border border-border bg-card px-3 py-2 text-sm transition hover:border-primary hover:text-primary"
            >
              <span className="font-medium text-foreground">{c.name}</span>
              {c.state_code && <span className="text-muted-foreground">, {c.state_code}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
