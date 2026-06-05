
-- Append "Explore the Austin area" cross-link block to pages missing sibling links.

-- Helper block builder via DO blocks. Use plain UPDATE per page for clarity.

-- 1. Austin hub: add links to Spanish + use-case pages
UPDATE public.content_pages
SET body_markdown = body_markdown || E'\n\n## More Austin pool rental resources\n\n- [Renta de alberca en Austin (Español)](/p/renta-de-alberca-austin-tx)\n- [Quinceañera pool rental in Austin](/p/quinceanera-pool-rental-austin-tx)\n- [Birthday pool party rental in Austin](/p/birthday-pool-party-austin-tx)\n',
    updated_at = now()
WHERE slug = 'austin-tx';

-- 2. Pflugerville: add sibling block
UPDATE public.content_pages
SET body_markdown = body_markdown || E'\n\n## Explore the Austin area\n\n- [Austin pool rentals (main hub)](/p/austin-tx)\n- [Round Rock pool rentals](/p/round-rock)\n- [Cedar Park pool rentals](/p/cedar-park-tx)\n- [Leander pool rentals](/p/leander-tx)\n- [Hutto pool rentals](/p/hutto-tx)\n- [Quinceañera pool rentals in Austin](/p/quinceanera-pool-rental-austin-tx)\n- [Birthday pool parties in Austin](/p/birthday-pool-party-austin-tx)\n- [Renta de alberca en Austin (Español)](/p/renta-de-alberca-austin-tx)\n',
    updated_at = now()
WHERE slug = 'pflugerville-tx';

-- 3. Cedar Park
UPDATE public.content_pages
SET body_markdown = body_markdown || E'\n\n## Explore the Austin area\n\n- [Austin pool rentals (main hub)](/p/austin-tx)\n- [Round Rock pool rentals](/p/round-rock)\n- [Pflugerville pool rentals](/p/pflugerville-tx)\n- [Leander pool rentals](/p/leander-tx)\n- [Hutto pool rentals](/p/hutto-tx)\n- [Quinceañera pool rentals in Austin](/p/quinceanera-pool-rental-austin-tx)\n- [Birthday pool parties in Austin](/p/birthday-pool-party-austin-tx)\n- [Renta de alberca en Austin (Español)](/p/renta-de-alberca-austin-tx)\n',
    updated_at = now()
WHERE slug = 'cedar-park-tx';

-- 4. Leander
UPDATE public.content_pages
SET body_markdown = body_markdown || E'\n\n## Explore the Austin area\n\n- [Austin pool rentals (main hub)](/p/austin-tx)\n- [Round Rock pool rentals](/p/round-rock)\n- [Cedar Park pool rentals](/p/cedar-park-tx)\n- [Pflugerville pool rentals](/p/pflugerville-tx)\n- [Hutto pool rentals](/p/hutto-tx)\n- [Quinceañera pool rentals in Austin](/p/quinceanera-pool-rental-austin-tx)\n- [Birthday pool parties in Austin](/p/birthday-pool-party-austin-tx)\n- [Renta de alberca en Austin (Español)](/p/renta-de-alberca-austin-tx)\n',
    updated_at = now()
WHERE slug = 'leander-tx';

-- 5. Hutto
UPDATE public.content_pages
SET body_markdown = body_markdown || E'\n\n## Explore the Austin area\n\n- [Austin pool rentals (main hub)](/p/austin-tx)\n- [Round Rock pool rentals](/p/round-rock)\n- [Cedar Park pool rentals](/p/cedar-park-tx)\n- [Leander pool rentals](/p/leander-tx)\n- [Pflugerville pool rentals](/p/pflugerville-tx)\n- [Quinceañera pool rentals in Austin](/p/quinceanera-pool-rental-austin-tx)\n- [Birthday pool parties in Austin](/p/birthday-pool-party-austin-tx)\n- [Renta de alberca en Austin (Español)](/p/renta-de-alberca-austin-tx)\n',
    updated_at = now()
WHERE slug = 'hutto-tx';

-- 6. Spanish hub: add Spanish-flavored links to suburbs + use cases
UPDATE public.content_pages
SET body_markdown = body_markdown || E'\n\n## Explora el área de Austin\n\n- [Austin pool rentals (guía completa en inglés)](/p/austin-tx)\n- [Round Rock](/p/round-rock)\n- [Cedar Park](/p/cedar-park-tx)\n- [Leander](/p/leander-tx)\n- [Pflugerville](/p/pflugerville-tx)\n- [Hutto](/p/hutto-tx)\n- [Renta de alberca para quinceañera](/p/quinceanera-pool-rental-austin-tx)\n- [Fiesta de cumpleaños en alberca](/p/birthday-pool-party-austin-tx)\n',
    updated_at = now()
WHERE slug = 'renta-de-alberca-austin-tx';

-- 7. Round Rock: add Spanish + use-case (already links to suburbs)
UPDATE public.content_pages
SET body_markdown = body_markdown || E'\n\n## More Austin-area resources\n\n- [Quinceañera pool rentals in Austin](/p/quinceanera-pool-rental-austin-tx)\n- [Birthday pool parties in Austin](/p/birthday-pool-party-austin-tx)\n- [Renta de alberca en Austin (Español)](/p/renta-de-alberca-austin-tx)\n',
    updated_at = now()
WHERE slug = 'round-rock';

-- 8. Quinceañera: add round-rock + bday cross-links (already links others)
UPDATE public.content_pages
SET body_markdown = body_markdown || E'\n\n## Related Austin pages\n\n- [Cedar Park pool rentals](/p/cedar-park-tx)\n- [Leander pool rentals](/p/leander-tx)\n- [Hutto pool rentals](/p/hutto-tx)\n',
    updated_at = now()
WHERE slug = 'quinceanera-pool-rental-austin-tx';

-- 9. Birthday: add round-rock cross-link (already links others)
UPDATE public.content_pages
SET body_markdown = body_markdown || E'\n\n## Related Austin pages\n\n- [Round Rock pool rentals](/p/round-rock)\n',
    updated_at = now()
WHERE slug = 'birthday-pool-party-austin-tx';
