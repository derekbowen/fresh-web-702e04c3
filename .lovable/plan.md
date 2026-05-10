## Quick answers to your questions

**Does the body need to be markdown?** Yes, keep it markdown. The public page renders it with ReactMarkdown, which turns `##` into real `<h2>`s, `-` into `<ul>`s, `**bold**` into `<strong>`, etc. That's what gives Google proper heading structure. If we switched to plain text we'd lose all of that and the pages would tank in search. I'll add a tiny "Markdown cheat sheet" hint under the textarea so it's friendlier to write.

**What other SEO fields can we add?** Plenty. See section 1 below.

---

## 1. New SEO fields in the editor

Add these inputs (all optional, all save to `content_pages`):

- **Hero image URL** (already in DB as `hero_image_url`, just not exposed) — used for `og:image` / Twitter card. Single biggest social-share win.
- **Canonical URL override** — for the rare case a page should canonical to a different URL.
- **Focus keyword** — single phrase the page targets. We'll use it for AI prompts and show a live "title contains keyword" / "description contains keyword" / "H1 contains keyword" check.
- **Live SEO score panel** on the right side of the modal:
  - Title length (green 50–60, yellow 40–49, red otherwise)
  - Description length (green 140–155)
  - H1 present
  - Word count (green 800+ for city pages)
  - Internal links count
  - Focus keyword appears in title / description / first 100 words
- **Slug / URL path** — read-only display with a "copy" button (we don't let admins change it; it would break links).
- **OG title / OG description** — optional overrides separate from SEO title/description (some pages want a punchier social headline). Stored as new columns `og_title`, `og_description`.
- **Last edited** + **Published date** — read-only timestamps.

We will NOT add: noindex toggle (status=draft already does that), redirect_to (already managed elsewhere), or schema.org JSON-LD per-page (handled programmatically based on template_type).

## 2. AI generate / improve buttons

Replace the current single "Add a section" box with three primary actions:

1. **Generate full page** — only enabled when body is empty or short (<200 words). Uses title + slug + focus keyword to write the entire page from scratch, following the template_type's section structure.
2. **Improve this page** — sends the current body to the AI with instructions to: tighten copy, fix banned words from the brand voice rules, add missing H2s, expand thin sections, ensure focus keyword density. Returns a diff-style preview before saving.
3. **Generate SEO meta** — fills SEO title + SEO description (and OG variants if blank) from the current body. Useful when you've written content but the meta is empty or generic.

Each button shows the AI's proposed output in a preview pane with **Accept** / **Reject** before it overwrites anything. No more "generate & save" surprise.

## 3. Quick-add section preset buttons

Above the AI prompt box, a row of one-click chips that pre-fill the prompt and run it:

- FAQ (5 questions)
- Pricing table
- "What to expect" checklist
- Local landmarks / things to do nearby (city pages)
- Insurance & liability section
- Host tips / safety rules
- Comparison table (PRNM vs Swimply)
- Testimonials placeholder block
- Internal links to related cities (auto-pulls 6 nearby cities from `content_pages`)
- Custom prompt (existing free-text box stays)

Clicking a chip fills the textarea with a tuned prompt the user can edit before hitting Generate, OR they can hold shift-click to run it immediately.

All AI section generations append by default; the Append/Replace toggle stays.

## 4. Layout changes

```text
┌─────────────────────────────────────────────────────────────┐
│ Edit page  /p/host-advocacy            [Open ↗] [Close]     │
├──────────────────────────────────┬──────────────────────────┤
│ Title (H1)         Status        │  SEO score               │
│ SEO title          SEO desc      │  ✓ Title 58/60           │
│ OG title           OG desc       │  ✓ Desc 142/155          │
│ Hero image URL     Canonical     │  ✗ Focus keyword missing │
│ Focus keyword                    │     in description       │
│                                  │  ✓ 1,476 words           │
│ ── AI tools ──                   │  ✓ H1 present            │
│ [Generate full page]             │  ⚠ Only 2 internal links │
│ [Improve this page]              │                          │
│ [Generate SEO meta]              │  Last edited: 2 days ago │
│                                  │  Published: 14 Jan 2026  │
│ ── Add a section ──              │                          │
│ [FAQ] [Pricing] [Checklist]      │                          │
│ [Landmarks] [Insurance] [Tips]   │                          │
│ [PRNM vs Swimply] [Internal links]│                         │
│ ☑ Append   [textarea]  [Generate]│                          │
│                                  │                          │
│ Body (Markdown)        1476 words│                          │
│ [textarea]                       │                          │
└──────────────────────────────────┴──────────────────────────┘
```

## 5. Backend / data

- **Migration**: add `og_title TEXT`, `og_description TEXT`, `focus_keyword TEXT`, `canonical_override TEXT` to `content_pages`.
- **`updateContentPage`**: accept the four new fields.
- **New server fns** (all server-only, use Lovable AI Gateway, model `google/gemini-2.5-pro`):
  - `generateFullPageContent({ id })`
  - `improvePageContent({ id })` → returns proposed body, doesn't save
  - `generateSeoMeta({ id })` → returns `{ seo_title, seo_description, og_title, og_description }`, doesn't save
  - `generateSectionPreset({ id, presetKey })` → returns markdown block for the requested preset
- **Brand voice guardrails**: each AI prompt includes the workspace banned-words list and tone rules so output matches the rest of the site automatically.
- **SSR rendering** of the public page: also use `og_title` / `og_description` in `head()` when set, falling back to `seo_title` / `seo_description`. Use `hero_image_url` for `og:image` / `twitter:image` when set.

## What I'm NOT touching

- The route file `src/routes/p.$slug.tsx` and the templates' visual layout — only metadata wiring.
- The sitemap / canonical helper — already correct.
- Status workflow (draft / pending / published) stays as-is.
- No new dependencies needed; ReactMarkdown is already in the project.
