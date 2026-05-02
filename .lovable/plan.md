# Learning Academy — Plan

Replicate and improve the three live academy pages (`/p/learningacademy`, `/p/learning-academy-new-courses`, `/p/aprende-a-rentar-tu-piscina`) as a unified, SEO-friendly Learning Academy section. Each course is a real route that embeds the existing openelms.ai player — no need to recreate course content.

## Routes

```text
/academy                       Catalog landing (all 90+ courses, search, filters)
/academy/category/$slug        Filtered by category (safety, marketing, legal, etc.)
/academy/$slug                 Individual course page with embedded player
/academy/es                    Spanish catalog (Aprende a Rentar tu Piscina)
```

## Database

New table `courses` (separate from `blog_posts` since the model is different — embeds, languages, levels):

- `slug` (unique), `title`, `subtitle`, `description` (long), `excerpt` (short)
- `cover_image_url`
- `category` (text: safety, marketing, legal, hosting, guest-experience, ai-tech, operations, seasonal, spanish)
- `language` (text: `en` | `es`, default `en`)
- `level` (text: beginner | intermediate | advanced, nullable)
- `embed_url` (the `https://openelms.ai/embed/...` URL)
- `external_detail_url` (optional link to the live `/p/...` page during transition)
- `duration_minutes` (nullable), `is_featured` (bool), `is_published` (bool), `published_at`
- `seo_title`, `seo_description`

RLS: public read for `is_published = true`; admins manage. Same pattern as `blog_posts`.

Seed ~90 courses extracted from the three reference pages, each with the correct embed URL, category, and language.

## Catalog page (`/academy`)

- Hero: "Pool Host Learning Academy — 90+ free courses" + search box (client-side filter) + language toggle.
- Category pills (counts per category) — filter via `?category=safety` search param (zod-validated).
- Featured courses row (3 large cards) — admin-curated via `is_featured`.
- Grid of all courses (12 per page, paginated with `?page=N`).
- Topic-based deep links at bottom for SEO: every category page is internally linked.
- Each card: thumbnail, title, 2-line excerpt, category badge, language badge, "Start Course" CTA.

SEO: `head()` builds title/description per `?category` and `?page`, with `rel=prev/next`, `ItemList` JSON-LD, `BreadcrumbList`, and `noindex` for out-of-range pages. Same pattern as the blog landing.

## Course page (`/academy/$slug`)

- Breadcrumb: Home / Academy / Category / Title.
- H1 + subtitle + meta row (category, language, level, duration).
- Hero cover image.
- Long description (markdown rendered).
- **Embedded player**: `<iframe src={embed_url} ...>` with sandbox attrs and proper aspect ratio. Lazy-loaded.
- "What you'll learn" bullets (parsed from description if structured, or shown raw).
- Related courses (3 from same category).
- Sticky "Start Course" CTA button on mobile.

SEO: `head()` outputs full meta + `Course` JSON-LD (schema.org Course type with `provider`, `educationalLevel`, `inLanguage`, `image`, `description`). Canonical to `/academy/$slug`.

## Spanish catalog (`/academy/es`)

Same template as `/academy` but pre-filtered to `language=es`, with Spanish UI strings ("Cursos", "Categorías", "Comenzar Curso"). Catalog header reads "Aprende a Rentar tu Piscina".

## Header & footer

- Add "Academy" link to `SiteHeader` desktop nav (between Categories and Blog).
- Add "Learning Academy" link to footer Explore column.

## Sitemap

Extend `listAllSitemapEntries` in `src/server/content.functions.ts` to include `courses` (slug + updated_at). The existing `/api/sitemap.xml` route picks them up automatically once added. URLs emitted: `/academy`, `/academy/es`, every `/academy/category/$slug`, every `/academy/$slug`.

## Technical details

- Server functions: `listCourses({page, pageSize, category, language})`, `listCourseCategories()`, `getCourse({slug})`, `getRelatedCourses({slug, category})` in a new `src/server/courses.functions.ts`.
- Search params validated with `zodValidator` (same pattern as the blog page already uses).
- Iframe embed wrapper: `<div className="aspect-video w-full">` + `<iframe loading="lazy" allow="fullscreen; autoplay" sandbox="allow-scripts allow-same-origin allow-forms allow-popups">`.
- Course descriptions stored as markdown; render with `react-markdown` (already common; will install if missing).
- Reuse `buildMeta`, `breadcrumbJsonLd`, `ldJsonScript` from `src/lib/seo.ts`.

## Out of scope (this iteration)

- User progress tracking / completion certificates (openelms handles inside the embed).
- Course authoring UI (admin-only; can be added later).
- Payments — all courses remain free, matching the live site.

After approval I'll run the migration to create `courses`, seed the ~90 rows, build the routes/components, and verify a sample course renders the embed correctly.
