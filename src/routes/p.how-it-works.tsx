import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { Breadcrumbs } from "@/components/listing-card";
import {
  buildMeta,
  breadcrumbJsonLd,
  ldJsonScript,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";
import {
  Lock,
  ShieldCheck,
  Star,
  Headphones,
  CloudRain,
  AlertTriangle,
  PhoneCall,
  PartyPopper,
  Users,
  Camera,
  Flame,
  HeartPulse,
  Dumbbell,
  CheckCircle2,
} from "lucide-react";
import heroImage from "@/assets/how-it-works-hero.jpg";

/**
 * Guest-only trust + conversion page. Hosts go to /p/hosting.
 *
 * SEO: Article + HowTo (guest only) + FAQPage + BreadcrumbList JSON-LD.
 * All marketplace CTAs are relative <a href> so the nginx proxy forwards
 * them to Sharetribe correctly on production.
 */

const PATH = "/p/how-it-works";
const TITLE = "How Pool Rental Near Me Works | Book a Private Pool by the Hour";
const DESCRIPTION =
  "Rent private backyard pools by the hour for parties, family swims, or quiet afternoons. Up to $2M insurance per booking, 24/7 support, transparent flat 10% service fee. Book in 5 minutes.";

const STEPS = [
  {
    name: "Search pools near you",
    text: "Enter your city, ZIP, or address. Filter by date, group size, hot tub, slides, restrooms, shade, Wi-Fi, and pet-friendly. Every listing shows real photos, host reviews, house rules, and clear hourly pricing — no hidden fees, no bait-and-switch.",
  },
  {
    name: "Book by the hour",
    text: "Pick your date and time window. Booking is fully online — no phone tag, no haggling. You'll see the total upfront, including cleaning fee and any extra-guest fees. Payment is held securely; the host is only paid AFTER your swim ends.",
  },
  {
    name: "Show up and swim",
    text: "Once confirmed, you get the address and check-in details. Arrive on time, enjoy the pool with your group, and leave it the way you found it. Drop a review afterward to help future guests.",
  },
];

const INCLUDED = [
  {
    icon: Lock,
    title: "Secure online payment",
    body: "All payments run through PCI-compliant rails (Stripe). Funds are held until your booking is complete, then released to the host within 24 hours. Your card details never touch the host's phone.",
  },
  {
    icon: ShieldCheck,
    title: "Up to $2M liability protection",
    body: "Every booking is automatically protected by up to $2 million in third-party liability insurance, covering both the host's property and guests during the rental window. No extra cost, no add-ons.",
  },
  {
    icon: Star,
    title: "Host-verified listings + real reviews",
    body: "Every pool is reviewed by our team before going live. Listings show real guest reviews — not stock content — so you know what to expect before you book.",
  },
  {
    icon: Headphones,
    title: "24/7 support team",
    body: "Real humans available 24/7 by chat, email, or phone (1-888-940-4247). Issue at the pool? Late host arrival? Weather concern? We're on it.",
  },
];

const TROUBLE = [
  {
    icon: CloudRain,
    title: "It rains or the weather turns",
    body: "Cancel for a full refund up to 24 hours before your booking starts on flexible listings. Day-of cancellations on flexible listings get 50% refunded. Strict listings have stricter rules — always shown on the listing page before you book.",
  },
  {
    icon: AlertTriangle,
    title: "The pool isn't as described",
    body: "Show up, see the pool, take photos. If it's dirty, unsafe, or not as advertised, contact our 24/7 support BEFORE you start your swim. We'll help you find another pool nearby OR refund your booking in full. Hosts who fail repeatedly get removed.",
  },
  {
    icon: PhoneCall,
    title: "The host doesn't show or won't respond",
    body: "Most hosts auto-approve bookings and send check-in info immediately. If you're locked out at your booking time, call our 24/7 support line (1-888-940-4247). We can reach the host directly, and if they don't respond, you get a full refund + help finding an alternative pool.",
  },
];

const USE_CASES = [
  { icon: PartyPopper, title: "Birthdays & parties", desc: "Rent the whole backyard for the afternoon.", href: "/s?keyword=party" },
  { icon: Users, title: "Quiet family swims", desc: "Skip crowded public pools. 2-hour bookings under $100 in most cities.", href: "/s" },
  { icon: Camera, title: "Photoshoots & content", desc: "Photographers and creators book private pools by the hour for shoots.", href: "/s?keyword=photoshoot" },
  { icon: Flame, title: "Hot tub nights", desc: "Heated pool, hot tub, fire pit. Filter for properties that have all three.", href: "/amenity/hot-tub" },
  { icon: HeartPulse, title: "Pool therapy & rehab", desc: "Warm-water pools by the hour for swim therapy, aquatic rehab, and seniors.", href: "/s?keyword=therapy" },
  { icon: Dumbbell, title: "Group fitness", desc: "Aqua aerobics, swim team practice, and personal training in private pools.", href: "/s?keyword=fitness" },
];

const FAQS = [
  {
    q: "How much does it cost to rent a pool?",
    a: "Hourly rates are set by each host and typically range from $40 to $150 per hour, depending on pool size, amenities (hot tub, slides, etc.), and location. The booking total includes any cleaning fee and extra-guest fees, plus our flat 10% service fee. Everything is shown upfront before you confirm — no surprise charges.",
  },
  {
    q: "Is the pool insured during my booking?",
    a: "Yes. Every Pool Rental Near Me booking includes up to $2 million in liability protection at no extra cost — covering both the host's property and guests during the rental window. (For comparison, Swimply offers $1M.)",
  },
  {
    q: "How do I know the pool is clean and safe?",
    a: "Hosts are required to maintain water chemistry and clean the deck before each booking. Listings show recent guest reviews and photos. If something is wrong on arrival, contact our 24/7 support team for a refund or rebooking before you start your swim.",
  },
  {
    q: "Can I cancel a booking?",
    a: "Cancellation policies are set per listing — flexible, moderate, or strict — and are shown clearly on every listing page before you book. Most flexible listings refund 100% up to 24 hours before your booking starts, and 50% within 24 hours.",
  },
  {
    q: "What if it rains or the weather is bad?",
    a: "Cancellation timing rules apply (see above). Outside of those windows, refunds are at the host's discretion. Pro tip: hosts with covered pools, indoor hot tubs, or heated pools are great rain-day backups — filter for those in the search.",
  },
  {
    q: "How many guests can I bring?",
    a: "Each listing has its own max-guest count (typically 6–25 guests). Some hosts allow more for an extra per-guest fee. The number you select at booking is the max — bringing extra guests can result in the booking being canceled and no refund.",
  },
  {
    q: "Can I book a pool for a same-day reservation?",
    a: "Yes, depending on the host's auto-approve settings. Many listings approve instantly. Others require host review (typically within 1-2 hours during business hours). Filter for \"Book instantly\" listings if you need same-day certainty.",
  },
  {
    q: "What if I have a question about a specific pool?",
    a: "Message the host directly through the listing page before you book. Hosts typically reply within an hour during the day. For platform questions, contact our 24/7 support: chat, email, or phone 1-888-940-4247.",
  },
];

export const Route = createFileRoute("/p/how-it-works")({
  head: () => {
    const meta = buildMeta({
      title: TITLE,
      description: DESCRIPTION,
      path: PATH,
      type: "article",
    });

    const article = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "How Pool Rental Near Me Works",
      description: DESCRIPTION,
      author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      publisher: {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/icon-512.png` },
      },
      mainEntityOfPage: `${SITE_URL}${PATH}`,
      inLanguage: "en",
    };

    const guestHowTo = {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: "How to book a private pool by the hour",
      description:
        "Find, book, and enjoy a private pool rental in three steps with Pool Rental Near Me.",
      totalTime: "PT5M",
      step: STEPS.map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: s.name,
        text: s.text,
      })),
    };

    const faqLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };

    return {
      ...meta,
      scripts: [
        ldJsonScript(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "How It Works", path: PATH },
          ]),
        ),
        ldJsonScript(article),
        ldJsonScript(guestHowTo),
        ldJsonScript(faqLd),
      ],
    };
  },
  component: HowItWorksPage,
});

function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 pb-20 sm:pb-0">
        {/* SECTION 1 — HERO */}
        <section className="relative overflow-hidden border-b border-border">
          <img
            src={heroImage}
            alt="Private backyard pool with rock waterfall, slide, and grotto at sunset"
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/60 to-black/70" />
          <div className="relative mx-auto w-full max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
            <div className="[&_*]:!text-white/90 flex justify-center">
              <Breadcrumbs
                items={[
                  { name: "Home", path: "/" },
                  { name: "How It Works", path: PATH },
                ]}
              />
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-white/90">
              How it works
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl">
              Book a private pool by the hour.
              <br />
              <span className="text-white/90">No memberships. No surprises.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-white/90 drop-shadow sm:text-xl">
              Pool Rental Near Me lets you rent private backyard pools by the
              hour for parties, family swims, photoshoots, or a quiet
              afternoon. Every booking is paid securely and protected by up to
              $2&nbsp;million in liability insurance.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href="/s"
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg transition hover:opacity-90"
              >
                Find a pool near you
              </a>
              <a
                href="#included"
                className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                See what's included
              </a>
            </div>

            {/* Trust strip */}
            <ul className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-3 text-left text-sm text-white sm:grid-cols-4 sm:text-center">
              {[
                "Verified hosts and real reviews",
                "$2M liability per booking",
                "Secure online payment",
                "24/7 support team",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2 sm:flex-col sm:items-center">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-white" />
                  <span className="font-medium">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* SECTION 2 — BOOKING FLOW */}
        <section className="bg-background">
          <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Book a pool in 3 steps
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-base text-muted-foreground">
              No memberships. No crowded public pools. No scheduling headaches.
            </p>
            <ol className="mt-10 grid gap-6 sm:grid-cols-3">
              {STEPS.map((s, i) => (
                <li
                  key={s.name}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                    {i + 1}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">
                    {s.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {s.text}
                  </p>
                </li>
              ))}
            </ol>
            <div className="mt-10 flex justify-center">
              <a
                href="/s"
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                Find a pool near you →
              </a>
            </div>
          </div>
        </section>

        {/* SECTION 3 — EVERY BOOKING INCLUDES */}
        <section id="included" className="bg-accent/40 border-y border-border scroll-mt-20">
          <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              What's included in every booking
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {INCLUDED.map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-2xl border border-border bg-background p-6 shadow-sm">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4 — PRICING TRANSPARENCY */}
        <section className="bg-background">
          <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              What you'll actually pay
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-base text-muted-foreground">
              No memberships. No hidden fees. The price you see at checkout is
              the price you pay.
            </p>
            <div className="mt-10 grid gap-8 md:grid-cols-2">
              {/* Sample breakdown */}
              <div>
                <h3 className="text-lg font-semibold text-foreground">Your booking total</h3>
                <div className="mt-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm font-medium text-muted-foreground">
                    Sample 3-hour booking, 6 guests
                  </p>
                  <dl className="mt-4 space-y-2 font-mono text-sm text-foreground">
                    <Row label="Hourly rate × 3 hours" value="$180.00" />
                    <Row label="Cleaning fee" value="$25.00" />
                    <Row label="Extra-guest fee (2 over base)" value="$20.00" />
                    <div className="my-2 border-t border-border" />
                    <Row label="Subtotal" value="$225.00" />
                    <Row label="PRNM service fee (10%)" value="$22.50" />
                    <div className="my-2 border-t border-border" />
                    <Row label="Total you pay" value="$247.50" bold />
                  </dl>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Every fee is shown upfront before you confirm. You'll never
                  see a charge that wasn't on the booking page.
                </p>
              </div>

              {/* Why we charge */}
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Our 10% covers the platform
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  A flat 10% is added to your booking subtotal. That fee covers
                  payment processing, the $2M insurance policy on every
                  booking, our 24/7 support team, and the verification process
                  that keeps bad listings off the platform. Hosts pay the same
                  10% on their side — totally transparent.
                </p>
                <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4 text-sm text-foreground">
                  <span className="font-semibold">Compare:</span> Swimply
                  charges guests 9–13% per booking (varies, not always shown
                  upfront) plus charges hosts 15–30%. Our flat 10/10 is the
                  most transparent in the industry.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5 — WHAT IF SOMETHING GOES WRONG */}
        <section className="bg-muted/40 border-y border-border">
          <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              What if something goes wrong?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-base text-muted-foreground">
              Things happen. Here's exactly what we do about it.
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {TROUBLE.map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-2xl border border-border bg-background p-6 shadow-sm">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 flex justify-center">
              <a
                href="/p/learningacademy"
                className="inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-base font-semibold text-foreground transition hover:bg-muted"
              >
                Read full cancellation policies →
              </a>
            </div>
          </div>
        </section>

        {/* SECTION 6 — POPULAR USE CASES */}
        <section className="bg-background">
          <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              What people book pools for
            </h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {USE_CASES.map(({ icon: Icon, title, desc, href }) => (
                <a
                  key={title}
                  href={href}
                  className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:border-primary hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-foreground group-hover:text-primary">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                  <p className="mt-3 text-sm font-semibold text-primary">
                    Find one near you →
                  </p>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 7 — FAQ */}
        <section className="bg-muted/40 border-y border-border">
          <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Frequently asked questions
            </h2>
            <dl className="mt-10 space-y-3">
              {FAQS.map((f) => (
                <details
                  key={f.q}
                  className="group rounded-2xl border border-border bg-background p-5 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 text-base font-semibold text-foreground">
                    {f.q}
                    <span className="text-2xl leading-none text-primary transition group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <dd className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {f.a}
                  </dd>
                </details>
              ))}
            </dl>
          </div>
        </section>

        {/* SECTION 9 — FINAL CTA */}
        <section className="bg-primary">
          <div className="mx-auto w-full max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              Ready for your swim?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/90">
              Search private pools near you. Book in under 5 minutes. Show up
              and dive in.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href="/s"
                className="inline-flex items-center justify-center rounded-full bg-background px-6 py-3 text-base font-semibold text-primary shadow-lg transition hover:bg-background/90"
              >
                Find a pool near you
              </a>
              <a
                href="/p/hosting"
                className="inline-flex items-center justify-center rounded-full border border-primary-foreground/40 bg-transparent px-6 py-3 text-base font-semibold text-primary-foreground transition hover:bg-primary-foreground/10"
              >
                Have a pool? List it →
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* SECTION 8 — Sticky mobile bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background px-4 py-3 shadow-lg sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-foreground">Ready to book?</span>
          <a
            href="/s"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow"
          >
            Find a pool near you
          </a>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "font-bold text-foreground" : ""}`}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
