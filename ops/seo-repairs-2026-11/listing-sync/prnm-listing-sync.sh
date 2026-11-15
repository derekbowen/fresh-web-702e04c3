#!/usr/bin/env bash
# PRNM pSEO inventory refresh (audit fix F13). Invoked only by cron via flock.
# Calls the existing, deployed hook; adds no new ingestion path.
set -uo pipefail

ENV_FILE=${PRNM_ENV_FILE:-/home/ubuntu/fresh-web/.env}
STOP_FILE=${PRNM_STOP_FILE:-/home/ubuntu/locks/LISTING_SYNC_STOP}
TS() { date -u '+%Y-%m-%dT%H:%M:%SZ'; }

# Kill switch: `touch` the stop file to halt the schedule without editing cron.
if [ -f "$STOP_FILE" ]; then
  echo "$(TS) skip: STOP file present"
  exit 0
fi

# Same precedence as authorizeHookRequest (src/server/hook-auth.server.ts):
# the hook accepts exactly one env token, the first one that is set.
env_value() {
  grep -m1 "^$1=" "$ENV_FILE" | cut -d= -f2- | sed -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/"
}
TOKEN=$(env_value HOOKS_ADMIN_TOKEN)
[ -n "$TOKEN" ] || TOKEN=$(env_value BACKFILL_ADMIN_TOKEN)
[ -n "$TOKEN" ] || TOKEN=$(env_value SUPABASE_SERVICE_ROLE_KEY)
if [ -z "$TOKEN" ]; then
  echo "$(TS) FAIL: no admin token in $ENV_FILE"
  exit 1
fi

# The header is read from stdin, so the token never appears in the process
# list or in a log; only the JSON result line is logged.
BODY=$(printf 'x-admin-token: %s\n' "$TOKEN" | curl -sS --max-time 300 -w '\nHTTP=%{http_code}' \
  -X POST -H @- \
  "${SYNC_URL:-http://127.0.0.1:3000/api/public/hooks/sync-listings}")

CODE=$(printf '%s' "$BODY" | sed -n 's/.*HTTP=\([0-9]*\)$/\1/p')
JSON=$(printf '%s' "$BODY" | sed '$d')

if [ "$CODE" != "200" ]; then
  echo "$(TS) FAIL http=$CODE $JSON"
  exit 1
fi
echo "$(TS) ok $JSON"
