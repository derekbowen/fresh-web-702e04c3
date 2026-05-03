import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import {
  buildMeta,
  breadcrumbJsonLd,
  ldJsonScript,
  SITE_URL,
} from "@/lib/seo";

const PATH = "/referral";
const TITLE = "Host Referral Program — Refer 5 Hosts, Pay $0 Fees for a Year";
const DESCRIPTION =
  "Refer 5 approved pool hosts and we waive your platform fees for 12 months. Recruit pools and earn 5% of their bookings for 2 years.";

const TIERS = [
  {
    badge: "Tier 1",
    title: "Refer 5 hosts → 0% fees for 12 months",
    body:
      "Get 5 friends approved as Pool Rental Near Me hosts and we'll waive your 10% platform fee for a full year. That's pure profit on every booking you take — typically $1,500–$5,000 in saved fees per host per season.",
  },
  {
    badge: "Tier 2",
    title: "Recruit pools → 5% of bookings for 2 years",
    body:
      "Want to go pro? If you actively recruit new pool hosts (not just casual referrals — outreach, signups, training), we pay you 5% of every booking they take for 2 full years. Build a recruiting territory and earn passive income on every swim.",
  },
];

const HOW_IT_WORKS = [
  {
    n: "1",
    title: "Share your referral link",
    body: "Every host gets a unique link in their dashboard. Send it to pool-owning friends, post it in local groups, or hand out cards at the pool store.",
  },
  {
    n: "2",
    title: "They sign up and get approved",
    body: "Your referral creates a host account, lists their pool, passes our safety review, and takes their first paid booking. That's when they count toward your 5.",
  },
  {
    n: "3",
    title: "You unlock the reward",
    body: "Hit 5 approved hosts and your fees drop to 0% for the next 12 months automatically. Want the recruiter deal? Email referrals@poolrentalnearme.com to apply for the 5%-for-2-years program.",
  },
];

const FAQS = [
  {
    q: "Who counts as an 'approved' host?",
    a: "An approved host has completed onboarding, passed safety review, listed at least one pool, and completed at least one paid booking using your referral link.",
  },
  {
    q: "When does the 0% fee window start?",
    a: "The day your 5th referral completes their first paid booking. It runs for 12 consecutive months from that date and applies to every booking on every pool you host.",
  },
  {
    q: "How is the 5% recruiter commission paid?",
    a: "Monthly, via the same payout method as your hosting earnings. You'll see a separate 'Recruiter commission' line in your dashboard with a breakdown by referred host.",
  },
  {
    q: "Can I do both — earn the fee waiver AND recruit?",
    a: "Yes. The fee waiver applies to your own hosting income. The 5% recruiter commission is a separate program for active recruiters. Many top recruiters do both.",
  },
  {
    q: "Is there a cap?",
    a: "No cap on referrals or commission. Some of our top recruiters earn more from commissions than from their own pool.",
  },
];

export const Route = createFileRoute("/referral" as any)({
  head: () => {
    const meta = buildMeta({ title: TITLE, description: DESCRIPTION, path: PATH });
    return {
      meta: meta.meta,
      links: meta.links,
      scripts: [
        ldJsonScript(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Host Referral Program", path: PATH },
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
          "@type": "WebPage",
          name: TITLE,
          description: DESCRIPTION,
          url: `${SITE_URL}${PATH}`,
        }),
      ],
    };
  },
  component: ReferralPage,
});

function ReferralPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10">
          <div className="mx-auto max-w-5xl px-4 py-20 sm:py-28">
            <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              For Pool Hosts
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Refer 5 hosts.
              <br />
              <span className="text-primary">Pay $0 in fees for a year.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              The most generous referral program in pool sharing. Bring 5 approved
              hosts onto Pool Rental Near Me and we'll waive your 10% platform fee
              for 12 full months. Want to go bigger? Recruit pools and earn 5% of
              their bookings for 2 years.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/auth"
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90"
              >
                Sign in to get your link
              </a>
              <Link
                to="/p/$slug"
                params={{ slug: "hosting" }}
                className="inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                Become a host first
              </Link>
            </div>
          </div>
        </section>

        {/* Tiers */}
        <section className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Two ways to earn
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Pick the path that fits you — or do both. There's no cap on either.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {TIERS.map((t) => (
              <div
                key={t.badge}
                className="rounded-2xl border border-border bg-card p-8 shadow-sm transition hover:shadow-md"
              >
                <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  {t.badge}
                </div>
                <h3 className="mt-4 text-2xl font-semibold text-foreground">
                  {t.title}
                </h3>
                <p className="mt-3 text-muted-foreground">{t.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-muted/30 py-16">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              How it works
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {HOW_IT_WORKS.map((s) => (
                <div key={s.n} className="rounded-2xl bg-card p-6 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                    {s.n}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Math */}
        <section className="mx-auto max-w-5xl px-4 py-16">
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-8 sm:p-12">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              The math
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              <div>
                <div className="text-4xl font-bold text-primary">$3,200</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Avg. fees waived per host per season
                </p>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary">5%</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Of every recruited host's bookings, for 24 months
                </p>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary">$0 cap</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  No ceiling on referrals or commission
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-muted/30 py-16">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Questions
            </h2>
            <div className="mt-8 space-y-4">
              {FAQS.map((f) => (
                <details
                  key={f.q}
                  className="group rounded-xl border border-border bg-card p-5 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer items-center justify-between text-base font-semibold text-foreground">
                    {f.q}
                    <span className="ml-4 text-primary transition group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Ready to start referring?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Sign in to grab your unique referral link, or apply to the recruiter
            program at{" "}
            <a
              href="mailto:referrals@poolrentalnearme.com"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              referrals@poolrentalnearme.com
            </a>
            .
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="/auth"
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90"
            >
              Get my referral link
            </a>
            <a
              href="mailto:referrals@poolrentalnearme.com?subject=Recruiter program application"
              className="inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              Apply as a recruiter
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
