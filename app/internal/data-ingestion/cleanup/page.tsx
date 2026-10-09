import Link from 'next/link';
import {redirect} from 'next/navigation';
import {ingestionAccess} from '@/lib/ingestion-persistence';
import {cleanupEvidence} from '../actions';
type Candidate={id:string;submission_id:string;state:string;created_at:string};
export default async function Page({searchParams}:{searchParams:Promise<{after?:string}>}) {
 const {supabase,isAdmin}=await ingestionAccess();if(!isAdmin)redirect('/internal/data-ingestion');
 const {after}=await searchParams;if(after&&!/^[a-f0-9-]{36}$/i.test(after))throw new Error('Invalid cleanup cursor.');
 const {data,error}=await supabase.rpc('ingestion_cleanup_candidates',{p_after:after??undefined,p_limit:20});
 if(error)throw new Error('Could not load bounded cleanup queue.');const rows=data as Candidate[],last=rows.at(-1);
 return <main className="mx-auto max-w-5xl space-y-5 p-5"><h1 className="text-2xl font-bold">Audited evidence cleanup</h1><Link href="/internal/data-ingestion">Back to inbox</Link><p>Admin-only manual removal of failed or tombstoned private image objects. Audit history and source text remain. Open a reservation older than one hour and cancel it with a reason before removing its orphan objects.</p><ul>{rows.map(row=><li key={row.id} className="space-y-3 border-b py-3"><Link href={`/internal/data-ingestion/${row.submission_id}`}>{row.id} · {row.state} · {row.created_at}</Link>{row.state!=='reserved'&&<form action={cleanupEvidence} className="flex flex-wrap gap-3"><input type="hidden" name="submission" value={row.submission_id}/><input type="hidden" name="source" value={row.id}/><label>Cleanup reason<input className="ml-2 rounded border bg-black p-2" name="reason" required maxLength={2000}/></label><button className="rounded border p-2">Remove audited orphan objects</button></form>}</li>)}</ul>{last&&rows.length===20&&<Link href={`/internal/data-ingestion/cleanup?after=${last.id}`}>More cleanup candidates</Link>}</main>;
}
