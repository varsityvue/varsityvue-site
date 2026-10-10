"""Native disposable Auth/Postgres bootstrap. Newly initialized sandbox only."""
import os,subprocess,json,secrets,pathlib
assert pathlib.Path.cwd()==pathlib.Path('/vercel/package'), 'Disposable sandbox only'
os.environ['PGPASSWORD']='isolated-fixture-only'
def sql(s):subprocess.run(['psql','-X','-h','127.0.0.1','-p','54322','-U','postgres','-v','ON_ERROR_STOP=1'],input=s,text=True,check=True)
sql('''create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls; create role authenticator login password 'isolated-api-only' noinherit; grant anon,authenticated,service_role to authenticator;
create schema auth; create schema extensions; create extension pgcrypto schema extensions;
grant usage on schema public,auth,extensions to anon,authenticated,service_role;
alter default privileges in schema public grant all on tables to anon,authenticated,service_role; alter default privileges in schema public grant all on sequences to anon,authenticated,service_role;
create function auth.uid() returns uuid language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
create function auth.role() returns text language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claim.role',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role') $$;
create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]); create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner uuid,owner_id text,metadata jsonb); alter table storage.objects enable row level security; create function storage.foldername(name text) returns text[] language sql immutable as $$select string_to_array(name,'/')$$;
''')
env={**os.environ,'GOTRUE_API_HOST':'127.0.0.1','GOTRUE_API_PORT':'9999','API_EXTERNAL_URL':'http://127.0.0.1:54321/auth/v1','GOTRUE_SITE_URL':'http://127.0.0.1:3000','GOTRUE_DB_DRIVER':'postgres','GOTRUE_DB_DATABASE_URL':'postgresql://postgres:isolated-fixture-only@127.0.0.1:54322/postgres?options=-csearch_path%3Dauth','GOTRUE_DB_NAMESPACE':'auth','GOTRUE_DB_MIGRATIONS_PATH':'/vercel/auth/migrations','GOTRUE_JWT_SECRET':secrets.token_hex(32),'GOTRUE_JWT_ADMIN_ROLES':'service_role','GOTRUE_JWT_AUD':'authenticated','GOTRUE_JWT_DEFAULT_GROUP':'authenticated','GOTRUE_JWT_EXP':'3600','GOTRUE_DISABLE_SIGNUP':'false','GOTRUE_EXTERNAL_EMAIL_ENABLED':'true','GOTRUE_MAILER_AUTOCONFIRM':'true','GOTRUE_LOG_LEVEL':'error'}
pathlib.Path('/vercel/fixture-env.json').write_text(json.dumps({k:v for k,v in env.items() if k.startswith('GOTRUE_') or k=='API_EXTERNAL_URL'}));os.chmod('/vercel/fixture-env.json',0o600)
subprocess.run(['/vercel/auth/auth','migrate'],env=env,cwd='/vercel/auth',check=True)
subprocess.Popen(['/vercel/auth/auth'],env=env,cwd='/vercel/auth',stdout=open('/tmp/auth.log','w'),stderr=subprocess.STDOUT,start_new_session=True)
print('REAL_AUTH_STARTED_SYNTHETIC_ONLY')
