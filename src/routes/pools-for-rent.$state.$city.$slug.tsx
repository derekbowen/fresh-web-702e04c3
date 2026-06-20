import * as React from "react";
import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { MapPin, Users, Droplets, Ruler, Waves, ShieldCheck, Star, Check } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { resolvePoolBySlug } from "@/lib/pool-listing.functions";
import { buildMeta, breadcrumbJsonLd, ldJsonScript, SITE_URL, SITE_NAME } from "@/lib/seo";

const MARKETPLACE_ORIGIN = "https://www.poolrentalnearme.com";

export const Route = createFileRoute("/pools-for-rent/$state/$city/$slug")({
  loader: async ({ params }) => {
    const resolved = await resolvePoolBySlug({
      data: { state: params.state, city: params.city, slug: params.slug },
    });
    if (!resolved) throw notFound();
    return resolved;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { listing: l, canonicalPath } = loaderData;
    const loc = [l.city, l.state].filter(Boolean).join(", ");
    const title = `${l.title}${loc ? ` in ${loc}` : ""} — Pool to Rent by the Hour | ${SITE_NAME}`;
    const desc = (
      l.description ||
      `Rent ${l.title}${loc ? ` in ${loc}` : ""} by the hour. ${l.guests ? `Up to ${l.guests} guests. ` : ""}$2M liability insurance included.`
    )
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160);
    const canonicalUrl = `${SITE_URL}${canonicalPath}`;

    const product: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: l.title,
      description: desc,
      image: l.images.length ? l.images.slice(0, 6) : l.heroImage ? [l.heroImage] : undefined,
      url: canonicalUrl,
      brand: { "@type": "Brand", name: SITE_NAME },
      category: "Pool rental",
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        price: l.pricePerHour.toFixed(2),
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: l.pricePerHour.toFixed(2),
          priceCurrency: "USD",
          unitCode: "HUR",
          referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "HUR" },
        },
        availability: "https://schema.org/InStock",
        url: canonicalUrl,
        ...(loc ? { areaServed: { "@type": "City", name: loc } } : {}),
      },
    };
    // NOTE: aggregateRating / review are deliberately OMITTED. Google requires
    // review markup to reflect genuine reviews shown on the page; these pools
    // have none yet, and faking it triggers manual penalties. Stars get wired in
    // once a real Marketplace-API review feed is attached per listing.

    const amenityProps = [
      ...l.poolAmenities.map((a) => ({ "@type": "PropertyValue", name: a })),
      ...l.amenities.map((a) => ({ "@type": "PropertyValue", name: a.name })),
    ];
    if (amenityProps.length) product.additionalProperty = amenityProps;

    const meta = buildMeta({
      title,
      description: desc,
      path: canonicalPath,
      canonicalPath,
      image: l.heroImage,
      type: "product",
    });
    const crumbs = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Pools for rent", path: "/s" },
      ...(loc ? [{ name: loc, path: "/s" }] : []),
      { name: l.title, path: canonicalPath },
    ]);
    return { ...meta, scripts: [ldJsonScript(product), ldJsonScript(crumbs)] };
  },
  component: PoolPage,
  notFoundComponent: PoolNotFound,
});

function PoolPage() {
  const { listing: l } = Route.useLoaderData();
  const loc = [l.city, l.state].filter(Boolean).join(", ");
  const bookUrl = `${MARKETPLACE_ORIGIN}${l.bookUrl}`;
  const gallery = l.images.length ? l.images : l.heroImage ? [l.heroImage] : [];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <nav className="text-sm text-slate-500">
          <Link to="/" className="hover:text-cyan-700">Home</Link>
          <span className="px-1.5">/</span>
          <Link to="/s" className="hover:text-cyan-700">Pools for rent</Link>
          {loc && <><span className="px-1.5">/</span><span className="text-slate-700">{loc}</span></>}
        </nav>

        {/* Gallery */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-1.5 rounded-2xl overflow-hidden sm:h-[420px]">
          <div className="relative sm:col-span-2 sm:row-span-2 aspect-[4/3] sm:aspect-auto bg-slate-100">
            {gallery[0] ? (
              <img src={gallery[0]} alt={l.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300"><Waves className="w-12 h-12" /></div>
            )}
            <div className="absolute bottom-3 left-3 px-4 py-2 bg-cyan-600 rounded-lg shadow-md">
              <span className="text-white font-bold text-lg">${l.pricePerHour}</span>
              <span className="text-white/80 text-sm"> /hr</span>
            </div>
          </div>
          {gallery.slice(1, 5).map((src, i) => (
            <div key={i} className="relative hidden sm:block bg-slate-100">
              <img src={src} alt={`${l.title} photo ${i + 2}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col lg:flex-row gap-10">
          <div className="flex-1 space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{l.title}</h1>
              {loc && (
                <p className="mt-1.5 flex items-center gap-1.5 text-slate-500">
                  <MapPin className="w-4 h-4 text-cyan-600" />{loc}
                </p>
              )}
              <div className="flex flex-wrap gap-3 mt-4">
                {l.guests != null && (
                  <Stat icon={Users} label={`Up to ${l.guests} guests`} />
                )}
                {l.poolDepth && <Stat icon={Ruler} label={`${l.poolDepth} deep`} />}
                {l.waterType && <Stat icon={Droplets} label={l.waterType} />}
                {l.poolSize && <Stat icon={Ruler} label={l.poolSize} />}
              </div>
            </div>

            <hr className="border-slate-100" />

            {l.description && (
              <section>
                <h2 className="text-lg font-bold text-slate-800">About this pool</h2>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed whitespace-pre-line">{l.description}</p>
              </section>
            )}

            {l.poolAmenities.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-slate-800">Amenities</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {l.poolAmenities.map((a) => (
                    <span key={a} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50 rounded-full text-sm text-slate-700">
                      <Check className="w-3.5 h-3.5 text-cyan-600" />{a}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {l.amenities.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-slate-800">Add-ons available</h2>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {l.amenities.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{a.name}</p>
                        {a.description && <p className="text-xs text-slate-400 mt-0.5">{a.description}</p>}
                      </div>
                      {a.priceCents > 0 && <span className="text-sm font-bold text-cyan-600">+${Math.round(a.priceCents / 100)}</span>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {l.houseRules.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-slate-800">House rules</h2>
                <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-slate-600">
                  {l.houseRules.map((r) => <li key={r} className="flex items-start gap-2"><span className="text-cyan-600">•</span>{r}</li>)}
                </ul>
              </section>
            )}
          </div>

          {/* Booking sidebar — hands off to Sharetribe checkout (ecosystem + tracking intact) */}
          <aside className="lg:w-[360px] flex-shrink-0">
            <div className="lg:sticky lg:top-20 border border-slate-200 rounded-2xl p-6 shadow-lg bg-white">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-900">${l.pricePerHour}</span>
                <span className="text-slate-500">/ hour</span>
              </div>
              <a
                href={bookUrl}
                className="mt-5 w-full inline-flex items-center justify-center rounded-xl py-3.5 text-base font-bold bg-cyan-500 text-white hover:bg-cyan-600 active:scale-[0.98] shadow-lg shadow-cyan-200 transition-all"
              >
                Book this pool
              </a>
              <ul className="mt-5 space-y-2 text-sm text-slate-500">
                <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-cyan-600" />$2M liability insurance included</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-600" />Instant booking confirmation</li>
                <li className="flex items-center gap-2"><Star className="w-4 h-4 text-cyan-600" />Hourly rentals — flexible</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-sm text-slate-600">
      <Icon className="w-4 h-4 text-cyan-600" />{label}
    </span>
  );
}

function PoolNotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-20 text-center flex-1">
        <h1 className="text-3xl font-bold text-slate-900">Pool not found</h1>
        <p className="mt-2 text-slate-500">This listing is no longer available.</p>
        <Link to="/s" className="mt-6 inline-flex rounded-full bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white">
          Browse all pools
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
