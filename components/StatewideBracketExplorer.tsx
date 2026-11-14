"use client";

import { useState } from "react";
import { regionLabels, statewideDivisions, validateRegionalField } from "@/data/statewide-playoff-brackets";
import { findSchoolBracketLocation } from "@/lib/playoff-school-location";
import { resolveBracketSchool } from "@/lib/playoff-school-catalog";
import { getStateChampionshipPath } from "@/lib/state-championship-path";
import { buildRegionalRounds, verifiedWinner } from "@/lib/playoff-bracket-advancement";
import type { Game } from "@/types/platform";
import { regionalPlayoffRoundLabels, playoffRoundLabels } from "@/lib/playoff-round-labels";

export default function StatewideBracketExplorer({ games, selectedSchool }: { games: Game[]; selectedSchool?: string }) {
  return <BracketSelection key={selectedSchool ?? "browse"} games={games} selectedSchool={selectedSchool} />;
}

function BracketSelection({ games, selectedSchool }: { games: Game[]; selectedSchool?: string }) {
  const location = selectedSchool ? findSchoolBracketLocation(selectedSchool) : null;
  const [divisionId, setDivisionId] = useState<string>(location?.division.id ?? "2A-D1");
  const [regionIndex, setRegionIndex] = useState<number | null>(location?.regionIndex ?? 1);
  const division = statewideDivisions.find((item) => item.id === divisionId) ?? statewideDivisions[0];
  const field = regionIndex === null ? null : division.regions[regionIndex];
  const verified = field && validateRegionalField(field).length === 0;
  const path = getStateChampionshipPath(division.id, games);
  const regional = verified && field ? buildRegionalRounds(field, games, 2026, division.id, ["I", "II", "III", "IV"][regionIndex ?? 0]) : null;
  const roundNames = regionalPlayoffRoundLabels;

  return (
    <section id="statewide-brackets" aria-labelledby="statewide-brackets-title" className="mt-11 scroll-mt-24 rounded-2xl border border-white/15 bg-[#111114] p-4 sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-white/55">2026 UIL playoffs</p>
      <h2 id="statewide-brackets-title" className="mt-1 text-2xl font-black uppercase italic sm:text-3xl">State championship brackets</h2>
      <p className="mt-2 text-sm leading-6 text-white/70">Browse 2A–4A by division and region. Explore all 24 regional fields across six divisions. Later-round opponents appear only when verified results establish them.</p>
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
        {regional ? (
          <div className="mt-3 space-y-2">
            {roundNames.map((round, roundIndex) => (
              <details key={round} open={roundIndex === 0} className="rounded-xl border border-white/15 bg-[#202025]">
                <summary className="cursor-pointer px-3 py-3 text-sm font-black">{round} · {regional.roundTeams[roundIndex].length} {regional.roundTeams[roundIndex].length === 1 ? "game" : "games"}</summary>
                <div className="grid gap-2 border-t border-white/10 p-3 sm:grid-cols-2">
                  {regional.roundTeams[roundIndex].map(([a,b],i) => {
                    const game = regional.roundGames[roundIndex][i];
                    const winner = verifiedWinner(game);
                    return <div key={i} className={`rounded-lg border p-3 text-sm ${selectedSchool && (a === location?.schoolName || b === location?.schoolName) ? "border-[#b83a50] bg-[#8B1020]/25" : "border-white/10 bg-black/30"}`}>
                      {[a, b].map((name, teamIndex) => {
                        const school = name ? resolveBracketSchool(name, division.id, regionLabels[regionIndex]) : undefined;
                        return <p key={teamIndex} className={`${teamIndex ? "mt-1 " : ""}${winner === name ? "font-black text-white" : "text-white/80"}`}>
                          {school ? <a href={`/schools/${school.slug}`} className="underline underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2">{name}</a> : name ?? "TBD"}
                        </p>;
                      })}
                      {roundIndex === 0 && !game && <p className="mt-2 text-xs text-white/60">Schedule details pending verification.</p>}
                      {game && <a href={`/games/${game.id}`} className="mt-2 inline-block text-xs font-bold underline underline-offset-4">Game Center</a>}
                    </div>;
                  })}
                </div>
              </details>
            ))}
          </div>
        ) : <p className="mt-2 text-sm text-white/65">This regional field is not yet verified. No matchups are being projected.</p>}
      </div>}
      <div className="mt-5 rounded-xl border border-white/15 p-3">
        <h3 className="text-sm font-black uppercase tracking-wide">Road to the state championship</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">{path?.semifinals.map(([a,b],index) => <div key={index} className="rounded-lg border border-white/10 bg-[#202025] p-3"><p className="text-xs font-bold uppercase text-white/55">{playoffRoundLabels[4]} {index+1}</p><p className="mt-2 text-sm font-semibold">{a ?? "Region "+(index===0?"I":"III")+" winner TBD"}</p><p className="mt-1 text-sm font-semibold">{b ?? "Region "+(index===0?"II":"IV")+" winner TBD"}</p></div>)}</div>
        <div className="mt-2 rounded-lg border border-white/10 bg-[#202025] p-3"><p className="text-xs font-bold uppercase text-white/55">{playoffRoundLabels[5]}</p><p className="mt-2 text-sm font-semibold">{path?.final[0] ?? "Semifinal 1 winner TBD"} vs. {path?.final[1] ?? "Semifinal 2 winner TBD"}</p>{path?.champion && <p className="mt-2 font-black text-white">Champion: {path.champion}</p>}</div>
      </div>
    </section>
  );
}
