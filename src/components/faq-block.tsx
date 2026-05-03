import type { FaqItem } from "@/lib/page-faqs";

/**
 * Visible FAQ block used by /p/{slug} templates. The matching FAQPage
 * JSON-LD is emitted in the route head() — keep both in sync via
 * lib/page-faqs.ts.
 */
export function FaqBlock({
  faqs,
  heading = "Frequently asked questions",
}: {
  faqs: FaqItem[];
  heading?: string;
}) {
  if (!faqs || faqs.length === 0) return null;
  return (
    <section className="mt-12 border-t border-border pt-8">
      <h2 className="text-2xl font-semibold text-foreground">{heading}</h2>
      <dl className="mt-6 space-y-6">
        {faqs.map((f) => (
          <div key={f.question}>
            <dt className="text-base font-semibold text-foreground">
              {f.question}
            </dt>
            <dd className="mt-2 text-base leading-relaxed text-muted-foreground">
              {f.answer}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
