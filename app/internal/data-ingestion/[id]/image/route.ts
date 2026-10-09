import { attachImage } from '../../actions';
import {ingestionRequest} from '@/lib/ingestion-runtime';
import {IngestionRequestError} from '@/lib/ingestion-pilot-config';
import { ingestionAccess } from '@/lib/ingestion-persistence';
// Dedicated bounded multipart route preserves the shared Server Action limit.
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}) {
 try {await ingestionRequest(true);}catch(error){if(error instanceof IngestionRequestError)return Response.json({error:'Same-origin upload required.'},{status:403});throw error;}
 await ingestionAccess(true);
 const limit=6*1024*1024;
 if(Number(request.headers.get('content-length')??0)>limit) return Response.json({error:'Upload exceeds the bounded request limit.'},{status:413});
 const reader=request.body?.getReader();if(!reader)return Response.json({error:'Upload required.'},{status:400});
 try {
  const chunks:Uint8Array[]=[];let size=0;
  while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>limit){await reader.cancel();return Response.json({error:'Upload exceeds the bounded request limit.'},{status:413});}chunks.push(part.value);}
  const form=await new Response(Buffer.concat(chunks),{headers:{'Content-Type':request.headers.get('content-type')??''}}).formData();
  const {id}=await params;const revision=Number(form.get('revision'));const hash=String(form.get('hash')??'')||null;
  return Response.json(await attachImage(id,revision,hash,form));
 } catch(error) {return Response.json({error:error instanceof Error?error.message:'Private upload failed.'},{status:400});}
}
