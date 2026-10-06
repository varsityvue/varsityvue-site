import {verify as verifySignature,createPublicKey,randomBytes} from 'node:crypto';
import {inflateRawSync} from 'node:zlib';
import {readFileSync,mkdirSync,openSync,writeFileSync,closeSync,constants} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {bytes,hash,parseCanonical,validateSchema,validateBinding,requireInvariant,RuntimeError,activationStatus,canonical,noSymlinks,validateTrustedSource} from './run-trusted-runtime.mjs';
import {validateMembers,validateRuntime,REQUIRED_FILES} from './collect-trusted-runtime.mjs';
export const REQUIRED_CHECK='VarsityVue safe verification';
export const WORKFLOW='.github/workflows/varsityvue-safe-required.yml';
export const APP_ID=15368;
export function verifyAttestation(attestation,binding,manifestDigest,context,policy,schema){
  requireInvariant(attestation,'Missing attestation','BLOCKED — AUTHENTICATION');validateSchema(attestation,schema.$defs.attestation,schema);
  requireInvariant(!attestation.testOnly||context.testOnly===true,'Synthetic authentication in production','BLOCKED — AUTHENTICATION');
  const a=attestation.payload;requireInvariant(policy.attestation.publicKey&&policy.attestation.keyId,'Unprovisioned attestation identity','BLOCKED — AUTHENTICATION');
  requireInvariant(a.keyId===policy.attestation.keyId&&a.issuer===policy.attestation.issuer&&a.audience===policy.attestation.audience,'Wrong authentication identity','BLOCKED — AUTHENTICATION');
  requireInvariant(verifySignature(null,bytes(a),policy.attestation.publicKey,Buffer.from(attestation.signature,'base64')),'Invalid signature','BLOCKED — AUTHENTICATION');
  requireInvariant(canonical(a.binding)===canonical(binding)&&a.manifestDigest===manifestDigest,'Attestation identity mismatch','BLOCKED — IDENTITY MISMATCH');
  requireInvariant(Number.isSafeInteger(context.now)&&a.issuedAt<=context.now&&a.expiresAt>context.now&&a.expiresAt-a.issuedAt<=300&&a.candidateTerminated===true&&a.collectorSealed===true,'Stale/overlapping authentication','BLOCKED — AUTHENTICATION');
  requireInvariant(context.nonceLedger&&typeof context.nonceLedger.consume==='function','No trusted replay ledger','BLOCKED — AUTHENTICATION');
  return a;
}
export function selectCurrentRun(runs,expected,{pagesComplete}){
  requireInvariant(pagesComplete===true&&Array.isArray(runs),'Incomplete pagination');
  const applicable=runs.filter(r=>r.repository===expected.repository&&r.pr===expected.pr&&r.workflowPath===expected.workflowPath&&r.head===expected.head&&r.base===expected.base);
  requireInvariant(applicable.length>0,'Missing current run','BLOCKED — MISSING ARTIFACT');
  requireInvariant(applicable.every(r=>Number.isSafeInteger(r.runId)&&Number.isSafeInteger(r.attempt)),'Malformed run');
  applicable.sort((a,b)=>b.runId-a.runId||b.attempt-a.attempt);const current=applicable[0];
  requireInvariant(applicable.filter(r=>r.runId===current.runId&&r.attempt===current.attempt).length===1,'Ambiguous latest run');
  requireInvariant(current.runId===expected.runId&&current.attempt===expected.attempt,'Superseded/old attempt','BLOCKED — IDENTITY MISMATCH');
  requireInvariant(current.status==='completed'&&current.conclusion==='success'&&current.appId===APP_ID&&current.jobId===expected.jobId&&current.workflowId===expected.workflowId,'Required producer non-success/source/job');return current;
}
function crc32(b){let c=0xffffffff;for(const byte of b){c^=byte;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
// Small bounded ZIP reader; no extraction to filesystem, no ZIP64/encryption,
// directories, data-descriptor ambiguity, alias names or unknown extra fields.
export function readZip(archive,limits){
  requireInvariant(Buffer.isBuffer(archive)&&archive.length>=22&&archive.length<=limits.maxArchiveBytes,'Archive size');
  const end=archive.length-22;requireInvariant(archive.readUInt32LE(end)===0x06054b50,'ZIP footer/comment/trailing bytes');
  requireInvariant(archive.readUInt16LE(end+4)===0&&archive.readUInt16LE(end+6)===0&&archive.readUInt16LE(end+20)===0,'Multidisk/comment');
  const count=archive.readUInt16LE(end+10),offset=archive.readUInt32LE(end+16),length=archive.readUInt32LE(end+12);requireInvariant(count>0&&count<=limits.maxMembers&&count===archive.readUInt16LE(end+8)&&offset+length===end,'ZIP central bounds');
  let pos=offset,localEnd=0,total=0;const members=[];
  for(let i=0;i<count;i++){
    requireInvariant(pos+46<=end&&archive.readUInt32LE(pos)===0x02014b50,'Central record');
    const flags=archive.readUInt16LE(pos+8),method=archive.readUInt16LE(pos+10),crc=archive.readUInt32LE(pos+16),compressed=archive.readUInt32LE(pos+20),size=archive.readUInt32LE(pos+24),n=archive.readUInt16LE(pos+28),extra=archive.readUInt16LE(pos+30),comment=archive.readUInt16LE(pos+32),disk=archive.readUInt16LE(pos+34),attributes=archive.readUInt32LE(pos+38),local=archive.readUInt32LE(pos+42);
    requireInvariant(flags===0||flags===0x800,'Encrypted/descriptor/unsupported ZIP flags');requireInvariant([0,8].includes(method)&&extra===0&&comment===0&&disk===0&&size<=limits.maxMemberBytes&&compressed<=limits.maxArchiveBytes,'ZIP method/extra/size');
    requireInvariant(pos+46+n<=end&&local===localEnd&&local+30<=offset,'ZIP overlap/out-of-order');
    const nameBytes=archive.subarray(pos+46,pos+46+n),name=new TextDecoder('utf-8',{fatal:true}).decode(nameBytes);requireInvariant(Buffer.from(name).equals(nameBytes),'ZIP name encoding');
    const mode=attributes>>>16;requireInvariant((mode&0o170000)===0||(mode&0o170000)===0o100000,'ZIP symlink/device/directory');requireInvariant((attributes&0x10)===0,'ZIP directory');
    requireInvariant(archive.readUInt32LE(local)===0x04034b50&&archive.readUInt16LE(local+6)===flags&&archive.readUInt16LE(local+8)===method&&archive.readUInt32LE(local+14)===crc&&archive.readUInt32LE(local+18)===compressed&&archive.readUInt32LE(local+22)===size&&archive.readUInt16LE(local+26)===n&&archive.readUInt16LE(local+28)===0,'Local/central mismatch');
    const start=local+30+n;requireInvariant(start+compressed<=offset&&archive.subarray(local+30,start).equals(nameBytes),'ZIP local name/bounds');
    const raw=archive.subarray(start,start+compressed),content=method===0?Buffer.from(raw):inflateRawSync(raw,{maxOutputLength:limits.maxMemberBytes});requireInvariant(content.length===size&&crc32(content)===crc,'ZIP length/CRC');total+=size;requireInvariant(total<=limits.maxArchiveBytes,'ZIP expanded size');members.push({path:name,type:'file',bytes:content});localEnd=start+compressed;pos+=46+n;
  }
  requireInvariant(pos===end&&localEnd===offset,'ZIP unreferenced bytes');return validateMembers(members,limits);
}
export function validateSealedPackage(members,expected,platform,policy,schema){
  validateBinding(expected,policy,schema);selectCurrentRun(platform.runs,expected,platform);
  requireInvariant(canonical(platform.initial)===canonical(expected)&&canonical(platform.final)===canonical(expected),'Live binding changed','BLOCKED — IDENTITY MISMATCH');
  requireInvariant(platform.artifact&&platform.artifact.expired===false&&platform.artifact.runId===expected.runId&&platform.artifact.attempt===expected.attempt&&platform.artifact.id>0,'Missing/stale/expired artifact','BLOCKED — MISSING ARTIFACT');
  validateMembers(members,policy.limits);const map=new Map(members.map(m=>[m.path,m.bytes]));for(const p of REQUIRED_FILES.filter(p=>p!=='attestation.json'))requireInvariant(map.has(p),'Missing '+p,'BLOCKED — MISSING ARTIFACT');
  const manifest=parseCanonical(map.get('manifest.json'));validateSchema(manifest,schema.$defs.manifest,schema);requireInvariant(manifest.bindingDigest===hash(bytes(expected)),'Manifest identity','BLOCKED — IDENTITY MISMATCH');
  requireInvariant(canonical(manifest.files)===canonical(manifest.files.slice().sort((a,b)=>a.path<b.path?-1:1)),'Manifest ordering');
  const listed=manifest.files.map(f=>f.path);requireInvariant(new Set(listed).size===listed.length&&!listed.includes('manifest.json')&&!listed.includes('attestation.json'),'Manifest duplicate/circular hash');
  requireInvariant(canonical([...map.keys()].sort())===canonical([...listed,'manifest.json',...(map.has('attestation.json')?['attestation.json']:[])].sort()),'Unexpected/missing files');
  for(const f of manifest.files){const b=map.get(f.path);requireInvariant(b&&f.size===b.length&&f.sha256===hash(b),'File hash/size mismatch');}
  const envelope=parseCanonical(map.get('envelope.json'));validateSchema(envelope,schema.$defs.envelope,schema);requireInvariant(canonical(envelope.binding)===canonical(expected),'Envelope identity','BLOCKED — IDENTITY MISMATCH');
  const descriptors=parseCanonical(map.get('files.json'));validateSchema(descriptors,{type:'array',items:{$ref:'#/$defs/file'}},schema);requireInvariant(canonical(descriptors)===canonical(manifest.files.filter(f=>f.path.startsWith('artifacts/'))),'Artifact descriptors');
  requireInvariant(listed.every(p=>['envelope.json','commands.json','process-events.json','files.json'].includes(p)||p.startsWith('artifacts/')),'Unexpected artifact namespace');
  const runtime={...envelope,commands:parseCanonical(map.get('commands.json')),audit:parseCanonical(map.get('process-events.json'))};validateRuntime(runtime,policy,schema);
  return {manifestDigest:hash(map.get('manifest.json')),map};
}
export function verifyPackage(members,expected,platform,context,policy,schema){
  requireInvariant(members.some(m=>m.path==='attestation.json'),'Missing attestation artifact','BLOCKED — MISSING ARTIFACT');
  const {manifestDigest,map}=validateSealedPackage(members,expected,platform,policy,schema);
  const attestation=parseCanonical(map.get('attestation.json'));verifyAttestation(attestation,expected,manifestDigest,context,policy,schema);
  // Consume only after all evidence has verified. Production ledger is external,
  // atomic and independently controlled; an in-memory test ledger is synthetic.
  requireInvariant(context.nonceLedger.consume({repository:expected.repository,runId:expected.runId,attempt:expected.attempt,nonce:expected.nonce,manifestDigest:hash(map.get('manifest.json'))})===true,'Replayed nonce','BLOCKED — AUTHENTICATION');
  return {outcome:'PASS',syntheticOnly:context.testOnly===true,manifestDigest:hash(map.get('manifest.json'))};
}
async function responseBytes(response,limit){requireInvariant(response.ok,'Platform API failure');const chunks=[];let size=0;for await(const chunk of response.body){size+=chunk.length;requireInvariant(size<=limit,'Oversized API response');chunks.push(Buffer.from(chunk));}return Buffer.concat(chunks);}
export function githubReader(token,fetcher=fetch){
  requireInvariant(typeof token==='string'&&token.length>0,'Missing read-only platform credential','BLOCKED — AUTHENTICATION');
  const request=async url=>{const u=new URL(url);requireInvariant(u.origin==='https://api.github.com'&&!u.username&&!u.password,'Forbidden API origin');return fetcher(u,{headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json'},redirect:'error'});};
  return {async json(url){const r=await request(url);let data;try{data=JSON.parse((await responseBytes(r,16*1024*1024)).toString('utf8'));}catch{throw new RuntimeError('VERIFICATION FAIL','Malformed platform JSON');}return data;},async pages(url,key){let next=url,result=[],seen=new Set();while(next){requireInvariant(!seen.has(next)&&seen.size<100,'Pagination loop/limit');seen.add(next);const r=await request(next);let data;try{data=JSON.parse((await responseBytes(r,16*1024*1024)).toString('utf8'));}catch(e){throw new RuntimeError('VERIFICATION FAIL','Malformed API page');}requireInvariant(Array.isArray(data[key]),'Missing API page');result.push(...data[key]);const link=r.headers.get('link');next=null;if(link){for(const part of link.split(',')){const m=part.match(/^\s*<([^>]+)>;\s*rel="([^"]+)"\s*$/);requireInvariant(m,'Malformed pagination link');if(m[2]==='next'){requireInvariant(next===null,'Ambiguous pagination');next=m[1];}}}}return {items:result,pagesComplete:true};},async archive(url,digest,limits){const u=new URL(url);requireInvariant(u.origin==='https://api.github.com','Archive API origin');let r=await fetcher(u,{headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json'},redirect:'manual'});if(r.status===302){const target=new URL(r.headers.get('location'));requireInvariant(target.protocol==='https:'&&!target.username&&!target.password&&(/^[a-z0-9-]+\.blob\.core\.windows\.net$/.test(target.hostname)||/^[a-z0-9.-]+\.githubusercontent\.com$/.test(target.hostname)),'Archive redirect origin');r=await fetcher(target,{redirect:'error'});}const b=await responseBytes(r,limits.maxArchiveBytes);requireInvariant(hash(b)===digest,'Archive digest');return readZip(b,limits);}};
}
// Service-side verification primitive. The service must independently obtain
// pinned issuer JWKS and enforce a durable nonce ledger; caller booleans are not
// authentication. The repository contains no service/private signing key.
export function validateOidc(jwt,jwk,expected,now){
  for(const k of ['iss','aud','repository','repository_id','workflow_ref','ref','run_id','run_attempt'])requireInvariant(typeof expected?.[k]==='string'&&expected[k].length>0,'Missing expected OIDC authority','BLOCKED — AUTHENTICATION');
  requireInvariant(typeof jwt==='string'&&jwt.length<=65536&&jwt.split('.').length===3,'Missing OIDC','BLOCKED — AUTHENTICATION');const [header,payload,signature]=jwt.split('.');let h,c;try{h=JSON.parse(Buffer.from(header,'base64url'));c=JSON.parse(Buffer.from(payload,'base64url'));}catch{throw new RuntimeError('BLOCKED — AUTHENTICATION','Malformed OIDC');}
  requireInvariant(h.alg==='RS256'&&h.kid===jwk.kid&&jwk.kty==='RSA','OIDC key/algorithm','BLOCKED — AUTHENTICATION');requireInvariant(verifySignature('RSA-SHA256',Buffer.from(header+'.'+payload),createPublicKey({key:jwk,format:'jwk'}),Buffer.from(signature,'base64url')),'OIDC signature','BLOCKED — AUTHENTICATION');
  for(const [k,v] of Object.entries(expected))requireInvariant(canonical(c[k])===canonical(v),'OIDC claim '+k,'BLOCKED — AUTHENTICATION');requireInvariant(c.iss==='https://token.actions.githubusercontent.com'&&Number.isSafeInteger(now)&&c.iat<=now&&c.nbf<=now&&c.exp>now&&c.exp-c.iat<=600,'OIDC lifetime/issuer','BLOCKED — AUTHENTICATION');return c;
}
export async function requestAttestation({binding,manifestDigest,candidateTerminated,collectorSealed,policy,requestUrl,requestToken,fetcher=fetch}){
  requireInvariant(candidateTerminated===true&&collectorSealed===true,'Candidate concurrent with authentication','BLOCKED — AUTHENTICATION');requireInvariant(policy.attestation.endpoint&&policy.attestation.publicKey,'Unprovisioned service','BLOCKED — AUTHENTICATION');
  const oidc=new URL(requestUrl);requireInvariant(oidc.protocol==='https:'&&/^pipelines[a-z0-9-]*\.actions\.githubusercontent\.com$/.test(oidc.hostname)&&!oidc.username&&!oidc.password,'OIDC endpoint','BLOCKED — AUTHENTICATION');oidc.searchParams.set('audience',policy.attestation.audience);
  const response=await fetcher(oidc,{headers:{Authorization:'Bearer '+requestToken},redirect:'error'});const token=JSON.parse((await responseBytes(response,64*1024)).toString('utf8')).value;requireInvariant(typeof token==='string','Missing OIDC value','BLOCKED — AUTHENTICATION');
  const service=new URL(policy.attestation.endpoint);requireInvariant(service.protocol==='https:'&&!service.username&&!service.password,'Attestation endpoint');const reply=await fetcher(service,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:canonical({binding,manifestDigest}),redirect:'error'});return parseCanonical(await responseBytes(reply,1024*1024));
}

export async function platformSnapshot(reader,binding){
  const root='https://api.github.com/repos/'+binding.repository;
  const pr=await reader.json(root+'/pulls/'+binding.pr),main=await reader.json(root+'/git/ref/heads/main');
  requireInvariant(pr.number===binding.pr&&pr.head.sha===binding.head&&pr.base.sha===binding.base&&pr.base.ref==='main'&&main.object.sha===binding.base,'Live PR/main changed','BLOCKED — IDENTITY MISMATCH');
  for(const [sha,tree]of [[binding.head,binding.headTree],[binding.base,binding.baseTree],[binding.bootstrap,binding.bootstrapTree]]){const c=await reader.json(root+'/git/commits/'+sha);requireInvariant(c.sha===sha&&c.tree.sha===tree,'Git tree identity','BLOCKED — IDENTITY MISMATCH');}
  const merge=await reader.json(root+'/git/commits/'+binding.merge);requireInvariant(merge.sha===binding.merge&&canonical(merge.parents.map(p=>p.sha))===canonical(binding.mergeParents),'Live merge parents','BLOCKED — IDENTITY MISMATCH');
  const candidateTree=await reader.json(root+'/git/trees/'+binding.headTree+'?recursive=1');requireInvariant(candidateTree.truncated===false&&Array.isArray(candidateTree.tree),'Truncated candidate workflow tree');const workflow=candidateTree.tree.filter(t=>t.path===binding.workflowPath);requireInvariant(workflow.length===1&&workflow[0].type==='blob'&&workflow[0].mode==='100644'&&workflow[0].sha===binding.toolBlobs[binding.workflowPath],'Candidate workflow differs from trusted orchestration','BLOCKED — TRUST');
  const tools=await reader.json(root+'/git/trees/'+binding.bootstrapTree+'?recursive=1');requireInvariant(tools.truncated===false&&Array.isArray(tools.tree),'Truncated trusted tree');
  for(const [path,blob]of Object.entries(binding.toolBlobs)){const entries=tools.tree.filter(t=>t.path===path);requireInvariant(entries.length===1&&entries[0].sha===blob&&entries[0].type==='blob'&&entries[0].mode==='100644','Trusted blob/mode mismatch','BLOCKED — TRUST');}
  return structuredClone(binding);
}
export async function fetchCurrentEvidence(reader,binding,policy,{includeAttestation=true}={}){
  const root='https://api.github.com/repos/'+binding.repository,initial=await platformSnapshot(reader,binding);
  const listing=await reader.pages(root+'/actions/workflows/'+binding.workflowId+'/runs?event=pull_request&per_page=100','workflow_runs');
  const runs=[];
  for(const raw of listing.items){
    if(!raw.pull_requests?.some(p=>p.number===binding.pr)||raw.path!==binding.workflowPath)continue;
    requireInvariant(Number.isSafeInteger(raw.run_attempt),'Missing run attempt');
    const jobs=await reader.pages(root+'/actions/runs/'+raw.id+'/attempts/'+raw.run_attempt+'/jobs?per_page=100','jobs');requireInvariant(jobs.pagesComplete===true,'Incomplete job pages');
    const producers=jobs.items.filter(j=>j.name==='Trusted isolated producer');requireInvariant(producers.length===1,'Missing/ambiguous producer job');
    const job=producers[0];requireInvariant([binding.head,binding.merge].includes(raw.head_sha)&&raw.event==='pull_request'&&raw.workflow_id===binding.workflowId,'Run workflow/event/head');
    runs.push({...binding,runId:raw.id,attempt:raw.run_attempt,jobId:job.id,status:job.status,conclusion:job.conclusion,appId:APP_ID});
    // Expected Actions app source is independently read from the actual check.
    const check=await reader.json(job.check_run_url);requireInvariant(check.app?.id===APP_ID&&check.head_sha===binding.merge,'Actual check source/merge','BLOCKED — IDENTITY MISMATCH');
  }
  const platform={initial,final:initial,runs,pagesComplete:listing.pagesComplete};selectCurrentRun(runs,binding,platform);
  const artifacts=await reader.pages(root+'/actions/runs/'+binding.runId+'/artifacts?per_page=100','artifacts');requireInvariant(artifacts.pagesComplete===true,'Incomplete artifact pages');
  const name='safe-evidence-'+binding.runId+'-'+binding.attempt,matched=artifacts.items.filter(a=>a.name===name);requireInvariant(matched.length===1&&!matched[0].expired,'Missing/ambiguous/expired artifact','BLOCKED — MISSING ARTIFACT');
  const a=matched[0];requireInvariant(a.workflow_run?.id===binding.runId&&typeof a.digest==='string'&&/^sha256:[a-f0-9]{64}$/.test(a.digest),'Artifact provenance/digest');
  platform.artifact={id:a.id,runId:binding.runId,attempt:binding.attempt,expired:false};
  const members=await reader.archive(a.archive_download_url,a.digest.slice(7),policy.limits);
  if(includeAttestation){const signatures=artifacts.items.filter(a=>a.name==='safe-attestation-'+binding.runId+'-'+binding.attempt);requireInvariant(signatures.length===1&&!signatures[0].expired,'Missing/ambiguous attestation artifact','BLOCKED — MISSING ARTIFACT');const signature=signatures[0];requireInvariant(signature.workflow_run?.id===binding.runId&&/^sha256:[a-f0-9]{64}$/.test(signature.digest),'Attestation artifact provenance');const extra=await reader.archive(signature.archive_download_url,signature.digest.slice(7),policy.limits);requireInvariant(extra.length===1&&extra[0].path==='attestation.json','Unexpected attestation files');members.push(...extra);}
  platform.final=await platformSnapshot(reader,binding);return {members,platform};
}
// API transport and verification are exposed separately for deterministic tests.
// Activation CLI requires the independently signed current-target interface;
// no candidate envelope is accepted as the source of expected identities.
export function verifySignedTarget(receipt,policy,schema,execution){
  requireInvariant(policy.attestation.publicKey&&receipt?.signature,'Absent current-target authority','BLOCKED — TRUST');
  requireInvariant(verifySignature(null,bytes(receipt.binding),policy.attestation.publicKey,Buffer.from(receipt.signature,'base64')),'Current-target signature','BLOCKED — TRUST');validateBinding(receipt.binding,policy,schema);
  for(const [k,v]of Object.entries(execution))requireInvariant(receipt.binding[k]===v,'Current target execution identity','BLOCKED — IDENTITY MISMATCH');return receipt.binding;
}
export async function serviceJson(policy,path,body,fetcher=fetch){
  requireInvariant(policy.attestation.endpoint,'Missing attestation service','BLOCKED — AUTHENTICATION');const base=new URL(policy.attestation.endpoint);requireInvariant(base.protocol==='https:'&&!base.username&&!base.password,'Service URL');const url=new URL(path,base);requireInvariant(url.origin===base.origin,'Service origin');
  const response=await fetcher(url,{method:body?'POST':'GET',...(body?{headers:{'Content-Type':'application/json'},body:canonical(body)}:{}),redirect:'error'});return parseCanonical(await responseBytes(response,1024*1024));
}
export function verifyNonceReceipt(receipt,binding,manifestDigest,policy,challenge){
  requireInvariant(typeof challenge==='string'&&/^[a-f0-9]{64}$/.test(challenge),'Missing fresh verification challenge','BLOCKED — AUTHENTICATION');
  requireInvariant(receipt&&policy.attestation.publicKey&&verifySignature(null,bytes(receipt.payload),policy.attestation.publicKey,Buffer.from(receipt.signature,'base64')),'Nonce ledger signature','BLOCKED — AUTHENTICATION');
  requireInvariant(canonical(receipt.payload)===canonical({kind:'nonce-consumed',bindingDigest:hash(bytes(binding)),manifestDigest,nonce:binding.nonce,challenge,consumed:true}),'Nonce replay/ledger binding','BLOCKED — AUTHENTICATION');return true;
}
export async function provisionedCli(mode){
  const policy=parseCanonical(readFileSync(new URL('./trusted-runtime-policy.json',import.meta.url)));activationStatus(policy);if(mode==='inspect')return;
  const schema=parseCanonical(readFileSync(new URL('./trusted-runtime-schema.json',import.meta.url)));
  // Only platform event identities, never title/body/branch text as commands.
  const event=JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')),pr=event.pull_request;
  requireInvariant(pr&&Number.isSafeInteger(pr.number),'Missing PR event','BLOCKED — IDENTITY MISMATCH');
  const execution={repository:event.repository.full_name,repositoryId:event.repository.id,pr:pr.number,event:'pull_request',action:event.action,head:pr.head.sha,base:pr.base.sha,runId:Number(process.env.GITHUB_RUN_ID),attempt:Number(process.env.GITHUB_RUN_ATTEMPT)};
  const query=new URLSearchParams({repository:execution.repository,pr:String(execution.pr),run:String(execution.runId),attempt:String(execution.attempt)});
  const target=await serviceJson(policy,'/v1/target?'+query);const binding=verifySignedTarget(target,policy,schema,execution);
  const root=new URL('..',import.meta.url).pathname.replace(/\/$/,'');validateTrustedSource(root,binding);
  requireInvariant(binding.bootstrap===binding.base&&binding.bootstrapTree===binding.baseTree,'Trusted base substitution','BLOCKED — TRUST');
  const reader=githubReader(process.env.GITHUB_TOKEN),{members,platform}=await fetchCurrentEvidence(reader,binding,policy,{includeAttestation:mode==='verify'});
  const sealed=validateSealedPackage(members,binding,platform,policy,schema),context={now:Math.floor(Date.now()/1000),testOnly:false,nonceLedger:{consume(){return false;}}};
  if(mode==='attest'){
    const attestation=await requestAttestation({binding,manifestDigest:sealed.manifestDigest,candidateTerminated:true,collectorSealed:true,policy,requestUrl:process.env.ACTIONS_ID_TOKEN_REQUEST_URL,requestToken:process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN});
    verifyAttestation(attestation,binding,sealed.manifestDigest,context,policy,schema);
    const directory=process.cwd()+'/.attestation';mkdirSync(directory,{mode:0o700});noSymlinks(directory,{directory:true});const fd=openSync(directory+'/attestation.json',constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|constants.O_NOFOLLOW,0o400);try{writeFileSync(fd,bytes(attestation));}finally{closeSync(fd);}return;
  }
  verifyAttestation(parseCanonical(sealed.map.get('attestation.json')),binding,sealed.manifestDigest,context,policy,schema);
  const challenge=randomBytes(32).toString('hex');
  const receipt=await serviceJson(policy,'/v1/consume',{challenge,attestation:parseCanonical(sealed.map.get('attestation.json')),binding,manifestDigest:sealed.manifestDigest});verifyNonceReceipt(receipt,binding,sealed.manifestDigest,policy,challenge);
  context.nonceLedger={consume(){return true;}};verifyPackage(members,binding,platform,context,policy,schema);
  console.log('PASS: trusted current-run evidence verified');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{requireInvariant(process.argv.length===3&&['inspect','verify','attest'].includes(process.argv[2]),'Invalid CLI');await provisionedCli(process.argv[2]);}catch(e){console.error(e.outcome??'VERIFICATION FAIL',e.outcome?'Trusted runtime prerequisite or evidence check failed':'Malformed runtime input');process.exitCode=1;}}
