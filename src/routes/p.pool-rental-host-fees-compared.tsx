import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import {
  buildMeta,
  breadcrumbJsonLd,
  ldJsonScript,
  SITE_URL,
} from "@/lib/seo";

const PATH = "/p/pool-rental-host-fees-compared";
const TITLE =
  "Pool Rental Host Fees Compared: Swimply, Peerspace, Giggster & PRNM (2026)";
const DESCRIPTION =
  "Side-by-side breakdown of what each pool-rental platform actually takes from a host booking. Published host commission, guest service fee, payout speed, and effective take-rate, sourced from each platform's terms.";
const LAST_UPDATED = "2026-05-22";

type Row = {
  platform: string;
  hostCommission: string;
  guestFee: string;
  effectiveTake: string;
  payout: string;
  source: string;
};

const TABLE: Row[] = [
  {
    platform: "Pool Rental Near Me",
    hostCommission: "10% flat",
    guestFee: "~10% booking fee",
    effectiveTake: "~10% of host subtotal",
    payout: "24 hours after checkout",
    source: "poolrentalnearme.com host terms",
  },
  {
    platform: "Swimply",
    hostCommission: "15% host commission",
    guestFee: "10%–15% guest service fee",
    effectiveTake: "~15%+ of host subtotal",
    payout: "1–3 business days after checkout",
    source: "swimply.com/host-fees",
  },
  {
    platform: "Peerspace",
    hostCommission: "15% host service fee",
    guestFee: "~6% guest service fee",
    effectiveTake: "~15% of host subtotal",
    payout: "24 hours after booking ends",
    source: "peerspace.com host terms",
  },
  {
    platform: "Giggster",
    hostCommission: "15%–20% host fee",
    guestFee: "Variable, set by Giggster",
    effectiveTake: "15%–20% of host subtotal",
    payout: "After booking completion",
    source: "giggster.com host pricing",
  },
];

const faqs = [
  {
    q: "Which pool rental platform has the lowest host fee?",
    a: "Pool Rental Near Me charges a 10% flat host commission, the lowest of any major peer-to-peer pool rental marketplace. Swimply, Peerspace, and Giggster each charge 15% or higher on the host side, before any additional guest service fees.",
  },
  {
    q: "What is the difference between host commission and guest service fee?",
    a: "Host commission is deducted from the host's payout — it is what the host actually pays the platform. The guest service fee is added on top of the host's price at checkout and is paid by the guest. Both reduce the platform's effective price competitiveness, but only the host commission affects host take-home.",
  },
  {
    q: "How fast do hosts get paid on each platform?",
    a: "PRNM and Peerspace both pay out approximately 24 hours after the booking ends. Swimply typically takes 1–3 business days. Giggster releases funds after booking completion, with timing varying by payment method.",
  },
  {
    q: "Are there any hidden fees beyond the host commission?",
    a: "On PRNM, the 10% commission is the only platform fee — there are no per-booking add-ons, no insurance surcharges (insurance is included), and no listing fees. Other platforms may charge optional insurance upgrades, premium placement, or processing fees on top of the headline commission.",
  },
];

export const Route = createFileRoute("/p/pool-rental-host-fees-compared")({
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
          author: {
            "@type": "Person",
            name: "Derek Bowen",
            jobTitle: "CEO, PRNM Corp",
            url: `${SITE_URL}/p/about-our-company`,
          },
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
            { name: "Pool Rental Host Fees Compared", path: PATH },
          ]),
        ),
      ],
    };
  },
  component: FeesComparedPage,
});

function FeesComparedPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 text-slate-900">
        <nav className="mb-4 text-xs text-slate-500">
          <Link to="/" className="hover:underline">Home</Link>
          <span className="mx-2">/</span>
          <span>Pool rental host fees compared</span>
        </nav>

        <h1 className="text-3xl font-bold leading-tight md:text-4xl">
          Pool rental host fees compared: what each platform actually takes
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Last updated {LAST_UPDATED} · Reviewed by Derek Bowen, CEO, PRNM Corp
        </p>

        <p className="mt-6 text-lg leading-relaxed">
          Pool Rental Near Me charges hosts a 10% flat commission on every
          booking, the lowest published host fee of any major peer-to-peer pool
          rental marketplace. Swimply, Peerspace, and Giggster each take 15% or
          more from host earnings. Here is the side-by-side breakdown, sourced
          from each platform's published terms.
        </p>

        <section className="mt-10">
          <h2 className="text-2xl font-bold">Host fee comparison table</h2>
          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2">Platform</th>
                  <th className="px-3 py-2">Host commission</th>
                  <th className="px-3 py-2">Guest service fee</th>
                  <th className="px-3 py-2">Effective take</th>
                  <th className="px-3 py-2">Payout speed</th>
                </tr>
              </thead>
              <tbody>
                {TABLE.map((r) => (
                  <tr key={r.platform} className="border-t border-slate-200 align-top">
                    <td className="px-3 py-3 font-semibold">{r.platform}</td>
                    <td className="px-3 py-3">{r.hostCommission}</td>
                    <td className="px-3 py-3">{r.guestFee}</td>
                    <td className="px-3 py-3">{r.effectiveTake}</td>
                    <td className="px-3 py-3">{r.payout}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Sources: each platform's published host fee documentation as of {LAST_UPDATED}.
          </p>
        </section>

        <section className="mt-10 rounded-lg border-l-4 border-blue-600 bg-blue-50 p-5">
          <h3 className="text-lg font-bold text-blue-900">
            What 5% of every booking actually means
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-blue-950">
            A host renting their pool at $75/hour for 20 hours per week keeps
            roughly $1,350 more per month on PRNM than on Swimply — purely from
            the 5-point fee gap. Across a 20-week pool season that is $27,000
            in additional take-home, before counting the cost of self-funded
            vs carrier-backed insurance.
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
            <li><Link to="/p/pool-rental-insurance-explained" className="hover:underline">Pool rental insurance, explained</Link></li>
            <li><Link to="/p/swimply-alternative-vs-pool-rental-near-me" className="hover:underline">Swimply vs Pool Rental Near Me</Link></li>
            <li><Link to="/p/peerspace-vs-pool-rental-near-me" className="hover:underline">Peerspace vs Pool Rental Near Me</Link></li>
            <li><Link to="/p/giggster-vs-pool-rental-near-me" className="hover:underline">Giggster vs Pool Rental Near Me</Link></li>
            <li><Link to="/p/earnings-calculator" className="hover:underline">Pool rental earnings calculator</Link></li>
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
