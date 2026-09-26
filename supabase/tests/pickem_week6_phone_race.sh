#!/usr/bin/env bash
set -euo pipefail
export PGPASSWORD=postgres
conn=(-X -v ON_ERROR_STOP=1 -h 127.0.0.1 -p 54322 -U postgres -d postgres)
psql "${conn[@]}" -f supabase/tests/pickem_week6_phone_race.sql >/dev/null
for entry in 1 2; do
  if [[ "$entry" == 1 ]]; then
    user_id=00000000-0000-4000-8000-000000006001
    phone='(254) 555-0199'
  else
    user_id=00000000-0000-4000-8000-000000006002
    phone='+1 254 555 0199'
  fi
  (
    psql "${conn[@]}" -c "set role authenticated; select set_config('request.jwt.claim.sub','$user_id',false); select public.submit_pickem_contest_entry('00000000-0000-4000-8000-000000006006','$phone',63,'{\"00000000-0000-4000-8000-000000006007\":\"race-home\"}'::jsonb);" >"/tmp/race-$entry.log" 2>&1
  ) &
  pid[$entry]=$!
done
set +e
wait "${pid[1]}"; status_one=$?
wait "${pid[2]}"; status_two=$?
set -e
if [[ ( "$status_one" -eq 0 && "$status_two" -eq 0 ) ||
      ( "$status_one" -ne 0 && "$status_two" -ne 0 ) ]] ||
   ! grep -q 'This number is already used for another entrant' /tmp/race-1.log /tmp/race-2.log; then
  cat /tmp/race-1.log /tmp/race-2.log
  echo "Expected one successful and one rejected concurrent entry; got $status_one and $status_two" >&2
  exit 1
fi
result=$(psql "${conn[@]}" -Atc "select count(*) from public.pickem_contest_entries where week_id='00000000-0000-4000-8000-000000006006'")
phones=$(psql "${conn[@]}" -Atc "select count(*) from private.pickem_entrant_phones where phone_e164='+12545550199'")
if [[ "$result" != 1 || "$phones" != 1 ]]; then
  echo "Concurrent duplicate leaked entries: $result entries, $phones phones" >&2
  exit 1
fi
echo 'Concurrent formatting variants: one completed entry, one rejected; one normalized phone.'
