import { Link } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/seo";

export interface Crumb {
  name: string;
  path: string;
}

/**
 * Renders a visible breadcrumb trail AND emits BreadcrumbList JSON-LD inline.
 * Page-level <head> JSON-LD already exists for the parent dispatcher; this
 * component is for templates that want both visual + schema in one shot.
 */
export function BreadcrumbsWithSchema({ items, className }: { items: Crumb[]; className?: string }) {
  if (!items?.length) return null;
  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.path}`,
    })),
  };
  return (
    <>
      <nav aria-label="Breadcrumb" className={className ?? "text-sm text-muted-foreground"}>
        <ol className="flex flex-wrap items-center gap-1.5">
          {items.map((c, i) => {
            const last = i === items.length - 1;
            return (
              <li key={`${c.path}-${i}`} className="flex items-center gap-1.5">
                {last ? (
                  <span aria-current="page" className="text-foreground font-medium">{c.name}</span>
                ) : (
                  <Link to={c.path} className="hover:text-primary hover:underline">{c.name}</Link>
                )}
                {!last && <span aria-hidden="true">›</span>}
              </li>
            );
          })}
        </ol>
      </nav>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </>
  );
}
