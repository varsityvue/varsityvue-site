import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveIngestionPilotConfig,checkIngestionRequest,decodeInboxCursor} from './ingestion-pilot-config';
const jwt=(role:string)=>`x.${Buffer.from(JSON.stringify({role})).toString('base64url')}.x`;
const local={ENABLE_DATA_INGESTION:'true',INGESTION_BACKEND:'local',INGESTION_SUPABASE_URL:'http://127.0.0.1:54321',INGESTION_ORIGIN:'http://127.0.0.1:3100',INGESTION_SUPABASE_PUBLISHABLE_KEY:jwt('anon'),INGESTION_SERVICE_KEY:jwt('service_role'),NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54321',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:jwt('anon')};
test('dedicated gate defaults closed independent of shared flag',()=>{assert.throws(()=>resolveIngestionPilotConfig({...local,ENABLE_DATA_INGESTION:undefined,ENABLE_INTERNAL_TOOLS:'true'}),/disabled/);assert.equal(resolveIngestionPilotConfig({...local,ENABLE_INTERNAL_TOOLS:'false'}).backend,'local');});
test('local selection rejects deployed, remote and mixed account backends',()=>{
 for(const extra of [{VERCEL:'1'},{INGESTION_SUPABASE_URL:'https://example.supabase.co'},{NEXT_PUBLIC_SUPABASE_URL:undefined},{NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'other'},{INGESTION_ORIGIN:'https://varsityvue.com'}])assert.throws(()=>resolveIngestionPilotConfig({...local,...extra}));
});
test('hosted adaptation validates explicit HTTPS backend without making a request',()=>{
 const hosted={...local,INGESTION_BACKEND:'hosted',INGESTION_SUPABASE_URL:'https://syntheticproject.supabase.co',NEXT_PUBLIC_SUPABASE_URL:'https://syntheticproject.supabase.co',INGESTION_ORIGIN:'https://pilot.example.invalid'};
 assert.equal(resolveIngestionPilotConfig(hosted).backend,'hosted');
 for(const extra of [{INGESTION_SUPABASE_URL:'https://evil.invalid'},{INGESTION_ORIGIN:'http://pilot.example.invalid'},{INGESTION_SUPABASE_URL:'https://syntheticproject.supabase.co/path'},{INGESTION_ORIGIN:'https://pilot.example.invalid/'},{INGESTION_SERVICE_KEY:jwt('anon')},{INGESTION_SUPABASE_PUBLISHABLE_KEY:jwt('service_role')}])assert.throws(()=>resolveIngestionPilotConfig({...hosted,...extra}));
});
test('origin guard ignores attacker forwarded-host and denies missing/cross origin mutations',()=>{
 const config={origin:local.INGESTION_ORIGIN};
 checkIngestionRequest(config,new Headers({host:'127.0.0.1:3100'}));
 checkIngestionRequest(config,new Headers({host:'127.0.0.1:3100',origin:config.origin}),true);
 for(const h of [{host:'evil.invalid',origin:config.origin,'x-forwarded-host':'127.0.0.1:3100'},{host:'127.0.0.1:3100'},{host:'127.0.0.1:3100',origin:'null'},{host:'127.0.0.1:3100',origin:'https://evil.invalid'},{host:'127.0.0.1:3100',origin:config.origin,'sec-fetch-site':'cross-site'}])assert.throws(()=>checkIngestionRequest(config,new Headers(Object.fromEntries(Object.entries(h).filter(([,value])=>value!==undefined)) as Record<string,string>),true));
});
test('bounded cursors reject invalid and oversized input',()=>{
 assert.deepEqual(decodeInboxCursor(),{});assert.throws(()=>decodeInboxCursor('x'.repeat(257)));assert.throws(()=>decodeInboxCursor('garbage'));
 const value={time:'2026-10-08T10:00:00.123456+00:00',id:'00000000-0000-4000-8000-000000000001'};
 assert.deepEqual(decodeInboxCursor(Buffer.from(JSON.stringify(value)).toString('base64url')),{p_before:value.time,p_before_id:value.id});
});

test('pilot decoder rejects a small compressed image exceeding ten million pixels',async()=>{
 const sharp=(await import('sharp')).default;const {validateIngestionImage}=await import('./ingestion-evidence');
 const compressed=await sharp({create:{width:4000,height:3000,channels:3,background:'#fff'}}).png().toBuffer();
 assert.ok(compressed.length<5*1024*1024);
 await assert.rejects(validateIngestionImage(new File([new Uint8Array(compressed)],'oversized-decoding.png',{type:'image/png'})));
});
