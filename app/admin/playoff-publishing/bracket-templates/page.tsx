import "server-only";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveMember } from "@/lib/member-access";
import { canViewPlayoffPublishing } from "@/lib/playoff-publishing-access";
import { getDynamicGamesSnapshot } from "@/lib/dynamic-games";
import { getBiDistrictReadiness } from "@/lib/bidistrict-readiness";
import { statewideDivisions, regionLabels } from "@/data/statewide-playoff-brackets";
import { resolveBracketSchool } from "@/lib/playoff-school-catalog";
import { schoolLogoBySlug } from "@/data/school-logos";
import { template2AD12026 } from "@/data/playoff-template-2ad1-2026";
import { seedLabel, validateTemplate } from "@/lib/playoff-qualification";
export const dynamic="force-dynamic";
export default async function BracketTemplatesPage(){
 const {supabase,userId}=await requireActiveMember();
 const {data,error}=await supabase.from("user_roles").select("role").eq("user_id",userId);
 if(!canViewPlayoffPublishing(data,Boolean(error)))notFound();
 const snapshot=await getDynamicGamesSnapshot();const readiness=getBiDistrictReadiness(snapshot.games);
 return <main className="mx-auto max-w-6xl space-y-6 px-4 py-10 text-white">
  <Link href="/admin/playoff-publishing" className="underline">Publishing readiness</Link>
  <h1 className="text-3xl font-black">Bracket template review</h1>
  <p>2026 · Read-only review · Public projections disabled</p>
  <p>Score feed: {snapshot.scoreLoadStatus}. {snapshot.scoreLoadStatus==="failed"?"Do not approve publication while scores are unavailable.":""}</p>
  <div className="grid gap-4 sm:grid-cols-2">{statewideDivisions.map(division=>{
   const rows=readiness.filter(r=>r.division===division.label);
   const missingLogos=division.regions.flatMap((field,region)=>field.flatMap(pair=>pair.filter(name=>{const school=resolveBracketSchool(name,division.id,regionLabels[region]);return !school||!schoolLogoBySlug[school.slug];})));
   return <article key={division.id} className="rounded-xl border border-white/20 p-4"><h2 className="text-xl font-bold">{division.label}</h2>
    <p>{rows.length} first-round positions · {rows.filter(r=>r.status==="verified-final").length} verified results</p>
    <p>{rows.filter(r=>r.status==="missing-record").length} missing games · {rows.filter(r=>r.status==="duplicate-record").length} duplicate games</p>
    <p>{division.id==="2A-D1"?`Template v1: ${validateTemplate(template2AD12026).length===0?"64 mappings validated":"Review required"}`:"Official seed mapping review required"}</p>
    <details className="mt-3"><summary>Review {missingLogos.length} missing logos</summary><p className="mt-2 text-sm">{missingLogos.join(" · ")||"None"}</p></details>
    <Link className="mt-3 inline-block underline" href="/admin/playoff-publishing/bi-district">Review matchup exceptions</Link>
   </article>;
  })}</div>
  <h2 className="text-2xl font-bold">2A Division I · reviewed official seed structure</h2>
  <p>Source: <a className="underline" href={template2AD12026.evidence!.source}>UIL linked bracket</a>. No imported scores or automatic publication.</p>
  <div className="grid gap-2 sm:grid-cols-4">{[0,1,2,3].map(region=><article key={region} className="rounded-xl border border-white/20 p-3"><h3>{regionLabels[region]}</h3>{Array.from({length:8},(_,game)=><p key={game}>{game+1}: {template2AD12026.slots.filter(s=>s.region===region&&s.firstRoundGame===game).map(seedLabel).join(" vs ")}</p>)}</article>)}</div>
  <p>2027 foundation: sequential projected → confirmed → published transitions require reviewed evidence and resolved tiebreakers. Persistent template editing, season membership import, district procedure review and publication actions remain under development.</p>
 </main>;
}
