# Public-pools text defects: measurement and cleaning rules (Task A)

> **Status: PREPARED, NOT APPLIED.** Nothing in this folder has changed any database row, page or service.
> The rules are for the owner's final approval and are to be applied by someone else, later, and only after the
> pp-ssr source has been captured into version control. **Whether pp-ssr reads this database live is
> UNVERIFIED.** On 2026-11-16 the rendered fields of every compared row equal the 2026-11-15 database extract
> byte for byte (47 of 47 compared fields; see section 0). So the pages are rendered
> from this data or an identical copy, but a copy cannot be ruled out. Nothing here changes pp-ssr.
>
> Machine-readable rules: [`rules.json`](rules.json) (generated from
> [`text-defects/text_defect_rules.py`](text-defects/text_defect_rules.py), the single source of truth).
> Hand-made examples: [`text-defects/examples.json`](text-defects/examples.json) (70 since the 2026-11-16
> revision, all passing `python3 -I text_defect_rules.py test`).
>
> **Revised 2026-11-16 after a content review** (section 9). The rules were narrowed; sections 2-4 keep the
> figures measured before that revision, section 9 gives the revised ones. Reads still owed to production: [`PENDING-READS.md`](PENDING-READS.md).

## 0. Sources and their dates

| Id | Source | Date (UTC) | Used for |
|---|---|---|---|
| S1 | Read-only SQL extract of `pp_pools` / `pp_cities` (38 statements, all `set transaction read only;`, by the interrupted earlier run of this task; queries and results saved in [`text-defects/s1-extract-2026-11-15/`](text-defects/s1-extract-2026-11-15/), `qNN.sql` / `rNN.json`, results are untrusted data) | 2026-11-15 20:32-23:50 | column types and shapes, server-side counts, all sampling rounds, count statements |
| S2 | Live pages listed in the saved `raw/public-pools.xml` sitemap: 2,000 pool pages and 476 city pages, GET only, at most 1.8 requests per second, fields extracted by [`extract_live.py`](text-defects/extract_live.py) | 2026-11-16T19:36:12Z to 2026-11-16T20:05:37Z | final counts with the final patterns, count contradictions against the page header, fresh validation sample, examples |

S2 files: the extracted fields of every page are in `text-defects/live-2026-11-16/live-fields.jsonl.gz`; the
outputs `live-summary.json`, `live-planned-changes.jsonl` (every planned deletion and skip, per page) and
`count-statements.csv` are next to it. Re-run without network (from `text-defects/`):
`gunzip -k live-2026-11-16/live-fields.jsonl.gz && python3 -I text_defect_rules.py live /tmp/out live-2026-11-16/live-fields.jsonl`.

The production database tool hung on 2026-11-16 and was not called; no service key was read. Numbers marked
**S1** come from the database as it was on 2026-11-15. Numbers marked **S2** come from the rendered pages of 2026-11-16
and cover only the 2,476 sitemap pages, not every row (the tables have 3,381 pool and 647 city
rows). PENDING-READS.md holds the read-only queries that will recompute the S2 counts on the whole tables.

Pages = data check (S2 against S1): 12/12 city intros (r13), 11/11 pool descriptions (r11), 23/23 pool FAQ answers (r12), 1/1 Best-for value (r30) identical between the 2026-11-15 extract and the 2026-11-16 live page (3 sampled rows have no page in the sitemap). City-page header counts ("There are **N** public
swimming pools") equal `count(*)` of published `pp_pools` for the city in S1 on every compared city.

## 1. Column types and value shapes (step 1)

Types are from `information_schema.columns` (S1). Shapes are server-side counts (S1, 2026-11-15) unless marked S2.

| Column | Type | Shape (S1 counts) | On the page (S2) |
|---|---|---|---|
| `pp_pools.ai_best_for` | **text** | 1,821 valid JSON-array strings (8 of them `[]`), 1,560 NULL; 0 plain text, 0 empty string, 0 malformed. Arrays hold 0-6 elements, all strings, none blank, none containing a comma, quote, bracket, markup, pronoun or insurance word; longest element 26 characters. For all 1,821 the stored text equals `jsonb` canonical text (`["a", "b"]`). | printed **verbatim** after "Best for:" (raw brackets and quotes): 1,685 pages print an array, 7 of them `[]`; 315 pool pages have no Best-for line |
| `pp_pools.ai_description` | text | 3,315 text, 66 NULL; 1 value contains a paragraph break (`\n\n`), 1 pool row has any newline | under "About &lt;pool&gt;" as paragraph(s) |
| `pp_pools.ai_faqs` | **jsonb** | 1,821 arrays, 1,560 NULL. 5,668 entries, all objects: 5,652 `{q,a}`; 16 entries in 5 rows carry an extra key (`b` "" x5, `keyword` x4, `keywords` x3, `q_raw` x3, `alternative_options_available` x1) | `<details>` question/answer, **and** a FAQPage JSON-LD block with the same answers |
| `pp_pools.ai_tips` | jsonb | 1,821 arrays of strings (7,247 strings), 1,560 NULL | **not rendered** (a known tip was absent from its page and its JSON-LD) |
| `pp_pools.hours_json` | jsonb | 2,452 arrays of strings (17,164), 462 objects (346 `{Mon-Fri, Note, Sat-Sun}`, 116 `{Mon-Fri, Sat-Sun}`), 467 NULL. No narrator word in any value | hours table |
| `pp_pools.amenities` | jsonb | 788 arrays (3,574 strings in 779 rows), 2,593 NULL. No narrator word | not in scope |
| `pp_pools.price_notes` | text | 314 text, 3,067 NULL. No narrator word | not in scope |
| `pp_cities.ai_intro` | text | 639 text, 8 NULL, no paragraph breaks | after the header sentence "There are **N** public swimming pools in X." |
| `pp_cities.ai_faqs` | **jsonb** | 403 arrays, 244 NULL. 1,961 entries: 1,939 `{q,a}`; `c` x10 (2 rows), `b` x5 (1 row), `keywords` x5 (1 row), one entry with `q2..q5` and one with `a2..a5`+`q2..q5` | `<details>` + FAQPage JSON-LD |
| `pp_cities.meta_title`, `meta_description` | text | no narrator word. Not text defects of this task, but seen: 197 `meta_description` values contain U+FFFD (a broken dash) and 331 contain "$25/hr" | `<title>` / meta description |

Other facts the rules rely on: the protection marker `§` occurs in no text column (S1); every rule pattern is
written in the regex subset that behaves the same in Python and PostgreSQL ARE.

## 2. First-person / narrator filler (step 2)

### 2.1 How the pattern list was built

The list was built empirically on S1 and finished on S2. Each round read real rows, adjusted the patterns, counted
again, and read what the patterns matched and what they still missed:

1. **Token census (S1).** Rows with any first-person or "folks" token: descriptions 1,699 of 3,315, pool FAQ answers
   1,508 of 1,821 rows, pool FAQ questions 188 (reader voice: "Are there other pools I could consider?",
   not a defect), tips 54, city intros 378 of 639, city FAQ answers 287 of 403, city FAQ questions 396 (reader
   voice), meta fields 0, hours/amenities/price notes 0. Sentence volume: 49,818 sentences, 5,904 with a
   singular I/my/me, 1,568 with only plural we/our/us.
2. **Phrase census (S1).** Three-word openings of flagged sentences ("the information I" 258, "I'd check the" 212,
   "from what I" 149, "I always tell" 124, "we've got a" 63, "our pool season" 31 ...) and the word after
   we/our/us/folks ("we've got" 127, "we get" 111, "our directory" 83, "we list" 59 ...).
3. **Samples of 25 / 12 rows** read by hand: 12 descriptions, 25 pool FAQ answers, 12 city intros, 12 tips,
   13 questions, 25 founder-voice sentences ("I started PoolRentalNearMe.com because ...", "My company ...").
4. **Recall scan (S1).** Sentences NOT flagged but carrying narrator hints: "local" 718, "folks" 524,
   "sounds like" 397, "honestly" 345, "seems like" 308, "you know" 141, "here in" 50, "in this area" 34 ...
   These were read. "folks here", "around here", "here in &lt;Place&gt;", "people here" became the **local-voice**
   class; "honestly", "sounds like", "seems like" and "you know" stayed out: on their own they are hedges, not a
   narrator.
5. **Classifier rounds.** Every round ran server-side (S1) and printed deleted / kept sentences for review.
   Rounds q31-q35 printed the full text of 65 rows (45 pools, 20 cities). q36 (30 pools + 20 cities, seed
   "verify50") and q37 ("clean50") checked deletions and unflagged first-person tokens. q38 ("last50") used 50 rows
   never sampled before: 587 sentences, 73 narrator, 25 deleted. It had **one false positive**, "Most other pools
   around here are outdoors." (a pool-type claim), fixed by adding `indoors?|outdoors?` to the fact vocabulary.
   It had no missed narrator sentence; its only unflagged first-person sentences were site voice and count
   statements, which belong to R6. q39, the re-check after that fix, was refused, and the run stopped.
6. **This run (S2).** Re-checked locally: 799 of 812 S1 sample sentences get the same verdict from the final module
   as from the server. The 13 differences are all the later, more conservative guards, except one local-voice
   opinion. Two more conservative changes came from live text: "rented **through us**" is site voice (marketplace
   self-reference, not an invented person), and count sentences that also describe a facility are never automatic
   (section 3). Three fresh samples of 50 live pages each (30 pools + 20 cities; seeds 50, 51, 52; disjoint; none used in examples or earlier rounds) were read in full: every deleted sentence, every kept narrator sentence and every unflagged sentence with a narrator-like word. Round 1 (800 sentences, 117 narrator, 26 deleted) had **one false positive**, "Rates are pretty fair, from what I can tell." (a price opinion; fixed by adding *rates* to the price words). Round 2 (730, 99, 28) had **one false positive**, "My notes say they have affordable daily and monthly passes." (a fact report caught by the data-gap class; fixed: a data-gap sentence must also contain a negation or limitation). Round 3, with the final patterns (738 sentences, 110 narrator, 20 deleted), had **no false positive and no missed narrator sentence**. In all three rounds the unflagged sentences were hedges ("sounds like", "honestly", "you know"), generic "here" statements or site voice; none was an invented first-person narrator. Sheets: [`round1`](text-defects/validation-sample-2026-11-16-round1.txt), [`round2`](text-defects/validation-sample-2026-11-16-round2.txt), [`round3`](text-defects/validation-sample-2026-11-16-round3.txt) (all re-listed with the final patterns).

### 2.2 Final pattern list (summary; exact regexes in rules.json)

| Name | Detects |
|---|---|
| `SING` | I, I'm, I'd, I've, I'll, my, me, mine, myself (Roman numerals such as "Phase I" are masked first; "I-35" is excluded) |
| `PLUR` | we, we're, we've, we'd, we'll, our, ours, us, ourselves |
| `LOCAL` | "around/down/up/out here", "here in &lt;Place&gt;", "folks/people/everyone/locals here", "folks in this/our", "in this town" |
| `SITE` | site voice, exempt when the sentence has no singular form: "our directory/site/listings", "we list/track/show/help/connect ...", "where we come in", "through/with/from/via us", "PoolRentalNearMe" |
| `FOUNDER` | invented founder / company voice: "I started/built PoolRentalNearMe.com", "my company/site", "our members/hosts", "I've sent a lot of people" |
| `GAP` | narrator says what it does not know: "my information/data/records ...", "I don't/can't/couldn't ...", "I'm not sure/aware", "isn't something I have" |
| `ADVICE` | narrator referral/advice at sentence start (short lead-in allowed): "I'd suggest/recommend/call/check ...", "I always tell people to", "my advice" |
| `GENERIC_ADVICE`, `GENERIC_GAP` | non-narrator referral / data-gap sentences, used only to decide whether a whole FAQ answer is empty of facts (R5) |
| fact guards | `NUMERIC` (digit, $, %, number word), `URL` (web/e-mail/phone), `CLAUSE` (but, however, which, since, ;, a comma + it/they/there ...), `COMMA_SPLICE`, `POLARITY` ("Yes, ..."), `LEXICON` (amenity, rating, pool type), `LEX_PRICE_SCHEDULE` (price and schedule words) |
| field guards | `DANGLING_OPENER` (next kept sentence starts with It/They/That/This/So/But ... or "&lt;Words&gt;, it's/they ..."), `CAPWORD` (a deleted sentence that names something and is followed by more text) |
| `INSURANCE` | insurance, liability, liable, coverage, covered, claims, damage ... |

A sentence is **narrator** if it has a singular form, or a plural/local form without site voice. A narrator
sentence is **deletable** (class a) only if it has no insurance word, no number, no URL/phone, no second clause,
no answer polarity, and, for advice and opinion, no fact vocabulary (opinion also no price/schedule word). Founder
sentences are deletable even with a clause or number (every clause is invented), but never with fact vocabulary.

### 2.3 Measured counts (pure filler vs mixed)

**S2, final patterns, 2,000 pool pages and 476 city pages:**

| | Pool pages | City pages |
|---|---|---|
| Pages with at least one narrator sentence | 1,653 | 372 |
| Narrator sentences kept as out of scope (class b, below) | 3,535 | 624 |
| R2: descriptions changed / sentences deleted | 229 / 243 | - |
| R2: descriptions skipped (next sentence points back / names an entity / would be empty) | 192 / 9 / 0 | - |
| R3: FAQ arrays changed / sentences deleted | 655 / 810 | - |
| R3: FAQ arrays skipped (points back / entity / empty) | 213 / 26 / 0 | - |
| R4: intros changed / sentences deleted | - | 140 / 168 |
| R4: intros skipped (points back / entity / empty) | - | 44 / 7 / 0 |
| R4: city FAQ arrays changed / sentences deleted | - | 32 / 38 |
| R4: city FAQ arrays skipped (points back / entity / empty) | - | 17 / 7 / 0 |
| Fields frozen because a narrator sentence mentions insurance/liability/coverage/claims/damage | 29 pool fields | 2 intros |

The owner's live measurement of 2026-11-15 (829 pool pages and 148 city pages with first-person filler) used a
narrower phrase list. The counts here are higher because they include plural "we/our" and local-voice
narrators ("We get a good three months ...", "folks here").

**S1, server side, 2026-11-15 22:14 UTC (patterns one iteration older than the final list, whole tables):**
narrator sentences, and how many of them that iteration could delete: pool descriptions 2,802 (764 deletable),
pool FAQ answers 2,977 (1,693), city intros 673 (275), city FAQ answers 253 (78), tips 53 (18, not rendered).
Rows changed after the field-level skips (22:22 UTC): descriptions 308, pool FAQ arrays 729 (938 sentences), city
intros 148, city FAQ arrays 39. The final patterns are stricter, so final S1-style counts will be lower or
equal. PR-3 in PENDING-READS.md recomputes them on the whole tables.

### 2.4 Out of scope: narrator sentences that also carry a fact (class b, never deleted automatically)

S2 counts with the final patterns; two real sentences per shape:

| Field | Narrator class / reason kept | Sentences | Example |
|---|---|---|---|
| pool.desc | opinion / number | 916 | Dallas is a big city, over a million people, so I always recommend calling first to check for any schedule changes, especially with public pools. |
| pool.desc | opinion / second_clause | 611 | I mean, that's a solid average, so most people leaving reviews are happy with the place. |
| pool.faq | advice / number | 340 | I'd recommend calling (210) 433-6391 to confirm anything specific. |
| pool.faq | opinion / second_clause | 334 | It's called the 'Westside Family YMCA,' so yeah, I'd say it's designed with families in mind. |
| pool.desc | opinion / fact_vocabulary | 259 | I think it's a good spot if you're looking for year-round swimming. |
| pool.faq | gap / second_clause | 224 | Most municipal pools have dedicated parking lots, but I couldn't confirm the details for this specific location. |
| city.intro | opinion / fact_vocabulary | 223 | It's not uncommon for folks to be looking for a place to swim from May all the way through September, sometimes even into October if we get a late warm spell. |
| pool.faq | opinion / number | 178 | It's best to call them directly at (386) 749-2233 if you have specific questions about their policies regarding minors, though I wouldn't expect it. |
| city.intro | opinion / second_clause | 177 | Around here, when the temps hit triple digits in summer, a pool isn't just a luxury, it's a necessity. |
| pool.faq | opinion / fact_vocabulary | 140 | I think that pricing is pretty fair, especially with the competition-style amenities they have available. |
| pool.desc | advice / number | 132 | I'd call ahead (210) 433-6391 if you have specific questions about what's available. |
| pool.faq | advice / fact_vocabulary | 131 | If this pool doesn't work out, I'd check the Shreveport Parks and Recreation department for other public pools or splash pads. |
| city.faq | opinion / second_clause | 94 | But we also have strong indoor options, like parts of the Richardson Aquatic Center and the Richardson Family YMCA, which offer swimming year-round regardless of the weather. |
| city.faq | opinion / fact_vocabulary | 49 | There aren't any publicly accessible indoor pools that I'm aware of. |
| city.intro | opinion / number | 48 | If you're new around here and looking to swim, definitely check that out first, or consider a private rental if you want something quieter or more consistent. |
| pool.desc | advice / second_clause | 40 | I'd say give them a call if you have specific questions, especially since it's a particular kind of pool experience. |
| pool.faq | advice / second_clause | 40 | For other pool options, I'd suggest checking out the City of Santa Monica's recreational department website, they might list other facilities or private clubs in the area. |
| pool.faq | opinion / answer_polarity | 34 | Yes, I think so. |
| pool.desc | gap / second_clause | 26 | I don't usually talk about clothing-optional spots because our focus is more on traditional pools, but this one's on the list so here we are. |
| pool.faq | gap / number | 25 | The address is 3100 Hiawatha St. Most public parks like this have some parking, but I couldn't confirm the exact parking situation. |
| pool.faq | advice / url_or_contact | 23 | I'd suggest looking at the full list on the main phoenix.gov/parks website. |
| pool.desc | insurance / mentions insurance/liability/coverage/claims/damage | 15 | They've got the basics covered, like restrooms and parking, which are non-negotiables for me. |
| pool.faq | insurance / mentions insurance/liability/coverage/claims/damage | 13 | The information I have doesn't cover parking specifics. |
| pool.desc | advice / fact_vocabulary | 12 | I always tell people to check those reviews. |
| pool.desc | advice / url_or_contact | 12 | I'd definitely check out their website too (ymcasf.org/location/chinatown-ymca/) for any updates before you head over. |
| city.faq | gap / second_clause | 11 | I don't know of any completely free public swimming, but daily passes or punch cards make it pretty affordable for most people. |
| pool.desc | opinion / local_marker_on_pool_page | 10 | They've got an outdoor setup, which is pretty standard for public pools around here during the summer. |
| pool.desc | gap / number | 8 | You'll find it at 12345 Inwood Rd. I haven't been myself, but the 'Family Aquatic Center' part of the name makes me think it's probably set up well for more than just lap swimming. |
| city.intro | advice / number | 6 | If you're new to town and trying to find a regular swim spot, I'd say check out the schedules for the public pools first. |
| city.faq | founder / fact_vocabulary | 4 | My site, PoolRentalNearMe.com, isn't free, but it lets you rent private backyard pools by the hour, which can be a good option for groups or if you want privacy without a membership. |
| city.faq | opinion / answer_polarity | 4 | Yes, we have both. |
| pool.desc | founder / fact_vocabulary | 4 | My team dug into it and from what we gathered, the 3.8 average rating from over 400 reviews on Google suggests folks generally like it. |
| pool.desc | opinion / url_or_contact | 4 | I mean, they even have their own project site on the Philly.gov website, that's a good sign that it's important to the area. |
| city.faq | opinion / number | 2 | A few might push into early October if we have a late heat wave, but generally, plan for those four to five months. |
| city.intro | founder / fact_vocabulary | 2 | I started PoolRentalNearMe.com because I saw a real need for people to find pools by the hour, without needing to buy a house or get a membership. |
| city.intro | insurance / mentions insurance/liability/coverage/claims/damage | 2 | We've got you covered for that kind of info too. |
| pool.faq | gap / url_or_contact | 2 | Since it's a public pool run by the city of Jacksonville, it's likely very affordable, but I can't confirm without looking it up on coj.net or calling them. |
| city.faq | gap / number | 1 | I don't know of any completely free options, but daily passes are usually available at a reasonable cost if you're just looking for a one-off swim. |
| city.faq | insurance / mentions insurance/liability/coverage/claims/damage | 1 | If you're looking for something more private than a public pool, we've got you covered. |
| pool.faq | founder / fact_vocabulary | 1 | If Mason Swimming Pool's limited hours don't work for you, I'd suggest checking the Houston Parks and Recreation Department site or looking on PoolRentalNearMe.com for more options in your area. |
| pool.faq | opinion / url_or_contact | 1 | Since Citywide Aquatics is run by the city's parks department, I'd check the LAParks.org aquatics website. |

Reason key: `number` (digit, $, % or number word: prices, ratings, populations, hours), `fact_vocabulary` (an
amenity, rating, pool-type, price or schedule word), `second_clause` (but / which / since / a comma + it/they ..., or
a comma splice "..., I'd ..."), `url_or_contact` (website, e-mail, phone), `answer_polarity` (starts "Yes"/"No"/
"Absolutely" ...: it is the answer itself), `local_marker_on_pool_page` (local voice alone is not removed from pool
pages), `founder / fact_vocabulary` (an invented founder sentence that also names an amenity: listed for the owner),
`insurance` (never touched; the whole field is frozen). The insurance pattern is deliberately broad: it also
freezes fields over harmless uses such as "they've got the basics covered" or "the information I have doesn't
cover parking". That over-freezing is intended; an insurance sentence must never be missed.

## 3. Pool counts stated in city prose (step 3)

**Header check (S2, 2026-11-16).** On city pages the header sentence ("There are **N** public swimming pools in X"),
the list heading ("All N public pools in X") and the number of pool cards are equal on every fetched page
(476 of 476 agree). On the pages compared with S1 they also
equal `count(*)` of published pools joined on `city_id`: Austin 47, Chicago 57, Fremont 12, Wilmington 7, and the
12 cities of section 0. R6 therefore compares prose with that page count.

**Method.** Every intro and FAQ sentence of the 476 city pages was parsed for a count of pools
(digits or number words: "five public pools", "four listed in our directory", "just the one", "the only public
pool we list", "we don't have any public pools listed", and vague "a few listed"). Each statement got a category
(`r6_classify`). Then every statement whose number differs from the page count was judged by hand.
S1 found the same kind of list on the database (199 count sentences in 187 cities, 50 differing, 2026-11-15); every
S1 contradiction reappears below.

Categories: **auto**: a directory count that differs from the page count, in a sentence with nothing else that
could be a fact. Deleted by R6 unless the field-level checks skip it. **review_mixed**: the count is wrong, but the
sentence also names a facility feature, price, schedule, another number or a claim (offers, family-friendly,
known ...). **review_subtype**: a count of a sub-type ("one public *outdoor* pool"). **review_scope**: a count
without a directory word. **hold_duplicate**: the count matches once mapped duplicate records are merged.
**vague**: "a few", "a couple", "plenty". Only `auto` is automatic; the rest is listed here with a hand verdict.

Cities with at least one statement judged a contradiction by hand (including vague quantities that the page count plainly contradicts): **36** (S2). Statements by
category: auto 18, hold_duplicate 1, review_mixed 12, review_scope 9, review_subtype 2, vague 23.

| City (page) | Page count | Stated | Category | R6 does | Hand verdict | Sentence |
|---|---|---|---|---|---|---|
| alabama/montgomery (faq) | 10 | 4 | auto | deletes | contradiction: wrong directory count | We've got four listed in our directory: Montgomery Community Pool, Montgomery Municipal Pool, Montgomery Family Aquatic Center, and Montgomery Aquatic Center. |
| arizona/mesa (intro) | 13 (12 distinct) | 1 | auto | deletes | contradiction: wrong directory count | We've got just one public spot listed for Mesa so far (Skyline Aquatic Center). |
| california/sacramento (intro) | 22 (19 distinct) | 5 | auto | deletes | contradiction: wrong directory count | We've got five public pools on our site for Sacramento, so there are options across the city. |
| california/torrance (faq) | 2 | 1 | auto | skipped (next_sentence_refers_back), reported | contradiction (page shows 2), same Torrance question | The only public pool we have listed is the Victor E. Benstead Plunge. |
| colorado/aurora (intro) | 44 (43 distinct) | 5 | auto | deletes | contradiction: wrong directory count | We've got five public pools listed in our directory, so you've got options. |
| colorado/centennial (intro) | 6 | 4 | auto | deletes | contradiction: wrong directory count | We've got a decent number of public pools, four listed in our directory, covering everything from basic swim to full-blown aquatic centers. |
| colorado/lakewood (faq) | 10 | 4 | auto | deletes | contradiction: wrong directory count | Our directory lists four public pools in Lakewood. |
| delaware/wilmington (intro) | 7 | 5 | auto | skipped (next_sentence_refers_back), reported | contradiction: wrong directory count | Our site lists five public pools in Wilmington, but there are always private options too if you want something different. |
| florida/clearwater (faq) | 6 | 4 | auto | skipped (next_sentence_refers_back), reported | contradiction: wrong directory count | Our directory lists four public pools: Clearwater Family Aquatic Center, Clearwater Municipal Pool, Clearwater Aquatic Center, and Clearwater Community Pool. |
| illinois/chicago (intro) | 57 (55 distinct) | 5 | auto | deletes | contradiction: wrong directory count | Even with five public pools in our system, finding your perfect swim can sometimes mean looking beyond the city parks. |
| illinois/chicago (faq) | 57 (55 distinct) | 5 | auto | deletes | contradiction: wrong directory count | We've got five public pools in our directory. |
| kentucky/louisville (intro) | 17 | 5 | auto | skipped (next_sentence_refers_back), reported | contradiction: wrong directory count | We've got five public pools listed for Louisville, so there's usually an option not too far from wherever you are. |
| new-york/brooklyn (intro) | 28 | 5 | auto | deletes | contradiction: wrong directory count | We've got five public pools listed in our directory, so there are options, even if it feels like a big city to navigate. |
| north-carolina/greensboro (intro) | 20 | 5 | auto | deletes | contradiction: wrong directory count | We've got five public pools listed, which is a good baseline, but there are always more options if you want something a bit different than the usual public spot. |
| south-carolina/mount-pleasant (intro) | 2 | 1 | auto | deletes | contradiction: wrong directory count | We've only got one public pool listed in our directory for Mount Pleasant, so knowing your options for getting in the water is key. |
| texas/houston (intro) | 53 (51 distinct) | 5 | auto | deletes | contradiction: wrong directory count | We've got a decent number of places listed for Houston, five public pools right in our directory, plus lots of backyard pools available by the hour. |
| washington/bellevue (intro) | 6 | 4 | auto | skipped (next_sentence_refers_back), reported | contradiction: wrong directory count | We list four public pools ourselves, which is pretty good for a city this size. |
| wisconsin/milwaukee (intro) | 12 | 5 | auto | deletes | contradiction: wrong directory count | Even with five pools like Pulaski and Schulz in our directory, a lot of people also look for other options. |
| california/fremont (intro) | 12 | 1 | review_mixed | listed only | contradiction plus another claim: recommend delete after owner review | We've got one public pool listed, Aqua Adventure, which is more of a waterpark vibe, perfect for families and less about grinding out laps. |
| california/oceanside (faq) | 9 | 1 | review_mixed | listed only | contradiction plus another claim: recommend delete after owner review | Our one listed public pool, El Corazon Aquatic Center, has multiple pools, including an indoor competition pool and outdoor recreational pools. |
| california/sacramento (faq) | 22 (19 distinct) | 5 | review_mixed | listed only | contradiction plus another claim: recommend delete after owner review | The five pools listed in our directory for Sacramento (Clunie, Pannell Meadowview, Tahoe, Southside, Oki) are all outdoor pools. |
| georgia/savannah (faq) | 12 | 1 | review_mixed | listed only | contradiction plus another claim: recommend delete after owner review | The Savannah Aquatic Center, our one public pool listing, requires an entry fee, but it's pretty affordable. |
| nebraska/omaha (faq) | 23 | 5 | review_mixed | listed only | contradiction plus another claim: recommend delete after owner review | Our directory lists five pools in Omaha: Hitchcock Park Pool, Hitchcock Pool, Lee Valley Pool, and Montclair Pool are all outdoor and seasonal. |
| north-carolina/charlotte (intro) | 48 (46 distinct) | 5 | review_mixed | listed only | contradiction plus another claim: recommend delete after owner review | We've got five public pools listed in our directory, but honestly, if you're new to town or just visiting, you need to know that memberships or day passes are pretty standard. |
| north-carolina/wake-forest (faq) | 4 | 3 | review_mixed | listed only | contradiction plus another claim: recommend delete after owner review | All three public pools we list (Wake Forest Community Pool, Wake Forest Aquatic Center, Wake Forest Municipal Pool) are family-friendly. |
| ohio/cleveland (faq) | 19 (17 distinct) | 5 | review_mixed | listed only | contradiction plus another claim: recommend delete after owner review | The five pools listed in our directory for Cleveland (Loew, Lincoln, Wading, Foster, Cumberland) are all outdoor facilities. |
| tennessee/franklin (intro) | 5 | 4 | review_mixed | listed only | contradiction plus another claim: recommend delete after owner review | With a population over 80,000 and four listed public pools, they can get crowded on hot days. |
| tennessee/murfreesboro (faq) | 8 | 4 | review_mixed | listed only | contradiction plus another claim: recommend delete after owner review | We list four public pools, including the Murfreesboro Community Pool and Murfreesboro Municipal Pool, which offer affordable day passes or season rates for residents. |
| texas/austin (intro) | 47 (45 distinct) | 5 | review_mixed | listed only | contradiction plus another claim: recommend delete after owner review | We've got a total of five public pools listed in our directory, and there are some specific places that are pretty well-known for swimming. |
| texas/plano (intro) | 17 | 4 | review_mixed | listed only | contradiction plus another claim: recommend delete after owner review | We've got four public spots in our directory, but they definitely cater to different crowds. |
| california/walnut-creek (intro) | 4 (3 distinct) | 1 | review_subtype | listed only | subjective sub-type ('big'); page lists 4 records (3 distinct): owner, recommend delete | Public pools are good, but there's only one big public spot we list in town. |
| colorado/fort-collins (intro) | 12 (11 distinct) | 1 | review_subtype | listed only | sub-type claim, as above: owner | We really only have one public outdoor pool in our directory for Fort Collins right now. |
| california/irvine (faq) | 16 | 1 | review_scope | listed only | not a count of the city's pools: keep | Some of the public aquatics centers keep at least one pool heated year-round for lap swimming, but the more open, recreational swim times are definitely in the warmer months. |
| california/san-jose (faq) | 35 | 1 | review_scope | listed only | not a count of the city's pools: keep | Many public and private facilities keep at least one pool heated and open year-round, especially for lap swimming and lessons. |
| california/torrance (intro) | 2 | 1 | review_scope | listed only | contradiction (page lists Torrance Aquatic Center and Victor E. Benstead Plunge) unless the two records are one facility (not in the duplicate map): owner | We don't have a huge public pool scene, just one main spot for everyone. |
| california/torrance (intro) | 2 | 1 | review_scope | listed only | contradiction, same Torrance question: owner | Finding a spot often means going to that one public pool or looking into something more private. |
| colorado/fort-collins (faq) | 12 (11 distinct) | 1 | review_scope | listed only | sub-type claim; S1 pool_type marks only City Park Pool 'Outdoor' (11 of 12 NULL), so it cannot be checked: owner | We only list one public outdoor pool. |
| florida/port-st-lucie (faq) | 7 | 3 | review_scope | listed only | contradiction (names 3 of 7): recommend delete | All three public pools, the Port St. Lucie Community Pool, Aquatic Center, and Municipal Pool, are known to be kid-friendly. |
| minnesota/edina (intro) | 2 | 1 | review_scope | listed only | contradiction (page lists 2, Edina Aquatic Center and Edinborough Park Pool): recommend delete | Edina's one public pool at Edinborough Park is a big draw there, especially with the indoor options. |
| south-carolina/charleston (faq) | 10 (9 distinct) | 1 | review_scope | listed only | not a count ('one public option' among others): keep | The James Island Recreation Complex Pool is one public option, often having daily fees or seasonal passes available. |
| washington/bremerton (faq) | 3 | 1 | review_scope | listed only | not a count of the city's pools: keep | Most public facilities will have at least one indoor pool for year-round use. |
| california/apple-valley (intro) | 2 (1 distinct) | 1 | hold_duplicate | listed only | consistent with the facility count (duplicate pair G039): hold until the duplicate decision | We've got just one public pool we track in Apple Valley, the Civic Center Park Aquatic Center. |
| california/lodi (faq) | 1 | - | vague | listed only | contradiction-like ('a few' vs 1): owner, recommend delete | We've got a few listed in the area. |
| california/oakland (intro) | 9 | - | vague | listed only | contradiction-like ('a few' vs 9): owner, recommend delete | We list a few public pools here, but there are other options if you look around. |
| colorado/colorado-springs (intro) | 12 | - | vague | listed only | contradiction-like ('a couple' vs 12): owner, recommend delete | We've got a couple of public spots, but the options are a bit limited if you're after serious, undisturbed swimming. |
| colorado/westminster (intro) | 5 | - | vague | listed only | vague, not contradicted: keep | We've got a few listed in our directory too, which makes finding a spot pretty straightforward. |
| connecticut/stamford (faq) | 11 | - | vague | listed only | vague, not contradicted: keep | We've got several public outdoor options. |
| florida/boca-raton (intro) | 4 | - | vague | listed only | vague, not contradicted: keep | We've got a decent number of pools in the area, but sometimes you want something that's just yours for a few hours, without the membership fees or the crowds. |
| florida/daytona-beach (intro) | 3 | - | vague | listed only | vague, not contradicted: keep | We list a few public options on PoolRentalNearMe.com, but sometimes a private spot can be better. |
| florida/hialeah (intro) | 14 (13 distinct) | - | vague | listed only | vague, not contradicted: keep | We've got a decent number of pools here for the population, so there's usually a lane or a spot for everyone. |
| florida/hialeah (faq) | 14 (13 distinct) | - | vague | listed only | vague, not contradicted: keep | We list plenty of options on PoolRentalNearMe.com. |
| florida/hollywood (intro) | 8 | - | vague | listed only | vague, not contradicted: keep | People look for any excuse to get in the water, and we've got plenty of options. |
| florida/land-o-lakes (intro) | 4 | - | vague | listed only | vague, not contradicted: keep | We've got a few options listed, and it's definitely a growing trend for people to rent out their backyard pools by the hour instead of hassling with public access or memberships. |
| florida/spring-hill (intro) | 3 | - | vague | listed only | vague, not contradicted: keep | We've got a few listed in our database. |
| florida/tampa (intro) | 14 (12 distinct) | - | vague | listed only | contradiction-like ('a few' vs 14): owner, recommend delete | We've got a few public options, but lots of people also look at private rentals when they want something more flexible or with specific amenities. |
| florida/winter-park (faq) | 5 | - | vague | listed only | vague, not contradicted: keep | We list plenty of options on PoolRentalNearMe.com. |
| georgia/johns-creek (intro) | 3 | - | vague | listed only | vague, not contradicted: keep | We've got a decent number of public options, but depending on what you need, private might be the way to go. |
| georgia/lawrenceville (intro) | 3 | - | vague | listed only | vague, not contradicted: keep | We list a few public options on PoolRentalNearMe.com, but sometimes a backyard pool rental is a good alternative. |
| nevada/reno (intro) | 13 | - | vague | listed only | contradiction-like ('a few' vs 13): owner, recommend delete | We've got a few solid options listed on PoolRentalNearMe.com, but plenty of other places too. |
| north-carolina/wake-forest (intro) | 4 | - | vague | listed only | vague, not contradicted: keep | We've got a decent number of public pools listed for Wake Forest, and they cover the basics for most swimmers looking for a public spot. |
| oregon/beaverton (faq) | 6 | - | vague | listed only | vague, not contradicted: keep | We have several options listed on PoolRentalNearMe.com. |
| texas/conroe (intro) | 4 | - | vague | listed only | vague, not contradicted: keep | We've got a decent number of pools listed for the size of the town, which is good. |
| texas/el-paso (intro) | 20 | - | vague | listed only | contradiction-like ('a couple' vs 20): owner, recommend delete | They get busy, especially with only a couple listed there. |
| texas/kyle (intro) | 3 | - | vague | listed only | vague, not contradicted: keep | We've got a decent number of public pools listed in our directory for a city this size, and they do a good job of serving the community. |
| utah/salt-lake-city (intro) | 5 | - | vague | listed only | vague, not contradicted: keep | We've got a few listed in our directory, and they get pretty popular when the weather heats up. |

Not in this table: statements whose number equals the page count (92 sentences on
89 city pages, S2), and "not_inventory" hits, which are numbers that are not a city's pool count ("at least one or two options",
"the one at Pullen Aquatic Center", "four to five months"). Sentence-level deletion by R6 never rewrites a number.
Where the owner wants a correct count in the prose, the page header already prints it.

## 4. FAQ entries (step 4)

S2, final patterns:

| | Pool pages | City pages |
|---|---|---|
| FAQ entries rendered | 5,322 | 1,900 |
| entries with at least one narrator sentence | 2,378 | 228 |
| of these, **entirely non-informative** (R5 deletes the whole entry) | 59 | 0 |
| of these, carrying a fact (entry kept; R3/R4 may delete single sentences) | 2,319 | 228 |
| R5 entries deleted (rows) | 59 (58) | 0 (0) |
| R5 skipped: every entry of the row would go / insurance | 0 / 0 | 0 / 0 |

S1, server side (2026-11-15 22:22, one iteration earlier): 77 non-informative pool entries in 76 rows, 0 city
entries. A non-informative answer looks like "My information doesn't specify parking for X. I'd suggest
checking the city's parks department." Every sentence is a narrator data gap or a narrator/generic referral, with
no phone number, URL, price, rating or second clause. An answer that keeps even one general statement ("Public
pools usually have a daily rate or a pass option.") or a phone number is kept, and only its narrator sentences
can go (R3/R4). Deleting an entry also removes it from the FAQPage JSON-LD that pp-ssr prints from the same
array.

## 5. The rules

Order of application: **R1, R5, R6, R2, R3, R4.** Operations allowed: delete whole sentences, delete whole FAQ
entries, re-join the elements of an existing list. Never allowed: compose, paraphrase or reorder text; change a
number; touch a FAQ question; touch a sentence about insurance, liability, coverage, claims or damage; merge,
delete or unpublish a record.

| Rule | Column | Matches | Does | Must skip (row left unchanged and reported) |
|---|---|---|---|---|
| **R1** | `pp_pools.ai_best_for` | a text value that parses as a JSON array of non-empty strings | **reformat list**: replace it with the elements joined by ", ", same order and spelling | NULL; `[]` (8 rows S1; would print an empty line); not JSON; an element with a comma, quote, bracket or markup (0 in S1); an insurance word |
| **R2** | `pp_pools.ai_description` | deletable narrator sentences (section 2.2) | **delete sentence** | a narrator sentence in the field mentions insurance (field frozen); deletion would empty the field; the next kept sentence points back (It/They/That/So/But ... or "&lt;Words&gt;, it's/they ..."); a deleted sentence names something (capitalised word other than its first word, I-forms, the pool, city or state name) and is followed by more text |
| **R3** | `pp_pools.ai_faqs[*].a` | as R2, after R5 | **delete sentence** | as R2; the unit is the row's whole FAQ array (one failing answer leaves every answer of that row unchanged); entries whose `a` is not a string or that carry `a2..a5` keys are never touched; other keys of an entry are kept byte-identical |
| **R4** | `pp_cities.ai_intro`, `pp_cities.ai_faqs[*].a` | as R2 (local voice also counts on city pages), after R5 and R6 | **delete sentence** | as R3 |
| **R5** | `pp_pools.ai_faqs`, `pp_cities.ai_faqs` | an entry whose answer is entirely non-informative (section 4) | **delete FAQ entry** (remaining entries keep their order and keys) | the question or answer mentions insurance; every entry of the row would go |
| **R6** | `pp_cities.ai_intro`, `pp_cities.ai_faqs[*].a` | a sentence stating a directory pool count that differs from the page's published count (category `auto`, section 3) | **delete sentence** (the number is never rewritten) | insurance; the field checks of R2; `review_*`, `hold_duplicate` and `vague` statements are never automatic. They are listed in section 3 for the owner |

Each sentence rule is a separate **pass**, checked on the text the previous pass left. A pass that would break
the field is skipped as a whole and reported; it does not block the other passes (R6 still applies when R4 is
skipped). Any apply step written later must guard every change with the exact old value (or its md5) of every
field it changes: a row that changed after the snapshot is skipped and logged, never overwritten.

**R1 or a renderer fix.** R1 makes the stored value plain text. If the captured pp-ssr source can render the
array as a list, fixing the renderer is the better change, and then R1 should not be applied (or only after the
renderer accepts plain text too).

## 6. Out-of-scope shapes, with counts

| Shape | Count | Why not automatic |
|---|---|---|
| Narrator sentence + a number (price, rating, population, hours) | S2: 1,656 sentences | deleting would remove a fact |
| Narrator sentence + amenity / rating / type / price / schedule word | S2: 825 | same |
| Narrator sentence with a second clause or comma splice | S2: 1,557 | the other clause usually asserts something |
| Narrator sentence with a URL / phone | S2: 42 | contact details are facts |
| Narrator sentence that opens with the answer ("Yes, I'd say ...") | S2: 38 | it is the answer |
| Local voice on pool pages | S2: 10 | conservative |
| Sentences about insurance/liability/coverage/claims/damage in narrator voice | S2: 31 sentences; fields frozen: 31 | never touched (CLAUDE.md rule 8) |
| Deletable sentences in fields skipped by the field checks | S2: see 2.3 (R2 201, R3 239, R4 75, R6 5 fields) | deleting would leave a sentence pointing at nothing |
| Wrong count + another claim / sub-type / no directory word / duplicate / vague | S2: review_mixed 12, review_subtype 2, review_scope 9, hold_duplicate 1, vague 23 | owner decision (section 3) |
| Site-voice marketplace claims ("We list backyard pools in Miami that you can rent by the hour", "plus lots of backyard pools available") | not counted | not narrator; a marketplace-inventory claim can only be checked against live listings |
| Invented biography mixed with a fact ("Back when I was first swimming in Brooklyn, ... Labor Day") | inside the counts above | mixed |
| Factual errors inside kept sentences (e.g. a description says "4.8 out of 5 stars from over 300 reviews" where the row holds 3.8 / 625) | not measured | outside this task; no rule may rewrite a number |
| Data typos ("openMemorial Day") | not measured | no rule edits inside a sentence |
| `ai_tips` narrator sentences | S1: 53 sentences in 52 rows | column is not rendered |
| FAQ questions in the reader's voice ("I could consider") | S1: 188 pool rows, 396 city rows | not a narrator; questions are never touched |

## 7. Examples (10 per rule, made by hand)

All 60 are in `text-defects/examples.json` and pass `python3 -I text_defect_rules.py test`. "Before" is
real text: the S1 row of 2026-11-15, or the S2 live text of 2026-11-16, which renders the same field. "After" was
written by hand by removing whole sentences, independently of the cleaner. Where the conservative checks
keep text that a person would delete, the example records the skip; those cases are reported, never forced.

### R1

**R1.1** live pool page /public-pools/north-carolina/apex/apex-aquatic-center/ (live page fetched 2026-11-16T19:45:32Z (rendered pp_pools.ai_best_for, printed verbatim after 'Best for:')).


Before:
> ["families", "lap swimmers", "fitness swimmers", "year-round swimming"]

After:
> families, lap swimmers, fitness swimmers, year-round swimming

Elements joined with ', ' in original order and spelling.

**R1.2** live pool page /public-pools/new-york/bronx/kwame-ture-recreation-center/ (live page fetched 2026-11-16T19:45:45Z (rendered pp_pools.ai_best_for, printed verbatim after 'Best for:')).


Before:
> ["families", "casual recreation", "lap swimmers", "year-round swimming"]

After:
> families, casual recreation, lap swimmers, year-round swimming

Elements joined with ', ' in original order and spelling.

**R1.3** live pool page /public-pools/california/san-diego/north-park-recreation-center/ (live page fetched 2026-11-16T19:52:57Z (rendered pp_pools.ai_best_for, printed verbatim after 'Best for:')).


Before:
> ["families", "casual recreation", "lap swimmers", "fitness swimmers"]

After:
> families, casual recreation, lap swimmers, fitness swimmers

Elements joined with ', ' in original order and spelling.

**R1.4** live pool page /public-pools/california/san-diego/city-heights-swim-center/ (live page fetched 2026-11-16T19:52:59Z (rendered pp_pools.ai_best_for, printed verbatim after 'Best for:')).


Before:
> ["families", "lap swimmers", "casual recreation", "summer cooldown"]

After:
> families, lap swimmers, casual recreation, summer cooldown

Elements joined with ', ' in original order and spelling.

**R1.5** live pool page /public-pools/california/san-diego/ymca-childcare-resource-service/ (live page fetched 2026-11-16T19:52:33Z (rendered pp_pools.ai_best_for, printed verbatim after 'Best for:')).


Before:
> ["families"]

After:
> families

Elements joined with ', ' in original order and spelling.

**R1.6** live pool page /public-pools/texas/austin/garrison-municipal-pool/ (live page fetched 2026-11-16T19:44:18Z (rendered pp_pools.ai_best_for, printed verbatim after 'Best for:')).


Before:
> ["families", "casual recreation", "summer cooldown"]

After:
> families, casual recreation, summer cooldown

Elements joined with ', ' in original order and spelling.

**R1.7** live pool page /public-pools/illinois/chicago/chicago-park-district-whitney-young-pool-indoor/ (live page fetched 2026-11-16T19:52:55Z (rendered pp_pools.ai_best_for, printed verbatim after 'Best for:')).


Before:
> ["lap swimmers", "fitness swimmers", "year-round swimming"]

After:
> lap swimmers, fitness swimmers, year-round swimming

Elements joined with ', ' in original order and spelling.

**R1.8** live pool page /public-pools/texas/dallas/bryan-place-swimming-pool-association/ (live page fetched 2026-11-16T19:47:36Z (rendered pp_pools.ai_best_for, printed verbatim after 'Best for:')).


Before:
> ["casual recreation", "lap swimmers", "fitness swimmers", "summer cooldown"]

After:
> casual recreation, lap swimmers, fitness swimmers, summer cooldown

Elements joined with ', ' in original order and spelling.

**R1.9** live pool page /public-pools/virginia/hampton/hampton-community-pool/ (live page fetched 2026-11-16T19:48:40Z (rendered pp_pools.ai_best_for, printed verbatim after 'Best for:')).


Before:
> ["families", "lap swimmers", "toddlers", "casual recreation", "summer cooldown"]

After:
> families, lap swimmers, toddlers, casual recreation, summer cooldown

Elements joined with ', ' in original order and spelling.

**R1.10** live pool page /public-pools/california/los-angeles/ymca-of-metropolitan-los-angeles-corporate-office/ (live page fetched 2026-11-16T19:44:16Z).


Before:
> []

After:
> (unchanged)  (skip: `empty_list`)

Empty array: joining would print an empty 'Best for:' line, so the row is skipped and reported (renderer should hide the line).

### R2

**R2.1** pp_pools 4792a27a (Roxborough YMCA) (pp_pools / pp_cities read-only extract 2026-11-15 (r21 21:30Z)).


Before:
> With a 4.5 star rating from over 450 reviews, the Roxborough YMCA seems like a solid choice for a swim in Philly. It's a public pool up on Ridge Ave, and it's open pretty early during the week, 5 AM, which is great if you like to get your laps in before work. They stay open until 9 PM most nights too. Weekends are a bit shorter, 7 AM to 6 PM, but that's still a good chunk of time. In a city the size of Philadelphia, with well over a million people, having reliable public options like this is really important. My guess is it gets pretty busy sometimes, considering the population. If you're looking for a place to swim, I'd definitely check out their website or give them a call first, just to make sure it fits what you're looking for.

After:
> With a 4.5 star rating from over 450 reviews, the Roxborough YMCA seems like a solid choice for a swim in Philly. It's a public pool up on Ridge Ave, and it's open pretty early during the week, 5 AM, which is great if you like to get your laps in before work. They stay open until 9 PM most nights too. Weekends are a bit shorter, 7 AM to 6 PM, but that's still a good chunk of time. In a city the size of Philadelphia, with well over a million people, having reliable public options like this is really important. If you're looking for a place to swim, I'd definitely check out their website or give them a call first, just to make sure it fits what you're looking for.

Narrator guess with no fact. The last sentence (advice + ', just to make sure') is kept: second clause.

**R2.2** pp_pools e993db93 (Milam Pool) (pp_pools / pp_cities read-only extract 2026-11-15 (r21)).


Before:
> It's always nice to find an outdoor pool, especially in a city like Atlanta where the summers get pretty hot. Milam Pool is a good spot for when you just need to cool off or get some laps in outside. I've seen a lot of these community pools over the years, and they usually offer a decent setup for everyday swimming. What I like about outdoor spots is that natural sunlight. It just feels different than being indoors, you know? For Atlanta, having an outdoor option like Milam Pool is a real plus for the warmer months. It's the kind of place you can probably count on for a straightforward swim without too much fuss. Just a solid community pool. That's my read on it, anyway.

After:
> It's always nice to find an outdoor pool, especially in a city like Atlanta where the summers get pretty hot. Milam Pool is a good spot for when you just need to cool off or get some laps in outside. I've seen a lot of these community pools over the years, and they usually offer a decent setup for everyday swimming. What I like about outdoor spots is that natural sunlight. It just feels different than being indoors, you know? For Atlanta, having an outdoor option like Milam Pool is a real plus for the warmer months. It's the kind of place you can probably count on for a straightforward swim without too much fuss. Just a solid community pool.

Closing narrator aside deleted. 'I've seen a lot of these community pools ...' (second clause) and 'What I like about outdoor spots ...' (fact word 'outdoor') are kept.

**R2.3** pp_pools fa9953f4 (San Pedro Springs Pool) (pp_pools / pp_cities read-only extract 2026-11-15 (r21)).


Before:
> San Pedro Springs Pool in San Antonio is one of those spots that just draws people in. It's not every day you find a spring-fed pool, especially one with free admission right in the city. The fact that it's historical adds to it, makes you feel like you're swimming in a place with some real roots. With a 4.5-star rating from over 1800 reviews, you know a lot of folks like it there. They've got lifeguards, which is always good, and plenty of shade trees around. Parking is usually available too, from what I've heard. It's a nice option for cooling off when you're in San Antonio and don't want to spend a lot. I always appreciate a pool that keeps things simple and focuses on the swimming.

After:
> San Pedro Springs Pool in San Antonio is one of those spots that just draws people in. It's not every day you find a spring-fed pool, especially one with free admission right in the city. The fact that it's historical adds to it, makes you feel like you're swimming in a place with some real roots. With a 4.5-star rating from over 1800 reviews, you know a lot of folks like it there. They've got lifeguards, which is always good, and plenty of shade trees around. Parking is usually available too, from what I've heard. It's a nice option for cooling off when you're in San Antonio and don't want to spend a lot.

Narrator preference deleted; 'Parking is usually available too, from what I've heard.' is kept (fact word 'parking').

**R2.4** pp_pools b2398c (Goodman Pool) (pp_pools / pp_cities read-only extract 2026-11-15 (r34)).


Before:
> Honestly, 342 reviews averaging 4.5 out of 5, that's pretty solid for a public pool. I've seen bigger cities struggle to get those numbers. Goodman pool in Madison, WI looks like a good spot. They've got the zero-depth entry, which is great for little kids or anyone who just wants to ease in. Plus, water slides and a diving board adds some fun for older kids, or, well, adults like me. The fact that they offer swim lessons and free sunscreen also tells me they're thinking about the community. And according to my notes, the daily rates are really affordable, which is always a bonus when you're just looking for a cool-down on a hot day.

After:
> Honestly, 342 reviews averaging 4.5 out of 5, that's pretty solid for a public pool. Goodman pool in Madison, WI looks like a good spot. They've got the zero-depth entry, which is great for little kids or anyone who just wants to ease in. Plus, water slides and a diving board adds some fun for older kids, or, well, adults like me. The fact that they offer swim lessons and free sunscreen also tells me they're thinking about the community. And according to my notes, the daily rates are really affordable, which is always a bonus when you're just looking for a cool-down on a hot day.

Only the pure narrator aside goes. 'adults like me', 'tells me ... swim lessons', 'according to my notes, the daily rates' all carry facts and stay.

**R2.5** pp_pools 03e38d (Hidden River) (pp_pools / pp_cities read-only extract 2026-11-15 (r35)).


Before:
> It's interesting how many clothing-optional spots have sprung up. Hidden River there in Old Miakka is one of them. For some people, that's exactly what they're looking for, a place to really relax. For others, it's a non-starter. I get that. Honestly, it's good to know upfront what kind of vibe a place has, especially when it's a private club or less traditional spot. This one's definitely in Florida, that much I can tell you. If you're into the clothing-optional scene and you're in the Old Miakka area, it's probably one of your local options. Always good to call ahead, though, no matter what kind of pool you're checking out. You never want to drive all the way there and find out it's closed or has unexpected rules.

After:
> (unchanged)  (skip: `next_sentence_refers_back`)

By hand 'I get that.' is pure filler, but the next kept sentence 'Honestly, it's good to know ...' matches the '<Word>, it's' back-reference form, so the rule skips the row (a deliberate over-skip: the opener pattern errs toward keeping text). Reported, unchanged.

**R2.6** pp_pools 77672b (Robert Livermore Community Center) (pp_pools / pp_cities read-only extract 2026-11-15 (r35)).


Before:
> If you're looking for an outdoor pool in Livermore, the Robert Livermore Community Center often comes up. They've got a competition pool, which is good if you're serious about your laps. My stats show they also have water slides and a kids pool, so it's not just for training. With a 4.2 out of 5 stars from over a hundred Google reviews, most people seem to like it. Day passes are pretty reasonable too, five bucks for adults and three for youth. They even offer swim lessons. I'd say it's a solid choice for a summer afternoon with the family, or if you just want to get some dedicated swimming in. They've got locker rooms, making it convenient.

After:
> (unchanged)  (skip: `next_sentence_refers_back`)

By hand the opinion could go, but the next kept sentence starts with 'They've' (points back), so the rule must SKIP the row and report it.

**R2.7** pp_pools d80140 (Conroe Family Aquatic Center) (pp_pools / pp_cities read-only extract 2026-11-15 (r35)).


Before:
> You know, finding a good public pool that doesn't cost an arm and a leg is getting harder these days, especially with some of the prices I see. But I gotta say, Conroe's got it right with their Family Aquatic Center. Two hundred eighty-one reviews on Google, and it's still pulling a 4.6 out of 5. That tells me a lot. It’s an outdoor spot, which is perfect for those hot Texas days. And what really stands out to me? It’s completely free for both adults and kids. You don't see that very often anymore. They've got shade structures, which is smart, a diving board, and even lap lanes if you're trying to get some swimming in. Plus, a picnic area is always a nice touch for families. For a city of almost 100,000, having a free community spot like this is a big deal, and honestly, it’s probably a lifesaver in the summer.

After:
> (unchanged)  (skip: `next_sentence_refers_back`)

'That tells me a lot.' is filler, but the next sentence 'It's an outdoor spot ...' opens with It's: row skipped and reported.

**R2.8** pp_pools 1cda4e (Piccadilly Swimming Pool) (pp_pools / pp_cities read-only extract 2026-11-15 (r34)).


Before:
> It's an outdoor pool, which honestly, is what most people are looking for when the weather warms up. Nashville's a big city, over 600,000 people, so a place like Piccadilly Swimming Pool definitely helps out when you're trying to cool off. I've been in this business a long time, connecting people with swim spots, and outdoor pools are always a hit in a city that size. It's not a heated indoor place for year-round laps, it's more for those hot summer days when you just need to get wet. You know, that classic summer pool feeling.

After:
> (unchanged)

OUT OF SCOPE shape: invented founder voice mixed with a claim ('I've been in this business a long time, connecting people with swim spots, and outdoor pools are always a hit ...'). Fact vocabulary present, so never automatic; listed for the owner.

**R2.9** pp_pools 020331 (Rancho Family YMCA) (pp_pools / pp_cities read-only extract 2026-11-15 (r34)).


Before:
> Eight and a half on weekdays, eight on Saturdays, and then just four hours on Sunday. That's a pretty strong set of hours for a public pool, especially out here in San Diego with a city population of over a million. It's the Rancho Family YMCA, and like most YMCAs, it's open to the public for swimming, usually with a day pass. Google reviews put it at 3.8 stars from 109 people, which is decent. I always tell people, if you're looking for a reliably good spot for laps or just to cool off, a Y is a safe bet. They usually have good facilities, and this one runs pretty late during the week, which is a plus.

After:
> (unchanged)

OUT OF SCOPE shape: 'I always tell people, if you're looking for a reliably good spot for laps ..., a Y is a safe bet.' mixes narrator advice with a fact word (laps); the next sentence's 'They' depends on it. No change.

**R2.10** pp_pools 0106c0 (Selena Swimming Pool) (pp_pools / pp_cities read-only extract 2026-11-15 (r34)).


Before:
> Honestly, 35 reviews and a 3.9 out of 5, that tells you something. It's not the biggest pool, but it gets the job done for a public spot in Houston. Selena Swimming Pool is part of the city parks system. So it's probably pretty basic, no frills, but usually well-maintained. They're only open a few days a week, mostly afternoons, so you need to plan ahead. Wednesdays, Fridays, and Sundays are your only options there. Call (713) 673-7140 before you head out, especially since the hours are so limited. It's at 1020 Gazin St. with a population of over two million in Houston, a public pool like this is definitely an option for people to cool off.

After:
> (unchanged)

Control: 'Honestly, ...' alone is not a narrator marker; no first-person sentence, nothing changes.

### R3

**R3.1** pp_pools jamaica-ymca ai_faqs[2].a (pp_pools / pp_cities read-only extract 2026-11-15 (r12)).


Before:
> My data doesn't include specific pricing for pool access. Membership often includes pool use, or there might be day passes. Your best bet is to call the Jamaica YMCA directly at (718) 739-6600 for current rates.

After:
> Membership often includes pool use, or there might be day passes. Your best bet is to call the Jamaica YMCA directly at (718) 739-6600 for current rates.

Data-gap sentence deleted; the referral with the phone number stays (contact fact).

**R3.2** pp_pools santa-clara-swim-center ai_faqs[2].a (pp_pools / pp_cities read-only extract 2026-11-15 (r12)).


Before:
> They do offer swim lessons, which is great for kids. Since it's a competition pool, it's designed more for serious swimmers, but the warm-up pool might be good for general family use. I'd call them to ask about family swim times.

After:
> They do offer swim lessons, which is great for kids. Since it's a competition pool, it's designed more for serious swimmers, but the warm-up pool might be good for general family use.

Trailing narrator referral deleted; lessons/competition-pool facts stay.

**R3.3** pp_pools evergreen-and-elaine-wood-therapy-pool-complex ai_faqs[2].a (pp_pools / pp_cities read-only extract 2026-11-15 (r12)).


Before:
> Given it's a 'therapy pool complex,' it might not be ideal for general family recreation or splashing around. I'd lean towards calling them to ask about specific kid-friendly features or if there are dedicated family swim times before you make the trip.

After:
> Given it's a 'therapy pool complex,' it might not be ideal for general family recreation or splashing around.

Narrator referral deleted; the first sentence (the actual answer) stays.

**R3.4** pp_pools miami-beach-aquatic-center ai_faqs[3].a (pp_pools / pp_cities read-only extract 2026-11-15 (r12)).


Before:
> Yes, it's a city of almost 83,000 residents in a warm climate, so it's likely they have other public swimming facilities. I'd check the City of Miami Beach's Parks and Recreation website for a full list.

After:
> Yes, it's a city of almost 83,000 residents in a warm climate, so it's likely they have other public swimming facilities.

Last-sentence referral deleted.

**R3.5** pp_pools gardena-carson-family-ymca ai_faqs[2].a (pp_pools / pp_cities read-only extract 2026-11-15 (r12)).


Before:
> Yes, as a Family YMCA, it's generally designed to be family-friendly and usually offers programs for kids. For specific classes or family swim times, I'd suggest calling them directly.

After:
> Yes, as a Family YMCA, it's generally designed to be family-friendly and usually offers programs for kids.

Lead-in + narrator referral is one deletable sentence (SPLICE_OK).

**R3.6** pp_pools sterling-aquatic-center ai_faqs[2].a (pp_pools / pp_cities read-only extract 2026-11-15 (r12)).


Before:
> Parking can sometimes be tough at popular outdoor pools, especially on busy summer days. I'd plan to arrive early or go during off-peak times if you're worried about finding a spot.

After:
> Parking can sometimes be tough at popular outdoor pools, especially on busy summer days.

Narrator advice deleted; the general parking sentence (no narrator) stays.

**R3.7** pp_pools los-banos-del-mar-pool ai_faqs[4].a (pp_pools / pp_cities read-only extract 2026-11-15 (r12)).


Before:
> Santa Barbara has a population of around 88,000, so it's likely there are other options. I'd check the Santa Barbara recreation department's website or give them a call to see what else is available in the area.

After:
> Santa Barbara has a population of around 88,000, so it's likely there are other options.

Referral deleted; population sentence stays.

**R3.8** pp_pools east-pool ai_faqs[1].a (pp_pools / pp_cities read-only extract 2026-11-15 (r12)).


Before:
> Admission fees aren't something I have on hand. Public pools usually have a daily rate or a pass option. You should contact the City of Laredo Parks Department for pricing details.

After:
> Public pools usually have a daily rate or a pass option. You should contact the City of Laredo Parks Department for pricing details.

Gap sentence deleted; the remaining two sentences stand alone (answer is NOT R5: 'Public pools usually have a daily rate ...' is a general statement).

**R3.9** pp_pools downers-grove-aquatic-center ai_faqs[3].a (pp_pools / pp_cities read-only extract 2026-11-15 (r12)).


Before:
> Downers Grove is a decent-sized town, almost 50,000 people. I'd imagine the Downers Grove Park District likely operates other aquatic facilities. A quick search on their website should give you a full list of local options.

After:
> (unchanged)  (skip: `deleted_sentence_names_an_entity`)

The deleted sentence names 'Park District' and the next sentence's 'their website' refers to it: row skipped and reported.

**R3.10** pp_pools sava-pool ai_faqs[2].a (pp_pools / pp_cities read-only extract 2026-11-15 (r12)).


Before:
> San Francisco is a big city with a good number of public facilities. If Sava Pool doesn't fit your needs or schedule, I'd suggest checking the overall San Francisco Recreation & Park Department website. They usually list all their aquatic facilities there.

After:
> (unchanged)  (skip: `next_sentence_refers_back`)

Next sentence 'They usually list all their aquatic facilities there.' points back: row skipped and reported.

### R4

**R4.1** pp_cities d93877 (Murray) ai_intro (pp_pools / pp_cities read-only extract 2026-11-15 (r32)).


Before:
> Murray gets hot in the summer, real hot. So folks are always looking for a good place to cool off. Pool season really kicks in around June when the outdoor spots open, and it runs through August. It's mostly a family-friendly swim scene here, especially at the public pools. You'll see a lot of kids splashing around, but there are dedicated lap lanes too for those who want to get some exercise. If you're new to the area and looking for a place to swim, the public options are solid. They're usually well-maintained and pretty affordable. Just be prepared for crowds on those super hot days, especially on weekends. We've got a decent selection for a town this size, so you'll definitely find somewhere to take a dip.

After:
> Murray gets hot in the summer, real hot. So folks are always looking for a good place to cool off. Pool season really kicks in around June when the outdoor spots open, and it runs through August. It's mostly a family-friendly swim scene here, especially at the public pools. You'll see a lot of kids splashing around, but there are dedicated lap lanes too for those who want to get some exercise. If you're new to the area and looking for a place to swim, the public options are solid. They're usually well-maintained and pretty affordable. Just be prepared for crowds on those super hot days, especially on weekends.

Narrator inventory claim with no number deleted (last sentence).

**R4.2** pp_cities 0a8ffa (Omaha) ai_intro (pp_pools / pp_cities read-only extract 2026-11-15 (r33)).


Before:
> Summer in this part of Nebraska gets hot, real hot. When the sun bakes down, people here are looking for water, and pools are a big part of that. Our pool season runs pretty standard, usually Memorial Day to Labor Day for most outdoor spots. We see a lot of families at the public pools. Folks bring their kids to cool off and splash around. For someone new to Omaha, finding a pool is pretty straightforward. The city runs several good ones. If you're looking for something more private, or just a different vibe than a crowded public spot, that's where PoolRentalNearMe.com comes in. We've got options for booking backyard pools by the hour, which can be a game changer.

After:
> Summer in this part of Nebraska gets hot, real hot. Our pool season runs pretty standard, usually Memorial Day to Labor Day for most outdoor spots. Folks bring their kids to cool off and splash around. For someone new to Omaha, finding a pool is pretty straightforward. The city runs several good ones. If you're looking for something more private, or just a different vibe than a crowded public spot, that's where PoolRentalNearMe.com comes in. We've got options for booking backyard pools by the hour, which can be a game changer.

Two local-voice opinions deleted. 'Our pool season runs ... Memorial Day to Labor Day' stays (schedule fact); 'We've got options for booking backyard pools ..., which ...' stays (second clause; listed as out of scope).

**R4.3** pp_cities 38ac20 (Richmond) ai_intro (pp_pools / pp_cities read-only extract 2026-11-15 (r33)).


Before:
> When the summer sun hits in Richmond, people are definitely looking for a place to cool off. The heat can really stick around here, sometimes into October, so our pool season feels pretty long. We've got a mixed swim scene, a bit of everything. You'll see serious lap swimmers getting their workouts in early, but by midday, it usually shifts to more families and open swim. Kids love splashing around, and it's a popular way for everyone to beat the heat. If you're new to the area and just trying to find a good spot to swim, the Richmond Plunge is usually the first place folks think of. It's an indoor pool, so it's a solid option year-round, which is great to have. It's one of the main go-to options for public swimming here.

After:
> When the summer sun hits in Richmond, people are definitely looking for a place to cool off. The heat can really stick around here, sometimes into October, so our pool season feels pretty long. You'll see serious lap swimmers getting their workouts in early, but by midday, it usually shifts to more families and open swim. Kids love splashing around, and it's a popular way for everyone to beat the heat. If you're new to the area and just trying to find a good spot to swim, the Richmond Plunge is usually the first place folks think of. It's an indoor pool, so it's a solid option year-round, which is great to have. It's one of the main go-to options for public swimming here.

Narrator generality deleted; 'The heat can really stick around here, sometimes into October, so our pool season ...' stays (schedule word + clause).

**R4.4** pp_cities 66fe02 (Calistoga) ai_intro (pp_pools / pp_cities read-only extract 2026-11-15 (r33)).


Before:
> Calistoga summers? They get hot, real hot. When the valley heats up, everyone around here thinks about a good soak to cool down. We're talking late spring through early fall for prime pool time, usually May to October. The swim scene here is pretty laid back, mostly focused on families and folks just wanting to relax, not a lot of competitive lap swimmers. If you're new to the area and looking for a place to swim, your options are a bit limited to public access at resorts or private rentals. There aren't many standalone public pools like you might find in bigger cities. Just find a spot to jump in and enjoy the Calistoga sunshine.

After:
> Calistoga summers? They get hot, real hot. We're talking late spring through early fall for prime pool time, usually May to October. The swim scene here is pretty laid back, mostly focused on families and folks just wanting to relax, not a lot of competitive lap swimmers. If you're new to the area and looking for a place to swim, your options are a bit limited to public access at resorts or private rentals. There aren't many standalone public pools like you might find in bigger cities. Just find a spot to jump in and enjoy the Calistoga sunshine.

Local-voice filler deleted; the next sentence ('We're talking ... May to October') is kept because it carries a schedule.

**R4.5** pp_cities d5a0cd47 (Fort Myers) ai_intro (pp_pools / pp_cities read-only extract 2026-11-15 (r21)).


Before:
> Down here in Florida, especially in Fort Myers, swimming's pretty much a year round thing. We don't really have an "off season" for pools like they do up north. Most folks are looking for a good outdoor pool to cool off in. It gets hot, so you'll see a lot of families just trying to beat the heat, and plenty of people getting their laps in early before the sun really bakes everything. If you're new to the area, the main thing to remember is that most public pools are set up for both. You'll find lap lanes and open swim areas. Sometimes it just comes down to checking their schedules online to see when it's freest up for what you want to do. It's not usually hard to find a spot to swim.

After:
> Down here in Florida, especially in Fort Myers, swimming's pretty much a year round thing. Most folks are looking for a good outdoor pool to cool off in. It gets hot, so you'll see a lot of families just trying to beat the heat, and plenty of people getting their laps in early before the sun really bakes everything. If you're new to the area, the main thing to remember is that most public pools are set up for both. You'll find lap lanes and open swim areas. Sometimes it just comes down to checking their schedules online to see when it's freest up for what you want to do. It's not usually hard to find a spot to swim.

Narrator 'we' claim deleted. The opening 'Down here in Florida, especially in Fort Myers, swimming's pretty much a year round thing.' is local voice too, but carries 'year round' (schedule) and is kept.

**R4.6** pp_cities da4afae5 (Denver) ai_intro (pp_pools / pp_cities read-only extract 2026-11-15 (r21)).


Before:
> Look, summers here in Denver can get pretty hot and dry. When the sun's really beating down, there's nothing better than cooling off with a swim. Our pool season typically kicks off in late May, usually around Memorial Day, and runs through Labor Day in early September. You'll see a mix of swimmers. Lots of families hitting the public pools, especially on weekends, but you also have your lap swimmers getting their workouts in during cooler morning hours. Anyone new to town, or even if you've been here a while, should know that public pool access can vary. Some spots get crowded fast, so timing your visit is key if you want some dedicated swim time. Sometimes private rentals are an easier way to go.

After:
> When the sun's really beating down, there's nothing better than cooling off with a swim. Our pool season typically kicks off in late May, usually around Memorial Day, and runs through Labor Day in early September. You'll see a mix of swimmers. Lots of families hitting the public pools, especially on weekends, but you also have your lap swimmers getting their workouts in during cooler morning hours. Anyone new to town, or even if you've been here a while, should know that public pool access can vary. Some spots get crowded fast, so timing your visit is key if you want some dedicated swim time. Sometimes private rentals are an easier way to go.

Opening local-voice weather remark deleted; 'Our pool season typically kicks off in late May ...' stays (schedule).

**R4.7** pp_cities b41809e4 ai_faqs[1].a (pp_pools / pp_cities read-only extract 2026-11-15 (r21)).


Before:
> You can swim year-round here if the pool is heated. Most public and private pools keep their water warm enough for comfortable swimming even in cooler months. Summer is when you'll see the most activity, but dedicated swimmers are in the water all year. We don't really shut down for winter.

After:
> You can swim year-round here if the pool is heated. Most public and private pools keep their water warm enough for comfortable swimming even in cooler months. Summer is when you'll see the most activity, but dedicated swimmers are in the water all year.

Narrator closing line of a city FAQ answer deleted; the three factual-sounding sentences stay.

**R4.8** live city page /public-pools/california/coronado/ (ai_faqs[] indoor question) (live page fetched 2026-11-16T19:36:35Z).


Before:
> Most of the pools here are outdoors, taking advantage of the great weather. I'm not aware of any dedicated indoor municipal swimming pools. The mild climate makes outdoor swimming comfortable almost any day of the year.

After:
> Most of the pools here are outdoors, taking advantage of the great weather. The mild climate makes outdoor swimming comfortable almost any day of the year.

Narrator data-gap sentence deleted; the two general sentences stay.

**R4.9** live city page /public-pools/indiana/fishers/ (ai_faqs[] indoor/outdoor question) (live page fetched 2026-11-16T19:36:13Z).


Before:
> We have a good mix. During the summer, most people want outdoor pools to enjoy the sun. But there are several indoor aquatic centers that operate year-round. These are key for swim teams, lessons, and those who want to swim regardless of the weather outside.

After:
> During the summer, most people want outdoor pools to enjoy the sun. But there are several indoor aquatic centers that operate year-round. These are key for swim teams, lessons, and those who want to swim regardless of the weather outside.

Narrator 'we' opener deleted; the answer continues with its own content.

**R4.10** live city page /public-pools/florida/miami/ (ai_intro) (live page fetched 2026-11-16T19:39:45Z).


Before:
> Miami. Even in January, you can pretty much count on being able to get in the water. We locals spend a lot of time by the water, and pools are a big part of that. It's year-round pool weather here. Our public pools are usually outdoors, so you get that sunny, open-air swim whenever you want. You'll find a mix of serious lap swimmers, families, and people just cooling off. If you're new to the area, the best way to find a pool is to check out our online directory. You can filter by what you need, like specific facilities or hours. It makes it easy to see what's close and open.

After:
> (unchanged)  (skip: `next_sentence_refers_back`)

By hand 'We locals spend a lot of time by the water, and pools are a big part of that.' is filler, but the next sentence 'It's year-round pool weather here.' starts with It's: row skipped and reported.

### R5

**R5.1** live pool page /public-pools/tennessee/knoxville/knoxville-community-pool/ (live page fetched 2026-11-16T19:44:02Z (rendered pp_pools.ai_faqs entry; also in FAQPage JSON-LD)).

> Q: What are the hours of the Knoxville Community Pool?
>
> A: Their operating hours aren't something I have on hand. Your best bet is to check the Knoxville Parks and Recreation website or just give the pool a call directly before you plan your visit.

Hand verdict: **delete_entry**. Every sentence is a narrator data-gap or a referral with no number, URL or second clause: the whole entry goes.

**R5.2** live pool page /public-pools/nevada/sparks/sparks-community-pool/ (live page fetched 2026-11-16T19:46:46Z (rendered pp_pools.ai_faqs entry; also in FAQPage JSON-LD)).

> Q: Is Sparks Community Pool accessible for people with disabilities?
>
> A: The information I have doesn't specify accessibility features. I'd recommend contacting the pool directly or checking the City of Sparks Parks and Recreation website for details on ramps, lifts, or other accommodations.

Hand verdict: **delete_entry**. Every sentence is a narrator data-gap or a referral with no number, URL or second clause: the whole entry goes.

**R5.3** live pool page /public-pools/minnesota/lakeville/lakeville-municipal-pool/ (live page fetched 2026-11-16T19:47:01Z (rendered pp_pools.ai_faqs entry; also in FAQPage JSON-LD)).

> Q: Are there any other public pools in Lakeville I could consider?
>
> A: I only have information on the Lakeville Municipal Pool right now. For other options, I'd check the Lakeville city website or do a quick search for "public pools Lakeville MN" to see if there are others.

Hand verdict: **delete_entry**. Every sentence is a narrator data-gap or a referral with no number, URL or second clause: the whole entry goes.

**R5.4** live pool page /public-pools/california/san-mateo/san-mateo-swim-center/ (live page fetched 2026-11-16T19:49:04Z (rendered pp_pools.ai_faqs entry; also in FAQPage JSON-LD)).

> Q: Are there other public pools in San Mateo?
>
> A: I only have data for the San Mateo Swim Center right now. I'd suggest checking the City of San Mateo parks and recreation website for information on other public swimming facilities in the area.

Hand verdict: **delete_entry**. Every sentence is a narrator data-gap or a referral with no number, URL or second clause: the whole entry goes.

**R5.5** live pool page /public-pools/california/diamond-bar/pantera-park-pool/ (live page fetched 2026-11-16T19:50:20Z (rendered pp_pools.ai_faqs entry; also in FAQPage JSON-LD)).

> Q: Are there other pools in Diamond Bar, CA, if this one doesn't work out?
>
> A: I only have information for Pantera Park Pool right now. For other options in Diamond Bar, I'd suggest checking the city's parks and recreation website or calling the general information line.

Hand verdict: **delete_entry**. Every sentence is a narrator data-gap or a referral with no number, URL or second clause: the whole entry goes.

**R5.6** live pool page /public-pools/california/mountain-view/rengstorff-pool/ (live page fetched 2026-11-16T19:50:29Z (rendered pp_pools.ai_faqs entry; also in FAQPage JSON-LD)).

> Q: Are there other public pools in Mountain View CA?
>
> A: The data I have is specifically for Rengstorff Pool. For other options in Mountain View, your best bet is probably to check the City of Mountain View's parks and recreation website or call their community services department.

Hand verdict: **delete_entry**. Every sentence is a narrator data-gap or a referral with no number, URL or second clause: the whole entry goes.

**R5.7** live pool page /public-pools/texas/sugar-land/sugar-land-community-pool/ (live page fetched 2026-11-16T19:51:09Z (rendered pp_pools.ai_faqs entry; also in FAQPage JSON-LD)).

> Q: Are there other indoor pools in Sugar Land besides this one?
>
> A: I only have information on the Sugar Land Community Pool for this search. You might find other options if you look at local gyms or other community centers in the area.

Hand verdict: **delete_entry**. Every sentence is a narrator data-gap or a referral with no number, URL or second clause: the whole entry goes.

**R5.8** pp_pools east-pool ai_faqs[1] (pp_pools read-only extract 2026-11-15 (r12)).

> Q: How much does it cost to get into East Pool?
>
> A: Admission fees aren't something I have on hand. Public pools usually have a daily rate or a pass option. You should contact the City of Laredo Parks Department for pricing details.

Hand verdict: **keep_entry**. Near miss: 'Public pools usually have a daily rate or a pass option.' is a general statement, not a referral or data gap, so the entry stays (R3 deletes only the gap sentence).

**R5.9** pp_pools freedom-aquatics ai_faqs[2] (pp_pools read-only extract 2026-11-15 (r12)).

> Q: How much does it cost to swim at Freedom Aquatics?
>
> A: The information I have doesn't include specific pricing for Freedom Aquatics. Since it's a public pool, it's best to call them directly at (917) 979-5559 to ask about daily rates or membership options.

Hand verdict: **keep_entry**. Near miss: the referral carries a phone number, which is a fact; the entry stays.

**R5.10** live city page /public-pools/delaware/wilmington/ ai_faqs[5] (live page fetched 2026-11-16T19:38:55Z).

> Q: What if I want a private pool experience without a club membership?
>
> A: That's exactly what we help with at PoolRentalNearMe.com. You can rent private backyard pools by the hour in and around Wilmington. It's a great option if you want a more private setting, no crowds, or just a different vibe for your swim.

Hand verdict: **keep_entry**. Site voice ('That's exactly what we help with at PoolRentalNearMe.com') is not an invented narrator: kept.

### R6

**R6.1** live city page /public-pools/california/sacramento/ (ai_intro) (live page fetched 2026-11-16T19:39:38Z (rendered pp_cities.ai_intro)).
 Page count: 22.


Before:
> Summer in Sacramento can be a real oven, so pools aren't just for fun, they're essential. You'll find a pretty laid-back swimming culture here, mostly families and folks just trying to cool off. When the temperatures start climbing in May, that's when everyone really starts thinking about getting in the water. Most public pools openMemorial Day weekend and stay open through Labor Day. It's not a big lap swimming town from what I've seen at the public spots. You come to Sacramento to beat the heat, splash around, and let the kids burn off some energy. Finding a good spot is usually pretty easy. We've got five public pools on our site for Sacramento, so there are options across the city.

After:
> Summer in Sacramento can be a real oven, so pools aren't just for fun, they're essential. You'll find a pretty laid-back swimming culture here, mostly families and folks just trying to cool off. When the temperatures start climbing in May, that's when everyone really starts thinking about getting in the water. Most public pools openMemorial Day weekend and stay open through Labor Day. It's not a big lap swimming town from what I've seen at the public spots. You come to Sacramento to beat the heat, splash around, and let the kids burn off some energy. Finding a good spot is usually pretty easy.

Page header: 22 pools; prose says five. Count sentence deleted (R6, last sentence). The narrator sentence 'It's not a big lap swimming town from what I've seen ...' stays (fact word 'lap'). The data typo 'openMemorial' is NOT corrected: no rule may edit inside a sentence.

**R6.2** live city page /public-pools/colorado/aurora/ (ai_intro) (live page fetched 2026-11-16T19:37:39Z (rendered pp_cities.ai_intro)).
 Page count: 44.


Before:
> Man, Aurora can get hot, especially come July and August. You really feel it when you're looking for a good place to cool off. The swimming season here generally kicks off around Memorial Day weekend. Most outdoor public pools open up then and run pretty steady until Labor Day. You'll find a solid mix of swimmers, from serious lap folks who are logging miles to families just wanting to splash around. We've got things like wave pools and lazy rivers, so there's a lot to keep the kids entertained too. If you're new to the area or just visiting, the best way to find a spot is to check out the city's parks and recreation department listings. They'll have the most current info on hours and fees. We've got five public pools listed in our directory, so you've got options.

After:
> Man, Aurora can get hot, especially come July and August. You really feel it when you're looking for a good place to cool off. The swimming season here generally kicks off around Memorial Day weekend. Most outdoor public pools open up then and run pretty steady until Labor Day. You'll find a solid mix of swimmers, from serious lap folks who are logging miles to families just wanting to splash around. We've got things like wave pools and lazy rivers, so there's a lot to keep the kids entertained too. If you're new to the area or just visiting, the best way to find a spot is to check out the city's parks and recreation department listings. They'll have the most current info on hours and fees.

Header 44; prose five. Deleted. 'We've got things like wave pools and lazy rivers ...' stays (amenity words).

**R6.3** live city page /public-pools/illinois/chicago/ (ai_intro) (live page fetched 2026-11-16T19:38:01Z (rendered pp_cities.ai_intro)).
 Page count: 57.


Before:
> When it finally heats up in the Midwest, people here are ready for the water. Chicago summers mean getting outside, and for a lot of folks, that means finding a pool. Our public pools open up around mid-June and usually stay open through Labor Day. It's mostly a family scene at the outdoor pools. You'll see a mix of serious lap swimmers and families just trying to cool off. Public pools are a big deal for communities here, and they can get pretty busy on hot days. If you're new to the area or just visiting, knowing a few spots can make a summer day. Even with five public pools in our system, finding your perfect swim can sometimes mean looking beyond the city parks.

After:
> When it finally heats up in the Midwest, people here are ready for the water. Chicago summers mean getting outside, and for a lot of folks, that means finding a pool. Our public pools open up around mid-June and usually stay open through Labor Day. It's mostly a family scene at the outdoor pools. You'll see a mix of serious lap swimmers and families just trying to cool off. Public pools are a big deal for communities here, and they can get pretty busy on hot days. If you're new to the area or just visiting, knowing a few spots can make a summer day.

Header 57; prose five. R6 deletes it. The R4 pass would delete 'When it finally heats up in the Midwest, people here are ready for the water.' but it names 'Midwest' and is followed by more text, so the R4 pass is skipped (reported) without blocking R6.

**R6.4** live city page /public-pools/kentucky/louisville/ (ai_intro) (live page fetched 2026-11-16T19:36:33Z (rendered pp_cities.ai_intro)).
 Page count: 17.


Before:
> Summer in this part of Kentucky means it gets hot, and a lot of folks head for the water. The pool season generally kicks off Memorial Day weekend and runs through Labor Day. It's pretty family focused here, so you'll see a lot of splash pads and shallow ends. If you're new to Louisville and looking to swim, the public pools are a good starting point. They're usually well-maintained and offer a good mix of lap lanes and open swim areas. We've got five public pools listed for Louisville, so there's usually an option not too far from wherever you are. Just keep in mind that on really hot days, they can get busy, especially the ones with extra features.

After:
> (unchanged)  (skip: `next_sentence_refers_back`)

Header 17; prose five. By hand the count sentence should go, but the next sentence 'Just keep in mind that on really hot days, they can get busy ...' matches the '<words>, they' back-reference form, so the R6 pass is skipped and the row is REPORTED with a delete recommendation (deliberate over-skip).

**R6.5** live city page /public-pools/south-carolina/mount-pleasant/ (ai_intro) (live page fetched 2026-11-16T19:39:26Z (rendered pp_cities.ai_intro)).
 Page count: 2.


Before:
> Summer in Mount Pleasant can get pretty hot, and folks here definitely use their pools to cool off. The heat usually sticks around from May right through September, sometimes even into October, so that's when most outdoor pools are open. It's a pretty family-oriented swim scene. Lots of kids splashing around, people just enjoying the water. If you're new in town and looking for a place to swim, it can be a bit tricky because there aren't a ton of public options. Mostly it's neighborhood pools or private clubs. We've only got one public pool listed in our directory for Mount Pleasant, so knowing your options for getting in the water is key.

After:
> The heat usually sticks around from May right through September, sometimes even into October, so that's when most outdoor pools are open. It's a pretty family-oriented swim scene. Lots of kids splashing around, people just enjoying the water. If you're new in town and looking for a place to swim, it can be a bit tricky because there aren't a ton of public options. Mostly it's neighborhood pools or private clubs.

Header 2; prose one: R6 deletes the count sentence. The R4 pass then deletes the opening local-voice sentence ('folks here'); the new first sentence 'The heat usually sticks around from May ...' stands alone.

**R6.6** live city page /public-pools/new-york/brooklyn/ (ai_intro) (live page fetched 2026-11-16T19:42:56Z (rendered pp_cities.ai_intro)).
 Page count: 28.


Before:
> Back when I was first swimming in Brooklyn, a lot of pools were shutting down for the winter right after Labor Day. These days, that's not always the case anymore. Sure, many of the outdoor spots still close up, but you'll find more indoor options stretching the swim season. It's not just about lap swimming here. You'll see plenty of families, especially at the bigger outdoor pools when the weather's good. If you're new to finding a pool, just remember that some places have specific hours for different age groups or types of swimming, so it's always good to check that out before you go. We've got five public pools listed in our directory, so there are options, even if it feels like a big city to navigate.

After:
> Back when I was first swimming in Brooklyn, a lot of pools were shutting down for the winter right after Labor Day. These days, that's not always the case anymore. Sure, many of the outdoor spots still close up, but you'll find more indoor options stretching the swim season. It's not just about lap swimming here. You'll see plenty of families, especially at the bigger outdoor pools when the weather's good. If you're new to finding a pool, just remember that some places have specific hours for different age groups or types of swimming, so it's always good to check that out before you go.

Header 28; prose five. Count sentence (last) deleted. The invented memoir opener 'Back when I was first swimming in Brooklyn, ...' stays: it carries 'Labor Day' (schedule) and a second clause; listed as an out-of-scope shape.

**R6.7** live city page /public-pools/arizona/mesa/ (ai_intro) (live page fetched 2026-11-16T19:37:50Z (rendered pp_cities.ai_intro)).
 Page count: 13.


Before:
> When the summer sun really kicks in here, we're talking triple digits for months on end. That means pools aren't just for cooling off, they're how you live. People around here hit the water to survive the heat, not just for a leisurely swim. You'll find a mix of serious lap swimmers and families looking to escape the heat. It's a pool culture built around beating the Arizona summer. If you're new to the area or just visiting, finding a good pool is key to enjoying your time outside. We've got just one public spot listed for Mesa so far (Skyline Aquatic Center).

After:
> When the summer sun really kicks in here, we're talking triple digits for months on end. That means pools aren't just for cooling off, they're how you live. People around here hit the water to survive the heat, not just for a leisurely swim. You'll find a mix of serious lap swimmers and families looking to escape the heat. It's a pool culture built around beating the Arizona summer. If you're new to the area or just visiting, finding a good pool is key to enjoying your time outside.

Header 13 (12 distinct after one mapped duplicate pair); prose one. R6 deletes the last sentence. The R4 pass is skipped: deleting 'When the summer sun really kicks in here, we're talking triple digits ...' would leave 'That means pools ...' pointing back.

**R6.8** live city page /public-pools/delaware/wilmington/ (ai_intro) (live page fetched 2026-11-16T19:38:55Z (rendered pp_cities.ai_intro)).
 Page count: 7.


Before:
> Summer in Wilmington usually means July and August are hot. We get a good three months of solid outdoor pool weather, sometimes more into September if we're lucky. People here definitely use their pools. It's a mix, honestly. You'll see families with young kids cooling off, older folks swimming laps for exercise, and teens just hanging out. Our public pools tend to be community hubs. If you're new to the area, the best way to find a pool is just to check out the city's parks and rec sites or look at local YMCA branches. Our site lists five public pools in Wilmington, but there are always private options too if you want something different. It's not a huge swim scene like some coastal towns, but people definitely appreciate having a place to cool off when the heat hits.

After:
> (unchanged)  (skip: `next_sentence_refers_back`)

Header 7; prose 'Our site lists five public pools'. By hand the sentence should go, but the next sentence starts 'It's not a huge swim scene ...', so the R6 pass is skipped and the row is REPORTED for the owner (and the R4 pass is skipped for the same reason after 'People here definitely use their pools.').

**R6.9** live city page /public-pools/california/apple-valley/ (ai_intro) (live page fetched 2026-11-16T19:38:28Z (rendered pp_cities.ai_intro)).
 Page count: 2.


Before:
> Summer gets long and hot here, sitting out in the high desert. You're looking at daytime temps over 90 for a good chunk of the year, so finding a spot to cool off isn't just about fun, it's pretty much essential. We've got just one public pool we track in Apple Valley, the Civic Center Park Aquatic Center. It's a solid option for families and lap swimmers. Most folks are going to be outdoors from pretty early spring right through October, sometimes even November if we get a mild fall. It's a good place to meet locals and definitely where people head when they need to beat the heat. If you're new in town, that's your starting point for a public swim.

After:
> (unchanged)

Header 2, but the two records are mapped duplicate pair G039 (Civic Center Park Aquatic Center twice). The prose 'just one public pool' matches the facility count, so R6 HOLDS it until the duplicate decision; nothing changes.

**R6.10** live city page /public-pools/texas/austin/ (ai_intro) (live page fetched 2026-11-16T19:36:13Z (rendered pp_cities.ai_intro)).
 Page count: 47.


Before:
> When the heat hits hard in Austin, usually around May and keeps going strong into September, knowing where to find a good pool is key. Public pools here are really popular, and they're usually outdoor, so they're only open for that summer season. A lot of folks use them to cool off, to get some exercise with lap swimming, or for a family outing. You'll see a mix of all that. If you're new to the area, it's pretty easy to find a spot to swim. We've got a total of five public pools listed in our directory, and there are some specific places that are pretty well-known for swimming. It just depends on what you're looking for, whether it's a natural spring or a city pool.

After:
> (unchanged)

Header 47; prose 'a total of five public pools listed in our directory, and there are some specific places that are pretty well-known for swimming'. The sentence carries a second claim ('well-known'), so it is review_mixed: listed for the owner with a delete recommendation, never automatic. No narrator sentence qualifies; unchanged.

## 8. What is not verified, and what is left

- Whether pp-ssr reads this database live is **UNVERIFIED**. Every compared field is equal, which fits either
  live reads or an identical copy. Nothing in this folder touches pp-ssr.
- S2 counts cover the 2,476 sitemap pages, not the rows that have no indexed page. PR-3 and PR-4 in
  PENDING-READS.md recompute them on the whole tables. PR-1 tells whether anything changed since the extract.
- The final patterns ran in Python on S2. The 2026-11-15 version ran in PostgreSQL. The final additions
  (site voice "through us", R6 forms and claim guard) have not yet run in PostgreSQL (PR-3, PR-4).
- The R6 hand verdicts in section 3 are judgements on the wording; the page header is the count of record.
- No apply script is part of this task. When one is written, it must guard each update with the old value or md5
  of every field it changes, back up the old values, log skipped rows, and be reversible.

## 9. Revision of 2026-11-16 (content review)

A review of the planned deletions on the live pages of 2026-11-16 found sentences that carried a fact (timing
system, spectator seating, a kids' area, "fully enclosed", the only answering sentence of a FAQ), deletions that
left a sentence without its subject ("Some are ...", "Lots of kids splashing around ...", "Things can change."),
and R6 deletions of count sentences that also made another claim. Every change narrows the rules (the cleaner
deletes less); the list of changes and the case behind each is RUNBOOK.md section 3a. The patterns live in
`text-defects/text_defect_rules.py`, so rules.json, text-defects-measure.sql, the cleaner SQL and the reference
all follow. Section 8's line "No apply script is part of this task" is superseded: the guarded, logged and
reversible apply is `apply.sql` / `rollback.sql` (RUNBOOK.md); nothing has been applied.

**Revised counts (S2, the 2,476 live pages of 2026-11-16, rules module alone**, i.e. without the apply's field
checks A1-A5; `live-2026-11-16/live-summary.json`; the cleaner's own figures, with A1-A5, are in RUNBOOK.md
section 4):

| Field | Fields changed | Sentences deleted | Before the revision |
|---|---|---|---|
| Pool descriptions (R2) | 213 | 225 | 229 / 243 |
| Pool FAQ answers (R3) | 610 | 754 | 655 / 810 |
| City intros (R4) | 125 | 149 | 140 / 168 |
| City FAQ answers (R4) | 29 | 34 | 32 / 38 |
| Wholly non-informative pool FAQ entries (R5) | 57 rows | 58 entries | 58 / 59 |
| Contradicted count sentences deleted (R6) | 4 | 4 | 13 |

**R6 categories** (65 count statements on the 476 city pages, `live-2026-11-16/count-statements.csv`): auto 8
(18 before), review_mixed 22 (12 before), review_scope 9, review_subtype 2, hold_duplicate 1, vague 23. The hand
verdicts of section 3 are unchanged; only the automatic category narrowed. These 10 statements moved from `auto`
to `review_mixed` and now need the owner's decision (city page, page count, sentence as printed):

| City page | Pool count on the page | Statement (field) |
|---|---|---|
| alabama/montgomery | 10 | "We've got four listed in our directory: Montgomery Community Pool, ..." (FAQ; a list of named pools after a colon) |
| california/sacramento | 22 | "We've got five public pools on our site for Sacramento, so there are options across the city." (intro) |
| colorado/centennial | 6 | "We've got a decent number of public pools, four listed in our directory, covering everything from basic swim to full-blown aquatic centers." (intro) |
| delaware/wilmington | 7 | "Our site lists five public pools in Wilmington, but there are always private options too if you want something different." (intro) |
| florida/clearwater | 6 | "Our directory lists four public pools: Clearwater Family Aquatic Center, ..." (FAQ; a list after a colon) |
| kentucky/louisville | 17 | "We've got five public pools listed for Louisville, so there's usually an option not too far from wherever you are." (intro) |
| new-york/brooklyn | 28 | "We've got five public pools listed in our directory, so there are options, even if it feels like a big city to navigate." (intro) |
| north-carolina/greensboro | 20 | "We've got five public pools listed, which is a good baseline, but there are always more options ..." (intro) |
| texas/houston | 53 | "We've got a decent number of places listed for Houston, five public pools right in our directory, plus lots of backyard pools available by the hour." (intro) |
| washington/bellevue | 6 | "We list four public pools ourselves, which is pretty good for a city this size." (intro) |

The 8 statements still `auto`, and what the cleaner does with them on the same pages: deleted in Aurora CO
(intro), Chicago (intro) and Mount Pleasant SC (intro); skipped and reported in Milwaukee and Mesa (the sentence
names a pool: "Pulaski and Schulz", "(Skyline Aquatic Center)"), Lakewood CO and Torrance (the next sentence
refers back) and Chicago's FAQ (A5, "Three of those ..."). The rules module alone (table above) also deletes the
Chicago FAQ sentence; only the cleaner's A5 check stops it.

**Examples.** 70 (R1 10, R2 13, R3 11, R4 13, R5 11, R6 12): the 60 of section 7, 5 R6 examples revised to
the narrower rule, and 10 regression examples taken from the review cases (each fails on the old rules and
passes on the new). All pass.

**Founder voice left in place.** The cleaner never rewrites, so sentences in which an invented "I" speaks as
the founder or the company stay wherever a field guard stops the deletion or the sentence carries fact
vocabulary: 28 on the surrogate, each listed with its page and reason in
[`FOUNDER-VOICE-REMAINING.md`](FOUNDER-VOICE-REMAINING.md); dry-run.sql section 7 prints the production list.
They need the owner's decision (CLAUDE.md hard rule 1).

Still not verified: the revised patterns have run in Python on S2 and in PostgreSQL 16.15 locally (test-output.txt),
not yet on production (PR-6, PR-3, PR-4).
