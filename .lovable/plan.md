
## Goal

Fill the top 30 blank `/p/*` pages in `content_pages` with real, useful, slug-aware copy and flip them to `status='published'` so they stop ranking as blank in Google.

## Selection (the "top 30")

No click data is stored in the DB, so rank by:
1. `priority DESC NULLS LAST`
2. then category bucket order: `Host Acquisition (Hub)` → `Host Advocacy (State Guide)` → `Host Acquisition (City pSEO)` → `Resource/Article Page` → `Event/City Guide`
3. then `url_path ASC` for determinism

Filter: `url_path LIKE '/p/%' AND status != 'published' AND (body_markdown IS NULL OR length(body_markdown) < 200)`. Limit 30.

If you give me a CSV of the 30 specific slugs you actually care about, I'll use that list verbatim instead.

## Templates (slug-driven)

The script classifies each slug by regex into one of three templates, each with its own system prompt:

**A. Host recruitment city page** — slug matches `^become-a-(swimming-)?pool-host-{city}-{state}$`
- Title: `Become a Pool Host in {City}, {ST}`
- 800–1200 words: local market opportunity, pool types that perform, peak season, pricing tips, **PRNM 10% vs Swimply 15%+**, link to earnings calculator (`/p/earnings-calculator`), nearby cities, 5-Q FAQ
- CTAs to `/l/draft/00000000-0000-0000-0000-000000000000/new/details` and `/p/hosting`

**B. State host advocacy guide** — slug matches `^{state}-pool-host-advocacy-guide$`
- Title: `Pool Host Advocacy & Legality in {State}`
- 1000–1500 words: state legality status, permits, HOA defense, zoning, sources. Pulls real data from `state_pool_regulations` for that state when available, then asks the model to expand it.

**C. Resource / article page** — everything else
- Title: human-readable from slug
- 800–1500 words on the slug's topic, internal links to `/s`, `/p/hosting`, `/p/all-locations`

All three templates instruct the model to return JSON via tool calling: `{ title, seo_title (≤60ch), seo_description (≤155ch), body_markdown }`.

## Script

`scripts/backfill-content-pages.ts` (run with `bun`, not deployed):

```text
1. Connect to Supabase with SUPABASE_SERVICE_ROLE_KEY (admin client).
2. Select top 30 blank /p/ rows (query above).
3. For each row:
   a. Classify slug → template A/B/C.
   b. Build prompt + tool schema.
   c. Call Lovable AI Gateway (https://ai.gateway.lovable.dev/v1/chat/completions)
      with model openai/gpt-5 and tool_choice forcing the structured response.
      Handles 429 (sleep + retry, 3x backoff) and 402 (abort with clear message).
   d. UPDATE content_pages SET title, seo_title, seo_description,
      body_markdown, status='published', updated_at=now()
      WHERE id = $1.
   e. Log to stdout: slug, word count, status.
   f. Sleep 1.5s between calls (rate-limit safety).
4. Print summary: succeeded / skipped / failed.
```

Reads `LOVABLE_API_KEY` from env (already configured). Idempotent — re-running skips rows that now have ≥200 chars of `body_markdown`.

A `--dry-run` flag prints the planned 30 slugs + classifications without calling AI or writing.
A `--limit N` flag overrides 30.
A `--slugs file.txt` flag uses a custom list.

## Rendering

Need to confirm the existing `/p/$slug` route renders `body_markdown` (and `title` / `seo_title` / `seo_description` into head). I'll check `src/routes/p.$slug.tsx` (or equivalent) before running and patch it if it currently only renders `raw_html`. Markdown rendering will use the existing markdown component if present, otherwise add `react-markdown` + `remark-gfm`.

## Acceptance check

After the run:
- `SELECT count(*) FROM content_pages WHERE status='published' AND length(body_markdown) > 600` increases by ~30.
- Spot-check 3 slugs in the preview: a host-city page, a state advocacy page, an article page — all render full content with correct `<title>` and meta description.

## Out of scope

- The other ~2,385 blank `/p/` pages (separate batch job once we confirm the template quality).
- The blank `/c/`, `/s/...` slugs.
- Rewriting the `/p/$slug` route's design.

## Technical notes

- Default model: `openai/gpt-5`. Override with `--model`. (Switch to `google/gemini-2.5-pro` if rate-limited.)
- Structured output via tool calling, not "respond as JSON" — more reliable.
- Estimated cost: ~30 × ~2k output tokens = trivial under the included Lovable AI monthly credits.
- Estimated wall time: ~3–5 minutes for 30 slugs.
- Switching to direct Anthropic API requires you to add `ANTHROPIC_API_KEY` as a secret — say the word and I'll prompt for it instead.

