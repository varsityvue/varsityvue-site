// Disposable sandbox only; real GoTrue + PostgREST, all services bind loopback.
import fs from 'node:fs';
import http from 'node:http';
import {createHmac} from 'node:crypto';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
assert.equal(process.cwd(),'/vercel/package','Run only in the disposable verification sandbox');
const authEnv=JSON.parse(fs.readFileSync('/vercel/fixture-env.json','utf8'));
const secret=authEnv.GOTRUE_JWT_SECRET;
function jwt(role){const b=x=>Buffer.from(JSON.stringify(x)).toString('base64url');const payload=b({alg:'HS256',typ:'JWT'})+'.'+b({role,iss:'supabase',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600});return payload+'.'+createHmac('sha256',secret).update(payload).digest('base64url');}
const keys={API_URL:'http://127.0.0.1:54321',ANON_KEY:jwt('anon'),SERVICE_ROLE_KEY:jwt('service_role')};
fs.writeFileSync('/vercel/runtime-fixture.json',JSON.stringify(keys),{mode:0o600});
fs.writeFileSync('/vercel/pgrst.conf',`db-uri = "postgresql://authenticator:isolated-api-only@127.0.0.1:54322/postgres"\ndb-schemas = "public"\ndb-anon-role = "anon"\njwt-secret = "${secret}"\nserver-host = "127.0.0.1"\nserver-port = 3001\ndb-pool = 5\ndb-pool-acquisition-timeout = 3\n`,{mode:0o600});
const log=fs.openSync('/tmp/pgrst.log','w');const api=spawn('postgrest',['/vercel/pgrst.conf'],{stdio:['ignore',log,log]});
let mode='normal';let counts={status:0,logout:0,rpc:0,writeRpc:0,paths:{}};
const gateway=http.createServer((req,res)=>{
 if(req.url==='/__fixture/control'&&req.method==='POST'){
  let body='';req.on('data',d=>body+=d);req.on('end',()=>{const x=JSON.parse(body);if(x.reset)counts={status:0,logout:0,rpc:0,writeRpc:0,paths:{}};if(x.mode)mode=x.mode;res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({mode,counts}));});return;
 }
 if(req.url==='/__fixture/stats'){res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({mode,counts}));return;}
 const path=req.url.split('?')[0];
 counts.paths[path]=(counts.paths[path]??0)+1;
 const targeted = mode.startsWith('all-') && path.startsWith('/rest/v1/') ||
   mode.startsWith('follows-') && path==='/rest/v1/school_follows' ||
   mode.startsWith('editorial-') && path==='/rest/v1/homepage_editorial_features' ||
   mode.startsWith('feed-') && path==='/rest/v1/team_feed_posts' ||
   mode.startsWith('score-') && (path==='/rest/v1/rpc/public_score_states' || path==='/rest/v1/public_game_state');
 if(targeted){
   if(mode.endsWith('slow')){req.on('close',()=>res.destroy());return;}
   const status=mode.endsWith('504')?504:503;
   res.writeHead(status,{'content-type':'application/json'});
   res.end(JSON.stringify({code:'PGRST003',message:'SYNTHETIC_PRIVATE_DIAGNOSTIC_DO_NOT_RENDER'}));return;
 }
 const isStatus=req.url.startsWith('/rest/v1/member_account_status');
 if(isStatus){counts.status++;if(mode==='503'){res.writeHead(503,{'content-type':'application/json'});res.end(JSON.stringify({code:'PGRST003',message:'Synthetic temporary Data API failure'}));return;}if(mode==='timeout'){return;}}
 if(req.url.startsWith('/auth/v1/logout'))counts.logout++;
 if(req.url.startsWith('/rest/v1/rpc/'))counts.rpc++;
 if(req.url.startsWith('/rest/v1/rpc/submit_assigned_scorekeeper_update'))counts.writeRpc++;
 const isAuth=req.url.startsWith('/auth/v1/');const isRest=req.url.startsWith('/rest/v1/');
 if(!isAuth&&!isRest){res.writeHead(404);res.end();return;}
 const upstream=http.request({host:'127.0.0.1',port:isAuth?9999:3001,path:req.url.replace(isAuth?'/auth/v1':'/rest/v1',''),method:req.method,headers:{...req.headers,host:'127.0.0.1'}},r=>{res.writeHead(r.statusCode,r.headers);r.pipe(res);});
 upstream.on('error',()=>{res.writeHead(503);res.end();});req.pipe(upstream);req.on('close',()=>{if(!req.complete)upstream.destroy();});
});
gateway.listen(54321,'127.0.0.1',()=>console.log('LOOPBACK_GATEWAY_STARTED; no exposed route'));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{api.kill();gateway.close(()=>process.exit(0));});
