#!/usr/bin/env bash
# Isolated local/nonproduction Postgres only. Requires seeded active admin.
set -euo pipefail
export PGPASSWORD="${PGPASSWORD:-postgres}"
PSQL=(psql -X -v ON_ERROR_STOP=1 -h "${PGHOST:-127.0.0.1}" -p "${PGPORT:-54322}" -U "${PGUSER:-postgres}" -d "${PGDATABASE:-postgres}")
GAME='__friday_ops_race__'
ACTOR=$("${PSQL[@]}" -At -c "select user_id from public.user_roles where role='admin' order by user_id limit 1")
[[ -n "$ACTOR" ]] || { echo 'Active admin fixture required'; exit 1; }
A_LOG=$(mktemp); B_LOG=$(mktemp); MARKER=$(mktemp); rm -f "$MARKER"
cleanup() {
  "${PSQL[@]}" -q -c "delete from public.game_state where game_id='$GAME'; delete from public.score_submissions where game_id='$GAME'; delete from private.canonical_game_identity where game_id='$GAME'" >/dev/null || true
  rm -f "$A_LOG" "$B_LOG" "$MARKER"
}
trap cleanup EXIT
"${PSQL[@]}" -q -c "insert into private.canonical_game_identity values('$GAME','away-a','home-a'); insert into public.game_state(game_id,status,away_score,home_score,verified,verified_at) values('$GAME','live',7,14,true,now())" >/dev/null
EXPECTED=$("${PSQL[@]}" -At -c "select updated_at from public.game_state where game_id='$GAME'")
REVISION=$("${PSQL[@]}" -At -c "select score_revision from public.game_state where game_id='$GAME'")
"${PSQL[@]}" >"$A_LOG" 2>&1 <<SQL &
begin;
select set_config('request.jwt.claim.sub','$ACTOR',false);
set role authenticated;
select public.submit_trusted_score_update('$GAME',7,21,'live','3rd','02:00',null,'$EXPECTED',$REVISION,false);
\! touch '$MARKER'
select pg_sleep(3);
commit;
SQL
A_PID=$!
for _ in {1..100}; do [[ -e "$MARKER" ]] && break; sleep 0.05; done
[[ -e "$MARKER" ]] || { cat "$A_LOG"; echo 'Editor A did not save'; exit 1; }
START=$(date +%s)
set +e
"${PSQL[@]}" >"$B_LOG" 2>&1 <<SQL
select set_config('request.jwt.claim.sub','$ACTOR',false);
set role authenticated;
select public.submit_trusted_score_update('$GAME',7,14,'live','3rd','01:30',null,'$EXPECTED',$REVISION,false);
SQL
B_CODE=$?
set -e
wait "$A_PID"
ELAPSED=$(($(date +%s)-START))
[[ "$B_CODE" -ne 0 ]] && grep -q 'Game changed' "$B_LOG" && [[ "$ELAPSED" -ge 2 ]] || { cat "$A_LOG" "$B_LOG"; echo 'Concurrent stale save did not reject'; exit 1; }
"${PSQL[@]}" -At -c "select home_score,away_score from public.game_state where game_id='$GAME'" | grep -qx '7|21'
echo "Concurrent editor waited ${ELAPSED}s, rejected stale state, and preserved 21–7"
