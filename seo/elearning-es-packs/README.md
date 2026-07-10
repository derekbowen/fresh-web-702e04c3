# E-Learning Phase 2 — ES packs 2-4 (STAGED, HELD — do NOT apply without GO)

Continues closing the 135 EN / 14 ES imbalance after the Spanish Health pack (live).
Priority order per Derek: getting-started → pricing/earnings → legal.

18 new ES `courses` rows (6 per pack), each with authored Spanish `long_form_content`
(self-contained, no OpenElms dependency). Render at `/p/course/{slug}`, in courses sitemap.

## Packs
- **getting-started** (cat `getting-started`, ES label "Primeros Pasos"):
  como-empezar · de-swimply-a-prnm · como-y-cuando-te-pagan · primer-anuncio-fotos ·
  disponibilidad-y-reglas · tu-primera-reserva
- **pricing** (cat `pricing`, ES label "Precios e Ingresos"):
  como-fijar-el-precio · precios-dinamicos · amenidades-que-aumentan-tarifa ·
  paquetes-y-ofertas · ingresos-por-temporada · entiende-tus-numeros
- **legal** (cat `legal`, ES label "Legal y Cumplimiento"):
  seguro-y-responsabilidad · waivers · impuestos · permisos-y-regulaciones · hoa · llc

## Code
`src/lib/academy.ts` ES map += `getting-started`, `pricing`, `legal` labels so ES badges/hub
headers render in Spanish. (`safety` already added with the Spanish Health pack.)

## Apply (on GO) — one pack at a time
    node apply-pack.mjs getting-started            # DRY preview
    DRY=false node apply-pack.mjs getting-started   # insert
    (repeat for pricing, legal)
Then rebuild + pm2 restart fresh-web so the academy.ts labels ship.

## Bilateral / internal ES linking
Related-courses already links ES courses within a category (getRelatedCourses by
category+language) and each course links back to the ES hub. Per-course EN↔ES `hreflang`
twin-linking still needs a twin map — tracked as the remaining Phase-2 "rest".

## STATUS: staged + committed, NOT applied. Held for Derek's GO.
