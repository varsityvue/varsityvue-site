import Link from 'next/link';
import IngestionReview from '@/components/internal/IngestionReview';
import { readSubmission,reviewCatalog } from '@/lib/ingestion-persistence';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;const s=await readSubmission(id);const c=await reviewCatalog();return <main className="min-h-screen bg-black p-4 text-white"><div className="mx-auto max-w-7xl space-y-5"><Link href="/internal/data-ingestion">← Inbox</Link><h1 className="text-3xl font-bold">{s.school_slug} · {s.season} · {s.data_class} review</h1><IngestionReview key={`${s.revision}-${s.review_hash}`} submission={s} catalog={{schools:c.schools,games:c.canonicalGames,players:c.playerProfiles,managed:c.managedRoster}}/></div></main>;}
