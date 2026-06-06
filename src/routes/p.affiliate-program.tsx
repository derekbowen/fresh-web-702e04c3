import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { buildMeta } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { applyAsAffiliate } from "@/lib/affiliate-apply.functions";

const PATH = "/p/affiliate-program";
const TITLE = "Apply to the Pool Rental Near Me Affiliate Program";
const DESCRIPTION =
  "Refer pool hosts to Pool Rental Near Me and earn 5% of every booking they take, for the lifetime of the host.";

export const Route = createFileRoute("/p/affiliate-program")({
  head: () => {
    const meta = buildMeta({ title: TITLE, description: DESCRIPTION, path: PATH });
    return { meta: meta.meta, links: meta.links };
  },
  component: ApplyPage,
});

function ApplyPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");

    try {
      const res = await applyAsAffiliate({
        data: {
          full_name: String(fd.get("full_name") || ""),
          email,
          password,
          phone: String(fd.get("phone") || ""),
          audience: String(fd.get("audience") || ""),
          promo_plan: String(fd.get("promo_plan") || ""),
        },
      });

      if (!res.ok) {
        setErr(res.error || "Something went wrong. Try again or email referrals@poolrentalnearme.com.");
        setBusy(false);
        return;
      }

      // Auto sign-in so they land in the dashboard
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        // Account exists with a different password — send them to sign in
        navigate({
          to: "/auth",
          search: { redirect: "/p/affiliate-dashboard", mode: "signin" } as any,
        });
        return;
      }
      navigate({ to: "/p/affiliate-dashboard" });
    } catch (e: any) {
      setErr(e?.message || "Submission failed.");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-2xl px-4 py-16">
          <Link to="/p/affiliate" className="text-sm text-primary underline-offset-4 hover:underline">
            &larr; Back to the referral program
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-foreground sm:text-4xl">
            Create your affiliate account
          </h1>
          <p className="mt-3 text-muted-foreground">
            Earn 5% of every booking, for the lifetime of every host you bring to Pool Rental Near Me. Your
            dashboard goes live the moment we approve you, usually within 2 business days.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6">
            <Field label="Full name" name="full_name" required maxLength={120} autoComplete="name" />
            <Field label="Email" name="email" type="email" required maxLength={255} autoComplete="email" />
            <Field
              label="Create a password"
              name="password"
              type="password"
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              hint="Minimum 8 characters. You'll use this to sign in to your dashboard."
            />
            <Field label="Phone (optional)" name="phone" maxLength={40} autoComplete="tel" />
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
              {busy ? "Creating your account..." : "Create account & apply"}
            </button>
            <p className="text-xs text-muted-foreground">
              By submitting you agree to receive program updates by email. Unsubscribe anytime.
            </p>
            <p className="text-center text-xs text-muted-foreground">
              Already applied?{" "}
              <Link
                to="/auth"
                search={{ redirect: "/p/affiliate-dashboard", mode: "signin" } as any}
                className="text-primary underline-offset-4 hover:underline"
              >
                Sign in to your dashboard
              </Link>
            </p>
          </form>
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
  minLength,
  autoComplete,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        maxLength={maxLength}
        minLength={minLength}
        autoComplete={autoComplete}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
      />
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
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
