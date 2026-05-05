import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { listServiceCategories, submitProviderListing } from "@/server/directory.functions";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { buildMeta } from "@/lib/seo";
import { STATE_NAMES } from "@/lib/states";

const US_STATES = Object.entries(STATE_NAMES).map(([code, name]) => ({ code, name })).sort((a, b) => a.name.localeCompare(b.name));

const search = z.object({ category: z.string().optional() });

export const Route = createFileRoute("/directory/list")({
  validateSearch: (s) => search.parse(s),
  loader: () => listServiceCategories(),
  head: () => ({
    ...buildMeta({
      title: "List Your Pool Business — Free Directory Listing",
      description:
        "Add your pool service business to the Pool Rental Near Me directory. Free to list, optional featured upgrade. Reach customers actively searching for pool pros.",
      path: "/directory/list",
    }),
  }),
  component: ListBusinessPage,
});

function ListBusinessPage() {
  const { categories } = Route.useLoaderData() as any;
  const sp = Route.useSearch();
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null); setSubmitting(true);
    try {
      const fd = new FormData(e.currentTarget);
      await submitProviderListing({
        data: {
          name: String(fd.get("name") || ""),
          primary_category: String(fd.get("primary_category") || ""),
          city: String(fd.get("city") || ""),
          state_code: String(fd.get("state_code") || "").toUpperCase(),
          website_url: String(fd.get("website_url") || ""),
          phone: String(fd.get("phone") || ""),
          email: String(fd.get("email") || ""),
          description: String(fd.get("description") || ""),
          services: String(fd.get("services") || "")
            .split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20),
        },
      });
      setDone(true);
    } catch (e: any) {
      setErr(e?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <nav className="text-sm text-muted-foreground">
          <Link to="/directory" className="hover:text-primary">Directory</Link>
          <span className="mx-1.5">/</span>
          <span className="text-foreground">List your business</span>
        </nav>

        <header className="mt-4">
          <h1 className="text-4xl font-bold tracking-tight">Get listed in the Pool Pros Directory</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Reach pool owners actively searching for builders, cleaners, repair techs and more.
            Submissions are reviewed by our team — usually within 1–2 business days.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Tier title="Free" price="$0" desc="Standard listing on category & profile pages." />
            <Tier title="Featured" price="$25/yr" desc="Top placement in your category + featured badge." featured />
            <Tier title="Premium support" price="Coming soon" desc="Lead routing, verified badge, analytics." muted />
          </div>
        </header>

        {done ? (
          <div className="mt-10 rounded-2xl border border-green-500/40 bg-green-500/5 p-6">
            <h2 className="text-xl font-semibold">Submitted — thanks!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We'll review your listing and email you when it's live (usually within 1–2 business days).
            </p>
            <Link to="/directory" className="mt-4 inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
              Browse the directory
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-10 space-y-5 rounded-2xl border border-border bg-card p-6">
            <Field label="Business name" name="name" required maxLength={120} />

            <div>
              <label className="text-sm font-medium">Primary category *</label>
              <select
                name="primary_category"
                required
                defaultValue={sp.category || ""}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select a category…</option>
                {categories.map((c: any) => (
                  <option key={c.slug} value={c.slug}>{c.plural_name.replace(/s$/, "")}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="City" name="city" required />
              <div>
                <label className="text-sm font-medium">State *</label>
                <select name="state_code" required className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  <option value="">Select…</option>
                  {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Website" name="website_url" type="url" placeholder="https://" />
              <Field label="Phone" name="phone" type="tel" />
            </div>

            <Field label="Contact email" name="email" type="email" required />

            <div>
              <label className="text-sm font-medium">About your business *</label>
              <textarea
                name="description"
                required
                minLength={20}
                maxLength={2000}
                rows={5}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="What you do, service area, experience, specialties…"
              />
              <p className="mt-1 text-xs text-muted-foreground">20–2000 characters. No promo codes or affiliate links.</p>
            </div>

            <Field
              label="Services (comma separated)"
              name="services"
              placeholder="weekly cleaning, equipment repair, opening / closing"
            />

            {err && <p className="rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600">{err}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit for review"}
            </button>
            <p className="text-xs text-muted-foreground">
              By submitting you agree we may contact you about your listing. Listings are subject to admin approval.
            </p>
          </form>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Tier({ title, price, desc, featured, muted }: { title: string; price: string; desc: string; featured?: boolean; muted?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${featured ? "border-primary/40 bg-primary/5" : "border-border bg-card"} ${muted ? "opacity-70" : ""}`}>
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-sm font-bold">{price}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}

function Field({ label, name, required, type = "text", placeholder, maxLength }: { label: string; name: string; required?: boolean; type?: string; placeholder?: string; maxLength?: number }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}{required ? " *" : ""}</label>
      <input
        name={name}
        required={required}
        type={type}
        placeholder={placeholder}
        maxLength={maxLength}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />
    </div>
  );
}
