import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  listPublishedBlogPosts,
  type BlogHubPost,
} from "@/server/blog-posts.functions";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import {
  buildMeta,
  SITE_URL,
  SITE_NAME,
  organizationJsonLd,
  websiteJsonLd,
  AUTHOR_PERSON_JSONLD_REF,
  AUTHOR_PERSON_ID,
} from "@/lib/seo";

export const Route = createFileRoute("/p/blog")({
  loader: async () => {
    const { posts } = await listPublishedBlogPosts();
    return { posts };
  },
  head: () => ({
    ...buildMeta({
      title: "Pool rental blog — guides for hosts and guests",
      description:
        "Practical guides on pool care, water chemistry, hosting, safety, and pool parties from Pool Rental Near Me. 133 posts across 8 categories.",
      path: "/p/blog",
      type: "website",
    }),
  }),
  component: BlogHubPage,
});

/** Display order matches user-approved cluster sequence. */
const CLUSTERS: Array<{
  key: string;
  heading: string;
  blurb: string;
}> = [
  {
    key: "maintenance_care",
    heading: "Pool maintenance & care",
    blurb:
      "Weekly upkeep, seasonal tasks, and how to keep your pool guest-ready year-round.",
  },
  {
    key: "water_chemistry_algae",
    heading: "Water chemistry & algae",
    blurb:
      "Chlorine, pH, alkalinity, and every shade of algae — diagnose it, fix it, prevent it.",
  },
  {
    key: "equipment_repairs",
    heading: "Equipment & repairs",
    blurb:
      "Pumps, filters, heaters, lights, liners, and shells. When to DIY and when to call the pro.",
  },
  {
    key: "building_design_features",
    heading: "Pool building, design & features",
    blurb:
      "Costs, materials, permits, and the accessories that turn a pool into a destination.",
  },
  {
    key: "hosting_growing_business",
    heading: "Hosting tips & growing your rental business",
    blurb:
      "Pricing, photography, welcome kits, accessibility, taxes — the operator's playbook.",
  },
  {
    key: "renting_guest_playbook",
    heading: "Renting a pool: the guest playbook",
    blurb:
      "How to book a private pool, what to bring, and how to be the kind of guest hosts re-book.",
  },
  {
    key: "parties_events_culture",
    heading: "Pool parties, events & culture",
    blurb:
      "Themes, music, snacks, lighting — plus the cultural history of the great American pool party.",
  },
  {
    key: "pool_safety_training",
    heading: "Pool safety & training",
    blurb:
      "Swim lessons, child water safety, storm and freeze prep, and the rules every host should post.",
  },
];

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "How often is the Pool Rental Near Me blog updated?",
    a: "We publish new posts weekly and refresh evergreen guides every quarter. The 133 posts in this hub are sorted by published date inside each category, so the newest content surfaces first.",
  },
  {
    q: "Who writes the content on this blog?",
    a: "Every post is published under Derek Bowen, founder of Pool Rental Near Me and author of 7 books on the pool rental economy. Guides are reviewed against operator playbooks built from 5,100+ city pages and thousands of host conversations.",
  },
  {
    q: "Is this blog for pool owners, renters, or both?",
    a: "Both. Five clusters target hosts and pool owners (maintenance, chemistry, equipment, building, hosting tips). Two target renters and party planners (the guest playbook and pool parties). Safety and training applies to everyone.",
  },
  {
    q: "Can I rent a pool through Pool Rental Near Me?",
    a: "Yes. Search private pool rentals in your city at /s, browse a specific listing, and book by the hour. Most US pools rent for $40 to $150 per hour. Liability coverage of $2 million is included on every booking.",
  },
  {
    q: "How do I list my pool to start earning?",
    a: "Click List a pool on any page, add photos, set your hourly rate, and publish. Hosts on the platform typically earn $3,000 to $10,000 a month in summer. We charge a flat 10% host fee — lower than the 15%+ taken by competing platforms.",
  },
];

function BlogHubPage() {
  const { posts } = Route.useLoaderData() as { posts: BlogHubPost[] };

  const featured = useMemo(() => posts.slice(0, 6), [posts]);

  const grouped = useMemo(() => {
    const map = new Map<string, BlogHubPost[]>();
    for (const p of posts) {
      const key = p.editorial_cluster ?? "uncategorized";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return map;
  }, [posts]);

  const orderedClusters = useMemo(
    () =>
      CLUSTERS.map((c) => ({ ...c, posts: grouped.get(c.key) ?? [] })).filter(
        (c) => c.posts.length > 0,
      ),
    [grouped],
  );

  const pageUrl = `${SITE_URL}/p/blog`;

  // ---- JSON-LD blocks (6) -------------------------------------------------
  const orgLd = organizationJsonLd();
  const websiteLd = websiteJsonLd();

  const breadcrumbsLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Blog", item: pageUrl },
    ],
  };

  // Secondary BreadcrumbList scoped to the author entity for the Article block.
  const authorBreadcrumbsLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#author-breadcrumbs`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Derek Bowen",
        item: `${SITE_URL}/p/author/derek-bowen`,
      },
      { "@type": "ListItem", position: 3, name: "Blog", item: pageUrl },
    ],
  };

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${pageUrl}#article`,
    headline: "Pool rental blog — guides for hosts and guests",
    description:
      "Practical guides on pool care, water chemistry, hosting, safety, and pool parties from Pool Rental Near Me.",
    url: pageUrl,
    mainEntityOfPage: pageUrl,
    inLanguage: "en-US",
    datePublished: "2024-01-15T00:00:00Z",
    dateModified: new Date().toISOString(),
    author: { "@id": AUTHOR_PERSON_ID },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon.svg`,
      },
    },
    about: CLUSTERS.map((c) => ({ "@type": "Thing", name: c.heading })),
  };

  // Embed Author Person entity by reference so Google ties this Article to
  // the canonical Derek Bowen node at /p/author/derek-bowen.
  const authorPersonLd = {
    "@context": "https://schema.org",
    ...AUTHOR_PERSON_JSONLD_REF,
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["[data-speakable='faq-question']", "[data-speakable='faq-answer']"],
    },
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Pool Rental Near Me — Blog",
    numberOfItems: posts.length,
    itemListElement: posts.slice(0, 100).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/p/${p.slug}`,
      name: p.title,
    })),
  };

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        {/* Visible breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link to="/" className="hover:text-foreground">Home</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-foreground">Blog</li>
          </ol>
        </nav>

        <header className="mb-10 border-b border-border pb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {SITE_NAME}
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">
            The Pool Rental Near Me blog
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-muted-foreground">
            {posts.length.toLocaleString()} practical guides across{" "}
            {orderedClusters.length} categories. Written for the homeowner who
            wants to turn a backyard pool into a $3K–$10K a month side income,
            and for the guest planning the perfect 3-hour swim.
          </p>
        </header>

        {/* About this blog */}
        <section className="mb-12 rounded-xl border border-border bg-card p-6 md:p-8">
          <h2 className="text-2xl font-semibold">About this blog</h2>
          <p className="mt-3 text-muted-foreground">
            We run the country's largest peer-to-peer pool rental marketplace,
            with listings in 5,100+ US cities. Everything we publish here is
            grounded in real host conversations, real bookings, and the operator
            playbook we use to coach new hosts to their first $1,000 weekend.
          </p>
          <p className="mt-3 text-muted-foreground">
            Posts are written by Derek Bowen, founder and author of 7 books on
            the pool rental economy, and reviewed against our internal data on
            pricing, safety, and what guests actually ask for.
          </p>
        </section>

        {/* Latest posts */}
        {featured.length > 0 ? (
          <section className="mb-16">
            <div className="mb-5 flex items-baseline justify-between">
              <h2 className="text-2xl font-semibold">Latest posts</h2>
              <span className="text-sm text-muted-foreground">
                Fresh from the blog
              </span>
            </div>
            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((p) => (
                <li
                  key={p.slug}
                  className="group overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg"
                >
                  <Link
                    to="/p/$slug"
                    params={{ slug: p.slug }}
                    className="block"
                  >
                    {p.cover_image_url ? (
                      <img
                        src={p.cover_image_url}
                        alt=""
                        loading="lazy"
                        className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="aspect-video w-full bg-muted" />
                    )}
                    <div className="p-5">
                      <h3 className="text-lg font-semibold leading-snug group-hover:text-primary">
                        {p.title}
                      </h3>
                      {p.excerpt ? (
                        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                          {p.excerpt}
                        </p>
                      ) : null}
                      <p className="mt-4 text-sm font-medium text-primary">
                        Read article →
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Cluster sections */}
        <div className="space-y-14">
          {orderedClusters.map((c) => (
            <section key={c.key} id={c.key}>
              <div className="mb-5">
                <h2 className="text-2xl font-semibold md:text-3xl">
                  {c.heading}{" "}
                  <span className="text-base font-normal text-muted-foreground">
                    ({c.posts.length})
                  </span>
                </h2>
                <p className="mt-2 max-w-2xl text-muted-foreground">{c.blurb}</p>
              </div>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {c.posts.map((p) => (
                  <li
                    key={p.slug}
                    className="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary"
                  >
                    <Link
                      to="/p/$slug"
                      params={{ slug: p.slug }}
                      className="block"
                    >
                      {p.cover_image_url ? (
                        <img
                          src={p.cover_image_url}
                          alt=""
                          loading="lazy"
                          className="mb-3 aspect-video w-full rounded-md object-cover"
                        />
                      ) : null}
                      <h3 className="font-semibold leading-snug group-hover:text-primary">
                        {p.title}
                      </h3>
                      {p.excerpt ? (
                        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                          {p.excerpt}
                        </p>
                      ) : null}
                      <p className="mt-3 text-xs text-muted-foreground">
                        Read article →
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* FAQ */}
        <section className="mt-20 border-t border-border pt-10">
          <h2 className="text-3xl font-bold">Frequently asked questions</h2>
          <div className="mt-6 space-y-4">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="group rounded-lg border border-border bg-card p-5"
              >
                <summary
                  data-speakable="faq-question"
                  className="cursor-pointer list-none text-lg font-semibold marker:hidden group-open:text-primary"
                >
                  {f.q}
                </summary>
                <p
                  data-speakable="faq-answer"
                  className="mt-3 text-muted-foreground"
                >
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-16 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8 md:p-12">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              For pool owners
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Reading about pools? Why not get paid to host yours.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Hosts on Pool Rental Near Me earn $3,000 to $10,000 a month in
              summer. Flat 10% host fee, $2 million liability coverage included
              on every booking, listings live in under 10 minutes.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/l/draft/00000000-0000-0000-0000-000000000000/new/details"
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                List your pool
              </a>
              <a
                href="/s"
                className="inline-flex items-center justify-center rounded-md border border-border bg-background px-6 py-3 text-base font-semibold transition-colors hover:bg-muted"
              >
                Or rent one near you
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(authorBreadcrumbsLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(authorPersonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
    </>
  );
}
