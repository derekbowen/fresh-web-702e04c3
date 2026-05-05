import { createFileRoute, Link, useRouter, notFound } from "@tanstack/react-router";
import { getProvider } from "@/server/content.functions";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { Breadcrumbs } from "@/components/listing-card";
import { ClaimListingCTA, JoinNetworkForm } from "@/components/recruit-forms";
import { ProviderPlanBadges } from "@/components/provider-plan-badges";
import { buildMeta, breadcrumbJsonLd, ldJsonScript, SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/providers/$slug")({
  loader: async ({ params }) => {
    const { provider } = await getProvider({ data: { slug: params.slug } });
    if (!provider) throw notFound();
    return { provider };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData?.provider) return {};
    const p = loaderData.provider;
    const title = p.seo_title || `${p.name}${p.city ? ` — Pool Services in ${p.city}, ${p.state_code}` : ""}`.trim();
    const description = p.seo_description || (p.long_description?.slice(0, 160)) || p.description || `Learn about ${p.name}, a pool service provider.`;
    const meta = buildMeta({
      title,
      description: description.slice(0, 160),
      path: `/providers/${params.slug}`,
      image: p.hero_image_url || p.logo_url,
    });
    const business: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: p.name,
      url: `${SITE_URL}/providers/${params.slug}`,
      ...(p.website_url && { sameAs: [p.website_url] }),
      ...(p.phone && { telephone: p.phone }),
      ...(p.email && { email: p.email }),
      ...(p.logo_url && { logo: p.logo_url }),
      ...(p.hero_image_url && { image: p.hero_image_url }),
      ...(typeof p.rating === "number" && { aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.rating_count ?? 1 } }),
      ...(p.city && p.state_code && {
        address: { "@type": "PostalAddress", addressLocality: p.city, addressRegion: p.state_code, addressCountry: "US" },
      }),
    };
    const stateCode = (p.state_code as string | null)?.toLowerCase();
    const citySlug = (p as { city_slug?: string | null }).city_slug ?? null;
    const crumbs = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Pool Builders", path: "/pool-builders" },
      ...(stateCode ? [{ name: p.state_code as string, path: `/pool-builders/${stateCode}` }] : []),
      ...(stateCode && citySlug && p.city ? [{ name: p.city as string, path: `/pool-builders/${stateCode}/${citySlug}` }] : []),
      { name: p.name, path: `/providers/${params.slug}` },
    ]);
    const scripts: any[] = [ldJsonScript(business), ldJsonScript(crumbs)];
    const faqArr = Array.isArray((p as any).faq) ? (p as any).faq : [];
    if (faqArr.length) {
      scripts.push(ldJsonScript({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqArr.map((f: any) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      }));
    }
    return { ...meta, scripts };
  },
  component: ProviderPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-muted-foreground">{error.message}</p>
          <button onClick={() => { router.invalidate(); reset(); }}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            Retry
          </button>
        </main>
        <SiteFooter />
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">Provider not found</h1>
        <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Home</Link>
      </main>
      <SiteFooter />
    </div>
  ),
});

function ProviderPage() {
  const { provider } = Route.useLoaderData();
  const params = Route.useParams();
  const p = provider as any;
  const stateCode = (p.state_code as string | null)?.toLowerCase() ?? null;
  const citySlug = p.city_slug ?? null;
  const gallery: string[] = Array.isArray(p.gallery_urls) ? p.gallery_urls.filter(Boolean) : [];
  const faq: Array<{ question: string; answer: string }> = Array.isArray(p.faq) ? p.faq : [];
  const services: string[] = Array.isArray(p.services) ? p.services : [];
  const heroBg = p.hero_image_url || p.logo_url;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          {heroBg && (
            <div className="absolute inset-0">
              <img src={heroBg} alt="" className="h-full w-full object-cover opacity-25" />
              <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
            </div>
          )}
          <div className="relative mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <Breadcrumbs items={[
              { name: "Home", path: "/" },
              { name: "Pool Builders", path: "/pool-builders" },
              ...(stateCode ? [{ name: p.state_code as string, path: `/pool-builders/${stateCode}` }] : []),
              ...(stateCode && citySlug && p.city ? [{ name: p.city as string, path: `/pool-builders/${stateCode}/${citySlug}` }] : []),
              { name: p.name, path: `/providers/${params.slug}` },
            ]}/>
            <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end">
              {p.logo_url && (
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-lg sm:h-28 sm:w-28">
                  <img src={p.logo_url} alt={p.name} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <ProviderPlanBadges p={p} className="mb-3" />
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">{p.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {(p.city || p.state_code) && (
                    <span>📍 {stateCode && citySlug && p.city ? (
                      <Link to="/pool-builders/$state/$city" params={{ state: stateCode, city: citySlug }} className="hover:text-primary">{p.city}, {p.state_code}</Link>
                    ) : ([p.city, p.state_code].filter(Boolean).join(", "))}</span>
                  )}
                  {typeof p.rating === "number" && (
                    <span>★ {p.rating}{p.rating_count ? ` · ${p.rating_count} reviews` : ""}</span>
                  )}
                  {p.business_type && <span>• {p.business_type}</span>}
                  {p.primary_category && <span>• {p.primary_category}</span>}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {p.phone && <a href={`tel:${p.phone}`} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:opacity-90">📞 {p.phone}</a>}
                  {p.website_url && <a href={p.website_url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:bg-secondary">Visit website</a>}
                  {p.email && <a href={`mailto:${p.email}`} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:bg-secondary">Email</a>}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            {/* Main */}
            <div className="min-w-0 space-y-10">
              {gallery.length > 0 && (
                <section>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {gallery.slice(0, 6).map((src) => (
                      <div key={src} className="aspect-square overflow-hidden rounded-xl bg-muted">
                        <img src={src} alt="" loading="lazy" className="h-full w-full object-cover transition hover:scale-105" />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h2 className="text-2xl font-bold tracking-tight">About {p.name}</h2>
                {p.long_description ? (
                  <div className="prose prose-sm mt-4 max-w-none whitespace-pre-line text-foreground/90">
                    {p.long_description}
                  </div>
                ) : p.description ? (
                  <p className="mt-4 whitespace-pre-line text-foreground/90">{p.description}</p>
                ) : (
                  <p className="mt-4 text-muted-foreground">More information about this provider is coming soon.</p>
                )}
              </section>

              {services.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold tracking-tight">Services</h2>
                  <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {services.map((s) => (
                      <li key={s} className="flex items-start gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
                        <span className="text-primary">✓</span>{s}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {faq.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold tracking-tight">Frequently asked questions</h2>
                  <div className="mt-4 space-y-3">
                    {faq.map((f, i) => (
                      <details key={i} className="group rounded-xl border border-border bg-card p-4">
                        <summary className="cursor-pointer list-none font-semibold text-foreground">
                          <span className="mr-2 inline-block transition group-open:rotate-90">›</span>{f.question}
                        </summary>
                        <p className="mt-2 pl-5 text-sm text-foreground/80">{f.answer}</p>
                      </details>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <ClaimListingCTA providerSlug={params.slug} providerName={p.name} />
              </section>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Contact</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {p.address && <li className="text-foreground/90">📍 {p.address}</li>}
                  {p.phone && <li>📞 <a href={`tel:${p.phone}`} className="text-primary hover:underline">{p.phone}</a></li>}
                  {p.email && <li>✉️ <a href={`mailto:${p.email}`} className="text-primary hover:underline">{p.email}</a></li>}
                  {p.website_url && <li>🔗 <a href={p.website_url} target="_blank" rel="noreferrer noopener" className="text-primary hover:underline">Website</a></li>}
                </ul>
              </div>
              {(p.city && p.state_code) && (
                <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-secondary p-5">
                  <h3 className="text-sm font-bold uppercase tracking-wide">Rent your pool</h3>
                  <p className="mt-2 text-sm text-foreground/80">List your pool in {p.city} and earn $40–$150/hr.</p>
                  <a href="/l/draft/00000000-0000-0000-0000-000000000000/new/details"
                    className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
                    List a pool
                  </a>
                </div>
              )}
            </aside>
          </div>

          <section className="mt-12">
            <JoinNetworkForm
              heading="Are you a pool pro or pool owner?"
              subheading="Get listed on Pool Rental Near Me — free directory plus pool-rental income for hosts."
              defaultCity={p.city ?? ""}
              defaultState={p.state_code ?? ""}
              sourceProviderSlug={params.slug}
              sourcePath={`/providers/${params.slug}`}
            />
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
