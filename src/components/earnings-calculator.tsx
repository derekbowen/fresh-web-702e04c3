import { useMemo, useState } from "react";

/**
 * Interactive earnings calculator for /p/become-a-pool-host-{city} pages.
 * Pure React + useState — no chart libraries. Renders a simple horizontal
 * bar chart from divs so we don't ship a recharts/d3 dependency just for
 * three bars.
 */
export function EarningsCalculator({
  cityName,
  defaultHourlyRate = 75,
}: {
  cityName: string;
  defaultHourlyRate?: number;
}) {
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [hourlyRate, setHourlyRate] = useState(defaultHourlyRate);
  const [poolSize, setPoolSize] = useState<"small" | "medium" | "large">("medium");

  const sizeMultiplier = poolSize === "small" ? 0.85 : poolSize === "large" ? 1.2 : 1;
  // Annual factor assumes 28 booking weeks (covers seasonal climates fairly).
  const ANNUAL_BOOKING_WEEKS = 28;

  const { weekly, monthly, annual } = useMemo(() => {
    const w = Math.round(hoursPerWeek * hourlyRate * sizeMultiplier);
    return {
      weekly: w,
      monthly: Math.round(w * 4.33),
      annual: Math.round(w * ANNUAL_BOOKING_WEEKS),
    };
  }, [hoursPerWeek, hourlyRate, sizeMultiplier]);

  const max = Math.max(annual, 1);
  const bars: Array<{ label: string; value: number }> = [
    { label: "Weekly", value: weekly },
    { label: "Monthly", value: monthly },
    { label: "Annual", value: annual },
  ];

  return (
    <section className="mt-12 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-foreground">
        Estimate your {cityName} pool rental income
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Adjust the inputs to model what hosting could look like for you.
        Estimates assume {ANNUAL_BOOKING_WEEKS} booking weeks per year.
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <SliderField
          label="Hours available per week"
          value={hoursPerWeek}
          min={1}
          max={40}
          onChange={setHoursPerWeek}
          format={(v) => `${v} hrs`}
        />
        <SliderField
          label="Hourly rate"
          value={hourlyRate}
          min={40}
          max={200}
          step={5}
          onChange={setHourlyRate}
          format={(v) => `$${v}`}
        />
      </div>

      <fieldset className="mt-6">
        <legend className="text-sm font-medium text-foreground">Pool size</legend>
        <div className="mt-2 inline-flex rounded-full border border-border bg-muted/40 p-1">
          {(["small", "medium", "large"] as const).map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setPoolSize(size)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
                poolSize === size
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={poolSize === size}
            >
              {size}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-8 space-y-3" role="img" aria-label="Estimated earnings chart">
        {bars.map((bar) => {
          const pct = Math.max(2, Math.round((bar.value / max) * 100));
          return (
            <div key={bar.label}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium text-foreground">{bar.label}</span>
                <span className="font-semibold text-foreground">
                  ${bar.value.toLocaleString()}
                </span>
              </div>
              <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Estimates are illustrative and depend on demand, season, photo quality,
        and how quickly you respond to bookings. Pool Rental Near Me takes a flat
        10% host fee — already excluded from the numbers above is nothing,
        these figures are gross. Subtract 10% for net.
      </p>
    </section>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="font-semibold text-foreground">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-primary"
      />
    </label>
  );
}
