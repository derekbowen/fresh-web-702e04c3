import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { Breadcrumbs } from "@/components/listing-card";
import {
  buildMeta,
  breadcrumbJsonLd,
  ldJsonScript,
  SITE_URL,
} from "@/lib/seo";
import { Linkedin, ExternalLink, BookOpen } from "lucide-react";

const PATH = "/p/author/derek-bowen";
const TITLE = "Derek Bowen — Founder, Pool Rental Near Me | Author of 7 books on pool hosting";
const DESCRIPTION =
  "Derek Bowen is the founder of Pool Rental Near Me and author of 7 books on the pool rental economy. Class A CDL truck driver turned marketplace operator, writing about pool hosting, programmatic SEO, and bootstrapped startups.";

type Book = {
  asin: string;
  title: string;
  subtitle?: string;
  cover: string; // Amazon image ID
  blurb: string;
};

const cover = (id: string) =>
  `https://m.media-amazon.com/images/I/${id}._SY425_.jpg`;
const amazonUrl = (asin: string) => `https://www.amazon.com/dp/${asin}`;

const BOOKS: Book[] = [
  {
    asin: "B0FG5C7LRJ",
    title: "Pool Host Riches",
    subtitle:
      "Transform Your Pool into a Money-Making Machine — The Complete Guide to Starting, Growing, and Scaling Your Pool Hosting Business",
    cover: "51y-llKFeQL",
    blurb:
      "Proven strategies for building a $50K+/year pool rental business, from the first listing through scaling to multiple properties.",
  },
  {
    asin: "B0FY67SZTJ",
    title: "The Backyard Entrepreneur",
    subtitle:
      "Your Complete Guide to Hosting Profitable Events at Home — Start and Scale a Pool Rental Business from Scratch",
    cover: "81BCOb6KTUL",
    blurb:
      "How homeowners turn underused backyards into rental income, with a focus on private pools and outdoor venues.",
  },
  {
    asin: "B0GGZHM71K",
    title: "The Pool Rental & Spa Playbook",
    subtitle: "Turn Your Backyard Into Passive Income",
    cover: "61JbOhremYL",
    blurb:
      "A practical playbook for listing, booking, and profiting from your pool or spa without the daily overwhelm.",
  },
  {
    asin: "B0GS1ZDZTT",
    title: "The Complete Guide to Renting Your Swimming Pool in the United States",
    subtitle: "State-by-State Laws, Safety, Permits, and Best Practices",
    cover: "21npsEPobxL",
    blurb:
      "Everything U.S. homeowners need: regulations, insurance, pricing, and safety frameworks for every state.",
  },
  {
    asin: "B0GCTKKD9T",
    title: "The Pool Rental Side Hustle",
    subtitle:
      "How to Make Money in the Private Pool Economy Without Owning a Pool",
    cover: "71SoNmfzwrL",
    blurb:
      "Build a profitable pool rental business as a middleman, property manager, or service provider — no pool required.",
  },
  {
    asin: "B0GCT1VL46",
    title: "Backyard Brands",
    subtitle:
      "Turn Your Pool into a Premium Event Venue and Charge 10X More — The High-Ticket Strategy for Pool Hosts",
    cover: "31+JMj3xuwL",
    blurb:
      "Stop competing on price. Position your pool as a premium brand and command rates that high-ticket clients pay.",
  },
  {
    asin: "B0GCT47DGB",
    title: "Turn Your Swimming Pool Into a Goldmine",
    subtitle:
      "The Complete Guide to Earning $3K–$12K Monthly by Hosting Pool Rentals on Pool Rental Near Me",
    cover: "616h0KNFbjL",
    blurb:
      "A step-by-step guide to $3K–$12K monthly recurring income from one backyard pool using Pool Rental Near Me.",
  },
];

const LINKEDIN_URL = "https://www.linkedin.com/in/derekcbowen/";
const AMAZON_AUTHOR_URL =
  "https://www.amazon.com/stores/Derek-Bowen/author/B0FJM55Y12";
const PRESS_URL =
  "https://www.einpresswire.com/article/908834379/two-truck-drivers-built-a-national-pool-rental-marketplace-on-their-off-hours";

const PERSON_LD = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Derek Bowen",
  url: `${SITE_URL}${PATH}`,
  jobTitle: "Founder & CEO, PRNM Corp",
  description:
    "Founder of Pool Rental Near Me and author of seven books on the pool rental economy. 20+ years of marketplace and e-commerce experience.",
  worksFor: {
    "@type": "Organization",
    name: "PRNM Corp",
    url: SITE_URL,
  },
  sameAs: [AMAZON_AUTHOR_URL, LINKEDIN_URL, PRESS_URL, ...BOOKS.map((b) => amazonUrl(b.asin))],
  knowsAbout: [
    "Pool rental hosting",
    "Peer-to-peer marketplace operations",
    "Programmatic SEO",
    "Bootstrapped startup growth",
    "Short-term rental insurance",
    "Pool safety and liability",
  ],
};

const BOOKS_LD = BOOKS.map((b) => ({
  "@context": "https://schema.org",
  "@type": "Book",
  name: b.subtitle ? `${b.title}: ${b.subtitle}` : b.title,
  author: { "@type": "Person", name: "Derek Bowen" },
  url: amazonUrl(b.asin),
  image: cover(b.cover),
  bookFormat: "https://schema.org/EBook",
  publisher: { "@type": "Organization", name: "Amazon Kindle Direct Publishing" },
  identifier: { "@type": "PropertyValue", propertyID: "ASIN", value: b.asin },
}));

export const Route = createFileRoute("/p/author/derek-bowen")({
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
            { name: "Authors", path: "/p/author/derek-bowen" },
            { name: "Derek Bowen", path: PATH },
          ]),
        ),
        ldJsonScript(PERSON_LD),
        ...BOOKS_LD.map((b) => ldJsonScript(b)),
      ],
    };
  },
  component: AuthorPage,
});

function AuthorPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <div className="mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { name: "Home", path: "/" },
              { name: "Derek Bowen", path: PATH },
            ]}
          />
        </div>

        {/* HERO / BIO */}
        <section className="bg-background">
          <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Author · Founder · Operator
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Derek Bowen
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Founder &amp; CEO, PRNM Corp · Author of 7 books on the pool rental economy
            </p>

            <div className="mt-8 grid gap-8 md:grid-cols-3">
              <div className="md:col-span-2 space-y-4 text-base leading-7 text-foreground/90">
                <p>
                  I&apos;m a Class A CDL truck driver and serial entrepreneur with over 20
                  years building marketplace businesses. I founded PRNM Corp in 2024 after
                  three years of building Pool Rental Near Me from truck stops across the
                  country during my off-hours, alongside my co-founder Brandon Elias.
                </p>
                <p>
                  Pool Rental Near Me is now a national peer-to-peer pool rental
                  marketplace with thousands of indexed city pages and pool hosts earning
                  $3,000 to $12,000 a month from their backyard pools. We charge a flat 10%
                  host fee, include $2M in liability coverage, and have built every piece
                  of the platform — iOS, Android, web, calendar sync, waivers, insurance
                  — without outside funding.
                </p>
                <p>
                  I&apos;ve written seven books on the pool rental economy, covering
                  everything from a first-time host&apos;s playbook to state-by-state
                  legal frameworks to high-ticket positioning for premium pool venues. I
                  write from the operator&apos;s seat — not the consultant&apos;s.
                </p>
                <p className="text-sm text-muted-foreground">
                  Single father of three. Based in Riverside, California.
                </p>
              </div>

              <aside className="space-y-3 rounded-lg border border-border bg-accent/40 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Find Derek
                </p>
                <a
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-foreground hover:text-primary"
                >
                  <Linkedin className="h-4 w-4" /> LinkedIn
                </a>
                <a
                  href="https://www.amazon.com/s?k=derek+bowen&i=digital-text"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-foreground hover:text-primary"
                >
                  <BookOpen className="h-4 w-4" /> Books on Amazon
                </a>
                <a
                  href={PRESS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-foreground hover:text-primary"
                >
                  <ExternalLink className="h-4 w-4" /> Press feature
                </a>
                <a
                  href="/p/about-our-company"
                  className="flex items-center gap-2 text-sm text-foreground hover:text-primary"
                >
                  <ExternalLink className="h-4 w-4" /> About PRNM Corp
                </a>
              </aside>
            </div>
          </div>
        </section>

        {/* BOOKS */}
        <section className="border-y border-border bg-accent/40">
          <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Books by Derek Bowen
            </h2>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
              Seven books on the pool rental economy, all available on Amazon Kindle.
              Written from inside an operating marketplace, not from the sidelines.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {BOOKS.map((b) => (
                <a
                  key={b.asin}
                  href={amazonUrl(b.asin)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col gap-3 rounded-lg border border-border bg-background p-5 transition hover:border-primary hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={cover(b.cover)}
                      alt={`Cover of ${b.title} by Derek Bowen`}
                      loading="lazy"
                      width={88}
                      height={132}
                      className="h-32 w-22 flex-shrink-0 rounded-sm border border-border object-cover shadow-sm"
                    />
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold leading-snug text-foreground group-hover:text-primary">
                        {b.title}
                      </h3>
                      {b.subtitle && (
                        <p className="mt-1 text-xs leading-snug text-muted-foreground">
                          {b.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm leading-6 text-foreground/80">{b.blurb}</p>
                  <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    Read on Amazon <ExternalLink className="h-3 w-3" />
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-background">
          <div className="mx-auto w-full max-w-3xl px-4 py-14 text-center sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Want to rent out your own pool?
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              List your pool on Pool Rental Near Me. Flat 10% host fee, $2M liability
              coverage included, and you keep your calendar in your control.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="/l/draft/00000000-0000-0000-0000-000000000000/new/details"
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                List your pool
              </a>
              <a
                href="/s"
                className="inline-flex items-center justify-center rounded-md border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-accent"
              >
                Find a pool to rent
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
