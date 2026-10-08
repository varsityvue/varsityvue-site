import { ingestionAccess,readSubmission } from '@/lib/ingestion-persistence';
export async function GET(_request:Request,{params}:{params:Promise<{id:string;source:string}>}) {
 const {id,source}=await params;const {supabase}=await ingestionAccess();const s=await readSubmission(id);const src=s.sources.find(s=>s.id===source&&s.state==='finalized'&&s.kind==='image');
 if(!src?.preview_path)return new Response('Evidence unavailable',{status:404});
 const {data,error}=await supabase.storage.from('ingestion-evidence').download(src.preview_path);
 if(error||!data)return new Response('Evidence unavailable',{status:404});
 return new Response(data,{headers:{'Content-Type':'image/webp','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Disposition':'inline; filename="review-preview.webp"','Content-Security-Policy':"default-src 'none'; sandbox"}});
}
