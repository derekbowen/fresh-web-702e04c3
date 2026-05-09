## Scope

Blog posts live in `blog_posts` and render at `/p/{slug}` via the dispatcher in `src/routes/p.$slug.tsx`, which synthesizes a `ContentPage` (template_type `resource`, category = topic) and renders `ResourceArticleTemplate`. All work below targets that flow.

## 1. AI-generated cards (pre-generated, stored in DB)

**Migration** — new columns on `blog_posts`:
- `tldr_bullets jsonb` — array of 3–5 short strings
- `related_slugs jsonb` — array of 4–6 sibling blog slugs
- `enrichment_generated_at timestamptz`

**Server functions** (`src/server/blog-enrichment.functions.ts`):
- `enrichBlogPost({ slug })` — calls Lovable AI Gateway (`google/gemini-3-flash-preview`) using tool-calling for structured TL;DR. Picks related slugs via in-DB keyword/title overlap on same topic + recency (deterministic, free). Writes back to `blog_posts`.
- `enrichBlogBatch({ limit, onlyMissing })` — backfills posts missing enrichment.

**Wire-through**: in `lookupContentPage` (`content-pages.functions.ts`), include the new fields on the synthetic `ContentPage` (extend `ContentPage` type with optional `tldr_bullets` + `related_slugs`).

**UI components**:
- `src/components/blog/tldr-card.tsx` — bordered card under H1, "Key takeaways" + bullets.
- `src/components/blog/related-posts-card.tsx` — card grid with title + topic + cover, hits `/p/{slug}`.
- Render both in `ResourceArticleTemplate` when fields present.

**Admin**: add a "Regenerate enrichment" button on `admin.blog.tsx` per post + bulk backfill action.

## 2. Internal linking improvements

- **Breadcrumbs (resource template)**: `Home › Blog › {Topic} › {Title}`, with topic linking to `/p/blog?topic={slug}`. Update breadcrumb JSON-LD to match.
- **Topic hub filter**: extend `/p/blog` (`p.blog.tsx`) to accept `?topic=` and filter; topic chips at top.
- **Auto-link keywords in body**: replace `<ReactMarkdown>` body with the existing `<AutoLinkedContent>` (already passed `linkTargets` but ignored as `_linkTargets`). Auto-links cities/topics/other posts mentioned in the text.
- **Inline 'Related' callout**: insert one styled callout after ~50% of article body pointing to the top 1–2 related posts.

## 3. GSC redirect / canonical hardening

- **Confirm `/blog/*` 301**: already wired in `src/routes/blog.$.ts` and `blog.ts` — verified.
- **Canonical**: `head()` already sets canonical to `/p/{slug}` for blog posts — verified, no change.
- **Trailing slash**: add `src/routes/p.blog.index.ts` redirect for `/p/blog/` variants if needed (TanStack normalizes most; add only if missing).
- **GSC 404 audit**: query `content_404_log` for top legacy patterns; add prefix mappings to `src/lib/legacy-redirects.ts` for any new clusters found (no-op if none).

## What we are NOT doing (callouts)

- No AI on related-posts (deterministic title/topic similarity is faster, free, and still high-quality for ~124 posts). Easy upgrade to embeddings later if desired.
- No FAQ card or CTA card this pass (you skipped them).
- No edge-function infra; pre-generation runs through a server fn callable from admin.

## Deliverables order

1. DB migration (blog_posts columns)
2. Enrichment server fn + lookup wire-through
3. UI cards + template integration
4. Internal-linking upgrades (breadcrumbs, topic filter, auto-link, inline callout)
5. GSC audit + any new legacy redirect entries
6. Backfill all 124 published posts with enrichment

After approval I'll execute steps 1–6 in order, batching file edits where safe.