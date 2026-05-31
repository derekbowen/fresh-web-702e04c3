import { Component, useEffect, useMemo, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { getListingAvailability, type AvailabilityResult } from "@/lib/availability.functions";
import { isValidIsoPair } from "@/lib/availability.utils";

type Props = {
  listingId: string;
  listingSlug: string;
  bookingBaseUrl?: string; // e.g. "https://poolrentalnearme.com"
  days?: number; // 1-90
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatHour(iso: string): string {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "--";
  const d = new Date(ms);
  let h = d.getHours();
  const m = d.getMinutes();
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return m === 0 ? `${h}${period}` : `${h}:${String(m).padStart(2, "0")}${period}`;
}

class AvailabilityErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: unknown) {
    console.error("AvailabilityCalendar render error:", err);
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

export function AvailabilityCalendar(props: Props) {
  const baseUrl = String(props.bookingBaseUrl ?? "https://poolrentalnearme.com").replace(/\/$/, "");
  const fallback = (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-card px-6 py-12 text-center shadow-sm">
        <AlertCircle className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Calendar temporarily unavailable.</p>
        <a
          href={`${baseUrl}/l/${props.listingSlug}/${props.listingId}`}
          className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
        >
          Click to book directly →
        </a>
      </div>
    </section>
  );
  return (
    <AvailabilityErrorBoundary fallback={fallback}>
      <AvailabilityCalendarInner {...props} />
    </AvailabilityErrorBoundary>
  );
}

function AvailabilityCalendarInner({

  listingId,
  listingSlug,
  bookingBaseUrl = "https://poolrentalnearme.com",
  days = 60,
}: Props) {
  const fetchAvailability = useServerFn(getListingAvailability);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const [viewMonth, setViewMonth] = useState<Date>(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [data, setData] = useState<AvailabilityResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const refetch = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setIsError(false);
    fetchAvailability({ data: { listingId, days } })
      .then((res) => {
        if (cancelled) return;
        const safe: AvailabilityResult =
          res && typeof res === "object"
            ? {
                listingId: String((res as any).listingId ?? listingId),
                fetchedAt: String((res as any).fetchedAt ?? new Date().toISOString()),
                slots: Array.isArray((res as any).slots) ? (res as any).slots : [],
                error: (res as any).error ?? null,
                cached: (res as any).cached,
              }
            : { listingId, fetchedAt: new Date().toISOString(), slots: [], error: "Bad response" };
        setData(safe);
        setIsError(!!safe.error);
      })
      .catch(() => {
        if (cancelled) return;
        setIsError(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // fetchAvailability is stable from useServerFn
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId, days, reloadKey]);

  // Group slots by YYYY-MM-DD (validating each slot defensively)
  const slotsByDay = useMemo(() => {
    const map = new Map<string, { start: string; end: string }[]>();
    const rawSlots = Array.isArray(data?.slots) ? data!.slots : [];
    for (const s of rawSlots) {
      const v = isValidIsoPair((s as any)?.start, (s as any)?.end);
      if (!v) continue;
      const dt = new Date(v.start);
      if (isNaN(dt.getTime())) continue;
      const key = ymd(dt);
      const arr = map.get(key) ?? [];
      arr.push({ start: v.start, end: v.end });
      map.set(key, arr);
    }
    return map;
  }, [data]);


  const maxDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d;
  }, [today, days]);

  // Build calendar grid for viewMonth
  const grid = useMemo(() => {
    const firstOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const startWeekday = firstOfMonth.getDay();
    const lastOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= lastOfMonth.getDate(); d++) {
      cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewMonth]);

  const canGoPrev = viewMonth > new Date(today.getFullYear(), today.getMonth(), 1);
  const canGoNext =
    new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1) <= maxDate;

  const selectedSlots = selectedDate ? slotsByDay.get(selectedDate) ?? [] : [];

  function buildBookingUrl(startISO: string, endISO: string): string {
    const base = String(bookingBaseUrl ?? "https://poolrentalnearme.com").replace(/\/$/, "");
    const params = new URLSearchParams({
      bookingStart: startISO,
      bookingEnd: endISO,
    });
    return `${base}/l/${listingSlug}/${listingId}/checkout?${params.toString()}`;
  }


  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          Live availability
        </span>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Pick a day, then a time
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Real-time openings from the host's calendar. Tap a date to see hourly slots.
        </p>
      </div>

      {!mounted ? (
        <div className="mt-8 flex items-center justify-center gap-2 rounded-3xl border border-border bg-card px-6 py-16 text-sm text-muted-foreground shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading live availability…
        </div>
      ) : (

      <div className="mt-8 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        {/* Calendar header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() =>
              canGoPrev &&
              setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))
            }
            disabled={!canGoPrev}
            className="rounded-full p-2 text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-base font-semibold text-foreground sm:text-lg">
            {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
          </div>
          <button
            type="button"
            onClick={() =>
              canGoNext &&
              setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))
            }
            disabled={!canGoNext}
            className="rounded-full p-2 text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Loading / error */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading live availability…
          </div>
        )}
        {!isLoading && isError && (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Calendar temporarily unavailable.
            </p>
            <a
              href={`${bookingBaseUrl.replace(/\/$/, "")}/l/${listingSlug}/${listingId}`}
              className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
            >
              Click to book directly →
            </a>
            <button
              type="button"
              onClick={() => refetch()}
              className="text-xs font-medium text-muted-foreground underline hover:text-foreground"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            {/* Weekday header */}
            <div className="grid grid-cols-7 border-b border-border bg-secondary/40 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {DAY_NAMES.map((d) => (
                <div key={d} className="py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {grid.map((d, i) => {
                if (!d) return <div key={i} className="aspect-square" />;
                const key = ymd(d);
                const past = d < today;
                const beyond = d > maxDate;
                const slots = slotsByDay.get(key);
                const hasSlots = !!slots && slots.length > 0;
                const isSelected = selectedDate === key;
                const disabled = past || beyond || !hasSlots;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => !disabled && setSelectedDate(key)}
                    disabled={disabled}
                    className={[
                      "group relative aspect-square border-b border-r border-border p-1 text-xs sm:text-sm",
                      "flex flex-col items-center justify-center gap-1 transition",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : hasSlots
                          ? "bg-card text-foreground hover:bg-primary/10"
                          : "bg-secondary/20 text-muted-foreground",
                      disabled ? "cursor-not-allowed" : "cursor-pointer",
                    ].join(" ")}
                    aria-label={
                      hasSlots
                        ? `${d.toDateString()}, ${slots!.length} slots available`
                        : `${d.toDateString()}, unavailable`
                    }
                  >
                    <span className="font-semibold">{d.getDate()}</span>
                    {hasSlots && !isSelected && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                    {hasSlots && isSelected && (
                      <span className="text-[10px] font-medium opacity-90">
                        {slots!.length} slots
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Slot picker */}
            <div className="border-t border-border bg-secondary/20 p-4 sm:p-6">
              {!selectedDate && (
                <p className="text-center text-sm text-muted-foreground">
                  Select an available date above to see open hours.
                </p>
              )}
              {selectedDate && selectedSlots.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  No openings on this date. Try another day.
                </p>
              )}
              {selectedDate && selectedSlots.length > 0 && (
                <>
                  <div className="mb-3 text-sm font-semibold text-foreground">
                    Available times on{" "}
                    {new Date(selectedDate + "T12:00:00").toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                    {selectedSlots.map((s) => {
                      const startLabel = formatHour(s.start);
                      const endLabel = formatHour(s.end);
                      if (startLabel === "--" || endLabel === "--") return null;
                      return (
                        <a
                          key={s.start}
                          href={buildBookingUrl(s.start, s.end)}
                          className="group flex items-center justify-center rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow"
                        >
                          {startLabel}
                          <span className="mx-1 text-muted-foreground group-hover:text-primary-foreground/80">
                            –
                          </span>
                          {endLabel}
                        </a>
                      );
                    })}

                  </div>
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    Tap a time to continue checkout on poolrentalnearme.com.
                  </p>
                </>
              )}
            </div>
          </>
        )}
      </div>
      )}

      {mounted && data && (Array.isArray(data.slots) ? data.slots.length : 0) === 0 && !isError && !isLoading && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          No openings in the next {days} days. Message the host for custom dates.
        </p>
      )}

    </section>
  );
}
