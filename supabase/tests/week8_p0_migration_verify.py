"""Disposable native PostgreSQL verification; no production connection accepted.
Requires real Auth migrations already installed and application schema empty.
Run once on a newly bootstrapped loopback fixture with PGPASSWORD supplied.
"""
import json, os, subprocess
from pathlib import Path
assert os.environ.get('PGHOST','127.0.0.1')=='127.0.0.1'
assert os.environ.get('PGPORT','54322')=='54322'
ROOT=Path(__file__).resolve().parents[2]
P=['psql','-X','-h','127.0.0.1','-p','54322','-U','postgres','-v','ON_ERROR_STOP=1']
def sql(q,db='postgres'):
 return subprocess.check_output(P+['-d',db,'-At','-c',q],text=True,timeout=15).strip()
def run_file(path,db='postgres',expected=True):
 r=subprocess.run(P+['-d',db,'-f',str(path)],text=True,capture_output=True,timeout=60)
 if (r.returncode==0)!=expected:raise AssertionError(str(path)+'\n'+r.stdout[-1500:]+r.stderr[-3000:])
 return r
# Save the authentic Auth-only platform; fresh replay must not depend on an upgraded app.
subprocess.run(['pg_dump','-h','127.0.0.1','-p','54322','-U','postgres','--schema-only','--clean','--if-exists','postgres'],stdout=open('/tmp/p0-platform.sql','w'),check=True)
versions=json.loads((ROOT/'supabase/tests/week8_p0_production_migrations.json').read_text())
if isinstance(versions,dict): versions=versions['migrations']
for m in versions:
 v=m['version']; f=list((ROOT/'supabase/migrations').glob(v+'*.sql')); assert len(f)==1,(v,f)
 run_file(f[0])
print('PASS trusted production 80-migration baseline replay')
# All installed definitions match the independent production oracle, with one comment-only exception.
defs=json.loads((ROOT/'supabase/tests/week8_p0_baseline.json').read_text())
for d in defs:
 h=sql("select md5(pg_get_functiondef('"+d['signature']+"'::regprocedure))")
 assert h==d['fingerprint'] or ('admin_originate' in d['signature'] and h=='dbb50408b8e09ab39d3e8ca5cbddba49'),(d['signature'],h)
print('PASS emergency hotfix compatibility and 11 deployed baseline fingerprints')
security="""select json_build_object('functions',(select json_agg(x order by signature) from (select n.nspname||'.'||p.oid::regprocedure::text signature,p.proowner,p.proacl,p.prosecdef,p.proconfig,p.provolatile,p.prorettype,p.proargtypes::text from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private')) x),'tables',(select json_agg(x order by relname) from (select n.nspname||'.'||c.relname relname,c.relowner,c.relacl,c.relrowsecurity,c.relforcerowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private') and c.relkind in ('r','v','S')) x),'policies',(select json_agg(x order by schemaname,tablename,policyname) from (select * from pg_policies where schemaname in ('public','private')) x))"""
before=json.loads(sql(security)); Path('/tmp/p0-security-before.json').write_text(json.dumps(before,sort_keys=True))
new=ROOT/'supabase/migrations/20261010013150_week8_p0_nonretryable_business_conflicts.sql'
run_file(new)
after=json.loads(sql(security)); assert before==after,'Security/ACL/RLS drift'
Path('/tmp/p0-security-after.json').write_text(json.dumps(after,sort_keys=True))
for d in defs:
 body=sql("select pg_get_functiondef('"+d['signature']+"'::regprocedure)")
 assert "errcode = '40001'" not in body and "errcode='40001'" not in body
 assert 'PT409' in body
print('PASS guarded upgrade, exact signature/ACL/owner/security/search_path/RLS preservation')
# Duplicate direct execution is safely rejected before replacements; normal migration ledger must skip it.
r=run_file(new,expected=False); assert 'Package 1 baseline drift' in r.stderr,r.stderr
assert json.loads(sql(security))==after
print('PASS duplicate direct migration rejected atomically by fingerprint guards')
# Full repository fresh installation includes dormant migrations; it must be separately identified.
subprocess.run(['createdb','-h','127.0.0.1','-p','54322','-U','postgres','p0_fresh'],check=True)
run_file('/tmp/p0-platform.sql','p0_fresh')
for f in sorted((ROOT/'supabase/migrations').glob('*.sql')):run_file(f,'p0_fresh')
assert 'PT409' in sql("select pg_get_functiondef('public.apply_score_submission_review()'::regprocedure)",'p0_fresh')
print('PASS complete fresh repository migration replay, including dormant schemas (not production release scope)')
# Synthetic standard admin/moderator/member fixture required by existing regressions.
sql("""insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select ('00000000-0000-4000-8000-00000000090'||n)::uuid,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','regression-'||n||'@example.invalid','!',now(),'{}','{}',now(),now() from generate_series(1,3) n;
insert into public.user_roles(user_id,role) values('00000000-0000-4000-8000-000000000901','admin'),('00000000-0000-4000-8000-000000000902','moderator');""")
fail=[]
for name in ['public_score_attribution','assigned_scorekeeper_live','score_scout_approval','friday_scoring_operations','game_score_corrections','pickem_score_integration','pickem_scoreless_outcome_origination','pickem_outcome_schedule','pickem_admin_outcomes','pickem_future_week_admin','public_uuid_hardening','pickem_rls']:
 try:run_file(ROOT/'supabase/tests'/f'{name}.sql');print('PASS SQL '+name)
 except Exception as e:fail.append(name);print('FAIL SQL '+name+' '+str(e))
for name in ['friday_scoring','assigned_scorekeeper','score_scout','game_score_correction']:
 r=subprocess.run(['timeout','60s','bash',str(ROOT/'supabase/tests'/f'{name}_race.sh')],text=True,capture_output=True,timeout=65)
 if r.returncode: fail.append(name+'_race');print('FAIL race '+name+' '+r.stdout[-2000:]+r.stderr[-2000:])
 else:print('PASS independent-connection race '+name+' '+r.stdout[-250:])
r=subprocess.run(['timeout','60s','python3',str(ROOT/'supabase/tests/week8_p0_native.py')],text=True,capture_output=True,timeout=65)
print(r.stdout+r.stderr)
if r.returncode:fail.append('native')
assert not fail,fail
print('PASS ALL PACKAGE 1 DATABASE VERIFICATION')
