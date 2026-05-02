import { useState, type ReactNode } from "react";

// ===== Shared UI primitives =====

export function ToolShell({
  title,
  summary,
  children,
  output,
}: {
  title: string;
  summary: string;
  children: ReactNode;
  output?: ReactNode;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
        <div className="mt-5 space-y-4">{children}</div>
      </div>
      {output && (
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-primary-glow/5 p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Result</h3>
          <div className="mt-3">{output}</div>
        </div>
      )}
    </div>
  );
}

export function NumberField({
  label, value, onChange, suffix, min = 0, step = 1,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  suffix?: string;
  min?: number;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">{label}</span>
      <div className="relative">
        <input
          type="number"
          min={min}
          step={step}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 pr-14 text-sm focus:border-primary focus:outline-none"
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

export function TextField({
  label, value, onChange, placeholder, multiline,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={5}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
        />
      )}
    </label>
  );
}

export function SelectField<T extends string>({
  label, value, onChange, options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-background/60 p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold text-foreground">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export const $ = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
export const $$ = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
export const num = (n: number, d = 0) => n.toLocaleString(undefined, { maximumFractionDigits: d });

// ===== Pool volume helper (used by many tools) =====

export type PoolShape = "rectangle" | "round" | "oval";

export function poolGallons({
  shape, length, width, depth,
}: { shape: PoolShape; length: number; width: number; depth: number }) {
  if (shape === "rectangle") return length * width * depth * 7.48;
  if (shape === "round") return Math.PI * Math.pow(length / 2, 2) * depth * 7.48;
  return Math.PI * (length / 2) * (width / 2) * depth * 7.48;
}

// ===== Hook: copy-to-clipboard for generators =====

export function useCopy() {
  const [copied, setCopied] = useState(false);
  return {
    copied,
    copy: async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        /* ignore */
      }
    },
  };
}
