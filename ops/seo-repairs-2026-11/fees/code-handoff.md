# F14 code hand-off: fee statements in application code

Branch `seo/02-content-repairs` (at production commit `7702845`). Nothing in `src/**` was edited; this file lists what should change and who decides.
Policy: guests pay a 15% booking fee at checkout; hosts pay 0% and keep 100% of their price.

How the code was swept (2026-11-16): `grep` over `src/**` (`.ts/.tsx/.js/.json/.md`) for percentages near fee/commission/cut/take/charge/keep/earn/payout/service/platform/tarifa/comisión/waive, plus `10%`, `90%`, `waive`, `platform fee`, `service fee`, `after fees`, `minus`, `keep the majority/most/lion's share`, `in/through/durante 2026`, `introductory`, `promotional`, `forever`, `founding host`. The scraped text of code-route pages (crawl 2026-11-14, `scratchpad/seo/texts.jsonl` + `stage2_texts.jsonl`) was swept with the same patterns. Live pages were checked with single GETs on 2026-11-16.

Result: the code states the policy correctly almost everywhere (`0% host fees`, `hosts keep 100%`, `the mandatory 15% guest booking fee` in `src/server/sharetribe.server.ts:682`). These are the exceptions.

---

## 0. Host city pages: "You take home on $200: $180" (fix; added by the review of 2026-11-16)

File: `src/components/templates/host-acq-city.tsx`, line 367 (the comparison table every `/p/<city>` host-acquisition page renders, e.g. `/p/austin-tx`, `/p/dover`, `/p/madison`).

| Line | Current text | Problem |
|---|---|---|
| 366 | `["Host service fee", "0%", "15%+"],` | correct for PRNM (the Swimply cell is the separate competitor question in §6) |
| 367 | `["You take home on $200", "$180", "≈ $170 or less"],` | with a 0% host fee the host keeps the full $200; `$180` is the old 10% arithmetic and contradicts the row above |

Reach: 3,932 page texts in the 2026-11-14 crawl (`scratchpad/seo/texts.jsonl`) carry "You take home on $200 $180"; live GETs of `/p/dover` and `/p/madison` on 2026-11-16 still show `$180`.

Proposed edit (only the PRNM cell changes; the row label and the Swimply cell stay as they are):
- line 367: `["You take home on $200", "$200", "≈ $170 or less"],`

This is a code change, so it is not in the database package. F14 is not complete until it ships. A grep of `src/**` (without `.bak` files) on 2026-11-16 for `$180`, `take home on`, `$90 of every` found no other PRNM net figure computed at 90%.

---

## 1. `/p/affiliate`: offer to "waive your 10% platform fee" (NEEDS_DEREK)

File: `src/routes/p.affiliate.tsx`. Live: HTTP 200 on 2026-11-16, and the page still shows "waive your 10% platform fee" twice.

The whole Tier 1 reward is built on a host fee that does not exist. Hosts already pay 0%, so "refer 5 hosts and we waive your fees for a year" offers nothing, and "10%" misstates the fee. Every line below depends on that premise:

| Line | Current text | Problem |
|---|---|---|
| 11 | `const TITLE = "Host Referral Program — Refer 5 Hosts, Pay $0 Fees for a Year";` | Implies hosts normally pay fees |
| 13 | `"Refer 5 approved pool hosts and we waive your platform fees for 12 months. Recruit pools and earn 5% of their bookings for 2 years."` | Same (meta description) |
| 18 | `title: "Refer 5 hosts → 0% fees for 12 months",` | Same |
| 20 | `"Get 5 friends approved as Pool Rental Near Me hosts and we'll waive your 10% platform fee for a full year. That's pure profit on every booking you take — typically $1,500–$5,000 in saved fees per host per season."` | States a 10% fee; "$1,500–$5,000 saved" is 10% of an unstated revenue figure |
| 44 | `"Hit 5 approved hosts and your fees drop to 0% for the next 12 months automatically. Want the recruiter deal? ..."` | Fees are already 0% |
| 54-55 | FAQ `"When does the 0% fee window start?"` / `"The day your 5th referral completes ... runs for 12 consecutive months ..."` | Same |
| 62-63 | FAQ `"Can I do both — earn the fee waiver AND recruit?"` / `"Yes. The fee waiver applies to your own hosting income. ..."` | Same |
| 120 | `<span className="text-primary">Pay $0 in fees for a year.</span>` | Same (hero) |
| 124-126 | `hosts onto Pool Rental Near Me and we'll waive your 10% platform fee` / `for 12 full months. Want to go bigger? Recruit pools and earn 5% of` / `their bookings for 2 years.` | States a 10% fee |
| 201-203 | `$3,200` / `Avg. fees waived per host per season` | A statistic of fees that were never charged. Under rule 1 (never invent a statistic) it must go regardless of what Derek decides about the offer |

**Smallest truthful edit (proposal, not applied).** Remove Tier 1 and everything that depends on it. That means the line 18-20 tier, the first sentence of line 44, the two FAQs at 54-55 and 62-63, the hero sentence at 120 and the waiver clause at 124-125, and the `$3,200` stat at 201-203. Reword TITLE and DESCRIPTION around the part that remains true:

- TITLE: `"Host Referral Program — Earn 5% of Recruited Hosts' Bookings"`
- DESCRIPTION: `"Recruit pool hosts to Pool Rental Near Me and earn 5% of their bookings for 2 years. Hosts on PRNM pay 0% host fees."`
- Hero, lines 124-126: `hosts onto Pool Rental Near Me and earn 5% of their bookings for 2 years. Hosts already pay 0% host fees.`

**What Derek must decide:**
1. Whether a referral reward for hosts should exist at all, and if so what it is. Fee relief is impossible because there is no host fee. Any replacement reward (cash, credit, guest-fee discount) is a business decision and copy must not invent one.
2. Which recruiter terms are true. `/p/affiliate` says 5% "for 2 years". `/p/affiliate-program` (`src/routes/p.affiliate-program.tsx:11,88`) says 5% "for the lifetime of the host". `src/server/affiliate-sync.server.ts:6` describes "3rd+ completed booking → 5% recurring (paused if 60d+ dormant)". These conflict. They are not PRNM fee statements, but the page being edited repeats them.
3. Whether `/p/affiliate` should stay published while (1) is open. Removing the false copy without a replacement leaves a thinner page.

---

## 2. `PoolRentalProfit` calculator defaults a 15% "Platform fee" taken from the host (proposal)

File: `src/components/host-tools/tools.tsx`

- line 1101: `const [platform, setPlatform] = useState(15);`
- line 1102: `const platformFee = revenue * (platform / 100);` (deducted from host revenue at line 1103)
- line 1120: `<NumberField label="Platform fee" value={platform} onChange={setPlatform} suffix="%" />`

On a PRNM tool, a 15% default deducted from the host's revenue tells hosts PRNM takes 15% (it takes 0%). Exposure is low today: nothing in `src/` imports `tools.tsx`, and `/p/pool-rental-profit` returned 404 on 2026-11-16 (`/p/pool-host-tools/pool-rental-profit` 301s to it). It is a latent bug for when the tool is mounted.

Proposed text:
- line 1101: `const [platform, setPlatform] = useState(0);`
- line 1120: `<NumberField label="Other platform fees (PRNM host fee is 0%)" value={platform} onChange={setPlatform} suffix="%" />`

The neighbouring `Insurance` field (lines 1099, 1103, 1119) is not touched, and this file proposes nothing about it.

---

## 3. "Forever for founding hosts" suggests other hosts' 0% may end (NEEDS_DEREK)

File: `src/components/templates/country-launch.tsx` (the ccTLD country front doors)

- line 164: `0% host fees, forever for founding hosts`
- line 336: `The first pools listed in each city get founding-host status: 0% host fees, locked in forever.`
- also `src/lib/page-faqs.ts:291`: `Founding hosts in ${countryName} keep 100% of what they charge — 0% host fees, not introductory, forever.`

These are true for founding hosts, but tying "forever" to founding status implies that later hosts' 0% is not guaranteed. That is a statement about future pricing, so no edit is proposed. Derek decides whether the 0% host fee is permanent for everyone (then `founding` can be dropped from these lines) or not. Lines 180 and 473 (`0% host fees, forever`) carry no such qualifier.

The same future-pricing question appears in the database: 45 Spanish rows say "comisión promocional del 0% durante 2026", and raw_html says "0% host fee (through 2026)". See README §5.

---

## 4. Not shipped, but should be deleted: `.bak` copies with old fee copy

These backup files sit inside `src/` and are not imported. Some hold the superseded fee copy: a struck-through `10%`, "0% host fees valid through Dec 31, 2026", "Promotional guest fee", and `"90% means 90%. $2M liability coverage included."`.

- `src/components/home-page.tsx.bak-xhandle-20260731-184950` (lines 243, 264-265)
- `src/components/templates/host-acq-city.tsx.bak-xhandle-20260731-184950`, `...bak-links-20260731-175831`, `...bak-links-20260731-175831.bak-xhandle-20260731-184950` (lines 83, 324, 368)
- `src/routes/p.pool-party-rentals.tsx.bak-links-20260731-175831` (lines 196, 422)
- `src/routes/p.start-hosting.tsx.bak-feefix`
- plus `comparison-page.tsx.bak-xhandle-…`, `site-layout.tsx.bak-values`, `seo.ts.bak-xhandle-…`, `site-footer-defaults.ts.bak-*`, `p.all-locations.tsx.bak-links-…`

Proposal: delete them from the repo. Git history keeps them, and grepping for the old fee keeps re-finding them.

---

## 5. Correct in code, wrong in the database snapshot (no code change)

`src/lib/host-city-guide.ts:114-116` now renders `How PRNM's 0% host fee compares to alternatives` / `Pool Rental Near Me charges hosts 0% host fees`. The `raw_html` column of two `content_pages` rows (become-a-swimming-pool-host-indianapolis-in, -honolulu-hi) holds a frozen render of an older version of that template, with `How PRNM's 10% fee compares`, `charges hosts a flat 10% fee on each booking` and `10% flat fee`. The live Indianapolis page still shows "10% fee" (GET 2026-11-16). Those rows were FIX rows in `fee-corrections.csv` (column `raw_html`); the review of 2026-11-16 held them for Derek (category `INS_ADJ`), because the same frozen render holds a held insurance sentence and "$2M coverage" copy next to the fee text. Run 1's sweep did not include `raw_html`; PENDING-READS Q3 sweeps it for every row.

## 6. Competitor statements in code (counted, not changed)

`Swimply's 15% host fee leaves you $850 on a $1,000 month` (`home-page.tsx:294`, `home-page-winter.tsx:520`); `Swimply takes 15%+` (`host-acq-city.tsx:322,366`, `host-city-guide.ts:116`, `page-faqs.ts:63`, `sms.server.ts:78`, admin prompt files); `verified 19% vs 0% host commission` and the quoted Giggster help-centre figure (`p.giggster-vs-pool-rental-near-me.tsx:24,33`). These were never verified by this task; Derek decides (README §4).
