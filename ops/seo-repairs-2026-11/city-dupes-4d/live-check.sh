#!/bin/bash
# Live check for step 4d: each dup URL answers exactly one 301 to /p/<keeper>, and the keeper answers 200.
# At most 2 requests per second. Run after the 600 s edge cache (RELEASE.md step 4 common rules).
HERE="$(cd "$(dirname "$0")" && pwd)"
ORIGIN="${ORIGIN:-https://www.poolrentalnearme.com}"
fail=0; n=0
while read -r dup keeper; do
  # -w reads the final response, so a proxy's "200 Connection Established" block cannot be mistaken for it;
  # %{redirect_url} is the Location resolved to an absolute URL.
  read -r code loc < <(curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' --max-time 20 "$ORIGIN/p/$dup")
  sleep 0.5
  [ "$loc" = "$ORIGIN/p/$keeper" ] && locok=1 || locok=0
  kcode=$(curl -sS -o /dev/null -w '%{http_code} %{num_redirects}' --max-time 20 "$ORIGIN/p/$keeper")
  sleep 0.5
  if [ "$code" = 301 ] && [ $locok = 1 ] && [ "$kcode" = "200 0" ]; then r=PASS; else r=FAIL; fail=$((fail+1)); fi
  n=$((n+1)); echo "$r $dup -> $code ${loc:-no-location} | keeper $kcode"
done < <(grep -o "('[^']*', '[^']*')" "$HERE/pairs.sql" | sed "s/('\([^']*\)', '\([^']*\)')/\1 \2/")
echo "checked $n pairs, $fail failed"; [ $fail = 0 ]
