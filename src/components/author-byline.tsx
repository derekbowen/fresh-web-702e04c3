import { Link } from "@tanstack/react-router";

/**
 * Sitewide author byline shown directly under every article H1.
 * Wires every content page back to the Derek Bowen author entity so
 * the E-E-A-T signal compounds across all 200+ guides.
 */
export function AuthorByline({
  date,
  className = "",
}: {
  /** Optional ISO date string for "Updated" label. */
  date?: string | null;
  className?: string;
}) {
  const updated = date
    ? new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <p
      className={`mt-3 text-sm text-muted-foreground ${className}`}
      data-component="author-byline"
    >
      By{" "}
      <Link
        to="/p/author/derek-bowen"
        className="font-medium text-foreground underline-offset-2 hover:underline"
      >
        Derek Bowen
      </Link>
      , founder of Pool Rental Near Me and author of 7 books on pool hosting
      {updated ? <span className="text-muted-foreground"> · Updated {updated}</span> : null}
    </p>
  );
}
