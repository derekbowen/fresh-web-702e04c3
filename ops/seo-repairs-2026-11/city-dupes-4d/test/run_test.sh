#!/bin/bash
# Local proof for step 4d on PostgreSQL 16:
#   REF  = §6a APPLY run the ordinary way (all triggers fire: 29 full refreshes)
#   TEST = apply.sql + refresh-1..4.sql exactly as they will run on production (literal production
#          boundaries), checked with noop-1..4.sql; TEST2 = the same split at this seed's own quartiles
# then compares every column of every row (updated_at: which rows changed), then body-links.sql against an
# independent Python rewrite, then rolls TEST back with rollback-body.sql + rollback.sql and compares it
# with the seeded state, page text and updated_at included. Guards are each exercised on a copy.
set -u
export PYTHONDONTWRITEBYTECODE=1
HERE="$(cd "$(dirname "$0")" && pwd)"; PKG="$(dirname "$HERE")"
PGBIN=/usr/lib/postgresql/16/bin; BASE=$(mktemp -d); PORT=55433
as_pg() { if [ "$(id -u)" = 0 ]; then su postgres -s /bin/bash -c "$(printf '%q ' "$@")"; else "$@"; fi; }
chown postgres "$BASE" 2>/dev/null || true
cleanup() { as_pg "$PGBIN/pg_ctl" -D "$BASE/data" -m fast -w stop >/dev/null 2>&1 || true; rm -rf "$BASE"; }
trap cleanup EXIT
# Production collates with ICU en-US: use that, and say so if it falls back.
as_pg "$PGBIN/initdb" -D "$BASE/data" -E UTF8 --locale=C.UTF-8 --locale-provider=icu --icu-locale=en-US -U postgres -A trust >/dev/null 2>&1 \
  || { echo "NOTE: ICU initdb failed, falling back to C.UTF-8"; as_pg "$PGBIN/initdb" -D "$BASE/data" -E UTF8 --locale=C.UTF-8 -U postgres -A trust >/dev/null; } || exit 1
as_pg "$PGBIN/pg_ctl" -D "$BASE/data" -o "-p $PORT -k $BASE -c listen_addresses=''" -l "$BASE/server.log" -w start >/dev/null || exit 1
export PGHOST="$BASE" PGPORT="$PORT" PGUSER=postgres
PSQL="psql -X -q -v ON_ERROR_STOP=1"
fail=0; ok() { echo "PASS $1"; }; bad() { echo "FAIL $1"; fail=1; }
python3 "$HERE/seed.py" "$PKG/pairs.sql" "$BASE/seed.json" > "$BASE/seed.sql" || exit 1
$PSQL -d postgres -c "create database seed" || exit 1
$PSQL -d seed -f "$HERE/schema.sql" -f "$BASE/seed.sql" >/dev/null || exit 1
$PSQL -d postgres -c "create database ref template seed" -c "create database test template seed" -c "create database test2 template seed" || exit 1
echo "collation: $($PSQL -d seed -At -c "select datlocprovider::text || ' ' || coalesce(daticulocale, datcollate) from pg_database where datname='seed'")"

# REF: intent.md §6a APPLY, triggers on (the path that timed out on production)
PAIRS="$(cat "$PKG/pairs.sql")"
$PSQL -d ref -c "update content_pages c set status = 'redirect', redirect_to = v.keeper, in_sitemap = false from (values $PAIRS) as v(dup, keeper) where c.slug = v.dup and c.template_type = 'host_acq_city' and c.status = 'published';" || exit 1

# The pairs in apply.sql and body-links.sql are exactly pairs.sql
pairs_of() { grep -o "('become-a-[^']*', 'become-a-[^']*')" "$1" | sort; }
for f in apply.sql body-links.sql; do
  [ "$(pairs_of "$PKG/$f" | md5sum)" = "$(pairs_of "$PKG/pairs.sql" | md5sum)" ] && [ "$(pairs_of "$PKG/$f" | wc -l)" = 29 ] && ok "$f holds the 29 pairs of pairs.sql" || bad "$f pairs differ from pairs.sql"
done
# The literal files on disk are what make-chunks.py writes (nobody hand-edited one)
mkdir -p "$BASE/regen" && python3 - "$PKG" "$BASE/regen" <<'PY' || exit 1
import sys, importlib.util
spec = importlib.util.spec_from_file_location('mc', sys.argv[1] + '/make-chunks.py'); mc = importlib.util.module_from_spec(spec); spec.loader.exec_module(mc)
mc.main(['make-chunks.py', sys.argv[2]] + mc.BOUNDS)
PY
for k in 1 2 3 4; do for f in refresh noop; do cmp -s "$PKG/$f-$k.sql" "$BASE/regen/$f-$k.sql" || bad "$f-$k.sql differs from make-chunks.py output"; done; done
ok "refresh-1..4.sql and noop-1..4.sql match make-chunks.py"
! grep -n ":'" "$PKG"/refresh-*.sql "$PKG"/noop-*.sql "$PKG"/apply.sql "$PKG"/body-links.sql "$PKG"/rollback*.sql "$PKG"/verify.sql >/dev/null && ok "no psql variables in any file that runs on production" || bad "a production file uses a psql variable"

# TEST: apply.sql, then the four literal refresh files (production boundaries)
$PSQL -d test -f "$PKG/apply.sql" > "$BASE/apply.out" || { cat "$BASE/apply.out"; exit 1; }
total_changed=0; computed=0
for k in 1 2 3 4; do
  out=$($PSQL -d test -At -F ' ' -f "$PKG/refresh-$k.sql")
  echo "  refresh-$k.sql: range_no computed changed = $out"
  set -- $out; computed=$((computed + $2)); total_changed=$((total_changed + $3))
done
eligible=$($PSQL -d test -At -c "select count(*) from content_pages where template_type='host_acq_city' and status='published' and redirect_to is null")
[ "$computed" = "$eligible" ] && ok "the 4 literal ranges computed every eligible row once ($computed)" || bad "ranges computed $computed of $eligible rows"
stale=0; for k in 1 2 3 4; do out=$($PSQL -d test -At -F ' ' -f "$PKG/noop-$k.sql"); set -- $out; stale=$((stale + $3)); done
[ "$stale" = 0 ] && ok "noop-1..4.sql: 0 stale rows in every range" || bad "noop checks found $stale stale rows"
again=0; for k in 1 2 3 4; do out=$($PSQL -d test -At -F ' ' -f "$PKG/refresh-$k.sql"); set -- $out; again=$((again + $3)); done
[ "$again" = 0 ] && ok "running the 4 refresh files again changes nothing" || bad "second refresh pass changed $again rows"

# TEST2: same, split at this seed's own quartiles (balanced ranges), files generated into $BASE/q
$PSQL -d test2 -f "$PKG/apply.sql" >/dev/null || exit 1
B=$($PSQL -d test2 -At -c "with e as (select slug, row_number() over (order by slug) rn, count(*) over () n from content_pages where template_type='host_acq_city' and status='published' and redirect_to is null) select string_agg(slug, ' ' order by rn) from e where rn in (round(n*0.25)::int+1, round(n*0.5)::int+1, round(n*0.75)::int+1)")
mkdir -p "$BASE/q" && python3 "$PKG/make-chunks.py" "$BASE/q" $B || exit 1
for k in 1 2 3 4; do echo "  TEST2 refresh-$k: $($PSQL -d test2 -At -F ' ' -f "$BASE/q/refresh-$k.sql")"; done

dump() { $PSQL -d "$1" -At -c "select slug, template_type, status, coalesce(redirect_to,'∅'), in_sitemap, url_path, coalesce(array_to_string(related_slugs, ','),'∅'), coalesce(gsc_impressions::text,'∅') from content_pages order by slug"; }
if diff <(dump ref) <(dump test) > "$BASE/d1"; then ok "TEST equals REF on every column but updated_at ($(dump ref | wc -l) rows)"; else bad "TEST differs from REF"; head -20 "$BASE/d1"; fi
if diff <(dump ref) <(dump test2) > "$BASE/d1b"; then ok "TEST2 (quartile split) equals REF too"; else bad "TEST2 differs from REF"; head -20 "$BASE/d1b"; fi

# updated_at: the set of rows whose updated_at moved must be the same in REF and TEST
seedts() { $PSQL -d seed -At -c "select slug||' '||updated_at from content_pages order by slug"; }
moved() { $PSQL -d "$1" -At -c "select slug||' '||updated_at from content_pages order by slug" | diff - <(seedts) | grep '^<' | awk '{print $2}'; }
if diff <(moved ref) <(moved test) >/dev/null; then ok "same rows have a new updated_at in REF and TEST ($(moved test | wc -l) rows: 29 dups + $total_changed related refreshes)"; else bad "updated_at moved on different rows"; diff <(moved ref) <(moved test) | head; fi

# apply.sql outputs and guards
echo "  apply.sql summary (backup_rows, related_backup_rows, redirect_rows_now, dups_redirected): $(tr -s ' \n' ' ' < "$BASE/apply.out")"
[ "$($PSQL -d test -At -c "select count(*) from seo_repair.content_pages_city_dupes_20261119")" = 29 ] && ok "backup holds 29 rows" || bad "backup count"
[ "$($PSQL -d test -At -c "select count(*) from content_pages c where c.status='published' and c.template_type='host_acq_city' and c.related_slugs && (select array_agg(slug) from seo_repair.content_pages_city_dupes_20261119)")" = 0 ] && ok "no published page lists a dup in related_slugs" || bad "a page still lists a dup"
[ "$($PSQL -d test -At -c "select count(*) from content_pages c where c.template_type='host_acq_city' and c.status='published' and c.redirect_to is null and c.related_slugs is distinct from compute_related_city_slugs(c.slug, c.template_type)")" = 0 ] && ok "a full refresh now changes nothing" || bad "full refresh would still change rows"
for r in anon authenticated service_role; do
  [ "$($PSQL -d test -At -c "select has_table_privilege('$r','seo_repair.content_pages_city_dupes_20261119','select') or has_table_privilege('$r','seo_repair.content_pages_related_20261119','select') or has_schema_privilege('$r','seo_repair','usage')")" = f ] && ok "$r has no access to the backups" || bad "$r can read a backup"
done

# body-links.sql: refusals first (each on a copy), then the run on TEST against the Python rewrite
bodies() { $PSQL -d "$1" -At -c "select slug||'|'||coalesce(body_markdown,'∅')||'|'||coalesce(content,'∅') from content_pages where body_markdown is not null or content is not null" | LC_ALL=C sort; }
ts() { $PSQL -d "$1" -At -c "select slug||' '||updated_at from content_pages" | LC_ALL=C sort; }
read -r EP EL <<< "$(python3 "$HERE/expect_bodies.py" "$BASE/seed.json" counts)"
sed "s/^insert into _expect values (27, 28); -- EXPECT$/insert into _expect values ($EP, $EL); -- EXPECT/" "$PKG/body-links.sql" > "$BASE/body-links.sql"
grep -q "values ($EP, $EL); -- EXPECT" "$BASE/body-links.sql" && [ "$(diff "$PKG/body-links.sql" "$BASE/body-links.sql" | grep -c '^[<>]')" = 2 ] \
  && ok "test copy of body-links.sql differs only in the expected counts ($EP pages, $EL links)" || bad "could not set the test's expected counts"
$PSQL -d postgres -c "create database bodypre template seed" -c "create database bodyguard template test" >/dev/null
before=$(bodies bodypre | md5sum)
if $PSQL -d bodypre -f "$BASE/body-links.sql" > "$BASE/bp.out" 2>&1; then bad "body-links ran before apply.sql"; else grep -q 'run apply.sql first' "$BASE/bp.out" && ok "body-links refuses before apply.sql" || { bad "unexpected body-links error"; cat "$BASE/bp.out"; }; fi
[ "$(bodies bodypre | md5sum)" = "$before" ] && [ -z "$($PSQL -d bodypre -At -c "select to_regclass('seo_repair.content_pages_body_links_20261119')")" ] && ok "  ...and leaves no change and no backup table" || bad "refused body-links (before apply) left something behind"
before=$(bodies bodyguard | md5sum)
if $PSQL -d bodyguard -f "$PKG/body-links.sql" > "$BASE/bg.out" 2>&1; then bad "body-links ran with the wrong expected counts"; else grep -q "found $EL links on $EP pages, expected 28 on 27" "$BASE/bg.out" && ok "body-links refuses when the counts differ from what it expects" || { bad "unexpected body-links error"; cat "$BASE/bg.out"; }; fi
[ "$(bodies bodyguard | md5sum)" = "$before" ] && [ -z "$($PSQL -d bodyguard -At -c "select to_regclass('seo_repair.content_pages_body_links_20261119')")" ] && ok "  ...and leaves no change and no backup table" || bad "refused body-links (wrong counts) left something behind"
ts_before=$(ts test); related_before=$(dump test | md5sum)
$PSQL -d test -f "$BASE/body-links.sql" > "$BASE/body.out" || { cat "$BASE/body.out"; exit 1; }
echo "  body-links.sql summary: $(tr -s ' \n' ' ' < "$BASE/body.out")"
if diff <(bodies test) <(python3 "$HERE/expect_bodies.py" "$BASE/seed.json" dump | LC_ALL=C sort) > "$BASE/d3"; then ok "page text after body-links.sql equals the independent Python rewrite (incl. santa-fe vs santa-fe-nm/-new-mexico, full URLs, ?query, #anchor, trailing slash, end of text, HTML)"; else bad "page text differs from the Python rewrite"; cat "$BASE/d3"; fi
moved_b=$(diff <(echo "$ts_before") <(ts test) | grep '^>' | awk '{print $2}' | LC_ALL=C sort)
[ "$moved_b" = "$(python3 "$HERE/expect_bodies.py" "$BASE/seed.json" changed | LC_ALL=C sort)" ] && ok "updated_at moved on exactly the $EP rewritten pages" || { bad "updated_at moved on other rows"; echo "$moved_b"; }
[ "$(dump test | md5sum)" = "$related_before" ] && ok "body-links.sql changed no status, redirect, sitemap flag or related_slugs" || bad "body-links.sql changed another column"
both=$($PSQL -d test -At -c "select count(*) from seo_repair.content_pages_body_links_20261119 b join seo_repair.content_pages_related_20261119 r on r.id = b.id join content_pages c on c.id = b.id where c.related_slugs is distinct from r.related_slugs")
[ "$both" -ge 2 ] && ok "$both rewritten pages were also changed by the refresh (the undo covers both)" || bad "no page is changed by both steps ($both)"
[ "$($PSQL -d test -At -c "select count(*) from seo_repair.content_pages_body_links_20261119 where new_body_markdown is not distinct from body_markdown and new_content is not distinct from content")" = 0 ] && ok "the backup records the text before and after for every rewritten page" || bad "backup after-text missing"
for r in anon authenticated service_role; do
  [ "$($PSQL -d test -At -c "select has_table_privilege('$r','seo_repair.content_pages_body_links_20261119','select')")" = f ] || bad "$r can read the body backup"
done; ok "no API role can read the body backup"
before=$(bodies test | md5sum)
if $PSQL -d test -f "$BASE/body-links.sql" >/dev/null 2>&1; then bad "second body-links run succeeded"; else ok "second body-links run refuses"; fi
[ "$(bodies test | md5sum)" = "$before" ] && ok "  ...and changes nothing" || bad "second body-links run changed text"
v=$($PSQL -d test -At -F ' ' -f "$PKG/verify.sql")
echo "  verify.sql (backup, redirects, redirected, related links, text links, text pages, keepers): $v"
set -- $v; [ "$1 $4 $5" = "29 0 0" ] && [ "$6" = "$EP" ] && ok "verify.sql: 29 backed up, 0 related links and 0 text links to a dup, $EP text pages" || bad "verify.sql numbers"

# Guard: a row that redirects to '/p/<dup>' (not a bare slug) makes apply refuse
$PSQL -d postgres -c "create database chain template seed" >/dev/null
$PSQL -d chain -c "alter table content_pages disable trigger user; update content_pages set redirect_to='/p/become-a-swimming-pool-host-plano' where slug='become-a-swimming-pool-host-old0-tx'; alter table content_pages enable trigger user;" >/dev/null
if $PSQL -d chain -f "$PKG/apply.sql" > "$BASE/chain.out" 2>&1; then bad "apply ran with a /p/<dup> redirect in place"; else grep -q 'would chain' "$BASE/chain.out" && ok "apply refuses when a row already redirects to /p/<dup>" || { bad "unexpected chain-guard error"; cat "$BASE/chain.out"; }; fi

# Guard: a second run of apply.sql must fail (backup table exists) and change nothing
before=$(dump test | md5sum)
if $PSQL -d test -f "$PKG/apply.sql" >/dev/null 2>&1; then bad "second apply.sql run succeeded"; else ok "second apply.sql run refuses"; fi
[ "$(dump test | md5sum)" = "$before" ] && ok "refused run changed nothing" || bad "refused run changed data"

# Guard: a keeper that is no longer live makes apply refuse, with nothing written
$PSQL -d postgres -c "create database guard template seed" >/dev/null
$PSQL -d guard -c "alter table content_pages disable trigger tg_host_acq_related_refresh; update content_pages set in_sitemap=false where slug='become-a-swimming-pool-host-plano-tx'; alter table content_pages enable trigger tg_host_acq_related_refresh;" >/dev/null
if $PSQL -d guard -f "$PKG/apply.sql" > "$BASE/guard.out" 2>&1; then bad "apply ran with a non-sitemapped keeper"; else grep -q 'live, sitemapped keeper' "$BASE/guard.out" && ok "apply refuses when a keeper is not live (28 of 29)" || { bad "unexpected guard error"; cat "$BASE/guard.out"; }; fi
[ "$($PSQL -d guard -At -c "select count(*) from content_pages where status='redirect'")" = 6 ] && [ -z "$($PSQL -d guard -At -c "select to_regclass('seo_repair.content_pages_city_dupes_20261119')")" ] && ok "refused apply left no change and no backup table" || bad "refused apply left something behind"

# rollback-body.sql refuses if a rewritten page was edited after body-links.sql (on a copy)
$PSQL -d postgres -c "create database rbguard template test" >/dev/null
first=$(python3 "$HERE/expect_bodies.py" "$BASE/seed.json" changed | head -1)
$PSQL -d rbguard -c "update content_pages set body_markdown = body_markdown || ' (edited later)' where slug = '$first'" >/dev/null
before=$(bodies rbguard | md5sum)
if $PSQL -d rbguard -f "$PKG/rollback-body.sql" > "$BASE/rbg.out" 2>&1; then bad "rollback-body overwrote a later edit"; else grep -q 'edited after body-links.sql' "$BASE/rbg.out" && ok "rollback-body refuses when a page was edited after body-links.sql" || { bad "unexpected rollback-body error"; cat "$BASE/rbg.out"; }; fi
[ "$(bodies rbguard | md5sum)" = "$before" ] && ok "  ...and changes nothing" || bad "refused rollback-body changed text"

# rollback-body.sql refuses once rollback.sql has run (wrong order), on a copy
$PSQL -d postgres -c "create database order_guard template test" >/dev/null
$PSQL -d order_guard -f "$PKG/rollback.sql" >/dev/null || exit 1
if $PSQL -d order_guard -f "$PKG/rollback-body.sql" > "$BASE/og.out" 2>&1; then bad "rollback-body ran after rollback.sql"; else grep -q 'run this before rollback.sql' "$BASE/og.out" && ok "rollback-body refuses after rollback.sql (wrong order)" || { bad "unexpected order-guard error"; cat "$BASE/og.out"; }; fi

# Rollback: rollback-body.sql then rollback.sql; TEST must equal the seed exactly, page text and updated_at included
$PSQL -d test -f "$PKG/rollback-body.sql" > "$BASE/rbb.out" || { cat "$BASE/rbb.out"; exit 1; }
$PSQL -d test -f "$PKG/rollback.sql" > "$BASE/rb.out" || { cat "$BASE/rb.out"; exit 1; }
full() { $PSQL -d "$1" -At -c "select slug, status, coalesce(redirect_to,'∅'), in_sitemap, coalesce(array_to_string(related_slugs, ','),'∅'), md5(coalesce(body_markdown,'∅')||'|'||coalesce(content,'∅')), updated_at from content_pages order by slug"; }
if diff <(full seed) <(full test) > "$BASE/d2"; then ok "rollback-body.sql + rollback.sql restore the seeded state exactly (text, related_slugs, updated_at)"; else bad "rollback differs from seed"; head "$BASE/d2"; fi

[ $fail = 0 ] && echo "ALL PASS" || { echo "FAILED"; exit 1; }
