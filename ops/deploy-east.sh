#!/usr/bin/env bash
# deploy-east.sh — the only sanctioned way to move EAST's fresh-web forward.
#
# It fails closed, in this order, and never touches the live process until
# every gate before it has passed:
#
#   1. the working tree must be clean            -> production always has a real SHA
#   1a. stage a build copy of the tree next to the repo ($BUILD_DIR, default
#       <repo>.build). Steps 1b-4 run there, so the live dist/ is untouched until
#       step 5. (vite empties its output dir first; building in place left the
#       live process without its assets for the whole build.)
#   1b. typecheck                                -> `vite build` never typechecks,
#       so an undefined identifier used to reach production and throw at render
#   2. build (npm postbuild stamps dist/client/fw-assets/__build.json)
#   3. the stamp must equal HEAD and be dirty=0  -> the stamp is honest
#   4. smoke the new build on a spare port with .env loaded, asserting CONTENT
#       (an <h1> and real markup) and not merely a 200 — a page that throws
#       during render still answers 200 with a well-formed shell
#   5. carry the previous build's hashed assets into the new one (Cloudflare holds
#      / and /p/* HTML naming them for 600 s), swap dist/ by rename, pm2 restart,
#      and PROVE the restart (pm2 reports fresh-web online with a new pid/uptime)
#   6. production must report HEAD at /fw-assets/__build.json
#   7. verify:production (the live invariants) + check:price-variants
#   8. only now write .deployed-sha               -> it is an attestation
#   9. check:production-drift as the closing gate
#
# A failure before step 5 removes the build copy and leaves production as it was.
# A failure from step 5 on puts the previous dist/ back and restarts (proven), so
# an abort leaves production on the last verified build; if that restore cannot be
# proven the ABORT line says so.
#
# Restart proof. The live stamp cannot prove a restart: serve.mjs reads
# __build.json (and every static file) from disk on each request, so the stamp shows
# whatever dist/ holds, even while the process still runs the previous server bundle.
# pm2 itself is the witness: fresh-web must be online with a different pid/uptime.
#
# The restart is a plain `pm2 restart fresh-web`, not `--update-env`: a code release
# changes no environment, and --update-env would merge this shell's variables into the
# live process without updating dump.pm2 (CLAUDE.md "EAST runtime env").
#
# EAST-only files. EAST carries a few files that exist only on the box and are
# never shipped from a repo. They may be dirty only when the pin file
# ($EAST_ONLY_SHA256, default <repo>.east-only.sha256 NEXT TO the repo, outside
# the tree) lists them as "<sha256>  <path>" lines (sha256sum format) AND each
# one's current sha256 equals its pin. Every pinned file must be dirty, every
# dirty file must be pinned, and the build stamp must list exactly that set.
# Without a pin file the rule is the old one: any dirty source file aborts.
#
# NODE_OPTIONS from the caller applies to the typecheck and the build only (EAST
# needs --max-old-space-size=3072; that heap does not fit every box, so it is not
# hard-coded). It is unset for everything else (the smoke server, the checks), so a
# build heap never reaches anything that runs after the build.
#
# Usage:  sudo -u ubuntu ops/deploy-east.sh
#         ROLLBACK=1 ops/deploy-east.sh      # restore the previous dist, prove the restart, exit
set -euo pipefail

REPO="${REPO_DIR:-/home/ubuntu/fresh-web}"
BASE="${BASE_URL:-https://www.poolrentalnearme.com}"
SMOKE_PORT="${SMOKE_PORT:-3005}"
PM2="sudo -u ubuntu PM2_HOME=/home/ubuntu/.pm2 pm2"
GIT="git -c safe.directory=$REPO -C $REPO"
STAMP="$REPO/dist/client/fw-assets/__build.json"
PREV="$REPO/dist-prev-deploy"
BUILD="${BUILD_DIR:-$(dirname "$REPO")/$(basename "$REPO").build}"
BSTAMP="$BUILD/dist/client/fw-assets/__build.json"
SWAPPED=0
PINS="${EAST_ONLY_SHA256:-$(dirname "$REPO")/$(basename "$REPO").east-only.sha256}"
BUILD_NODE_OPTIONS="${NODE_OPTIONS:-}"
unset NODE_OPTIONS

cd "$REPO"
say() { printf '\n=== %s\n' "$*"; }
die() { printf '\nABORT: %s\n' "$*" >&2; exit 1; }

# fresh-web as pm2 sees it: "<status> <pid> <restart_time> <pm_uptime>". `pm2 jlist`
# carries the process environment, so it is parsed here and never printed.
pm2_gen() {
  $PM2 jlist 2>/dev/null | node -e '
    let s = ""; process.stdin.on("data", (d) => (s += d)).on("end", () => {
      try {
        const j = s.split("\n").filter((l) => l.startsWith("[{") || l.trim() === "[]").pop();  // not a "[PM2] ..." notice
        const p = JSON.parse(j).find((x) => x.name === "fresh-web");
        const e = (p && p.pm2_env) || {};
        if (p) process.stdout.write([e.status, p.pid, e.restart_time, e.pm_uptime].join(" "));
      } catch {}
    });' 2>/dev/null || true
}

# Restart fresh-web and prove it happened (see "Restart proof" above).
restart_proven() {
  local before after i
  before=$(pm2_gen)
  if [ -z "$before" ]; then echo "  pm2 state unreadable before the restart: a restart could not be proven"; return 1; fi
  if ! $PM2 restart fresh-web >/dev/null; then echo "  pm2 restart fresh-web failed"; return 1; fi
  for i in $(seq 1 15); do
    after=$(pm2_gen)
    if [ "${after%% *}" = "online" ] && [ "$after" != "$before" ]; then
      echo "  pm2 fresh-web restarted: online, pid/uptime changed"; return 0
    fi
    sleep 2
  done
  echo "  pm2 restart NOT proven: before '${before:-none}' after '${after:-none}' (status pid restarts uptime)"
  return 1
}

# Only meaningful after the swap in step 5: the previous dist/ back, restart proven.
restore_dist() {
  [ -d "$PREV" ] || { echo "  no $PREV to restore"; return 1; }
  say "restoring previous dist/ and restarting"
  rm -rf "$REPO/dist" && mv "$PREV" "$REPO/dist" || return 1
  restart_proven
}

# Every failure from step 1a on ends here.
fail() {
  rm -rf "$BUILD"
  if [ "$SWAPPED" = 1 ]; then
    if restore_dist; then die "$* (previous dist/ restored, restart proven)"; fi
    die "$* — AND THE RESTORE IS NOT PROVEN: production may still run the new build. Run ROLLBACK=1 or restore by hand"
  fi
  die "$* (the live dist/ was never touched)"
}

if [ "${ROLLBACK:-}" = "1" ]; then
  [ -d "$PREV" ] || die "no $PREV: nothing to roll back to"
  restore_dist || die "rollback incomplete: the restart of fresh-web was not proven"
  echo "rolled back."
  exit 0
fi

# ---- 0. EAST-only pins (optional; see the header) ----------------------------
PINNED=""                     # "<sha256>  <path>" lines, validated
if [ -e "$PINS" ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in ''|'#'*) continue ;; esac
    if ! printf '%s\n' "$line" | grep -qE '^[0-9a-f]{64}  [A-Za-z0-9_][A-Za-z0-9_./@+-]*$'; then
      die "malformed line in $PINS (want '<sha256>  <relative path>'): $line"
    fi
    case "/${line:66}/" in */../*|*/./*|*//*) die "path in $PINS must be plain and relative: ${line:66}" ;; esac
    if printf '%s' "$PINNED" | cut -c67- | grep -qxF -- "${line:66}"; then die "duplicate path in $PINS: ${line:66}"; fi
    PINNED="$PINNED$line"$'\n'
  done < "$PINS"
fi
# Prints each pinned file under each given dir whose sha256 is not its pin (or that is
# missing); fails if any.
verify_pins() {
  local bad=0 want p have dir line
  for dir in "$@"; do
    while IFS= read -r line; do
      [ -n "$line" ] || continue
      want="${line:0:64}"; p="${line:66}"
      have=$(sha256sum -- "$dir/$p" 2>/dev/null | cut -c1-64 || true)
      if [ "$have" != "$want" ]; then echo "  pinned $p in $dir: sha256 ${have:-missing} != pin $want"; bad=1; fi
    done <<< "$PINNED"
  done
  return $bad
}

# ---- 1. clean tree ---------------------------------------------------------
say "1. working tree"
DIRTY=$($GIT status --porcelain | grep -vE '(^.. (dist|node_modules|\.tanstack|dist-server-bak|dist\.bak)/|\.bak|\.v2bak|\.log$|\.deployed-sha$|\.env|dump\.pm2)' || true)
TOLERATED=""                  # dirty paths that are pinned AND match their pin
UNTOLERATED=""
while IFS= read -r line; do
  [ -n "$line" ] || continue
  p="${line:3}"
  pin=$(printf '%s' "$PINNED" | awk -v p="$p" 'substr($0,67)==p {print substr($0,1,64)}')
  have=""
  if [ -n "$pin" ] && [ -f "$REPO/$p" ]; then have=$(sha256sum -- "$REPO/$p" | cut -c1-64); fi
  if [ -n "$pin" ] && [ "$have" = "$pin" ]; then
    TOLERATED="$TOLERATED$p"$'\n'
  else
    UNTOLERATED="$UNTOLERATED$line${pin:+   (pinned, but sha256 ${have:-missing} != pin)}"$'\n'
  fi
done <<< "$DIRTY"
if [ -n "$UNTOLERATED" ]; then
  printf '%s' "$UNTOLERATED"
  die "uncommitted source changes. Commit them first — a deploy must have a SHA that describes what it ships."
fi
TOLERATED=$(printf '%s' "$TOLERATED" | LC_ALL=C sort)
N_TOL=$(printf '%s' "$TOLERATED" | grep -c . || true)
N_PIN=$(printf '%s' "$PINNED" | grep -c . || true)
if [ "$N_TOL" != "$N_PIN" ]; then
  printf '%s' "$PINNED" | cut -c67- | LC_ALL=C sort | LC_ALL=C comm -23 - <(printf '%s\n' "$TOLERATED") | sed 's/^/  pinned but not dirty: /'
  die "$PINS pins $N_PIN file(s) but only $N_TOL are dirty and match — the pin file is stale"
fi
if [ "$N_TOL" -gt 0 ]; then
  export TOLERATED_DIRTY_FILES=$(printf '%s' "$TOLERATED" | paste -sd, -)
  printf '%s\n' "$TOLERATED" | sed 's/^/  tolerated (pinned EAST-only, sha256 matches): /'
fi
HEAD=$($GIT rev-parse HEAD)
TREE=$($GIT rev-parse 'HEAD^{tree}')
echo "clean at $HEAD (tree $TREE)${TOLERATED:+ + $N_TOL pinned EAST-only file(s)}"

# ---- 1a. build copy ----------------------------------------------------------
# Everything from here to step 4 happens in $BUILD, so the live dist/ (which serve.mjs
# reads on every request) is untouched until the swap in step 5. The copy carries the
# whole working tree, ignored files included (.env: vite bakes VITE_* in at build
# time), except git metadata, node_modules (symlinked) and dist/backup output. git in
# the copy reads the repo's own .git (GIT_DIR/GIT_WORK_TREE, no index writes), so the
# stamp sees the same HEAD and the same dirty set as the repo.
say "1a. build copy at $BUILD"
SMOKE_PID=""
# An unexpected exit (or a kill) before the swap must not leave the smoke server or
# the build copy behind; after the swap the copy is already gone.
trap '[ -z "$SMOKE_PID" ] || kill $SMOKE_PID 2>/dev/null || true; [ "$SWAPPED" = 1 ] || rm -rf "$BUILD"' EXIT
rm -rf "$BUILD"
mkdir -p "$BUILD"
for e in "$REPO"/* "$REPO"/.[!.]*; do
  [ -e "$e" ] || [ -L "$e" ] || continue
  case "$(basename "$e")" in
    .git|node_modules|dist|dist-*|dist.*|*.bak|*.bak.*|*.bak-*|*.v2bak|logs|log|.cache|.output|.vinxi|.nitro) continue ;;
  esac
  cp -a "$e" "$BUILD/"
done
if [ -e "$REPO/node_modules" ]; then ln -s "$REPO/node_modules" "$BUILD/node_modules"; fi
in_build() { (cd "$BUILD" && env -u REPO_DIR GIT_DIR="$REPO/.git" GIT_WORK_TREE="$BUILD" GIT_OPTIONAL_LOCKS=0 "$@"); }
verify_pins "$BUILD" || fail "the build copy of a pinned EAST-only file does not match its pin"
echo "build copy ready ($(du -sm "$BUILD" 2>/dev/null | cut -f1) MB, node_modules linked)"

# ---- 1b. typecheck ---------------------------------------------------------
# `npm run build` is `vite build`: esbuild strips types and never checks them.
# On 2026-09-13 `useRef` was used but not imported, the build passed, and the
# homepage threw ReferenceError on every render while still returning 200 — so
# every downstream gate passed too. This runs before the build on purpose.
say "1b. typecheck"
echo "build NODE_OPTIONS='$BUILD_NODE_OPTIONS'"
in_build env NODE_OPTIONS="$BUILD_NODE_OPTIONS" npm run --silent check:types || fail "typecheck failed — fix it before building"

# ---- 2. build --------------------------------------------------------------
say "2. build (in $BUILD; the live dist/ is not touched)"
in_build env NODE_OPTIONS="$BUILD_NODE_OPTIONS" npm run build || fail "build failed"

# ---- 3. the stamp must be honest -------------------------------------------
say "3. build stamp"
[ -f "$BSTAMP" ] || fail "no $BSTAMP — postbuild did not run"
S_SHA=$(node -e "process.stdout.write(require('$BSTAMP').sha)")
S_DIRTY=$(node -e "process.stdout.write(String(require('$BSTAMP').dirty))")
S_FILES=$(node -e "process.stdout.write((require('$BSTAMP').dirtyFiles||[]).slice().sort().join('\n'))")
echo "stamp sha=$S_SHA dirty=$S_DIRTY"
[ "$S_SHA" = "$HEAD" ] || fail "stamp $S_SHA != HEAD $HEAD"
# dirty must be exactly the tolerated set: 0 without a pin file, as before.
if [ "$S_DIRTY" != "$N_TOL" ] || [ "$S_FILES" != "$TOLERATED" ]; then
  printf '%s\n' "$S_FILES" | sed '/^$/d; s/^/  stamp dirty: /'
  fail "stamp reports $S_DIRTY dirty source file(s); exactly $N_TOL pinned EAST-only file(s) are allowed"
fi
verify_pins "$REPO" "$BUILD" || fail "a pinned EAST-only file changed during the build"

# ---- 4. smoke on a spare port ----------------------------------------------
say "4. smoke on :$SMOKE_PORT"
PORT=$SMOKE_PORT node --env-file="$REPO/.env" "$BUILD/serve.mjs" &
SMOKE_PID=$!
for i in $(seq 1 40); do
  sleep 1
  curl -fsS "http://127.0.0.1:$SMOKE_PORT/fw-assets/__build.json" >/dev/null 2>&1 && break
  [ "$i" = "40" ] && { kill $SMOKE_PID 2>/dev/null || true; fail "smoke server never came up"; }
done
# EAST-served routes only. /s and /l/* belong to the marketplace on WEST and
# are 404 here by design — smoking them would abort every deploy.
for p in / /p/pool-host-tools /p/corpus-christi-pool-rental-laws; do
  body=$(mktemp)
  code=$(curl -s -o "$body" -w '%{http_code}' "http://127.0.0.1:$SMOKE_PORT$p")
  bytes=$(wc -c < "$body" | tr -d ' ')
  # -a is load-bearing: the SSR payload can contain bytes grep treats as
  # binary, and without it grep prints "binary file matches" instead of the
  # matches, so `wc -l` reports 0 and a perfectly good page fails the gate.
  h1s=$(grep -ao '<h1' "$body" | wc -l | tr -d ' ')
  echo "  $p -> $code  ${bytes}B  h1=$h1s"
  # More than one <h1> is an SEO smell worth seeing, but it is NOT a deploy
  # blocker: it is usually pre-existing content, and this count can legitimately
  # exceed 1 anyway because the SSR hydration payload can embed body HTML
  # alongside the rendered markup. The gate exists to catch a page that rendered
  # NOTHING, so only zero fails.
  if [ "$h1s" -gt 1 ]; then echo "     note: $h1s <h1> elements on $p (not fatal)"; fi
  # NB: plain `cond && cond && assign` chains are not safe here. Under
  # `set -e` a chain whose last test is simply FALSE returns non-zero and kills
  # the script, so every check below is a real if-block.
  why=""
  if [ "$code" != "200" ]; then
    why="returned $code"
  # A render that throws still answers 200 with a valid shell. Every page here
  # is a content page and must carry exactly one non-empty <h1>.
  elif [ "$h1s" -lt 1 ]; then
    why="returned 200 but rendered no <h1> (shell render)"
  elif [ "$bytes" -lt 20000 ]; then
    why="only ${bytes} bytes — looks like a shell render"
  elif grep -aq 'Something went wrong loading this section' "$body"; then
    why="an ErrorBoundary fallback is visible"
  fi
  rm -f "$body"
  [ -z "$why" ] || { kill $SMOKE_PID 2>/dev/null || true; fail "smoke $p $why"; }
done
kill $SMOKE_PID 2>/dev/null || true
SMOKE_PID=""

# ---- 5. flip ---------------------------------------------------------------
say "5. swap dist/ and restart fresh-web"
# Cloudflare holds / and /p/* HTML for 600 s, and that HTML names the previous build's
# hashed assets, so they are carried into the new build. Only the previous build's OWN
# assets (dist/.own-assets, written here) are carried, so dist/ never accumulates.
LIVE_ASSETS="$REPO/dist/client/fw-assets"
NEW_ASSETS="$BUILD/dist/client/fw-assets"
(cd "$NEW_ASSETS" && ls -A | grep -vx '__build.json') > "$BUILD/dist/.own-assets" || true
CARRIED=0
if [ -d "$LIVE_ASSETS" ]; then
  while IFS= read -r f; do
    if [ -n "$f" ] && [ -f "$LIVE_ASSETS/$f" ] && [ ! -e "$NEW_ASSETS/$f" ]; then
      cp -p "$LIVE_ASSETS/$f" "$NEW_ASSETS/$f"; CARRIED=$((CARRIED + 1))
    fi
  done < <(if [ -f "$REPO/dist/.own-assets" ]; then cat "$REPO/dist/.own-assets"; else ls -A "$LIVE_ASSETS" | grep -vx '__build.json'; fi)
fi
echo "carried $CARRIED previous asset file(s) into the new dist/"
rm -rf "$PREV"
if [ -d "$REPO/dist" ]; then mv "$REPO/dist" "$PREV"; fi
SWAPPED=1
mv "$BUILD/dist" "$REPO/dist"
rm -rf "$BUILD"
echo "previous dist/ kept at $PREV"
restart_proven || fail "the restart of fresh-web was not proven"
# Wait for production to report THIS sha, not merely to return 200. The stamp
# has a stable URL, so a 200 proves nothing about which build answered it.
for i in $(seq 1 60); do
  sleep 2
  LIVE=$(curl -fsS -H 'Cache-Control: no-cache' "$BASE/fw-assets/__build.json?cb=$RANDOM$i" 2>/dev/null \
         | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{process.stdout.write(JSON.parse(s).sha||'')}catch{}})" 2>/dev/null || true)
  [ "$LIVE" = "$HEAD" ] && { echo "production reports $HEAD after ${i} poll(s)"; break; }
  [ "$i" = "60" ] && echo "WARNING: production still reports '${LIVE:-none}' after 120s; step 6 will decide"
done

# ---- 6. production must report HEAD ----------------------------------------
say "6. production reports its SHA"
BASE_URL="$BASE" EXPECTED_SHA="$HEAD" npm run --silent check:deployed-sha \
  || fail "production is not serving $HEAD"

# ---- 7. live invariants ----------------------------------------------------
say "7. verify:production"
BASE_URL="$BASE" npm run --silent verify:production \
  || fail "verify:production failed against the new build"

# ---- 7b. tiered listings must offer their tiers -----------------------------
# Run it with .env loaded: the Integration API credentials live there, and
# without them the check reports SKIPPED — which, on the deploy path, is a gate
# that silently passes. A skip here is treated as a failure.
say "7b. check:price-variants"
PV_OUT=$(node --env-file="$REPO/.env" "$REPO/scripts/check-price-variants.mjs" 2>&1) || {
  echo "$PV_OUT"; fail "a tiered listing is not offering its tiers"
}
echo "$PV_OUT"
case "$PV_OUT" in
  *SKIPPED*) fail "check:price-variants skipped — Integration API credentials missing from $REPO/.env; the gate would not have enforced anything" ;;
esac

# ---- 8. attest -------------------------------------------------------------
say "8. record the verified deploy"
verify_pins "$REPO" || fail "a pinned EAST-only file changed during the deploy"
cat > "$REPO/.deployed-sha" <<JSON
{
  "sha": "$HEAD",
  "tree": "$TREE",
  "verify": "pass",
  "eastOnlyFiles": [$(printf '%s' "$TOLERATED" | sed 's/.*/"&"/' | paste -sd, -)],
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "deployedBy": "$(whoami)@$(hostname)",
  "base": "$BASE"
}
JSON
cat "$REPO/.deployed-sha"

# ---- 9. closing gate -------------------------------------------------------
say "9. check:production-drift"
BASE_URL="$BASE" npm run --silent check:production-drift \
  || fail "drift check failed after deploy"

rm -rf "$PREV"
say "DEPLOYED $HEAD — verified and recorded."
