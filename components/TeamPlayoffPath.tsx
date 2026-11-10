"use client";

import { useState } from "react";
import type { Game } from "@/types/platform";
import { regionLabels } from "@/data/statewide-playoff-brackets";
import { findSchoolBracketLocation } from "@/lib/playoff-school-location";
import { buildRegionalRounds, verifiedWinner } from "@/lib/playoff-bracket-advancement";

const featured = ["De Leon", "Cisco", "Stephenville", "Goldthwaite", "Santo", "Albany", "Anson", "Hawley"] as const;
const labels = ["Bi-district", "Area", "Regional semifinal", "Regional final · State quarterfinal"] as const;

export default function TeamPlayoffPath({ games, selectedSchool, onSelectSchool }: { games: Game[]; selectedSchool?: string; onSelectSchool?: (school: string) => void }) {
  const [localSchool, setLocalSchool] = useState<string>("De Leon");
  const school = selectedSchool ?? localSchool;
  const setSchool = onSelectSchool ?? setLocalSchool;
  const location = findSchoolBracketLocation(school);
  if (!location) return null;
  const { division, regionIndex, field, firstIndex } = location;
  const { roundTeams, roundGames } = buildRegionalRounds(field, games, 2026, division.id, ["I", "II", "III", "IV"][regionIndex]);
  let eliminated = false;

  return (
    <section id="team-path" aria-labelledby="team-path-heading" className="mt-11 scroll-mt-24 rounded-2xl border border-[#8B1020]/65 bg-[#170d12] p-4 sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/55">Follow the road to state</p>
      <h2 id="team-path-heading" className="mt-1 text-2xl font-black uppercase italic sm:text-3xl">Your team’s playoff path</h2>
      <p className="mt-2 text-sm text-white/70">Choose a school to see its bracket position, verified results and possible next opponents.</p>
      <label htmlFor="playoff-team-select" className="mt-5 block text-xs font-bold uppercase tracking-wider text-white/80">Choose your school</label>
      <select id="playoff-team-select" value={school} onChange={(event) => setSchool(event.target.value)} className="mt-2 min-h-11 w-full max-w-sm rounded-xl border border-white/25 bg-[#292027] px-3 text-base font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
        {featured.map((name) => <option key={name} value={name}>{name}</option>)}
      </select>
      <p className="mt-3 text-xs font-semibold text-white/55">{division.label} · {regionLabels[regionIndex]} · Confirmed opponents only after verified results</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {labels.map((label, round) => {
          const slot = Math.floor(firstIndex / (2 ** round));
          const pair = roundTeams[round][slot];
          const game = roundGames[round][slot];
          const winner = verifiedWinner(game);
          const involved = pair.includes(school);
          const opponent = involved ? pair.find((name) => name !== school) : null;
          const previousEliminated = eliminated;
          if (involved && winner && winner !== school) eliminated = true;
          const status = previousEliminated || !involved ? "Not reached" : winner === school ? "Advanced" : winner ? "Eliminated" : game?.status === "live" && game.publicScoreVerified ? "In progress" : game?.status === "final" ? "Awaiting verification" : game ? "Scheduled" : round === 0 ? "Matchup pending" : "To be determined";
          return (
            <div key={label} className="rounded-xl border border-white/15 bg-black/30 p-3">
              <p className="text-[11px] font-black uppercase tracking-wide text-white/55">{label}</p>
              <p className="mt-3 min-h-10 text-sm font-bold text-white">{previousEliminated || !involved ? "—" : opponent ?? "Opponent TBD"}</p>
              <p className="mt-1 text-xs text-white/60">{status}</p>
              {involved && game && <a className="mt-3 inline-flex min-h-10 items-center text-xs font-bold underline underline-offset-4" href={`/games/${game.id}`}>View Game Center</a>}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-white/50">Potential opponents and later-round placements are not predictions. Results advance only after verification.</p>
    </section>
  );
}
