import { createFileRoute, Link } from "@tanstack/react-router";
import { listServiceCategories } from "@/server/directory.functions";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { buildMeta, breadcrumbJsonLd, ldJsonScript } from "@/lib/seo";

export const Route = createFileRoute("/directory")({
  loader: () => listServiceCategories(),
  head: () => {
    const meta = buildMeta({
      title: "Pool Pros Directory — Builders, Cleaners, Repair & More",
      description:
        "The pool industry directory. Browse vetted pool builders, cleaners, repair pros, manufacturers, leak detectors, openers and resurfacing specialists across the US.",
      path: "/directory",
    });
    const crumbs = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Pool Pros Directory", path: "/directory" },
    ]);
    return { ...meta, scripts: [ldJsonScript(crumbs)] };
  },
  component: DirectoryHub,
});

function DirectoryHub() {
  const { categories } = Route.useLoaderData() as {
    categories: Array<{ slug: string; name: string; plural_name: string; intro_markdown: string | null; provider_count: number }>;
  };
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Pool Pros Directory</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Find the right pool pro for the job
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Builders, cleaners, repair specialists, manufacturers and seasonal pros — all in one place.
            Vetted, organized by category and city, and easy to contact directly.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              to="/directory/list"
              className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              List your business
            </Link>
            <Link
              to="/providers"
              className="inline-flex items-center rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:bg-muted/50"
            >
              Browse all providers
            </Link>
          </div>
        </header>

        <section className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Link
              key={c.slug}
              to="/directory/$category"
              params={{ category: c.slug }}
              className="group rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-semibold text-foreground group-hover:text-primary">{c.plural_name}</h2>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                  {c.provider_count}
                </span>
              </div>
              {c.intro_markdown && (
                <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                  {c.intro_markdown.replace(/\*\*/g, "")}
                </p>
              )}
              <span className="mt-4 inline-block text-sm font-medium text-primary">Browse {c.plural_name.toLowerCase()} →</span>
            </Link>
          ))}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
