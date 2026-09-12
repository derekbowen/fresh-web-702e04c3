#!/usr/bin/env bash
# deploy-east.sh — the only sanctioned way to move EAST's fresh-web forward.
#
# It fails closed, in this order, and never touches the live process until
# every gate before it has passed:
#
#   1. the working tree must be clean            -> production always has a real SHA
#   2. build (npm postbuild stamps dist/client/fw-assets/__build.json)
#   3. the stamp must equal HEAD and be dirty=0  -> the stamp is honest
#   4. smoke the new build on a spare port with .env loaded
#   5. pm2 restart
#   6. production must report HEAD at /fw-assets/__build.json
#   7. verify:production (the four live invariants)
#   8. only now write .deployed-sha               -> it is an attestation
#   9. check:production-drift as the closing gate
#
# Any failure from step 5 onward restores the previous dist/ and restarts, so an
# abort leaves production on the last verified build.
#
# Usage:  sudo -u ubuntu ops/deploy-east.sh
#         ROLLBACK=1 ops/deploy-east.sh      # restore the previous dist and exit
set -euo pipefail

REPO="${REPO_DIR:-/home/ubuntu/fresh-web}"
BASE="${BASE_URL:-https://www.poolrentalnearme.com}"
SMOKE_PORT="${SMOKE_PORT:-3005}"
PM2="sudo -u ubuntu PM2_HOME=/home/ubuntu/.pm2 pm2"
GIT="git -c safe.directory=$REPO -C $REPO"
STAMP="$REPO/dist/client/fw-assets/__build.json"
PREV="$REPO/dist-prev-deploy"

cd "$REPO"
say() { printf '\n=== %s\n' "$*"; }
die() { printf '\nABORT: %s\n' "$*" >&2; exit 1; }

restore_dist() {
  if [ -d "$PREV" ]; then
    say "restoring previous dist/ and restarting"
    rm -rf "$REPO/dist"
    mv "$PREV" "$REPO/dist"
    $PM2 restart fresh-web --update-env >/dev/null
  fi
}

if [ "${ROLLBACK:-}" = "1" ]; then
  restore_dist
  echo "rolled back."
  exit 0
fi

# ---- 1. clean tree ---------------------------------------------------------
say "1. working tree"
DIRTY=$($GIT status --porcelain | grep -vE '(^.. (dist|node_modules|\.tanstack|dist-server-bak|dist\.bak)/|\.bak|\.v2bak|\.log$|\.deployed-sha$|\.env|dump\.pm2)' || true)
if [ -n "$DIRTY" ]; then
  echo "$DIRTY"
  die "uncommitted source changes. Commit them first — a deploy must have a SHA that describes what it ships."
fi
HEAD=$($GIT rev-parse HEAD)
TREE=$($GIT rev-parse 'HEAD^{tree}')
echo "clean at $HEAD (tree $TREE)"

# ---- 2. build --------------------------------------------------------------
say "2. build"
[ -d "$REPO/dist" ] && { rm -rf "$PREV"; cp -a "$REPO/dist" "$PREV"; echo "previous dist/ saved to $PREV"; }
npm run build

# ---- 3. the stamp must be honest -------------------------------------------
say "3. build stamp"
[ -f "$STAMP" ] || { restore_dist; die "no $STAMP — postbuild did not run"; }
S_SHA=$(node -e "process.stdout.write(require('$STAMP').sha)")
S_DIRTY=$(node -e "process.stdout.write(String(require('$STAMP').dirty))")
echo "stamp sha=$S_SHA dirty=$S_DIRTY"
[ "$S_SHA" = "$HEAD" ] || { restore_dist; die "stamp $S_SHA != HEAD $HEAD"; }
[ "$S_DIRTY" = "0" ]   || { restore_dist; die "stamp reports $S_DIRTY dirty source file(s)"; }

# ---- 4. smoke on a spare port ----------------------------------------------
say "4. smoke on :$SMOKE_PORT"
PORT=$SMOKE_PORT node --env-file="$REPO/.env" "$REPO/serve.mjs" &
SMOKE_PID=$!
trap 'kill $SMOKE_PID 2>/dev/null || true' EXIT
for i in $(seq 1 40); do
  sleep 1
  curl -fsS "http://127.0.0.1:$SMOKE_PORT/fw-assets/__build.json" >/dev/null 2>&1 && break
  [ "$i" = "40" ] && { kill $SMOKE_PID 2>/dev/null || true; restore_dist; die "smoke server never came up"; }
done
# EAST-served routes only. /s and /l/* belong to the marketplace on WEST and
# are 404 here by design — smoking them would abort every deploy.
for p in / /p/pool-host-tools /p/corpus-christi-pool-rental-laws; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$SMOKE_PORT$p")
  echo "  $p -> $code"
  [ "$code" = "200" ] || { kill $SMOKE_PID 2>/dev/null || true; restore_dist; die "smoke $p returned $code"; }
done
kill $SMOKE_PID 2>/dev/null || true
trap - EXIT

# ---- 5. flip ---------------------------------------------------------------
say "5. restart fresh-web"
$PM2 restart fresh-web --update-env
for i in $(seq 1 40); do
  sleep 1
  curl -fsS "$BASE/fw-assets/__build.json" >/dev/null 2>&1 && break
done

# ---- 6. production must report HEAD ----------------------------------------
say "6. production reports its SHA"
BASE_URL="$BASE" EXPECTED_SHA="$HEAD" npm run --silent check:deployed-sha \
  || { restore_dist; die "production is not serving $HEAD"; }

# ---- 7. live invariants ----------------------------------------------------
say "7. verify:production"
BASE_URL="$BASE" npm run --silent verify:production \
  || { restore_dist; die "verify:production failed against the new build"; }

# ---- 8. attest -------------------------------------------------------------
say "8. record the verified deploy"
cat > "$REPO/.deployed-sha" <<JSON
{
  "sha": "$HEAD",
  "tree": "$TREE",
  "verify": "pass",
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "deployedBy": "$(whoami)@$(hostname)",
  "base": "$BASE"
}
JSON
cat "$REPO/.deployed-sha"

# ---- 9. closing gate -------------------------------------------------------
say "9. check:production-drift"
BASE_URL="$BASE" npm run --silent check:production-drift \
  || { restore_dist; die "drift check failed after deploy"; }

rm -rf "$PREV"
say "DEPLOYED $HEAD — verified and recorded."
