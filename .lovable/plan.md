## Five issues hurting our Google rankings — ranked by traffic impact

All findings pulled from our `content_pages` table + live HTML on production. Numbers are real, not guessed.

---

### #1 — Nine high-value host pages have NO title and NO description

Live HTML on `/p/become-a-swimming-pool-host-honolulu-hi` shows:

- `<title>become-a-swimming-pool-host-honolulu-hi | Pool Rental Near Me</title>`
- `<meta name="description" content="become-a-swimming-pool-host-honolulu-hi">`

The slug is literally being used as the title. 10,000+ words of real content sit underneath, but Google's search result reads like garbage. **9 pages affected, all premium markets:** Honolulu, Long Island, The Hamptons, Cape Cod, Greenwich CT, Lexington KY, Boise, Brandon FL, Arlington VA.

**Fix:** backfill `seo_title` + `seo_description` from a template, e.g. `"Rent out your pool in {City}, {ST} — earn $5K–$15K/month | Pool Rental Near Me"`. One SQL migration, deployed in minutes. Expected outcome: these 9 markets start appearing in SERPs within a crawl cycle (~2 weeks).

---

### #2 — 524 pages sit on page 2 of Google (positions 11–25)

These are pages Google likes enough to rank but not enough to show on page 1. One nudge each = massive traffic. The biggest opportunities:

| URL | Impressions | Position | Potential if → top 5 |
|---|---|---|---|
| /p/all-locations | 10,938 | 19.5 | ~5× clicks |
| /p/privatepoolrentalssandiego | 6,416 | 13.1 | ~3× |
| /p/riverside | 3,575 | 11.1 | ~3× |
| /p/the-3-best-swimming-pool-chlorines | 1,677 | 12.8 | ~3× |
| /p/sacramentobestprivatepools | 1,255 | 12.9 | ~3× |

**Fix:** for the top 20 by impressions × (position − 8), run an internal-link sprint (link to them from high-authority pages like the homepage + /p/all-locations) and refresh the H1 + first 200 words. No new pages needed.

---

### #3 — 26 pages get hundreds of impressions and ZERO clicks

CTR = 0% means the title/snippet repels searchers. Three of these already rank in the top 10 — they're invisible despite winning the SERP. Worst offenders:

| URL | Impressions | Position | Clicks |
|---|---|---|---|
| /p/free-host-tools | 552 | 9.3 | **0** |
| /p/why-renting-a-private-pool-is-better | 489 | 5.4 | **0** |
| /p/romantic-pool-date-night-guide | 459 | 5.2 | **0** |
| /p/host-advocacy-nevada | 429 | 8.0 | **0** |
| /p/host-advocacy-ohio | 389 | 6.7 | **0** |

**Fix:** rewrite titles with numbers, year, and benefit hook. e.g. `"Free Pool Host Tools (2026): Calculator, Templates & Checklists"`. Add a compelling 155-char description with the offer + the differentiator (10% fee, $2M insurance). Pure CTR play — no ranking change needed to get clicks.

---

### #4 — Massive thin-indexing problem: 5,706 indexed, only 627 (11%) draw any impressions

Google has crawled and indexed thousands of our pages it considers low quality. This dilutes the whole domain's trust signal. By template:

- **350 swim_instructor_city pages → 0 ranking, 0 impressions**
- **70 elearning Academy pages → only 7 ranking**
- **14 pool_maintenance pages → 0 ranking**
- **445 Spanish host_acq_city → only 42 ranking (9%)**

**Fix:** drop the dead templates from sitemap (`in_sitemap = false`) until they earn impressions. Add `<meta robots="noindex">` to the 350 swim_instructor pages until a real content refresh ships. Keeps the strong stuff strong; stops Google from grading us on the weak stuff.

---

### #5 — Duplicate titles = self-cannibalization

7 pairs of pages share identical `<title>` tags. Google splits ranking signal between them and neither wins:

- `"Pool Rental in Houston, TX | Hourly Backyard Pools"` × 2 URLs
- `"Pool Rental in The Woodlands, TX | Hourly Backyard Pools"` × 2
- `"Pool Rental in Indianapolis, IN | Hourly Backyard Pools"` × 2
- `"Pool Rental Near Me Community Guidelines"` × 2
- `"Eco-Friendly Pool Rental Practices | Host with PRNM"` × 2
- `"Poolside Movie Night Guide..."` × 2

**Fix:** for each pair, identify the winner (more impressions / longer content), 301 the loser to the winner, drop the loser from sitemap. Consolidates link equity onto one URL.

---

## What I'd ship (in order)

1. **SQL migration**: backfill the 9 empty titles/descriptions for `host_acq_city` (#1) — ~10 min
2. **SQL migration**: noindex + remove from sitemap for the 350 swim_instructor_city and 14 pool_maintenance pages (#4) — ~5 min
3. **SQL migration**: 301-redirect the 7 duplicate-title loser pages (#5) — ~10 min
4. **Title/meta rewrite pass**: top 20 page-2 pages from #2 + top 10 zero-CTR pages from #3 — ~30 min
5. **Internal-link sprint**: link the top 5 page-2 winners (#2) from the homepage + `/p/all-locations` header — ~15 min

Total: about 70 minutes of work, all surgical. No new pages, no template rewrites.

### One bonus catch (unrelated to the 5)

Live HTML still shows the OLD nav ("Home Page", "Find a Pool", "Pool Pros", "How It Works" in Title Case). Our menu fixes from earlier this session are in code but **not yet published**. Hit **Publish → Update** to push them live.

---

## Technical notes

- All queries against `content_pages` use `supabaseAdmin` server-side per project memory — no client exposure.
- GSC connector API key isn't configured in this sandbox (only `LOVABLE_API_KEY` is present), so I used the impressions/clicks/position data we sync into `content_pages.gsc_*` columns. Last sync date can be confirmed with `select max(gsc_updated_at) from content_pages`.
- Recommend running #1, #2 (titles only), #4, #5 as migrations now; #3 and #2 internal-link sprint as a second pass after we see crawl results.

Want me to ship all 5, or pick which ones first?