"""Independent connection and real serialization test. Disposable LOOPBACK DB only.
Run with PGHOST=127.0.0.1 PGPORT=54322 PGPASSWORD=<fixture> python3 this-file.
Requires application migrations and the standard synthetic admin fixture 901.
No production connections are accepted; no externally supplied SQL is executed.
"""
import os
import subprocess
import time

assert os.environ.get("PGHOST", "127.0.0.1") == "127.0.0.1", "Loopback fixture only"
assert os.environ.get("PGPORT", "54322") == "54322", "Dedicated test port only"
CMD = ["psql", "-X", "-v", "ON_ERROR_STOP=1", "-h", "127.0.0.1", "-p", "54322", "-U", "postgres", "-d", "postgres", "-At"]
def sql(text):
    return subprocess.check_output(CMD + ["-c", text], text=True, timeout=10).strip()

# Real PostgreSQL serialization failure, not a custom RAISE simulation.
sql("create table private.p0_serialization_fixture(id integer primary key, value integer); insert into private.p0_serialization_fixture values(1,0)")
a = subprocess.Popen(CMD, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, bufsize=1)
try:
    a.stdin.write("begin isolation level serializable; select value from private.p0_serialization_fixture where id=1;\n")
    a.stdin.flush()
    assert a.stdout.readline().strip() == "BEGIN"
    assert a.stdout.readline().strip() == "0"
    sql("update private.p0_serialization_fixture set value=1 where id=1")
    a.stdin.write("\\set VERBOSITY verbose\nupdate private.p0_serialization_fixture set value=2 where id=1; commit;\n")
    a.stdin.close()
    error = a.stderr.read()
    assert a.wait(timeout=10) != 0 and "40001" in error, error
    assert sql("select value from private.p0_serialization_fixture where id=1") == "1"
    print("PASS genuine engine 40001 preserved; losing transaction cannot overwrite committed value")
finally:
    if a.poll() is None:
        a.kill()
    sql("drop table private.p0_serialization_fixture")

# A per-game advisory lock must not block a different game's publication.
actor = "00000000-0000-4000-8000-000000000901"
sql("insert into private.canonical_game_identity values('__p0_other_a__','away-a','home-a'),('__p0_other_b__','away-b','home-b'); insert into public.game_state(game_id,status,home_score,away_score,verified,verified_at) values('__p0_other_a__','live',0,0,true,now()),('__p0_other_b__','live',0,0,true,now())")
lock = subprocess.Popen(CMD, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, bufsize=1)
try:
    lock.stdin.write("begin; select pg_advisory_xact_lock(hashtextextended('__p0_other_a__',7319)); select 'locked';\n")
    lock.stdin.flush()
    while lock.stdout.readline().strip() != "locked":
        if lock.poll() is not None:
            raise RuntimeError(lock.stderr.read())
    expected = sql("select updated_at::text||'|'||score_revision from public.game_state where game_id='__p0_other_b__'")
    timestamp, revision = expected.split("|")
    start = time.monotonic()
    sql("begin; set local role authenticated; select set_config('request.jwt.claim.sub','" + actor + "',true); select public.submit_trusted_score_update('__p0_other_b__',7,0,'live','1st','10:00',null,'" + timestamp + "'," + revision + ",false); commit;")
    assert time.monotonic()-start < 2
    assert sql("select home_score||'|'||away_score||'|'||score_revision from public.game_state where game_id='__p0_other_b__'") == "7|0|1"
    print("PASS distinct-game publication proceeds while another game's advisory lock is held")
finally:
    lock.stdin.write("rollback;\n")
    lock.stdin.close()
    lock.wait(timeout=10)
    sql("delete from public.game_state where game_id in ('__p0_other_a__','__p0_other_b__'); delete from public.score_submissions where game_id in ('__p0_other_a__','__p0_other_b__'); delete from private.canonical_game_identity where game_id in ('__p0_other_a__','__p0_other_b__')")
