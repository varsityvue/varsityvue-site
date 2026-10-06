import {readFileSync,writeFileSync,openSync,closeSync,constants,lstatSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {canonical,bytes,hash,parseCanonical,validateSchema,validateBinding,validateIsolation,validateSuppression,noSymlinks,safePath,requireInvariant,RuntimeError} from './run-trusted-runtime.mjs';
export const REQUIRED_FILES=['envelope.json','commands.json','process-events.json','files.json','manifest.json','attestation.json'];
export function validateRuntime(runtime,policy,schema,{allowApplicationFailure=false}={}){
  validateSchema(runtime,schema.$defs.runtime,schema);validateBinding(runtime.binding,policy,schema);
  requireInvariant(runtime.stages.map(s=>s.id).join('|')===policy.stages.join('|'),'Missing/reordered stage');
  requireInvariant(runtime.stages.filter(s=>s.id!=='application').every(s=>s.status==='success'),'Incomplete/skipped required stage');
  const applicationStage=runtime.stages.find(s=>s.id==='application');requireInvariant(['success','failure'].includes(applicationStage.status),'Skipped/incomplete application stage');
  requireInvariant(runtime.isolation.length===runtime.commands.length+2,'Missing isolation window');validateIsolation(runtime.isolation[0],runtime.binding,policy,'before');for(const c of runtime.isolation.slice(1,-1))validateIsolation(c,runtime.binding,policy,'during');validateIsolation(runtime.isolation.at(-1),runtime.binding,policy,'after');
  validateSuppression(runtime.audit,policy);
  requireInvariant(runtime.commands.length>0&&runtime.commands.length<=policy.commands.length,'Missing mandatory command');let applicationFailed=false;
  for(const [i,c] of runtime.commands.entries()){const expected=policy.commands[i];requireInvariant(c.seq===i+1&&c.id===expected.id&&canonical(c.argv)===canonical(expected.argv)&&c.cwdClass==='candidate'&&c.envKeysHash===policy.environmentKeysHash,'Command identity/env');if(c.status!=='success'||c.exitCode!==0||c.signal!==null){requireInvariant(c.status==='failure'&&((Number.isSafeInteger(c.exitCode)&&c.exitCode!==0&&c.signal===null)||(c.exitCode===null&&typeof c.signal==='string'))&&i===runtime.commands.length-1,'Malformed failure/commands after failure');applicationFailed=true;}}
  requireInvariant(runtime.collectorComplete===true,'Incomplete collector');if(applicationFailed){requireInvariant(runtime.outcome==='APPLICATION FAIL'&&applicationStage.status==='failure','Fake PASS failure result');requireInvariant(allowApplicationFailure,'Application command failed','APPLICATION FAIL');}else requireInvariant(runtime.outcome==='PASS'&&applicationStage.status==='success'&&runtime.commands.length===policy.commands.length,'Fake PASS/missing command');return true;
}
export function validateMembers(members,limits){
  requireInvariant(Array.isArray(members)&&members.length<=limits.maxMembers,'Member count');const seen=new Set();let total=0;
  for(const m of members){safePath(m.path);requireInvariant(!seen.has(m.path),'Duplicate member');seen.add(m.path);requireInvariant(m.type==='file'&&Buffer.isBuffer(m.bytes),'Symlink/device/special member');requireInvariant(m.bytes.length<=limits.maxMemberBytes,'Oversized member');total+=m.bytes.length;}requireInvariant(total<=limits.maxArchiveBytes,'Oversized archive');return members;
}
// Manifest includes payloads + certified artifacts. It excludes itself and the
// later signature to avoid a self-hash cycle. Attestation signs its SHA-256.
export function sealEvidence(runtime,artifacts,policy,schema){
  validateRuntime(runtime,policy,schema,{allowApplicationFailure:true});validateMembers(artifacts,policy.limits);
  requireInvariant(artifacts.every(a=>a.path.startsWith('artifacts/')),'Artifact namespace');
  const descriptors=artifacts.map(a=>({path:a.path,size:a.bytes.length,sha256:hash(a.bytes)})).sort((a,b)=>a.path<b.path?-1:1);
  const envelope={schemaVersion:1,binding:runtime.binding,isolation:runtime.isolation,stages:runtime.stages,outcome:runtime.outcome,collectorComplete:runtime.collectorComplete};
  const payloads=[{path:'envelope.json',type:'file',bytes:bytes(envelope)},{path:'commands.json',type:'file',bytes:bytes(runtime.commands)},{path:'process-events.json',type:'file',bytes:bytes(runtime.audit)},{path:'files.json',type:'file',bytes:bytes(descriptors)},...artifacts];
  const manifest={schemaVersion:1,bindingDigest:hash(bytes(runtime.binding)),files:payloads.map(m=>({path:m.path,size:m.bytes.length,sha256:hash(m.bytes)})).sort((a,b)=>a.path<b.path?-1:1)};
  payloads.push({path:'manifest.json',type:'file',bytes:bytes(manifest)});validateMembers(payloads,policy.limits);return {members:payloads,manifestDigest:hash(bytes(manifest)),manifest};
}
export function appendAttestation(sealed,attestation){requireInvariant(!sealed.members.some(m=>m.path==='attestation.json'),'Attestation already present');return [...sealed.members,{path:'attestation.json',type:'file',bytes:bytes(attestation)}];}
export function writeEvidence(directory,members,{protectedStorage=false}={}){
  noSymlinks(directory,{directory:true,...(protectedStorage?{ownerUid:0}:{})});validateMembers(members,{maxMembers:1000,maxMemberBytes:16*1024*1024,maxArchiveBytes:100*1024*1024});requireInvariant(readdirSync(directory).length===0,'Evidence output must be fresh');
  // Operational artifact subdirectories must be provisioned separately, never
  // recursively created through candidate-controlled paths.
  for(const m of members){const target=resolve(directory,m.path);const parent=target.slice(0,target.lastIndexOf('/'));noSymlinks(parent,{directory:true,...(protectedStorage?{ownerUid:0}:{})});const fd=openSync(target,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o400);try{writeFileSync(fd,m.bytes);}finally{closeSync(fd);}requireInvariant(lstatSync(target).isFile(),'Nonregular output');}return true;
}
export function readEvidence(directory,policy){
  noSymlinks(directory,{directory:true,ownerUid:0});const out=[];
  const visit=(dir,prefix='')=>{for(const name of readdirSync(dir)){const path=prefix+name,target=resolve(dir,name),s=lstatSync(target);requireInvariant(!s.isSymbolicLink(),'Evidence symlink');if(s.isDirectory()){requireInvariant(path==='artifacts','Unexpected directory');visit(target,path+'/');}else{requireInvariant(s.isFile()&&s.size<=policy.limits.maxMemberBytes,'Special/oversized file');out.push({path,type:'file',bytes:readFileSync(target)});}}};visit(directory);return validateMembers(out,policy.limits);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){console.error('BLOCKED — TRUST: collection requires a trusted supervisor result and protected output; no candidate-input CLI');process.exitCode=1;}
