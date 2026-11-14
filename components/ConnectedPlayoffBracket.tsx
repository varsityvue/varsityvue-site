"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { buildBracketLayout, CARD_HEIGHT, CARD_WIDTH, fitBracket, schoolRoute } from "@/lib/playoff-bracket-layout";
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
export default function ConnectedPlayoffBracket({games,selectedSchool}:{games:Game[];selectedSchool?:string}) {
 const location=selectedSchool?findSchoolBracketLocation(selectedSchool):null;
 const [divisionId,setDivisionId]=useState(location?.division.id ?? "2A-D1");
 const [region,setRegion]=useState<number|null>(location?.regionIndex??null);
 const [view,setView]=useState<View>({scale:.1,x:20,y:20});
 const viewport=useRef<HTMLDivElement>(null);
 const pointers=useRef(new Map<number,{x:number;y:number}>());
 const layout=useMemo(()=>buildBracketLayout(divisionId,games),[divisionId,games]);
 const route=schoolRoute(layout.nodes,location?.division.id===divisionId?location.schoolName:"");
 const fit=useCallback((selected:number|null)=>{
  const el=viewport.current;if(!el)return;
  const nodes=selected===null?layout.nodes:layout.nodes.filter(n=>n.region===selected);
  const x=Math.min(...nodes.map(n=>n.x)),y=Math.min(...nodes.map(n=>n.y));
  setView(fitBracket({x,y,width:Math.max(...nodes.map(n=>n.x+CARD_WIDTH))-x,height:Math.max(...nodes.map(n=>n.y+CARD_HEIGHT))-y},{width:el.clientWidth,height:el.clientHeight}));
 },[layout]);
 useEffect(()=>{const el=viewport.current;if(!el)return; const observer=new ResizeObserver(()=>fit(region));observer.observe(el);return()=>observer.disconnect();},[fit,region]); // fit follows measured viewport and selected field
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
  <div className="my-4 flex flex-wrap gap-2">
   <select aria-label="Bracket division" className={button+" bg-[#242428]"} value={divisionId} onChange={e=>{setDivisionId(e.target.value as typeof divisionId);setRegion(null);}}>{statewideDivisions.map(d=><option key={d.id} value={d.id}>{d.label}</option>)}</select>
   <select aria-label="Bracket region" className={button+" bg-[#242428]"} value={region??"all"} onChange={e=>setRegion(e.target.value==="all"?null:Number(e.target.value))}><option value="all">Entire statewide bracket</option>{regionLabels.map((r,i)=><option key={r} value={i}>{r}</option>)}</select>
   <button className={button} onClick={()=>{setRegion(null);fit(null);}}>Fit Entire Bracket</button>
   <button className={button} onClick={()=>fit(region)}>Reset view</button>
   <button className={button} aria-label="Zoom in" onClick={()=>zoom(1.3)}>+</button><button className={button} aria-label="Zoom out" onClick={()=>zoom(1/1.3)}>−</button>
   {location && <button className={button} onClick={()=>{setDivisionId(location.division.id);setRegion(location.regionIndex);if(divisionId===location.division.id)fit(location.regionIndex);}}>Find {location.schoolName}</button>}
  </div>
  <div ref={viewport} tabIndex={0} aria-label="Bracket canvas. Use zoom and fit buttons or drag to navigate." className="relative h-[65svh] min-h-[420px] max-h-[800px] overflow-hidden rounded-xl border border-white/15 bg-[#08090c] touch-none"
   onKeyDown={e=>{if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)){e.preventDefault();setView(v=>({...v,x:v.x+(e.key==="ArrowLeft"?60:e.key==="ArrowRight"?-60:0),y:v.y+(e.key==="ArrowUp"?60:e.key==="ArrowDown"?-60:0)}));}}}
   onPointerDown={e=>{if((e.target as HTMLElement).closest("a,button"))return;e.currentTarget.setPointerCapture(e.pointerId);pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});}}
   onPointerMove={e=>{const previous=pointers.current.get(e.pointerId);if(!previous)return;const next={x:e.clientX,y:e.clientY};const other=[...pointers.current.entries()].find(([id])=>id!==e.pointerId)?.[1];
    if(other){const old=Math.hypot(previous.x-other.x,previous.y-other.y),distance=Math.hypot(next.x-other.x,next.y-other.y);const rect=e.currentTarget.getBoundingClientRect();if(old>0)zoom(distance/old,(next.x+other.x)/2-rect.left,(next.y+other.y)/2-rect.top);}
    else setView(v=>({...v,x:v.x+next.x-previous.x,y:v.y+next.y-previous.y}));pointers.current.set(e.pointerId,next);}}
   onPointerUp={e=>pointers.current.delete(e.pointerId)} onPointerCancel={e=>pointers.current.delete(e.pointerId)} onLostPointerCapture={e=>pointers.current.delete(e.pointerId)}>
   <div style={{width:layout.width,height:layout.height,transform:`translate(${view.x}px,${view.y}px) scale(${view.scale})`,transformOrigin:"0 0"}} className="absolute left-0 top-0">
    <svg width={layout.width} height={layout.height} className="pointer-events-none absolute inset-0" aria-hidden="true">{layout.nodes.flatMap(n=>n.sources.map(id=>{const source=layout.nodes.find(s=>s.id===id)!;const reverse=source.x>n.x;const x=source.x+(reverse?0:CARD_WIDTH),y=source.y+CARD_HEIGHT/2,end=n.y+CARD_HEIGHT/2,target=n.x+(reverse?CARD_WIDTH:0),bend=x+(reverse?-29:29);return <path key={id} d={`M${x} ${y} H${bend} V${end} H${target}`} fill="none" stroke={route.has(id)&&route.has(n.id)?"#f4be59":"#51525d"} strokeWidth={route.has(id)&&route.has(n.id)?4:2}/>;}))}</svg>
    {layout.nodes.map(n=>{const winner=verifiedWinner(n.game);return <article key={n.id} style={{left:n.x,top:n.y,width:CARD_WIDTH,height:CARD_HEIGHT}} className={`absolute overflow-hidden rounded-lg border-2 bg-[#202127] ${route.has(n.id)?"border-[#f4be59]":"border-[#42434d]"}`}>
     <div className="flex justify-between px-2 py-1 text-[10px] font-bold uppercase text-white/65"><span>{n.region>=0?regionLabels[n.region]:"State"} · {playoffRoundLabels[n.round]}</span>{route.has(n.id)&&<span>{n.teams.includes(location?.schoolName??"")?"Your team":"Possible path"}</span>}</div>
     {n.teams.map((name,i)=>{const school=name?(n.region>=0?resolveBracketSchool(name,divisionId,regionLabels[n.region]):regionLabels.map(r=>resolveBracketSchool(name,divisionId,r)).find(Boolean)):undefined;const logo=school?schoolLogoBySlug[school.slug]:undefined;const record=school?formatOverallRecord(getStandingForSchoolFromGames(school.slug,games)):"—";const score=n.game?.publicScoreVerified?(name===n.game.homeTeam?n.game.homeScore??n.game.score?.home:n.game.awayScore??n.game.score?.away):undefined;return <div key={i} className="flex h-9 items-center gap-2 border-l-[5px] px-2 text-sm font-bold text-white" style={{borderLeftColor:school?.colors.primary??"#646575",background:"#202127"}}>
      {logo?<Image unoptimized src={logo.path} width={26} height={26} alt="" className="h-7 w-7 rounded bg-white/90 object-contain p-0.5"/>:<span className="h-7 w-7 rounded bg-white/10"/>}
      {divisionId==="2A-D1" && name && <span className="text-[10px] text-white/60">{(()=>{const first=layout.nodes.find(node=>node.round===0&&node.teams.includes(name));const slot=first?template2AD12026.slots.find(slot=>slot.region===first.region&&slot.firstRoundGame===first.index&&slot.side===first.teams.indexOf(name)):undefined;return slot?seedLabel(slot):"";})()}</span>}<span className="min-w-0 flex-1 truncate">{school?<a href={`/schools/${school.slug}`} className="hover:underline">{name}</a>:name??"Winner pending"}</span>{name&&<span className="text-[10px] font-normal text-white/60">{record}</span>}<span>{score??""}{winner && winner===name?" ✓":""}</span>
     </div>;})}
     <div className="px-2 py-1 text-[10px] text-white/65">{n.game?<a href={`/games/${n.game.id}`} className="underline">Game Center · {winner?"Verified final":"View matchup"}</a>:n.round===0?"Schedule details pending":"Awaiting verified advancement"}</div>
    </article>;})}
   </div>
  </div><p className="mt-2 text-xs text-white/55">Gold = selected school’s route · Check = verified winner · Records follow the school hub; — means unknown. Official seeds are shown for reviewed divisions.</p>
 </section>;
}
