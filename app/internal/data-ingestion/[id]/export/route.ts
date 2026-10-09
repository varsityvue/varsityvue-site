import {randomUUID} from 'node:crypto';
import {decideSubmission} from '../../actions';
import {IngestionRequestError} from '@/lib/ingestion-pilot-config';
import {ingestionRequest} from '@/lib/ingestion-runtime';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}) {
 // Export appends an event: never use GET/prefetch to perform this operation.
 try {await ingestionRequest(true);}catch(error){if(error instanceof IngestionRequestError)return new Response('Same-origin export required.',{status:403});throw error;}
 if(Number(request.headers.get('content-length'))>2048)return new Response('Export request too large.',{status:413});
 const reader=request.body?.getReader();if(!reader)return new Response('Export form required.',{status:400});
 const chunks:Uint8Array[]=[];let size=0;
 while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>2048){await reader.cancel();return new Response('Export request too large.',{status:413});}chunks.push(part.value);}
 if(!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded'))return new Response('URL-encoded export form required.',{status:415});
 const {id}=await params;const form=new URLSearchParams(Buffer.concat(chunks).toString('utf8'));
 try {
  const result=await decideSubmission(id,Number(form.get('revision')),String(form.get('hash')??''),'export',randomUUID(),'Requested controlled interim export');
  const draft=result.approvedSnapshot;const values=draft.dataClass==='correction'?draft.values.proposed:draft.values;
  return Response.json({...result,label:'INTERIM MANUAL EXPORT — NOT PUBLISHED',manualData:result.class==='game_stats'?{...values,sourceStatus:'verified'}:values},{headers:{'Cache-Control':'private, no-store','Content-Disposition':'attachment; filename="interim-ingestion-export.json"','X-Content-Type-Options':'nosniff'}});
 }catch{return new Response('Approved revision/hash or evidence is stale. Reload and review.',{status:409,headers:{'Cache-Control':'no-store'}});}
}
