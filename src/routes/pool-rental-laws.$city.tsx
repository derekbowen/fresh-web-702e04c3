import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getCity, getNearbyCities, getStateRegulation } from "@/server/content.functions";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { Breadcrumbs } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { buildMeta, breadcrumbJsonLd, ldJsonScript, SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/pool-rental-laws/$city")({
  loader: async ({ params }) => {
    const { city } = await getCity({ data: { slug: params.city } });
    if (!city) throw notFound();
    const [{ regulation }, { cities: nearby }] = await Promise.all([
      getStateRegulation({ data: { state_code: city.state_code } }),
      getNearbyCities({ data: { slug: params.city, limit: 3 } }),
    ]);
    return { city, regulation, nearby };
  },
  head: ({ loaderData }) => {
    if (!loaderData?.city) return { meta: [{ title: "Pool Rental Laws" }] };
    const { city, regulation } = loaderData;
    const year = new Date().getFullYear();
    const title = `Is It Legal to Rent Your Pool in ${city.name}, ${city.state_code}? (${year} Guide)`;
    const status = regulation?.legality_status ?? "unknown";
    const verb =
      status === "legal"
        ? "is generally legal"
        : status === "conditional"
          ? "is allowed with permits"
          : status === "prohibited"
            ? "may be restricted"
            : "depends on local rules";
    const description = `Renting a private pool in ${city.name}, ${city.state} ${verb}. Get the ${year} permit, zoning, and compliance requirements for short-term pool rentals.`;
    const path = `/pool-rental-laws/${city.slug}`;

    const { meta, links } = buildMeta({
      title,
      description,
      path,
      image: city.hero_image_url ?? null,
    });

    const faqs = regulation?.faqs?.length
      ? regulation.faqs
      : defaultFaqs(city.name, city.state_code, status);

    const faqJsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };

    const localBusinessJsonLd = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "Pool Rental Near Me",
      url: `${SITE_URL}${path}`,
      areaServed: {
        "@type": "City",
        name: city.name,
        containedInPlace: { "@type": "State", name: city.state },
      },
    };

    const breadcrumbs = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Pool Rental Laws", path: "/pool-rental-laws" },
      { name: `${city.name}, ${city.state_code}`, path },
    ]);

    return {
      meta,
      links,
      scripts: [
        ldJsonScript(faqJsonLd),
        ldJsonScript(localBusinessJsonLd),
        ldJsonScript(breadcrumbs),
      ],
    };
  },
  component: PoolRentalLawsPage,
});

function defaultFaqs(cityName: string, stateCode: string, status: string) {
  const verb =
    status === "legal"
      ? "Yes — in most cases."
      : status === "conditional"
        ? "Conditionally — you typically need a permit."
        : status === "prohibited"
          ? "Restricted — verify with your local code enforcement before listing."
          : "It depends on local rules.";
  return [
    {
      q: `Is it legal to rent out my pool in ${cityName}, ${stateCode}?`,
      a: `${verb} Most cities classify private pool rentals as a short-term recreational use that may require a home occupation or special use permit, plus compliance with noise, parking, and pool safety codes.`,
    },
    {
      q: `Do I need a permit to rent my pool in ${cityName}?`,
      a: `Most jurisdictions require either a short-term rental permit, a home occupation permit, or a special event permit. Fees and renewal terms vary — confirm with the ${cityName} planning or code enforcement department.`,
    },
    {
      q: `What zoning rules apply to pool rentals in ${cityName}?`,
      a: `Most residential R-1 zones allow incidental personal use of a pool but restrict commercial activity. Hourly rentals can trigger a commercial classification — check the ${cityName} zoning ordinance for "home occupation" or "transient lodging" definitions.`,
    },
    {
      q: `What insurance do I need to rent my pool in ${cityName}?`,
      a: `Standard homeowners policies typically exclude commercial use. Pool Rental Near Me automatically includes $2M of liability coverage on every booking, on top of any personal umbrella policy.`,
    },
    {
      q: `What are the fines for renting a pool without a permit in ${cityName}?`,
      a: `Penalties vary by jurisdiction but typically range from $250 to $2,500 per violation, plus mandatory shutdown until compliance. Get compliant before your first booking.`,
    },
  ];
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    legal: {
      label: "Generally legal",
      cls: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200",
    },
    conditional: {
      label: "Allowed with permits",
      cls: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200",
    },
    prohibited: {
      label: "Restricted",
      cls: "bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-200",
    },
    unknown: {
      label: "Verify locally",
      cls: "bg-muted text-muted-foreground",
    },
  };
  return map[status] ?? map.unknown;
}

function PoolRentalLawsPage() {
  const { city, regulation, nearby } = Route.useLoaderData();
  const year = new Date().getFullYear();
  const status = regulation?.legality_status ?? "unknown";
  const badge = statusBadge(status);

  const directAnswer = (() => {
    if (status === "legal") {
      return `Yes — renting your pool in ${city.name}, ${city.state_code} is generally legal under ${regulation?.state_name ?? city.state} state law, provided you meet local zoning, safety, and tax requirements.`;
    }
    if (status === "conditional") {
      return `Renting your pool in ${city.name}, ${city.state_code} is allowed when you obtain the required permit${regulation?.permit_name ? ` (${regulation.permit_name})` : ""} and comply with ${regulation?.state_name ?? city.state} short-term rental and pool-safety rules.`;
    }
    if (status === "prohibited") {
      return `${city.name}, ${city.state_code} restricts commercial pool rentals in most residential zones. You must verify zoning and obtain any required variance from ${regulation?.authority_name ?? "the local planning authority"} before listing.`;
    }
    return `Pool rental legality in ${city.name}, ${city.state_code} depends on local zoning and short-term rental ordinances. Most ${regulation?.state_name ?? city.state} cities permit it under a home occupation or special use permit — verify with ${regulation?.authority_name ?? "your local code enforcement office"} before listing.`;
  })();

  const feeRange =
    regulation?.permit_fee_min_usd && regulation?.permit_fee_max_usd
      ? `$${regulation.permit_fee_min_usd}–$${regulation.permit_fee_max_usd}`
      : regulation?.permit_fee_min_usd
        ? `from $${regulation.permit_fee_min_usd}`
        : null;

  const complianceSteps =
    regulation?.compliance_steps?.length
      ? regulation.compliance_steps
      : [
          `Confirm zoning for short-term pool rental with ${regulation?.authority_name ?? `the ${city.name} planning department`}.`,
          `Apply for ${regulation?.permit_name ?? "a home occupation or short-term rental permit"}${feeRange ? ` (typical fee ${feeRange})` : ""}.`,
          "Verify pool safety compliance: barriers, anti-entrapment drains, signage, and lifesaving equipment.",
          "Carry adequate liability coverage — Pool Rental Near Me includes $2M per booking automatically.",
          "Collect and remit any applicable transient occupancy or sales tax.",
          "Post your house rules (max guests, hours, no-glass, parking) on your listing.",
        ];

  const faqs = regulation?.faqs?.length
    ? regulation.faqs
    : defaultFaqs(city.name, city.state_code, status);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Pool Rental Laws", path: "/pool-rental-laws" },
            { name: `${city.name}, ${city.state_code}`, path: `/pool-rental-laws/${city.slug}` },
          ]}
        />

        <header className="mt-4">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badge.cls}`}
          >
            {badge.label}
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Is It Legal to Rent Your Pool in {city.name}, {city.state_code}? ({year} Guide)
          </h1>
          {/* Direct answer — AI snippet bait */}
          <p className="mt-4 text-lg leading-relaxed text-foreground">{directAnswer}</p>
          {regulation?.last_verified_at && (
            <p className="mt-2 text-xs text-muted-foreground">
              Last verified {new Date(regulation.last_verified_at).toLocaleDateString()}.
            </p>
          )}
        </header>

        {/* CTA — primary */}
        <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Check if your pool qualifies in {city.name}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Free 60-second pre-screen. We confirm zoning + permit requirements before you list.
              </p>
            </div>
            <Button asChild size="lg">
              <Link to="/auth" search={{ mode: "signup", redirect: `/pool-rental-laws/${city.slug}` } as never}>
                Check eligibility
              </Link>
            </Button>
          </div>
        </section>

        {/* Regulation breakdown */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Regulation breakdown for {city.name}, {city.state_code}
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-foreground">
            <li>
              <strong className="text-foreground">Zoning:</strong>{" "}
              {regulation?.zoning_summary ??
                `Typical ${city.state} R-1 residential zones allow incidental personal pool use; commercial / hourly rental may require a home occupation permit or special use approval.`}
            </li>
            <li>
              <strong className="text-foreground">Permit required:</strong>{" "}
              {regulation?.permit_name ?? "Home occupation or short-term rental permit (typical)"}
              {feeRange && <> · Fee: {feeRange}</>}
            </li>
            <li>
              <strong className="text-foreground">Issuing authority:</strong>{" "}
              {regulation?.authority_name ?? `${city.name} Planning / Code Enforcement Department`}
              {regulation?.authority_url && (
                <>
                  {" "}·{" "}
                  <a
                    href={regulation.authority_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Official site ↗
                  </a>
                </>
              )}
            </li>
            <li>
              <strong className="text-foreground">Enforcement risk:</strong>{" "}
              {regulation?.enforcement_notes ??
                `Operating without required permits can trigger fines (typically $250–$2,500 per violation) and shutdown orders. ${city.name} code enforcement responds to neighbor noise and parking complaints.`}
            </li>
            <li>
              <strong className="text-foreground">Insurance:</strong> Standard homeowners policies typically
              exclude commercial use. Every Pool Rental Near Me booking includes $2M liability coverage.
            </li>
          </ul>
        </section>

        {/* Step-by-step compliance */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            How to legally rent your pool in {city.name} — step by step
          </h2>
          <ol className="mt-4 list-decimal space-y-3 pl-6 text-sm text-foreground marker:font-semibold marker:text-primary">
            {complianceSteps.map((step: string, i: number) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </section>

        {/* FAQ */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {city.name} pool rental FAQ
          </h2>
          <div className="mt-4 space-y-4">
            {faqs.map((f: { q: string; a: string }, i: number) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4">
                <h3 className="text-base font-semibold text-foreground">{f.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Internal linking */}
        <section className="mt-10 rounded-2xl border border-border bg-muted/30 p-5">
          <h2 className="text-lg font-semibold text-foreground">
            More {city.state} pool rental resources
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              →{" "}
              <Link
                to="/pool-rental/$city"
                params={{ city: city.slug }}
                className="text-primary hover:underline"
              >
                Browse pool rentals in {city.name}, {city.state_code}
              </Link>
            </li>
            <li>
              →{" "}
              <Link to="/auth" search={{ mode: "signup" } as never} className="text-primary hover:underline">
                List your pool and start earning
              </Link>
            </li>
            {nearby.slice(0, 3).map((n: { slug: string; name: string; state_code: string }) => (
              <li key={n.slug}>
                →{" "}
                <Link
                  to="/pool-rental-laws/$city"
                  params={{ city: n.slug }}
                  className="text-primary hover:underline"
                >
                  Pool rental laws in {n.name}, {n.state_code}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Source citations for E-E-A-T */}
        {regulation?.source_urls && regulation.source_urls.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Sources
            </h2>
            <ul className="mt-2 space-y-1 text-xs">
              {regulation.source_urls.map((url: string) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground underline hover:text-foreground"
                  >
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Final CTA */}
        <section className="mt-10 rounded-2xl bg-primary p-6 text-primary-foreground shadow">
          <h2 className="text-xl font-bold">Get compliant in {city.name} — fast</h2>
          <p className="mt-2 text-sm opacity-90">
            We pre-check zoning, walk you through the permit, and include $2M liability on every booking.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-4">
            <Link to="/auth" search={{ mode: "signup", redirect: `/pool-rental-laws/${city.slug}` } as never}>
              Start your host application
            </Link>
          </Button>
        </section>

        <p className="mt-8 text-xs text-muted-foreground">
          This page summarizes typical {city.state} requirements for informational purposes and is
          not legal advice. Confirm current rules with{" "}
          {regulation?.authority_name ?? `${city.name} code enforcement`} before listing.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
