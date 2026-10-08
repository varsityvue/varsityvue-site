import { randomUUID } from 'node:crypto';
import { decideSubmission } from '../../actions';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
 const {id}=await params;const url=new URL(request.url);
 try {const result=await decideSubmission(id,Number(url.searchParams.get('revision')),url.searchParams.get('hash'),'export',randomUUID(),'Requested controlled interim export');
 const draft=result.approvedSnapshot;const values=draft.dataClass==='correction'?draft.values.proposed:draft.values;
 return Response.json({...result,label:'INTERIM MANUAL EXPORT — NOT PUBLISHED',manualData:result.class==='game_stats'?{...values,sourceStatus:'verified'}:values},{headers:{'Cache-Control':'private, no-store','Content-Disposition':'attachment; filename="interim-ingestion-export.json"','X-Content-Type-Options':'nosniff'}});
 }catch{return new Response('Approved revision/hash or evidence is stale. Reload and review.',{status:409,headers:{'Cache-Control':'no-store'}});}
}
