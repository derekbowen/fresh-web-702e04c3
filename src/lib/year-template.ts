/**
 * Year template helper.
 *
 * Replaces `{{year}}` tokens in any string with the current calendar year.
 * Lets us bake "2026" into seo_title / seo_description / body content at
 * render time instead of running a manual annual content sweep every
 * January.
 *
 * Used by:
 *  - src/routes/p.$slug.tsx (title / description / og)
 *  - src/components/templates/resource-article.tsx (body)
 *  - src/routes/index.tsx (homepage title)
 */
export function applyYearTemplate(input: string | null | undefined): string {
  if (!input) return "";
  const year = new Date().getUTCFullYear();
  return input.replace(/\{\{\s*year\s*\}\}/gi, String(year));
}
