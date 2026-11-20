# F14: fee statements, corrections and hand-off

Audit fix F14 (`docs/seo-audit-2026-11-14.md` on `origin/claude/seo-audit-2026-11-14`, §6 and §13). Goal: find every place the site states a Pool Rental Near Me fee other than **15% guest booking fee / 0% host fee**, and prepare exact, reviewed corrections. Nothing has been written to production. No code was edited.

| File | What it is |
|---|---|
| `fee-corrections.csv` | 3,491 rows (after the review of 2026-11-16, §7), one per wrong statement in a `content_pages` field: exact old text, exact new text (or empty for NEEDS_DEREK), reasoning, snapshot, verification status |
| `review-2026-11-16-changes.csv` | Every row the review of 2026-11-16 changed, held or added, with the reason (464 entries) |
| `code-handoff.md` | Fee statements in application code (`src/**`): `/p/affiliate` "waive your 10% platform fee", a 15% default in a host tool, "forever for founding hosts", stale `.bak` files |
| `crawl-gap-candidates.csv` | 223 sentences on 173 live pages (8 added by the review) (crawl 2026-11-14) that look wrong but have no saved database text yet. PENDING-READS Q3 returns their exact text |
| `PENDING-READS.md` + `pending/` | Read-only queries still to run (the database tool was down on 2026-11-16): uniqueness check of 1,228 rows, column list, broad re-sweep, two context reads. Also the guard any later write must use |

## 1. The policy and how it was verified

- **Guests pay a 15% booking fee; hosts pay 0% and keep 100% of their price.**
- `src/lib/pricing.ts`: `export const CUSTOMER_BOOKING_FEE_PCT = 15;`, documented as "the one place this number lives in fresh-web" and mirroring the marketplace's `CUSTOMER_BOOKING_FEE_PCT` and the Sharetribe Console customer commission. `src/server/sharetribe.server.ts:682`: "Guest-facing display price = host price + the mandatory 15% guest booking fee". No host commission exists anywhere in the code.
- The project's operating notes: "Guest fee is 15%; hosts keep 100% (0% host fees)."
- Live pages (crawl 2026-11-14): listing pages say "A 15% booking fee is added at checkout" (e.g. `/l/your-private-paradise-the-ultimate-backyard-mini-resort`). The homepage says "For hosts 0% host fees. Forever."

Any statement that PRNM charges another fee, or that a host pays or loses a percentage, is wrong. That includes "keep the majority", "after our small fee", "minus the 0% host fee" and net figures still computed at 90%.

## 2. How the sweep was done, and by which run

This task ran three times. Runs 1 and 2 were interrupted on 2026-11-15 at 19:17 UTC and 2026-11-16 at about 19:30 UTC, before they could report. Run 3 (this one) checked their work, kept what was correct, fixed what was wrong and filled the gaps. The `source` column of the CSV says which run produced each row.

**Run 1** (sweep extract taken 2026-11-15 at about 17:30 UTC). One SQL export over every text column of `content_pages` and `blog_posts` listed in PENDING-READS Q2, split into lines and sentences, kept a sentence when any of these filters matched:
- a percentage other than 0/100 within the sentence of fee / commission / cut / take(s) / charg* / keep / earn / payout / service / tarifa / comisi* / cargo / platform / split / margin / deduct / minus / pocket / take-home / net;
- take-home / after (our|the|platform|service) fees / minus (our|the|a) / deduct / net profit|income|earnings|payout / you('ll) keep|pocket|walk away with|net|clear / in your pocket, **together with** a `$` figure;
- (our|a|the) small|low|modest|tiny|minimal|nominal|flat|simple|transparent|competitive|reasonable … fee|commission|cut|percentage;
- keep|retain the majority|most|vast majority|bulk|lion's share;
- Spanish tarifa|comisión|cargo next to a percentage.

That gave 8,493 sentences on 3,606 rows (8,704 classified hits). Each sentence was classified, each wrong one was given a correction or sent to Derek, and uniqueness was checked (`fees2/occ.jsonl`).

**Run 2** (line extracts 2026-11-15 at 22:08 UTC). Added stale net figures: sentences where the fee word was already changed to 0% but the dollar figure was still 90% of the gross. Each gross was checked on the same line or a previous line (`verify_y.py`). Run 2 also added a rate sweep of percentage sentences run 1 had missed and about 90 hand-checked rows. It encoded all 3,230 candidate rows for an md5-based uniqueness check. Batches w0 and w1 returned on 2026-11-15 at 23:46 and 23:49 UTC with exactly one occurrence for all 2,233 rows. Batch w2 never returned. (One of those 2,233 is pending again: its anchor was shortened to leave out a personal name.)

**Run 3** (this run, 2026-11-16, no database access). It did six things:
- **Re-checked runs 1–2.** It ran invariants over every row: no FIX touches insurance, liability, coverage, claims or damage wording; no FIX leaves a 10% or 90% PRNM figure; no competitor figure is changed; every new dollar figure exists on the page or is arithmetic on page numbers. It also read a random sample of 30 rows and every arithmetic row with a new number by hand. **One defect was fixed:** Waldorf MD, whose new text still said "Because our fee is a simple 10% of each booking". 736 run-2 rows carried only an 8-character id prefix; all were resolved to full ids.
- **Closed the sweep gap.** Run 1's filter needed a percentage or a `$` near a fee word, so it missed "Even after platform fees", "(minus platform fees)", "$90 \* 0.10", "our transparent and low host fee", "solo ganamos una pequeña comisión" and "After the 0% host fee, you are left with $5,400" (a stale net with no percentage). Run 3 swept the 4,457 exact database lines saved by the audit (2026-11-15 01:03–01:18 UTC) and run 2 (22:08 UTC) with these extra patterns:
  - after|even after|minus|less|net of|subtracting|deduct … (0%|small|minor|low|platform|service|host) fee|commission|cut;
  - small|minor|modest|tiny|nominal|minimal|low|lowest (+ up to 2 words) (platform|service|host|marketplace) fee|commission|cut;
  - keep the majority|most|vast majority|bulk|lion's share;
  - `x`/`*` 0.10 / 0.9 multipliers;
  - (platform|service|host|our) fee … `$` figure;
  - Spanish después de / menos (nuestra) comisión|tarifa, pequeña comisión|tarifa, tarifa|comisión baja|reducida.

  For every `$` figure after a fee phrase it checked whether the figure is about 90% of a gross stated earlier, using preceding lines of the same field, the twin column, or the crawl text of the page. Result: 927 uncovered hits; table in §3.
- **Covered raw_html.** `content_pages.raw_html` was not in run 1's export. Two rows hold a frozen HTML render with "10% flat fee", "How PRNM's 10% fee compares" and "Pool Rental Near Me charges hosts a flat 10% fee on each booking". The live Indianapolis page still showed the 10% text on 2026-11-16.
- **Swept the crawl text.** It applied the same patterns to the crawl text of every sitemap page and every crawled link target (2026-11-14). Sentences with no saved database text went to `crawl-gap-candidates.csv`.
- **Swept application code** (`src/**`) and the code-route pages: see `code-handoff.md`.
- **Checked blog_posts.** All 25 fee-like sentences in 17 posts are pricing advice for hosts, generic marketplace statements or competitor/insurance remarks. No blog post states a wrong PRNM fee.

## 3. Totals per class

**Run 1 classification of the database sweep** (2026-11-15 ~17:30 UTC; 8,704 hits): PRNM_WRONG 1,816 · COMPETITOR 3,178 · OK 1,384 · NOT_A_FEE 2,326.

**Run 2 additions** (2026-11-15 22:08 UTC lines): 1,413 more PRNM_WRONG rows (rate 736, stale-net arithmetic 588, hand-checked 89).

**Run 3 gap sweep** (lines 2026-11-15 01:03–01:18 / 22:08 UTC; 923 hits not already covered):

| Class | Count | Notes |
|---|---|---|
| PRNM_WRONG | 222 sentences + 4 raw_html lines | became 230 CSV rows |
| OK | 322 | mostly "After the 0% host fee, you keep $X" where $X already equals the stated gross. Wording is vacuous but true; runs 1–2 also left this wording when the number was right |
| COMPETITOR | 1 | plus 8 PRNM 0% sentences with a competitor aside (counted OK) |
| NOT_A_FEE | 372 | host add-on fees (cleaning, towels, grill, heating), public pool entry fees, venue costs |
| needs context | 2 | PENDING-READS Q4 |

**Crawl-only candidates** (2026-11-14 crawl; no database text saved): 215 sentences on 165 pages. Likely classes: stale net 26, wording 35, check number 3, swim-instructor model 139, insurance-adjacent 11, testimonial + insurance 1.

**`fee-corrections.csv` before the review of 2026-11-16** (current totals in §7): 3,460 rows on 1,881 `content_pages` rows. FIX 2,843 rows on 1,578 pages; NEEDS_DEREK 617 rows on 394 pages. blog_posts: 0. 2,232 rows verified unique; 1,228 pending Q1.

| action | category | rows | meaning |
|---|---|---|---|
| FIX | rate | 1,829 | fee figure or keep-share wording corrected to 0% / 100% |
| FIX | arith_stale_net | 656 | net still at 90% of a gross stated on the page; replaced with that gross |
| FIX | zero_fee_deduction_wording | 148 | "minus / net of / deduct the 0% host fee" → nothing deducted |
| FIX | arith, rate+arith, arith_hours_rate, dependent_arith, deduction | 60 + 36 + 35 + 45 + 34 | worked examples recomputed from numbers on the page (rate × hours, × weeks, gross − stated costs) |
| NEEDS_DEREK | DIFF | 272 | "5%/5–10% difference", "$6 more per $100", "a third of Swimply": competitor rate minus the old 10%. With 0% it equals the unverified competitor figure |
| NEEDS_DEREK | SWIM | 174 | swim-instructor cost models with a 10% host or platform fee inside multi-line worked examples. Correct model: the instructor (a guest) pays the 15% booking fee on the pool rental, the host pays 0%. Every line of the block changes. The two seed pages (Mount Vernon VA, Fair Oaks Ranch TX) are fixed as worked examples of that recipe |
| NEEDS_DEREK | INS | 78 | sentence touches insurance, liability, coverage, claims or damage. Not edited, by rule |
| NEEDS_DEREK | COVERS | 40 | says what the (non-existent) host fee or "payment processing" covers or deducts |
| NEEDS_DEREK | ARITH | 31 | figures depend on the wrong fee but the gross is not on the page, or the page's own numbers disagree |
| NEEDS_DEREK | AMBIG | 12 | unclear who pays or which figure is PRNM's |
| NEEDS_DEREK | FUTURE | 9 | says the 0% is promotional, "through 2026", or that 10% applies later |
| NEEDS_DEREK | LEGAL | 1 | hand-flagged in run 2 |

Seeds named in the task are in the CSV:
- Saratoga Springs NY: "walk away with nearly $10,000" → "keeps the full $10,800" (the page's stated gross).
- Fair Oaks Ranch TX: "$60 (this includes our 10% booking fee …)" → "$69 ($60 hourly rate plus the 15% guest booking fee added at checkout; the host pays 0%)", plus the two dependent subtractions.
- Mount Vernon VA: "Platform fee (10% of pool rental, paid by host)" → "Booking fee (15% of pool rental, paid by you at checkout): $3.75", plus the dependent nets $61.25 and $122.50.
- `/p/affiliate`: see `code-handoff.md` §1.

## 4. Competitor claims (not changed; never verified; Derek decides)

From run 1's database sweep (2026-11-15; rows mentioning the competitor and figure). Rendered-page counts from the 2026-11-14 crawl are in brackets where larger, because templates repeat them.

| Competitor | Figure stated | Rows | Three example slugs |
|---|---|---|---|
| Swimply | 15% | 496 [4,128 rendered] | become-a-swimming-pool-host-montgomeryville-pa, become-a-swimming-pool-host-duluth-mn, giggster-vs-pool-rental-near-me-in-flower-mound-tx |
| Swimply | 15–30% | 88 [91] | become-a-swimming-pool-host-snellville-ga, become-a-swimming-pool-host-grosse-pointe-farms-mi, become-a-swimming-pool-host-san-martin-ca |
| Swimply | 15–20% | 18 | conviertete-en-anfitrion-de-alberca-costa-mesa-ca, conviertete-en-anfitrion-de-alberca-hesperia-ca, become-a-swimming-pool-host-closter-nj |
| Swimply | 20% | 8 | become-a-swimming-pool-host-elk-city-ok, become-a-swimming-pool-host-laconia-nh, become-a-swimming-pool-host-norfolk-va |
| Swimply | 25% · 15–25% · 70–80% kept · 25–30% · 70–85% kept · 30% · 10% · 20–30% · 35% | 2 · 2 · 2 · 1 · 1 · 1 · 1 · 1 · 1 | conviertete-en-anfitrion-de-alberca-tucson-az, why-hosts-are-leaving-swimply, prnm-facts, conviertete-en-anfitrion-de-alberca-las-vegas-nv, conviertete-en-anfitrion-de-alberca-auburn-wa, conviertete-en-anfitrion-de-alberca-fayetteville-nc, conviertete-en-anfitrion-de-alberca-urban-honolulu-hi |
| Peerspace | 15% | 16 | peerspace-vs-pool-rental-near-me-in-rye-ny, peerspace-vs-pool-rental-near-me-in-garland, peerspace-vs-pool-rental-near-me-in-san-anselmo-ca |
| Peerspace | 20% (code template) | [525 rendered] | /p/peerspace-vs-pool-rental-near-me and its city variants |
| Peerspace | 15–20% · 15–30% · 20% · 15–50% | 3 · 2 · 1 · 1 | peerspace-vs-pool-rental-near-me-in-escondido-ca, -strasburg-co, -franklin-park-pa, -temecula, -minneapolis, become-a-swimming-pool-host-stonegate-co, peerspace-vs-pool-rental-near-me-in-phoenix-md |
| Giggster | 19% "verified" (code template) | [566 rendered] | /p/giggster-vs-pool-rental-near-me and its city variants |
| Giggster | 15–25% · 15% · 25% · 20% | 3 · 3 · 2 · 1 | giggster-vs-pool-rental-near-me-in-elmendorf-tx, -cape-coral, -vista-ca, -bothell-east-wa, -brambleton-va, -calabasas-ca, -bloomington-mn, -boynton-beach |
| Unnamed "other platforms" | 15% | 981 | sacramentobestprivatepools, become-a-swimming-pool-host-montgomeryville-pa, swim-instructor-pool-rental-sandy-hook-ct |
| Unnamed | 15–20% | 430 | pool-rental-pricing-strategy, become-a-swimming-pool-host-geneva-ny, become-a-swimming-pool-host-brunswick-ga |
| Unnamed | 15–30% | 206 | become-a-swimming-pool-host-snellville-ga, become-a-swimming-pool-host-florham-park-nj, become-a-swimming-pool-host-grosse-pointe-farms-mi |
| Unnamed | 20% | 69 | become-a-swimming-pool-host-bellevue-wi, become-a-swimming-pool-host-alliance-oh, become-a-swimming-pool-host-franklin-in |
| Unnamed | 10% | 43 | conviertete-en-anfitrion-de-alberca-pueblo-co, -downey-ca, -tucson-az |
| Unnamed | 30% · 25% · 20–30% · 90% kept · 70–85% kept · 25–30% · 5–10% · 5% · 33% · 35% | 12 · 4 · 4 · 2 · 2 · 1 · 1 · 1 · 1 · 1 | conviertete-en-anfitrion-de-alberca-sandy-springs-ga, -philadelphia-pa, -manchester-nh, become-a-swimming-pool-host-waunakee-wi, how-much-can-you-make-renting-your-pool, become-a-swimming-pool-host-newport-ri, become-a-swimming-pool-host-phoenix-az, conviertete-en-anfitrion-de-alberca-richmond-ca |

Note: the competitor figures disagree with each other. Swimply alone is described as 10%, 15%, 15–20%, 15–30%, 20%, 25%, 30% and 35%. Where a sentence states both a competitor figure and a PRNM fee, the corrections change only the PRNM part.

## 5. Things Derek should see

1. **Possible invented testimonial.** `/p/become-a-swimming-pool-host-humble-tx` (crawl 2026-11-14) shows a quote, "The insurance and low fee made it an easy decision." — [first name], Humble host. Nothing here shows that this person is a real host. A second quote, on `guide-to-kids-birthday-party-pool-rental-lees-summit-mo` ("The 10% fee and included insurance really set them apart." attributed to a named "Lee's Summit Host"), is a NEEDS_DEREK INS row in the CSV for the same reason. It also mentions insurance and a non-zero fee. Under the never-invent-a-person rule it should be confirmed or removed; it was not edited. Listed in `crawl-gap-candidates.csv`.
2. **"0% … in 2026", "promocional", "through 2026", "forever for founding hosts".**
   - 54 CSV rows on 52 pages contain such wording. 9 of them are FUTURE rows; the rest sit inside rows whose wrong fee figure is fixed while the date wording is left alone.
   - raw_html says "0% host fee (through 2026)".
   - About 3,500 rendered `/p/` pages and about 3,800 public-pools pages carry "…you keep 100% of your rate in 2026." (crawl 2026-11-14). That sentence is not in fresh-web `src/` at the production commit, so it is injected from elsewhere, probably WEST's `/tools/cta.js` or a settings value. Its source was not located.
   - Whether the 0% host fee is permanent for everyone decides all of these. It is a future-pricing statement, so nothing was changed.
3. **`/p/affiliate`** offers to "waive your 10% platform fee" and shows "$3,200 avg. fees waived". The offer rests on a fee that doesn't exist, and the stat is invented. See `code-handoff.md` §1.
4. **Insurance-adjacent fee sentences** (78 CSV rows plus 12 crawl candidates). Examples: "Platform Fees/Insurance: ~$75", "low commission and comprehensive insurance", "real liability coverage". They are untouched, and no wording is proposed.

## 6. CSV format

Columns: `table, row_id, slug, column, line, action, category, old_text, new_text, occurrences_in_field, verified, snapshot, source, reasoning`.
- `old_text` is copied byte for byte from the saved database text. It is a substring of the field, long enough to be unique in it, with trailing whitespace trimmed.
- `new_text` replaces it exactly, and is empty for NEEDS_DEREK.
- `line` is the 1-based line within the field at snapshot time; it is informational only, since the anchor is the text.
- Several rows exist per page because `content` and `body_markdown` usually hold the same text twice. Both are listed.
- Rows never overlap within one field. No row contains a secret, an email address or a customer name.
- Apply only `FIX` rows marked `verified = YES`, using the guarded update in PENDING-READS.md.

## 7. Review of 2026-11-16

Reviewers checked the CSV against saved database lines, the 2026-11-14 crawl and live pages. Each finding below was
confirmed from those files (or a live GET on 2026-11-16) before the CSV was changed; `review-2026-11-16-changes.csv`
lists every row touched, and each changed row's `reasoning` starts with `[review 2026-11-16: ...]`.

| Finding | What was wrong | What changed |
|---|---|---|
| F9 | Spanish new texts said "nuestra tarifa (de servicio) del 0%", "solo retenemos el 0%", "tarifa plana del 0%" without saying it is the **host** fee; guests pay a 15% service fee, so these read as "PRNM charges nothing". Two English texts did the same ("Fees (0%)", "the 0% Flat Fee"). | 264 FIX rows now say "… 0% para anfitriones" / "Host fees (0%)" / "0% Host Fee". 22 rows where the 0% is set against the booking total, against host-plus-guest charges, or "you keep 100% of what guests pay" are NEEDS_DEREK `TOTAL`: no true 0% wording follows from the page plus the policy. |
| F10 | A FIX sentence was the antecedent of an untouched insurance sentence (Seguin: "We take 10% … This covers … the insurance") or sat beside a held INS/COVERS row (Las Vegas, Sunriver, Mendota Heights, Millcreek, the two `raw_html` renders). | 14 rows NEEDS_DEREK `INS_ADJ` (twin body columns included). Checked against the saved full lines (2026-11-15) for every FIX row that has one, and against the next sentence in the 2026-11-14 crawl for the 479 of the remaining 491 rows found there (12 not found); no other case found. |
| F11 | Page bodies would have said 0% next to a held sentence still saying 10% / ten percent / 90% / ninety. | Every FIX row in a body (`content`, `body_markdown`) of a page whose body keeps such a held sentence is NEEDS_DEREK `PARTIAL` (103 rows), so no page body is half corrected. Metadata fields are independent. |
| F12 | New texts promised the 0% is permanent ("locked-in", "inamovible … jamás", "inalterable", "Jamás cambiaremos"). Whether 0% is permanent is undecided (§5.2). | 8 rows NEEDS_DEREK `FUTURE`. Present-tense "garantizamos que te quedes con el 100%" was left as is. |
| F13 | Stale "$90 of every $100" / "$54 on $60" figures, "after the fee", "small fee covers" were missed. | 28 FIX rows added from saved database lines (Byhalia, Cameron Park, Elk City, Freehold, Gold Canyon, Grand Prairie, Grosse Pointe Farms and Park, Liberty, Manchester MO, Olean, Titusville, Watauga, Allentown, Hoover, Kennewick, Reynoldsburg, plus "we keep our fee at a 0%" qualified on three pages); 2 NEEDS_DEREK added (Owensboro COVERS, Northbrook SWIM). 8 pages with no saved database text went to `crawl-gap-candidates.csv`; their exact text is db-change/PENDING-READS P3. |
| F18 | Swimply comparison: the per-booking difference (+$40) and season totals ($1,200 / $2,400) still used the old $360 payout; the same table states a 5% PRNM guest fee "(covers card processing)". | +$80, $2,400 and $4,800 added as FIX rows; the 5% guest-fee cell is NEEDS_DEREK `COVERS`. Saratoga's "Profit: $1,500+" is still true and its exact text is not saved: P3. |
| F19 | `pool-rental-near-me-the-airbnb-of-pools` description ended "with a 0% "; Montgomery's title read "0% host Fee". | "… with a 0% host fee." and "Host for a 0% Host Fee". |
| F8 | `host-acq-city.tsx:367` shows "You take home on $200: $180" on about 3,900 city pages. | Code: `code-handoff.md` §0. |

**Totals after the review**: 3,491 rows. FIX 2,724 rows on 1,547 pages (2,334 fields); 1,729 verified, 995 pending Q1
(28 of them added by the review). NEEDS_DEREK 767 rows on 418 pages: DIFF 272, SWIM 175, PARTIAL 103, INS 78, COVERS 42,
ARITH 31, TOTAL 22, FUTURE 17, INS_ADJ 14, AMBIG 12, LEGAL 1. Every FIX row still passes the run-3 invariants (no FIX
text mentions insurance, liability, coverage, claims or damage; anchors in one field never overlap).

