## LocalBusiness JSON-LD for city templates

Add `LocalBusiness` (subtype `Service`) structured data to `/p/{slug}` pages whose `template_type` is city-scoped, so Google can associate the marketplace offering with each city.

### Scope
Applies to: `host_acq_city`, `public_pool_city`, `spanish_host_acq`.

### Implementation

1. **New helper `src/lib/page-localbusiness.ts`**
   - `localBusinessForContentPage(page)` returns a JSON-LD object or `null`.
   - Resolves city/state from the page slug using the same prefix-stripping logic already in `nearby-cities.functions.ts` (extract & share via a small `src/lib/city-slug.ts` util to avoid duplication).
   - Shape:
     ```json
     {
       "@context": "https://schema.org",
       "@type": "Service",
       "serviceType": "Pool rental marketplace",
       "provider": {
         "@type": "Organization",
         "name": "Pool Rental Near Me",
         "url": "https://poolrentalnearme.com"
       },
       "areaServed": {
         "@type": "City",
         "name": "<City>",
         "containedInPlace": { "@type": "State", "name": "<State>" }
       },
       "url": "<canonical>",
       "inLanguage": "<en|es>"
     }
     ```
   - Returns `null` when city cannot be resolved (so we don't emit junk schema).

2. **Wire into `src/routes/p.$slug.tsx` `head()`**
   - After the FAQPage block, call the helper and push `ldJsonScript(...)` when non-null.

3. **Refactor**
   - Extract `cityForContentPage` (currently in `nearby-cities.functions.ts`) into `src/lib/city-slug.ts` (pure, no server deps) so both the nearby-cities server fn and the new LocalBusiness helper can share it. Update the existing import.

### Files
- New: `src/lib/city-slug.ts`, `src/lib/page-localbusiness.ts`
- Edit: `src/server/nearby-cities.functions.ts` (import shared helper), `src/routes/p.$slug.tsx` (emit JSON-LD)

### Out of scope
- No DB schema changes.
- No visible UI changes.
- No `LocalBusiness` for non-city templates (resources, academy, generic) — those don't represent a localized offering.
