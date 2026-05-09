import { Link } from "@tanstack/react-router";
import type { RelatedPostMeta } from "@/server/blog-enrichment.functions";

function normalizeTopic(t: string | null): string {
  if (!t) return "Related";
  return t
    .replace(/[-_]+/g, " ")
    .trim()
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

export function RelatedPostsCard({ posts }: { posts: RelatedPostMeta[] }) {
  if (!posts || posts.length === 0) return null;
  return (
    <section className="not-prose mt-16 border-t border-border pt-10" aria-label="Related posts">
      <h2 className="text-2xl font-semibold tracking-tight">Related posts</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        More from the {normalizeTopic(posts[0]?.topic ?? null)} library.
      </p>
      <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.slice(0, 6).map((p) => (
          <li key={p.slug} className="group overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md">
            <Link to="/p/$slug" params={{ slug: p.slug }} className="block">
              {p.cover_image_url ? (
                <img
                  src={p.cover_image_url}
                  alt=""
                  loading="lazy"
                  className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="aspect-video w-full bg-muted" />
              )}
              <div className="p-4">
                {p.topic ? (
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {normalizeTopic(p.topic)}
                  </p>
                ) : null}
                <h3 className="mt-1 text-base font-semibold leading-snug group-hover:text-primary">
                  {p.title}
                </h3>
                {p.excerpt ? (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {p.excerpt}
                  </p>
                ) : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function InlineRelatedCallout({ posts }: { posts: RelatedPostMeta[] }) {
  if (!posts || posts.length === 0) return null;
  const top = posts.slice(0, 2);
  return (
    <aside
      className="not-prose my-10 rounded-xl border-l-4 border-primary bg-muted/40 p-5"
      aria-label="Keep reading"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Keep reading</p>
      <ul className="mt-2 space-y-1.5">
        {top.map((p) => (
          <li key={p.slug}>
            <Link
              to="/p/$slug"
              params={{ slug: p.slug }}
              className="text-base font-medium text-foreground hover:text-primary hover:underline"
            >
              {p.title} →
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
