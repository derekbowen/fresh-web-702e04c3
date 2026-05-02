import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { buildMeta } from "@/lib/seo";

const listBlogPosts = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await supabaseAdmin
    .from("blog_posts")
    .select("slug, title, excerpt, cover_image_url, published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(50);
  return { posts: data ?? [] };
});

export const Route = createFileRoute("/blog")({
  loader: () => listBlogPosts(),
  head: () => buildMeta({
    title: "Pool Rental Blog — Tips for Hosts & Guests | Pool Rental Near Me",
    description: "Tips, guides, and insights on renting and hosting private pools. From pool care to maximizing bookings.",
    path: "/blog",
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const { posts } = Route.useLoaderData();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Blog</h1>
        <p className="mt-3 text-lg text-muted-foreground">Tips, guides, and stories from the Pool Rental Near Me community.</p>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.length === 0 && <p className="text-muted-foreground">No posts yet.</p>}
          {posts.map((p: { slug: string; title: string; excerpt: string | null; cover_image_url: string | null; published_at: string | null }) => (
            <Link key={p.slug} to="/blog/$slug" params={{ slug: p.slug }} className="group block">
              <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
                {p.cover_image_url ? (
                  <img src={p.cover_image_url} alt={p.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"/>
                ) : <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5"/>}
              </div>
              <h2 className="mt-4 text-xl font-semibold text-foreground group-hover:text-primary">{p.title}</h2>
              {p.excerpt && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{p.excerpt}</p>}
              {p.published_at && (
                <time className="mt-2 block text-xs text-muted-foreground" dateTime={p.published_at}>
                  {new Date(p.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </time>
              )}
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
