import { Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { Breadcrumbs } from "@/components/listing-card";
import { FaqBlock } from "@/components/faq-block";
import { faqsForContentPage } from "@/lib/page-faqs";
import { parseCitySlug, cityForContentPage } from "@/lib/city-slug";
import type { ContentPage } from "@/server/content-pages.functions";
import type { NearbyCity } from "@/server/nearby-cities.functions";

export function SwimInstructorCityTemplate({
  page,
  nearbyCities = [],
}: {
  page: ContentPage;
  nearbyCities?: NearbyCity[];
}) {
  const citySlug = cityForContentPage("swim_instructor_city", page.slug) || "";
  const { city, stateCode } = parseCitySlug(citySlug);
  const cityName = city || "your city";
  const where = stateCode ? `${cityName}, ${stateCode}` : cityName;
  const faqs = faqsForContentPage(page);
  const body = page.body_markdown || page.content || page.description || "";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-border bg-gradient-to-br from-primary/10 via-background to-accent/10 py-12 sm:py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <Breadcrumbs
              items={[
                { name: "Home", path: "/" },
                { name: "Swim instructor pool rentals", path: "/p/swim-instructor-pool-rental" },
                { name: where, path: page.url_path },
              ]}
            />
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              For swim instructors · {where}
            </div>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
              Rent a Pool to Teach Swim Lessons in {where}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{page.seo_description || page.description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/auth" className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:opacity-90">
                Find a {cityName} pool
              </a>
              <a href="/p/swim-instructor-pool-rental" className="inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-muted">
                Read the full instructor guide →
              </a>
            </div>
          </div>
        </section>

        <section className="border-b border-border py-12">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <p className="whitespace-pre-line text-base leading-relaxed text-foreground/90">{body}</p>

            <h2 className="mt-10 text-2xl font-bold text-foreground">Hourly pricing benchmarks in {cityName}</h2>
            <ul className="mt-4 space-y-2 text-foreground/90">
              <li>· <strong>Pool rental:</strong> $45–$120/hr depending on amenities & shade</li>
              <li>· <strong>Private 1-on-1 lesson rate:</strong> $65–$110 per 30-min session</li>
              <li>· <strong>Small-group (3–4 kids):</strong> $30–$45 per child per 45 min</li>
              <li>· <strong>Stroke clinics / adult triathlon:</strong> $40–$70 per swimmer per hour</li>
            </ul>

            <h2 className="mt-10 text-2xl font-bold text-foreground">What you need before your first {cityName} class</h2>
            <ul className="mt-4 space-y-2 text-foreground/90">
              <li>· <strong>Certification:</strong> Red Cross WSI, ASCA Level 1+, USA Swimming, or Starfish Aquatics</li>
              <li>· <strong>Insurance:</strong> $2M liability is included on every Pool Rental Near Me booking — bring your own professional liability policy on top</li>
              <li>· <strong>Equipment:</strong> kickboards, noodles, dive rings; some {cityName} hosts include them</li>
              <li>· <strong>Permission to instruct:</strong> filter for hosts who have "lessons / instruction allowed" enabled</li>
            </ul>
          </div>
        </section>

        <section className="border-b border-border bg-muted/20 py-12">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-semibold text-foreground">
              Keep exploring swim instructor pool rentals
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Start with the full guide, then compare instructor-friendly markets near {cityName}.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link
                to="/p/$slug"
                params={{ slug: "swim-instructor-pool-rental" }}
                className="block rounded-lg border border-primary/40 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10"
              >
                📘 Swim Instructor Pool Rental Guide →
              </Link>
              <a
                href="/auth"
                className="block rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
              >
                🏊 Browse {cityName} pools →
              </a>
            </div>

            {nearbyCities.length > 0 && (
              <>
                <h3 className="mt-8 text-base font-semibold text-foreground">
                  Top swim instructor markets near {cityName}
                </h3>
                <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                  {nearbyCities.slice(0, 5).map((c) => {
                    const slug = `swim-instructor-pool-rental-${c.slug}`;
                    const label =
                      c.state_code && !c.slug.endsWith(`-${c.state_code.toLowerCase()}`)
                        ? `${c.name}, ${c.state_code}`
                        : c.name;
                    return (
                      <li key={c.slug}>
                        <Link
                          to="/p/$slug"
                          params={{ slug }}
                          className="block rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
                          title={`Rent a pool to teach swim lessons in ${label}`}
                        >
                          Swim lessons in {label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <FaqBlock faqs={faqs} />
          </div>
        </section>

        <section className="bg-gradient-to-br from-primary/15 via-background to-accent/15 py-16">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Start teaching in {cityName} this week.</h2>
            <p className="mt-4 text-lg text-muted-foreground">Browse instructor-friendly pools, book by the hour, and run your class on your terms.</p>
            <div className="mt-6">
              <a href="/auth" className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-lg transition hover:opacity-90">
                Browse {cityName} pools
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
