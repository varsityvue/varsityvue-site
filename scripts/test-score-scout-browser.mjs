// Authenticated end-to-end checks against a disposable LOCAL Supabase only.
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync } from 'node:fs';
import { spawn, execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { chromium } from 'playwright';
const vars = Object.fromEntries(readFileSync(process.env.SCOUT_LOCAL_ENV, 'utf8').split('\n').filter(l => l.includes('=')).map(l => { const n = l.indexOf('='); return [l.slice(0,n), l.slice(n+1).replace(/^"|"$/g,'')]; }));
const api = vars.API_URL;
assert.equal(api, 'http://127.0.0.1:54321', 'Browser test must never target production');
const key = vars.ANON_KEY; const serviceKey = vars.SERVICE_ROLE_KEY;
assert.ok(key && serviceKey);
const password = randomBytes(24).toString('base64url');
let response = await fetch(`${api}/auth/v1/admin/users`, { method:'POST', headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,'Content-Type':'application/json'},body:JSON.stringify({email:'scout-browser@example.invalid',password,email_confirm:true}) });
assert.ok(response.ok, 'Disposable Auth user setup failed');
const actor = (await response.json()).id;
assert.match(actor, /^[0-9a-f-]{36}$/);
response = await fetch(`${api}/auth/v1/token?grant_type=password`, {method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({email:'scout-browser@example.invalid',password})});
assert.ok(response.ok,'Disposable Auth login failed');
const session = await response.json();
const sql = (query) => execFileSync('psql',['-X','-At','-v','ON_ERROR_STOP=1','-h','127.0.0.1','-p','54322','-U','postgres','-d','postgres','-c',query],{env:{...process.env,PGPASSWORD:'postgres'},encoding:'utf8'}).trim();
sql(`insert into public.user_roles(user_id,role) values('${actor}','admin');
insert into public.missing_score_intelligence(game_id,kickoff,away_team,home_team,away_school_slug,home_school_slug) values
('goldthwaite-at-miles-2026-week-6',now()-interval '5 hours','Goldthwaite','Miles','goldthwaite','miles'),
('albany-at-stamford-2026-week-7',now()-interval '5 hours','Albany','Stamford','albany','stamford'),
('anson-at-cisco-2026-week-7',now()-interval '5 hours','Anson','Cisco','anson','cisco');
insert into public.missing_score_evidence(intelligence_id,source_name,source_type,ingestion_method,home_score,away_score)
select id,'Browser fixture','score_service','automated',21,28 from public.missing_score_intelligence where game_id in('goldthwaite-at-miles-2026-week-6','albany-at-stamford-2026-week-7','anson-at-cisco-2026-week-7');
select set_config('request.jwt.claim.sub','${actor}',false);set role authenticated;
select public.submit_trusted_score_update('albany-at-stamford-2026-week-7',14,21,'live','3rd','04:00',null,null,null,true);`);
const app = spawn('npm',['run','dev','--','--hostname','127.0.0.1','--port','3000'],{stdio:'inherit',env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:api,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:key}});
let browser;
try {
 for(let n=0;n<90;n++){try{if((await fetch('http://127.0.0.1:3000/login')).ok)break;}catch{} await new Promise(r=>setTimeout(r,500));assert.notEqual(n,89,'Local application did not start');}
 browser=await chromium.launch();const context=await browser.newContext({viewport:{width:400,height:900}});
 const encoded=`base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`;
 const chunks=encoded.match(/.{1,3180}/g);
 await context.addCookies(chunks.map((value,n)=>({name:chunks.length===1?'sb-127-auth-token':`sb-127-auth-token.${n}`,value,url:'http://127.0.0.1:3000',httpOnly:false,sameSite:'Lax'})));
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3000/internal/score-intelligence');
 await page.getByRole('heading',{name:'Missing score folder'}).waitFor();
 const card=(heading)=>page.locator('article').filter({has:page.getByRole('heading',{name:heading,exact:true})});
 const first=card('Goldthwaite at Miles');
 const firstApprove=first.locator('form').filter({has:first.getByRole('button',{name:'Approve & Publish Final',exact:true})});
 assert.equal(await firstApprove.locator('[name=expected_absent]').inputValue(),'true');
 assert.match(await firstApprove.locator('label').innerText(),/Goldthwaite 28 — Miles 21/);
 assert.equal(await firstApprove.locator('[name=confirm_final]').getAttribute('required'),'');
 assert.equal(await firstApprove.locator('[name=reviewed_by],[name=actor_id],[name=home_score],[name=away_score]').count(),0);
 mkdirSync('score-scout-browser-evidence',{recursive:true});
 await page.screenshot({path:'score-scout-browser-evidence/review-400.png',fullPage:true});
 // Existing score snapshot is forwarded, not replaced after the next legitimate local update.
 const stale=card('Albany at Stamford');const staleForm=stale.locator('form').filter({has:stale.getByRole('button',{name:'Approve & Publish Final',exact:true})});
 const updated=await staleForm.locator('[name=expected_updated_at]').inputValue();const revision=Number(await staleForm.locator('[name=expected_revision]').inputValue());
 assert.equal(await staleForm.locator('[name=expected_absent]').inputValue(),'false');
 response=await fetch(`${api}/rest/v1/rpc/submit_trusted_score_update`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({p_game_id:'albany-at-stamford-2026-week-7',p_home_score:21,p_away_score:35,p_game_status:'live',p_period:'4th',p_clock:'00:15',p_source_note:null,p_expected_state_updated_at:updated,p_expected_state_revision:revision,p_expected_state_absent:false})});
 assert.ok(response.ok,'Local competing trusted update failed');
 await staleForm.locator('[name=confirm_final]').check();await staleForm.getByRole('button',{name:'Approve & Publish Final'}).click();
 await page.getByRole('alert').filter({hasText:'Game changed — review the current score.'}).waitFor();
 assert.equal(sql("select away_score from public.game_state where game_id='albany-at-stamford-2026-week-7'"),'35');
 // Guarded page -> server action -> real RPC -> canonical FINAL -> neutral public detail.
 const publish=card('Goldthwaite at Miles');await publish.locator('[name=confirm_final]').check();await publish.getByRole('button',{name:'Approve & Publish Final'}).click();
 await page.getByRole('status').filter({hasText:'Queue updated.'}).waitFor();
 assert.equal(sql("select status||'|'||away_score||'|'||home_score from public.game_state where game_id='goldthwaite-at-miles-2026-week-6'"),'final|28|21');
 // Changed evidence is rejected with a bounded review-again message.
 const changed=card('Anson at Cisco');sql("update public.missing_score_evidence set evidence_note='Changed after review page' where intelligence_id=(select id from public.missing_score_intelligence where game_id='anson-at-cisco-2026-week-7')");
 await changed.locator('[name=confirm_final]').check();await changed.getByRole('button',{name:'Approve & Publish Final'}).click();
 await page.getByRole('alert').filter({hasText:'Evidence changed — review the evidence again.'}).waitFor();
 const rejectCard=card('Anson at Cisco');await rejectCard.getByRole('button',{name:'Defer',exact:true}).click();await page.getByRole('status').waitFor();
 await card('Anson at Cisco').getByRole('button',{name:'Reject',exact:true}).click();await page.getByRole('status').waitFor();
 assert.equal(sql("select count(*) from public.score_submissions where game_id='anson-at-cisco-2026-week-7'"),'0');
 await page.goto('http://127.0.0.1:3000/games/goldthwaite-at-miles-2026-week-6');await page.getByText('Verified by VarsityVue',{exact:true}).first().waitFor();
 assert.equal(await page.getByText(/Updated by @/).count(),0);
 assert.equal((await page.content()).includes('Browser fixture'),false);
 assert.deepEqual(errors,[]);
 console.log('Authenticated local Score Scout page/actions/publication/stale/evidence/reject/defer/privacy checks PASS');
} finally {await browser?.close();app.kill('SIGTERM');}
