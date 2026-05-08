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
  // fresh-web only owns /, /p/*, /landing-page client-side. For any other
  // path (e.g. /public-pools served by another app via the nginx proxy), use
  // a plain <a> so the browser does a full navigation through the proxy.
  const isInternal = (p: string) => p === "/" || p.startsWith("/p/") || p.startsWith("/landing-page");
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
                ) : isInternal(c.path) ? (
                  <Link to={c.path} className="hover:text-primary hover:underline">{c.name}</Link>
                ) : (
                  <a href={c.path} className="hover:text-primary hover:underline">{c.name}</a>
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
