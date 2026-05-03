import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useState, useEffect } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { buildMeta, ldJsonScript, breadcrumbJsonLd, SITE_URL, SITE_NAME } from "@/lib/seo";
import { listBlogPostsPaged, listBlogTopics } from "@/server/content.functions";

const PAGE_SIZE = 12;

const TOPIC_LABELS: Record<string, { label: string; description: string }> = {
  hosting: { label: "Hosting Tips", description: "Make your pool a five-star rental." },
  "guest-guide": { label: "Guest Guide", description: "Everything renters should know." },
  "pool-care": { label: "Pool Care", description: "Maintenance, chemistry, and cleaning." },
  marketing: { label: "Marketing & Pricing", description: "Get more bookings, charge what you're worth." },
  safety: { label: "Safety", description: "Keep guests safe and your pool compliant." },
  seasonal: { label: "Seasonal", description: "Open, close, and winterize like a pro." },
};

function topicMeta(slug: string) {
  return TOPIC_LABELS[slug] ?? { label: slug.replace(/-/g, " "), description: "" };
}

const searchSchema = z.object({
  page: fallback(z.number().int().min(1).max(500), 1).default(1),
  topic: z.string().min(1).max(48).regex(/^[a-z0-9-]+$/).optional().catch(undefined),
  q: z.string().min(1).max(120).optional().catch(undefined),
});

export const Route = createFileRoute("/blog")({
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search }) => ({ page: search.page, topic: search.topic, q: search.q }),
  loader: async ({ deps }) => {
    const [posts, topicsRes] = await Promise.all([
      listBlogPostsPaged({ data: { page: deps.page, pageSize: PAGE_SIZE, topic: deps.topic, q: deps.q } }),
      listBlogTopics(),
    ]);
    return { ...posts, topics: topicsRes.topics };
  },
  head: ({ loaderData, params, match }) => {
    // match.search is fully typed via validateSearch
    const page = (match?.search as { page?: number } | undefined)?.page ?? 1;
    const topic = (match?.search as { topic?: string } | undefined)?.topic;
    const total = loaderData?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    void params;

    const topicLabel = topic ? topicMeta(topic).label : null;
    const baseTitle = topicLabel
      ? `${topicLabel} — Pool Rental Blog | ${SITE_NAME}`
      : `Pool Rental Blog — Tips for Hosts & Guests | ${SITE_NAME}`;
    const title = page > 1 ? `${baseTitle} (Page ${page})` : baseTitle;
    const baseDesc = topic
      ? `${topicMeta(topic).description} Browse expert articles on ${topicLabel?.toLowerCase()}.`
      : "Tips, guides, and insights on renting and hosting private pools — from pool care to marketing to seasonal maintenance.";
    const description = page > 1 ? `${baseDesc} Page ${page} of ${totalPages}.` : baseDesc;

    const queryStr = (p: number) => {
      const parts: string[] = [];
      if (topic) parts.push(`topic=${topic}`);
      if (p > 1) parts.push(`page=${p}`);
      return parts.length ? `?${parts.join("&")}` : "";
    };
    const path = `/blog${queryStr(page)}`;
    // Canonical: page 1 of a topic = /blog?topic=X (no page); otherwise current
    const canonicalPath = `/blog${queryStr(page)}`;
    const prevPath = page > 1 ? `/blog${queryStr(page - 1)}` : null;
    const nextPath = page < totalPages ? `/blog${queryStr(page + 1)}` : null;

    const meta = buildMeta({
      title,
      description,
      path,
      canonicalPath,
      type: "website",
      prevPath,
      nextPath,
      noindex: page > totalPages,
    });

    const breadcrumbs = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blog" },
      ...(topic ? [{ name: topicLabel ?? topic, path: `/blog?topic=${topic}` }] : []),
    ]);

    const itemList = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: (loaderData?.posts ?? []).map((p, i) => ({
        "@type": "ListItem",
        position: (page - 1) * PAGE_SIZE + i + 1,
        url: `${SITE_URL}/blog/${p.slug}`,
        name: p.title,
      })),
    };

    return {
      ...meta,
      scripts: [ldJsonScript(breadcrumbs), ldJsonScript(itemList)],
    };
  },
  component: BlogIndex,
});

function BlogIndex() {
  const { posts, total, page, topic, q, topics } = Route.useLoaderData();
  const navigate = useNavigate({ from: "/blog" });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const activeTopic = topic ?? null;
  const activeQuery = q ?? "";
  const activeMeta = activeTopic ? topicMeta(activeTopic) : null;

  const [queryInput, setQueryInput] = useState(activeQuery);
  useEffect(() => {
    setQueryInput(activeQuery);
  }, [activeQuery]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = queryInput.trim();
    navigate({
      search: (prev: any) => ({ ...prev, page: 1, q: trimmed.length ? trimmed : undefined }),
    });
  };

  const clearSearch = () => {
    setQueryInput("");
    navigate({ search: (prev: any) => ({ ...prev, page: 1, q: undefined }) });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/blog" className="hover:text-foreground">Blog</Link>
          {activeMeta && (<><span className="mx-2">/</span><span className="text-foreground">{activeMeta.label}</span></>)}
        </nav>

        <header className="max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {activeMeta ? activeMeta.label : "Pool Rental Blog"}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            {activeMeta?.description ||
              "Tips, guides, and stories from the Pool Rental Near Me community — covering hosting, pool care, pricing, and more."}
          </p>
        </header>

        {/* Search bar */}
        <form onSubmit={submitSearch} role="search" className="mt-8 flex w-full max-w-xl items-center gap-2">
          <div className="relative flex-1">
            <input
              type="search"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Search posts (e.g., green water, leaks, pricing)…"
              aria-label="Search blog posts"
              className="w-full rounded-full border border-border bg-background px-5 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {queryInput && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            )}
          </div>
          <button
            type="submit"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Search
          </button>
        </form>

        {activeQuery && (
          <p className="mt-3 text-sm text-muted-foreground">
            {total} result{total === 1 ? "" : "s"} for{" "}
            <span className="font-semibold text-foreground">"{activeQuery}"</span>
            {activeMeta ? <> in <span className="font-semibold text-foreground">{activeMeta.label}</span></> : null}
            {" · "}
            <button onClick={clearSearch} className="underline hover:text-foreground">clear</button>
          </p>
        )}

        {/* Topic filter pills */}
        <div className="mt-6 flex flex-wrap gap-2" role="navigation" aria-label="Browse by topic">
          <Link
            to="/blog"
            search={(prev: any) => ({ ...prev, page: 1, topic: undefined })}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              !activeTopic
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:border-primary/50"
            }`}
          >
            All posts
          </Link>
          {topics.map((t: { slug: string; count: number }) => {
            const meta = topicMeta(t.slug);
            const active = activeTopic === t.slug;
            return (
              <Link
                key={t.slug}
                to="/blog"
                search={(prev: any) => ({ ...prev, page: 1, topic: t.slug })}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:border-primary/50"
                }`}
              >
                {meta.label} <span className="ml-1 opacity-70">({t.count})</span>
              </Link>
            );
          })}
        </div>


        {/* Posts grid */}
        <section className="mt-10">
          {posts.length === 0 ? (
            <p className="text-muted-foreground">No posts found{activeTopic ? " in this topic" : ""}.</p>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p: { slug: string; title: string; excerpt: string | null; cover_image_url: string | null; published_at: string | null; topic: string | null }) => {
                const tMeta = p.topic ? topicMeta(p.topic) : null;
                return (
                  <article key={p.slug} className="group">
                    <Link to="/blog/$slug" params={{ slug: p.slug }} className="block">
                      <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
                        {p.cover_image_url ? (
                          <img
                            src={p.cover_image_url}
                            alt={p.title}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5" />
                        )}
                      </div>
                      <h2 className="mt-4 text-xl font-semibold text-foreground group-hover:text-primary">
                        {p.title}
                      </h2>
                      {p.excerpt && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{p.excerpt}</p>
                      )}
                    </Link>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      {p.published_at && (
                        <time dateTime={p.published_at}>
                          {new Date(p.published_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </time>
                      )}
                      {tMeta && (
                        <>
                          <span>·</span>
                          <Link
                            to="/blog"
                            search={(prev: any) => ({ ...prev, page: 1, topic: p.topic ?? undefined })}
                            className="hover:text-primary"
                          >
                            {tMeta.label}
                          </Link>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="mt-12 flex items-center justify-between" aria-label="Pagination">
            <Link
              to="/blog"
              search={(prev: any) => ({ ...prev, page: Math.max(1, page - 1) })}
              disabled={page <= 1}
              className={`rounded-md border px-4 py-2 text-sm font-medium ${
                page <= 1
                  ? "pointer-events-none border-border text-muted-foreground opacity-50"
                  : "border-border text-foreground hover:border-primary"
              }`}
              rel="prev"
            >
              ← Previous
            </Link>
            <p className="text-sm text-muted-foreground">
              Page <span className="font-semibold text-foreground">{page}</span> of{" "}
              <span className="font-semibold text-foreground">{totalPages}</span>
            </p>
            <Link
              to="/blog"
              search={(prev: any) => ({ ...prev, page: Math.min(totalPages, page + 1) })}
              disabled={page >= totalPages}
              className={`rounded-md border px-4 py-2 text-sm font-medium ${
                page >= totalPages
                  ? "pointer-events-none border-border text-muted-foreground opacity-50"
                  : "border-border text-foreground hover:border-primary"
              }`}
              rel="next"
            >
              Next →
            </Link>
          </nav>
        )}

        {/* Suppress unused warning */}
        <span className="hidden">{typeof navigate}</span>
      </main>
      <SiteFooter />
    </div>
  );
}
