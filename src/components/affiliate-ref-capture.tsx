import { useEffect } from "react";
import { recordAffiliateClick } from "@/lib/affiliate-click.functions";

const COOKIE_NAME = "prnm_ref";
const COOKIE_DAYS = 90;

function setCookie(name: string, value: string, days: number) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 86400_000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

/**
 * Reads `?ref=CODE` on load, persists a 90-day cookie, and fires a
 * fire-and-forget click record on the server.
 */
export function AffiliateRefCapture() {
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const ref = url.searchParams.get("ref");
      if (!ref || ref.length > 40) return;
      const code = ref.toUpperCase().trim();
      setCookie(COOKIE_NAME, code, COOKIE_DAYS);
      recordAffiliateClick({
        data: {
          ref_code: code,
          landing_path: url.pathname.slice(0, 500),
          referrer: (document.referrer || "").slice(0, 500),
        },
      }).catch(() => {});
    } catch {
      // ignore
    }
  }, []);
  return null;
}
