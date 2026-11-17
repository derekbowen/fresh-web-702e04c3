import { Link } from "@tanstack/react-router";
import { breadcrumbListItem } from "@/lib/seo";

export interface Crumb {
  name: string;
  /**
   * May be null/empty at runtime (content_pages.url_path is NULL on most
   * country pages); a template's own crumb passes contentPagePath(page).
   */
  path: string | null | undefined;
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
    // On the host the country mapping assigns (a country page's own crumb is
    // its ccTLD canonical), as breadcrumbJsonLd in seo.ts. A crumb without a
    // path gets no `item` rather than a URL ending in "null".
    itemListElement: items.map((c, i) => breadcrumbListItem(c.name, c.path, i + 1)),
  };
  // fresh-web only owns /, /p/*, /landing-page client-side. For any other
  // path (e.g. /public-pools served by another app via the nginx proxy), use
  // a plain <a> so the browser does a full navigation through the proxy.
  const isInternal = (p: string) => p === "/" || p.startsWith("/p/") || p.startsWith("/landing-page");
  // A crumb with no path renders as plain text, never a link to "null".
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
                ) : !c.path ? (
                  <span>{c.name}</span>
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
