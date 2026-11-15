#!/usr/bin/env bash
# PRNM pSEO inventory refresh (audit fix F13). Invoked only by cron via flock.
# Calls the existing, deployed hook; adds no new ingestion path.
set -uo pipefail

ENV_FILE=/home/ubuntu/fresh-web/.env
STOP_FILE=/home/ubuntu/locks/LISTING_SYNC_STOP
TS() { date -u '+%Y-%m-%dT%H:%M:%SZ'; }

# Kill switch: `touch` the stop file to halt the schedule without editing cron.
if [ -f "$STOP_FILE" ]; then
  echo "$(TS) skip: STOP file present"
  exit 0
fi

TOKEN=$(grep -m1 '^SUPABASE_SERVICE_ROLE_KEY=' "$ENV_FILE" | cut -d= -f2-)
if [ -z "$TOKEN" ]; then
  echo "$(TS) FAIL: no admin token in $ENV_FILE"
  exit 1
fi

# The token is passed on stdin-free curl args only inside this process and is
# never echoed or logged; only the JSON result line is logged.
BODY=$(curl -sS --max-time 300 -w '\nHTTP=%{http_code}' \
  -X POST -H "x-admin-token: $TOKEN" \
  http://127.0.0.1:3000/api/public/hooks/sync-listings)

CODE=$(printf '%s' "$BODY" | sed -n 's/.*HTTP=\([0-9]*\)$/\1/p')
JSON=$(printf '%s' "$BODY" | sed '$d')

if [ "$CODE" != "200" ]; then
  echo "$(TS) FAIL http=$CODE $JSON"
  exit 1
fi
echo "$(TS) ok $JSON"
