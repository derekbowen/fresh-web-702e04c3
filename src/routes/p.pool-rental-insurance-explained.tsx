import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import {
  buildMeta,
  breadcrumbJsonLd,
  ldJsonScript,
  SITE_URL,
  AUTHOR_PERSON_JSONLD_REF,
} from "@/lib/seo";

const PATH = "/p/pool-rental-insurance-explained";
const TITLE =
  "Pool Rental Insurance Explained: Swimply, Peerspace, Giggster & PRNM Compared (2026)";
const DESCRIPTION =
  "What insurance actually covers a pool rental — and what doesn't. Side-by-side breakdown of Swimply's self-funded $1M Protection Guarantee, Peerspace's $1M Host Liability, Giggster's coverage, and Pool Rental Near Me's $2M/$4M Hartford-backed Business Owner's Policy. Sourced from each platform's published terms.";
const LAST_UPDATED = "2026-05-22";

const faqs = [
  {
    q: "Is Swimply insurance real insurance?",
    a: "No. Swimply's Protection Guarantee is a company-funded reimbursement program — not a third-party insurance policy underwritten by a licensed carrier. Swimply's own terms describe it as a guarantee that pays out at Swimply's discretion, secondary to the host's homeowners policy. There is no carrier name, no policy number, and no certificate of insurance available to hosts. Pool Rental Near Me is the only major pool-rental marketplace that places hosts on a third-party policy from a licensed carrier (The Hartford), with documentary proof available on request.",
  },
  {
    q: "Does my homeowners insurance cover paid pool rentals?",
    a: "Almost never. Standard homeowners policies exclude commercial or 'business pursuits' use of the property. The moment you accept money to let someone swim, most carriers consider that a business activity and will deny the claim — and may cancel the policy. This is why a dedicated commercial liability layer underneath your homeowners policy matters.",
  },
  {
    q: "What is a Business Owner's Policy (BOP) and why does it matter?",
    a: "A BOP is a packaged commercial insurance policy that combines general liability with property and business interruption coverage. PRNM's BOP through Hartford Underwriters Insurance Company provides $2,000,000 per-occurrence and $4,000,000 aggregate general liability, $10,000 medical payments per person, and a $150,000 STRETCH® PLUS property blanket — sitting underneath the host's homeowners policy as primary commercial coverage for the rental activity. It is real insurance with a real carrier and a real certificate.",
  },
  {
    q: "What does Peerspace's $1M Host Liability cover for pool rentals?",
    a: "Peerspace's published terms provide up to $1,000,000 in liability protection per booking, administered through a third-party insurer. The coverage is designed for general venue rentals (photo shoots, meetings, parties) rather than swimming-specific risks. Drowning and water-related bodily injury claims have historically been the highest-severity loss category for pool hosts, which is why a pool-specific BOP with higher limits is the safer floor.",
  },
  {
    q: "What does Giggster's coverage include?",
    a: "Giggster offers a tiered insurance add-on (typically $1M, $2M, or $5M general liability) priced per booking and underwritten through a third-party broker. Coverage applies to the production or event, not specifically to swimming activity. Hosts should confirm in writing that pool-related bodily injury is not excluded before accepting bookings that include swimming.",
  },
  {
    q: "Can I see the actual PRNM insurance certificate?",
    a: "Yes. Hosts can request a Certificate of Insurance (COI) naming themselves as an additional insured, issued directly by The Hartford. This is the same documentation a commercial venue would provide to a corporate event client, and it is something a self-funded guarantee program structurally cannot produce. Email support at the number below to request a COI.",
  },
];

type Row = {
  platform: string;
  policyType: string;
  limit: string;
  carrier: string;
  proof: string;
  source: string;
};

const TABLE: Row[] = [
  {
    platform: "Pool Rental Near Me",
    policyType: "Business Owner's Policy (commercial)",
    limit: "$2M occurrence / $4M aggregate GL + $150K property",
    carrier: "Hartford Underwriters Insurance Company",
    proof: "COI available on request",
    source: "PRNM policy documents (Hartford)",
  },
  {
    platform: "Swimply",
    policyType: "Self-funded reimbursement program",
    limit: "Up to $1M per occurrence + $10K property",
    carrier: "None — paid by Swimply, Inc.",
    proof: "No COI; discretionary payout",
    source: "swimply.com/protection-guarantee",
  },
  {
    platform: "Peerspace",
    policyType: "Third-party liability (general venue)",
    limit: "Up to $1M per booking",
    carrier: "Third-party broker (general use)",
    proof: "Per-booking certificate via Peerspace",
    source: "peerspace.com host protection terms",
  },
  {
    platform: "Giggster",
    policyType: "Add-on liability (per booking)",
    limit: "$1M / $2M / $5M tiers",
    carrier: "Third-party broker",
    proof: "Per-booking certificate",
    source: "giggster.com insurance page",
  },
];

export const Route = createFileRoute("/p/pool-rental-insurance-explained")({
  head: () => {
    const meta = buildMeta({
      title: TITLE,
      description: DESCRIPTION,
      path: PATH,
      type: "article",
    });
    return {
      meta: meta.meta,
      links: meta.links,
      scripts: [
        ldJsonScript({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: TITLE,
          description: DESCRIPTION,
          datePublished: LAST_UPDATED,
          dateModified: LAST_UPDATED,
          author: AUTHOR_PERSON_JSONLD_REF,
          publisher: {
            "@type": "Organization",
            name: "Pool Rental Near Me",
            logo: { "@type": "ImageObject", url: `${SITE_URL}/icon-512.png` },
          },
          mainEntityOfPage: `${SITE_URL}${PATH}`,
        }),
        ldJsonScript({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: f.a,
              speakable: {
                "@type": "SpeakableSpecification",
                cssSelector: [".faq-answer"],
              },
            },
          })),
        }),
        ldJsonScript(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Pool Rental Insurance Explained", path: PATH },
          ]),
        ),
      ],
    };
  },
  component: InsuranceExplainedPage,
});

function InsuranceExplainedPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 text-slate-900">
        <nav className="mb-4 text-xs text-slate-500">
          <Link to="/" className="hover:underline">Home</Link>
          <span className="mx-2">/</span>
          <span>Pool rental insurance explained</span>
        </nav>

        <h1 className="text-3xl font-bold leading-tight md:text-4xl">
          Pool rental insurance, explained: what each platform actually covers
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Last updated {LAST_UPDATED} · Reviewed by Derek Bowen, CEO, PRNM Corp
        </p>

        <p className="mt-6 text-lg leading-relaxed">
          If a guest gets hurt in your pool, the insurance question stops being theoretical.
          This page is the short, sourced version of what each major pool-rental platform
          actually puts behind a host when a claim hits — pulled directly from each
          company's published terms. The single most important distinction: Pool Rental
          Near Me is the only major pool-rental marketplace that places hosts on a
          third-party commercial policy from a licensed carrier (The Hartford), rather
          than a self-funded reimbursement program paid out at the platform's discretion.
        </p>

        <section className="mt-10">
          <h2 className="text-2xl font-bold">Side-by-side: who underwrites what</h2>
          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2">Platform</th>
                  <th className="px-3 py-2">Policy type</th>
                  <th className="px-3 py-2">Limit</th>
                  <th className="px-3 py-2">Carrier</th>
                  <th className="px-3 py-2">Proof</th>
                </tr>
              </thead>
              <tbody>
                {TABLE.map((r) => (
                  <tr key={r.platform} className="border-t border-slate-200 align-top">
                    <td className="px-3 py-3 font-semibold">{r.platform}</td>
                    <td className="px-3 py-3">{r.policyType}</td>
                    <td className="px-3 py-3">{r.limit}</td>
                    <td className="px-3 py-3">{r.carrier}</td>
                    <td className="px-3 py-3">{r.proof}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Sources: each platform's published Protection / Insurance terms as of {LAST_UPDATED}.
            PRNM row sourced from Hartford Underwriters Insurance Company policy on file.
          </p>
        </section>

        <section className="mt-10 rounded-lg border-l-4 border-blue-600 bg-blue-50 p-5">
          <h3 className="text-lg font-bold text-blue-900">
            The carrier-backed vs. self-funded distinction
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-blue-950">
            A self-funded guarantee (Swimply's model) is a promise by the company to
            reimburse covered losses out of its own balance sheet, subject to its own
            review. A carrier-backed policy (PRNM's model) is a contract with a
            regulated insurance company — The Hartford — that is legally obligated to
            defend and indemnify covered claims regardless of the platform's financial
            condition. The difference matters most in the exact scenario you bought
            coverage for: a serious claim.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold">Frequently asked questions</h2>
          <div className="mt-4 space-y-6">
            {faqs.map((f) => (
              <div key={f.q}>
                <h3 className="font-semibold">{f.q}</h3>
                <p className="faq-answer mt-1 text-sm leading-relaxed text-slate-700">
                  {f.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-lg bg-slate-50 p-5">
          <h2 className="text-xl font-bold">Related reading</h2>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-blue-700">
            <li><Link to="/p/swimply-alternative-vs-pool-rental-near-me" className="hover:underline">Swimply vs Pool Rental Near Me — full comparison</Link></li>
            <li><Link to="/p/peerspace-vs-pool-rental-near-me" className="hover:underline">Peerspace vs Pool Rental Near Me</Link></li>
            <li><Link to="/p/giggster-vs-pool-rental-near-me" className="hover:underline">Giggster vs Pool Rental Near Me</Link></li>
            <li><Link to="/p/hosting" className="hover:underline">How hosting on PRNM works</Link></li>
            <li><Link to="/p/earnings-calculator" className="hover:underline">Pool rental earnings calculator</Link></li>
          </ul>
        </section>

        <p className="mt-10 text-xs text-slate-500">
          Need a Certificate of Insurance for your booking? Call PRNM support at
          888-940-4247 and request a Hartford COI naming you as additional insured.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
