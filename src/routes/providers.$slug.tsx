import { createFileRoute, Link, useRouter, notFound } from "@tanstack/react-router";
import { getProvider } from "@/server/content.functions";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { Breadcrumbs } from "@/components/listing-card";
import { ClaimListingCTA, JoinNetworkForm } from "@/components/recruit-forms";
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
    const title = p.seo_title || `${p.name} — Pool Services in ${p.city ?? ""}`.trim();
    const description = p.seo_description || p.description || `Learn about ${p.name}, a pool service provider.`;
    const meta = buildMeta({
      title,
      description: description.slice(0, 160),
      path: `/providers/${params.slug}`,
      image: p.hero_image_url || p.logo_url,
    });
    const business = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: p.name,
      url: `${SITE_URL}/providers/${params.slug}`,
      ...(p.website_url && { sameAs: [p.website_url] }),
      ...(p.phone && { telephone: p.phone }),
      ...(p.email && { email: p.email }),
      ...(p.logo_url && { logo: p.logo_url }),
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
    return { ...meta, scripts: [ldJsonScript(business), ldJsonScript(crumbs)] };
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
  const stateCode = (provider.state_code as string | null)?.toLowerCase() ?? null;
  const citySlug = (provider as { city_slug?: string | null }).city_slug ?? null;
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs items={[
          { name: "Home", path: "/" },
          { name: "Pool Builders", path: "/pool-builders" },
          ...(stateCode ? [{ name: provider.state_code as string, path: `/pool-builders/${stateCode}` }] : []),
          ...(stateCode && citySlug && provider.city ? [{ name: provider.city as string, path: `/pool-builders/${stateCode}/${citySlug}` }] : []),
          { name: provider.name, path: `/providers/${params.slug}` },
        ]}/>
        <header className="mt-6 flex items-start gap-6">
          {provider.logo_url && (
            <img src={provider.logo_url} alt={provider.name} className="h-20 w-20 rounded-xl object-cover" />
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{provider.name}</h1>
            {(provider.city || provider.state_code) && (
              <p className="mt-1 text-muted-foreground">
                {stateCode && citySlug && provider.city ? (
                  <Link to="/pool-builders/$state/$city" params={{ state: stateCode, city: citySlug }} className="hover:text-primary">
                    {provider.city}, {provider.state_code}
                  </Link>
                ) : (
                  [provider.city, provider.state_code].filter(Boolean).join(", ")
                )}
              </p>
            )}
            {typeof provider.rating === "number" && (
              <p className="mt-1 text-sm text-muted-foreground">★ {provider.rating} {provider.rating_count ? `(${provider.rating_count} reviews)` : ""}</p>
            )}
            {provider.business_type && (
              <span className="mt-2 inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                {provider.business_type}
              </span>
            )}
          </div>
        </header>

        <div className="mt-6">
          <ClaimListingCTA providerSlug={params.slug} providerName={provider.name} />
        </div>

        {provider.hero_image_url && (
          <div className="mt-8 aspect-video overflow-hidden rounded-2xl">
            <img src={provider.hero_image_url} alt={provider.name} className="h-full w-full object-cover"/>
          </div>
        )}

        {provider.description && (
          <div className="prose prose-sm mt-8 max-w-none whitespace-pre-line text-foreground">
            {provider.description}
          </div>
        )}

        {Array.isArray(provider.services) && provider.services.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-semibold text-foreground">Services</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {provider.services.map((s: string) => (
                <li key={s} className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">{s}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-10 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Contact</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {provider.address && <li className="text-muted-foreground">{provider.address}</li>}
            {provider.website_url && <li><a href={provider.website_url} target="_blank" rel="noreferrer noopener" className="text-primary hover:underline">{provider.website_url}</a></li>}
            {provider.phone && <li>Phone: <a href={`tel:${provider.phone}`} className="text-primary hover:underline">{provider.phone}</a></li>}
            {provider.email && <li>Email: <a href={`mailto:${provider.email}`} className="text-primary hover:underline">{provider.email}</a></li>}
          </ul>
        </section>

        <section className="mt-12">
          <JoinNetworkForm
            heading="Are you a pool pro or pool owner?"
            subheading="Get listed on Pool Rental Near Me — free directory plus pool-rental income for hosts."
            defaultCity={provider.city ?? ""}
            defaultState={provider.state_code ?? ""}
            sourceProviderSlug={params.slug}
            sourcePath={`/providers/${params.slug}`}
          />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
