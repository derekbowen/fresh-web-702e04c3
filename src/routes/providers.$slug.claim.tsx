import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { getProvider } from "@/server/content.functions";
import { submitProviderClaim } from "@/server/directory.functions";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { buildMeta } from "@/lib/seo";

export const Route = createFileRoute("/providers/$slug/claim")({
  loader: async ({ params }) => {
    const { provider } = await getProvider({ data: { slug: params.slug } });
    if (!provider) throw notFound();
    return { provider };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData?.provider) return {};
    return buildMeta({
      title: `Claim ${loaderData.provider.name} | Pool Rental Near Me`,
      description: `Claim your business listing for ${loaderData.provider.name} and update your profile.`,
      path: `/providers/${params.slug}/claim`,
      noindex: true,
    });
  },
  component: ClaimPage,
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">Listing not found</h1>
        <Link to="/directory" className="mt-6 inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Browse directory</Link>
      </main>
      <SiteFooter />
    </div>
  ),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-muted-foreground">{error.message}</p>
          <button onClick={() => { router.invalidate(); reset(); }} className="mt-6 inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Retry</button>
        </main>
        <SiteFooter />
      </div>
    );
  },
});

function ClaimPage() {
  const { provider } = Route.useLoaderData() as { provider: any };
  const params = Route.useParams();
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string>("");

  const alreadyClaimed = provider.claim_status === "claimed";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError("");
    const fd = new FormData(e.currentTarget);
    const services = String(fd.get("proposed_services") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      await submitProviderClaim({
        data: {
          provider_slug: params.slug,
          claimer_name: String(fd.get("claimer_name") || ""),
          claimer_email: String(fd.get("claimer_email") || ""),
          claimer_phone: String(fd.get("claimer_phone") || ""),
          claimer_role: String(fd.get("claimer_role") || ""),
          business_email: String(fd.get("business_email") || ""),
          business_phone: String(fd.get("business_phone") || ""),
          business_website: String(fd.get("business_website") || ""),
          verification_notes: String(fd.get("verification_notes") || ""),
          proposed_name: String(fd.get("proposed_name") || ""),
          proposed_description: String(fd.get("proposed_description") || ""),
          proposed_address: String(fd.get("proposed_address") || ""),
          proposed_services: services,
          source_path: typeof window !== "undefined" ? window.location.pathname : "",
        },
      });
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Submission failed");
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <Link to="/providers/$slug" params={{ slug: params.slug }} className="hover:text-primary">{provider.name}</Link>
          <span className="mx-1.5">/</span>
          <span className="text-foreground">Claim</span>
        </nav>

        <header className="mt-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Claim {provider.name}
          </h1>
          <p className="mt-3 text-muted-foreground">
            Verify ownership of this listing to update business details, manage your profile, and receive customer leads.
            All claims are manually reviewed (typically within 1 business day).
          </p>
        </header>

        {alreadyClaimed && (
          <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            This listing has already been claimed. If you believe this is your business and want to dispute the claim,
            still submit the form below with supporting details and we'll investigate.
          </div>
        )}

        {status === "success" ? (
          <div className="mt-8 rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground">Claim submitted</h2>
            <p className="mt-2 text-muted-foreground">
              Thanks — our team will review your request and email <strong>verify your business</strong> within 1 business day.
            </p>
            <Link to="/providers/$slug" params={{ slug: params.slug }} className="mt-6 inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
              Back to listing
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-6">
            <Section title="Your information">
              <Field label="Your name *" name="claimer_name" required />
              <Field label="Your email *" name="claimer_email" type="email" required />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Phone" name="claimer_phone" type="tel" />
                <Field label="Your role at the business" name="claimer_role" placeholder="Owner, Manager, etc." />
              </div>
              <Textarea
                label="How can we verify you?"
                name="verification_notes"
                placeholder="e.g. business email, license number, social profiles, anything that proves you represent this business."
              />
            </Section>

            <Section title="Business contact (updates pending approval)">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Business email" name="business_email" type="email" />
                <Field label="Business phone" name="business_phone" type="tel" />
              </div>
              <Field label="Website URL" name="business_website" type="url" placeholder="https://" />
            </Section>

            <Section title="Update your listing (optional)">
              <Field label="Business name" name="proposed_name" defaultValue={provider.name} />
              <Field label="Address" name="proposed_address" defaultValue={provider.address ?? ""} />
              <Textarea label="Description" name="proposed_description" defaultValue={provider.description ?? ""} rows={5} />
              <Field
                label="Services (comma-separated)"
                name="proposed_services"
                defaultValue={Array.isArray(provider.services) ? provider.services.join(", ") : ""}
                placeholder="Pool installation, Liner replacement, Weekly cleaning"
              />
            </Section>

            {error && <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary-glow disabled:opacity-50 sm:w-auto"
            >
              {status === "submitting" ? "Submitting…" : "Submit claim for review"}
            </button>
            <p className="text-xs text-muted-foreground">
              By submitting, you confirm the information is accurate and that you're authorized to represent this business.
            </p>
          </form>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-2xl border border-border bg-card p-6">
      <legend className="px-2 text-sm font-semibold text-foreground">{title}</legend>
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-foreground">{label}</span>
      <input
        {...rest}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </label>
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const { label, rows = 3, ...rest } = props;
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-foreground">{label}</span>
      <textarea
        rows={rows}
        {...rest}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </label>
  );
}
