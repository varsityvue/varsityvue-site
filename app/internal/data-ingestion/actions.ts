'use server';
import { randomUUID,createHash } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { ingestionAccess,readSubmission,mutate,prepareDraft,reviewCatalog,ingestionService } from '@/lib/ingestion-persistence';
import { normalizeIngestionDraft,type IngestionDraft } from '@/lib/ingestion-contracts';
import { normalizeLegacyStats } from '@/lib/ingestion-adapters';
import { canonicalRevisionHash } from '@/lib/ingestion-review-identity';
import { validatePersistentDraft,captureManualTarget,manualTargetRevision } from '@/lib/ingestion-persistent-validation';
import { validateIngestionImage } from '@/lib/ingestion-evidence';
const missing={state:'omitted'} as const;
const unresolved={state:'unresolved' as const,candidates:[]};
const str=(f:FormData,k:string)=>String(f.get(k)??'').trim();
const creationId=(actor:string,request:string,part:string)=>{const h=createHash('sha256').update(`${actor}/${request}/${part}`).digest('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-8${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;};
const known=<T>(value:T)=>({state:'known' as const,value});
export async function createSubmission(form:FormData):Promise<{id:string}|{error:string}> {
 const {userId,supabase}=await ingestionAccess();
 let prepared:Awaited<ReturnType<typeof prepareCreation>>;
 // These errors occur before any creation mutation, so the form may be edited.
 try {prepared=await prepareCreation(form,userId,supabase);} catch(error) {return {error:error instanceof Error?error.message:'Invalid creation input.'};}
 if(prepared.existing!==undefined)return {id:prepared.existing};
 // A thrown transport/mutation error has an uncertain outcome. Keep its key.
 const result=await mutate(userId,prepared.id,'create',0,null,prepared.request,prepared.payload);
 revalidatePath('/internal/data-ingestion');return {id:result.id as string};
}
async function prepareCreation(form:FormData,userId:string,supabase:Awaited<ReturnType<typeof ingestionAccess>>['supabase']) {
 if(form.get('sourceAcknowledged')!=='on') throw new Error('Confirm permission to retain the source.');
 const request=str(form,'request');if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(request))throw new Error('Creation request identifier required.');
 const id=creationId(userId,request,'submission'),sourceId=creationId(userId,request,'source'),rowId=creationId(userId,request,'row'),label=str(form,'label');
 const file=form.get('importFile');if(file instanceof File&&file.size>262144)throw new Error('Import file exceeds 256 KB.');
 const creationInputHash=canonicalRevisionHash({fields:Object.fromEntries(['school','season','class','operation','target','reason','player','label','format','source','sourceAcknowledged'].map(k=>[k,String(form.get(k)??'')])),file:file instanceof File&&file.size?{name:file.name,type:file.type,size:file.size,sha256:createHash('sha256').update(Buffer.from(await file.arrayBuffer())).digest('hex')}:null});
 const {data:existing,error:readError}=await supabase.rpc('ingestion_read',{p_id:id});if(readError)throw new Error('Could not reconcile creation request.');
 if(existing) {
  const event=existing.history.find((e:{request_id:string;command:string})=>e.request_id===request&&e.command==='create');
  if(existing.creator!==userId||event?.snapshot?.request?.payload?.creationInputHash!==creationInputHash)throw new Error('Creation request reused with different input. Recover the original submission before editing.');
  return {existing:id};
 }
 const catalog=await reviewCatalog(),school=str(form,'school'),season=Number(str(form,'season')),dataClass=str(form,'class'),operation=str(form,'operation');
 if(!catalog.schools.some(s=>s.slug===school)||!['schedule','roster','game_stats'].includes(dataClass)||!['create','correct'].includes(operation)||!Number.isInteger(season)||season<2000||season>9999) throw new Error('Choose canonical scope.');
 if(!label||label.length>300||str(form,'source').length>(['json','csv'].includes(str(form,'format'))?262144:30000)) throw new Error('Source label and bounded source text required.');
 const base={schemaVersion:1,draftId:id,operation:'create',schoolSlug:school,season,target:{match:unresolved,expectedRevision:missing},sources:[{sourceId,kind:'form',locator:missing}],evidence:[],identityMatches:[],availability:[],issues:[],disposition:'pending'};
 let values:unknown=dataClass==='game_stats'?{gameId:null,season,sourceLabel:label,quarterScores:[],scoringPlays:[],teamStats:[{schoolSlug:school}],rushing:[],passing:[],receiving:[]}:{rows:dataClass==='roster'?[{rowId,name:str(form,'player')||'Unresolved player',player:unresolved,jerseyNumber:missing,grade:missing,positions:missing,height:missing,weight:missing}]:[{rowId,game:unresolved,opponent:unresolved,week:missing,date:missing,kickoffTime:missing,timeZone:known('America/Chicago'),site:missing,location:missing}]};
 const format=str(form,'format');let sourceKind='form';let body=String(form.get('source')??'');
 const importFile=form.get('importFile');
 if(importFile instanceof File&&importFile.size){if(!['json','csv'].includes(format)||body.trim())throw new Error('Choose JSON/CSV and supply either pasted import or one file.');if(importFile.size>262144)throw new Error('Import file exceeds 256 KB.');body=new TextDecoder('utf-8',{fatal:true}).decode(await importFile.arrayBuffer());}
 let candidate:unknown={...base,dataClass,values};
 if(format==='json'||format==='csv') {
  if(dataClass!=='game_stats') throw new Error('Legacy JSON/CSV imports are core game statistics.');
  const imported=normalizeLegacyStats(format,body,{...base,operation:'create',sources:[{sourceId,kind:format,locator:missing}],disposition:'pending'});
  if(!imported.ok) throw new Error(imported.errors.join('\n'));candidate=imported.draft;values=imported.draft.values;sourceKind=format;
 } else if(format==='text') {sourceKind='text';candidate={...base,dataClass,values,sources:[{sourceId,kind:'text',locator:missing}]};}
 if(operation==='correct') {
  const target=str(form,'target');let current:unknown;let expected:string;
  if(dataClass==='game_stats') {
   const stats=catalog.coreStats.find(s=>s.gameId===target&&s.season===season);
   const game=catalog.canonicalGames.find(g=>g.id===target&&g.season===season&&[g.homeSchoolSlug,g.awaySchoolSlug].includes(school));
   if(!stats||!game) throw new Error('Choose existing statistics for the selected scope.');
   const {sourceStatus:_status,...snapshot}=stats;void _status;current=snapshot;expected=canonicalRevisionHash(stats);
  } else {
   current=captureManualTarget(dataClass as 'schedule'|'roster',target,school,season,userId,catalog);expected=manualTargetRevision(dataClass as 'schedule'|'roster',target,school,season,catalog);
  }
  candidate={...base,operation:'correct',dataClass:'correction',reason:str(form,'reason'),sources:[{sourceId,kind:sourceKind,locator:missing}],target:{match:{state:'confirmed',id:target,confirmedBy:userId},expectedRevision:known(expected)},values:{dataClass,current,proposed:structuredClone(dataClass==='game_stats'&&['json','csv'].includes(format)?values:current)}};
 }
 const prepared=await prepareDraft(candidate as IngestionDraft,userId);
 body=body||JSON.stringify(prepared.draft.values);
 return {id,request,payload:{school,season,class:dataClass,operation,creationInputHash,draft:prepared.draft,validation:prepared.validation,source:{id:sourceId,kind:sourceKind,label,body}}};
}
export async function saveSubmission(id:string,revision:number,hash:string|null,input:unknown,request:string) {
 const {userId}=await ingestionAccess();const existing=await readSubmission(id);
 if(!existing.current) throw new Error('Source changed. Reopen the editor by retaining a new source.');
 const parsed=normalizeIngestionDraft(input);if(!parsed.ok) throw new Error(parsed.errors.join('\n'));
 if(parsed.draft.dataClass==='correction'&&existing.current.draft.dataClass==='correction') parsed.draft.values.current=existing.current.draft.values.current as never;
 parsed.draft.sources=existing.sources.filter(s=>s.state==='finalized').map(s=>({sourceId:s.id,kind:s.kind as 'form'|'json'|'csv'|'text'|'image',locator:{state:'omitted'}}));
 const prepared=await prepareDraft(parsed.draft,userId);
 const result=await mutate(userId,id,'save',revision,hash,request,prepared);revalidatePath(`/internal/data-ingestion/${id}`);return result;
}
export async function decideSubmission(id:string,revision:number,hash:string|null,command:string,request:string,reason:string) {
 if(!['ready','approve','reject','reopen','export'].includes(command)) throw new Error('Unsupported review decision.');
 const {userId}=await ingestionAccess();const current=await readSubmission(id);
 const validation=current.current?validatePersistentDraft(current.current.draft,await reviewCatalog()).validation:null;
 if(['ready','approve','export'].includes(command)&&(!validation||!validation.reviewable||validation.validationHash!==current.current?.validation.validationHash)) throw new Error('Validation/catalog changed; save and review again.');
 const result=await mutate(userId,id,command,revision,hash,request,{validationHash:validation?.validationHash},reason||null);
 revalidatePath(`/internal/data-ingestion/${id}`);revalidatePath('/internal/data-ingestion');return result;
}
export async function attachImage(id:string,revision:number,hash:string|null,form:FormData) {
 const {userId,supabase}=await ingestionAccess();const current=await readSubmission(id);
 if(!current.current) throw new Error('Save a draft first.');
 const file=form.get('image');if(!(file instanceof File)) throw new Error('Choose an image.');
 const processed=await validateIngestionImage(file),sourceId=randomUUID(),label=str(form,'label');
 if(!label) throw new Error('Evidence label required.');
 if(current.sources.some(s=>s.state==='finalized'&&s.sha256===processed.sha256)) throw new Error('This evidence is already retained in this submission.');
 await mutate(userId,id,'reserve',revision,hash,randomUUID(),{id:sourceId,label});
 const prefix=`${userId}/${id}/${sourceId}`;
 try {
  for(const [path,bytes,type] of [['original',processed.original,processed.mime],['preview.webp',processed.preview,'image/webp']] as const) {
   const {error}=await supabase.storage.from('ingestion-evidence').upload(`${prefix}/${path}`,bytes,{contentType:type,upsert:false});if(error) throw new Error('Private upload failed.');
  }
  const draft=structuredClone(current.current.draft);draft.sources=current.sources.filter(s=>s.state==='finalized').map(s=>({sourceId:s.id,kind:s.kind as 'form'|'json'|'csv'|'text'|'image',locator:{state:'omitted'}}));draft.sources.push({sourceId,kind:'image',locator:{state:'known',value:sourceId}});
  const prepared=await prepareDraft(draft,userId);
  const result=await mutate(userId,id,'save',revision,hash,randomUUID(),{...prepared,source:{id:sourceId,kind:'image',...processed,original:undefined,preview:undefined}});
  revalidatePath(`/internal/data-ingestion/${id}`);return result;
 } catch(error) {
  // Failure is audited before object cleanup. A concurrent edit can leave a
  // reserved orphan; the privileged cleanup hook below can retry with fresh tokens.
  try {const latest=await readSubmission(id);await mutate(userId,id,'fail_source',latest.revision,latest.review_hash,randomUUID(),{id:sourceId},'Image attachment failed');await ingestionService().storage.from('ingestion-evidence').remove([`${prefix}/original`,`${prefix}/preview.webp`]);}catch{}
  throw error;
 }
}
export async function deleteSource(id:string,revision:number,hash:string|null,sourceId:string,reason:string) {
 const {userId}=await ingestionAccess();const current=await readSubmission(id);const source=current.sources.find(s=>s.id===sourceId);
 if(!source) throw new Error('Source not found.');
 const result=await mutate(userId,id,source.state==='reserved'?'fail_source':'delete_source',revision,hash,randomUUID(),{id:sourceId},reason);
 if(source.object_path) {const {error}=await ingestionService().storage.from('ingestion-evidence').remove([source.object_path,source.preview_path!]);if(error) throw new Error('Deletion audited; private object cleanup needs retry.');}
 revalidatePath(`/internal/data-ingestion/${id}`);return result;
}
