// Trusted supervisor client. No candidate code is imported and no shell is used.
import {createHash, verify as verifySignature} from 'node:crypto';
import {readFileSync,lstatSync,realpathSync} from 'node:fs';
import {resolve,dirname,isAbsolute,sep} from 'node:path';
import {execFileSync} from 'node:child_process';
import {connect} from 'node:net';
import {pathToFileURL} from 'node:url';
export const OUTCOMES=Object.freeze(['PASS','APPLICATION FAIL','VERIFICATION FAIL','BLOCKED — ENVIRONMENT','BLOCKED — TRUST','BLOCKED — MISSING ARTIFACT','BLOCKED — IDENTITY MISMATCH','BLOCKED — ISOLATION','BLOCKED — AUTHENTICATION']);
export class RuntimeError extends Error {constructor(outcome,message){super(message);this.outcome=outcome;}}
export function requireInvariant(condition,message,outcome='VERIFICATION FAIL'){if(!condition)throw new RuntimeError(outcome,message);}
export const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export function canonical(value){
  if(value===null||typeof value==='boolean'||typeof value==='string')return JSON.stringify(value);
  if(typeof value==='number'){requireInvariant(Number.isSafeInteger(value)&&!Object.is(value,-0),'Noncanonical number');return String(value);}
  if(Array.isArray(value)){requireInvariant(Object.keys(value).length===value.length,'Sparse/extended array');return '['+value.map(canonical).join(',')+']';}
  requireInvariant(value&&Object.getPrototypeOf(value)===Object.prototype,'Nonplain/undefined object');
  return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
}
export const bytes=value=>Buffer.from(canonical(value),'utf8');
export function parseCanonical(buffer){
  requireInvariant(Buffer.isBuffer(buffer)&&buffer.length<=16*1024*1024,'JSON size/type');
  const s=new TextDecoder('utf-8',{fatal:true}).decode(buffer);let v;try{v=JSON.parse(s);}catch{throw new RuntimeError('VERIFICATION FAIL','Malformed JSON');}
  requireInvariant(bytes(v).equals(buffer),'Noncanonical JSON/BOM/duplicate key/whitespace');return v;
}
export function validateSchema(value,schema,root=schema){
  if(schema.$ref)return validateSchema(value,root.$defs[schema.$ref.split('/').at(-1)],root);
  if(schema.enum)requireInvariant(schema.enum.some(v=>canonical(v)===canonical(value)),'Schema enum');
  if(schema.type==='object'){
    requireInvariant(value&&Object.getPrototypeOf(value)===Object.prototype,'Schema object');
    for(const k of schema.required??[])requireInvariant(Object.hasOwn(value,k),'Missing '+k);
    for(const k of Object.keys(value)){requireInvariant(Object.hasOwn(schema.properties??{},k)||schema.additionalProperties!==false,'Unexpected '+k);validateSchema(value[k],schema.properties?.[k]??schema.additionalProperties,root);}
  }else if(schema.type==='array'){
    requireInvariant(Array.isArray(value)&&value.length>=(schema.minItems??0)&&value.length<=(schema.maxItems??10000),'Schema array');
    value.forEach(v=>validateSchema(v,schema.items,root));
  }else if(schema.type==='string')requireInvariant(typeof value==='string'&&value.length<=(schema.maxLength??4096)&&(!schema.pattern||new RegExp(schema.pattern).test(value)),'Schema string');
  else if(schema.type==='integer')requireInvariant(Number.isSafeInteger(value)&&value>=(schema.minimum??0)&&value<=(schema.maximum??Number.MAX_SAFE_INTEGER),'Schema integer');
  else if(schema.type==='boolean')requireInvariant(typeof value==='boolean','Schema boolean');
  else if(schema.type==='null')requireInvariant(value===null,'Schema null');
  else if(schema.type==='nullableInteger')requireInvariant(value===null||Number.isSafeInteger(value),'Schema nullable integer');
  else if(schema.type==='nullableString')requireInvariant(value===null||typeof value==='string','Schema nullable string');
  else requireInvariant(false,'Unknown schema primitive');return value;
}
export function safePath(path){requireInvariant(typeof path==='string'&&/^[A-Za-z0-9_.\-/]+$/.test(path)&&!path.startsWith('/')&&!path.includes('\\')&&path.split('/').every(p=>p&&p!=='.'&&p!=='..'),'Unsafe path');return path;}
export function noSymlinks(path,{directory=false,ownerUid}={}){
  requireInvariant(isAbsolute(path)&&resolve(path)===path,'Absolute normalized path required','BLOCKED — TRUST');
  let walk=path;while(true){const s=lstatSync(walk);requireInvariant(!s.isSymbolicLink(),'Symlink substitution','BLOCKED — TRUST');if(walk===path)requireInvariant(directory?s.isDirectory():s.isFile(),'Special/nonregular path','BLOCKED — TRUST');if(ownerUid!==undefined)requireInvariant(s.uid===ownerUid&&(s.mode&0o022)===0,'Untrusted ownership/mode','BLOCKED — TRUST');if(walk===dirname(walk))break;walk=dirname(walk);}
  requireInvariant(realpathSync(path)===path,'Path alias','BLOCKED — TRUST');return path;
}
export const TOOL_PATHS=['.github/workflows/varsityvue-safe-required.yml','scripts/verify-safe-ci-evidence.mjs','scripts/verify-safe-ci-evidence.test.mjs','scripts/run-trusted-runtime.mjs','scripts/collect-trusted-runtime.mjs','scripts/trusted-runtime-policy.json','scripts/trusted-runtime-schema.json','scripts/trusted-runtime.test.mjs'];
export function validateRunnerPins(b,policy){
  for(const [bindingKey,policyKey]of [['runnerImage','image'],['runnerPolicy','policy'],['isolationPolicy','isolationPolicy']])requireInvariant(typeof policy.runner?.[policyKey]==='string'&&/^[a-f0-9]{64}$/.test(policy.runner[policyKey])&&b[bindingKey]===policy.runner[policyKey],'Trusted runner pin '+bindingKey,'BLOCKED — ISOLATION');return true;
}
export function validateBinding(b,policy,schema){validateSchema(b,schema.$defs.binding,schema);requireInvariant(b.repositoryId===policy.repositoryId&&b.repository===policy.repository&&b.event==='pull_request'&&b.baseRef==='main'&&b.workflowPath==='.github/workflows/varsityvue-safe-required.yml'&&policy.actions.includes(b.action),'Repository/event mismatch','BLOCKED — IDENTITY MISMATCH');for(const key of ['base','baseTree','head','headTree','merge','bootstrap','bootstrapTree'])requireInvariant(!/^0+$/.test(b[key]),'Zero identity','BLOCKED — IDENTITY MISMATCH');
  requireInvariant(b.mergeParents.length===2&&b.mergeParents[0]===b.base&&b.mergeParents[1]===b.head,'Merge parents','BLOCKED — IDENTITY MISMATCH');requireInvariant(Object.keys(b.toolBlobs).sort().join('|')===TOOL_PATHS.slice().sort().join('|'),'Tool identities','BLOCKED — TRUST');validateRunnerPins(b,policy);return b;}
export function validateTrustedSource(root,b){
  noSymlinks(root,{directory:true});const git=args=>execFileSync('/usr/bin/git',['-C',root,...args],{encoding:'utf8',env:{PATH:'/usr/bin:/bin',HOME:'/nonexistent',GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null',GIT_NO_REPLACE_OBJECTS:'1'}}).trim();
  requireInvariant(git(['rev-parse','HEAD'])===b.bootstrap&&git(['rev-parse','HEAD^{tree}'])===b.bootstrapTree,'Bootstrap checkpoint','BLOCKED — TRUST');
  for(const p of TOOL_PATHS){const path=noSymlinks(resolve(root,p));const contents=readFileSync(path);const blob=createHash('sha1').update('blob '+contents.length+'\0').update(contents).digest('hex');requireInvariant(blob===b.toolBlobs[p]&&git(['rev-parse',b.bootstrap+':'+p])===blob,'Trusted tool substitution: '+p,'BLOCKED — TRUST');}return true;
}
export function validateLayout(layout){
  const roots=['trusted','candidate','evidence','home'];for(const k of roots)noSymlinks(layout[k],{directory:true});
  for(const a of roots)for(const b of roots)if(a!==b)requireInvariant(!layout[a].startsWith(layout[b]+sep)&&layout[a]!==layout[b],'Overlapping trust directories','BLOCKED — TRUST');
  return true;
}
export function commandPolicy(policy,ids){requireInvariant(Array.isArray(ids)&&ids.length===policy.commands.length&&canonical(ids)===canonical(policy.commands.map(c=>c.id)),'Unexpected/reordered command');for(const c of policy.commands){requireInvariant(isAbsolute(c.argv[0])&&!c.argv.some(a=>typeof a!=='string'||a.includes('\0'))&&c.cwdClass==='candidate','Command argv');requireInvariant(!/(?:npm|npx|sudo|supabase|psql|docker|curl|wget|bash|sh)$/.test(c.argv[0]),'Forbidden executable');}return structuredClone(policy.commands);}
export function safeEnvironment(home){noSymlinks(home,{directory:true});return {PATH:'/usr/bin:/bin',HOME:home,LANG:'C.UTF-8',NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_COVERAGE_DEMAND_ENABLED:'false',COVERAGE_DEMAND_INGESTION_ENABLED:'false',COVERAGE_DEMAND_MONITOR_ENABLED:'false',COVERAGE_DEMAND_FLEET_ENABLED:'false'};}
export function validateIsolation(c,b,policy,phase){
  validateRunnerPins(b,policy);
  requireInvariant(c&&c.phase===phase&&c.bindingDigest===hash(bytes(b))&&c.runnerImage===b.runnerImage&&c.runnerPolicy===b.runnerPolicy&&c.isolationPolicy===b.isolationPolicy,'Isolation identity/missing evidence','BLOCKED — ISOLATION');
  requireInvariant(c.candidateUid>0&&Number.isSafeInteger(c.candidateUid)&&c.capabilities.length===0,'Candidate privilege','BLOCKED — ISOLATION');
  for(const k of ['defaultDeny','establishedBeforeExecution','active','activeThroughout','hostControlled','disposable','trustedReadOnly','evidenceNonwritable','processAuditComplete','noCredentials','noSudo','noDaemon','firewallImmutable','provisioningImmutable'])requireInvariant(c[k]===true,'Isolation '+k,'BLOCKED — ISOLATION');
  requireInvariant(c.policyDigest===hash(bytes(policy)),'Isolation policy substitution','BLOCKED — ISOLATION');
  requireInvariant(c.probes&&canonical(c.probes)===canonical({tcp:'denied',udp:'denied',dns:'denied',child:'denied',firewall:'denied',privilege:'denied'}),'Isolation probes','BLOCKED — ISOLATION');return c;
}
export function validateSensitiveContracts(observed,policy){
  requireInvariant(Array.isArray(observed)&&observed.length===10,'Missing sensitive source contracts');
  for(const [i,s]of observed.entries()){const expected=policy.sensitiveStages[i];const body={...s.contract};const guard=body.if;delete body.if;
    requireInvariant(s.id===expected.id&&s.ordinal===expected.ordinal&&guard===expected.guard&&canonical(body)===canonical(expected.contract),'Sensitive source body/env/with/order/guard');
  }return true;
}
export function validateSuppression(audit,policy,commands){
  requireInvariant(audit&&audit.complete===true&&audit.terminated===true&&audit.collectorAlive===true&&audit.sensitiveDispatches===0&&audit.prohibitedNetworkActions===0,'Missing/nonzero suppression');
  const contracts=policy.sensitiveStages.map(({contract,...record})=>{requireInvariant(hash(bytes(contract))===record.contractSha256,'Trusted contract hash');return record;});
  requireInvariant(canonical(audit.contracts)===canonical(contracts),'Sensitive contract/body/env/with/order/guard');
  requireInvariant(Array.isArray(audit.events)&&audit.events.every((e,i)=>e.seq===i+1),'Process sequence');
  requireInvariant(Number.isSafeInteger(audit.supervisorPid)&&audit.supervisorPid>0,'Supervisor PID');
  const processes=new Map(),roots=[];
  for(const e of audit.events){
    requireInvariant(['exec','exit','probe'].includes(e.type)&&Number.isSafeInteger(e.pid)&&e.pid>0&&Array.isArray(e.argv),'Malformed process event');
    requireInvariant(!policy.forbiddenExecutables.includes(e.executable.split('/').at(-1))&&!e.argv.some(v=>policy.forbiddenTokens.includes(v))&&!policy.sensitiveStages.some(s=>s.id===e.id),'Forbidden process/stage evidence');
    const parent=processes.get(e.parentPid),parentActive=e.parentPid===audit.supervisorPid||(parent&&!parent.exit);
    requireInvariant(parentActive,'Unknown/exited/reparented process');
    if(e.type==='exec'){
      requireInvariant(e.pid!==audit.supervisorPid&&!processes.has(e.pid)&&e.result==='success'&&!Object.hasOwn(e,'exitCode')&&!Object.hasOwn(e,'signal'),'Duplicate/malformed exec');
      requireInvariant(policy.allowedProcesses.some(p=>p.executable===e.executable&&canonical(p.argv)===canonical(e.argv)),'Unreviewed child executable/argv');
      if(e.parentPid===audit.supervisorPid){const c=policy.commands[roots.length];requireInvariant(c&&roots.every(pid=>processes.get(pid).exit)&&e.id===c.id&&e.executable===c.argv[0]&&canonical(e.argv)===canonical(c.argv.slice(1)),'Missing/reordered/concurrent command dispatch');roots.push(e.pid);}else requireInvariant(e.id===parent.exec.id,'Child command identity');
      processes.set(e.pid,{exec:e,exit:null});
    }else if(e.type==='exit'){
      const record=processes.get(e.pid);requireInvariant(record&&!record.exit&&e.parentPid===record.exec.parentPid&&e.id===record.exec.id&&e.executable===record.exec.executable&&canonical(e.argv)===canonical(record.exec.argv),'Orphan/duplicate/substituted exit');
      requireInvariant(![...processes.values()].some(p=>p.exec.parentPid===e.pid&&!p.exit),'Exit with live child');
      requireInvariant((Number.isSafeInteger(e.exitCode)&&e.exitCode>=0&&e.signal===null)||(e.exitCode===null&&typeof e.signal==='string'&&e.signal.length>0),'Missing process exit status');
      requireInvariant(e.result===(e.exitCode===0&&e.signal===null?'success':'failure'),'Contradictory process result');record.exit=e;
    }else requireInvariant(e.result==='denied'&&policy.probeIds.includes(e.id)&&(e.pid===audit.supervisorPid||processes.has(e.pid)&&!processes.get(e.pid).exit),'Forbidden/orphan network evidence');
  }
  requireInvariant(roots.length>0&&[...processes.values()].every(p=>p.exit),'Missing/incomplete process lifecycle');
  if(commands!==undefined){requireInvariant(Array.isArray(commands)&&roots.length===commands.length,'Command/process evidence count');for(const [i,pid]of roots.entries()){const {exec,exit}=processes.get(pid),c=commands[i];requireInvariant(c.seq===i+1&&exec.id===c.id&&exec.executable===c.argv[0]&&canonical(exec.argv)===canonical(c.argv.slice(1))&&exit.result===c.status&&exit.exitCode===c.exitCode&&exit.signal===c.signal,'Command/process result mismatch');}}
  return audit;
}
// Only a separately provisioned supervisor with a pinned public key can return
// authenticated receipts. Synthetic adapters use this same protocol in tests.
export function authenticateReceipt(receipt,expected,key){
  requireInvariant(key&&receipt&&typeof receipt.signature==='string','Missing supervisor authentication','BLOCKED — ISOLATION');
  requireInvariant(verifySignature(null,bytes(receipt.payload),key,Buffer.from(receipt.signature,'base64')),'Invalid supervisor signature','BLOCKED — ISOLATION');
  for(const [k,v] of Object.entries(expected))requireInvariant(canonical(receipt.payload[k])===canonical(v),'Receipt binding/replay','BLOCKED — ISOLATION');return receipt.payload;
}
export function unixTransport(socketPath,maxBytes=16*1024*1024){
  noSymlinks(dirname(socketPath),{directory:true,ownerUid:0});const s=lstatSync(socketPath);requireInvariant(s.isSocket()&&s.uid===0&&(s.mode&0o007)===0,'Untrusted supervisor socket','BLOCKED — TRUST');
  return request=>new Promise((resolveReply,reject)=>{let data=Buffer.alloc(0);const socket=connect(socketPath);socket.setTimeout(30000);socket.on('connect',()=>socket.end(bytes(request)));socket.on('data',chunk=>{data=Buffer.concat([data,chunk]);if(data.length>maxBytes){socket.destroy();reject(new RuntimeError('VERIFICATION FAIL','Oversized supervisor reply'));}});socket.on('timeout',()=>{socket.destroy();reject(new RuntimeError('BLOCKED — ENVIRONMENT','Supervisor timeout'));});socket.on('error',reject);socket.on('end',()=>{try{resolveReply(parseCanonical(data));}catch(e){reject(e);}});});
}
export async function executeTrusted({binding,policy,layout,transport,publicKey,ids}){
  validateLayout(layout);const commands=commandPolicy(policy,ids),env=safeEnvironment(layout.home),bindingDigest=hash(bytes(binding));let seq=0;
  const call=async(action,data={})=>{const expected={action,seq:++seq,bindingDigest,nonce:binding.nonce};return authenticateReceipt(await transport({...expected,...data}),expected,publicKey);};
  const first=await call('begin',{commands,layout,environment:env});validateIsolation(first.isolation,binding,policy,'before');validateSensitiveContracts(first.contracts,policy);
  const results=[],during=[];let failed=false;
  try{for(const c of commands){const r=await call('execute',{command:c});validateIsolation(r.isolation,binding,policy,'during');during.push(r.isolation);requireInvariant(canonical(r.command.argv)===canonical(c.argv)&&r.command.id===c.id&&r.command.seq===results.length+1,'Command substitution');requireInvariant((Number.isSafeInteger(r.command.exitCode)&&r.command.exitCode>=0&&r.command.signal===null)||(r.command.exitCode===null&&typeof r.command.signal==='string'&&r.command.signal.length>0),'Missing exit status');r.command.status=r.command.exitCode===0&&r.command.signal===null?'success':'failure';results.push(r.command);if(r.command.exitCode!==0||r.command.signal!==null){failed=true;break;}}}
  finally{const finished=await call('finish');validateIsolation(finished.isolation,binding,policy,'after');validateSuppression(finished.audit,policy);first.final=finished;}
  validateSuppression(first.final.audit,policy,results);
  return {binding,isolation:[first.isolation,...during,first.final.isolation],commands:results,audit:first.final.audit,outcome:failed?'APPLICATION FAIL':'PASS'};
}
export function activationStatus(policy){
  if(!policy.runner.publicKey||!policy.runner.image||!policy.runner.policy||!policy.runner.isolationPolicy||!policy.runner.socket)throw new RuntimeError('BLOCKED — ISOLATION','Dedicated runner identities/receipt key not provisioned');
  if(!policy.attestation.publicKey||!policy.attestation.endpoint||!policy.attestation.keyId)throw new RuntimeError('BLOCKED — AUTHENTICATION','Independent attestation identity not provisioned');
  requireInvariant(policy.activation===true,'Runtime activation remains disabled','BLOCKED — ENVIRONMENT');return true;
}
export async function runProvisioned(){
  // This fixed path is provisioning-owned, never a PR input or environment ref.
  const root='/opt/varsityvue/trusted',target='/opt/varsityvue/control/target.json';
  const policy=parseCanonical(readFileSync(new URL('./trusted-runtime-policy.json',import.meta.url)));activationStatus(policy);
  requireInvariant(new URL('..',import.meta.url).pathname.replace(/\/$/,'')===root,'Executor not loaded from trusted absolute path','BLOCKED — TRUST');
  noSymlinks(target,{ownerUid:0});noSymlinks(root,{directory:true,ownerUid:0});
  const binding=parseCanonical(readFileSync(target)),schema=parseCanonical(readFileSync(new URL('./trusted-runtime-schema.json',import.meta.url)));
  validateBinding(binding,policy,schema);validateTrustedSource(root,binding);
  requireInvariant(binding.runnerImage===policy.runner.image&&binding.runnerPolicy===policy.runner.policy&&binding.isolationPolicy===policy.runner.isolationPolicy,'Provisioning policy identity','BLOCKED — ISOLATION');
  const layout={trusted:root,candidate:'/var/lib/varsityvue/candidate',evidence:'/var/lib/varsityvue/runtime-evidence',home:'/var/lib/varsityvue/candidate-home'};
  noSymlinks(layout.evidence,{directory:true,ownerUid:0});
  const runtime=await executeTrusted({binding,policy,layout,transport:unixTransport(policy.runner.socket),publicKey:policy.runner.publicKey,ids:policy.commands.map(c=>c.id)});
  const {sealEvidence,writeEvidence}=await import('./collect-trusted-runtime.mjs');
  const complete={...runtime,schemaVersion:1,stages:policy.stages.map(id=>({id,status:id==='application'&&runtime.outcome==='APPLICATION FAIL'?'failure':'success'})),collectorComplete:true};
  writeEvidence(layout.evidence,sealEvidence(complete,[],policy,schema).members,{protectedStorage:true});
  requireInvariant(runtime.outcome==='PASS','Candidate command failed','APPLICATION FAIL');return complete;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{requireInvariant(process.argv.length===3&&['inspect','run'].includes(process.argv[2]),'Invalid CLI');if(process.argv[2]==='run')await runProvisioned();else activationStatus(parseCanonical(readFileSync(new URL('./trusted-runtime-policy.json',import.meta.url))));}catch(e){console.error(e.outcome??'VERIFICATION FAIL',e.message);process.exitCode=1;}}
