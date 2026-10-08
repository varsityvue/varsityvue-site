'use client';
import { useRef,useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSubmission } from '@/app/internal/data-ingestion/actions';
export default function IngestionNew({schools,targets}:{schools:{slug:string;name:string}[];targets:{id:string;label:string}[]}){
 const router=useRouter();const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [uncertain,setUncertain]=useState(false);const attempt=useRef<{form:FormData;pending:boolean}|null>(null);const style='block w-full rounded border border-white/25 bg-black p-2';
 async function submit(event:React.FormEvent<HTMLFormElement>) {
  event.preventDefault();if(attempt.current?.pending)return;
  if(!attempt.current){const form=new FormData(event.currentTarget);form.set('request',crypto.randomUUID());attempt.current={form,pending:false};}
  const current=attempt.current;current.pending=true;setBusy(true);setError('');
  try {
   const result=await createSubmission(current.form);
   if('error' in result){if(!uncertain)attempt.current=null;setError(uncertain?`Original creation could not be recovered yet: ${result.error}`:result.error);setBusy(false);return;}
   router.push(`/internal/data-ingestion/${result.id}`);
  } catch {
   setUncertain(true);setError('Creation outcome is uncertain. Retry the original creation to recover it before making edits. Keep this page open; if you reload or leave, check the inbox before creating again.');setBusy(false);
  } finally {current.pending=false;}
 }
 return <form className="space-y-4" onSubmit={submit}><p role="alert" className="whitespace-pre-wrap text-red-200">{error}</p><fieldset disabled={busy||uncertain} className="space-y-4">
<label>Canonical school<select name="school" className={style}>{schools.map(s=><option key={s.slug} value={s.slug}>{s.name}</option>)}</select></label><label>Season<input name="season" type="number" min="2000" max="9999" defaultValue="2026" required className={style}/></label><label>Underlying class<select name="class" className={style}><option value="schedule">Schedule</option><option value="roster">Roster</option><option value="game_stats">Core game statistics</option></select></label><label>Operation<select name="operation" className={style}><option value="create">Create draft</option><option value="correct">Correct existing target</option></select></label><label>Correction target (must match school/season/class)<select name="target" className={style}><option value="">Choose for correction</option>{targets.map(t=><option value={t.id} key={t.id}>{t.label}</option>)}</select></label><label>Correction reason<input name="reason" className={style}/></label><label>Initial roster player name<input name="player" className={style}/></label><label>Source label / provenance<input name="label" required maxLength={300} className={style}/></label><label>Intake format<select name="format" className={style}><option value="form">Structured manual form</option><option value="text">Retained pasted text — manual transcription</option><option value="json">Compatible GameStats JSON</option><option value="csv">Compatible GameStats CSV</option></select></label><label>Original source text/import (images can be retained after creation)<textarea name="source" rows={8} maxLength={262144} className={style}/></label><label className="block">JSON/CSV file (256 KB maximum; leave pasted import empty)<input name="importFile" type="file" accept=".json,.csv,application/json,text/csv" className={style}/></label><label className="block"><input type="checkbox" name="sourceAcknowledged" required/> I may retain this source for internal review and will confirm values against it.</label></fieldset><button disabled={busy} className="rounded border p-3">{uncertain?'Retry original creation':'Create private submission'}</button></form>;
}
