import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  listPublishedBlogPosts,
  type BlogHubPost,
} from "@/server/blog-posts.functions";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { buildMeta, SITE_URL, SITE_NAME } from "@/lib/seo";

export const Route = createFileRoute("/p/blog")({
  loader: async () => {
    const { posts } = await listPublishedBlogPosts();
    return { posts };
  },
  head: () => ({
    meta: buildMeta({
      title: "Pool rental blog — guides for hosts and guests",
      description:
        "Articles on pool care, hosting, marketing, safety, and pool party ideas from Pool Rental Near Me.",
      path: "/p/blog",
      type: "website",
    }),
  }),
  component: BlogHubPage,
});

function normalizeTopic(t: string | null): string {
  if (!t) return "Other";
  const cleaned = t.replace(/[-_]+/g, " ").trim();
  return cleaned
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

function BlogHubPage() {
  const { posts } = Route.useLoaderData() as { posts: BlogHubPost[] };

  const grouped = useMemo(() => {
    const map = new Map<string, BlogHubPost[]>();
    for (const p of posts) {
      const key = normalizeTopic(p.topic);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [posts]);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Pool Rental Near Me — Blog",
    itemListElement: posts.slice(0, 100).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/p/${p.slug}`,
      name: p.title,
    })),
  };

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <header className="mb-10 border-b border-border pb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {SITE_NAME}
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Blog</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Practical guides for pool owners, hosts, and renters. Pool care,
            hosting tips, marketing, safety, and party ideas.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {posts.length.toLocaleString()} posts across {grouped.length}{" "}
            categories.
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="text-muted-foreground">No posts yet — check back soon.</p>
        ) : (
          <div className="space-y-12">
            {grouped.map(([topic, list]) => (
              <section key={topic}>
                <h2 className="mb-4 text-2xl font-semibold">
                  {topic}{" "}
                  <span className="text-base font-normal text-muted-foreground">
                    ({list.length})
                  </span>
                </h2>
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((p) => (
                    <li
                      key={p.slug}
                      className="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary"
                    >
                      <Link
                        to="/p/$slug"
                        params={{ slug: p.slug }}
                        className="block"
                      >
                        {p.cover_image_url ? (
                          <img
                            src={p.cover_image_url}
                            alt=""
                            loading="lazy"
                            className="mb-3 aspect-video w-full rounded-md object-cover"
                          />
                        ) : null}
                        <h3 className="font-semibold leading-snug group-hover:text-primary">
                          {p.title}
                        </h3>
                        {p.excerpt ? (
                          <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                            {p.excerpt}
                          </p>
                        ) : null}
                        <p className="mt-3 text-xs text-muted-foreground">
                          Read article →
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
    </>
  );
}
