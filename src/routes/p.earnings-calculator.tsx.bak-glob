import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import {
  buildMeta,
  breadcrumbJsonLd,
  ldJsonScript,
  SITE_URL,
} from "@/lib/seo";

const PATH = "/p/earnings-calculator";
const TITLE =
  "Pool Rental Earnings Calculator — See What Your Pool Could Earn";
const DESCRIPTION =
  "Free calculator: estimate how much your backyard pool can earn on Pool Rental Near Me. Adjust hourly rate, hours per week, and season length to see annual income after the 10% host fee.";

const PRESETS: Record<string, { rate: number; hpw: number; weeks: number }> = {
  "Warm climate (FL/AZ/TX/CA)": { rate: 50, hpw: 12, weeks: 50 },
  "Sunbelt (GA/NC/SC/NV)": { rate: 45, hpw: 10, weeks: 38 },
  "Midwest / Northeast": { rate: 40, hpw: 9, weeks: 22 },
  "Custom": { rate: 45, hpw: 10, weeks: 30 },
};

const HOST_FEE = 0.1; // 10% flat

function fmt(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export const Route = createFileRoute("/p/earnings-calculator")({
  head: () => {
    const meta = buildMeta({
      title: TITLE,
      description: DESCRIPTION,
      path: PATH,
      type: "website",
    });
    return {
      meta: meta.meta,
      links: meta.links,
      scripts: [
        ldJsonScript(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Earnings Calculator", path: PATH },
          ]),
        ),
        ldJsonScript({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Pool Rental Earnings Calculator",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Web",
          url: `${SITE_URL}${PATH}`,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }),
        ldJsonScript({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "How much can I really earn renting my pool?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Most active hosts earn $3,000–$15,000 per year. Warm-climate hosts in Florida, Arizona, Texas, and California with high-amenity pools regularly clear $20,000+. Earnings depend on your hourly rate, weekly bookings, and length of swim season.",
              },
            },
            {
              "@type": "Question",
              name: "What fee does Pool Rental Near Me take?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "PRNM charges a flat 10% host fee — no monthly subscription, no listing fee, no surprise deductions. Every booking includes $2M liability coverage at no extra cost.",
              },
            },
            {
              "@type": "Question",
              name: "How is this different from Swimply?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "PRNM's host fee is 10% versus Swimply's 15%. On the same $50/hr rate that means you keep $45 vs $42.50 per hour booked — roughly $1,000 more per year for an average host.",
              },
            },
          ],
        }),
      ],
    };
  },
  component: EarningsCalculatorPage,
});

function EarningsCalculatorPage() {
  const [preset, setPreset] = React.useState<string>("Warm climate (FL/AZ/TX/CA)");
  const [rate, setRate] = React.useState(50);
  const [hpw, setHpw] = React.useState(12);
  const [weeks, setWeeks] = React.useState(50);

  const applyPreset = (key: string) => {
    setPreset(key);
    const p = PRESETS[key];
    if (p) {
      setRate(p.rate);
      setHpw(p.hpw);
      setWeeks(p.weeks);
    }
  };

  const gross = rate * hpw * weeks;
  const fee = gross * HOST_FEE;
  const net = gross - fee;
  const monthly = net / 12;
  const swimplyFee = gross * 0.15;
  const savedVsSwimply = swimplyFee - fee;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
            <div className="max-w-2xl">
              <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                Free Tool · No Sign-Up
              </div>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Pool rental{" "}
                <span className="text-primary">earnings calculator</span>
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                See exactly what your backyard pool could earn on Pool Rental
                Near Me. Adjust your hourly rate, weekly bookings, and swim
                season — get an honest annual estimate after our flat 10% host
                fee.
              </p>
            </div>
          </div>
        </section>

        {/* Calculator */}
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-8 lg:grid-cols-5">
            {/* Inputs */}
            <div className="lg:col-span-3">
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <h2 className="text-xl font-semibold text-foreground">
                  Your numbers
                </h2>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-foreground">
                    Climate preset
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.keys(PRESETS).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => applyPreset(k)}
                        className={
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition " +
                          (preset === k
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground")
                        }
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </div>

                <Slider
                  label="Hourly rate"
                  value={rate}
                  min={20}
                  max={150}
                  step={5}
                  unit="$/hr"
                  onChange={(v) => {
                    setRate(v);
                    setPreset("Custom");
                  }}
                  hint="Most pools charge $35–$75/hr. High-amenity pools (hot tub, slide, pool house) charge $80+."
                />

                <Slider
                  label="Hours booked per week"
                  value={hpw}
                  min={1}
                  max={40}
                  step={1}
                  unit="hrs"
                  onChange={(v) => {
                    setHpw(v);
                    setPreset("Custom");
                  }}
                  hint="Active hosts average 8–15 hours/week. Weekend-heavy bookings are normal."
                />

                <Slider
                  label="Swim season length"
                  value={weeks}
                  min={8}
                  max={52}
                  step={1}
                  unit="weeks/yr"
                  onChange={(v) => {
                    setWeeks(v);
                    setPreset("Custom");
                  }}
                  hint="FL/AZ ≈ 50 weeks · TX/CA ≈ 40 · GA/NC ≈ 30 · Midwest/NE ≈ 18–22."
                />
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-2">
              <div className="sticky top-24 space-y-4">
                <div className="rounded-2xl border-2 border-primary bg-primary/5 p-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Your estimated take-home
                  </p>
                  <p className="mt-2 text-5xl font-bold tracking-tight text-foreground">
                    {fmt(net)}
                    <span className="text-base font-medium text-muted-foreground">
                      /yr
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    ≈ {fmt(monthly)}/mo · after 10% host fee
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 text-sm">
                  <Row label="Gross bookings" value={fmt(gross)} />
                  <Row
                    label="PRNM host fee (10%)"
                    value={`− ${fmt(fee)}`}
                    muted
                  />
                  <div className="my-3 border-t border-border" />
                  <Row label="Net to you" value={fmt(net)} bold />
                  <div className="my-3 border-t border-dashed border-border" />
                  <Row
                    label="Same bookings on Swimply (15%)"
                    value={fmt(gross - swimplyFee)}
                    muted
                  />
                  <Row
                    label="You keep more with PRNM"
                    value={`+ ${fmt(savedVsSwimply)}`}
                    accent
                  />
                </div>

                <Link
                  to="/p/hosting"
                  className="block rounded-full bg-primary px-6 py-3 text-center text-base font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90"
                >
                  List your pool — start earning →
                </Link>
                <p className="text-center text-xs text-muted-foreground">
                  Free to list · $2M liability included · Payouts in 24 hrs
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
            <Stat label="Average host earnings" value="$8,400/yr" />
            <Stat label="Top-quartile hosts (warm states)" value="$22k+/yr" />
            <Stat label="Liability coverage on every booking" value="$2M" />
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Honest answers about pool rental income
          </h2>
          <div className="mt-8 space-y-6">
            <Faq
              q="Are these numbers realistic?"
              a="Yes — they're based on actual host data. The calculator is intentionally conservative on hours/week. A single 4-hour weekend booking at $50/hr puts you at $200; doing that twice a week for a 30-week season is $12,000 gross."
            />
            <Faq
              q="What does the 10% host fee cover?"
              a="Payment processing, $2M liability insurance per booking, guest screening, the booking platform, customer support, and marketing that drives renters to your listing. There are no other fees — no listing fee, no monthly subscription, no per-photo charge."
            />
            <Faq
              q="How do I increase my hourly rate?"
              a="The biggest levers are amenities (hot tub, pool house, BBQ, restroom access), professional photos, and fast response time. Pools with 10+ photos and a 5-star rating routinely charge $20–$40/hr more than baseline."
            />
            <Faq
              q="What about taxes?"
              a="Pool rental income is reported on Schedule E (rental) or Schedule C (active business). PRNM issues a 1099-K each January. You can typically deduct a portion of pool maintenance, utilities, insurance, and depreciation — talk to a CPA for your situation."
            />
          </div>

          <div className="mt-12 rounded-2xl border border-border bg-card p-8 text-center">
            <h3 className="text-xl font-semibold text-foreground">
              Ready to turn your pool into income?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Setup takes about 15 minutes. Most hosts get their first booking
              within 10 days.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/p/hosting"
                className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90"
              >
                Become a host
              </Link>
              <Link
                to="/p/free-host-tools"
                className="rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                Free host tools
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  hint,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  hint?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mt-6">
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <span className="text-lg font-bold text-primary">
          {value.toLocaleString()} <span className="text-xs font-medium text-muted-foreground">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-primary"
      />
      <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  muted,
  accent,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between py-1">
      <span
        className={
          muted
            ? "text-muted-foreground"
            : accent
              ? "font-medium text-primary"
              : "text-foreground"
        }
      >
        {label}
      </span>
      <span
        className={
          (bold ? "text-lg font-bold " : "font-medium ") +
          (accent ? "text-primary" : "text-foreground")
        }
      >
        {value}
      </span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-bold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-xl border border-border bg-card p-5 open:border-primary/40">
      <summary className="cursor-pointer list-none text-base font-semibold text-foreground">
        <span className="mr-2 text-primary group-open:hidden">+</span>
        <span className="mr-2 hidden text-primary group-open:inline">−</span>
        {q}
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p>
    </details>
  );
}
