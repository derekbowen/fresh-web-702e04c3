import { createFileRoute } from "@tanstack/react-router";
import { getAllLocations, type DirectoryGroup, type DirectoryLink } from "@/server/all-locations.functions";
import { getTopCities } from "@/server/top-cities.functions";
import { TopCitiesBlock } from "@/components/top-cities-block";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { buildMeta } from "@/lib/seo";

export const Route = createFileRoute("/p/all-locations")({
  loader: async () => {
    const [data, topCities] = await Promise.all([
      getAllLocations(),
      getTopCities({ data: { limit: 24 } }).catch(() => []),
    ]);
    return { ...data, topCities };
  },
  head: ({ loaderData }) => {
    const meta = buildMeta({
      title: `All Locations & Pages — ${loaderData?.totalUrls.toLocaleString() ?? ""} URLs | PRNM`,
      description:
        "Complete directory of every pool rental city, host guide, event guide, course, and resource on PoolRentalNearMe. Browse the full sitemap.",
      path: "/p/all-locations",
    });
    return { meta: meta.meta, links: meta.links };
  },
  component: AllLocationsPage,
});

function AllLocationsPage() {
  const data = Route.useLoaderData();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border bg-gradient-to-b from-muted/40 to-background">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Site Directory
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              All Locations & Pages
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              A complete, crawlable index of every page on PoolRentalNearMe —{" "}
              <strong className="text-foreground">
                {data.totalUrls.toLocaleString()}
              </strong>{" "}
              URLs across cities, host guides, event resources, courses, and
              live listings.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Last updated{" "}
              {new Date(data.generatedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>

            {/* Top jump nav */}
            <nav
              aria-label="Jump to section"
              className="mt-8 flex flex-wrap gap-2"
            >
              {data.groups.map((g: DirectoryGroup) => (
                <a
                  key={`top-${g.id}`}
                  href={`#${g.id}`}
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
                >
                  {g.title}{" "}
                  <span className="text-muted-foreground">
                    ({g.links.length.toLocaleString()})
                  </span>
                </a>
              ))}
            </nav>
          </div>
        </section>

        {/* Groups */}
        <div className="mx-auto max-w-6xl px-4 py-12">
          {data.groups.map((group: DirectoryGroup) => (
            <section
              key={group.id}
              id={group.id}
              className="scroll-mt-24 border-b border-border py-10 last:border-b-0"
            >
              <div className="mb-6 flex items-baseline justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    {group.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {group.description}
                  </p>
                </div>
                <span className="shrink-0 rounded-md bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                  {group.links.length.toLocaleString()} pages
                </span>
              </div>

              <ul className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {group.links.map((link: DirectoryLink) => (
                  <li key={link.href} className="leading-snug">
                    <a
                      href={link.href}
                      className="block truncate text-sm text-foreground hover:text-primary hover:underline"
                      title={link.label}
                    >
                      {link.label}
                    </a>
                    {link.sub && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {link.sub}
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <a
                  href="#top"
                  className="text-xs font-medium text-muted-foreground hover:text-primary"
                >
                  ↑ Back to top
                </a>
              </div>
            </section>
          ))}

          {/* Top cities reciprocal links */}
          <TopCitiesBlock cities={data.topCities} />

          {/* Bottom jump nav */}
          <section
            id="bottom-nav"
            aria-label="All sections"
            className="mt-12 rounded-2xl border border-border bg-muted/30 p-6"
          >
            <h2 className="text-lg font-semibold">Browse all sections</h2>
            <nav className="mt-4 flex flex-wrap gap-2">
              {data.groups.map((g: DirectoryGroup) => (
                <a
                  key={`bot-${g.id}`}
                  href={`#${g.id}`}
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
                >
                  {g.title}{" "}
                  <span className="text-muted-foreground">
                    ({g.links.length.toLocaleString()})
                  </span>
                </a>
              ))}
            </nav>
            <p className="mt-6 text-xs text-muted-foreground">
              Looking for the machine-readable version?{" "}
              <a
                href="/sitemap.xml"
                className="text-primary hover:underline"
              >
                View XML sitemap →
              </a>
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
