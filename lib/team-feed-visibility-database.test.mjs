import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const original = readFileSync(new URL("../supabase/migrations/20260928051950_team_feed_phase1.sql", import.meta.url), "utf8").split("-- Private object keys")[0];
const migration = readFileSync(new URL("../supabase/migrations/20261018071630_team_feed_editorial_visibility.sql", import.meta.url), "utf8");
const admin = "00000000-0000-4000-8000-000000000001";

test("migration preserves legacy rows, new default, media, ordering, grants and write denial", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth; create schema private;
      create table public.profiles(id uuid primary key); insert into profiles values ('${admin}');
      create function auth.uid() returns uuid language sql as $$ select '${admin}'::uuid $$;
      create function private.has_role(text) returns boolean language sql as $$ select current_setting('test.admin',true) = 'yes' $$;
      create function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
      grant usage on schema private,auth to authenticated; grant execute on all functions in schema private,auth to authenticated;`);
    await db.exec(original);
    await db.exec(`insert into team_feed_posts(id,primary_school_id,secondary_school_id,game_id,caption,created_by,status,published_at,updated_at)
      values ('00000000-0000-4000-8000-000000000010','de-leon','hico','hico-at-de-leon-2026-week-8','Credit: photographer','${admin}','published','2026-10-17','2026-10-17');
      insert into team_feed_media(post_id,public_path,alt_text,width,height,byte_size,mime_type) values
      ('00000000-0000-4000-8000-000000000010','same/image.webp','Same alt',100,200,1000,'image/webp');
      revoke select on public.team_feed_posts from anon,authenticated;
      grant select(id,primary_school_id,secondary_school_id,game_id,source_type,status,caption,published_at,created_at,updated_at) on public.team_feed_posts to anon,authenticated;`);
    const before = (await db.query("select * from team_feed_posts")).rows[0];
    const media = (await db.query("select * from team_feed_media")).rows;
    await db.exec(migration);
    const after = (await db.query("select * from team_feed_posts")).rows[0];
    assert.equal(after.show_on_secondary_school, true);
    const preserved = { ...after };
    delete preserved.show_on_secondary_school;
    assert.deepEqual(preserved, before);
    await db.exec(`insert into team_feed_posts(primary_school_id,secondary_school_id,created_by,status,published_at)
      select 'de-leon','hico','${admin}','published','2026-10-16'::timestamptz - (n || ' hours')::interval from generate_series(1,7) n;
      insert into team_feed_posts(primary_school_id,secondary_school_id,show_on_secondary_school,created_by,status,published_at)
      values ('albany','hico',true,'${admin}','published','2026-10-15'),('de-leon',null,true,'${admin}','published','2026-10-14');`);
    assert.equal((await db.query("select count(*)::int n from team_feed_posts where show_on_secondary_school=false")).rows[0].n, 7);
    await db.exec("set role anon");
    const page = (await db.query("select id,published_at from team_feed_posts where status='published' and (primary_school_id='hico' or (secondary_school_id='hico' and show_on_secondary_school)) order by published_at desc,id desc limit 2")).rows;
    assert.equal(page.length, 2); // hidden rows do not consume the page
    const next = await db.query("select id from team_feed_posts where status='published' and (primary_school_id='hico' or (secondary_school_id='hico' and show_on_secondary_school)) and (published_at,id)<($1::timestamptz,$2::uuid) order by published_at desc,id desc",[page[0].published_at,page[0].id]);
    assert.equal(next.rows.length, 1);
    await assert.rejects(db.exec("update team_feed_posts set show_on_secondary_school=false"), /permission denied/);
    await db.exec("reset role; set role authenticated; set test.admin='no'");
    await assert.rejects(db.exec(`insert into team_feed_posts(primary_school_id,created_by) values ('de-leon','${admin}')`), /row-level security/);
    assert.equal((await db.query("update team_feed_posts set show_on_secondary_school=false returning id")).rows.length, 0);
    await db.exec("set test.admin='yes'");
    await db.exec("update team_feed_posts set show_on_secondary_school=false where id='00000000-0000-4000-8000-000000000010'");
    await db.exec("reset role");
    const edited = (await db.query("select * from team_feed_posts where id='00000000-0000-4000-8000-000000000010'")).rows[0];
    for (const key of ['primary_school_id','secondary_school_id','game_id','caption','published_at']) assert.deepEqual(edited[key], before[key]);
    assert.deepEqual((await db.query("select * from team_feed_media")).rows, media);
    assert.equal((await db.query("select count(*)::int n from team_feed_posts where secondary_school_id='hico' and show_on_secondary_school")).rows[0].n, 1);
  } finally { await db.close(); }
});
