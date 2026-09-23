#!/bin/sh
# One command for the regression suite, so nobody (person or agent) has to
# remember which harness wants which server.
#
#   test/run.sh                    guard, then every browser harness
#   test/run.sh search plan-edit*  guard, then just these (names or globs, no .mjs)
#   JOBS=1 test/run.sh             one at a time (default 4 in parallel)
#
# Guard runs first and stops everything if it fails — a broken template
# literal makes every harness after it fail for the wrong reason.
#
# Starts web/ on :8099 (plain static) and test/serve.mjs on :8123 (Hosting's
# rewrite) if nothing is already listening, and stops only what it started.
# The emulator pair — two-phones.mjs and refused-rules.mjs — is NOT run here:
# it needs test/setup.sh and the Firebase emulators; see test/README.md.
#
# Full logs land in test/.runs/<harness>.log (gitignored). The last line is
# the one to quote: "N harnesses · P passed checks · F failed".
set -u
here=$(cd "$(dirname "$0")" && pwd)
root=$(dirname "$here")
cd "$root" || exit 1
JOBS=${JOBS:-4}
logs="$here/.runs"
mkdir -p "$logs"

echo "== guard"
if ! node --experimental-vm-modules test/guard.mjs; then
  echo "guard failed — fix it before running anything else"
  exit 1
fi

up() { curl -s -o /dev/null --max-time 1 "http://127.0.0.1:$1/"; }
started=""
if ! up 8099; then
  (cd web && exec npx --yes http-server -p 8099 -c-1 -s .) >"$logs/server-8099.log" 2>&1 &
  started="$started $!"
fi
if ! up 8123; then
  node test/serve.mjs >"$logs/server-8123.log" 2>&1 &
  started="$started $!"
fi
cleanup() { [ -n "$started" ] && kill $started 2>/dev/null; }
trap cleanup EXIT INT TERM
for p in 8099 8123; do
  i=0; until up $p; do i=$((i+1)); [ $i -gt 50 ] && { echo "server :$p did not start"; exit 1; }; sleep 0.2; done
done

skip="guard serve two-phones refused-rules"
if [ $# -gt 0 ]; then
  names=""
  for pat in "$@"; do
    for f in test/$pat.mjs; do [ -f "$f" ] && names="$names $(basename "$f" .mjs)"; done
  done
  [ -z "$names" ] && { echo "no harness matches: $*"; exit 1; }
else
  names=""
  for f in test/*.mjs; do
    n=$(basename "$f" .mjs)
    case " $skip " in *" $n "*) ;; *) names="$names $n" ;; esac
  done
fi

echo "== harnesses ($JOBS at a time):$names"
# Each harness is a fresh browser context against stateless servers, so
# running them side by side is safe; JOBS=1 if a timing-sensitive one wobbles.
echo $names | tr ' ' '\n' | xargs -P "$JOBS" -I{} sh -c '
  node "test/{}.mjs" >"'"$logs"'/{}.log" 2>&1; code=$?
  line=$(grep -E "^--- PASS \(" "'"$logs"'/{}.log" | tail -1)
  [ -z "$line" ] && line=$(tail -1 "'"$logs"'/{}.log")
  if [ $code -eq 0 ]; then echo "  ok    {}  $line"; else echo "  FAIL  {}  $line  (exit $code) → test/.runs/{}.log"; fi
' | tee "$logs/summary.txt"

total=$(grep -c . "$logs/summary.txt")
bad=$(grep -c "^  FAIL" "$logs/summary.txt")
checks=$(sed -n 's/.*PASS (\([0-9]*\)).*/\1/p' "$logs/summary.txt" | paste -sd+ - | bc 2>/dev/null || echo "?")
failed=$(sed -n 's/.*FAIL (\([0-9]*\)).*/\1/p' "$logs/summary.txt" | paste -sd+ - | bc 2>/dev/null || echo "?")
echo "== $total harnesses · $checks passed checks · $failed failed checks · $bad harness(es) red"
[ "$bad" -eq 0 ]
