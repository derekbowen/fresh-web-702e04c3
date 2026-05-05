type BadgeProvider = {
  is_featured?: boolean;
  featured_until?: string | null;
  listing_paid_until?: string | null;
  plan?: string | null;
};

function fmtDate(d?: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function ProviderPlanBadges({ p, className = "" }: { p: BadgeProvider; className?: string }) {
  const now = Date.now();
  const featuredActive = !!p.is_featured && (!p.featured_until || new Date(p.featured_until).getTime() > now);
  const paidActive = !!p.listing_paid_until && new Date(p.listing_paid_until).getTime() > now;
  if (!featuredActive && !paidActive) return null;
  const dateStr = featuredActive ? fmtDate(p.featured_until) : fmtDate(p.listing_paid_until);
  return (
    <span className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
      {featuredActive ? (
        <span
          title={dateStr ? `Featured through ${dateStr}` : undefined}
          className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground"
        >
          Featured
        </span>
      ) : (
        <span
          title={dateStr ? `Verified listing through ${dateStr}` : undefined}
          className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-secondary-foreground"
        >
          Verified
        </span>
      )}
      {dateStr && (
        <span className="text-[10px] font-medium text-muted-foreground">until {dateStr}</span>
      )}
    </span>
  );
}
