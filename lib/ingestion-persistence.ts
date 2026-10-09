import 'server-only';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { notFound,redirect } from 'next/navigation';
import { requireActiveMember } from '@/lib/member-access';
import { getSchools } from '@/lib/schools';
import { getGames } from '@/lib/games';
import { getAllGameStats } from '@/lib/game-stats';
import { extendedGameStats } from '@/data/extended-game-stats';
import { playerProfiles } from '@/data/player-profiles';
import type { IngestionDraft } from '@/lib/ingestion-contracts';
import { ingestionConfig,ingestionRequest } from '@/lib/ingestion-runtime';
import { validatePersistentDraft,bindActor } from '@/lib/ingestion-persistent-validation';
export type Submission={id:string;creator:string;school_slug:string;season:number;data_class:string;operation:string;state:string;revision:number;review_hash:string|null;current:{draft:IngestionDraft;validation:ReturnType<typeof validatePersistentDraft>['validation']}|null;sources:Source[];creationInputHash?:string;creationRequestId?:string;historyNext?:number|null;history:{id:number;command:string;actor:string;revision:number;created_at:string;reason:string|null}[]};
export type Source={id:string;kind:string;label:string;body:string|null;object_path:string|null;preview_path:string|null;state:string;sha256:string|null};
export async function reviewCatalog(){
 const {supabase}=await ingestionAccess();
 const {data,error}=await supabase.rpc('ingestion_roster_catalog');if(error)throw new Error('Canonical roster catalog unavailable.');
 const managed=data.rows as {id:string;school_slug:string;season:number;first_name:string;last_name:string;jersey_number:number|null;position:string|null;grade:string|null;active:boolean;player_profile_id:string|null;updated_at:string}[];if(managed.length>10000)throw new Error('Roster catalog exceeds bounded review capacity.');
 const managedRoster=managed.map(p=>({internalId:p.id,schoolSlug:p.school_slug,season:p.season,name:`${p.first_name} ${p.last_name}`,active:p.active,publicPlayerId:p.player_profile_id??undefined,jerseyNumber:p.jersey_number===null?undefined:String(p.jersey_number),positions:p.position?[p.position]:undefined,grade:({Fr:'Freshman',So:'Sophomore',Jr:'Junior',Sr:'Senior'} as const)[p.grade as 'Fr'|'So'|'Jr'|'Sr'],updatedAt:p.updated_at}));
 return {schools:getSchools().map(s=>({slug:s.slug,name:s.name})),canonicalGames:getGames(),coreStats:getAllGameStats(),extendedStats:extendedGameStats,playerProfiles,managedRoster,managedRosterVersion:data.version as string};}
export async function ingestionAccess(mutation=false) {
 await ingestionRequest(mutation);
 const access=await requireActiveMember({loginPath:'/login?next=%2Finternal%2Fdata-ingestion'});
 const {data:roles,error}=await access.supabase.from('user_roles').select('role').eq('user_id',access.userId);
 if(error||!roles?.some(r=>r.role==='admin'||r.role==='moderator')) redirect('/account');
 const {data:enabled,error:pilotError}=await access.supabase.rpc('ingestion_pilot_access');
 if(pilotError||!enabled)notFound();
 const {data:admitted,error:budgetError}=await ingestionService().rpc('ingestion_admit',{p_actor:access.userId,p_kind:mutation?'write':'read'});
 if(budgetError||!admitted)throw new Error('Ingestion request budget exhausted; wait one minute.');
 return {...access,isAdmin:roles.some(r=>r.role==='admin')};
}
export function ingestionService() {
 const {url,serviceKey}=ingestionConfig();
 return createServiceClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function readSubmission(id:string):Promise<Submission> {
 const {supabase}=await ingestionAccess();const {data,error}=await supabase.rpc('ingestion_read',{p_id:id});
 if(error) throw new Error('Could not read ingestion submission.');if(!data) notFound();return data as Submission;
}
export async function mutate(actor:string,id:string,command:string,revision:number,hash:string|null,request:string,payload:unknown,reason:string|null=null) {
 const {data,error}=await ingestionService().rpc('ingestion_mutate',{p_actor:actor,p_id:id,p_command:command,p_revision:revision,p_hash:hash,p_request:request,p_payload:payload,p_reason:reason});
 if(error) throw new Error(error.code==='40001'?'Stale revision/hash. Reload and reconcile your edits.':error.message);
 return data;
}
export async function prepareDraft(draft:IngestionDraft,actor:string){return validatePersistentDraft(bindActor(draft,actor),await reviewCatalog());}
