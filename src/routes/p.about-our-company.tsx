import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { Breadcrumbs } from "@/components/listing-card";
import {
  buildMeta,
  breadcrumbJsonLd,
  ldJsonScript,
  SITE_URL,
} from "@/lib/seo";
import { Building2, Briefcase, Mail, Phone, MapPin, Linkedin, ExternalLink } from "lucide-react";

const PATH = "/p/about-our-company";
const TITLE = "About Our Company | PRNM Corp & 10,000 Solutions LLC";
const DESCRIPTION =
  "Pool Rental Near Me is operated by PRNM Corp, a Delaware C-Corporation, sister to 10,000 Solutions LLC. Meet the leadership and brands behind the marketplace.";

const ORG_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Pool Rental Near Me",
  alternateName: "PRNM",
  url: "https://poolrentalnearme.com",
  logo: "https://poolrentalnearme.com/logo.png",
  parentOrganization: {
    "@type": "Organization",
    name: "PRNM Corp",
    url: "https://poolrentalnearme.com",
  },
  founder: [
    { "@type": "Person", name: "Derek Bowen", jobTitle: "Founder & CEO" },
    { "@type": "Person", name: "Brandon Elias", jobTitle: "Co-Founder & COO" },
  ],
  sameAs: [
    "https://www.einpresswire.com/article/908834379/two-truck-drivers-built-a-national-pool-rental-marketplace-on-their-off-hours",
  ],
};

export const Route = createFileRoute("/p/about-our-company")({
  head: () => {
    const meta = buildMeta({
      title: TITLE,
      description: DESCRIPTION,
      path: PATH,
      type: "website",
    });
    return {
      ...meta,
      scripts: [
        ldJsonScript(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "About Our Company", path: PATH },
          ]),
        ),
        ldJsonScript(ORG_LD),
      ],
    };
  },
  component: AboutCompanyPage,
});

const PRNM_BRANDS = [
  {
    name: "Pool Rental Near Me",
    domain: "poolrentalnearme.com",
    desc: "Pool rental marketplace — iOS, Android, and web",
  },
  {
    name: "PoolHostPro",
    domain: "poolhostpro.com",
    desc: "Calendar sync for pool hosts across 8+ platforms",
  },
];

const SOLUTIONS_BRANDS = [
  { name: "RentalWaivers.com", domain: "rentalwaivers.com", desc: "Digital liability waivers from 6¢ per signature" },
  { name: "BookMyPool.com", domain: "bookmypool.com", desc: "Direct booking platform for pool hosts, $9/month" },
  { name: "Pool Host Academy", domain: null, desc: "Education and training for pool rental hosts" },
  { name: "Founders.click", domain: "founders.click", desc: "Multi-tenant programmatic SEO platform for marketplace operators (in development)" },
];

const PRESS = [
  { name: "The Tennessean", note: "USA Today Network" },
  { name: "Arizona Republic", note: null },
  { name: "National Law Review", note: null },
  { name: "EIN Presswire", note: null },
];

function AboutCompanyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 pb-20 sm:pb-0">
        {/* HERO */}
        <section className="border-b border-border bg-gradient-to-b from-primary/10 via-background to-background">
          <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
            <Breadcrumbs
              items={[
                { name: "Home", path: "/" },
                { name: "About Our Company", path: PATH },
              ]}
            />
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Corporate
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              About our company
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Pool Rental Near Me is operated by PRNM Corp, a Delaware
              C-Corporation. PRNM Corp is sister to 10,000 Solutions LLC, a
              California-registered company. Together, we operate a portfolio
              of brands serving the rental economy.
            </p>
          </div>
        </section>

        {/* CORPORATE STRUCTURE */}
        <section className="bg-background">
          <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Corporate structure
            </h2>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
              Two separate legal entities. One mission: build software that helps
              real operators earn more.
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <EntityCard
                icon={Building2}
                name="PRNM Corp"
                jurisdiction="Delaware C-Corporation"
                description="PRNM Corp operates Pool Rental Near Me, a peer-to-peer pool rental marketplace serving 40+ U.S. states. Every booking includes $2,000,000 in liability coverage. With a flat 10% host fee, PRNM Corp is the leading marketplace for pool hosts who want to keep more of what they earn."
                brands={PRNM_BRANDS}
              />
              <EntityCard
                icon={Briefcase}
                name="10,000 Solutions LLC"
                jurisdiction="California Limited Liability Company"
                description="10,000 Solutions LLC operates a portfolio of SaaS and education products built for rental-economy operators. Built by operators, for operators."
                brands={SOLUTIONS_BRANDS}
              />
            </div>
          </div>
        </section>

        {/* LEADERSHIP */}
        <section className="border-y border-border bg-accent/40">
          <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Leadership
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <LeaderCard
                name="Derek Bowen"
                title="Founder & CEO, PRNM Corp"
                bio="Derek Bowen is a Class A CDL truck driver and serial entrepreneur with over 20 years of experience building marketplace businesses. He founded PRNM Corp in 2024 after spending three years building Pool Rental Near Me from truck stops across the country during his off-hours. Derek is a single father of three and writes about marketplace operations, programmatic SEO, and bootstrapped startup growth."
              />
              <LeaderCard
                name="Brandon Elias"
                title="Co-Founder & COO, PRNM Corp"
                bio="Brandon Elias is Co-Founder and COO of PRNM Corp. Like Derek, Brandon is a Class A CDL driver who helped build Pool Rental Near Me from the ground up. Brandon leads platform operations, host success, and trust and safety across the marketplace."
              />
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section className="bg-background">
          <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Contact
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <ContactCard
                entity="PRNM Corp"
                email="derek@poolrentalnearme.com"
                phoneHref="tel:18889404247"
                phoneLabel="(888) 940-4247"
                address="Mailing address available upon request"
              />
              <ContactCard
                entity="10,000 Solutions LLC"
                email="derek@10000solutions.com"
                phoneHref="tel:19092728096"
                phoneLabel="(909) 272-8096"
                address="Riverside, California"
              />
            </div>
          </div>
        </section>

        {/* PRESS */}
        <section className="border-t border-border bg-accent/40">
          <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              In the press
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              PRNM Corp has been featured in:
            </p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {PRESS.map((p) => (
                <li
                  key={p.name}
                  className="rounded-xl border border-border bg-background p-4 text-center shadow-sm"
                >
                  <div className="text-base font-semibold text-foreground">{p.name}</div>
                  {p.note ? (
                    <div className="mt-1 text-xs text-muted-foreground">{p.note}</div>
                  ) : null}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <a
                href="https://www.einpresswire.com/article/908834379/two-truck-drivers-built-a-national-pool-rental-marketplace-on-their-off-hours"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-accent"
              >
                Read the press release
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function EntityCard({
  icon: Icon,
  name,
  jurisdiction,
  description,
  brands,
}: {
  icon: typeof Building2;
  name: string;
  jurisdiction: string;
  description: string;
  brands: Array<{ name: string; domain: string | null; desc: string }>;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-2xl font-bold text-foreground">{name}</h3>
      <p className="mt-1 text-sm font-medium uppercase tracking-wide text-primary">
        {jurisdiction}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{description}</p>
      <div className="mt-6 border-t border-border pt-5">
        <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-foreground">
          Operating brands
        </h4>
        <ul className="mt-4 space-y-3">
          {brands.map((b) => (
            <li key={b.name} className="text-sm">
              <div className="font-semibold text-foreground">
                {b.name}
                {b.domain ? (
                  <span className="ml-1 font-normal text-muted-foreground">
                    ({b.domain})
                  </span>
                ) : null}
              </div>
              <div className="mt-0.5 text-muted-foreground">{b.desc}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function LeaderCard({ name, title, bio }: { name: string; title: string; bio: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-8">
      <h3 className="text-xl font-bold text-foreground">{name}</h3>
      <p className="mt-1 text-sm font-medium text-primary">{title}</p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{bio}</p>
      <a
        href="#"
        aria-label={`${name} on LinkedIn`}
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary"
      >
        <Linkedin className="h-4 w-4" />
        LinkedIn
      </a>
    </div>
  );
}

function ContactCard({
  entity,
  email,
  phoneHref,
  phoneLabel,
  address,
}: {
  entity: string;
  email: string;
  phoneHref: string;
  phoneLabel: string;
  address: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h3 className="text-lg font-bold text-foreground">{entity}</h3>
      <ul className="mt-5 space-y-3 text-sm">
        <li className="flex items-start gap-3">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <a href={`mailto:${email}`} className="text-foreground hover:text-primary">
            {email}
          </a>
        </li>
        <li className="flex items-start gap-3">
          <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <a href={phoneHref} className="text-foreground hover:text-primary">
            {phoneLabel}
          </a>
        </li>
        <li className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span className="text-muted-foreground">{address}</span>
        </li>
      </ul>
    </div>
  );
}

// Suppress unused warning for SITE_URL import (kept for future canonical use)
void SITE_URL;
