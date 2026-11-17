# Public-pools text cleaner: runbook

> **Status: PREPARED, NOT APPLIED.** Nothing in this folder has changed a production row, page or service.
> It is a change for the owner's final approval, applied later by someone else, and **only after the pp-ssr
> source has been captured into version control**. **Whether pp-ssr reads this database live is UNVERIFIED**:
> the fields of every page compared so far equal the database byte for byte (2026-11-15 extract against the
> pages of 2026-11-15 and 2026-11-16), which fits a live read and also fits an identical copy.
> The production dry run has **not** been run (the database tool was unavailable on 2026-11-16); it is PR-6 in
> [PENDING-READS.md](PENDING-READS.md). Every number below says where and when it was measured.

## 1. What this does, in plain language

The public-pools pages are printed from two tables, `pp_pools` and `pp_cities`. Some of their generated text
has three kinds of defect:

* the "Best for" line prints a raw list such as `["families", "kids' parties"]`;
* some sentences are filler in an invented narrator's voice ("I'd definitely consider it for a casual swim
  day.", "Around here, you get a good long pool season.", "I built PoolRentalNearMe.com for ...");
* some city texts state a pool count that the page itself contradicts ("We've got five public pools listed in
  our directory" on a page that lists 22).

The cleaner fixes only what can be fixed **without writing anything new**: it turns the raw list into
`families, kids' parties`, deletes whole filler sentences, deletes whole FAQ entries that say nothing but
"I don't know, call them", and deletes contradicted count sentences. It never rewords, never adds a word, never
changes a number, never touches a FAQ question, never touches a sentence about insurance, liability, coverage,
claims or damage, and never merges, deletes or unpublishes a record. Wherever a deletion would leave text that
reads badly (a sentence that starts "It ..." or "Three of those ..." with its antecedent gone, an empty or very
short field, two paragraphs run together), it leaves that field alone and reports it instead.

It is one SQL plan, used twice: read-only in the dry run, and in the apply. The apply backs up every old value
first, changes only fields whose value is still exactly what the approved dry run saw, logs every change, and
can be undone field by field.

## 2. Files

| File | What it is |
|---|---|
| `dry-run.sql` | READ ONLY. First statement `set transaction read only;`; aborts unless run with `psql --single-transaction`. Prints what each rule would change, every skip with its reason, a seeded server-side sample (15 fields per rule, exact old and new text), and writes `approved-manifest.csv` plus the `expected_changes` / `manifest_md5` that apply.sql requires. |
| `apply.sql` | One transaction: lock, create backup + log tables, load and check the manifest, recompute the plan, guard, back up, update, log, verify, commit. |
| `rollback.sql` | Undoes one apply run, only where the current value still has the logged new md5. |
| `verify-live.sql` | READ ONLY. After an apply: page URL, new value and backed-up old value of every changed field (for `cleaner/verify_live.py`). |
| `cleaner/core.sql.tmpl` | The plan (pure SQL: one WITH list, no extension, no function, no procedural language). |
| `cleaner/build.py` | Renders the template with the exact regexes of `text-defects/text_defect_rules.py` (the source of truth behind rules.json) into `cleaner/core.sql`, `dry-run.sql`, `apply.sql`, `rollback.sql`. The core is pasted byte-identical into the dry run and the apply; its md5 is in both headers (currently `0ef3b1c06bd022afe4be7f379ed65352`). |
| `cleaner/reference.py` | The same cleaner in Python, built on the rules module; the oracle the test compares the SQL with. Holds the additions A1-A5. |
| `cleaner/test_cleaner.py`, `pglocal.py`, `compare.py`, `surrogate.py`, `fixtures.json`, `build_fixtures.py`, `schema.sql` | The local test (section 8). |
| `cleaner/run_surrogate.py` | Produces `dry-run-SURROGATE-live-2026-11-16.txt` and `before-after-sample.md`. |
| `cleaner/verify_live.py` | Compares fetched live pages with `verify-expected.csv`. |
| `cleaner/check_dry_run.py` | Offline cross-check: re-plans the rows the dry run exported (section 8) with the Python reference and diffs field by field with the SQL plan. Must report 0 differences before approval. |
| `FOUNDER-VOICE-REMAINING.md` | Invented founder / company-voice sentences the plan leaves in place, with page URL and why they stay (surrogate). The owner decides each by hand; the production list is dry-run.sql section 7. |
| `dry-run-SURROGATE-live-2026-11-16.txt` | dry-run.sql run on the surrogate (NOT production; header explains). |
| `before-after-sample.md` | 15 real fields per rule with exact old/new text, and every skipped field with its reason (surrogate). |
| `test-output.txt` | Result of the local test. |

## 3. The rules, and what the apply adds to them

Rules R1-R6 are exactly those of [rules.json](rules.json) / [TEXT-DEFECTS.md](TEXT-DEFECTS.md) section 5
(order R1, R5, R6, R2, R3, R4; each sentence pass checked on the text the previous pass left; a pass that would
break a field is skipped for that field and reported). Scope: **published rows only**
(`pp_pools.is_published` / `pp_cities.is_published` true); unpublished rows have no page to check.

| Rule | Column | Does |
|---|---|---|
| R1 | `pp_pools.ai_best_for` | a valid JSON array of plain strings becomes the elements joined by ", " (anything else, `[]`, or an insurance word: skipped) |
| R5 | `ai_faqs` (pools, cities) | deletes an entry whose every answer sentence is narrator data-gap / referral filler (never the last plain entry; never one whose question or answer mentions insurance) |
| R6 | `pp_cities.ai_intro`, city `ai_faqs` answers | deletes a sentence stating a directory pool count that differs from the page's published count, when nothing else in it could be a fact (category `auto`) |
| R2 / R3 / R4 | descriptions / pool FAQ answers / city intro and FAQ answers | deletes deletable narrator sentences |

Field-level skip conditions added for the apply (each one can only make the cleaner change **less**; all are in
`cleaner/reference.py` and the SQL, and the test proves both agree):

| Id | Skip reason | Why |
|---|---|---|
| A1 | `below_min_length` | a pass whose result is shorter than **120 characters** (description, intro) or, for a FAQ answer it changes, **40 characters**, is skipped. On the 2,476 live pages it only stops answers such as "Fort Worth is a big city." (8 FAQ arrays after the 2026-11-16 revision); no description or intro came near 120. |
| A2 | `paragraph_break` | a pass that would delete a sentence next to a line break is skipped (it would merge two paragraphs). 0 live cases. |
| A3 | `insurance_anywhere` | a field (or FAQ array) where **any** sentence, question or answer mentions insurance / liability / coverage / claims / damage is not touched at all, not only fields whose narrator sentences do (CLAUDE.md rule 8). 38 live fields after the 2026-11-16 revision (plus 9 frozen because a narrator sentence itself has such a word, `ALL:insurance`). |
| A4 | `contains_mark` | a field containing `§` (the splitter's internal marker; absent on 2026-11-15) is not touched. |
| A5 | `next_sentence_refers_back_a5` | the sentence that would follow a deleted one opens with a back-reference the rules' opener list misses: "Three of those, ...", "Some of these, ...", "Of the five ...", "All four ...". Found while reviewing the before/after sample: deleting Chicago's and Lakewood's wrong count left "Three of those, Welles, Holstein, and Proesel, are outdoor" and "Some of these, like the Lakewood Aquatic Center, ...". 3 live fields after the 2026-11-16 revision. |

A freeze (`ALL:...`) is reported only where a rule would otherwise have deleted something.

### 3a. Revision of 2026-11-16 (content and SQL-safety review)

A review of the before/after output found deletions that removed facts or left broken text. The rules were
**narrowed** (every change below can only make the cleaner delete less), in `text-defects/text_defect_rules.py`
(so rules.json, the SQL and the reference all follow) and mirrored in `cleaner/core.sql.tmpl`:

| Change | Why (review case, live pages of 2026-11-16) |
|---|---|
| Fact vocabulary adds timing system, touchpads, scoreboard, seating, spectators, bleachers, enclosed, warm-up, therapy, whirlpool, deck, splash pad, water features, kids'/toddler/play area or section, and the fact markers "like this one does/has", "they even have", "they've got" | "I see they even have a timing system." (Minnetonka), "a timing system and spectator seating ..." (Framingham), "a dedicated kids' area, like this one does" (Marine Park, Fort Worth), "... that are fully enclosed" (Vancouver WA) were deleted although the fact appears nowhere else |
| "the only one" is no longer masked as a non-number | "... Glass Bar Nude Beach is the only one I show in my system ..." was the only sentence answering its question |
| A data-gap sentence whose only "missing" word is a limiter (only / limited) is kept when it carries fact vocabulary (`GAP_HARD`) | "I only have data on this specific facility being free." (Arlington) let R5 delete the whole entry |
| The entity guard also applies to the LAST deleted sentence of a field; there the site's own name and generic agency words ("the City of Dayton Parks and Recreation website") do not count | "We have good options like the Vancouver Aquatic Center and the Vancouver Community Pool ...", "(Skyline Aquatic Center)" (Mesa R6), "Pulaski and Schulz" (Milwaukee R6) |
| Opener list adds Lots, Plenty, Think, Just, Things, Not, Nothing, Mostly, Usually, Especially, Whether, Like, Kind, Sort, Great, Good, Perfect, Tons, Loads, and quantifier pronouns "Some/Many/Most/Few/All/Each/Several are/is/have/of ..." | Bremerton / Wesley Chapel "Some are ..." without their subject; "Just makes it easier for everyone.", "Things can change.", "Not every city pool ..."; nine city intros left starting with "Lots of kids splashing around ..." / "Think lots of open swim ..." (14 fields, all now skipped) |
| R6: a count sentence with a second clause (`but`, `which`, `, so there ...`, `:`, `;` ...) or "plus / covering / everything / variety / mix / types ..." is `review_mixed`, never automatic | Centennial "... covering everything from basic swim to full-blown aquatic centers", Houston "... plus lots of backyard pools", Montgomery's colon list, Greensboro "which is a good baseline, but ..." |
| Whitespace is the explicit class `WS` (= Python's `\s`) in every pattern, never `\s` | PostgreSQL's `\s` under C.UTF-8 misses U+001C-U+001F, U+0085, U+00A0, U+2007 and U+202F, so a NO-BREAK SPACE after a comma made the SQL delete a spliced sentence the Python rules keep |

Effect on the surrogate (2,476 live pages): 2,746 -> 2,661 field changes; R6 automatic deletions 11 -> 3 (10 of the
18 former `auto` statements are now `review_mixed`, listed for the owner in TEXT-DEFECTS.md section 9). 10 regression examples were added
to examples.json (all 10 fail on the old rules and pass on the new), 5 R6 examples were revised, and 6 synthetic
fixture cases were added. Section 4 has the new numbers.

**2026-11-17 (Codex review of PR #9).** One more narrowing: `CLAUSE` also treats a second clause addressed to the
reader as a second clause (comma, optional and/so/but/then, then `you` / you'd / you'll / you're / you've / you
will / would / can / should / may / might). The case: "They don't have family passes listed in the info I have,
so you'd pay per person." (Peachtree City Community Pool admission FAQ) was deletable, and the cleaner removed
the per-person payment fact. Effect on the surrogate: 2,661 -> 2,640 field changes, 629 -> 626 skips; Aurora's
R6 sentence ("..., so you've got options.") is now `review_mixed`. 3 must-keep regression examples were added
and 2 examples revised (Murray R4, Aurora R6); details and every changed count in TEXT-DEFECTS.md section 10.

**2026-11-17, second round (independent check of the clause guard).** The same fact loss was still open for
other joins: "so you'd" without a comma, ", plus you'd", ", or you can" (Sigma Swimming, Fort Worth: "I'd suggest
checking the Fort Worth Parks and Recreation website, or you can use our site ..."), ", and so you'd", and a
joined clause with another subject that carries a fact ("We get long, hot summers, so pool season pretty much
runs from late spring right into early fall.", Spring TX; "It's a public pool, run by the city, and ...", Pecos
Park, Phoenix; "It's a city pool, from what I gather, so ...", Marion Pool, Cedar Rapids). `CLAUSE` now also
matches a comma, optional whitespace and so / and / or / plus / but / then / yet (any subject after it), and the
word "so" followed by a subject pronoun (you / you'd / you'll / you're / you've / they / it / it's / that / this /
there / we / I) without a comma. A lead-in comma with no join word ("Honestly, I don't have that.") is judged as
before. Keeping such a sentence can lift a field-level skip it used to cause (Allen TX: "It gets hot here in North
Texas, so ..." named an entity and stopped the whole intro; kept, the other two narrator sentences would have
been deleted for the first time; 6 such fields on S2). So a column in which the joined-clause part changes any
sentence's decision is left unchanged whenever the plan would change it (`ALL:joined_clause_kept`); every other
column is planned exactly as before. Effect on the surrogate: 2,640 -> 2,568 field changes, 626 -> 641 skipped
fields (43 of them `ALL:joined_clause_kept`); Mount Pleasant SC's R6 sentence ("..., so knowing your options
... is key.") is now `review_mixed`. 6 must-keep regression examples were added from live text and 5 examples
revised; TEXT-DEFECTS.md section 10.

The same review found SQL-safety gaps, fixed in `cleaner/build.py` (so dry-run.sql, apply.sql, rollback.sql and
verify-live.sql follow) and covered by new checks in `cleaner/test_cleaner.py`:

| Change | Why |
|---|---|
| apply.sql and rollback.sql abort, changing nothing, if `pp_pools` or `pp_cities` has any non-internal trigger, unless `-v allow_triggers=` names every one exactly (the owner's explicit decision) | a trigger (e.g. one that sets `updated_at`, or a webhook) would fire on every guarded UPDATE and change columns the backup does not hold; rollback could not undo that |
| A missing `-v run_id` / `expected_changes` / `manifest_md5` fails with exit 3, never exit 0; rollback.sql exits 3 with `ROLLBACK INCOMPLETE` when any field of the run was not restored (the restores it made stay committed) | a failed or partial run must never look like a success to a person or a script |
| The RUNBOOK commands use `set -o pipefail` and `2>&1 \| tee`, and say to check the exit status | with a plain `\| tee` the pipeline reports tee's exit 0 and the error text never reaches the saved log |
| rollback.sql sets its own `statement_timeout`, `enable_nestloop = off`, `jit = off` and analyzes the log and backup tables first | on fresh tables the planner chose a nested loop: 67 s under the write lock on the surrogate, now 0.2 s |
| apply.sql revokes every privilege on the backup and change-log tables from PUBLIC, `anon`, `authenticated` and `service_role`, and aborts if any remains | Supabase's default privileges grant ALL on new public tables to those roles, and `service_role` bypasses row-level security |
| rollback.sql lists other apply runs (e.g. a canary) whose fields still hold their new value; section 9 says how to undo everything | the full run logs the canary field `already_applied`, so rolling back the full run alone leaves the canary field cleaned |
| dry-run.sql section 7 lists every invented founder / company-voice sentence the plan leaves in place; section 8 exports the rows and the plan for `cleaner/check_dry_run.py` (Python reference vs SQL on the real production text) | the founder voice is the pattern of CLAUDE.md hard rule 1 and needs the owner's decision; the surrogate covered only the 2,476 sitemap pages |

## 4. Numbers (with their dates)

**Surrogate dry run, re-run 2026-11-17 with the 2026-11-17 rules** (the 2,000 pool + 476 city pages of the saved sitemap, fetched read-only
2026-11-16T19:36Z-20:05Z, rebuilt as rows; [dry-run-SURROGATE-live-2026-11-16.txt](dry-run-SURROGATE-live-2026-11-16.txt)):

| Rule(s) | Fields changed | Sentences / entries deleted |
|---|---|---|
| R1 Best-for list | 1,678 pool pages | - |
| R2 descriptions | 187 | 194 sentences |
| R3 pool FAQ (incl. 14 with R5) | 566 | 698 sentences |
| R5 pool FAQ (incl. 14 with R3) | 45 | 46 entries |
| R4 city intros | 78 | 87 sentences |
| R4 city FAQ | 27 | 32 sentences |
| R6 city intros / FAQ | 1 / 0 | 1 sentence |
| **Total** | **2,568 fields** | |
| Skipped (a rule would have changed them) | 641 fields | reasons in before-after-sample.md (43 `ALL:joined_clause_kept`) |

(Before the 2026-11-16 review revision, section 3a, the same pages gave 2,746 changes and 576 skips; before the
first 2026-11-17 change, 2,661 changes and 629 skips; before the second, 2,640 changes and 626 skips.)

The production tables are larger (3,381 pools and 647 cities; 1,821 JSON-array Best-for values of which 8 `[]`,
S1 extract 2026-11-15, all rows). PR-6 gives the real numbers; expect roughly 1.5-2x the surrogate.

**What remains after the apply, by design** (measured on the same live pages, TEXT-DEFECTS.md sections 2-3):
* first-person sentences that also carry a fact (a number, an amenity, a price, a second clause ...) are NOT
  deleted: about 3,535 such sentences on pool pages and 624 on city pages (counted before the 2026-11-16
  and both 2026-11-17 revisions, which keep more). The owner's "829 pool pages and 148 city pages with first-person filler"
  will therefore **not** drop to zero; removing the rest needs rewriting, which this task does not allow;
* of the contradicted counts, only the 6 `auto` statements are automatic (18 before the 2026-11-16 revision, 8
  before the first 2026-11-17 one, which moved Aurora's "..., so you've got options." to `review_mixed`, 7 before
  the second, which moved Mount Pleasant SC's "..., so knowing your options for getting in the water is key."),
  and 5 of them are skipped (Milwaukee and Mesa because the sentence names a pool, Lakewood and Torrance because
  the next sentence refers back, Chicago's FAQ by A5), so 1 is deleted (Chicago intro).
  **Wilmington** ("Our site lists five public pools in Wilmington, but ...") and **Austin** ("five public pools ...
  and there are some specific places that are pretty well-known") are `review_mixed`. The 36 cities with a
  contradiction and the hand verdict for each are in TEXT-DEFECTS.md section 3, and the statements that moved
  to `review_mixed` in section 9, for the owner;
* the invented founder / company voice ("I started PoolRentalNearMe.com", "My company, PoolRentalNearMe.com,
  ...", "my team dug into it"): 28 sentences in 28 fields stay on the surrogate, because a field guard stopped
  the deletion or the sentence carries fact vocabulary. They are listed with page and reason in
  [FOUNDER-VOICE-REMAINING.md](FOUNDER-VOICE-REMAINING.md) and, for production, in dry-run.sql section 7. Each
  needs the owner's decision (CLAUDE.md hard rule 1: Derek Bowen or Brandon Elias as company voices, or nobody);
* the 7 pages whose Best-for value is `[]` keep printing `[]` (the renderer should hide an empty line).

**Run times** (local PostgreSQL 16, surrogate, 2026-11-16 revision): dry run about 145 s (it now also prints
section 7 and exports section 8); apply 18 s; rollback of 2,661 fields under 1 s (it was 65 s before rollback.sql
got its own planner settings). With the rules of the second 2026-11-17 round (the plan also decides every
sentence with `CLAUSE_CORE` for the joined-clause freeze), in test-output.txt: dry run 337 s (128 s with the first
2026-11-17 round), apply 43 s (16 s), rollback of 2,568 fields 0.2 s. Production has about 1.5-2x the text, so
expect the apply to hold its lock for roughly 1-1.5 minutes. The apply holds a SHARE ROW EXCLUSIVE lock on `pp_pools` and `pp_cities`: reads (the pages)
continue, writes to those two tables wait until it commits.

## 5. Preconditions (all of them, before any write)

1. **pp-ssr source is captured into version control.** Nothing in this folder may be applied before that
   (owner's instruction). If the captured source can render a JSON array as a list, prefer fixing the
   renderer for "Best for" and drop R1 from the run: filter `,ai_best_for,` lines out of the manifest (and
   recompute its md5, below), or decide explicitly that a plain-text value is fine for the renderer too.
2. **Someone confirms that pp-ssr reads this database.** Either:
   * *read its configuration* in the captured source: the database URL / Supabase project it connects to, that
     it queries `pp_pools` and `pp_cities` (not an export, a cache table or a static build), and any page cache
     and its lifetime; or
   * *canary*: apply ONE planned field on ONE low-traffic record and watch its page (step 6.2 below). If the
     page still shows the old value after the cache lifetime, pp-ssr does not read this database: roll the
     canary back and stop.
3. **PR-7 passes** ([PENDING-READS.md](PENDING-READS.md)): PostgreSQL 16+, no unexpected trigger on the two
   tables (apply.sql and rollback.sql refuse to run while one exists unless the owner approves it and the run
   passes `-v allow_triggers=<exact list>`; a trigger that sets `updated_at` would still change that column, and
   rollback cannot restore it), the expected column types, no backup/log table yet, no `§`, and the count of
   fields with unusual whitespace noted (the PR-6 cross-check must still show 0 differences).
4. **A fresh production dry run (PR-6) is reviewed and explicitly approved by the owner** for this run. The
   approval names the file `dry-run-<date>.txt`, its `expected_changes` and `manifest_md5` (section 6 of the
   output) and the matching `approved-manifest.csv`. An approval never carries over to a later dry run. Before
   approval, `python3 -I cleaner/check_dry_run.py .` must exit 0 (the Python reference plans exactly what the
   SQL planned, on the production text), and the owner has decided what happens to the founder-voice sentences
   of section 7 (apply.sql changes none of them).
5. A database restore point exists (Supabase backup / PITR time noted in the run notes).
6. Nobody else is editing `pp_pools` / `pp_cities` text during the run (any generation job paused).

## 6. Apply sequence

All commands run from `ops/seo-repairs-2026-11/public-pools/` with `psql` 16 and a connection string in
`$DATABASE_URL` (never written into a file).

1. **Dry run** (PR-6):
   ```sh
   psql "$DATABASE_URL" -X --single-transaction -v ON_ERROR_STOP=1 -v seed=2026-11-15 -f dry-run.sql > dry-run-$(date -u +%F).txt; echo "exit $?"
   python3 -I cleaner/check_dry_run.py .; echo "exit $?"
   ```
   Both must print `exit 0`. Read sections 1-4; read every sample in section 4; check section 2 for surprises;
   give section 7 (founder voice left in place) to the owner. Get the owner's approval of `expected_changes` +
   `manifest_md5` (section 6).
2. **Canary** (if pp-ssr's configuration was not read): choose one approved `ai_best_for` line of a pool page
   with little traffic, and apply only that line:
   ```sh
   mkdir -p canary && head -1 approved-manifest.csv > canary/approved-manifest.csv
   grep ',ai_best_for,' approved-manifest.csv | grep '<chosen row id>' >> canary/approved-manifest.csv
   md5=$(printf '%s' "$(tail -1 canary/approved-manifest.csv)" | md5sum | cut -d' ' -f1)
   (set -o pipefail; cd canary && psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v run_id=pp-text-canary-$(date -u +%Y%m%d) \
        -v expected_changes=1 -v manifest_md5=$md5 -f ../apply.sql 2>&1 | tee apply-canary.txt); echo "exit $?"
   ```
   (The manifest md5 is the md5 of its data lines joined by newlines, in table/row/column order, without a
   trailing newline; for one line it is the md5 of that line.) GET the page (one request) and look at the
   "Best for:" line: plain list = pp-ssr reads this database. If not, wait for the cache lifetime and check
   once more; still old = stop and roll back:
   `psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v run_id=pp-text-canary-<date> -f rollback.sql; echo "exit $?"`.
   The canary row is later counted as `already_applied` by the full run, not as drift, and is therefore NOT in
   the full run's rollback or verify lists: undoing everything needs both rollbacks (section 9).
3. **Apply**:
   ```sh
   set -o pipefail
   psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v run_id=pp-text-$(date -u +%Y%m%d)-1 \
        -v expected_changes=<N from the approved dry run> -v manifest_md5=<md5 from the approved dry run> \
        -f apply.sql 2>&1 | tee apply-$(date -u +%F).txt; echo "exit $?"
   ```
   `exit 0` = committed. Any other exit status = aborted and rolled back, nothing changed (the reason is the
   last `ERROR:` line of the saved file). A missing variable also exits non-zero.
   It aborts, changing nothing, if: the manifest row count or md5 differs from what was approved; the run id
   was used before; more than `max_drift` (default 0) approved fields changed since the dry run; a backup
   cannot be verified; the number of updated fields or their new md5 differ from the plan; a non-internal
   trigger exists on either table and `-v allow_triggers` does not name all of them exactly; an API role still
   holds a privilege on the backup or log table after the revoke. With
   `-v max_drift=N` up to N drifted fields are skipped and logged (`skip_changed_since_dry_run`), never
   overwritten. Changes the plan would make now but that are not in the manifest are logged as
   `planned_not_in_manifest` and NOT applied (they need a new dry run and a new approval).
4. Save `apply-<date>.txt` next to the dry-run file. Tell the owner what ran (run id, exit status, counts by
   action), including an aborted run.

What the apply leaves in the database: `public.seo_repair_pp_backup_20261115` (table, row id, column, old md5,
full old value, first run id; one row per distinct old value, never overwritten) and
`public.seo_repair_pp_change_log` (run id, rule id, table, row id, column, old md5, new md5, action, time).
Both have row-level security switched on with no policy, and apply.sql revokes every privilege on them from
PUBLIC, `anon`, `authenticated` and `service_role` (which bypasses row-level security) and checks that none is
left, so no API key can read, change or truncate them; only the role that ran apply.sql can.

## 7. Verify on the live pages

1. List what the run changed (read-only):
   ```sh
   psql "$DATABASE_URL" -X --single-transaction -v ON_ERROR_STOP=1 -v run_id=<run id> -f verify-live.sql
   ```
   This writes `verify-expected.csv` (URL, table, column, rule, new value, old value).
2. Fetch those pages, GET only, under 2 requests per second, normal browser User-Agent:
   ```sh
   cut -d, -f1 verify-expected.csv | tail -n +2 | sort -u > verify-urls.txt
   python3 -I text-defects/extract_live.py verify-urls.txt verify-pages.jsonl
   python3 -I cleaner/verify_live.py verify-expected.csv verify-pages.jsonl
   ```
   Every field should be `NEW`. `OLD` means a cache or a copy (wait for the cache lifetime and fetch again);
   `NEITHER` means the page shows something else: stop and look. (Tested offline: on the pages fetched
   before the change, the verifier rated all 2,568 surrogate changes `OLD`.)
3. By eye, on a handful of pages: "Best for:" shows a plain list; the FAQ section and its FAQPage JSON-LD
   no longer contain the deleted entries; city intros no longer state a wrong count.
4. Afterwards a new dry run shows R1 values as `R1:not_json` (they are plain text now) and should plan no
   other change; anything it plans is the small idempotency gap below and needs its own approval.

Idempotency: after an R6 deletion, an answer can become pure narrator filler that only R5 would remove on a
second run. The apply never does that unapproved (it logs it `planned_not_in_manifest`). On the 2,476 live
pages the re-plan after apply changed **0** fields; the synthetic test case shows the mechanism.

## 8. Local test (what was proved, 2026-11-16)

`python3 -I cleaner/test_cleaner.py` (result in [test-output.txt](test-output.txt)) builds a throwaway
PostgreSQL 16 cluster (binaries in /usr/lib/postgresql/16/bin, run as the unprivileged user `postgres`, data
under /tmp, Unix socket only, port 55441, removed at the end), with the production column types
(`cleaner/schema.sql`, from the information_schema extract of 2026-11-15) and:

* fixtures (regenerated for the 2026-11-16 revision and again for both 2026-11-17 rounds, reproducibly: same seed, byte-identical on a second run): 96 real rows from the live pages of 2026-11-16 (up to 3
  per outcome category: every rule, every skip reason that occurs in the data, unchanged rows, every R6
  statement category) and 37 synthetic rows (33 pools, 4 cities) with 39 hand-derived expected results, among
  them the review cases of section 3a: apostrophes and quotes in list items, nested / non-string / object /
  malformed / empty / blank / insurance JSON, a filler sentence between two factual ones, "St.", "Ave.",
  "Dr.", "U.S.", "No. 4", "a.m.", "p.m.", "4.5", "$4.50", a URL, curly quotes, a paragraph break, the `§`
  mark, insurance in a question, a FAQ with `a2` and a non-string answer and an extra key, a lone FAQ entry,
  an answer that would get too short, and a field edited after apply;
* checks: every embedded core identical; the dry run aborts outside a read-only transaction, changes nothing,
  creates nothing; SQL plan = Python reference on every fixture field; all hand expectations hold; apply
  changes exactly the planned fields to exactly the planned values and nothing else; no output field empty;
  all 1,724 must-keep sentences still present; full old values in the backup; second apply is a no-op with
  the backup byte-identical; rollback restores byte-identical values and skips the field edited after apply;
  the count guard aborts on drift and on a wrong count or md5; a drifted field is never overwritten; a missing
  variable exits 3; rollback with an unrestored field exits 3 (`ROLLBACK INCOMPLETE`); with Supabase-style
  default privileges, the API roles hold no privilege on the backup or log after apply; a BEFORE UPDATE trigger
  stops apply and rollback unless named exactly; the explicit whitespace class matches the same 29 code points
  in Python and PostgreSQL, and 30 rows with NBSP / U+202F / U+0085 / U+2007 / U+001F plan identically;
  the canary of section 6 step 2 (its three shell lines run as written in this file) changes exactly one field,
  the full run then logs that field `already_applied`, rolling back the full run leaves only the canary field
  changed and names the canary run, and rolling back the canary run too restores every field byte-identical;
  every statement of `text-defects/text-defects-measure.sql` (PENDING-READS) runs read-only;
* the whole surrogate (2,476 live pages): SQL plan = Python reference on all 3,209 planned/skipped fields (2,568 changes);
  dry-run section 7 = the reference founder-voice list; `check_dry_run.py` on the dry run's own exports finds 0
  differences; dry run, apply, re-plan, offline live verification and rollback (under 30 s) all pass.

## 9. Rollback

```sh
set -o pipefail
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v run_id=<the apply run id> -f rollback.sql 2>&1 | tee rollback-$(date -u +%F).txt; echo "exit $?"
```

`exit 0` and `rollback complete` = every field of the run is back at its old value. Exit 3 means either it
aborted before changing anything, or it committed its restores but some fields were not restored
(`ROLLBACK INCOMPLETE`, listed in the decisions table): read the saved file. One run id per call. **To undo
everything after a canary**, roll back the full run, then the canary run (`-v run_id=pp-text-canary-<date>`):
the canary field is not in the full run's list. The end of each rollback's output lists every other run whose
fields still hold the value it wrote.

It restores each field the run applied from the backup, only where the field still has the md5 the apply
wrote. A field edited since is left alone and logged `rollback_skip_edited_after_apply` (decide by hand). It is
idempotent (a second rollback finds everything `already_restored`, and still exits 3 if a field was left
unrestored). Backup and log are kept. Then fetch a few
pages as in section 7 (they should show the old text again after the cache lifetime).

## 10. Out of scope (needs the owner or pp-ssr)

* **Mixed fact + filler sentences** (narrator voice that also states a number, an amenity, a price or a
  second clause): kept; listed by shape in TEXT-DEFECTS.md section 2.4. Fixing them means rewriting.
* **Count statements that are not `auto`** (review_mixed, review_subtype, review_scope, hold_duplicate,
  vague): TEXT-DEFECTS.md section 3 has each one with a hand verdict for the owner.
* **Invented founder / company voice left in place** (FOUNDER-VOICE-REMAINING.md, dry-run.sql section 7):
  the owner decides each sentence by hand.
* **Duplicates**: only mapped (duplicate-mapping.csv / -README.md); nothing is merged. R6 uses the map only to
  HOLD a deletion whose number matches the de-duplicated count.
* **The 7 state-page links to cities with 0 public pools**, the empty `[]` Best-for line, how JSON is rendered:
  pp-ssr changes, after its source is in version control.
* `pp_cities.pool_count` mismatches (437 cities), the 695 published pools without an address, `ai_tips`
  (not rendered), meta descriptions with U+FFFD / "$25/hr", wrong facts inside kept sentences.

## 11. Not verified

* Whether pp-ssr reads this database live (precondition 2).
* Every production number: the counts above are from the live pages of 2026-11-16 and the extract of
  2026-11-15; PR-6 replaces them.
* Production collation, triggers, server version (PR-7). The SQL behaved identically to the Python rules on
  C.UTF-8 in PostgreSQL 16.15; since the revision no pattern uses `\s`, so ctype no longer changes the plan,
  and `check_dry_run.py` compares the two on the production text itself.
