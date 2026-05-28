import { useEffect, useRef, useState } from "react";

const TIDYCAL_URL = "https://tidycal.com/meetderek/15-minute-meeting";

type Lang = "en" | "es";

const COPY = {
  en: {
    heading: "Thinking about listing your pool? Talk to Derek, the founder.",
    sub: "Book 15 minutes with me. I'll walk you through how it works, what you could earn, how insurance covers you, and how to get your first booking. No pressure, no sales pitch.",
    slide: "Still thinking it over?",
    slideCta: "Talk to the founder, 15 min",
    dismiss: "Dismiss",
    open: "Open booking",
    close: "Close",
  },
  es: {
    heading: "¿Estás pensando en publicar tu piscina? Habla con Derek, el fundador.",
    sub: "Reserva 15 minutos conmigo. Te explico cómo funciona, cuánto podrías ganar, cómo te cubre el seguro y cómo conseguir tu primera reserva. Sin compromiso y sin ventas.",
    slide: "¿Todavía lo estás pensando?",
    slideCta: "Habla con el fundador, 15 min",
    dismiss: "Cerrar",
    open: "Abrir reserva",
    close: "Cerrar",
  },
} as const;

/**
 * Inline lazy-loaded TidyCal booking embed.
 * Iframe is only injected once the section scrolls into view to protect LCP.
 */
export function FounderBookingInline({ lang = "en" }: { lang?: Lang }) {
  const ref = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState(false);
  const t = COPY[lang];

  useEffect(() => {
    if (load || !ref.current) return;
    if (typeof IntersectionObserver === "undefined") {
      setLoad(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setLoad(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [load]);

  return (
    <section className="border-b border-border bg-muted/20 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Free 15-min founder call
          </div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t.heading}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {t.sub}
          </p>
        </div>

        <div
          ref={ref}
          className="mx-auto mt-8 w-full max-w-[700px] overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
          style={{ minHeight: 640 }}
        >
          {load ? (
            <iframe
              src={TIDYCAL_URL}
              title="Book a 15-minute call with Derek"
              loading="lazy"
              className="h-[640px] w-full"
              style={{ border: 0 }}
            />
          ) : (
            <div className="flex h-[640px] w-full items-center justify-center text-sm text-muted-foreground">
              Loading calendar…
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Scroll-triggered, dismissible bottom-right slide-in. Fires once at 65% scroll
 * per session (sessionStorage). Clicking the CTA opens the TidyCal iframe in a
 * modal overlay. Designed to avoid Google's intrusive-interstitial penalty:
 * small corner card, easy dismiss, never auto-blocks content.
 */
export function FounderBookingSlideIn({ lang = "en" }: { lang?: Lang }) {
  const t = COPY[lang];
  const KEY = "founder-slidein-dismissed";
  const [visible, setVisible] = useState(false);
  const [modal, setModal] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(KEY)) return;

    const onScroll = () => {
      const doc = document.documentElement;
      const scrolled =
        (window.scrollY + window.innerHeight) /
        Math.max(doc.scrollHeight, 1);
      if (scrolled >= 0.65) {
        setVisible(true);
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dismiss = () => {
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {}
    setVisible(false);
  };

  if (!visible && !modal) return null;

  return (
    <>
      {visible && !modal && (
        <div
          className="fixed bottom-4 right-4 z-[90] w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-border bg-card p-4 shadow-2xl sm:bottom-6 sm:right-6"
          role="complementary"
          aria-label="Talk to the founder"
        >
          <button
            onClick={dismiss}
            aria-label={t.dismiss}
            className="absolute right-2 top-2 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div className="pr-6 text-sm font-semibold text-foreground">
            {t.slide}
          </div>
          <button
            onClick={() => setModal(true)}
            className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition hover:opacity-90"
          >
            → {t.slideCta}
          </button>
        </div>
      )}

      {modal && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Book a call with Derek"
          onClick={() => {
            setModal(false);
            dismiss();
          }}
        >
          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setModal(false);
                dismiss();
              }}
              aria-label={t.close}
              className="absolute right-3 top-3 z-10 rounded-full bg-background/90 p-2 text-foreground shadow hover:bg-muted"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <iframe
              src={TIDYCAL_URL}
              title="Book a 15-minute call with Derek"
              loading="lazy"
              className="h-[80vh] w-full"
              style={{ border: 0 }}
            />
          </div>
        </div>
      )}
    </>
  );
}
