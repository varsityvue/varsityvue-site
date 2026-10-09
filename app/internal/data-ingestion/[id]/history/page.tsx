import Link from 'next/link';
import {ingestionAccess} from '@/lib/ingestion-persistence';
type Event={id:number;created_at:string;command:string;actor:string;revision:number;reason:string|null};
export default async function Page({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{before?:string}>}) {
 const {id}=await params,{before}=await searchParams;const {supabase}=await ingestionAccess();
 if(before&&!/^[1-9][0-9]{0,17}$/.test(before))throw new Error('Invalid history cursor.');
 const {data,error}=await supabase.rpc('ingestion_history',{p_id:id,p_before:before??undefined,p_limit:20});
 if(error)throw new Error('Could not load bounded history.');const events=data as Event[];const last=events.at(-1);
 return <main className="mx-auto max-w-5xl space-y-5 p-5"><h1 className="text-2xl font-bold">Append-only review history</h1><Link href={`/internal/data-ingestion/${id}`}>Back to submission</Link><ol>{events.map(e=><li key={e.id} className="border-b py-3">{e.created_at} · {e.command} · revision {e.revision} · actor {e.actor}{e.reason?` · ${e.reason}`:''}</li>)}</ol>{last&&events.length===20&&<Link href={`/internal/data-ingestion/${id}/history?before=${last.id}`}>Older history</Link>}</main>;
}
