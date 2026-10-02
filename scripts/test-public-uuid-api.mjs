// Disposable local Supabase only. Never accepts a production API URL.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHmac} from 'node:crypto';
import sharp from 'sharp';
const vars=Object.fromEntries(readFileSync(process.env.UUID_LOCAL_ENV,'utf8').trim().split('\n').filter(x=>x.includes('=')).map(x=>{const i=x.indexOf('=');return [x.slice(0,i),x.slice(i+1).replace(/^"|"$/g,'')]}));
const api=vars.API_URL;assert.match(api,/^http:\/\/(127\.0\.0\.1|localhost):54321$/);
const key=vars.ANON_KEY;assert.ok(key);
const secret=vars.JWT_SECRET;assert.ok(secret,'Local JWT secret is required; do not substitute production credentials.');
const actor=n=>`00000000-0000-4000-8000-00000000085${n}`;
const sql=s=>execFileSync('psql',['-X','-v','ON_ERROR_STOP=1','-h','127.0.0.1','-p','54322','-U','postgres','-d','postgres','-c',s],{env:{...process.env,PGPASSWORD:'postgres'},stdio:['pipe','pipe','pipe']}).toString();
sql(`insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select ('00000000-0000-4000-8000-00000000085'||n)::uuid,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','uuid-api-'||n||'@example.invalid','!',now(),'{}','{}',now(),now() from generate_series(1,5) n;
insert into public.user_roles(user_id,role) values('${actor(3)}','moderator'),('${actor(4)}','admin'),('${actor(5)}','scorekeeper');
update public.profiles set username='uuid_api_keeper' where id='${actor(5)}';
insert into private.canonical_game_identity values('__uuid_api__','uuid-api-away','uuid-api-home');
insert into public.game_state(game_id,status,home_score,away_score,verified,updated_by) values('__uuid_api__','live',7,0,true,'${actor(4)}');
insert into public.score_submissions(game_id,submitted_by,home_score,away_score,game_status,review_note) values('__uuid_api__','${actor(1)}',7,0,'live','PRIVATE');
insert into public.score_submission_events(submission_id,event_type,actor_id,payload) select id,'note_added','${actor(4)}','{"kind":"assigned_scorekeeper_authority_v1","private":"fixture"}' from public.score_submissions where game_id='__uuid_api__';
insert into public.pickem_member_totals(season,user_id,graded_picks,correct_picks,incorrect_picks) values(2094,'${actor(1)}',6,6,0),(2094,'${actor(2)}',8,6,2);
insert into public.contributor_school_assignments(user_id,school_slug,assignment_role,active) values('${actor(5)}','uuid-api-away','scorekeeper',true);`);
function jwt(sub){const encode=x=>Buffer.from(JSON.stringify(x)).toString('base64url');const body=encode({alg:'HS256',typ:'JWT'})+'.'+encode({sub,role:'authenticated',aud:'authenticated',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600});return body+'.'+createHmac('sha256',secret).update(body).digest('base64url')}
async function req(path,sub,body){const r=await fetch(api+'/rest/v1/'+path,{method:body?'POST':'GET',headers:{apikey:key,Authorization:'Bearer '+(sub?jwt(sub):key),'Content-Type':'application/json',Prefer:'return=representation'},body:body?JSON.stringify(body):undefined});return{status:r.status,data:await r.json()}}
let count=0;
async function denied(path,sub){const r=await req(path,sub);assert.ok(r.status>=400,`Unexpected access: ${path}`);count++}
async function empty(path,sub){const r=await req(path,sub);assert.equal(r.status,200,path);assert.deepEqual(r.data,[],path);count++}
for(const path of ['profiles?select=id','profiles?select=*','game_state?select=updated_by','game_state?select=source_submission_id','game_state?select=*','pickem_member_totals?select=user_id','pickem_standings?select=*','pickem_week_standings?select=*','team_feed_posts?select=created_by','team_feed_posts?select=*','school_roster_players?select=created_by','pickem_weeks?select=created_by','game_state?select=game_id,profiles!game_state_updated_by_fkey(id)','game_state?select=game_id&updated_by=eq.'+actor(4)])await denied(path);
for(const sub of [actor(1),actor(5)]){
 await empty('score_submission_events?select=*',sub);
 await empty('internal_score_submissions?select=*',sub);
 await denied('score_submissions?select=reviewed_by',sub);
 await denied('score_submissions?select=*',sub);
 await empty('profiles?select=id&id=eq.'+actor(2),sub);
 await empty('game_state?select=updated_by&game_id=eq.__uuid_api__',sub);
 const internal=await req('rpc/internal_pickem_week_standings',sub,{p_week_id:'00000000-0000-4000-8000-000000000899'});assert.equal(internal.data.code,'42501');count++;
 const status=await req('rpc/own_score_report_status',sub,{});assert.equal(status.status,200);for(const row of status.data)assert.ok(!['reviewed_by','submitted_by','payload','review_note'].some(x=>x in row));count++;
}
for(const sub of [actor(3),actor(4)]){const events=await req('score_submission_events?select=actor_id,payload&limit=1',sub);assert.equal(events.status,200);assert.equal(events.data.length,1);count++}
const ranks=await req('rpc/public_pickem_season_standings',null,{p_season:2094});assert.equal(ranks.status,200);assert.equal(ranks.data.length,2);assert.deepEqual(ranks.data.map(x=>[x.rank,x.ordinal]),[[1,1],[1,2]]);assert.ok(ranks.data.every(x=>!('user_id'in x)));count++;
const weekly=await req('rpc/public_pickem_week_standings',null,{p_week_id:'00000000-0000-4000-8000-000000000899'});assert.equal(weekly.status,200);assert.deepEqual(weekly.data,[]);count++;
const scores=await req('rpc/public_score_states',null,{});assert.equal(scores.status,200);for(const row of scores.data)assert.deepEqual(Object.keys(row).sort(),['game_id','status','home_score','away_score','period','clock','verified','kickoff_override','result_type','official_winner_school_slug','attribution_type','attribution_username'].sort());count++;
const view=await req('public_game_state?select=*&game_id=eq.__uuid_api__');assert.equal(view.status,200);assert.equal(view.data.length,1);assert.ok(!('updated_by'in view.data[0]));assert.ok(!('source_submission_id'in view.data[0]));count++;
// Follow ownership remains usable and cannot enumerate another member.
const followed=await req('school_follows',actor(1),{user_id:actor(1),school_slug:'goldthwaite',source_surface:'account'});assert.equal(followed.status,201);count++;
await empty('school_follows?select=*&user_id=eq.'+actor(1),actor(2));
const selfFollow=await req('school_follows?select=school_slug',actor(1));assert.equal(selfFollow.status,200);assert.equal(selfFollow.data.length,1);count++;
// Admin authoring and published/draft RLS stay intact with safe column grants.
const post=await req('team_feed_posts',actor(4),{id:'00000000-0000-4000-8000-000000000898',primary_school_id:'stephenville',source_type:'varsityvue',status:'draft',caption:'UUID API draft',created_by:actor(4)});
// Returning * deliberately fails for restricted provenance; existing app writes return minimal.
assert.ok(post.status>=400);count++;
const write=await fetch(api+'/rest/v1/team_feed_posts',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+jwt(actor(4)),'Content-Type':'application/json'},body:JSON.stringify({id:'00000000-0000-4000-8000-000000000898',primary_school_id:'stephenville',source_type:'varsityvue',status:'draft',caption:'UUID API draft',created_by:actor(4)})});assert.equal(write.status,201);count++;
await empty('team_feed_posts?select=id,caption&caption=eq.UUID%20API%20draft');
const adminDraft=await req('team_feed_posts?select=id,caption&caption=eq.UUID%20API%20draft',actor(4));assert.equal(adminDraft.status,200);assert.equal(adminDraft.data.length,1);count++;
// Actual public media delivery and unchanged published-post embedding.
const image=await sharp({create:{width:1,height:1,channels:3,background:'#000000'}}).webp().toBuffer();
const upload=await fetch(api+'/storage/v1/object/team-feed-public/uuid-hardening-fixture.webp',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+vars.SERVICE_ROLE_KEY,'Content-Type':'image/webp'},body:image});assert.equal(upload.status,200);count++;
sql(`insert into public.team_feed_media(post_id,public_path,alt_text,width,height,byte_size,mime_type) values('00000000-0000-4000-8000-000000000898','uuid-hardening-fixture.webp','UUID fixture media',1,1,${image.length},'image/webp');`);
const publish=await fetch(api+'/rest/v1/team_feed_posts?id=eq.00000000-0000-4000-8000-000000000898',{method:'PATCH',headers:{apikey:key,Authorization:'Bearer '+jwt(actor(4)),'Content-Type':'application/json'},body:JSON.stringify({status:'published',published_at:new Date().toISOString()})});assert.equal(publish.status,204);count++;
const publicPost=await req('team_feed_posts?select=id,caption,team_feed_media(id,public_path,alt_text)&id=eq.00000000-0000-4000-8000-000000000898');assert.equal(publicPost.status,200);assert.equal(publicPost.data[0].team_feed_media.length,1);assert.ok(!('created_by'in publicPost.data[0]));count++;
const media=await fetch(api+'/storage/v1/object/public/team-feed-public/uuid-hardening-fixture.webp');assert.equal(media.status,200);assert.equal((await media.arrayBuffer()).byteLength,image.length);count++;
// Genuine assigned LIVE publication after hardening, from a local account JWT.
const state=view.data[0];const published=await req('rpc/submit_assigned_scorekeeper_update',actor(5),{p_game_id:'__uuid_api__',p_home_score:14,p_away_score:0,p_period:'1st',p_clock:'10:00',p_expected_state_updated_at:state.updated_at,p_expected_state_revision:state.score_revision,p_confirm_score_decrease:false});assert.equal(published.status,200,JSON.stringify(published));count++;
const after=await req('rpc/public_score_states',null,{});const current=after.data.find(x=>x.game_id==='__uuid_api__');assert.equal(current.home_score,14);assert.equal(current.attribution_username,'uuid_api_keeper');count++;
await empty('score_submission_events?select=*',actor(5));
console.log(`PASS: ${count} disposable PostgREST assertions; identity values suppressed.`);
