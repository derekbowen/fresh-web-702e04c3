import { createFileRoute, Link, useRouter, notFound } from "@tanstack/react-router";
import { getBlogPost, getBlogLinkTargets } from "@/server/content.functions";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { Breadcrumbs } from "@/components/listing-card";
import { buildMeta, breadcrumbJsonLd, ldJsonScript, SITE_URL, SITE_NAME } from "@/lib/seo";
import { AutoLinkedContent, buildBlogLinkTargets } from "@/components/auto-linked-content";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const [{ post }, linkData] = await Promise.all([
      getBlogPost({ data: { slug: params.slug } }),
      getBlogLinkTargets(),
    ]);
    if (!post) throw notFound();
    return { post, linkTargets: buildBlogLinkTargets(linkData) };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData?.post) return {};
    const p = loaderData.post;
    const title = p.seo_title || `${p.title} | ${SITE_NAME} Blog`;
    const description = p.seo_description || p.excerpt || p.title;
    const meta = buildMeta({
      title,
      description: description.slice(0, 160),
      path: `/blog/${params.slug}`,
      image: p.cover_image_url,
      type: "article",
    });
    const article = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: p.title,
      description,
      image: p.cover_image_url ? [p.cover_image_url] : undefined,
      author: { "@type": "Person", name: p.author || SITE_NAME },
      datePublished: p.published_at || p.created_at,
      dateModified: p.updated_at,
      mainEntityOfPage: `${SITE_URL}/blog/${params.slug}`,
      publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    };
    const crumbs = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blog" },
      { name: p.title, path: `/blog/${params.slug}` },
    ]);
    return { ...meta, scripts: [ldJsonScript(article), ldJsonScript(crumbs)] };
  },
  component: BlogPostPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-muted-foreground">{error.message}</p>
          <button onClick={() => { router.invalidate(); reset(); }}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Retry</button>
        </main>
        <SiteFooter />
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">Post not found</h1>
        <Link to="/blog" className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Back to blog</Link>
      </main>
      <SiteFooter />
    </div>
  ),
});

function BlogPostPage() {
  const { post, linkTargets } = Route.useLoaderData();
  const params = Route.useParams();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs items={[
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: post.title, path: `/blog/${params.slug}` },
        ]}/>
        <article className="mt-6">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{post.title}</h1>
          <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
            {post.author && <span>By {post.author}</span>}
            {post.published_at && (
              <time dateTime={post.published_at}>
                {new Date(post.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </time>
            )}
          </div>
          {post.cover_image_url && (
            <div className="mt-8 aspect-video overflow-hidden rounded-2xl">
              <img src={post.cover_image_url} alt={post.title} className="h-full w-full object-cover"/>
            </div>
          )}
          {post.excerpt && (
            <p className="mt-8 text-lg text-muted-foreground">{post.excerpt}</p>
          )}
          {post.content && (
            <AutoLinkedContent
              text={post.content}
              targets={linkTargets}
              className="prose prose-lg mt-8 max-w-none whitespace-pre-line text-foreground"
            />
          )}
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
