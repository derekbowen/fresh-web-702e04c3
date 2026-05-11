import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { Breadcrumbs } from "@/components/listing-card";
import {
  buildMeta,
  breadcrumbJsonLd,
  ldJsonScript,
  SITE_URL,
} from "@/lib/seo";
import {
  Bell,
  Phone,
  Users,
  Home,
  Headphones,
  ShieldCheck,
  Volume2,
  Car,
} from "lucide-react";
import heroImage from "@/assets/neighbors-hero.jpg";

const PATH = "/p/neighbors";
const TITLE = "Neighbors | Pool Rental Near Me Good Neighbor Standards";
const DESCRIPTION =
  "Pool Rental Near Me hosts follow good neighbor practices: notify neighbors, share contact info, limit guests and noise, and stay on-site for larger reservations. Report a host any time.";

const REPORT_HREF = "mailto:support@poolrentalnearme.com?subject=Report%20a%20host%20-%20neighbor%20concern";
const SIGNUP_HREF = "/signup";

const PRACTICES = [
  {
    n: 1,
    icon: Bell,
    title: "Notify neighbors",
    body: "Hosts let nearby neighbors know before listing their pool. A quick heads up over the fence prevents surprises and builds goodwill from day one.",
  },
  {
    n: 2,
    icon: Phone,
    title: "Exchange contact info",
    body: "Hosts share a direct phone number with adjacent neighbors and point them to our 24/7 support line. Small issues get solved in minutes, not days.",
  },
  {
    n: 3,
    icon: Users,
    title: "We are responsible",
    body: "Hosts cap guest count and parking based on what their street can handle, keep rental hours reasonable, and require quiet music after 8pm. Noise and crowds are the fastest way to lose a listing.",
  },
  {
    n: 4,
    icon: Home,
    title: "We are home",
    body: "Hosts are home for about 85% of bookings, and on-site for every reservation with 15 or more guests. That hands-on supervision is why noise complaints stay rare.",
  },
];

const HOST_RULES = [
  { icon: ShieldCheck, title: "Verified hosts", body: "ID verified, listing photos reviewed, $2M liability insurance on every booking." },
  { icon: Volume2, title: "Quiet hours", body: "Music kept to conversational volume after 8pm. No outdoor speakers facing neighboring yards." },
  { icon: Car, title: "Parking caps", body: "Guest car limit set per listing based on driveway and street space, never overflow onto neighbor frontage." },
  { icon: Users, title: "Guest limits", body: "Group sizes capped to what the pool and yard safely fit. Larger groups require host on property." },
];

export const Route = createFileRoute("/p/neighbors")({
  head: () => {
    const meta = buildMeta({ title: TITLE, description: DESCRIPTION, path: PATH, type: "article" });
    return {
      ...meta,
      scripts: [
        ldJsonScript(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Neighbors", path: PATH },
          ]),
        ),
      ],
    };
  },
  component: NeighborsPage,
});

function NeighborsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Top utility link bar */}
      <div className="border-b border-border bg-muted/30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 text-sm">
          <span className="text-muted-foreground">Neighbor of a Pool Rental Near Me host?</span>
          <a href={REPORT_HREF} className="font-semibold text-primary hover:underline">
            Report a host →
          </a>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Neighbors", path: PATH }]} />

        {/* Hero */}
        <section className="mt-6 grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Community care</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Pool Rental Near Me neighbors
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Welcome to our neighbors page. Pool Rental Near Me is built on enhancing communities at the local level, giving homeowners a way to earn an extra income by sharing their backyard pool with nearby families looking for a private, safe afternoon together.
            </p>
            <p className="mt-3 text-lg text-muted-foreground">
              Quality, safety, and community come first. The standards on this page are how we keep it that way.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href={REPORT_HREF}
                className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                Report a host
              </a>
              <a
                href={SIGNUP_HREF}
                className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary"
              >
                Sign up
              </a>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border">
            <img
              src={heroImage}
              alt="Two neighbors chatting over a backyard fence"
              width={1536}
              height={1024}
              className="h-full w-full object-cover"
            />
          </div>
        </section>

        {/* Good neighbor practices */}
        <section className="mt-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Good neighbor practices</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Every host on Pool Rental Near Me agrees to these four standards before a single guest books their pool.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {PRACTICES.map((p) => (
              <div key={p.n} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                    {p.n}
                  </div>
                  <p.icon className="h-5 w-5 text-primary" aria-hidden />
                  <h3 className="text-lg font-semibold text-foreground">{p.title}</h3>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* House rules grid */}
        <section className="mt-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">How we protect your block</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HOST_RULES.map((r) => (
              <div key={r.title} className="rounded-2xl border border-border bg-card p-5">
                <r.icon className="h-6 w-6 text-primary" aria-hidden />
                <h3 className="mt-3 font-semibold text-foreground">{r.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Community Care */}
        <section className="mt-16 grid gap-8 rounded-2xl border border-border bg-muted/40 p-8 md:grid-cols-[auto_1fr] md:items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Headphones className="h-10 w-10" aria-hidden />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Our Community Care team was built for you</h2>
            <p className="mt-3 text-muted-foreground">
              If you think a host is breaking these standards, talking to them directly usually solves it the fastest. If that does not work, send our Community Care team the pool address or the host's name and we will take it from there. You will get a support ticket and a real human reply within 24 hours, usually much sooner.
            </p>
            <a
              href={REPORT_HREF}
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              Report a host
            </a>
          </div>
        </section>

        {/* Bottom utility link */}
        <section className="mt-12 border-t border-border pt-8 text-center">
          <p className="text-sm text-muted-foreground">Neighbor of a Pool Rental Near Me host with a question or concern?</p>
          <a href={REPORT_HREF} className="mt-2 inline-block text-base font-semibold text-primary hover:underline">
            Report a host →
          </a>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
