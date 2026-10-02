// End-to-end writes are permitted ONLY against a disposable LOCAL Supabase.
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync } from 'node:fs';
import { spawn, execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { chromium } from 'playwright';
const vars = Object.fromEntries(readFileSync(process.env.KEEPER_LOCAL_ENV, 'utf8').split('\n').filter(l => l.includes('=')).map(l => { const n=l.indexOf('='); return [l.slice(0,n),l.slice(n+1).replace(/^"|"$/g,'')]; }));
const api=vars.API_URL;assert.equal(api,'http://127.0.0.1:54321','Local disposable database required');
const key=vars.ANON_KEY, service=vars.SERVICE_ROLE_KEY;assert.ok(key&&service);
async function user(email) {
 const password=randomBytes(24).toString('base64url');
 let r=await fetch(`${api}/auth/v1/admin/users`,{method:'POST',headers:{apikey:service,Authorization:`Bearer ${service}`,'Content-Type':'application/json'},body:JSON.stringify({email,password,email_confirm:true})});assert.ok(r.ok);
 const actor=(await r.json()).id;assert.match(actor,/^[0-9a-f-]{36}$/);
 r=await fetch(`${api}/auth/v1/token?grant_type=password`,{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({email,password})});assert.ok(r.ok);return {actor,session:await r.json()};
}
const keeper=await user('keeper-browser@example.invalid');
const coach=await user('coach-browser@example.invalid');
const fallback=await user('fallback-browser@example.invalid');
const sql=q=>execFileSync('psql',['-X','-At','-v','ON_ERROR_STOP=1','-h','127.0.0.1','-p','54322','-U','postgres','-d','postgres','-c',q],{env:{...process.env,PGPASSWORD:'postgres'},encoding:'utf8'}).trim();
const admin=sql("select user_id from public.user_roles where role='admin' order by user_id limit 1");assert.match(admin,/^[0-9a-f-]{36}$/);
const game='goldthwaite-at-miles-2026-week-6';
sql(`insert into public.user_roles(user_id,role) values('${keeper.actor}','scorekeeper'),('${coach.actor}','scorekeeper'),('${fallback.actor}','scorekeeper');
insert into public.contributor_school_assignments(user_id,school_slug,assignment_role) values('${keeper.actor}','goldthwaite','scorekeeper'),('${coach.actor}','goldthwaite','coach'),('${fallback.actor}','miles','scorekeeper');
update public.profiles set username='browser_scorekeeper' where id='${keeper.actor}';
select set_config('request.jwt.claim.sub','${admin}',false);set role authenticated;
select public.submit_trusted_score_update('${game}',14,21,'live','3rd','04:00',null,null,null,true);`);
const app=spawn('npm',['run','dev','--','--hostname','127.0.0.1','--port','3000'],{stdio:'inherit',env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:api,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:key}});
let browser;
try {
 for(let i=0;i<90;i++){try{if((await fetch('http://127.0.0.1:3000/login')).ok)break;}catch{} await new Promise(r=>setTimeout(r,500));assert.notEqual(i,89);}
 browser=await chromium.launch();
 async function contextFor(session) {const c=await browser.newContext({viewport:{width:400,height:900}});const encoded=`base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`;const chunks=encoded.match(/.{1,3180}/g);await c.addCookies(chunks.map((value,i)=>({name:chunks.length===1?'sb-127-auth-token':`sb-127-auth-token.${i}`,value,url:'http://127.0.0.1:3000',httpOnly:false,sameSite:'Lax'})));return c;}
 const context=await contextFor(keeper.session);const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:3000/report-score?game=${game}`);
 await page.getByRole('heading',{name:'Trusted LIVE Update',exact:true}).waitFor();
 const trusted=()=>page.locator('form').filter({has:page.getByRole('button',{name:'Publish Trusted LIVE Update',exact:true})});
 assert.equal(await trusted().locator('[name=expected_state_revision]').inputValue(),'0');
 assert.equal(await trusted().locator('[name=away_score]').inputValue(),'21');assert.equal(await trusted().locator('[name=home_score]').inputValue(),'14');
 assert.equal(await trusted().locator('[name=actor_id],[name=school_slug],[name=assignment_id],[name=game_status]').count(),0);
 await page.getByRole('heading',{name:'Pending Score Report / FINAL Request',exact:true}).waitFor();
 mkdirSync('assigned-scorekeeper-browser-evidence',{recursive:true});
 for(const width of [390,400,430,1280]) {await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow');await page.screenshot({path:`assigned-scorekeeper-browser-evidence/live-form-${width}.png`,fullPage:true});}
 await trusted().locator('[name=away_score]').fill('20');
 assert.equal(await trusted().getByRole('button').isDisabled(),true);
 await trusted().locator('[name=confirm_score_decrease]').check();await trusted().getByRole('button').click();
 await page.waitForURL(/submitted=approved/);
 assert.equal(sql(`select status||'|'||away_score||'|'||home_score from public.game_state where game_id='${game}'`),'live|20|14');
 await page.goto(`http://127.0.0.1:3000/games/${game}`);await page.getByText('Updated by @browser_scorekeeper',{exact:true}).first().waitFor();
 assert.equal((await page.content()).includes('assigned_scorekeeper_authority_v1'),false);
 assert.equal((await page.content()).includes(keeper.actor),false,'Private actor leaked in Game Center');
 await page.goto('http://127.0.0.1:3000/scoreboard');await page.getByText('Updated by @browser_scorekeeper',{exact:true}).first().waitFor();
 await page.goto('http://127.0.0.1:3000/schools/goldthwaite');await page.getByText('Updated by @browser_scorekeeper',{exact:true}).first().waitFor({state:'attached'});
 sql(`select set_config('request.jwt.claim.sub','${fallback.actor}',false);set role authenticated;select public.submit_assigned_scorekeeper_update('${game}',14,20,'3rd','04:00',(select updated_at from public.game_state where game_id='${game}'),(select score_revision from public.game_state where game_id='${game}'),false)`);
 await page.goto(`http://127.0.0.1:3000/games/${game}`);await page.getByText('Updated by VarsityVue contributor',{exact:true}).first().waitFor();
 // The tokens stay page-origin even while another publisher wins.
 await page.goto(`http://127.0.0.1:3000/report-score?game=${game}`);await page.getByRole('heading',{name:'Trusted LIVE Update',exact:true}).waitFor();
 const revision=await trusted().locator('[name=expected_state_revision]').inputValue();const updated=await trusted().locator('[name=expected_state_updated_at]').inputValue();
 sql(`select set_config('request.jwt.claim.sub','${admin}',false);set role authenticated;select public.submit_trusted_score_update('${game}',14,28,'live','4th','02:00',null,'${updated}',${revision},false)`);
 await trusted().locator('[name=away_score]').fill('21');await trusted().getByRole('button').click();await page.getByText('Game changed — review the current score.',{exact:true}).waitFor();
 assert.equal(sql(`select away_score from public.game_state where game_id='${game}'`),'28');
 // Revocation is current at publication, even when controls were loaded earlier.
 sql(`delete from public.contributor_school_assignments where user_id='${keeper.actor}'`);
 await trusted().locator('[name=away_score]').fill('35');await trusted().getByRole('button').click();await page.getByText(/Your active scorekeeper access no longer covers/).waitFor();
 assert.equal(sql(`select away_score from public.game_state where game_id='${game}'`),'28');
 const coachContext=await contextFor(coach.session);const coachPage=await coachContext.newPage();await coachPage.goto(`http://127.0.0.1:3000/report-score?game=${game}`);await coachPage.getByRole('heading',{name:'Pending Score Report / FINAL Request'}).waitFor();assert.equal(await coachPage.getByRole('heading',{name:'Trusted LIVE Update',exact:true}).count(),0);
 // FINAL is still a pending report, never a trusted button.
 sql(`insert into public.contributor_school_assignments(user_id,school_slug) values('${keeper.actor}','goldthwaite')`);
 await page.goto(`http://127.0.0.1:3000/report-score?game=${game}`);
 const pending=page.locator('form').filter({has:page.locator('[name=game_status]')});
 await pending.locator('[name=game_status]').selectOption('final');await pending.locator('[name=away_score]').fill('28');await pending.locator('[name=home_score]').fill('14');await pending.getByRole('button',{name:/Submit/}).click();await page.waitForURL(/submitted=pending/);
 assert.equal(sql(`select count(*) from public.score_submissions where game_id='${game}' and game_status='final' and status='pending'`),'1');
 assert.equal(sql(`select status from public.game_state where game_id='${game}'`),'live');
 sql(`select set_config('request.jwt.claim.sub','${admin}',false);set role authenticated;select public.submit_trusted_score_update('${game}',14,28,'final',null,null,null,(select updated_at from public.game_state where game_id='${game}'),(select score_revision from public.game_state where game_id='${game}'),false)`);
 await page.goto(`http://127.0.0.1:3000/report-score?game=${game}`);assert.equal(await page.getByRole('heading',{name:'Trusted LIVE Update',exact:true}).count(),0);
 await page.goto(`http://127.0.0.1:3000/games/${game}`);await page.getByText('Verified by VarsityVue',{exact:true}).first().waitFor();assert.equal(await page.getByText(/Updated by @/).count(),0);
 assert.deepEqual(errors,[]);console.log('Assigned LIVE UI -> server action -> RPC -> public attribution/fallback, stale/revoked denial, coach exclusion, pending FINAL and responsive checks PASS');
} finally {await browser?.close();app.kill('SIGTERM');}
