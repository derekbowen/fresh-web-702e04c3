import { useEffect, useState } from "react";
import fredFull from "@/assets/fred.png";
import fredAvatar from "@/assets/fred-avatar.png";

/**
 * Fred — the Pool Rental Near Me hosting mascot.
 * Use `variant="full"` for hero/tip-widget contexts, `variant="avatar"`
 * for course-card badges and inline contexts.
 */
export function FredMascot({
  variant = "full",
  className = "",
  alt = "Fred, your pool hosting coach",
}: {
  variant?: "full" | "avatar";
  className?: string;
  alt?: string;
}) {
  const src = variant === "full" ? fredFull : fredAvatar;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}

/** Tips Fred rotates through in the floating widget. */
const FRED_TIPS: string[] = [
  "Charge 25% more on holidays. Hosts who don't leave $400-$800 per booking on the table.",
  "Reply within 1 hour or you'll lose the booking. The fastest host usually wins.",
  "Add a $50 cleaning fee and 4-hour minimum. Filters out cheapskates.",
  "5 outdoor photos beat 20 indoor ones. Sunlight sells.",
  "Block off the first hour after a booking. You'll need it for cleanup.",
  "Bachelorette parties pay 2x. Don't ban them — set rules and cash in.",
  "List on PRNM, Swimply, and Peerspace. Hosts on 3 platforms earn 60% more.",
  "Heated pools book year-round in Texas, Arizona, Florida. Worth the gas bill.",
  "Photoshoots and content creators pay the highest hourly rates. Pitch them direct.",
  "$2M liability insurance is included on every PRNM booking. Mention it in your listing.",
];

/**
 * Floating Fred tip widget — bottom-right on academy pages.
 * Dismissible per session.
 */
export function FloatingFredTip() {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [tipIdx, setTipIdx] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("fred-tip-dismissed") === "1") {
      setDismissed(true);
      return;
    }
    // Pick a random tip per page view
    setTipIdx(Math.floor(Math.random() * FRED_TIPS.length));
    const t = setTimeout(() => setOpen(true), 2500);
    return () => clearTimeout(t);
  }, []);

  if (dismissed) return null;

  const nextTip = () => setTipIdx((i) => (i + 1) % FRED_TIPS.length);
  const dismiss = () => {
    sessionStorage.setItem("fred-tip-dismissed", "1");
    setDismissed(true);
  };

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-40 hidden items-end gap-2 sm:flex">
      {open && (
        <div className="pointer-events-auto relative mb-2 max-w-[260px] rounded-2xl border border-border bg-card p-3 pr-7 text-sm shadow-xl sm:max-w-xs">
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss Fred"
            className="absolute right-1.5 top-1.5 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
            Fred's tip
          </div>
          <p className="leading-snug text-foreground">{FRED_TIPS[tipIdx]}</p>
          <button
            type="button"
            onClick={nextTip}
            className="mt-2 text-xs font-semibold text-primary hover:underline"
          >
            Next tip →
          </button>
          <div className="absolute -bottom-1.5 right-8 h-3 w-3 rotate-45 border-b border-r border-border bg-card" />
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Hide Fred" : "Get a tip from Fred"}
        className="pointer-events-auto h-20 w-20 transition-transform hover:scale-110 active:scale-95 sm:h-24 sm:w-24"
      >
        <FredMascot variant="full" className="h-full w-full drop-shadow-lg" alt="Fred" />
      </button>
    </div>
  );
}
