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
      title: `Pool rental directory: every city, guide, and resource`,
      description:
        "Every US city with a private pool rental available. Browse 5,100+ pages of pool for rent listings, hourly bookings, $2M liability included.",
      path: "/p/all-locations",
    });
    return { meta: meta.meta, links: meta.links };
  },
  component: AllLocationsPage,
});

// Sentence-case overrides for server-supplied group titles so the page
// matches the workspace voice without mutating the data source.
const TITLE_OVERRIDES: Record<string, string> = {
  "host-acquisition": "Become a host by city",
  "swim-instructors": "Swim instructors by city",
  "event-guides": "Event and party pool guides",
  "money-guides": "Money and income guides",
  advocacy: "Pool rental laws and advocacy",
  resources: "Articles and resources",
  academy: "Host Academy and courses",
  "pool-maintenance": "Pool maintenance hub",
  spanish: "Guías en español",
  main: "Main pages",
  listings: "Active pool listings",
};

function displayTitle(g: DirectoryGroup): string {
  return TITLE_OVERRIDES[g.id] ?? g.title;
}

function AllLocationsPage() {
  const data = Route.useLoaderData();
  const cityCount =
    data.groups.find((g: DirectoryGroup) => g.id === "host-acquisition")?.links.length ?? 0;
  const academyCount =
    data.groups.find((g: DirectoryGroup) => g.id === "academy")?.links.length ?? 0;
  const sectionCount = data.groups.length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-background to-background">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
          />
          <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Pool near me
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Pool near me: every city and guide on Pool Rental Near Me
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
              Browse every city where you can find a pool for rent in the US. Every private pool rental city, host guide, course, and resource we publish. Built so you can find any page in two clicks and so search engines can crawl the whole site.
            </p>

            {/* Stat strip */}
            <dl className="mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Total URLs" value={data.totalUrls.toLocaleString()} />
              <Stat label="Cities" value={cityCount.toLocaleString()} />
              <Stat label="Courses" value={academyCount.toLocaleString()} />
              <Stat label="Sections" value={sectionCount.toLocaleString()} />
            </dl>

            <p className="mt-6 text-xs text-muted-foreground">
              Last updated{" "}
              {new Date(data.generatedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </section>

        {/* Sticky chip nav */}
        <div className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <div className="mx-auto max-w-6xl overflow-x-auto px-4 py-3">
            <nav
              aria-label="Jump to section"
              className="flex min-w-max items-center gap-2"
            >
              {data.groups.map((g: DirectoryGroup) => (
                <a
                  key={`top-${g.id}`}
                  href={`#${g.id}`}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground transition hover:border-primary hover:text-primary"
                >
                  {displayTitle(g)}
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {g.links.length.toLocaleString()}
                  </span>
                </a>
              ))}
            </nav>
          </div>
        </div>

        {/* Groups */}
        <div className="mx-auto max-w-6xl px-4 py-12">
          {data.groups.map((group: DirectoryGroup) => {
            const isAcademy = group.id === "academy";
            return (
              <section
                key={group.id}
                id={group.id}
                className="scroll-mt-24 border-b border-border py-10 last:border-b-0"
              >
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                  <div className="max-w-2xl">
                    {isAcademy && (
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                        Free for hosts
                      </p>
                    )}
                    <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                      {displayTitle(group)}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {group.description}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    {group.links.length.toLocaleString()} pages
                  </span>
                </div>

                <ul
                  className={
                    isAcademy
                      ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                      : "grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                  }
                >
                  {group.links.map((link: DirectoryLink) =>
                    isAcademy ? (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          className="group block h-full rounded-xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-sm"
                          title={link.label}
                        >
                          <span className="block text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
                            {link.label}
                          </span>
                          {link.sub && (
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {link.sub}
                            </span>
                          )}
                          <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
                            Start course →
                          </span>
                        </a>
                      </li>
                    ) : (
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
                    ),
                  )}
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
            );
          })}

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
                  {displayTitle(g)}{" "}
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 px-4 py-3 backdrop-blur">
      <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-2xl font-bold tracking-tight text-foreground">
        {value}
      </dd>
    </div>
  );
}
