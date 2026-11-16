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
| `cleaner/build.py` | Renders the template with the exact regexes of `text-defects/text_defect_rules.py` (the source of truth behind rules.json) into `cleaner/core.sql`, `dry-run.sql`, `apply.sql`, `rollback.sql`. The core is pasted byte-identical into the dry run and the apply; its md5 is in both headers (currently `88e17e31d9d9842a9975f666fd1f02bc`). |
| `cleaner/reference.py` | The same cleaner in Python, built on the rules module; the oracle the test compares the SQL with. Holds the additions A1-A5. |
| `cleaner/test_cleaner.py`, `pglocal.py`, `compare.py`, `surrogate.py`, `fixtures.json`, `build_fixtures.py`, `schema.sql` | The local test (section 8). |
| `cleaner/run_surrogate.py` | Produces `dry-run-SURROGATE-live-2026-11-16.txt` and `before-after-sample.md`. |
| `cleaner/verify_live.py` | Compares fetched live pages with `verify-expected.csv`. |
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
| A1 | `below_min_length` | a pass whose result is shorter than **120 characters** (description, intro) or, for a FAQ answer it changes, **40 characters**, is skipped. On the 2,476 live pages it only stops answers such as "Fort Worth is a big city." (9 FAQ arrays); no description or intro came near 120. |
| A2 | `paragraph_break` | a pass that would delete a sentence next to a line break is skipped (it would merge two paragraphs). 0 live cases. |
| A3 | `insurance_anywhere` | a field (or FAQ array) where **any** sentence, question or answer mentions insurance / liability / coverage / claims / damage is not touched at all, not only fields whose narrator sentences do (CLAUDE.md rule 8). 39 live fields. |
| A4 | `contains_mark` | a field containing `§` (the splitter's internal marker; absent on 2026-11-15) is not touched. |
| A5 | `next_sentence_refers_back_a5` | the sentence that would follow a deleted one opens with a back-reference the rules' opener list misses: "Three of those, ...", "Some of these, ...", "Of the five ...", "All four ...". Found while reviewing the before/after sample: deleting Chicago's and Lakewood's wrong count left "Three of those, Welles, Holstein, and Proesel, are outdoor" and "Some of these, like the Lakewood Aquatic Center, ...". 4 live fields. |

A freeze (`ALL:...`) is reported only where a rule would otherwise have deleted something.

## 4. Numbers (with their dates)

**Surrogate dry run, 2026-11-16** (the 2,000 pool + 476 city pages of the saved sitemap, fetched read-only
2026-11-16T19:36Z-20:05Z, rebuilt as rows; [dry-run-SURROGATE-live-2026-11-16.txt](dry-run-SURROGATE-live-2026-11-16.txt)):

| Rule(s) | Fields changed | Sentences / entries deleted |
|---|---|---|
| R1 Best-for list | 1,678 pool pages | - |
| R2 descriptions | 210 | 221 sentences |
| R3 pool FAQ (incl. 18 with R5) | 640 | 789 sentences |
| R5 pool FAQ (incl. 18 with R3) | 58 | 59 entries |
| R4 city intros (incl. 1 with R6) | 137 | 165 sentences |
| R4 city FAQ | 31 | 37 sentences |
| R6 city intros / FAQ | 10 / 1 | 11 sentences |
| **Total** | **2,746 fields** | |
| Skipped (a rule would have changed them) | 576 fields | reasons in before-after-sample.md |

The production tables are larger (3,381 pools and 647 cities; 1,821 JSON-array Best-for values of which 8 `[]`,
S1 extract 2026-11-15, all rows). PR-6 gives the real numbers; expect roughly 1.5-2x the surrogate.

**What remains after the apply, by design** (measured on the same live pages, TEXT-DEFECTS.md sections 2-3):
* first-person sentences that also carry a fact (a number, an amenity, a price, a second clause ...) are NOT
  deleted: about 3,535 such sentences on pool pages and 624 on city pages. The owner's "829 pool pages and 148
  city pages with first-person filler" will therefore **not** drop to zero; removing the rest needs rewriting,
  which this task does not allow;
* of the contradicted counts, only the 18 `auto` statements are automatic, and 7 of them are skipped (5 by the
  rules' field checks, 2 by A5), so 11 are deleted: e.g. **Wilmington** ("Our site lists five public pools in Wilmington, but ...") is skipped
  (`next_sentence_refers_back`), **Austin** ("five public pools ... and there are some specific places that are
  pretty well-known") is `review_mixed`, and Chicago's / Lakewood's FAQ counts are skipped by A5. The 36 cities
  with a contradiction and the hand verdict for each are in TEXT-DEFECTS.md section 3 for the owner;
* the 7 pages whose Best-for value is `[]` keep printing `[]` (the renderer should hide an empty line).

**Run times** (local PostgreSQL 16, surrogate): dry run 98 s (6 statements); apply 17 s; rollback of 2,746
fields 65 s. The apply holds a SHARE ROW EXCLUSIVE lock on `pp_pools` and `pp_cities`: reads (the pages)
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
   tables, the expected column types, no backup/log table yet, no `§`, no Unicode space after a full stop.
4. **A fresh production dry run (PR-6) is reviewed and explicitly approved by the owner** for this run. The
   approval names the file `dry-run-<date>.txt`, its `expected_changes` and `manifest_md5` (section 6 of the
   output) and the matching `approved-manifest.csv`. An approval never carries over to a later dry run.
5. A database restore point exists (Supabase backup / PITR time noted in the run notes).
6. Nobody else is editing `pp_pools` / `pp_cities` text during the run (any generation job paused).

## 6. Apply sequence

All commands run from `ops/seo-repairs-2026-11/public-pools/` with `psql` 16 and a connection string in
`$DATABASE_URL` (never written into a file).

1. **Dry run** (PR-6):
   ```sh
   psql "$DATABASE_URL" -X --single-transaction -v ON_ERROR_STOP=1 -v seed=2026-11-15 -f dry-run.sql > dry-run-$(date -u +%F).txt
   ```
   Read sections 1-4; read every sample in section 4; check section 2 for surprises. Get the owner's approval
   of `expected_changes` + `manifest_md5` (last lines of the file).
2. **Canary** (if pp-ssr's configuration was not read): choose one approved `ai_best_for` line of a pool page
   with little traffic, and apply only that line:
   ```sh
   mkdir -p canary && head -1 approved-manifest.csv > canary/approved-manifest.csv
   grep ',ai_best_for,' approved-manifest.csv | grep '<chosen row id>' >> canary/approved-manifest.csv
   md5=$(printf '%s' "$(tail -1 canary/approved-manifest.csv)" | md5sum | cut -d' ' -f1)
   (cd canary && psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v run_id=pp-text-canary-$(date -u +%Y%m%d) \
        -v expected_changes=1 -v manifest_md5=$md5 -f ../apply.sql)
   ```
   (The manifest md5 is the md5 of its data lines joined by newlines, in table/row/column order, without a
   trailing newline; for one line it is the md5 of that line.) GET the page (one request) and look at the
   "Best for:" line: plain list = pp-ssr reads this database. If not, wait for the cache lifetime and check
   once more; still old = stop and roll back:
   `psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v run_id=pp-text-canary-<date> -f rollback.sql`.
   The canary row is later counted as `already_applied` by the full run, not as drift.
3. **Apply**:
   ```sh
   psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v run_id=pp-text-$(date -u +%Y%m%d)-1 \
        -v expected_changes=<N from the approved dry run> -v manifest_md5=<md5 from the approved dry run> \
        -f apply.sql | tee apply-$(date -u +%F).txt
   ```
   It aborts, changing nothing, if: the manifest row count or md5 differs from what was approved; the run id
   was used before; more than `max_drift` (default 0) approved fields changed since the dry run; a backup
   cannot be verified; the number of updated fields or their new md5 differ from the plan. With
   `-v max_drift=N` up to N drifted fields are skipped and logged (`skip_changed_since_dry_run`), never
   overwritten. Changes the plan would make now but that are not in the manifest are logged as
   `planned_not_in_manifest` and NOT applied (they need a new dry run and a new approval).
4. Save `apply-<date>.txt` next to the dry-run file. Tell the owner what ran (run id, counts by action).

What the apply leaves in the database: `public.seo_repair_pp_backup_20261115` (table, row id, column, old md5,
full old value, first run id; one row per distinct old value, never overwritten) and
`public.seo_repair_pp_change_log` (run id, rule id, table, row id, column, old md5, new md5, action, time).
Both have row-level security switched on with no policy, so the public API keys cannot read them.

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
   before the change, the verifier rated all 2,746 surrogate changes `OLD`.)
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

* fixtures: 97 real rows from the live pages of 2026-11-16 (up to 3 per outcome category: every rule, every
  skip reason that occurs in the data, unchanged rows, every R6 statement category) and 30 synthetic rows
  (27 pools, 3 cities) with 32 hand-derived expected results: apostrophes and quotes in list items, nested / non-string / object /
  malformed / empty / blank / insurance JSON, a filler sentence between two factual ones, "St.", "Ave.",
  "Dr.", "U.S.", "No. 4", "a.m.", "p.m.", "4.5", "$4.50", a URL, curly quotes, a paragraph break, the `§`
  mark, insurance in a question, a FAQ with `a2` and a non-string answer and an extra key, a lone FAQ entry,
  an answer that would get too short, and a field edited after apply;
* checks: every embedded core identical; the dry run aborts outside a read-only transaction, changes nothing,
  creates nothing; SQL plan = Python reference on every fixture field; all hand expectations hold; apply
  changes exactly the planned fields to exactly the planned values and nothing else; no output field empty;
  all 1,753 must-keep sentences still present; full old values in the backup; second apply is a no-op with
  the backup byte-identical; rollback restores byte-identical values and skips the field edited after apply;
  the count guard aborts on drift and on a wrong count or md5; a drifted field is never overwritten;
* the whole surrogate (2,476 live pages): SQL plan = Python reference on all 3,315 planned/skipped fields;
  dry run, apply, re-plan, offline live verification and rollback all pass.

## 9. Rollback

```sh
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v run_id=<the apply run id> -f rollback.sql | tee rollback-$(date -u +%F).txt
```

It restores each field the run applied from the backup, only where the field still has the md5 the apply
wrote. A field edited since is left alone and logged `rollback_skip_edited_after_apply` (decide by hand). It is
idempotent (a second rollback finds everything `already_restored`). Backup and log are kept. Then fetch a few
pages as in section 7 (they should show the old text again after the cache lifetime).

## 10. Out of scope (needs the owner or pp-ssr)

* **Mixed fact + filler sentences** (narrator voice that also states a number, an amenity, a price or a
  second clause): kept; listed by shape in TEXT-DEFECTS.md section 2.4. Fixing them means rewriting.
* **Count statements that are not `auto`** (review_mixed, review_subtype, review_scope, hold_duplicate,
  vague): TEXT-DEFECTS.md section 3 has each one with a hand verdict for the owner.
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
  C.UTF-8 in PostgreSQL 16.15.
