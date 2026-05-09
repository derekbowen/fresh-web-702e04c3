import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { buildMeta, ldJsonScript, SITE_URL } from "@/lib/seo";
import {
  Flame,
  Moon,
  Film,
  Trees,
  Tv,
  Sparkles,
  ShieldCheck,
  MessageCircle,
  Star,
  Check,
  X,
} from "lucide-react";

import heroNight from "@/assets/la-saltwater/hero-night.jpg";
import poolsideDay from "@/assets/la-saltwater/poolside-day.jpg";
import poolSpa from "@/assets/la-saltwater/pool-spa.jpg";
import shellFloat from "@/assets/la-saltwater/shell-float.jpg";
import nightGlow from "@/assets/la-saltwater/night-glow.jpg";
import firePit from "@/assets/la-saltwater/fire-pit.jpg";
import dining from "@/assets/la-saltwater/dining.jpg";
import dining2 from "@/assets/la-saltwater/dining-2.jpg";
import bathroom from "@/assets/la-saltwater/bathroom.jpg";
import balcony from "@/assets/la-saltwater/balcony.jpg";

const PATH = "/p/la-saltwater-featured";
const TITLE = "La Saltwater Pool & Spa | Sherman Oaks Resort Pool Rental | PRNM";
const DESCRIPTION =
  "Rent La Saltwater Pool & Spa in Sherman Oaks — saltwater pool, free heat, night swim, outdoor theater. PRNM-exclusive pricing from $45/hr.";
const BOOK_URL = "/s?address=Sherman+Oaks%2C+CA";

const GALLERY = [
  { src: heroNight, alt: "La Saltwater pool at night with blue lighting and palm trees" },
  { src: poolsideDay, alt: "Daytime poolside lounge with white umbrella" },
  { src: poolSpa, alt: "Saltwater pool with adjoining spa and waterfall" },
  { src: shellFloat, alt: "Iridescent shell float in the saltwater pool" },
  { src: nightGlow, alt: "Pool glowing green at night under string lights" },
  { src: firePit, alt: "Outdoor fire pit lounge area" },
  { src: dining, alt: "Outdoor dining set beside the pool" },
  { src: dining2, alt: "Patio dining area with umbrella" },
  { src: bathroom, alt: "Modern marble guest bathroom" },
  { src: balcony, alt: "Balcony lounge with city greenery views" },
];

const AMENITIES: { icon: typeof Flame; label: string; desc: string }[] = [
  { icon: Flame, label: "Free Heat", desc: "Pool heated for every booking. No surcharge." },
  { icon: Moon, label: "Night Swim", desc: "Underwater LEDs and ambient lighting until midnight." },
  { icon: Film, label: "Outdoor Theater", desc: "Projector and screen for movies under the stars." },
  { icon: Sparkles, label: "Fire Pit", desc: "Modern fire pit with lounge seating for 8." },
  { icon: Trees, label: "Resort Landscaping", desc: "Mature palms, tropical privacy hedge." },
  { icon: Tv, label: "Outdoor TV", desc: "Weatherproof TV for game day and party playlists." },
];

export const Route = createFileRoute("/p/la-saltwater-featured")({
  head: () => {
    const meta = buildMeta({
      title: TITLE,
      description: DESCRIPTION,
      path: PATH,
      image: `${SITE_URL}/og-default.jpg`,
      type: "article",
    });
    const lodging = {
      "@context": "https://schema.org",
      "@type": "LodgingBusiness",
      name: "La Saltwater Pool & Spa",
      description:
        "Saltwater pool with spa, fire pit, outdoor theater, and night-swim lighting in Sherman Oaks, CA. Featured exclusive on Pool Rental Near Me.",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Sherman Oaks",
        addressRegion: "CA",
        addressCountry: "US",
      },
      image: [`${SITE_URL}/og-default.jpg`],
      url: `${SITE_URL}${PATH}`,
      priceRange: "$45-$120/hr",
      amenityFeature: AMENITIES.map((a) => ({
        "@type": "LocationFeatureSpecification",
        name: a.label,
        value: true,
      })),
    };
    return { ...meta, scripts: [ldJsonScript(lodging)] };
  },
  component: LaSaltwaterPage,
});

function LaSaltwaterPage() {
  const [lightbox, setLightbox] = useState<number | null>(null);
  return (
    <>
      <SiteHeader />
      <main className="bg-background pb-24">
        {/* HERO */}
        <section className="relative isolate overflow-hidden">
          <img
            src={heroNight}
            alt="La Saltwater Pool & Spa at night"
            className="absolute inset-0 h-full w-full object-cover"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/85" />
          <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1 text-xs font-semibold text-white shadow">
                🔥 PRNM Exclusive Pricing
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 px-3 py-1 text-xs font-semibold text-black shadow">
                <Star className="h-3 w-3 fill-current" /> Guest's Favorite
              </span>
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Featured Resort: La Saltwater Pool & Spa
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-white/90">
              Sherman Oaks, CA · Free Heat · Night Swim · Outdoor Theater · Fire Pit
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={BOOK_URL}
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-[1.02]"
              >
                Book La Saltwater — From $45/hr
              </a>
              <a
                href="#gallery"
                className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                View All Photos
              </a>
            </div>
          </div>
        </section>

        {/* TRUST STRIP */}
        <section aria-label="Why book on PRNM" className="border-b border-border bg-secondary/30">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 text-center sm:grid-cols-3 sm:px-6 lg:px-8">
            <div>
              <div className="text-2xl font-bold text-primary">10%</div>
              <div className="mt-1 text-sm font-semibold text-foreground">
                Flat host fee — the lowest in the industry
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">40+</div>
              <div className="mt-1 text-sm font-semibold text-foreground">
                Verified hosts across U.S. states
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">100%</div>
              <div className="mt-1 text-sm font-semibold text-foreground">
                US-based support — direct CEO access
              </div>
            </div>
          </div>
        </section>

        {/* EXCLUSIVE PRICING CALLOUT */}
        <section className="bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-rose-950/20">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                  💎 PRNM-Exclusive Weekday Rates
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                  La Saltwater offers their lowest rates exclusively on PRNM. You won't find
                  this pricing on Swimply or anywhere else.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Weekday bookings only. Subject to availability.
                </p>
              </div>
              <a
                href={BOOK_URL}
                className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow transition-transform hover:scale-[1.02]"
              >
                Check weekday rates
              </a>
            </div>
          </div>
        </section>

        {/* AMENITIES */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            What makes this pool special
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {AMENITIES.map((a) => {
              const Icon = a.icon;
              return (
                <div
                  key={a.label}
                  className="group flex min-h-[140px] flex-col rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
                  <div className="mt-3 text-sm font-semibold text-foreground">{a.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{a.desc}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* GALLERY */}
        <section id="gallery" className="bg-secondary/30">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Photo gallery
            </h2>
            <p className="mt-2 text-muted-foreground">Tap any photo to view larger.</p>

            {/* Mobile carousel */}
            <div className="mt-6 -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:hidden">
              {GALLERY.map((g, i) => (
                <button
                  key={i}
                  onClick={() => setLightbox(i)}
                  className="relative h-56 w-72 shrink-0 overflow-hidden rounded-xl ring-1 ring-border"
                >
                  <img
                    src={g.src}
                    alt={g.alt}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>

            {/* Desktop masonry (CSS columns) */}
            <div className="mt-6 hidden gap-4 sm:block sm:columns-2 lg:columns-3 [&>*]:mb-4">
              {GALLERY.map((g, i) => (
                <button
                  key={i}
                  onClick={() => setLightbox(i)}
                  className="block w-full overflow-hidden rounded-xl ring-1 ring-border transition hover:ring-primary"
                >
                  <img
                    src={g.src}
                    alt={g.alt}
                    loading="lazy"
                    className="w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                  />
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* WHY THIS HOST */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Why this host
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <h3 className="mt-3 text-lg font-semibold text-foreground">Verified by PRNM</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Hand-checked by our team for safety, cleanliness, and accuracy.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <MessageCircle className="h-8 w-8 text-primary" />
              <h3 className="mt-3 text-lg font-semibold text-foreground">
                Direct host communication
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Message the host directly through PRNM. No middleman markup.
              </p>
            </div>
          </div>
        </section>

        {/* PRNM vs OTHERS — quick value table */}
        <section className="bg-secondary/30">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Booking on PRNM vs. other platforms
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                { label: "Flat host fee", prnm: "10%", other: "15%+" },
                { label: "Liability coverage", prnm: "$2M / booking", other: "$1M typical" },
                { label: "Host communication", prnm: "Direct", other: "Filtered" },
              ].map((row) => (
                <div key={row.label} className="rounded-2xl border border-border bg-card p-5">
                  <div className="text-sm font-semibold text-foreground">{row.label}</div>
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="font-semibold">PRNM: {row.prnm}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <X className="h-4 w-4" />
                    <span>Others: {row.other}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-primary px-6 py-12 text-center text-primary-foreground sm:px-12">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Ready to book La Saltwater?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-primary-foreground/90 sm:text-base">
              PRNM-exclusive weekday pricing from $45/hr. Free heat, night swim, fire pit,
              outdoor theater — all included.
            </p>
            <a
              href={BOOK_URL}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-background px-6 py-3 text-base font-semibold text-foreground shadow-lg transition-transform hover:scale-[1.02]"
            >
              Book now — From $45/hr
            </a>
          </div>
        </section>
      </main>

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 shadow-lg backdrop-blur md:hidden">
        <a
          href={BOOK_URL}
          className="flex w-full items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow"
        >
          Book La Saltwater — From $45/hr
        </a>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={GALLERY[lightbox].src}
            alt={GALLERY[lightbox].alt}
            className="max-h-[90vh] max-w-[95vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <SiteFooter />
    </>
  );
}
