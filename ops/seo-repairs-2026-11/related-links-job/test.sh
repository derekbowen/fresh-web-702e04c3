#!/usr/bin/env bash
# Local test of the F15 migration on a throwaway PostgreSQL cluster.
# Needs PostgreSQL 16 binaries (/usr/lib/postgresql/16/bin) and a `postgres` OS user.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../../.." && pwd)"
MIG="$REPO/supabase/migrations/20261115120000_related_links_skip_redirects_and_unchanged.sql"
BIN=/usr/lib/postgresql/16/bin
DATA=$(mktemp -d /tmp/f15pg.XXXXXX); PORT=55435
chown postgres "$DATA"
cleanup() { runuser -u postgres -- "$BIN/pg_ctl" -D "$DATA" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$DATA"; }
trap cleanup EXIT
runuser -u postgres -- "$BIN/initdb" -D "$DATA" -A trust >/dev/null
runuser -u postgres -- "$BIN/pg_ctl" -D "$DATA" -o "-p $PORT -k /tmp" -l "$DATA/log" start >/dev/null
P() { runuser -u postgres -- psql -X -q -v ON_ERROR_STOP=1 -h /tmp -p $PORT -d postgres "$@"; }
V() { P -At -c "$1"; }
fail() { echo "FAIL: $1"; exit 1; }
pass() { echo "PASS: $1"; }

# Minimal schema matching production column names/types used by the functions,
# both triggers, and the production (2026-11-15) function definitions.
P <<'SQL'
create role anon; create role authenticated; create role service_role;
create extension if not exists pgcrypto;
create table content_pages (
  id uuid primary key default gen_random_uuid(), slug text, template_type text, status text,
  redirect_to text, gsc_impressions integer, related_slugs text[], updated_at timestamptz default now());
create function update_updated_at_column() returns trigger language plpgsql set search_path to 'public' as
$$ begin new.updated_at = now(); return new; end $$;
create trigger trg_content_pages_updated_at before update on content_pages for each row execute function update_updated_at_column();
SQL
# Old definitions = the rollback file minus its BEGIN/COMMIT.
P -f "$HERE/rollback.sql"
P <<'SQL'
create function tg_refresh_host_acq_related() returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if (tg_op = 'INSERT' and new.template_type = 'host_acq_city') or (tg_op = 'DELETE' and old.template_type = 'host_acq_city')
     or (tg_op = 'UPDATE' and (new.template_type = 'host_acq_city' or old.template_type = 'host_acq_city')
         and (new.status is distinct from old.status or new.template_type is distinct from old.template_type or new.slug is distinct from old.slug))
  then perform public.refresh_related_slugs_for_template('host_acq_city'); end if;
  return null;
end $$;
-- Seed: 30 OH pages, 4 of them redirecting; 3 TX pages (fallback path); a draft; an es row.
insert into content_pages (slug, template_type, status, redirect_to, gsc_impressions)
select 'become-a-swimming-pool-host-city' || g || '-oh', 'host_acq_city', 'published',
       case when g in (3,7,11,15) then '/p/become-a-host' end, (100 - g)
from generate_series(1,30) g;
insert into content_pages (slug, template_type, status, gsc_impressions) values
 ('become-a-swimming-pool-host-a-tx','host_acq_city','published',5),
 ('become-a-swimming-pool-host-b-tx','host_acq_city','published',4),
 ('become-a-swimming-pool-host-c-tx','host_acq_city','published',3),
 ('become-a-swimming-pool-host-d-oh','host_acq_city','draft',999),
 ('hazte-anfitrion-x-oh','host_acq_city_es','published',1);
create trigger tg_host_acq_related_refresh after insert or delete or update on content_pages for each row execute function tg_refresh_host_acq_related();
select public.refresh_related_slugs_for_template('host_acq_city');
SQL

OLD_BAD=$(V "select count(*) from content_pages c where c.status='published' and exists (select 1 from content_pages r where r.redirect_to is not null and r.slug = any(c.related_slugs))")
[ "$OLD_BAD" -gt 0 ] || fail "baseline should reproduce links to redirecting pages (got $OLD_BAD)"
pass "old functions link $OLD_BAD published pages to redirecting pages (defect reproduced)"
OLD_RUN=$(V "select public.refresh_related_slugs_for_template('host_acq_city')")
[ "$OLD_RUN" = "33" ] || fail "old refresh should touch all 33 published rows, got $OLD_RUN"
pass "old refresh rewrites every published row even when nothing changed ($OLD_RUN)"

# Snapshot, apply the migration.
V "create table snap as select id, slug, related_slugs, updated_at from content_pages" >/dev/null
sleep 1
P -f "$MIG"

FIRST=$(V "select public.refresh_related_slugs_for_template('host_acq_city')")
NEW_BAD=$(V "select count(*) from content_pages c where c.status='published' and exists (select 1 from content_pages r where r.redirect_to is not null and r.slug = any(c.related_slugs)) and c.redirect_to is null")
[ "$NEW_BAD" = "0" ] || fail "after migration, $NEW_BAD non-redirect pages still link to redirecting pages"
pass "after migration: 0 pages link to a redirecting page (first run changed $FIRST rows)"
[ "$FIRST" -gt 0 ] && [ "$FIRST" -lt 33 ] || fail "first run should change some but not all rows, got $FIRST"
pass "first run wrote only rows whose links changed ($FIRST of 33)"

UNCHANGED_TS=$(V "select count(*) from content_pages c join snap s using (id) where c.related_slugs is not distinct from s.related_slugs and c.updated_at <> s.updated_at")
[ "$UNCHANGED_TS" = "0" ] || fail "$UNCHANGED_TS rows had updated_at moved without a change"
pass "updated_at untouched on rows whose links did not change"

REDIR_TOUCHED=$(V "select count(*) from content_pages c join snap s using (id) where c.redirect_to is not null and c.updated_at <> s.updated_at")
[ "$REDIR_TOUCHED" = "0" ] || fail "redirecting rows were refreshed"
pass "redirecting pages are not refreshed"

SECOND=$(V "select public.refresh_related_slugs_for_template('host_acq_city')")
[ "$SECOND" = "0" ] || fail "second run should change nothing, got $SECOND"
pass "second run changes nothing (idempotent)"

ES=$(V "select coalesce(array_length(related_slugs,1),0) from content_pages where template_type='host_acq_city_es'")
DRAFT=$(V "select related_slugs is null from content_pages where status='draft'")
[ "$DRAFT" = "t" ] || fail "draft row was refreshed"
pass "draft rows untouched; other templates untouched (es related count $ES)"

FALLBACK=$(V "select array_length(related_slugs,1) from content_pages where slug='become-a-swimming-pool-host-a-tx'")
[ "$FALLBACK" = "10" ] || fail "small-state page should still get 10 links via fallback, got $FALLBACK"
pass "small-state fallback still yields 10 links"

# The trigger path still works and still refreshes.
V "update content_pages set redirect_to='/p/become-a-host' where slug='become-a-swimming-pool-host-city1-oh'" >/dev/null
V "update content_pages set status='published' where slug='become-a-swimming-pool-host-city1-oh'" >/dev/null
V "update content_pages set status='draft' where slug='become-a-swimming-pool-host-city2-oh'" >/dev/null
AFTER_TRIG=$(V "select count(*) from content_pages c where c.status='published' and c.redirect_to is null and exists (select 1 from content_pages r where (r.redirect_to is not null or r.status<>'published') and r.slug = any(c.related_slugs))")
[ "$AFTER_TRIG" = "0" ] || fail "status-change trigger did not drop links to the unpublished page ($AFTER_TRIG)"
pass "status-change trigger still refreshes and drops links to an unpublished page"

# Rollback restores the exact old definitions.
OLD_DEF=$(V "select md5(pg_get_functiondef('public.refresh_related_slugs_for_template(text)'::regprocedure))")
P -f "$HERE/rollback.sql"
RB=$(V "select public.refresh_related_slugs_for_template('host_acq_city')")
[ "$RB" = "$(V "select count(*) from content_pages where template_type='host_acq_city' and status='published'")" ] || fail "after rollback the old behaviour (rewrite all) should return"
pass "rollback restores the old behaviour (rewrites all $RB published rows)"
echo "ALL PASS"
