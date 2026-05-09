import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { AvailabilityCalendar } from "@/components/availability-calendar";
import { buildMeta, ldJsonScript, SITE_URL } from "@/lib/seo";
import {
  Flame,
  Moon,
  Film,
  Trees,
  Music,
  Sparkles,
  ShieldCheck,
  MessageCircle,
  Star,
  Check,
  X,
  Users,
  Wifi,
  Car,
  Bath,
  Camera,
  PartyPopper,
  Heart,
  Utensils,
  Trophy,
  Droplets,
} from "lucide-react";

import heroNight from "@/assets/la-saltwater/hero-night.jpg";
import poolsideDay from "@/assets/la-saltwater/poolside-day.jpg";
import poolSpa from "@/assets/la-saltwater/pool-spa.jpg";
import shellFloat from "@/assets/la-saltwater/shell-float.jpg";
import nightGlow from "@/assets/la-saltwater/night-glow.jpg";
import firePit from "@/assets/la-saltwater/fire-pit.jpg";
import dining from "@/assets/la-saltwater/dining.jpg";
import bathroom from "@/assets/la-saltwater/bathroom.jpg";
import balcony from "@/assets/la-saltwater/balcony.jpg";

const PATH = "/p/la-saltwater-featured";
const TITLE = "La Saltwater Pool & Spa | Sherman Oaks Resort Rental | PRNM";
const DESCRIPTION =
  "Private saltwater pool & spa resort in Sherman Oaks. Free heat, heated spa, night swim, outdoor theater, fire pit. Up to 45 guests. Book on PRNM.";
const BOOK_URL = "https://go.poolrentalnearme.com/lasaltwater";

const GALLERY = [
  { src: heroNight, alt: "La Saltwater pool at night with blue lighting and palm trees" },
  { src: poolsideDay, alt: "Daytime poolside lounge with white umbrella" },
  { src: poolSpa, alt: "Saltwater pool with adjoining heated spa" },
  { src: shellFloat, alt: "Iridescent shell float in the saltwater pool" },
  { src: nightGlow, alt: "Pool glowing at night under string lights" },
  { src: firePit, alt: "Outdoor fire pit lounge area" },
  { src: dining, alt: "Outdoor dining set beside the pool" },
  { src: bathroom, alt: "Modern marble guest bathroom" },
  { src: balcony, alt: "Shaded patio lounge overlooking the pool" },
];

const INCLUDED = [
  { icon: Droplets, label: "Saltwater pool, free heat to 85°F", desc: "Complimentary heating included with every booking. Year-round swimmable." },
  { icon: Flame, label: "Heated spa, free with every booking", desc: "Hot tub heated to your preferred temp, up to 105°F. Always included." },
  { icon: Music, label: "Sonos outdoor sound system", desc: "Built-in speakers throughout the pool area. Leave your speakers at home." },
  { icon: Moon, label: "Ambience lighting", desc: "Underwater LEDs and ambient lighting for night swims and date nights." },
  { icon: Bath, label: "Private indoor bathroom + shower", desc: "Guest-only entrance. Never enter the main residence." },
  { icon: Trees, label: "Daybeds, loungers & umbrellas", desc: "Styled resort-style lounge furniture for sun-drenched relaxing." },
  { icon: Wifi, label: "AT&T fiber Wi-Fi", desc: "Throughout the property. Stream, browse, stay connected." },
  { icon: Car, label: "3 parking spots", desc: "1 covered garage + 2 driveway. Discreet arrival and easy load-in." },
];

const ADDONS = [
  { icon: Film, label: "Outdoor movie night", desc: "Projector, 180\" screen, Fire Stick with all major streaming apps." },
  { icon: Utensils, label: "Grill & BBQ setup", desc: "Half-propane, half-charcoal grill with fuel and tools provided." },
  { icon: Sparkles, label: "Fire pit & fire tables", desc: "Propane fire pit + tables with fuel included. Cozy night-swim ambiance." },
  { icon: Heart, label: "Romantic setup", desc: "Rose petals, candles, ice bucket. Proposals, anniversaries, date nights." },
  { icon: PartyPopper, label: "Photo backdrops", desc: "Birthday, Congratulations, Summer Vibes, VIP, Movie Night themes." },
  { icon: Camera, label: "Red carpet & ropes", desc: "Velvet ropes set up before arrival. VIP entrance for any event." },
];

const PERFECT_FOR = [
  "Adult & kids birthday parties",
  "Bachelor & bachelorette parties",
  "Photo & video shoots",
  "Weddings & receptions",
  "Baby showers",
  "Corporate events & team building",
  "Family gatherings",
  "Swim lessons & fitness classes",
  "Fundraisers & charity events",
];

const HOUSE_RULES = [
  "No alcohol",
  "No glass containers",
  "No smoking",
  "No pets",
  "No outside DJs",
  "Music ends by 10pm",
  "No after-dark swimming",
  "Adult supervision required for minors",
  "Pre-approved vendors only",
];

const FAQS = [
  {
    q: "How much does it cost?",
    a: "Pricing varies by day and group size. Click any 'Book' button to see live availability and the host's current rates on PRNM. Weekday rates are the host's lowest.",
  },
  {
    q: "Is the pool actually heated for free?",
    a: "Yes. Saltwater pool is heated up to 85°F and the spa up to 105°F at no extra charge with every booking.",
  },
  {
    q: "How many guests can I bring?",
    a: "Up to 45 guests. Great for medium and large parties, weddings, and corporate events.",
  },
  {
    q: "Is the host on-site during my booking?",
    a: "Yes, the host is present. You also get a private indoor bathroom with its own guest entrance, so you never need to enter the main residence.",
  },
  {
    q: "What's the cancellation policy?",
    a: "Free cancellation up to 24 hours before your reservation start time.",
  },
  {
    q: "Can I bring outside vendors (chef, photographer, DJ)?",
    a: "Pre-approved vendors only. A small third-party vendor fee applies for outside services and is waived when you use the host's in-house vendors. No outside DJs.",
  },
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
        "Private saltwater pool and heated spa resort in Sherman Oaks, CA. Free heat, Sonos sound, outdoor theater, fire pit, fits up to 45 guests. Featured on Pool Rental Near Me.",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Sherman Oaks",
        addressRegion: "CA",
        addressCountry: "US",
      },
      image: [`${SITE_URL}/og-default.jpg`],
      url: `${SITE_URL}${PATH}`,
      maximumAttendeeCapacity: 45,
      amenityFeature: INCLUDED.map((a) => ({
        "@type": "LocationFeatureSpecification",
        name: a.label,
        value: true,
      })),
    };
    const faq = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };
    return { ...meta, scripts: [ldJsonScript(lodging), ldJsonScript(faq)] };
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
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 px-3 py-1 text-xs font-semibold text-black shadow">
                <Trophy className="h-3 w-3 fill-current" /> Ranked Top 9 Pools in LA 2025
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1 text-xs font-semibold text-white shadow">
                🔥 PRNM Featured Host
              </span>
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              La Saltwater Pool & Spa
            </h1>
            <p className="mt-3 text-lg font-medium text-white/95">
              Your private saltwater resort in Sherman Oaks 🌴
            </p>
            <p className="mt-4 max-w-2xl text-base text-white/85 sm:text-lg">
              Saltwater pool with free heat, heated spa included, Sonos sound, ambient
              night-swim lighting, and a fully-loaded backyard built for celebrations,
              shoots, and dreamy night swims. Fits up to 45 guests.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={BOOK_URL}
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-[1.02]"
              >
                Check availability
              </a>
              <a
                href="#gallery"
                className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                View all photos
              </a>
            </div>
          </div>
        </section>

        {/* QUICK STATS STRIP */}
        <section aria-label="At a glance" className="border-b border-border bg-secondary/30">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 text-center sm:grid-cols-4 sm:px-6 lg:px-8">
            <div>
              <Users className="mx-auto h-6 w-6 text-primary" />
              <div className="mt-2 text-xl font-bold text-foreground">Up to 45</div>
              <div className="text-xs text-muted-foreground">Guests</div>
            </div>
            <div>
              <Droplets className="mx-auto h-6 w-6 text-primary" />
              <div className="mt-2 text-xl font-bold text-foreground">Saltwater</div>
              <div className="text-xs text-muted-foreground">Heated to 85°F</div>
            </div>
            <div>
              <Flame className="mx-auto h-6 w-6 text-primary" />
              <div className="mt-2 text-xl font-bold text-foreground">Spa included</div>
              <div className="text-xs text-muted-foreground">Up to 105°F, free</div>
            </div>
            <div>
              <ShieldCheck className="mx-auto h-6 w-6 text-primary" />
              <div className="mt-2 text-xl font-bold text-foreground">$2M coverage</div>
              <div className="text-xs text-muted-foreground">Per booking, included</div>
            </div>
          </div>
        </section>

        {/* INCLUDED AMENITIES */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Everything included with your booking
            </h2>
            <p className="mt-3 text-muted-foreground">
              No surprise fees. Heat, spa, sound, lighting, and lounge furniture all come
              standard. Not a single line item to add later.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {INCLUDED.map((a) => {
              const Icon = a.icon;
              return (
                <div
                  key={a.label}
                  className="group flex min-h-[160px] flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
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
                  <img src={g.src} alt={g.alt} loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>

            {/* Desktop masonry */}
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

        {/* ADD-ONS */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Make it unforgettable, add-ons available
            </h2>
            <p className="mt-3 text-muted-foreground">
              Optional upgrades you can add at booking. Perfect for birthdays, proposals,
              shoots, and movie nights under the stars.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ADDONS.map((a) => {
              const Icon = a.icon;
              return (
                <div
                  key={a.label}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md"
                >
                  <Icon className="h-6 w-6 text-primary" />
                  <div className="mt-3 text-sm font-semibold text-foreground">{a.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{a.desc}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* PERFECT FOR */}
        <section className="bg-secondary/30">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Perfect for
            </h2>
            <div className="mt-6 flex flex-wrap gap-2">
              {PERFECT_FOR.map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* MEET YOUR HOST */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Meet your host
              </span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Quang, interior designer & resort host
              </h2>
              <p className="mt-4 text-muted-foreground">
                "Hello, I'm Quang. Interior designer who enjoys sharing his little slice of
                paradise. I can be hospitable and available, or hands-off, whether it's a
                daytime dip or swimming under the stars."
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-2 rounded-xl border border-border bg-card p-4">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <div className="text-sm font-semibold text-foreground">PRNM Verified</div>
                    <div className="text-xs text-muted-foreground">Hand-checked by our team</div>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-xl border border-border bg-card p-4">
                  <MessageCircle className="h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <div className="text-sm font-semibold text-foreground">Direct messaging</div>
                    <div className="text-xs text-muted-foreground">Talk to the host, no middleman</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground">House rules</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Quick read so there are no surprises on the day.
              </p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {HOUSE_RULES.map((r) => (
                  <li key={r} className="flex items-center gap-2 text-sm text-foreground">
                    <X className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">
                Cancellation: free up to 24 hours before reservation start.
              </p>
            </div>
          </div>
        </section>

        {/* PRNM vs OTHERS */}
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

        {/* FAQ */}
        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Frequently asked
          </h2>
          <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card">
            {FAQS.map((f) => (
              <details key={f.q} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-foreground sm:text-base">
                  {f.q}
                  <span className="ml-4 text-primary transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-primary px-6 py-12 text-center text-primary-foreground sm:px-12">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Ready to book La Saltwater?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-primary-foreground/90 sm:text-base">
              Free heat, heated spa, Sonos sound, night-swim lighting, fits 45 guests.
              Check live availability and the host's current rates.
            </p>
            <a
              href={BOOK_URL}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-background px-6 py-3 text-base font-semibold text-foreground shadow-lg transition-transform hover:scale-[1.02]"
            >
              Check availability
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
          Check availability — La Saltwater
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
