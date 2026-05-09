import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DollarSign,
  ShieldCheck,
  FileCheck,
  GraduationCap,
  Users,
  ShieldAlert,
  Calculator,
  Calendar,
  TrendingUp,
  Check,
  Plus,
  Scale,
  Building,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import {
  buildMeta,
  breadcrumbJsonLd,
  ldJsonScript,
  SITE_URL,
} from "@/lib/seo";
import heroImage from "@/assets/hosting-hero.jpg";

/**
 * /p/hosting — host-acquisition landing page.
 *
 * Centerpiece is the embedded earnings calculator that compares PRNM's flat
 * 10% take vs Swimply's 15–30% range. Static segment beats /p/$slug.
 */

const PATH = "/p/hosting";
const TITLE =
  "List Your Pool & Earn 10% More than Swimply | Pool Rental Near Me";
const DESCRIPTION =
  "Earn $1,500–$8,000+ a month renting your pool. Flat 10% host fee — Swimply charges 15–30%. Free to list, $2M coverage, 100+ free classes, 24-hr payouts.";

const LIST_HREF = "/l/draft/00000000-0000-0000-0000-000000000000/new/details";
const ACADEMY_HREF = "/p/host-academy";
const CONNECT_HREF =
  "https://connect.poolrentalnearme.com/community/welcome";

const STEPS = [
  {
    n: "1",
    title: "List your pool in 15 minutes",
    body: "Photos, hourly rate, availability calendar, house rules. Our team reviews every pool before it goes live. Want help pricing? Take the free 15-minute pricing strategy class in Pool Host Academy first.",
  },
  {
    n: "2",
    title: "Approve bookings on your schedule",
    body: "You stay in full control. Auto-approve trusted guests or review every request. Block off dates, raise prices on holidays, set group size limits. Our free “Difficult Guest Scenarios” course preps you for every edge case.",
  },
  {
    n: "3",
    title: "Get paid in 24 hours",
    body: "We process your payout within 24 hours of each booking ending. Most banks deposit it 1–3 business days later. Swimply takes 48 hours just to start, then 3–7 more days. We handle payments, taxes (1099-K), and guest messaging. You just host.",
  },
];

type Reason = { icon: LucideIcon; title: string; body: string; cta?: { label: string; href: string } };

const REASONS: Reason[] = [
  {
    icon: DollarSign,
    title: "Keep 10% more (or up to 20% more)",
    body: "We charge a flat 10%. Swimply charges 15% to 30% per booking depending on which pricing structure you use. On a $1,000 weekend, you keep $900 with us versus $700–$850 with them. Over a season, that's thousands in your pocket instead of theirs.",
  },
  {
    icon: ShieldCheck,
    title: "$2M liability on every booking",
    body: "Every booking is automatically protected by up to $2 million in third-party liability insurance, built into the host fee. No add-ons, no separate premium. Swimply's protection is $1M.",
  },
  {
    icon: FileCheck,
    title: "One predictable fee, every booking",
    body: "Swimply charges 15–30% per booking, depending on pricing structure, guest count, and booking type. We charge 10%. Always. You can do the math in your head before you accept a request.",
  },
  {
    icon: GraduationCap,
    title: "100+ free classes on hosting",
    body: "Pool Host Academy is the only training platform built specifically for pool hosts. 100+ video lessons covering pricing strategy, guest screening, insurance, taxes, marketing, holiday upcharges, and difficult-guest scenarios. 100% free, English and Spanish, host certifications you can share. Swimply has webinars. We built a real curriculum.",
    cta: { label: "Browse 100+ free classes →", href: ACADEMY_HREF },
  },
  {
    icon: Users,
    title: "A real host community, not a Facebook group",
    body: "PRNM Connect is our private community board for hosts only. Local SEO playbooks, pricing strategy threads, guest-from-hell stories, and direct lines to other hosts in your market. Search it, post in it, learn from hosts who are 6 months ahead of you. Swimply has a Facebook group — we built a purpose-built tool.",
    cta: { label: "Visit PRNM Connect →", href: CONNECT_HREF },
  },
];

const COURSES: Array<{ icon: LucideIcon; title: string; desc: string }> = [
  { icon: ShieldCheck, title: "Safety & Rescue", desc: "Pool safety protocols, emergency procedures, and first-aid basics every host should know." },
  { icon: Scale, title: "Legal & Compliance", desc: "Permits, waivers, liability, and short-term rental ordinances by state." },
  { icon: Building, title: "HOA Navigation", desc: "How to host successfully when you're in an HOA (and what to do if your HOA pushes back)." },
  { icon: DollarSign, title: "Pricing Strategy", desc: "Set rates that maximize bookings without leaving money on the table. Includes holiday upcharges." },
  { icon: Megaphone, title: "Marketing Your Listing", desc: "Photos, descriptions, and SEO tactics to get more views and bookings." },
  { icon: Users, title: "Guest Experience", desc: "Difficult guest scenarios, communication scripts, and how to earn 5-star reviews every time." },
];

const COMPARE: Array<[string, string, string]> = [
  ["Host service fee", "15–30% (varies)", "10% (flat)"],
  ["Hosts keep", "70–85%", "90%"],
  ["Liability coverage", "$1,000,000", "$2,000,000"],
  ["Payout speed", "48 hr + 3–7 days to bank", "24 hr + 1–3 days to bank"],
  ["Fee predictability", "Varies by tier", "Same 10% always"],
  ["Host education", "Webinars, help articles", "100+ free classes (Pool Host Academy)"],
  ["Host community", "Facebook group", "Private board (PRNM Connect)"],
  ["Listing fee", "Free", "Free"],
];

const FAQS = [
  {
    q: "How do I get paid?",
    a: "Guests are charged upfront through Stripe — same as Swimply. We process your payout within 24 hours of each booking ending, minus the flat 10% host fee. Most banks deposit it 1–3 business days later. (Swimply takes 48 hours to start, then 3–7 more days. So your money lands 4–7 days faster with us.)",
  },
  {
    q: "How much does it cost to list my pool?",
    a: "$0 to list. We charge a flat 10% host fee only on confirmed bookings. Free to list, free to keep listed, free if you take a month off. You only pay when you earn. Swimply charges 15–30% per booking depending on the pricing structure you use — ours is 10% on every booking, no exceptions.",
  },
  {
    q: "What protection do I get on every booking?",
    a: "Up to $2 million in third-party liability insurance, automatically, on every booking. No add-ons, no extra premium, included in our 10% host fee. Most homeowner insurance policies don't cover paid pool rentals — that gap is exactly why this matters. (Swimply's coverage is $1M.)",
  },
  {
    q: "Are the host classes really free?",
    a: "Yes. 100+ video lessons in the Pool Host Academy, all free, no credit card required, no upsell. We built it because Swimply hosts kept telling us they had to learn everything by trial and error. Topics include pricing strategy, guest screening, holiday upcharges, taxes, insurance, difficult guest scenarios, and booking acceleration. English and Spanish. Host certifications you can display on your listing.",
  },
  {
    q: "Do I need to be home during bookings?",
    a: "Not at all. You can provide check-in info to confirmed guests through our app and let them self-serve. About 60% of our hosts choose to be home anyway — it's a personal preference, not a requirement.",
  },
  {
    q: "Can I be home during bookings?",
    a: "Yes. It's your house. Guests only see the spaces you give them access to. Many hosts find that being around leads to better reviews and repeat bookings — especially for first-time guests.",
  },
  {
    q: "How do I price my pool?",
    a: "Use the calculator above as a starting point, then adjust based on what similar pools in your area charge. The Pool Host Academy has a full free course on pricing strategy, holiday markups, and weekend premiums. Common starting range: $50–$125/hr. Premium backyards with hot tubs, fire pits, or sound systems go higher.",
  },
  {
    q: "Do I need to provide a restroom?",
    a: "Optional, but recommended. About 80% of successful hosts provide one — they earn more and get longer bookings. Options: an outdoor bathroom dedicated to pool guests, a side-entry into a powder room, or a porta-potty rental (~$200/month and a real option for hosts who don't want guests in the house at all).",
  },
  {
    q: "What if something comes up during a booking?",
    a: "24/7 host support via chat, email, and phone. Real humans, not bots. We deal with guest complaints, late arrivals, damage claims, and disputes so you don't have to. Phone: 1-888-940-4247.",
  },
  {
    q: "What if a guest damages my pool or property?",
    a: "Document the damage with photos within 24 hours, file a report through our app, and we'll work directly with the guest's account to resolve charges. Severe damage is escalated to our liability insurance partner. (Note: Swimply offers $10K in property damage coverage. We're adding equivalent coverage in the next 60 days. For now, our $2M liability covers injury claims — the bigger insurance exposure for most hosts.)",
  },
  {
    q: "How is PRNM different from Swimply?",
    a: "Four things hosts tell us. (1) Our host fee is a flat 10% — Swimply's is 15–30%, and most hosts don't realize until they see their deposit. (2) We include $2M liability vs Swimply's $1M. (3) Money reaches your bank 4–7 days faster with us. (4) We have 100+ free classes and a private host community board — Swimply has a Facebook group.",
  },
  {
    q: "I'm currently on Swimply. Can I list on both?",
    a: "Yes. We don't lock you in. Most hosts start by listing on both — it's the smart move while you're building bookings on PRNM. Just sync your calendar between platforms manually so you don't double-book. Some hosts keep both indefinitely; others delist from Swimply once their PRNM bookings are consistent. Your call.",
  },
];

export const Route = createFileRoute("/p/hosting")({
  head: () => {
    const meta = buildMeta({
      title: TITLE,
      description: DESCRIPTION,
      path: PATH,
      type: "article",
      image: `${SITE_URL}${heroImage}`,
    });
    return {
      meta: meta.meta,
      links: meta.links,
      scripts: [
        ldJsonScript(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "List Your Pool", path: PATH },
          ]),
        ),
        ldJsonScript({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
        ldJsonScript({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Pool Rental Earnings Calculator",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Any",
          url: `${SITE_URL}${PATH}#calculator`,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          description:
            "Estimate your monthly take-home from renting your pool on Pool Rental Near Me vs Swimply.",
        }),
        ldJsonScript({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          name: "Pool Host Academy",
          url: `${SITE_URL}${ACADEMY_HREF}`,
          description:
            "100+ free video lessons for pool rental hosts: pricing, taxes, insurance, guest screening, holiday upcharges, difficult-guest scenarios.",
        }),
      ],
    };
  },
  component: HostingPage,
});

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function HostingPage() {
  const calcRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const heroEl = heroRef.current;
    if (!heroEl) return;
    const obs = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { rootMargin: "0px 0px -20% 0px" },
    );
    obs.observe(heroEl);
    return () => obs.disconnect();
  }, []);

  const scrollToCalc = () => {
    calcRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* SECTION 1 — HERO */}
        <section ref={heroRef} className="bg-sky-50">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:py-24 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                For Pool Owners
              </p>
              <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Turn your pool into income — and keep more of it.
              </h1>
              <p className="mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl">
                Swimply's host fee runs 15% to 30% per booking. Ours is a flat
                10%. Plus $2M coverage versus their $1M, money in your bank
                4–7 days faster, and 100+ free classes on hosting. No
                other platform does that.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={LIST_HREF}
                  className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90"
                >
                  List my pool — it's free
                </a>
                <button
                  type="button"
                  onClick={scrollToCalc}
                  className="inline-flex items-center justify-center rounded-full border border-border bg-background px-7 py-3.5 text-base font-semibold text-foreground transition hover:bg-muted"
                >
                  Estimate my earnings
                </button>
              </div>
              <ul className="mt-8 grid grid-cols-2 gap-3 text-sm text-foreground sm:flex sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
                {[
                  "Free to list",
                  "10% flat host fee",
                  "$2M liability per booking",
                  "100+ free classes",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <img
                src={heroImage}
                alt="Backyard swimming pool at golden hour with lounger in the foreground"
                width={1200}
                height={900}
                className="aspect-[4/3] w-full rounded-3xl object-cover shadow-xl"
                loading="eager"
              />
            </div>
          </div>
        </section>

        {/* SECTION 2 — EARNINGS CALCULATOR */}
        <section
          id="calculator"
          ref={calcRef}
          className="bg-background py-20 scroll-mt-20"
        >
          <div className="mx-auto max-w-6xl px-4">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                How much can you actually earn?
              </h2>
              <p className="mt-3 text-lg text-muted-foreground">
                Adjust the sliders. We'll show you what you'd take home on
                PRNM versus Swimply's 15–30% range.
              </p>
            </div>
            <EarningsCalc />
          </div>
        </section>

        {/* SECTION 3 — HOW IT WORKS */}
        <section className="bg-muted/40 py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              How it works
            </h2>
            <p className="mt-3 max-w-3xl text-lg text-muted-foreground">
              Three steps. Most hosts go from signup to first booking in under
              a week — and our free classes help you charge more from day
              one.
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {STEPS.map((s) => (
                <div
                  key={s.n}
                  className="rounded-2xl border border-border bg-card p-7 shadow-sm"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                    {s.n}
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-foreground">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4 — WHY HOSTS CHOOSE PRNM */}
        <section className="bg-background py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Five reasons hosts switch from Swimply
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3 md:[&>*:nth-child(4)]:col-start-1 md:[&>*:nth-child(4)]:col-end-3 md:[&>*:nth-child(5)]:col-start-3 lg:[&>*:nth-child(4)]:col-start-1 lg:[&>*:nth-child(4)]:col-end-2 lg:[&>*:nth-child(5)]:col-start-2 lg:[&>*:nth-child(5)]:col-end-3">
              {REASONS.map((r) => {
                const Icon = r.icon;
                return (
                  <div
                    key={r.title}
                    className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-foreground">
                      {r.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {r.body}
                    </p>
                    {r.cta && (
                      <a
                        href={r.cta.href}
                        className="mt-4 inline-flex items-center text-sm font-semibold text-primary hover:underline"
                      >
                        {r.cta.label}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 5 — POOL HOST ACADEMY SHOWCASE */}
        <section className="bg-amber-50/60 py-20">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              100+ free classes. Built for pool hosts.
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-muted-foreground">
              No other platform teaches you how to host. We do — and we
              don't charge for it. Sample courses:
            </p>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 text-left">
              {COURSES.map((c) => {
                const Icon = c.icon;
                return (
                  <div
                    key={c.title}
                    className="relative rounded-2xl border border-border bg-card p-5 shadow-sm"
                  >
                    <span className="absolute right-3 top-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                      Free
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-foreground">
                      {c.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {c.desc}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="mt-10 flex flex-col items-center">
              <a
                href={ACADEMY_HREF}
                className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90"
              >
                Browse all 100+ free classes →
              </a>
              <p className="mt-3 text-sm text-muted-foreground">
                100% free. English &amp; español. Host certifications you
                can share with guests.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 6 — COMPARISON TABLE */}
        <section className="bg-sky-50/60 py-20">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Pool Rental Near Me vs. Swimply
            </h2>
            <p className="mt-2 text-sm italic text-muted-foreground">
              Numbers from Swimply's own help docs and hosting page. Verified
              May 2026.
            </p>

            {/* Desktop table */}
            <div className="mt-8 hidden overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:block">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold text-foreground">
                      Feature
                    </th>
                    <th className="px-5 py-3 text-left font-semibold text-muted-foreground">
                      Swimply
                    </th>
                    <th className="px-5 py-3 text-left font-semibold text-primary">
                      PRNM
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {COMPARE.map(([label, sw, prnm]) => (
                    <tr key={label}>
                      <td className="px-5 py-4 font-medium text-foreground">
                        {label}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{sw}</td>
                      <td className="px-5 py-4 font-semibold text-primary">
                        {prnm}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile stacked */}
            <div className="mt-8 space-y-4 md:hidden">
              {COMPARE.map(([label, sw, prnm]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                >
                  <p className="text-sm font-semibold text-foreground">
                    {label}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        Swimply
                      </p>
                      <p className="mt-0.5 text-muted-foreground">{sw}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-primary">
                        PRNM
                      </p>
                      <p className="mt-0.5 font-semibold text-primary">{prnm}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-6 text-xs italic text-muted-foreground">
              Sources: swimply.com/become-a-host, Swimply Help Center (Pricing
              Structure article), and Pool Rental Near Me commission settings.
              Verified May 2026.
            </p>
          </div>
        </section>

        {/* SECTION 7 — FAQ */}
        <section className="bg-background py-20">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Got questions? Here's all the answers.
            </h2>
            <div className="mt-8 space-y-3">
              {FAQS.map((f) => (
                <details
                  key={f.q}
                  className="group rounded-xl border border-border bg-card p-5 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 text-base font-semibold text-foreground">
                    <span>{f.q}</span>
                    <Plus className="h-5 w-5 shrink-0 text-primary transition group-open:rotate-45" />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 9 — FINAL CTA */}
        <section className="bg-primary py-20">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              Ready to keep more of your money?
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/90">
              Free to list. Free 100+ classes. No monthly fees. Be live in 15
              minutes. We review every pool to keep quality high.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href={LIST_HREF}
                className="inline-flex items-center justify-center rounded-full bg-background px-7 py-3.5 text-base font-semibold text-primary shadow-lg transition hover:bg-background/90"
              >
                List my pool — it's free
              </a>
              <a
                href="/referral"
                className="inline-flex items-center justify-center rounded-full border border-primary-foreground/60 bg-transparent px-7 py-3.5 text-base font-semibold text-primary-foreground transition hover:bg-primary-foreground/10"
              >
                Refer a host (earn $50)
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* SECTION 8 — STICKY MOBILE BOTTOM BAR */}
      <div
        aria-hidden={!showStickyBar}
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] transition-transform duration-200 lg:hidden ${
          showStickyBar ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-foreground">
            Ready to start earning?
          </p>
          <a
            href={LIST_HREF}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow"
          >
            List my pool
          </a>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Earnings calculator                                                 */
/* ------------------------------------------------------------------ */

function EarningsCalc() {
  const [rate, setRate] = useState(65);
  const [bookings, setBookings] = useState(4);
  const [hours, setHours] = useState(3);
  const [season, setSeason] = useState(6);

  const {
    grossMonthly,
    prnm,
    swimplyBest,
    swimplyWorst,
    monthlyDiffMax,
    annualDiffMax,
  } = useMemo(() => {
    const monthlyHours = bookings * hours * 4.33;
    const gross = monthlyHours * rate;
    const prnmTake = gross * 0.9;
    const swBest = gross * 0.85;
    const swWorst = gross * 0.7;
    const diffMax = prnmTake - swWorst;
    return {
      grossMonthly: gross,
      prnm: prnmTake,
      swimplyBest: swBest,
      swimplyWorst: swWorst,
      monthlyDiffMax: diffMax,
      annualDiffMax: diffMax * season,
    };
  }, [rate, bookings, hours, season]);

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-2">
      {/* Inputs */}
      <div className="space-y-7 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <Slider
          label="Your hourly rate"
          value={rate}
          min={20}
          max={200}
          step={5}
          display={`$${rate}/hr`}
          helper="Most pools rent for $50–$125/hr. Premium backyards with hot tubs go higher."
          onChange={setRate}
        />
        <Slider
          label="Bookings per week"
          value={bookings}
          min={0}
          max={20}
          step={1}
          display={`${bookings} ${bookings === 1 ? "booking" : "bookings"}`}
          helper="Active pools in busy markets average 6–10 weekend bookings."
          onChange={setBookings}
        />
        <Slider
          label="Hours per booking"
          value={hours}
          min={1}
          max={8}
          step={0.5}
          display={`${hours} ${hours === 1 ? "hour" : "hours"}`}
          helper="Most bookings are 2–4 hours. Birthday parties and family days run longer."
          onChange={setHours}
        />
        <Slider
          label="Active season"
          value={season}
          min={3}
          max={12}
          step={1}
          display={`${season} months`}
          helper="Year-round in CA, FL, TX, AZ. Shorter elsewhere unless you're heated."
          onChange={setSeason}
        />
      </div>

      {/* Output */}
      <div className="flex flex-col gap-5">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          {/* Gross */}
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Gross monthly bookings
            </p>
            <p className="mt-1 text-4xl font-bold text-foreground">
              {fmt.format(grossMonthly)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              rate × bookings/wk × hours × 4.33
            </p>
          </div>

          <div className="my-6 h-px bg-border" />

          {/* PRNM */}
          <div>
            <p className="text-sm font-medium text-primary">
              Your monthly income on PRNM
            </p>
            <p className="mt-1 text-5xl font-extrabold text-primary">
              {fmt.format(prnm)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              90% of gross — flat 10% PRNM host fee
            </p>
            <p className="mt-2 text-xs italic text-muted-foreground">
              Plus your guest pays 10% to PRNM separately. We never touch your
              share.
            </p>
          </div>

          <div className="my-6 h-px bg-border" />

          {/* Swimply */}
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              What you'd take home on Swimply
            </p>
            <p className="mt-1 text-3xl font-bold text-muted-foreground">
              {fmt.format(swimplyWorst)} – {fmt.format(swimplyBest)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              70–85% of gross — Swimply's host fee runs 15% to 30%
              per booking
            </p>
            <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
              Up to {fmt.format(monthlyDiffMax)} less per month with Swimply.
              Up to {fmt.format(annualDiffMax)} less per year.
            </p>
          </div>
        </div>

        <a
          href={LIST_HREF}
          className="inline-flex w-full items-center justify-center rounded-full bg-primary px-7 py-4 text-base font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90"
        >
          Start earning {fmt.format(prnm)}/month →
        </a>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  helper,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  helper: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-sm font-semibold text-foreground">{label}</label>
        <span className="text-2xl font-bold text-primary">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full accent-primary"
        aria-label={label}
      />
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {helper}
      </p>
    </div>
  );
}
