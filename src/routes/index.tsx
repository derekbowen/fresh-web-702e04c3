import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { buildMeta, ldJsonScript, SITE_URL, SITE_NAME } from "@/lib/seo";

const getHomeData = createServerFn({ method: "GET" }).handler(async () => {
  const [cities, categories] = await Promise.all([
    supabaseAdmin
      .from("cities")
      .select("slug, name, state_code")
      .eq("is_published", true)
      .order("name")
      .limit(60),
    supabaseAdmin
      .from("categories")
      .select("slug, name, icon")
      .eq("is_published", true)
      .order("name"),
  ]);
  return { cities: cities.data ?? [], categories: categories.data ?? [] };
});

export const Route = createFileRoute("/")({
  loader: () => getHomeData(),
  head: () => {
    const meta = buildMeta({
      title: "Pool Rental Near Me — Rent a Private Pool by the Hour",
      description:
        "Find and book private pool rentals near you. Heated pools, hot tubs, and luxury backyards. Hourly bookings with $2M liability insurance included.",
      path: "/",
    });
    const org = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      sameAs: ["https://www.poolrentalnearme.com"],
    };
    return { ...meta, scripts: [ldJsonScript(org)] };
  },
  component: HomePage,
});

function HomePage() {
  const { cities, categories } = Route.useLoaderData();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Rent a private pool{" "}
                <span className="text-primary">by the hour</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
                Heated pools, hot tubs, and luxury backyards near you. Book
                instantly with $2M liability insurance included on every
                reservation.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="https://www.poolrentalnearme.com"
                  className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105"
                >
                  Find a pool near you
                </a>
                <a
                  href="https://www.poolrentalnearme.com/signup"
                  className="inline-flex items-center justify-center rounded-full border border-border bg-card px-6 py-3 text-base font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  List your pool
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        {categories.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Browse by category
            </h2>
            <p className="mt-2 text-muted-foreground">
              Find the perfect pool for your occasion.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {categories.map((c: { slug: string; name: string; icon: string | null }) => (
                <Link
                  key={c.slug}
                  to="/category/$slug"
                  params={{ slug: c.slug }}
                  className="group rounded-2xl border border-border bg-card p-5 text-center transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  {c.icon && (
                    <div className="text-3xl" aria-hidden="true">
                      {c.icon}
                    </div>
                  )}
                  <div className="mt-2 text-sm font-semibold text-foreground group-hover:text-primary">
                    {c.name}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Cities */}
        <section className="bg-secondary/20">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Pool rentals by city
            </h2>
            <p className="mt-2 text-muted-foreground">
              {cities.length}+ cities across the US.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {cities.map((c: { slug: string; name: string; state_code: string }) => (
                <Link
                  key={c.slug}
                  to="/pool-rental/$city"
                  params={{ city: c.slug }}
                  className="text-sm text-muted-foreground transition-colors hover:text-primary hover:underline"
                >
                  {c.name}, {c.state_code}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Trust */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { title: "$2M liability insurance", desc: "Every booking is covered for hosts and guests." },
              { title: "Instant booking", desc: "No waiting — confirm your reservation in seconds." },
              { title: "Verified hosts", desc: "Real photos, ratings, and reviews you can trust." },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-6">
                <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
