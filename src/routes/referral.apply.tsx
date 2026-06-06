import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { buildMeta } from "@/lib/seo";
import { applyAsAffiliate } from "@/lib/affiliate-apply.functions";

const PATH = "/referral/apply";
const TITLE = "Apply to the Pool Rental Near Me Affiliate Program";
const DESCRIPTION =
  "Refer pool hosts to Pool Rental Near Me and earn 5% of every booking they take, for the lifetime of the host.";

export const Route = createFileRoute("/referral/apply")({
  head: () => {
    const meta = buildMeta({ title: TITLE, description: DESCRIPTION, path: PATH });
    return { meta: meta.meta, links: meta.links };
  },
  component: ApplyPage,
});

function ApplyPage() {
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState<null | { already?: boolean; status?: string }>(null);
  const [err, setErr] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await applyAsAffiliate({
        data: {
          full_name: String(fd.get("full_name") || ""),
          email: String(fd.get("email") || ""),
          phone: String(fd.get("phone") || ""),
          audience: String(fd.get("audience") || ""),
          promo_plan: String(fd.get("promo_plan") || ""),
        },
      });
      if (!res.ok) setErr("Something went wrong. Try again or email referrals@poolrentalnearme.com.");
      else setDone({ already: res.alreadyExists, status: res.status });
    } catch (e: any) {
      setErr(e?.message || "Submission failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-2xl px-4 py-16">
          <Link to="/referral" className="text-sm text-primary underline-offset-4 hover:underline">
            &larr; Back to the referral program
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-foreground sm:text-4xl">Apply to refer hosts</h1>
          <p className="mt-3 text-muted-foreground">
            Earn 5% of every booking, for the lifetime of every host you bring to Pool Rental Near Me. We review
            applications manually and you'll hear back within 2 business days.
          </p>

          {done ? (
            <div className="mt-8 rounded-2xl border border-primary/30 bg-primary/5 p-6">
              <h2 className="text-xl font-semibold text-foreground">
                {done.already ? "You're already in the system" : "Application received"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {done.already
                  ? `Current status: ${done.status}. Sign in with the email you applied with to see your dashboard.`
                  : "We'll review and email you when your referral link is live. Once approved, sign in with this email to access your dashboard."}
              </p>
              <div className="mt-4 flex gap-3">
                <Link
                  to="/auth"
                  search={{ redirect: "/affiliate", mode: "signin" }}
                  className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
                >
                  Sign in
                </Link>
                <Link to="/referral" className="rounded-full border border-border px-5 py-2 text-sm font-semibold">
                  Back to overview
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6">
              <Field label="Full name" name="full_name" required maxLength={120} />
              <Field label="Email" name="email" type="email" required maxLength={255} />
              <Field label="Phone (optional)" name="phone" maxLength={40} />
              <TextArea
                label="Who's your audience?"
                name="audience"
                placeholder="e.g. pool owners in San Diego county, friends in real estate, my YouTube channel"
                maxLength={1000}
              />
              <TextArea
                label="How will you promote it?"
                name="promo_plan"
                placeholder="e.g. door hangers in HOA, IG reels, partner with pool service companies"
                maxLength={2000}
              />
              {err && <p className="text-sm text-destructive">{err}</p>}
              <button
                type="submit"
                disabled={busy}
                className="inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90 disabled:opacity-60"
              >
                {busy ? "Submitting..." : "Submit application"}
              </button>
              <p className="text-xs text-muted-foreground">
                By submitting you agree to receive program updates by email. Unsubscribe anytime.
              </p>
            </form>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  maxLength,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        maxLength={maxLength}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  placeholder,
  maxLength,
}: {
  label: string;
  name: string;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <textarea
        name={name}
        rows={3}
        placeholder={placeholder}
        maxLength={maxLength}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
      />
    </label>
  );
}
