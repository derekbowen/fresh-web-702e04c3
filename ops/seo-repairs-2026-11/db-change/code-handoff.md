# Code hand-off from the database change (review of 2026-11-16)

Nothing in `src/**` was edited. These belong in application code; Derek decides (RUNBOOK §0.2).

## 1. Country sitemaps advertise `updated_at` as `lastmod`

File: `src/routes/sitemap-country[.]xml.ts`, lines 43-51: selects `slug, updated_at` and emits
`lastmod: row.updated_at`.

Every row the database change writes gets `updated_at = now()` from the `trg_content_pages_updated_at` trigger (about
6,500 `content_pages` rows, most of them for link-only edits). The `.co.uk`, `.ca` and `.com.au` sitemaps would then
advertise those pages as freshly modified. `src/lib/sitemap.ts:158-162` records the same problem from 2026-09-01 and
switched the main sitemaps to `content_refreshed_at` for that reason; the country sitemap was not switched.

Proposed edit (same rule as `src/lib/sitemap.ts`):
- select `slug, content_refreshed_at, created_at` instead of `slug, updated_at`;
- `lastmod: row.content_refreshed_at ?? row.created_at`.

Ship it before the database change if Derek wants link-only edits kept out of `lastmod`.

Other readers of `updated_at` that will move (no change proposed, listed so nobody is surprised):
- JSON-LD `dateModified` and `article:modified_time` in `src/routes/p.$slug.tsx` (around lines 341 and 402);
- visible "updated" dates in `src/components/templates/advocacy.tsx` (around line 284) and
  `src/components/templates/pool-maintenance.tsx` (around lines 146-154).

## 2. Writers that can undo the change (lost update)

`src/server/link-auto-fix.server.ts:136` writes `body_markdown` by `id` with no check that the body is still the one it
read. If it runs across the apply window it can write a pre-apply body back. Also the admin SEO bulk tools
(`src/server/admin-seo-tools.functions.ts`, `src/server/link-checker.functions.ts`). The runbook pauses them during
apply and `verify.sql` detects a revert. A durable fix is an optimistic guard in those writers (update only
`where id = ? and body_markdown = <value read>`, or compare `updated_at`); not proposed in detail here.
