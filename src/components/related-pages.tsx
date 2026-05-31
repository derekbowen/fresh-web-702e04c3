import type { MouseEvent } from "react";

export interface RelatedPagesItem {
  to: string;
  label: string;
  description?: string;
}

const DEFAULT_ITEMS: RelatedPagesItem[] = [
  { to: "/p/earnings-calculator", label: "Pool host earnings calculator", description: "Estimate your monthly pool rental income" },
  { to: "/p/free-host-tools", label: "Free pool host tools", description: "Calculators, checklists, and templates" },
  { to: "/p/how-it-works", label: "How pool rental works", description: "Hosting and booking, end to end" },
  { to: "/p/hosting", label: "Become a pool host", description: "Turn your backyard into income" },
  { to: "/p/all-locations", label: "All pool rental locations", description: "Browse pools across the US" },
  { to: "/p/pool-pros", label: "Pool pros directory", description: "Local pool builders, cleaners, and inspectors" },
];

function forceDocumentNavigation(path: string) {
  return (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    window.location.assign(path);
  };
}

/**
 * Site-wide related-pages module. Renders evergreen hub links plus any
 * caller-supplied items. Used at the bottom of /p/{slug} templates to
 * reinforce internal linking on every content page.
 */
export function RelatedPages({
  items,
  heading = "Keep exploring",
  className,
}: {
  items?: RelatedPagesItem[];
  heading?: string;
  className?: string;
}) {
  const list = items && items.length > 0 ? items : DEFAULT_ITEMS;
  return (
    <section className={["mt-12 border-t border-border pt-8", className].filter(Boolean).join(" ")}>
      <h2 className="text-xl font-semibold text-foreground">{heading}</h2>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {list.map((it) => (
          <li key={it.to}>
            <a
              href={it.to}
              onClick={forceDocumentNavigation(it.to)}
              className="block rounded-xl border border-border bg-card px-4 py-3 transition hover:border-primary"
            >
              <div className="text-sm font-semibold text-foreground">{it.label}</div>
              {it.description && (
                <div className="mt-1 text-xs text-muted-foreground">{it.description}</div>
              )}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
