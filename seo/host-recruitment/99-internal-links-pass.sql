-- ============================================================================
-- HOST RECRUITMENT SPRINT · Internal links pass (content_pages body links)
-- Adds inbound internal links required per page. The /p/hosting hub already
-- links OUT to pages 1,2,3,4,8 (committed in 9/10). This adds the remaining
-- renter->host and academy->business links. WHERE clauses no-op safely if a
-- slug is absent. STAGED — apply AFTER the numbered page files, on Derek's GO.
-- ============================================================================

-- learningacademy (1) -> backyard business asset (8)  [Derek #8: link from learningacademy]
UPDATE content_pages SET
  body_markdown = COALESCE(body_markdown, '') ||
    E'\n\n---\n\n**Ready to earn?** See [how to turn your backyard pool into a business asset](/p/howtoturnyourbackyardpoolintoabusinessasset), then [list your pool free](/signup) — 0% host fees for 2026.\n',
  content_refreshed_at = now()
WHERE slug = 'learningacademy';

-- San Diego renter page -> become-a-host San Diego (6)  [Derek #6: link from /p/san-diego-ca]
UPDATE content_pages SET
  body_markdown = COALESCE(body_markdown, '') ||
    E'\n\n---\n\n**Own a pool in San Diego?** [Become a pool host in San Diego](/p/become-a-swimming-pool-host-san-diego-ca) and earn by the hour — 0% host fees for 2026.\n',
  content_refreshed_at = now()
WHERE slug = 'san-diego-ca';

-- Sacramento renter page -> become-a-host Sacramento (7)  [Derek #7: link from /p/sacramentobestprivatepools]
UPDATE content_pages SET
  body_markdown = COALESCE(body_markdown, '') ||
    E'\n\n---\n\n**Own a pool in Sacramento?** [Become a pool host in Sacramento](/p/become-a-swimming-pool-host-sacramento-ca) and earn by the hour — 0% host fees for 2026.\n',
  content_refreshed_at = now()
WHERE slug = 'sacramentobestprivatepools';

-- Insurance guide (4) -> hosting hub (host page cross-link)  [Derek #4: internal link to host pages]
UPDATE content_pages SET
  body_markdown = COALESCE(body_markdown, '') ||
    E'\n\n---\n\nThinking about renting out your own pool? See [how pool hosting works](/p/hosting) — 0% host fees for 2026, coverage included.\n',
  content_refreshed_at = now()
WHERE slug = 'insurance-guide-for-pool-owners';
