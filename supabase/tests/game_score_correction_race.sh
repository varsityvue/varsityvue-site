#!/usr/bin/env bash
set -euo pipefail
export PGPASSWORD=postgres
PSQL=(psql -X -v ON_ERROR_STOP=1 -h 127.0.0.1 -p 54322 -U postgres -d postgres)
GAME_ID="__score_lock_race__"
MARKER=$(mktemp)
rm -f "$MARKER"
A_LOG=$(mktemp)
B_LOG=$(mktemp)
cleanup() {
  "${PSQL[@]}" -q -c "delete from public.game_state where game_id='$GAME_ID'" >/dev/null || true
  rm -f "$MARKER" "$A_LOG" "$B_LOG"
}
trap cleanup EXIT
"${PSQL[@]}" -q -c "insert into public.game_state(game_id,status,away_score,home_score,period,clock,verified,verified_at,away_school_slug,home_school_slug) values ('$GAME_ID','live',7,0,'Q2','06:00',true,now(),'away-a','home-a')" >/dev/null
EXPECTED=$("${PSQL[@]}" -At -c "select updated_at from public.game_state where game_id='$GAME_ID'")
"${PSQL[@]}" >"$A_LOG" 2>&1 <<SQL &
begin;
select game_id from public.game_state where game_id='$GAME_ID' for update;
\! touch '$MARKER'
select pg_sleep(3);
update public.game_state set home_score=3, clock='04:00' where game_id='$GAME_ID';
commit;
SQL
A_PID=$!
for i in {1..100}; do [[ -e "$MARKER" ]] && break; sleep 0.05; done
[[ -e "$MARKER" ]] || { echo 'Session A did not acquire the row lock'; exit 1; }
START=$(date +%s)
set +e
"${PSQL[@]}" >"$B_LOG" 2>&1 <<SQL
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000402',false);
select public.correct_game_score('$GAME_ID','$EXPECTED'::timestamptz,0,'live',7,10,'Q2','03:00','Stale concurrent edit');
SQL
B_RESULT=$?
set -e
wait "$A_PID"
ELAPSED=$(($(date +%s)-START))
[[ "$B_RESULT" -ne 0 ]] && grep -q 'Game changed after opening the editor' "$B_LOG" && [[ "$ELAPSED" -ge 2 ]] || {
  cat "$A_LOG" "$B_LOG"
  echo "Concurrent update was not rejected after waiting for the row lock ($ELAPSED seconds)"
  exit 1
}
"${PSQL[@]}" -At -c "select home_score,clock,outcome_revision from public.game_state where game_id='$GAME_ID'" | grep -qx '3|04:00|0'
echo "Concurrent editor waited $ELAPSED seconds and rejected the stale save without overwriting the newer score"
