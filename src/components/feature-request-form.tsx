import * as React from "react";
import { submitFeatureRequest } from "@/server/feature-requests.functions";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

export function FeatureRequestForm({
  className = "",
  variant = "light",
}: {
  className?: string;
  variant?: "light" | "dark";
}) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [city, setCity] = React.useState("");
  const [region, setRegion] = React.useState("");
  const [requestText, setRequestText] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    try {
      await submitFeatureRequest({
        data: {
          email: email.trim(),
          name: name.trim() || null,
          requestText: requestText.trim(),
          city: city.trim() || null,
          region: region.trim() || null,
          referrerPath:
            typeof window !== "undefined"
              ? window.location.pathname + window.location.search
              : null,
        },
      });
      setStatus("success");
      setName("");
      setEmail("");
      setCity("");
      setRegion("");
      setRequestText("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div
        className={`rounded-2xl border border-border bg-background p-6 text-center text-foreground shadow-xl ${className}`}
      >
        <h3 className="text-xl font-bold">Got it — we'll be in touch.</h3>
        <p className="mt-2 text-muted-foreground">
          Our team will reach out shortly to talk through what you want built.
        </p>
      </div>
    );
  }

  const isDark = variant === "dark";
  return (
    <form
      onSubmit={onSubmit}
      className={`rounded-2xl ${
        isDark ? "bg-white/10 ring-1 ring-white/20 backdrop-blur" : "border border-border bg-background"
      } p-5 text-left shadow-xl sm:p-6 ${className}`}
    >
      <h3 className={`text-lg font-bold sm:text-xl ${isDark ? "text-white" : "text-foreground"}`}>
        Tell us what to build — we ship same day.
      </h3>
      <p
        className={`mt-1 text-sm ${
          isDark ? "text-white/80" : "text-muted-foreground"
        }`}
      >
        Describe the feature you want, and we'll call you to scope it.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          type="text"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name (optional)"
          maxLength={120}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Email"
          maxLength={255}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          type="text"
          name="city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City"
          maxLength={120}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <select
          name="region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">State</option>
          {US_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <textarea
        name="request"
        value={requestText}
        onChange={(e) => setRequestText(e.target.value)}
        required
        minLength={5}
        maxLength={2000}
        rows={4}
        placeholder="What do you want us to build? (e.g., dynamic pricing, group bookings, custom liability waiver...)"
        className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      />

      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {status === "submitting" ? "Sending…" : "Request a feature"}
      </button>
    </form>
  );
}
