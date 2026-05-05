import { useState } from "react";
import { submitProviderLead } from "@/server/builders.functions";

interface Props {
  variant?: "footer" | "inline" | "card";
  defaultCity?: string;
  defaultState?: string;
  sourceProviderSlug?: string;
  sourcePath?: string;
  heading?: string;
  subheading?: string;
}

export function JoinNetworkForm({
  variant = "card",
  defaultCity = "",
  defaultState = "",
  sourceProviderSlug,
  sourcePath,
  heading = "Are you a pool builder or pool owner?",
  subheading = "Join the Pool Rental Near Me network — get listed, claim leads, and earn from your pool.",
}: Props) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await submitProviderLead({
        data: {
          name: String(fd.get("name") || ""),
          email: String(fd.get("email") || ""),
          phone: String(fd.get("phone") || ""),
          company: String(fd.get("company") || ""),
          website: String(fd.get("website") || ""),
          city: String(fd.get("city") || ""),
          state_code: String(fd.get("state_code") || ""),
          message: String(fd.get("message") || ""),
          source_provider_slug: sourceProviderSlug ?? "",
          source_path: sourcePath ?? (typeof window !== "undefined" ? window.location.pathname : ""),
        },
      });
      if (res.ok) {
        setStatus("success");
        e.currentTarget.reset();
      } else {
        setStatus("error");
        setErrorMsg(res.error);
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Submission failed");
    }
  }

  if (status === "success") {
    return (
      <div className={containerClass(variant)}>
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-foreground">You're on the list!</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Our team will reach out within 1 business day with next steps.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass(variant)}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground sm:text-xl">{heading}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{subheading}</p>
      </div>
      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
        <Input name="name" placeholder="Your name *" required />
        <Input name="email" type="email" placeholder="Email *" required />
        <Input name="phone" type="tel" placeholder="Phone" />
        <Input name="company" placeholder="Business name" />
        <Input name="website" placeholder="Website" className="sm:col-span-2" />
        <Input name="city" placeholder="City" defaultValue={defaultCity} />
        <Input name="state_code" placeholder="State (e.g. CA)" defaultValue={defaultState} maxLength={2} />
        <textarea
          name="message"
          placeholder="Tell us about your pool or business (optional)"
          rows={3}
          maxLength={2000}
          className="sm:col-span-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <div className="sm:col-span-2 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">By submitting, you agree to be contacted about joining the network.</p>
          <button
            type="submit"
            disabled={status === "submitting"}
            className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary-glow disabled:opacity-60"
          >
            {status === "submitting" ? "Submitting…" : "Join the network"}
          </button>
        </div>
        {status === "error" && (
          <p className="sm:col-span-2 text-sm text-destructive">{errorMsg}</p>
        )}
      </form>
    </div>
  );
}

function containerClass(variant: "footer" | "inline" | "card") {
  if (variant === "footer") return "rounded-2xl border border-border bg-card p-6";
  if (variant === "inline") return "rounded-2xl bg-secondary/40 p-6";
  return "rounded-2xl border border-border bg-card p-6 shadow-sm";
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={`rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${className}`}
    />
  );
}

interface ClaimProps {
  providerSlug: string;
  providerName: string;
}

export function ClaimListingCTA({ providerSlug, providerName }: ClaimProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-foreground">Is this your business?</p>
        <p className="text-xs text-muted-foreground">Claim {providerName} to update your profile, add photos, and get referral leads.</p>
      </div>
      <a
        href={`/providers/${encodeURIComponent(providerSlug)}/claim`}
        className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary-glow"
      >
        Claim this listing
      </a>
    </div>
  );
}
