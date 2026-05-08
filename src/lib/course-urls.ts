export const ACADEMY_HUB_PATH = "/p/learningacademy";
export const SPANISH_ACADEMY_HUB_PATH = "/p/learningacademy?lang=es";

export function coursePath(slug: string): string {
  return `/p/course/${encodeURIComponent(slug)}`;
}