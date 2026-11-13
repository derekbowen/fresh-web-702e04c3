import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  BROWSE_PATH,
  BROWSE_STATE_OPTIONS,
  buildBrowseHref,
  cityDisplayName,
  parseBrowseQuery,
} from "@/lib/browse-search";

/**
 * Only the filters the synced_listings mirror can actually apply: state and
 * city. Pool type, keywords and map area are deliberately not offered — under
 * mirror-only they would be dropped, and a control that does nothing is a
 * silent downgrade with a UI on it.
 */
export interface BrowseFilterValues {
  state?: string;
  city?: string;
}

const FIELD_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-base text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm";

const PRIMARY_BUTTON =
  "inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const LINK_BUTTON =
  "inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold text-primary hover:underline";

export function BrowseFilterForm({
  idPrefix,
  values,
  layout,
  onNavigate,
  className,
}: {
  /** Unique per instance: the desktop form and the sheet form are both in the DOM. */
  idPrefix: string;
  values: BrowseFilterValues;
  layout: "inline" | "stacked";
  onNavigate?: () => void;
  className?: string;
}) {
  const navigate = useNavigate();
  const initialCity = values.city ? cityDisplayName(values.city) : "";
  const [state, setState] = React.useState(values.state ?? "");
  const [city, setCity] = React.useState(initialCity);

  // Client-side navigation changes the props without remounting.
  React.useEffect(() => {
    setState(values.state ?? "");
    setCity(values.city ? cityDisplayName(values.city) : "");
  }, [values.state, values.city]);

  const hasActive = Boolean(values.state || values.city);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Exactly this form's fields. Legacy keywords/bounds/pool type are not
    // carried over: the visitor has re-scoped, and the read normalises the
    // city to the mirror's slug formula either way.
    const href = buildBrowseHref(parseBrowseQuery({ state, city }));
    onNavigate?.();
    void navigate({ href });
  }

  const inline = layout === "inline";

  return (
    // method/action make this work before hydration too: a native GET to /s
    // with state= and city= goes through the same parser.
    <form
      method="get"
      action={BROWSE_PATH}
      role="search"
      aria-label="Filter pools"
      onSubmit={onSubmit}
      className={cn(
        "flex flex-col gap-4",
        inline && "md:flex-row md:flex-wrap md:items-end",
        className,
      )}
    >
      <div className={cn("flex min-w-0 flex-col gap-2", inline && "md:w-60")}>
        <Label htmlFor={`${idPrefix}-state`}>State</Label>
        <select
          id={`${idPrefix}-state`}
          name="state"
          value={state}
          onChange={(e) => setState(e.target.value)}
          className={FIELD_CLASS}
        >
          <option value="">All states</option>
          {BROWSE_STATE_OPTIONS.map((o) => (
            <option key={o.code} value={o.code}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      <div className={cn("flex min-w-0 flex-col gap-2", inline && "md:w-60")}>
        <Label htmlFor={`${idPrefix}-city`}>City</Label>
        <Input
          id={`${idPrefix}-city`}
          name="city"
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Any city"
          autoComplete="address-level2"
          enterKeyHint="search"
          maxLength={120}
          className="h-10 bg-background"
        />
      </div>

      <div className={cn("flex flex-wrap items-center gap-2", !inline && "pt-2")}>
        <button type="submit" className={PRIMARY_BUTTON}>
          Show pools
        </button>
        {hasActive && (
          <a href={BROWSE_PATH} className={LINK_BUTTON}>
            Clear filters
          </a>
        )}
      </div>
    </form>
  );
}

/**
 * Mobile: a "Filters" button that opens the same form in a left-side sheet.
 *
 * Left, not bottom: a chat launcher sits in the bottom-right ~88×88 px and is
 * stacked above everything, including this sheet. The default left sheet is
 * 3/4 of the viewport wide (≈292 px at 390 px), so its controls never reach
 * that corner; a bottom sheet would put "Show pools" right under it.
 */
export function MobileBrowseFilters({
  values,
  className,
}: {
  values: BrowseFilterValues;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const active = (values.state ? 1 : 0) + (values.city ? 1 : 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary",
            className,
          )}
        >
          <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
          Filters
          {active > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
              <span className="sr-only">, </span>
              {active}
              <span className="sr-only"> active</span>
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter pools</SheetTitle>
          <SheetDescription>Narrow the list by state or city.</SheetDescription>
        </SheetHeader>
        <BrowseFilterForm
          idPrefix="browse-sheet"
          values={values}
          layout="stacked"
          onNavigate={() => setOpen(false)}
          className="mt-6"
        />
      </SheetContent>
    </Sheet>
  );
}
