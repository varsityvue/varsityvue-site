import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';
const migration = name => readFileSync(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8');
const admin = '00000000-0000-4000-8000-000000000001';
const member = '00000000-0000-4000-8000-000000000002';
const moderator = '00000000-0000-4000-8000-000000000003';
test('isolated assignment upsert preserves existing access and rejects non-admin writes', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role authenticated; create schema auth; create schema private;
      create table public.profiles(id uuid primary key);
      insert into profiles values ('${admin}'),('${member}'),('${moderator}');
      create function auth.uid() returns uuid language sql as $$select current_setting('request.jwt.claim.sub')::uuid$$;
      create function private.has_role(wanted text) returns boolean language sql as $$select wanted='admin' and auth.uid()='${admin}'::uuid$$;
      create function private.can_moderate_scores() returns boolean language sql as $$select auth.uid() in ('${admin}'::uuid,'${moderator}'::uuid)$$;
      create function public.set_updated_at() returns trigger language plpgsql as $$begin new.updated_at=now(); return new; end$$;`);
    await db.exec(`create table user_roles(user_id uuid,role text,granted_by uuid,primary key(user_id,role));
      insert into user_roles values ('${member}','scorekeeper','${moderator}');
      alter table user_roles enable row level security;
      create policy read_roles on user_roles for select to authenticated using(true);`);
    await db.exec(migration('20260914183802_admin_contributor_role_management.sql'));
    await db.exec(migration('20260914183621_contributor_school_assignments.sql'));
    await db.exec(migration('20260914184252_admin_only_contributor_assignment_management.sql'));
    await db.exec(`grant usage on schema public,private,auth to authenticated;
      grant select,insert,update,delete on contributor_school_assignments,user_roles to authenticated;
      select set_config('request.jwt.claim.sub','${admin}',false); set role authenticated;`);
    const upsert = school => db.query(`insert into contributor_school_assignments(user_id,school_slug,assignment_role,active,assigned_by)
      values ($1,$2,'scorekeeper',true,$3) on conflict(user_id,school_slug) do update
      set assignment_role=excluded.assignment_role, active=excluded.active, assigned_by=excluded.assigned_by`, [member,school,admin]);
    // Existing role grants have no UPDATE policy. The action must use DO NOTHING.
    const action = readFileSync(new URL('../app/internal/contributor-access/actions.ts', import.meta.url), 'utf8');
    assert.match(action, /onConflict: "user_id,role", ignoreDuplicates: true/);
    await assert.rejects(db.query(`insert into user_roles values ($1,'scorekeeper',$2) on conflict(user_id,role) do update set granted_by=excluded.granted_by`, [member,admin]), /row-level security/);
    await db.query(`insert into user_roles values ($1,'scorekeeper',$2) on conflict(user_id,role) do nothing`, [member,admin]);
    assert.equal((await db.query('select granted_by from user_roles where user_id=$1',[member])).rows[0].granted_by, moderator);
    await upsert('existing-school');
    const before = (await db.query("select * from contributor_school_assignments where school_slug='existing-school'")).rows;
    await upsert('albany'); await upsert('albany'); await upsert('hamilton');
    assert.deepEqual((await db.query("select * from contributor_school_assignments where school_slug='existing-school'")).rows, before);
    assert.equal((await db.query('select * from contributor_school_assignments')).rows.length, 3);
    for (const user of [member, moderator]) {
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user]);
      await assert.rejects(upsert('unauthorized'), /row-level security/);
    }
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [member]);
    assert.equal((await db.query('select * from contributor_school_assignments')).rows.length, 3);
  } finally { await db.close(); }
});
