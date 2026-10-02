#!/usr/bin/env bash
# Disposable Supabase database only. Two sessions exercise the shared game lock.
set -euo pipefail
export PGPASSWORD="${PGPASSWORD:-postgres}"
PSQL=(psql -X -v ON_ERROR_STOP=1 -h "${PGHOST:-127.0.0.1}" -p "${PGPORT:-54322}" -U "${PGUSER:-postgres}" -d "${PGDATABASE:-postgres}")
ACTOR=$("${PSQL[@]}" -At -c "select user_id from public.user_roles where role='admin' order by user_id limit 1")
[[ -n "$ACTOR" ]] || { echo 'Disposable admin fixture required'; exit 1; }
SECOND_ACTOR=$("${PSQL[@]}" -At -c "select user_id from public.user_roles where role='moderator' order by user_id limit 1")
[[ -n "$SECOND_ACTOR" ]] || { echo 'Disposable moderator fixture required'; exit 1; }
A_LOG=$(mktemp); B_LOG=$(mktemp); MARKER=$(mktemp)
cleanup() {
 "${PSQL[@]}" -q -c "delete from public.game_state where game_id like '__scout_race_%'; delete from public.score_submissions where game_id like '__scout_race_%'; delete from public.missing_score_intelligence where game_id like '__scout_race_%'; delete from private.canonical_game_identity where game_id like '__scout_race_%'" >/dev/null || true
 rm -f "$A_LOG" "$B_LOG" "$MARKER"
}
trap cleanup EXIT
for MODE in reviewers scoring; do
 GAME="__scout_race_${MODE}__"
 "${PSQL[@]}" -q -c "insert into private.canonical_game_identity values('$GAME','race-away','race-home'); insert into public.missing_score_intelligence(game_id,kickoff,away_team,home_team,away_school_slug,home_school_slug) values('$GAME',now()-interval '5 hours','Race Away','Race Home','race-away','race-home'); insert into public.missing_score_evidence(intelligence_id,source_name,home_score,away_score) select id,'Race fixture',21,28 from public.missing_score_intelligence where game_id='$GAME'" >/dev/null
 EVIDENCE=$("${PSQL[@]}" -At -c "select e.id from public.missing_score_evidence e join public.missing_score_intelligence i on i.id=e.intelligence_id where i.game_id='$GAME'")
 SNAPSHOT=$("${PSQL[@]}" -At -c "select jsonb_build_object('id',e.id,'intelligence_id',e.intelligence_id,'game_id',i.game_id,'away_score',e.away_score,'home_score',e.home_score,'source_name',e.source_name,'source_type',e.source_type,'source_url',e.source_url,'ingestion_method',e.ingestion_method,'evidence_note',e.evidence_note,'captured_at',e.captured_at,'review_status',e.review_status,'away_school_slug',i.away_school_slug,'home_school_slug',i.home_school_slug) from public.missing_score_evidence e join public.missing_score_intelligence i on i.id=e.intelligence_id where e.id='$EVIDENCE'")
 rm -f "$MARKER"
 if [[ "$MODE" == reviewers ]]; then
   WINNER="select public.review_missing_score_evidence('$EVIDENCE','approve',null,'$GAME',null,null,true,:'snapshot'::jsonb,true,'played');"
 else
   WINNER="select public.submit_trusted_score_update('$GAME',21,35,'live','4th','00:15',null,null,null,true);"
 fi
 "${PSQL[@]}" -v snapshot="$SNAPSHOT" >"$A_LOG" 2>&1 <<SQL &
begin;
set statement_timeout='12s';
select set_config('request.jwt.claim.sub','$ACTOR',false);
set role authenticated;
$WINNER
\! touch '$MARKER'
select pg_sleep(3);
commit;
SQL
 A_PID=$!
 for _ in {1..100}; do [[ -e "$MARKER" ]] && break; sleep 0.05; done
 [[ -e "$MARKER" ]] || { cat "$A_LOG"; echo 'Winning session did not publish'; exit 1; }
 START=$(date +%s)
 set +e
 timeout 15 "${PSQL[@]}" -v snapshot="$SNAPSHOT" >"$B_LOG" 2>&1 <<SQL
set statement_timeout='12s';
select set_config('request.jwt.claim.sub','$SECOND_ACTOR',false);
set role authenticated;
select public.review_missing_score_evidence('$EVIDENCE','approve',null,'$GAME',null,null,true,:'snapshot'::jsonb,true,'played');
SQL
 B_CODE=$?
 set -e
 wait "$A_PID"
 [[ "$B_CODE" -ne 0 && "$B_CODE" -ne 124 ]] || { cat "$A_LOG" "$B_LOG"; echo 'Concurrent review failed safety/timeout'; exit 1; }
 [[ $(($(date +%s)-START)) -ge 2 ]] || { cat "$B_LOG"; echo 'Review did not wait on game lock'; exit 1; }
 if [[ "$MODE" == reviewers ]]; then
   grep -q 'no longer open' "$B_LOG"
   "${PSQL[@]}" -At -c "select count(*) from public.score_submissions where game_id='$GAME'" | grep -qx 1
   "${PSQL[@]}" -At -c "select status,away_score,home_score from public.game_state where game_id='$GAME'" | grep -qx 'final|28|21'
 else
   grep -q 'Game changed' "$B_LOG"
   "${PSQL[@]}" -At -c "select status,away_score,home_score from public.game_state where game_id='$GAME'" | grep -qx 'live|35|21'
 fi
 echo "$MODE: concurrent review waited, failed safely, and preserved the winning state without deadlock"
done
