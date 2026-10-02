#!/usr/bin/env bash
# STRICTLY disposable local Supabase. Exercise both sides of authorization races.
set -euo pipefail
[[ "${PGHOST:-127.0.0.1}" == 127.0.0.1 && "${PGPORT:-54322}" == 54322 ]] || { echo 'Local disposable database required'; exit 1; }
export PGPASSWORD="${PGPASSWORD:-postgres}"
PSQL=(psql -X -v ON_ERROR_STOP=1 -h 127.0.0.1 -p 54322 -U postgres -d postgres)
A=00000000-0000-4000-8000-000000000551
B=00000000-0000-4000-8000-000000000552
M=$("${PSQL[@]}" -At -c "select user_id from public.user_roles where role='moderator' order by user_id limit 1")
[[ -n "$M" ]] || exit 1
A_LOG=$(mktemp); B_LOG=$(mktemp); MARKER=$(mktemp)
cleanup() {
 "${PSQL[@]}" -q -c "delete from public.game_state where game_id like '__keeper_race_%'; delete from public.score_submissions where game_id like '__keeper_race_%'; delete from private.canonical_game_identity where game_id like '__keeper_race_%'; delete from auth.users where id in('$A','$B')" >/dev/null || true
 rm -f "$A_LOG" "$B_LOG" "$MARKER"
}
trap cleanup EXIT
"${PSQL[@]}" -q <<SQL
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select id::uuid,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',id||'@example.invalid','!',now(),'{}','{}',now(),now() from unnest(array['$A','$B']) id;
update public.profiles set username=case id when '$A' then 'race_keeper_a' else 'race_keeper_b' end where id in('$A','$B');
SQL
for MODE in same opposite moderator assignment_first role_first suspension_first publication_assignment publication_role publication_suspension; do
 GAME="__keeper_race_${MODE}__"
 "${PSQL[@]}" -q <<SQL
insert into public.user_roles(user_id,role) values('$A','scorekeeper'),('$B','scorekeeper') on conflict do nothing;
update public.member_account_status set status='active',suspended_at=null where user_id in('$A','$B');
delete from public.contributor_school_assignments where user_id in('$A','$B');
insert into public.contributor_school_assignments(user_id,school_slug) values('$A','race-away'),('$B','$(if [[ "$MODE" == opposite ]]; then echo race-home; else echo race-away; fi)');
insert into private.canonical_game_identity values('$GAME','race-away','race-home');
insert into public.game_state(game_id,status,home_score,away_score,verified,verified_at) values('$GAME','live',0,7,true,now());
SQL
 EXPECTED=$("${PSQL[@]}" -At -c "select updated_at from public.game_state where game_id='$GAME'")
 REVISION=$("${PSQL[@]}" -At -c "select score_revision from public.game_state where game_id='$GAME'")
 CALL="select public.submit_assigned_scorekeeper_update('$GAME',0,14,'2nd','08:00','$EXPECTED',$REVISION,false);"
 case "$MODE" in
 assignment_first|publication_assignment) REVOKE="delete from public.contributor_school_assignments where user_id='$A';" ;;
 role_first|publication_role) REVOKE="delete from public.user_roles where user_id='$A' and role='scorekeeper';" ;;
 suspension_first|publication_suspension) REVOKE="update public.member_account_status set status='suspended',suspended_at=now() where user_id='$A';" ;;
 *) REVOKE='' ;;
 esac
 rm -f "$MARKER"
 if [[ "$MODE" == *_first ]]; then
 FIRST="$REVOKE"; FIRST_ACTOR=''; FIRST_ROLE=''
 SECOND="$CALL"; SECOND_ACTOR="$A"; SECOND_ROLE='set role authenticated;'
 elif [[ "$MODE" == publication_* ]]; then
 FIRST="$CALL"; FIRST_ACTOR="$A"; FIRST_ROLE='set role authenticated;'
 SECOND="$REVOKE"; SECOND_ACTOR=''; SECOND_ROLE=''
 else
 FIRST="$CALL"; FIRST_ACTOR="$A"; FIRST_ROLE='set role authenticated;'
 SECOND_ACTOR="$B"; SECOND_ROLE='set role authenticated;'
 SECOND="select public.submit_assigned_scorekeeper_update('$GAME',7,7,'2nd','07:00','$EXPECTED',$REVISION,false);"
 if [[ "$MODE" == moderator ]]; then
 FIRST="select public.submit_trusted_score_update('$GAME',0,21,'live','2nd','08:00',null,'$EXPECTED',$REVISION,false);"; FIRST_ACTOR="$M"
 SECOND_ACTOR="$A"
 fi
 fi
 "${PSQL[@]}" >"$A_LOG" 2>&1 <<SQL &
begin;
set statement_timeout='12s';
select set_config('request.jwt.claim.sub','$FIRST_ACTOR',false);
$FIRST_ROLE
$FIRST
\! touch '$MARKER'
select pg_sleep(2);
commit;
SQL
 PID=$!
 for _ in {1..100}; do [[ -e "$MARKER" ]] && break; sleep 0.05; done
 [[ -e "$MARKER" ]] || { cat "$A_LOG"; exit 1; }
 START=$(date +%s)
 set +e
 timeout 15 "${PSQL[@]}" >"$B_LOG" 2>&1 <<SQL
set statement_timeout='12s';
select set_config('request.jwt.claim.sub','$SECOND_ACTOR',false);
$SECOND_ROLE
$SECOND
SQL
 CODE=$?
 set -e
 wait "$PID"
 [[ $(($(date +%s)-START)) -ge 1 ]] || { cat "$B_LOG"; echo 'Competing transaction did not wait on authorization/game locks'; exit 1; }
 if [[ "$MODE" == publication_* ]]; then
 [[ "$CODE" == 0 ]] || { cat "$B_LOG"; exit 1; }
 # Authorized publication completed before revocation; next update denied.
 NEXT_EXPECTED=$("${PSQL[@]}" -At -c "select updated_at from public.game_state where game_id='$GAME'")
 NEXT_REVISION=$("${PSQL[@]}" -At -c "select score_revision from public.game_state where game_id='$GAME'")
 set +e
 "${PSQL[@]}" >"$B_LOG" 2>&1 <<SQL
select set_config('request.jwt.claim.sub','$A',false);set role authenticated;
select public.submit_assigned_scorekeeper_update('$GAME',0,21,'3rd','04:00','$NEXT_EXPECTED',$NEXT_REVISION,false);
SQL
 CODE=$?;set -e
 [[ "$CODE" != 0 ]] && grep -qE 'authority required|assignment no longer' "$B_LOG" || { cat "$B_LOG";exit 1; }
 elif [[ "$MODE" == *_first ]]; then
 [[ "$CODE" != 0 && "$CODE" != 124 ]] && grep -qE 'authority required|assignment no longer' "$B_LOG" || { cat "$B_LOG";exit 1; }
 else
 [[ "$CODE" != 0 && "$CODE" != 124 ]] && grep -q 'Game changed' "$B_LOG" || { cat "$B_LOG";exit 1; }
 fi
 if [[ "$MODE" == *_first ]]; then
 "${PSQL[@]}" -At -c "select count(*) from public.score_submissions where game_id='$GAME'" | grep -qx 0
 "${PSQL[@]}" -At -c "select away_score from public.game_state where game_id='$GAME'" | grep -qx 7
 else
 "${PSQL[@]}" -At -c "select count(*) from public.score_submissions where game_id='$GAME' and status='approved'" | grep -qx 1
 WINNER="$A"; SCORE=14; [[ "$MODE" != moderator ]] || { WINNER="$M"; SCORE=21; }
 "${PSQL[@]}" -At -c "select away_score||'|'||updated_by from public.game_state where game_id='$GAME'" | grep -qx "$SCORE|$WINNER"
 if [[ "$MODE" != publication_suspension && "$MODE" != moderator ]]; then
 "${PSQL[@]}" -At -c "select attribution_type||'|'||attribution_username from public.public_score_states() where game_id='$GAME'" | grep -qx 'publisher|race_keeper_a'
 fi
 fi
 echo "$MODE: shared lock, winning publisher, stale/authorization rejection PASS (no deadlock)"
done
