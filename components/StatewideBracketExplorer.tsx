"use client";

import { useState } from "react";
import { regionLabels, statewideDivisions, validateRegionalField } from "@/data/statewide-playoff-brackets";

export default function StatewideBracketExplorer() {
  const [divisionId, setDivisionId] = useState<string>("2A-D1");
  const [regionIndex, setRegionIndex] = useState<number | null>(1);
  const division = statewideDivisions.find((item) => item.id === divisionId) ?? statewideDivisions[0];
  const field = regionIndex === null ? null : division.regions[regionIndex];
  const verified = field && validateRegionalField(field).length === 0;

  return (
    <section id="statewide-brackets" aria-labelledby="statewide-brackets-title" className="mt-11 scroll-mt-24 rounded-2xl border border-white/15 bg-[#111114] p-4 sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-white/55">2026 UIL playoffs</p>
      <h2 id="statewide-brackets-title" className="mt-1 text-2xl font-black uppercase italic sm:text-3xl">State championship brackets</h2>
      <p className="mt-2 text-sm leading-6 text-white/70">Browse 2A–4A by division and region. Only verified first-round fields are displayed; remaining regions are being prepared.</p>
      <label htmlFor="statewide-division" className="mt-5 block text-xs font-bold uppercase tracking-wider text-white/70">Classification and division</label>
      <select id="statewide-division" className="mt-2 min-h-11 w-full max-w-sm rounded-xl border border-white/25 bg-[#242428] px-3 text-base font-semibold text-white" value={divisionId} onChange={(event) => { setDivisionId(event.target.value); setRegionIndex(null); }}>
        {statewideDivisions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {regionLabels.map((label, index) => {
          const ready = validateRegionalField(division.regions[index]).length === 0;
          return (
            <button key={label} type="button" aria-pressed={regionIndex === index} onClick={() => setRegionIndex(regionIndex === index ? null : index)} className={`min-h-16 rounded-xl border px-3 py-2 text-left text-sm font-bold transition ${regionIndex === index ? "border-[#bb4053] bg-[#8B1020]/40" : "border-white/15 bg-white/[0.04]"}`}>
              <span className="block">{label}</span>
              <span className="mt-1 block text-xs font-normal text-white/60">{ready ? "View matchups" : "Verification pending"}</span>
            </button>
          );
        })}
      </div>
      {regionIndex !== null && <div className="mt-4 rounded-xl border border-white/15 bg-black/25 p-3 sm:p-4">
        <h3 className="font-black">{division.label} · {regionLabels[regionIndex]}</h3>
        {verified && field ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {field.map(([a,b],i) => <div key={i} className="rounded-lg border border-white/10 bg-[#202025] px-3 py-2 text-sm"><p className="font-semibold">{a}</p><p className="mt-1 text-white/70">{b}</p></div>)}
          </div>
        ) : <p className="mt-2 text-sm text-white/65">This regional field is not yet verified. No matchups are being projected.</p>}
      </div>}
      <div className="mt-5 rounded-xl border border-white/15 p-3">
        <h3 className="text-sm font-black uppercase tracking-wide">Road to the state championship</h3>
        <p className="mt-2 text-sm text-white/70">Region I winner vs. Region II winner · Region III winner vs. Region IV winner</p>
        <p className="mt-1 text-sm text-white/70">State semifinal winners meet in the championship. Regional champions remain TBD until verified.</p>
      </div>
    </section>
  );
}
