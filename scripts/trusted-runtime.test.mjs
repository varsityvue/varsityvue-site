import nodeTest from 'node:test';
import {AsyncLocalStorage} from 'node:async_hooks';
import assert from 'node:assert/strict';
const testObservations=new AsyncLocalStorage();
const originalThrows=assert.throws.bind(assert),originalRejects=assert.rejects.bind(assert);
assert.throws=(fn,...args)=>originalThrows(()=>{try{return fn();}catch(e){testObservations.getStore()?.push(e.outcome??'VERIFICATION FAIL');throw e;}},...args);
assert.rejects=(fn,...args)=>originalRejects(async()=>{try{return await(typeof fn==='function'?fn():fn);}catch(e){testObservations.getStore()?.push(e.outcome??'VERIFICATION FAIL');throw e;}},...args);
const test=(name,body)=>nodeTest(name,async t=>testObservations.run([],async()=>{await body(t);t.diagnostic(JSON.stringify({id:name.split(' expected=')[0],expected:name.split(' expected=')[1]??'non-PASS',assertions:'PASS',observedErrorClasses:testObservations.getStore(),syntheticOnly:true}));}));

import {generateKeyPairSync,sign} from 'node:crypto';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync,symlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {bytes,canonical,hash,parseCanonical,validateSchema,validateBinding,validateTrustedSource,validateLayout,noSymlinks,commandPolicy,safeEnvironment,validateIsolation,validateSuppression,authenticateReceipt,validateSensitiveContracts,executeTrusted,TOOL_PATHS,activationStatus} from './run-trusted-runtime.mjs';
import {sealEvidence,appendAttestation,writeEvidence,validateMembers} from './collect-trusted-runtime.mjs';
import {verifyPackage,verifyAttestation,selectCurrentRun,githubReader,validateOidc,requestAttestation,readZip} from './verify-safe-ci-evidence.mjs';
export const policy=parseCanonical(readFileSync(new URL('./trusted-runtime-policy.json',import.meta.url)));
export const schema=parseCanonical(readFileSync(new URL('./trusted-runtime-schema.json',import.meta.url)));
const {publicKey,privateKey}=generateKeyPairSync('ed25519');
const h='a'.repeat(40),d='b'.repeat(64);
export function fixture(){
 const p=structuredClone(policy);p.attestation.publicKey=publicKey.export({type:'spki',format:'pem'});p.attestation.keyId='TEST-ONLY-EPHEMERAL';
 const binding={repositoryId:p.repositoryId,repository:p.repository,pr:123,event:'pull_request',action:'opened',baseRef:'main',base:h,baseTree:h,head:h,headTree:h,merge:h,mergeParents:[h,h],bootstrap:h,bootstrapTree:h,toolBlobs:Object.fromEntries(TOOL_PATHS.map(s=>[s,h])),runnerImage:d,runnerPolicy:d,isolationPolicy:d,workflowPath:'.github/workflows/varsityvue-safe-required.yml',workflowId:1,runId:2,attempt:1,jobId:3,nonce:d};
 const isolation=phase=>({phase,bindingDigest:hash(bytes(binding)),runnerImage:d,runnerPolicy:d,isolationPolicy:d,candidateUid:1001,capabilities:[],policyDigest:hash(bytes(p)),probes:Object.fromEntries(p.probeIds.map(k=>[k,'denied'])),...Object.fromEntries(['defaultDeny','establishedBeforeExecution','active','activeThroughout','hostControlled','disposable','trustedReadOnly','evidenceNonwritable','processAuditComplete','noCredentials','noSudo','noDaemon','firewallImmutable','provisioningImmutable'].map(k=>[k,true]))});
 const audit={complete:true,terminated:true,collectorAlive:true,sensitiveDispatches:0,prohibitedNetworkActions:0,supervisorPid:1,contracts:p.sensitiveStages.map(({contract,...r})=>r),events:[{seq:1,type:'exec',pid:2,parentPid:1,executable:'/usr/bin/node',argv:['--check','scripts/trusted-runtime.test.mjs'],id:'bootstrap-syntax',result:'success'}]};
 const commands=p.commands.map((c,i)=>({...c,seq:i+1,status:'success',exitCode:0,signal:null,envKeysHash:p.environmentKeysHash}));
 const runtime={schemaVersion:1,binding,isolation:[isolation('before'),isolation('during'),isolation('after')],commands,audit,stages:p.stages.map(id=>({id,status:'success'})),collectorComplete:true,outcome:'PASS'};
 const platform={initial:binding,final:binding,pagesComplete:true,runs:[{...binding,status:'completed',conclusion:'success',appId:15368}],artifact:{expired:false,runId:2,attempt:1,id:5}};
 const context={testOnly:true,now:1000,nonceLedger:{used:new Set(),consume(v){const k=canonical(v);if(this.used.has(k))return false;this.used.add(k);return true;}}};
 return {p,binding,runtime,platform,context,isolation,audit,commands};
}
export function signed(f){const sealed=sealEvidence(f.runtime,[],f.p,schema);const payload={schemaVersion:1,binding:f.binding,manifestDigest:sealed.manifestDigest,keyId:f.p.attestation.keyId,issuedAt:990,expiresAt:1100,issuer:f.p.attestation.issuer,audience:f.p.attestation.audience,candidateTerminated:true,collectorSealed:true};const attestation={payload,signature:sign(null,bytes(payload),privateKey).toString('base64'),testOnly:true};return {sealed,attestation,members:appendAttestation(sealed,attestation)};}
const run=f=>{const s=signed(f);return verifyPackage(s.members,f.binding,f.platform,f.context,f.p,schema);};
function negative(id,mutate,expected='VERIFICATION FAIL'){test(id+' expected='+expected,()=>{const f=fixture();mutate(f);assert.throws(()=>run(f),e=>e.outcome===expected);});}
test('A001 valid TEST-ONLY package expected=PASS',()=>{assert.equal(run(fixture()).syntheticOnly,true);});
test('A002 canonical UTF8 keys array order SHA256 expected=PASS',()=>{assert.equal(canonical({z:0,a:['é',1]}),'{"a":["é",1],"z":0}');assert.equal(hash(Buffer.from('abc')),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');assert.notEqual(canonical([1,2]),canonical([2,1]));});
for(const [id,value] of [['A003',undefined],['A004',NaN],['A005',-0],['A006',new Date()],['A007',Array(2)]])test(id+' invalid canonical expected=VERIFICATION FAIL',()=>assert.throws(()=>canonical(value)));
for(const [id,text] of [['A008','{}\n'],['A009','\ufeff{}'],['A010','{"a":1,"a":2}'],['A011','{"z":0,"a":1}'],['A012','{']])test(id+' noncanonical JSON expected=VERIFICATION FAIL',()=>assert.throws(()=>parseCanonical(Buffer.from(text))));
for(const k of ['repository','repositoryId','pr','event','action','baseRef'])negative('B-'+k,f=>{f.runtime.binding={...f.binding,[k]:typeof f.binding[k]==='number'?0:'wrong'};},k==='repositoryId'||k==='pr'?'VERIFICATION FAIL':'BLOCKED — IDENTITY MISMATCH');
for(const k of ['head','headTree','base','baseTree','merge','bootstrap','bootstrapTree','workflowPath','workflowId','runId','attempt','jobId','runnerImage','runnerPolicy','isolationPolicy','nonce'])test('B-'+k+' identity substitution expected=BLOCKED — IDENTITY MISMATCH',()=>{const f=fixture(),s=signed(f);const b=structuredClone(f.binding);b[k]=typeof b[k]==='number'?99:(k==='workflowPath'?'other':(k.endsWith('Policy')||k==='nonce'||k==='runnerImage'?'c'.repeat(64):'c'.repeat(40)));assert.throws(()=>verifyPackage(s.members,b,f.platform,f.context,f.p,schema),e=>['BLOCKED — IDENTITY MISMATCH','VERIFICATION FAIL'].includes(e.outcome));});
negative('B-tool-missing',f=>delete f.runtime.binding.toolBlobs[TOOL_PATHS[0]]);
test('C001 exact command policy expected=PASS',()=>assert.deepEqual(commandPolicy(policy,['bootstrap-syntax']),policy.commands));
for(const ids of [[],['arbitrary'],['bootstrap-syntax','extra']])test('C-command-'+JSON.stringify(ids)+' expected=VERIFICATION FAIL',()=>assert.throws(()=>commandPolicy(policy,ids)));
test('C002 forbidden command expected=VERIFICATION FAIL',()=>{const p=structuredClone(policy);p.commands[0].argv[0]='/usr/bin/npm';assert.throws(()=>commandPolicy(p,['bootstrap-syntax']));});
test('C003 PATH HOME ENV shell variables absent expected=PASS',()=>{const dir=mkdtempSync(join(tmpdir(),'vv-home-'));try{const before=process.env.NODE_OPTIONS;process.env.NODE_OPTIONS='--require=/candidate/poison';const env=safeEnvironment(dir);assert.equal(env.NODE_OPTIONS,undefined);assert.equal(env.BASH_ENV,undefined);assert.equal(env.ENV,undefined);assert.equal(env.PATH,'/usr/bin:/bin');assert.equal(env.HOME,dir);assert.equal(env.GITHUB_TOKEN,undefined);if(before===undefined)delete process.env.NODE_OPTIONS;else process.env.NODE_OPTIONS=before;}finally{rmSync(dir,{recursive:true});}});
test('C004 symlink HOME trusted evidence substitution expected=BLOCKED — TRUST',()=>{const dir=mkdtempSync(join(tmpdir(),'vv-link-'));try{symlinkSync(dir,join(dir,'link'));assert.throws(()=>noSymlinks(join(dir,'link'),{directory:true}),e=>e.outcome==='BLOCKED — TRUST');}finally{rmSync(dir,{recursive:true});}});
test('C005 overlapping trusted/evidence candidate expected=BLOCKED — TRUST',()=>{const dir=mkdtempSync(join(tmpdir(),'vv-layout-'));try{assert.throws(()=>validateLayout({trusted:dir,candidate:dir,evidence:dir,home:dir}),e=>e.outcome==='BLOCKED — TRUST');}finally{rmSync(dir,{recursive:true});}});
for(const k of ['active','defaultDeny','establishedBeforeExecution','hostControlled','trustedReadOnly','evidenceNonwritable','disposable','noCredentials','noSudo','noDaemon','firewallImmutable','provisioningImmutable','processAuditComplete'])negative('D-'+k,f=>f.runtime.isolation[0][k]=false,'BLOCKED — ISOLATION');
negative('D-missing',f=>f.runtime.isolation=[]);
negative('D-malformed',f=>f.runtime.isolation[0].active='true');
negative('D-root',f=>f.runtime.isolation[0].candidateUid=0);
negative('D-capability',f=>f.runtime.isolation[0].capabilities=['CAP_NET_ADMIN']);
negative('D-disappearance',f=>f.runtime.isolation[1].active=false,'BLOCKED — ISOLATION');
for(const k of ['runnerImage','runnerPolicy','isolationPolicy','policyDigest'])negative('D-wrong-'+k,f=>f.runtime.isolation[0][k]='c'.repeat(64),'BLOCKED — ISOLATION');
for(const k of policy.probeIds)negative('D-probe-'+k,f=>f.runtime.isolation[0].probes[k]='allowed');
for(const k of ['sensitiveDispatches','prohibitedNetworkActions'])negative('E-'+k,f=>f.runtime.audit[k]=1);
for(const k of ['complete','terminated','collectorAlive'])negative('E-'+k,f=>f.runtime.audit[k]=false);
negative('E-missing',f=>delete f.runtime.audit);
negative('E-zero-string',f=>f.runtime.audit.sensitiveDispatches='0');
negative('E-contract-order',f=>f.runtime.audit.contracts.reverse());
negative('E-contract-guard',f=>f.runtime.audit.contracts[0].guard='always()');
negative('E-forbidden-child',f=>f.runtime.audit.events[0].executable='supabase');
negative('E-orphan-child',f=>f.runtime.audit.events[0].parentPid=99);
negative('E-forbidden-network',f=>f.runtime.audit.events[0]={...f.runtime.audit.events[0],type:'probe',id:'tcp',result:'allowed'});
negative('E-missing-stage',f=>f.runtime.stages.pop());
negative('E-reordered-stage',f=>f.runtime.stages.reverse());
for(const status of ['skipped','cancelled','neutral','timed_out','action_required','missing','stale'])negative('E-stage-'+status,f=>f.runtime.stages[0].status=status);
negative('E-collector-incomplete',f=>f.runtime.collectorComplete=false);
negative('E-fake-pass',f=>{f.runtime.outcome='PASS';f.runtime.commands=[];});
negative('E-application-failure',f=>{f.runtime.commands[0].exitCode=1;f.runtime.commands[0].status='failure';f.runtime.outcome='APPLICATION FAIL';f.runtime.stages[1].status='failure';},'APPLICATION FAIL');
for(const path of ['../x','/x','a/../b','a//b','a\\b','.','a/./b'])test('F-path-'+path+' expected=VERIFICATION FAIL',()=>assert.throws(()=>validateMembers([{path,type:'file',bytes:Buffer.from('x')}],policy.limits)));
for(const type of ['symlink','device','directory'])test('F-type-'+type+' expected=VERIFICATION FAIL',()=>assert.throws(()=>validateMembers([{path:'x',type,bytes:Buffer.from('x')}],policy.limits)));
test('F-duplicate expected=VERIFICATION FAIL',()=>assert.throws(()=>validateMembers([{path:'x',type:'file',bytes:Buffer.alloc(0)},{path:'x',type:'file',bytes:Buffer.alloc(0)}],policy.limits)));
test('F-size expected=VERIFICATION FAIL',()=>assert.throws(()=>validateMembers([{path:'x',type:'file',bytes:Buffer.alloc(10)}],{...policy.limits,maxMemberBytes:2})));
test('F-archive-total expected=VERIFICATION FAIL',()=>assert.throws(()=>validateMembers([{path:'x',type:'file',bytes:Buffer.alloc(10)}],{...policy.limits,maxArchiveBytes:2})));
test('F-deterministic-seal expected=PASS',()=>{const f=fixture();assert.deepEqual(sealEvidence(f.runtime,[],f.p,schema),sealEvidence(f.runtime,[],f.p,schema));});
for(const [id,mutate,expected] of [
 ['G-missing-artifact',s=>s.members.pop(),'BLOCKED — MISSING ARTIFACT'],
 ['G-modified-artifact',s=>s.members[0].bytes=Buffer.from('{}'),'VERIFICATION FAIL'],
 ['G-unsafe-archive',s=>s.members[0].path='../x','VERIFICATION FAIL'],
 ['G-unexpected-file',s=>s.members.push({path:'fake-PASS',type:'file',bytes:Buffer.from('PASS')}),'VERIFICATION FAIL'],
 ['G-schema-drift',s=>{const e=parseCanonical(s.members[0].bytes);e.schemaVersion=2;s.members[0].bytes=bytes(e);},'VERIFICATION FAIL'],
 ['G-malformed',s=>s.members.at(-1).bytes=Buffer.from('{'),'VERIFICATION FAIL'],
 ['G-invalid-signature',s=>{s.attestation.signature=Buffer.alloc(64).toString('base64');s.members.at(-1).bytes=bytes(s.attestation);},'BLOCKED — AUTHENTICATION'],
 ['G-wrong-manifest',s=>{const m=parseCanonical(s.members[4].bytes);m.files[0].sha256='c'.repeat(64);s.members[4].bytes=bytes(m);},'VERIFICATION FAIL']])test(id+' expected='+expected,()=>{const f=fixture(),s=signed(f);mutate(s);assert.throws(()=>verifyPackage(s.members,f.binding,f.platform,f.context,f.p,schema),e=>e.outcome===expected);});
for(const [id,mutate] of [['H-expired',f=>f.platform.artifact.expired=true],['H-wrong-run',f=>f.platform.artifact.runId=999],['H-missing',f=>delete f.platform.artifact]])test(id+' expected=BLOCKED — MISSING ARTIFACT',()=>{const f=fixture(),s=signed(f);mutate(f);assert.throws(()=>verifyPackage(s.members,f.binding,f.platform,f.context,f.p,schema),e=>e.outcome==='BLOCKED — MISSING ARTIFACT');});
for(const status of ['failure','cancelled','in_progress'])test('H-newer-'+status+' expected=BLOCKED — IDENTITY MISMATCH',()=>{const f=fixture();f.platform.runs.push({...f.platform.runs[0],attempt:2,conclusion:status});assert.throws(()=>run(f),e=>e.outcome==='BLOCKED — IDENTITY MISMATCH');});
negative('H-pagination',f=>f.platform.pagesComplete=false);
negative('H-ambiguous',f=>f.platform.runs.push(f.platform.runs[0]));
negative('H-live-changed',f=>f.platform.final={...f.binding,head:'c'.repeat(40)},'BLOCKED — IDENTITY MISMATCH');
test('I-replay expected=BLOCKED — AUTHENTICATION',()=>{const f=fixture(),s=signed(f);verifyPackage(s.members,f.binding,f.platform,f.context,f.p,schema);assert.throws(()=>verifyPackage(s.members,f.binding,f.platform,f.context,f.p,schema),e=>e.outcome==='BLOCKED — AUTHENTICATION');});
test('I-production-synthetic expected=BLOCKED — AUTHENTICATION',()=>{const f=fixture();f.context.testOnly=false;assert.throws(()=>run(f),e=>e.outcome==='BLOCKED — AUTHENTICATION');});
for(const key of ['repository','head','headTree','base','baseTree','bootstrap','bootstrapTree','workflowPath','runId','attempt','jobId'])test('I-attestation-'+key+' expected=BLOCKED — IDENTITY MISMATCH',()=>{const f=fixture(),s=signed(f);s.attestation.payload.binding={...f.binding,[key]:typeof f.binding[key]==='number'?99:'c'.repeat(key.endsWith('Path')?5:40)};s.attestation.signature=sign(null,bytes(s.attestation.payload),privateKey).toString('base64');assert.throws(()=>verifyAttestation(s.attestation,f.binding,s.sealed.manifestDigest,f.context,f.p,schema),e=>e.outcome==='BLOCKED — IDENTITY MISMATCH');});
for(const key of ['manifestDigest','keyId','issuer','audience','expiresAt','candidateTerminated','collectorSealed'])test('I-attestation-'+key+' expected=non-PASS',()=>{const f=fixture(),s=signed(f);s.attestation.payload[key]=key==='expiresAt'?900:key.endsWith('Terminated')||key==='collectorSealed'?false:key==='manifestDigest'?'c'.repeat(64):'wrong';s.attestation.signature=sign(null,bytes(s.attestation.payload),privateKey).toString('base64');assert.throws(()=>verifyAttestation(s.attestation,f.binding,s.sealed.manifestDigest,f.context,f.p,schema));});
test('I-missing-attestation expected=BLOCKED — AUTHENTICATION',()=>{const f=fixture();assert.throws(()=>verifyAttestation(null,f.binding,d,f.context,f.p,schema),e=>e.outcome==='BLOCKED — AUTHENTICATION');});
test('I-overlap-OIDC expected=BLOCKED — AUTHENTICATION',async()=>{await assert.rejects(requestAttestation({candidateTerminated:false,collectorSealed:true,policy}),e=>e.outcome==='BLOCKED — AUTHENTICATION');});
test('J-runtime-activation expected=BLOCKED — ISOLATION',()=>assert.throws(()=>activationStatus(policy),e=>e.outcome==='BLOCKED — ISOLATION'));
test('J-auth-activation expected=BLOCKED — AUTHENTICATION',()=>{const p=structuredClone(policy);p.runner={publicKey:'fixture',image:d,policy:d,isolationPolicy:d,socket:'/fixture'};assert.throws(()=>activationStatus(p),e=>e.outcome==='BLOCKED — AUTHENTICATION');});
test('J-CLI-no-backdoor expected=BLOCKED — ISOLATION',()=>{try{execFileSync(process.execPath,['scripts/verify-safe-ci-evidence.mjs','inspect'],{env:{PATH:'/usr/bin:/bin'},stdio:'pipe'});assert.fail();}catch(e){assert.equal(e.status,1);assert.match(e.stderr.toString(),/BLOCKED — ISOLATION/);}});
test('K001 signed connected supervisor executor expected=PASS SYNTHETIC ONLY',async()=>{
 const f=fixture(),dir=mkdtempSync(join(tmpdir(),'vv-exec-'));const layout=Object.fromEntries(['trusted','candidate','evidence','home'].map(k=>{const path=join(dir,k);mkdirSync(path);return [k,path];}));const actions=[];
 const transport=async request=>{actions.push(request.action);const payload={action:request.action,seq:request.seq,bindingDigest:request.bindingDigest,nonce:request.nonce};if(request.action==='begin'){payload.isolation=f.isolation('before');payload.contracts=f.p.sensitiveStages.map(s=>({id:s.id,ordinal:s.ordinal,contract:{...s.contract,if:s.guard}}));}if(request.action==='execute'){assert.deepEqual(request.command,f.p.commands[0]);payload.isolation=f.isolation('during');payload.command=f.commands[0];}if(request.action==='finish'){payload.isolation=f.isolation('after');payload.audit=f.audit;}return {payload,signature:sign(null,bytes(payload),privateKey).toString('base64')};};
 try{const r=await executeTrusted({binding:f.binding,policy:f.p,layout,transport,publicKey,ids:['bootstrap-syntax']});assert.equal(r.outcome,'PASS');assert.deepEqual(actions,['begin','execute','finish']);}finally{rmSync(dir,{recursive:true});}
});
for(const [id,mutation,expected] of [
 ['K002 unavailable',p=>{p.isolation.active=false;},'BLOCKED — ISOLATION'],
 ['K003 forbidden-child',p=>{p.audit.events[0].executable='/usr/bin/supabase';},'VERIFICATION FAIL'],
 ['K004 application-exit',p=>{p.command.exitCode=7;},'APPLICATION FAIL'],
 ['K005 collector-killed',p=>{p.audit.collectorAlive=false;},'VERIFICATION FAIL'],
 ['K006 changed-command',p=>{p.command.argv=['/usr/bin/node','unexpected'];},'VERIFICATION FAIL']])test(id+' expected='+expected+' SYNTHETIC ONLY',async()=>{
 const f=fixture(),dir=mkdtempSync(join(tmpdir(),'vv-negative-'));const layout=Object.fromEntries(['trusted','candidate','evidence','home'].map(k=>{const path=join(dir,k);mkdirSync(path);return [k,path];}));
 const transport=async request=>{const payload={action:request.action,seq:request.seq,bindingDigest:request.bindingDigest,nonce:request.nonce,isolation:f.isolation(request.action==='begin'?'before':request.action==='finish'?'after':'during'),command:structuredClone(f.commands[0]),audit:structuredClone(f.audit),contracts:f.p.sensitiveStages.map(s=>({id:s.id,ordinal:s.ordinal,contract:{...s.contract,if:s.guard}}))};if(id.startsWith('K002')&&request.action==='begin'||id.startsWith('K004')&&request.action==='execute'||id.startsWith('K006')&&request.action==='execute'||(id.startsWith('K003')||id.startsWith('K005'))&&request.action==='finish')mutation(payload);return {payload,signature:sign(null,bytes(payload),privateKey).toString('base64')};};
 try{if(expected==='APPLICATION FAIL'){const r=await executeTrusted({binding:f.binding,policy:f.p,layout,transport,publicKey,ids:['bootstrap-syntax']});assert.equal(r.outcome,expected);}else await assert.rejects(executeTrusted({binding:f.binding,policy:f.p,layout,transport,publicKey,ids:['bootstrap-syntax']}),e=>e.outcome===expected);}finally{rmSync(dir,{recursive:true});}
});
test('K007 signed receipt replay/substitution expected=BLOCKED — ISOLATION',()=>{const payload={seq:1,nonce:d},receipt={payload,signature:sign(null,bytes(payload),privateKey).toString('base64')};assert.throws(()=>authenticateReceipt(receipt,{seq:2,nonce:d},publicKey),e=>e.outcome==='BLOCKED — ISOLATION');receipt.signature=Buffer.alloc(64).toString('base64');assert.throws(()=>authenticateReceipt(receipt,{seq:1},publicKey));});
test('K008 exclusive evidence storage candidate overwrite expected=VERIFICATION FAIL',()=>{const dir=mkdtempSync(join(tmpdir(),'vv-output-'));try{writeEvidence(dir,[{path:'manifest.json',type:'file',bytes:bytes({a:1})}]);assert.throws(()=>writeEvidence(dir,[{path:'manifest.json',type:'file',bytes:bytes({a:2})}]));assert.equal(readFileSync(join(dir,'manifest.json')).toString(),'{"a":1}');}finally{rmSync(dir,{recursive:true});}});
test('K009 policy contract substitution expected=VERIFICATION FAIL',()=>{const f=fixture();f.p.sensitiveStages[0].contract={run:'synthetic altered'};assert.throws(()=>validateSuppression(f.audit,f.p));});
test('K010 trusted-tool substitution expected=BLOCKED — TRUST',()=>{
 const dir=mkdtempSync(join(tmpdir(),'vv-source-'));try{
  execFileSync('/usr/bin/git',['init','-q',dir]);for(const p of TOOL_PATHS){const target=join(dir,p);mkdirSync(join(target,'..'),{recursive:true});writeFileSync(target,'synthetic tooling\n');}
  execFileSync('/usr/bin/git',['-C',dir,'add','.']);execFileSync('/usr/bin/git',['-C',dir,'-c','user.name=Test','-c','user.email=test@example.invalid','commit','-qm','synthetic']);
  const git=args=>execFileSync('/usr/bin/git',['-C',dir,...args],{encoding:'utf8'}).trim(),f=fixture();const b={...f.binding,bootstrap:git(['rev-parse','HEAD']),bootstrapTree:git(['rev-parse','HEAD^{tree}']),toolBlobs:Object.fromEntries(TOOL_PATHS.map(p=>[p,git(['rev-parse','HEAD:'+p])]))};assert.equal(validateTrustedSource(dir,b),true);
  for(const p of ['scripts/run-trusted-runtime.mjs','scripts/collect-trusted-runtime.mjs','scripts/verify-safe-ci-evidence.mjs','scripts/trusted-runtime-policy.json','scripts/trusted-runtime-schema.json']){writeFileSync(join(dir,p),'changed');assert.throws(()=>validateTrustedSource(dir,b),e=>e.outcome==='BLOCKED — TRUST');writeFileSync(join(dir,p),'synthetic tooling\n');}
 }finally{rmSync(dir,{recursive:true});}
});
test('L001 observed sensitive bodies/guards expected=PASS SYNTHETIC ONLY',()=>{const p=fixture().p;assert.equal(validateSensitiveContracts(p.sensitiveStages.map(s=>({id:s.id,ordinal:s.ordinal,contract:{...s.contract,if:s.guard}})),p),true);});
for(const [id,mutate]of [['L002-order',a=>a.reverse()],['L003-body',a=>a[0].contract.uses='synthetic-forbidden'],['L004-env',a=>a[0].contract.env={SECRET:'synthetic'}],['L005-with',a=>a[0].contract.with={version:'altered'}],['L006-guard',a=>a[0].contract.if='always()'],['L007-missing',a=>a.pop()]])test(id+' expected=VERIFICATION FAIL',()=>{const p=fixture().p,a=p.sensitiveStages.map(s=>({id:s.id,ordinal:s.ordinal,contract:{...s.contract,if:s.guard}}));mutate(a);assert.throws(()=>validateSensitiveContracts(a,p));});
negative('L008-unreviewed-child',f=>f.runtime.audit.events[0].argv=['--eval','synthetic-forbidden']);
negative('L009-missing-command',f=>f.runtime.commands=[]);
negative('L010-command-env',f=>f.runtime.commands[0].envKeysHash='c'.repeat(64));
negative('L011-command-argv',f=>f.runtime.commands[0].argv=['/usr/bin/node','arbitrary']);
negative('L012-active-throughout',f=>f.runtime.isolation[1].activeThroughout=false,'BLOCKED — ISOLATION');
negative('L013-zero-bootstrap',f=>f.runtime.binding.bootstrap='0'.repeat(40),'BLOCKED — IDENTITY MISMATCH');
negative('L014-extra-telemetry-field',f=>f.runtime.gps='synthetic-extra-denied');
test('L015 no raw environment or stdout recorded expected=PASS',()=>{const f=fixture(),s=signed(f);const text=s.members.map(m=>m.bytes.toString()).join('');assert.equal(text.includes('GITHUB_TOKEN'),false);assert.equal(text.includes('process.env'),false);assert.equal(text.includes('stdout'),false);});
test('L016 duplicate archive manifest entry expected=VERIFICATION FAIL',()=>{const f=fixture(),s=signed(f),m=parseCanonical(s.members[4].bytes);m.files.push(m.files[0]);s.members[4].bytes=bytes(m);assert.throws(()=>verifyPackage(s.members,f.binding,f.platform,f.context,f.p,schema));});
test('L017 production attestation marked synthetic expected=BLOCKED — AUTHENTICATION',()=>{const f=fixture(),s=signed(f);assert.throws(()=>verifyAttestation(s.attestation,f.binding,s.sealed.manifestDigest,{...f.context,testOnly:false},f.p,schema),e=>e.outcome==='BLOCKED — AUTHENTICATION');});
test('M001 signed current-target expected=PASS SYNTHETIC ONLY',async()=>{const {verifySignedTarget}=await import('./verify-safe-ci-evidence.mjs');const f=fixture(),receipt={binding:f.binding,signature:sign(null,bytes(f.binding),privateKey).toString('base64')};assert.deepEqual(verifySignedTarget(receipt,f.p,schema,{runId:2,attempt:1}),f.binding);assert.throws(()=>verifySignedTarget(receipt,f.p,schema,{runId:3}),e=>e.outcome==='BLOCKED — IDENTITY MISMATCH');receipt.signature=Buffer.alloc(64).toString('base64');assert.throws(()=>verifySignedTarget(receipt,f.p,schema,{runId:2}),e=>e.outcome==='BLOCKED — TRUST');});
test('M002 nonce ledger signed current challenge expected=PASS SYNTHETIC ONLY',async()=>{const {verifyNonceReceipt}=await import('./verify-safe-ci-evidence.mjs');const f=fixture(),challenge='c'.repeat(64),manifestDigest='d'.repeat(64),payload={kind:'nonce-consumed',bindingDigest:hash(bytes(f.binding)),manifestDigest,nonce:f.binding.nonce,challenge,consumed:true},receipt={payload,signature:sign(null,bytes(payload),privateKey).toString('base64')};assert.equal(verifyNonceReceipt(receipt,f.binding,manifestDigest,f.p,challenge),true);assert.throws(()=>verifyNonceReceipt(receipt,f.binding,manifestDigest,f.p,'e'.repeat(64)),e=>e.outcome==='BLOCKED — AUTHENTICATION');});
test('N001 sealed failed application diagnostic expected=APPLICATION FAIL SYNTHETIC ONLY',()=>{const f=fixture();f.runtime.commands[0].exitCode=7;f.runtime.commands[0].status='failure';f.runtime.stages[1].status='failure';f.runtime.outcome='APPLICATION FAIL';const sealed=sealEvidence(f.runtime,[],f.p,schema);assert.equal(parseCanonical(sealed.members[0].bytes).outcome,'APPLICATION FAIL');assert.throws(()=>run(f),e=>e.outcome==='APPLICATION FAIL');});
test('N002 fake candidate PASS with genuine failure expected=VERIFICATION FAIL',()=>{const f=fixture();f.runtime.commands[0].exitCode=7;f.runtime.commands[0].status='failure';assert.throws(()=>run(f),e=>e.outcome==='VERIFICATION FAIL');});
test('N003 sealed artifacts size/hash binding expected=PASS SYNTHETIC ONLY',()=>{const f=fixture();const s=sealEvidence(f.runtime,[{path:'artifacts/synthetic.txt',type:'file',bytes:Buffer.from('fixture')}],f.p,schema);const files=parseCanonical(s.members.find(m=>m.path==='files.json').bytes);assert.deepEqual(files,[{path:'artifacts/synthetic.txt',size:7,sha256:hash(Buffer.from('fixture'))}]);});
