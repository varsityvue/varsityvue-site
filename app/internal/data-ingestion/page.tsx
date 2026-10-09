import Link from 'next/link';
import {ingestionAccess,type Submission} from '@/lib/ingestion-persistence';
import {decodeInboxCursor} from '@/lib/ingestion-pilot-config';
export const metadata={title:'Manual data ingestion',robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<{cursor?:string}>}) {
 const {supabase,isAdmin}=await ingestionAccess();const {cursor}=await searchParams;
 const {data,error}=await supabase.rpc('ingestion_inbox',{...decodeInboxCursor(cursor),p_limit:20});
 if(error)throw new Error('Could not load bounded submission inbox.');
 const rows=data as (Submission&{created_at:string})[],last=rows.at(-1);
 const next=last&&rows.length===20?Buffer.from(JSON.stringify({time:last.created_at,id:last.id})).toString('base64url'):null;
 return <main className="min-h-screen bg-black p-5 text-white"><div className="mx-auto max-w-6xl space-y-6"><h1 className="text-3xl font-bold">Manual data ingestion</h1><p>Private persistent review. Approval and export never publish canonical sports data.</p><nav className="flex flex-wrap gap-5"><Link href="/internal/data-ingestion/new">New submission</Link>{isAdmin&&<Link href="/internal/data-ingestion/cleanup">Audited evidence cleanup</Link>}</nav><ul>{rows.map(s=><li className="border-b border-white/20 p-3" key={s.id}><Link href={`/internal/data-ingestion/${s.id}`}>{s.school_slug} · {s.season} · {s.data_class} / {s.operation} · {s.state} · revision {s.revision}</Link></li>)}</ul><nav className="flex gap-5" aria-label="Inbox pages"><Link href="/internal/data-ingestion">Newest submissions</Link>{next&&<Link href={`/internal/data-ingestion?cursor=${next}`}>Older submissions</Link>}</nav></div></main>;
}
