# E-Learning Phase 2 — Spanish Health pack (STAGED, HELD)

8 new Spanish-language safety/health courses for the academy `courses` table.
Closes the biggest gap from Phase 1: EN safety = 35 courses, ES safety ≈ 1.

## What this adds
- 8 `courses` rows, `language="es"`, `category="safety"`, `tier="tier-1"`, each with
  authored Spanish `long_form_content` (self-contained — no OpenElms dependency).
- Renders at `/p/course/{slug}` (SSR, indexable, in sitemap-pages-academy.xml) and groups
  under a "Seguridad y Rescate" section in the ES hub `/p/aprende-a-rentar-tu-piscina`.
- Code: `src/lib/academy.ts` ES category map += `safety → "Seguridad y Rescate"` so the badge
  and hub header render in Spanish (was falling back to the English label).

## Courses
1. Prevención de Ahogamientos para Anfitriones (featured)
2. RCP Básico para Anfitriones de Piscina
3. Cómo Certificarse en RCP
4. Equipo de Rescate Acuático: Aro vs. Gancho
5. Plan de Acción de Emergencia (EAP)
6. Supervisión Designada y Seguridad del Agua
7. Prevención de Resbalones y Caídas
8. Prevención de Enfermedades del Agua

## Apply (on GO)
    node apply-elearning-es.mjs            # DRY preview (default)
    DRY=false node apply-elearning-es.mjs  # insert for real (idempotent by slug)
Then rebuild + restart fresh-web (vite build + pm2 restart) so the `academy.ts` label ships.

## NOT in this pack (Phase 2 "rest", next report)
- Bilateral EN↔ES per-course linking + `<link rel=alternate hreflang>`
- Fix/confirm the ES hub `/p/aprende-a-rentar-tu-piscina` (Phase 1 flagged: no content_pages row)
- System A/B canonical consolidation (old `/p/elearning-academy-*` vs `courses`)
