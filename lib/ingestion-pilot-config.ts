// Pure configuration validation; only ingestion-runtime reads process.env.
export type IngestionPilotConfig = {backend:'local'|'hosted';url:string;publishableKey:string;serviceKey:string;origin:string};
const loopback=(host:string)=>['localhost','127.0.0.1'].includes(host);
function keyRole(key:string) {
 try {return JSON.parse(Buffer.from(key.split('.')[1],'base64url').toString()).role as string;}catch{return undefined;}
}
export function resolveIngestionPilotConfig(env:Record<string,string|undefined>):IngestionPilotConfig {
 if(env.ENABLE_DATA_INGESTION!=='true')throw new Error('Ingestion disabled.');
 const backend=env.INGESTION_BACKEND;
 if(backend!=='local'&&backend!=='hosted')throw new Error('Explicit ingestion backend required.');
 let url:URL,origin:URL;
 try {url=new URL(env.INGESTION_SUPABASE_URL??'');origin=new URL(env.INGESTION_ORIGIN??'');}catch{throw new Error('Explicit valid ingestion endpoints required.');}
 if(url.username||url.password||url.search||url.hash||url.pathname!=='/'||origin.username||origin.password||origin.search||origin.hash||origin.pathname!=='/')throw new Error('Invalid ingestion endpoint.');
 if(env.INGESTION_ORIGIN!==origin.origin)throw new Error('Exact ingestion origin required.');
 if(backend==='local') {
  if(env.VERCEL||!loopback(url.hostname)||url.protocol!=='http:'||!loopback(origin.hostname)||origin.protocol!=='http:')throw new Error('Local ingestion requires disposable loopback endpoints.');
 } else if(url.protocol!=='https:'||url.port||!(/^[a-z0-9]+\.supabase\.co$/).test(url.hostname)||origin.protocol!=='https:'||loopback(origin.hostname)||origin.hostname.endsWith('.local')||/^\d+\./.test(origin.hostname))throw new Error('Hosted ingestion requires explicit HTTPS endpoints.');
 // Existing authentication/proxy cookies must use this very same backend. No fallback.
 if(env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/,'')!==url.origin||env.INGESTION_SUPABASE_PUBLISHABLE_KEY!==env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)throw new Error('Ingestion and account backend configuration must match.');
 const publishableKey=env.INGESTION_SUPABASE_PUBLISHABLE_KEY??'',serviceKey=env.INGESTION_SERVICE_KEY??'';
 if(!(publishableKey.startsWith('sb_publishable_')||keyRole(publishableKey)==='anon')||!(serviceKey.startsWith('sb_secret_')||keyRole(serviceKey)==='service_role')||serviceKey===publishableKey)throw new Error('Dedicated server credentials required.');
 return {backend,url:url.origin,publishableKey,serviceKey,origin:origin.origin};
}
export class IngestionRequestError extends Error {}
export function checkIngestionRequest(config:Pick<IngestionPilotConfig,'origin'>,headers:Pick<Headers,'get'>,mutation=false) {
 if(headers.get('host')!==new URL(config.origin).host)throw new IngestionRequestError('Ingestion host denied.');
 const origin=headers.get('origin');
 if((mutation&&!origin)||(origin&&origin!==config.origin)||(headers.get('sec-fetch-site')&&!['same-origin','none'].includes(headers.get('sec-fetch-site')!)))throw new IngestionRequestError('Ingestion origin denied.');
}
export function decodeInboxCursor(value?:string):{p_before?:string;p_before_id?:string} {
 if(!value)return {};
 if(value.length>256)throw new Error('Invalid inbox cursor.');
 try {
  const {time,id}=JSON.parse(Buffer.from(value,'base64url').toString());
  if(typeof time!=='string'||!/^\d{4}-\d\d-\d\dT/.test(time)||!Number.isFinite(Date.parse(time))||typeof id!=='string'||!(/^[a-f0-9-]{36}$/i).test(id))throw new Error();
  return {p_before:time,p_before_id:id};
 }catch{throw new Error('Invalid inbox cursor.');}
}
