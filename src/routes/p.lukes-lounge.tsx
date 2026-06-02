import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import lukesReel from "@/assets/lukes-lounge-reel.mp4.asset.json";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { buildMeta, ldJsonScript } from "@/lib/seo";
import { getShareListing, type ShareListing } from "@/server/sharetribe.functions";
import { getRouteOrigin } from "@/lib/route-origin";
import {
  MapPin,
  Users,
  Droplets,
  Ruler,
  ShieldCheck,
  Check,
  Calendar,
  Sparkles,
  Camera,
  Music,
  Flame,
  Sun,
  Trees,
  Lock,
} from "lucide-react";

const LISTING_ID = "68865990-2dec-4c64-a6a3-475f95ffe556";
const PATH = "/p/lukes-lounge";

// Friendly labels for Sharetribe enum codes.
const ADVANTAGE_LABELS: Record<string, { icon: typeof Sun; label: string }> = {
  "shaded-area-nearby": { icon: Trees, label: "Shaded area nearby" },
  "night-lighting": { icon: Sun, label: "Night lighting" },
  "heated-pool": { icon: Flame, label: "Heated pool" },
  "music-system": { icon: Music, label: "Music system" },
  "fire-pit-nearby": { icon: Flame, label: "Fire pit nearby" },
  "poolside-dining-area": { icon: Sun, label: "Poolside dining" },
  "pool-cleaning-included": { icon: Sparkles, label: "Pool cleaning included" },
  "lifeguard-on-duty": { icon: ShieldCheck, label: "Lifeguard on duty" },
};

const POOL_AMENITY_LABELS: Record<string, string> = {
  deep_end: "Deep end",
  bbq: "BBQ grill",
  covered_seating: "Covered seating",
  restroom: "Restroom",
  ada: "ADA accessible",
  fenced: "Fully fenced",
  changing_area: "Changing area",
  parking: "On-site parking",
  saltwater: "Saltwater",
  cameras: "Security cameras",
};

const RULE_LABELS: Record<string, string> = {
  no_glass: "No glass in or near pool",
  no_djs: "No outside DJs",
  music_curfew: "Music ends at 10 PM",
  no_nudity: "No nudity",
  no_pets: "No pets",
  supervised_minors: "Minors must be supervised",
  host_present: "Host present on property",
  cameras_disclosed: "Security cameras on exterior",
};

export const Route = createFileRoute("/p/lukes-lounge")({
  loader: async () => {
    const origin = await getRouteOrigin();
    const { listing } = await getShareListing({ data: { id: LISTING_ID } });
    if (!listing) throw notFound();
    return { listing, origin };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Pool rental — Pool Rental Near Me" }] };
    const { listing, origin } = loaderData;
    const locStr = [listing.city, listing.state].filter(Boolean).join(", ");
    const title = `${listing.title} — Private pool rental${locStr ? ` in ${locStr}` : ""}`;
    const description = `Book Luke's Lounge, a private saltwater pool near Philadelphia. $${listing.pricePerHour}/hour. Heated, fenced, BBQ, games, restroom. Free cancellation up to 2 hours before.`;
    const meta = buildMeta({
      title,
      description,
      path: PATH,
      image: listing.heroImage ?? undefined,
      type: "article",
      origin,
    });
    const lodging = {
      "@context": "https://schema.org",
      "@type": "LodgingBusiness",
      name: listing.title,
      description: description,
      image: listing.images.slice(0, 6),
      url: `${origin}${PATH}`,
      priceRange: `$${listing.pricePerHour}/hr`,
      address: locStr
        ? {
            "@type": "PostalAddress",
            addressLocality: listing.city ?? undefined,
            addressRegion: listing.state ?? undefined,
            addressCountry: "US",
          }
        : undefined,
      geo: listing.geolocation
        ? {
            "@type": "GeoCoordinates",
            latitude: listing.geolocation.lat,
            longitude: listing.geolocation.lng,
          }
        : undefined,
    };
    return { ...meta, scripts: [ldJsonScript(lodging)] };
  },
  component: LukesLoungePage,
});

function LukesLoungePage() {
  const { listing } = Route.useLoaderData() as { listing: ShareListing; origin: string };
  const [lightbox, setLightbox] = useState<number | null>(null);
  const locStr = [listing.city, listing.state].filter(Boolean).join(", ");
  const heroImg = listing.heroImage ?? "";
  const galleryRest = listing.images.slice(1, 5);
  const extraPhotos = listing.images.slice(5);
  const totalPhotos = listing.images.length;

  return (
    <>
      <SiteHeader />
      <main className="bg-background pb-20">
        {/* HERO GALLERY */}
        <section className="mx-auto max-w-7xl px-4 pt-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Camera className="h-4 w-4 text-primary" />
              {totalPhotos} photos
            </div>
            {totalPhotos > 5 && (
              <button
                onClick={() => setLightbox(0)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-accent"
              >
                View all {totalPhotos}
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:grid-rows-2 md:gap-3">
            {heroImg && (
              <button
                onClick={() => setLightbox(0)}
                className="group relative col-span-2 row-span-2 overflow-hidden rounded-2xl md:col-span-2"
              >
                <img
                  src={heroImg}
                  alt={listing.title}
                  className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-105 md:h-full"
                />
              </button>
            )}
            {galleryRest.map((src, i) => (
              <button
                key={src}
                onClick={() => setLightbox(i + 1)}
                className="group relative overflow-hidden rounded-2xl"
              >
                <img
                  src={src}
                  alt={`${listing.title} photo ${i + 2}`}
                  loading="lazy"
                  className="aspect-square h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 md:aspect-auto"
                />
                {i === 3 && totalPhotos > 5 && (
                  <span className="absolute bottom-2 right-2 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-md md:bottom-3 md:right-3 md:px-3 md:py-1.5 md:text-xs">
                    +{totalPhotos - 5} more
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>


        {/* HERO VIDEO REEL */}
        <section className="mx-auto mt-8 max-w-7xl px-4">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">Watch the tour</h2>
              <p className="text-sm text-muted-foreground">60 seconds inside Luke's Lounge</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl bg-black shadow-xl ring-1 ring-border">
            <video
              src={lukesReel.url}
              poster={heroImg || undefined}
              controls
              playsInline
              preload="metadata"
              className="aspect-video w-full"
            />
          </div>
        </section>



        {/* TITLE + CTA */}
        <section className="mx-auto mt-8 max-w-7xl px-4">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                {listing.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                {locStr && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {locStr}
                  </span>
                )}
                {listing.poolType && (
                  <span className="inline-flex items-center gap-1.5 capitalize">
                    <Droplets className="h-4 w-4" />
                    {listing.poolType} {listing.waterType}
                  </span>
                )}
                {listing.poolSize && (
                  <span className="inline-flex items-center gap-1.5 capitalize">
                    <Ruler className="h-4 w-4" />
                    {listing.poolSize} pool
                  </span>
                )}
                <a
                  href={listing.bookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  View on Pool Rental Near Me ↗
                </a>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm md:items-end">
              <div>
                <span className="text-3xl font-bold text-foreground">
                  ${listing.pricePerHour}
                </span>
                <span className="ml-1 text-sm text-muted-foreground">/ hour</span>
              </div>
              <a
                href={listing.bookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-[1.02]"
              >
                <Calendar className="h-4 w-4" />
                Check availability & book
              </a>
              <p className="text-xs text-muted-foreground">
                Free cancellation up to 2 hours before · Opens in new tab
              </p>
            </div>
          </div>
        </section>

        {/* QUICK FACTS */}
        <section className="mx-auto mt-10 max-w-7xl px-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Fact icon={Droplets} label="Saltwater pool" sub="Inground" />
            <Fact icon={Flame} label="Heated" sub="Year-round swimmable" />
            <Fact icon={Lock} label="Fully fenced" sub="Private + secure" />
            <Fact icon={Sparkles} label="Pool cleaning" sub="Included with booking" />
          </div>
        </section>

        {/* DESCRIPTION */}
        <section className="mx-auto mt-12 grid max-w-7xl gap-12 px-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold text-foreground">About this pool</h2>
            <div className="mt-4 space-y-4 whitespace-pre-line text-[15px] leading-relaxed text-foreground/85">
              {listing.description}
            </div>
          </div>

          {/* STICKY BOOKING SIDEBAR */}
          <aside className="md:sticky md:top-24 md:self-start">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-foreground">
                  ${listing.pricePerHour}
                </span>
                <span className="text-sm text-muted-foreground">/ hour</span>
              </div>
              <a
                href={listing.bookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-[1.02]"
              >
                Book now
              </a>
              <div className="mt-5 space-y-3 text-sm text-foreground/85">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                  <span>$2M liability insurance included on every booking</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-primary" />
                  <span>Free cancellation up to 2 hours before</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-primary" />
                  <span>10% flat host fee, no surprises</span>
                </div>
              </div>
            </div>
          </aside>
        </section>

        {/* WHAT'S INCLUDED */}
        {(listing.advantages.length > 0 || listing.poolAmenities.length > 0) && (
          <section className="mx-auto mt-16 max-w-7xl px-4">
            <h2 className="text-xl font-semibold text-foreground">What's included</h2>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {listing.advantages.map((code) => {
                const cfg = ADVANTAGE_LABELS[code];
                if (!cfg) return null;
                const Icon = cfg.icon;
                return (
                  <div key={code} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-foreground">{cfg.label}</span>
                  </div>
                );
              })}
              {listing.poolAmenities.map((code) => {
                const label = POOL_AMENITY_LABELS[code];
                if (!label) return null;
                return (
                  <div key={`pa-${code}`} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-foreground">{label}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ADD-ON AMENITIES */}
        {listing.amenities.length > 0 && (
          <section className="mx-auto mt-16 max-w-7xl px-4">
            <h2 className="text-xl font-semibold text-foreground">Free extras & add-ons</h2>
            <p className="mt-1 text-sm text-muted-foreground">All free with your booking unless noted.</p>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {listing.amenities.map((a) => (
                <div key={a.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-foreground">{a.name}</h3>
                    {a.priceCents > 0 ? (
                      <span className="shrink-0 text-xs font-semibold text-primary">
                        +${(a.priceCents / 100).toFixed(0)}
                      </span>
                    ) : (
                      <span className="shrink-0 text-xs font-medium text-muted-foreground">Free</span>
                    )}
                  </div>
                  {a.description && (
                    <p className="mt-1 text-xs text-muted-foreground">{a.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* HOUSE RULES */}
        {listing.houseRules.length > 0 && (
          <section className="mx-auto mt-16 max-w-7xl px-4">
            <h2 className="text-xl font-semibold text-foreground">House rules</h2>
            <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {listing.houseRules.map((code) => {
                const label = RULE_LABELS[code];
                if (!label) return null;
                return (
                  <li key={code} className="flex items-start gap-2 text-sm text-foreground/85">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {label}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* FULL PHOTO GALLERY */}
        {extraPhotos.length > 0 && (
          <section className="mx-auto mt-16 max-w-7xl px-4">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground">
                  <Camera className="h-6 w-6 text-primary" />
                  The full tour
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  All {totalPhotos} photos of Luke's Lounge — tap any photo to enlarge.
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-3 lg:grid-cols-4">
              {extraPhotos.map((src, i) => (
                <button
                  key={src}
                  onClick={() => setLightbox(i + 5)}
                  className="group overflow-hidden rounded-xl"
                >
                  <img
                    src={src}
                    alt={`${listing.title} photo ${i + 6}`}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </button>
              ))}
            </div>
          </section>
        )}


        {/* FINAL CTA */}
        <section className="mx-auto mt-20 max-w-4xl px-4 text-center">
          <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/5 to-card p-10">
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              Ready to dive in?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-foreground/75">
              {listing.guests
                ? `Up to ${listing.guests} guests. `
                : ""}
              Pick your date and time, book in under 2 minutes. Full refund if you cancel 2+ hours before.
            </p>
            <a
              href={listing.bookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-md transition-transform hover:scale-[1.02]"
            >
              <Calendar className="h-5 w-5" />
              Book Luke's Lounge — ${listing.pricePerHour}/hour
            </a>
            <p className="mt-3 text-xs text-muted-foreground">
              10% flat host fee · $2M liability insurance included
            </p>
          </div>
        </section>
      </main>

      {/* LIGHTBOX */}
      {lightbox !== null && listing.images[lightbox] && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
        >
          <img
            src={listing.images[lightbox]}
            alt={`${listing.title} photo ${lightbox + 1}`}
            className="max-h-full max-w-full rounded-lg object-contain"
          />
          <button
            onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
            className="absolute right-6 top-6 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}

      <SiteFooter />
    </>
  );
}

function Fact({ icon: Icon, label, sub }: { icon: typeof Sun; label: string; sub: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-2 text-sm font-semibold text-foreground">{label}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
