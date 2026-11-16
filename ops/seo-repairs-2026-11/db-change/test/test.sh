#!/usr/bin/env bash
# Local test of the SEO content repair on a throwaway PostgreSQL 16 cluster.
# Starts a private cluster (unprivileged user "postgres", data under /tmp, port 55439, unix socket only), runs
# test_repair.py, then stops the cluster and deletes its directory whatever happened. Exits non-zero on any failure.
# Usage (as root or as the postgres user):  bash ops/seo-repairs-2026-11/db-change/test/test.sh
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
PGBIN=/usr/lib/postgresql/16/bin
PORT=55439
BASE="$(mktemp -d /tmp/seo_repair_pg.XXXXXX)"
export SEO_TEST_WORK="$BASE/work"

as_pg() { if [ "$(id -un)" = postgres ]; then "$@"; else runuser -u postgres -- "$@"; fi; }

cleanup() {
  as_pg "$PGBIN/pg_ctl" -D "$BASE/data" -m fast -w stop >/dev/null 2>&1 || true
  rm -rf "$BASE"
  echo "cluster stopped; $BASE removed"
}
trap cleanup EXIT

chown postgres:postgres "$BASE" 2>/dev/null || true
as_pg "$PGBIN/initdb" -D "$BASE/data" -E UTF8 --locale=C.UTF-8 -U postgres -A trust >/dev/null || exit 1
as_pg "$PGBIN/pg_ctl" -D "$BASE/data" -o "-p $PORT -k $BASE -c listen_addresses=''" -l "$BASE/server.log" -w start >/dev/null || exit 1
export PGHOST="$BASE" PGPORT="$PORT" PGUSER=postgres
echo "PostgreSQL: $(psql -X -At -d postgres -c 'select version()')"
echo "cluster: $BASE (port $PORT, unix socket only)"
python3 "$HERE/test_repair.py"
rc=$?
echo "test exit code: $rc"
exit $rc
