import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

// Run the actual worker source with synthetic RPC/provider boundaries; no network.
async function fixture(options = {}) {
  const calls = [], messages = [];
  const delivery = { delivery_id:'synthetic-delivery', claim_token:'synthetic-claim', recipient_user_id:'synthetic-user',
    recipient_email:'member@example.invalid', season:2026, week_number:9, week_title:'Week 9',
    lock_at:new Date(Date.now()+3600000).toISOString(),picked_count:1,game_count:3,...options.delivery };
  const rpc = async (name, args) => {
    calls.push({name,args});
    if(name==='claim_pickem_email_reminder') return {data:options.idle ? [] : [delivery],error:options.claimError ? {code:'TEST'} : null};
    if(name==='authorize_pickem_email_reminder_send') return {data:options.authorized ?? true,error:options.authorizationError ? {code:'TEST'} : null};
    if(name==='accept_pickem_email_reminder') return {data:!options.acceptanceError,error:null};
    return {data:'retryable',error:null};
  };
  class WorkerDate extends Date { static now() { return options.now ?? Date.now(); } }
  const context=vm.createContext({process:{env:{PRODUCT_EMAIL_WORKER_SECRET:'synthetic',PRODUCT_EMAIL_RESEND_API_KEY:'synthetic',
    PRODUCT_EMAIL_UNSUBSCRIBE_SECRET:'synthetic-signing-key-not-real'}},console:{error(){}},URL,Date:WorkerDate,Response,
    fetch:async (_url,init)=>{messages.push({body:JSON.parse(init.body),headers:init.headers});
      if(options.networkError) throw new Error('synthetic network failure');
      return new Response(JSON.stringify(options.providerStatus ? {message:'synthetic failure'} : {id:'synthetic-provider-id'}),{status:options.providerStatus ?? 200});}});
  const source=ts.transpileModule(readFileSync(new URL('../lib/product-email-worker.ts',import.meta.url),'utf8'),
    {compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const workerModule=new vm.SourceTextModule(source,{context});
  await workerModule.link(async specifier=>{
    const exports=specifier==='server-only' ? {} : specifier==='@supabase/supabase-js' ? {createClient:()=>({rpc})} :
      specifier.includes('product-email-renderer') ? {renderProductEmail:()=>({})} :
      specifier.includes('unsubscribe') ? {createProductEmailUnsubscribeToken:()=> 'synthetic-token'} :
      {getSupabaseConfig:()=>({url:'https://example.invalid',publishableKey:'synthetic'})};
    return new vm.SyntheticModule(Object.keys(exports),function(){for(const [k,v] of Object.entries(exports))this.setExport(k,v);},{context});
  });
  await workerModule.evaluate();
  const outcome=await workerModule.namespace.deliverNextPickemEmailReminder();
  return {outcome,calls,messages};
}

test('partial selections explain selection and acceptance requirements with consent/unsubscribe',async()=>{
 const {outcome,messages}=await fixture(); assert.equal(outcome.outcome,'provider_accepted');
 assert.match(messages[0].body.text,/Finish your picks and complete entry requirements/);
 assert.match(messages[0].body.text,/tiebreaker prediction \(if required\), mobile number, and eligibility/);
 assert.match(messages[0].body.html,/You enabled Pick ’Em reminders/);
 assert.match(messages[0].body.text,/Unsubscribe from Pick ’Em reminders/);
 assert.ok(messages[0].body.headers['List-Unsubscribe']);
 assert.equal(messages[0].headers['Idempotency-Key'],'varsityvue-pickem-reminder/synthetic-delivery');
});
test('complete draft never claims picks remain or promises acceptance',async()=>{
 const {messages}=await fixture({delivery:{picked_count:3}});
 assert.match(messages[0].body.text,/selections are saved, but your contest entry is not yet accepted/);
 assert.doesNotMatch(messages[0].body.text,/0 picks|next game locks/);
});
for(const [name,options] of Object.entries({idle:{idle:true},claim_error:{claimError:true},revoked:{authorized:false},
 authorization_error:{authorizationError:true},deadline_exact:{delivery:{lock_at:new Date().toISOString()}},
 deadline_passed:{delivery:{lock_at:'2020-01-01T00:00:00Z'}},invalid_deadline:{delivery:{lock_at:'invalid'}}})) {
 test(`${name}: no provider request`,async()=>assert.equal((await fixture(options)).messages.length,0));
}
for(const status of [429,500,400])test(`provider ${status} records retry classification`,async()=>{
 const {outcome,calls}=await fixture({providerStatus:status});assert.equal(outcome.outcome,'failed');
 assert.equal(calls.at(-1).name,'fail_pickem_email_reminder');assert.equal(calls.at(-1).args.retryable,status!==400);
});
test('network failure persists retry; acceptance persistence failure remains explicit',async()=>{
 assert.equal((await fixture({networkError:true})).calls.at(-1).args.retryable,true);
 assert.equal((await fixture({acceptanceError:true})).outcome.outcome,'acceptance_unrecorded');
});

test('no saved selections uses start wording',async()=>{
 const {messages}=await fixture({delivery:{picked_count:0}});
 assert.match(messages[0].body.text,/Start your picks and complete entry requirements/);
});

test('repeated Texas fall-back hour retains distinct CDT/CST deadline labels',async()=>{
 const daylight=await fixture({now:Date.parse('2027-11-06T00:00:00Z'),delivery:{lock_at:'2027-11-07T06:30:00Z'}});
 const standard=await fixture({now:Date.parse('2027-11-06T00:00:00Z'),delivery:{lock_at:'2027-11-07T07:30:00Z'}});
 assert.match(daylight.messages[0].body.subject,/1:30 AM CDT/);
 assert.match(standard.messages[0].body.subject,/1:30 AM CST/);
});
