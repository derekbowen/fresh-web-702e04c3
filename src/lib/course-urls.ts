/**
 * Canonical paths for the Pool Host Learning Academy.
 *
 * The hubs and course detail pages are SSR routes under /p/* so they're
 * indexable by Google and routable through the nginx proxy.
 */

import type { Lang } from "@/lib/academy";

/** English academy hub. */
export const ACADEMY_HUB_PATH = "/p/learningacademy";

/** Spanish academy hub (separate content_pages row, not a query param). */
export const SPANISH_ACADEMY_HUB_PATH = "/p/aprende-a-rentar-tu-piscina";

/** Slug used in the content_pages table for each hub. */
export const ACADEMY_HUB_SLUGS = {
  en: "learningacademy",
  es: "aprende-a-rentar-tu-piscina",
} as const;

export function academyHubPath(lang: Lang = "en"): string {
  return lang === "es" ? SPANISH_ACADEMY_HUB_PATH : ACADEMY_HUB_PATH;
}

/** Detail page for an individual course. Course slugs are unique across langs. */
export function coursePath(slug: string): string {
  return `/p/course/${encodeURIComponent(slug)}`;
}
