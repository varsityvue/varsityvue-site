"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { buildBracketLayout, CARD_HEIGHT, CARD_WIDTH, fitBracket, schoolRoute, potentialParticipants } from "@/lib/playoff-bracket-layout";
import { statewideDivisions, regionLabels } from "@/data/statewide-playoff-brackets";
import { resolveBracketSchool } from "@/lib/playoff-school-catalog";
import { schoolLogoBySlug } from "@/data/school-logos";
import { findSchoolBracketLocation } from "@/lib/playoff-school-location";
import { verifiedWinner } from "@/lib/playoff-bracket-advancement";
import { playoffRoundLabels } from "@/lib/playoff-round-labels";
import { template2AD12026 } from "@/data/playoff-template-2ad1-2026";
import { seedLabel } from "@/lib/playoff-qualification";
import { getStandingForSchoolFromGames } from "@/lib/standings";
import { formatOverallRecord } from "@/lib/school-record-presentation";
import type { Game } from "@/types/platform";

type View = {scale:number;x:number;y:number};
export default function ConnectedPlayoffBracket({games,selectedSchool,onSelectSchool}:{games:Game[];selectedSchool?:string;onSelectSchool?:(school:string)=>void}) {
 const [schoolSearch,setSchoolSearch]=useState("");
 const schoolOptions=useMemo(()=>statewideDivisions.flatMap(d=>d.regions.flatMap((field,r)=>field.flatMap(pair=>pair.map(name=>({value:`${d.id}|${r}|${name}`,label:`${name} · ${d.label} · ${regionLabels[r]}`}))))).sort((a,b)=>a.label.localeCompare(b.label)),[]);
 const hydrated=useSyncExternalStore(()=>()=>{},()=>true,()=>false);
 const location=useMemo(()=>selectedSchool?findSchoolBracketLocation(selectedSchool):null,[selectedSchool]);
 const [divisionId,setDivisionId]=useState(location?.division.id ?? "2A-D1");
 const [region,setRegion]=useState<number|null>(location?.regionIndex??null);
 const [view,setView]=useState<View>({scale:.1,x:20,y:20});
 const viewport=useRef<HTMLDivElement>(null);
 const pointers=useRef(new Map<number,{x:number;y:number}>());
 const layout=useMemo(()=>buildBracketLayout(divisionId,games),[divisionId,games]);
 const route=schoolRoute(layout.nodes,location?.division.id===divisionId?location.schoolName:"");
 const focusSchool=useCallback(()=>{
  const el=viewport.current;if(!el||!location)return;
  const candidates=layout.nodes.filter(n=>n.teams.includes(location.schoolName));
  const node=candidates[candidates.length-1];if(!node)return;
  const scale=Math.min(1,(el.clientWidth-32)/CARD_WIDTH);
  setView({scale,x:(el.clientWidth-CARD_WIDTH*scale)/2-node.x*scale,y:(el.clientHeight-CARD_HEIGHT*scale)/2-node.y*scale});
 },[layout,location]);
 const fit=useCallback((selected:number|null)=>{
  const el=viewport.current;if(!el)return;
  const nodes=selected===null?layout.nodes:layout.nodes.filter(n=>n.region===selected);
  const x=Math.min(...nodes.map(n=>n.x)),y=Math.min(...nodes.map(n=>n.y));
  setView(fitBracket({x,y,width:Math.max(...nodes.map(n=>n.x+CARD_WIDTH))-x,height:Math.max(...nodes.map(n=>n.y+CARD_HEIGHT))-y},{width:el.clientWidth,height:el.clientHeight}));
 },[layout]);
 useEffect(()=>{const el=viewport.current;if(!el)return; const observer=new ResizeObserver(()=>{if(el.clientWidth<600 && location?.division.id===divisionId && region===location.regionIndex)focusSchool();else fit(region);});observer.observe(el);return()=>observer.disconnect();},[fit,region,focusSchool,location?.division.id,location?.regionIndex,divisionId]); // Recalculate against the actual viewport.
 const zoom=(factor:number,cx?:number,cy?:number)=>setView(v=>{
  const el=viewport.current;const x=cx??(el?.clientWidth??600)/2,y=cy??(el?.clientHeight??600)/2;
  const scale=Math.max(.025,Math.min(2.5,v.scale*factor));const ratio=scale/v.scale;
  return {scale,x:x-(x-v.x)*ratio,y:y-(y-v.y)*ratio};
 });
 useEffect(()=>{
  const el=viewport.current;if(!el)return;
  const wheel=(event:WheelEvent)=>{event.preventDefault();const rect=el.getBoundingClientRect();zoom(Math.exp(-event.deltaY*.002),event.clientX-rect.left,event.clientY-rect.top);};
  el.addEventListener("wheel",wheel,{passive:false});return()=>el.removeEventListener("wheel",wheel);
 },[]);
 const button="min-h-11 rounded-lg border border-white/25 bg-white/5 px-3 text-sm font-bold hover:bg-white/15 focus-visible:outline-2";
 return <section className="mt-8 rounded-2xl border border-white/20 bg-[#111114] p-4 sm:p-6" aria-label="Interactive Road to State bracket">
  <p className="text-xs font-bold uppercase tracking-widest text-white/60">VarsityVue · Road to State</p>
  <h2 className="mt-2 text-3xl font-black uppercase italic">The whole road. Your team.</h2>
  <p className="mt-2 text-sm text-white/70">Drag to explore. Pinch or scroll to zoom. Highlighted later rounds show a possible path; teams advance only after verified results.</p>
  {onSelectSchool && <fieldset disabled={!hydrated} className="mt-4 grid gap-2 sm:grid-cols-2"><label className="text-xs font-bold text-white/70">Search schools<input type="search" aria-label="Search bracket schools" value={schoolSearch} onChange={e=>setSchoolSearch(e.target.value)} placeholder="School name" className="mt-1 min-h-11 w-full rounded-lg border border-white/25 bg-[#242428] px-3 text-base text-white" /></label><label className="text-xs font-bold text-white/70">Locate a school<select aria-label="Choose bracket school" value={location?`${location.division.id}|${location.regionIndex}|${location.schoolName}`:""} onChange={e=>onSelectSchool(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-white/25 bg-[#242428] px-3 text-base text-white">{schoolOptions.filter(o=>o.label.toLowerCase().includes(schoolSearch.toLowerCase())||o.value===`${location?.division.id}|${location?.regionIndex}|${location?.schoolName}`).map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label></fieldset>}
  <fieldset disabled={!hydrated} aria-busy={!hydrated} className="my-4 flex flex-wrap gap-2">
   <select aria-label="Bracket division" className={button+" bg-[#242428]"} value={divisionId} onChange={e=>{setDivisionId(e.target.value as typeof divisionId);setRegion(null);}}>{statewideDivisions.map(d=><option key={d.id} value={d.id}>{d.label}</option>)}</select>
   <select aria-label="Bracket region" className={button+" bg-[#242428]"} value={region??"all"} onChange={e=>setRegion(e.target.value==="all"?null:Number(e.target.value))}><option value="all">Entire statewide bracket</option>{regionLabels.map((r,i)=><option key={r} value={i}>{r}</option>)}</select>
   <button className={button} onClick={()=>{setRegion(null);fit(null);}}>Fit Entire Bracket</button>
   <button className={button} onClick={()=>fit(region)}>{region===null?"Reset view":"Fit selected region"}</button>
   <button className={button} aria-label="Zoom in" onClick={()=>zoom(1.3)}>+</button><button className={button} aria-label="Zoom out" onClick={()=>zoom(1/1.3)}>−</button>
   {location && <button className={button} onClick={()=>{setDivisionId(location.division.id);setRegion(location.regionIndex);if(divisionId===location.division.id)focusSchool();}}>Find {location.schoolName}</button>}
  </fieldset>
  {location?.division.id===divisionId && <details className="mb-4 rounded-xl border border-[#f4be59]/40 p-3"><summary className="cursor-pointer text-sm font-bold">{location.schoolName}: confirmed and possible opponents</summary><ol className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">{layout.nodes.filter(n=>route.has(n.id)).map(n=>{
    const confirmed=n.teams.includes(location.schoolName)?n.teams.find(name=>name&&name!==location.schoolName):null;
    const opposite=n.sources.find(id=>!route.has(id));
    const candidates=opposite?potentialParticipants(layout.nodes,opposite):n.teams.filter(name=>name&&name!==location.schoolName);
    return <li key={n.id}><p className="font-bold">{playoffRoundLabels[n.round]}</p><p className="mt-1 text-xs text-white/65">{confirmed?`Confirmed opponent: ${confirmed}`:`Possible opponents: ${candidates.join(" · ")||"Pending"}`}</p></li>;
  })}</ol><p className="mt-3 text-xs text-white/60">Possible opponents are bracket candidates, not predictions.</p></details>}
  <div ref={viewport} tabIndex={0} aria-label="Bracket canvas. Use zoom and fit buttons or drag to navigate." className="relative h-[65svh] min-h-[360px] max-h-[800px] overflow-hidden rounded-xl border border-white/15 bg-[#08090c] touch-none"
   onKeyDown={e=>{if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)){e.preventDefault();setView(v=>({...v,x:v.x+(e.key==="ArrowLeft"?60:e.key==="ArrowRight"?-60:0),y:v.y+(e.key==="ArrowUp"?60:e.key==="ArrowDown"?-60:0)}));}}}
   onPointerDown={e=>{if((e.target as HTMLElement).closest("a,button"))return;e.currentTarget.setPointerCapture(e.pointerId);pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});}}
   onPointerMove={e=>{const previous=pointers.current.get(e.pointerId);if(!previous)return;const next={x:e.clientX,y:e.clientY};const other=[...pointers.current.entries()].find(([id])=>id!==e.pointerId)?.[1];
    if(other){const old=Math.hypot(previous.x-other.x,previous.y-other.y),distance=Math.hypot(next.x-other.x,next.y-other.y);const rect=e.currentTarget.getBoundingClientRect();if(old>0)zoom(distance/old,(next.x+other.x)/2-rect.left,(next.y+other.y)/2-rect.top);}
    else setView(v=>({...v,x:v.x+next.x-previous.x,y:v.y+next.y-previous.y}));pointers.current.set(e.pointerId,next);}}
   onPointerUp={e=>pointers.current.delete(e.pointerId)} onPointerCancel={e=>pointers.current.delete(e.pointerId)} onLostPointerCapture={e=>pointers.current.delete(e.pointerId)}>
   <div style={{width:layout.width,height:layout.height,transform:`translate(${view.x}px,${view.y}px) scale(${view.scale})`,transformOrigin:"0 0"}} className="absolute left-0 top-0">
    <svg width={layout.width} height={layout.height} className="pointer-events-none absolute inset-0" aria-hidden="true">{layout.nodes.filter(n=>region===null||n.region===region).flatMap(n=>n.sources.map(id=>{const source=layout.nodes.find(s=>s.id===id)!;const reverse=source.x>n.x;const x=source.x+(reverse?0:CARD_WIDTH),y=source.y+CARD_HEIGHT/2,end=n.y+CARD_HEIGHT/2,target=n.x+(reverse?CARD_WIDTH:0),bend=x+(reverse?-29:29);return <path key={id} d={`M${x} ${y} H${bend} V${end} H${target}`} fill="none" stroke={route.has(id)&&route.has(n.id)?"#f4be59":"#51525d"} strokeWidth={route.has(id)&&route.has(n.id)?4:2}/>;}))}</svg>
    {layout.nodes.filter(n=>region===null||n.region===region).map(n=>{const winner=verifiedWinner(n.game);return <article key={n.id} style={{left:n.x,top:n.y,width:CARD_WIDTH,height:CARD_HEIGHT}} className={`absolute overflow-hidden rounded-lg border-2 bg-[#202127] ${route.has(n.id)?"border-[#f4be59]":"border-[#42434d]"}`}>
     <div className="flex justify-between px-2 py-1 text-[10px] font-bold uppercase text-white/65"><span>{n.region>=0?regionLabels[n.region]:"State"} · {playoffRoundLabels[n.round]}</span>{route.has(n.id)&&<span>{n.teams.includes(location?.schoolName??"")?"Your team":"Possible path"}</span>}</div>
     {n.teams.map((name,i)=>{const school=name?(n.region>=0?resolveBracketSchool(name,divisionId,regionLabels[n.region]):regionLabels.map(r=>resolveBracketSchool(name,divisionId,r)).find(Boolean)):undefined;const logo=school?schoolLogoBySlug[school.slug]:undefined;const standing=school?getStandingForSchoolFromGames(school.slug,games):undefined;const playoffCount=school?games.filter(g=>g.season===2026&&g.gameType==="playoff"&&verifiedWinner(g)&&(g.homeSchoolSlug===school.slug||g.awaySchoolSlug===school.slug)).length:0;const record=standing&&standing.overallWins+standing.overallLosses>=10+playoffCount?formatOverallRecord(standing):"—";const score=n.game?.publicScoreVerified?(name===n.game.homeTeam?n.game.homeScore??n.game.score?.home:n.game.awayScore??n.game.score?.away):undefined;return <div key={i} className="flex h-9 items-center gap-2 border-l-[5px] px-2 text-sm font-bold text-white" style={{borderLeftColor:school?.colors.primary??"#646575",background:school?`linear-gradient(90deg, ${school.colors.primary}33, #202127 85%)`:"#202127"}}>
      {logo?<Image unoptimized src={logo.path} width={26} height={26} alt="" className="h-7 w-7 rounded bg-white/90 object-contain p-0.5"/>:<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-white/10 text-xs text-white/70">{name?.slice(0,2).toUpperCase()??"?"}</span>}
      {divisionId==="2A-D1" && name && <span className="text-[10px] text-white/60">{(()=>{const first=layout.nodes.find(node=>node.round===0&&node.teams.includes(name));const slot=first?template2AD12026.slots.find(slot=>slot.region===first.region&&slot.firstRoundGame===first.index&&slot.side===first.teams.indexOf(name)):undefined;return slot?seedLabel(slot):"";})()}</span>}<span className="min-w-0 flex-1 truncate">{school?<a href={`/schools/${school.slug}`} className="hover:underline">{name}</a>:name??"Winner pending"}</span>{name&&<span className="text-[10px] font-normal text-white/60">{record}</span>}<span>{score??""}{winner && winner===name?" ✓":""}</span>
     </div>;})}
     <div className="px-2 py-1 text-[10px] text-white/65">{n.game?<a href={`/games/${n.game.id}`} className="underline">Game Center · {winner?"Verified final":"View matchup"}</a>:n.round===0?"Schedule details pending":"Awaiting verified advancement"}</div>
    </article>;})}
   </div>
  </div><p className="mt-2 text-xs text-white/55">Gold = selected school’s route · Check = verified winner · Drag a card header or empty space to pan. Records require a complete ten-game regular season; — means incomplete or unknown. Official seeds are shown for reviewed divisions.</p>
 </section>;
}
