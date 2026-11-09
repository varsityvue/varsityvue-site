import Link from "next/link";
import type { Game } from "@/types/platform";
import { buildRegionalRounds } from "@/lib/playoff-bracket-advancement";
import { brackets } from "@/data/playoff-bracket-fields";

const featured = new Set(["Cisco", "Hawley", "Anson", "De Leon", "Goldthwaite", "Santo", "Albany", "Stephenville"]);
const rounds = ["Bi-district", "Area", "Regional semifinal", "Regional final"] as const;

export default function LivePlayoffBrackets({ games }: { games: Game[] }) {
  return (
    <section id="brackets" className="mt-11 scroll-mt-24" aria-labelledby="brackets-heading">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-white/55">Road to the regional championship</p><h2 id="brackets-heading" className="mt-1 text-3xl font-black uppercase italic">Live playoff brackets</h2></div><span className="rounded-full border border-[var(--vv-accent)] px-3 py-1.5 text-xs font-bold">2026 · UIL</span></div>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">Three verified regional fields, with VarsityVue schools highlighted. Winners advance only after verified final results.</p>
      {brackets.map((bracket) => <RegionalBracket key={bracket.title} games={games} title={bracket.title} teams={bracket.teams} featuredLabel={bracket.featured} />)}
    </section>
  );
}

function RegionalBracket({ games, title, teams, featuredLabel }: { games: Game[]; title: string; teams: readonly (readonly [string, string])[]; featuredLabel: string }) {
  const { roundGames, roundTeams } = buildRegionalRounds(teams, games);

  return (
    <div className="mt-5 rounded-2xl border border-white/15 bg-[#111114] p-4 sm:p-6">
      <h3 className="text-xl font-black">{title}</h3>
      <p className="mt-1 text-xs text-white/55">Featuring {featuredLabel} · Swipe sideways to follow the bracket</p>
        <div className="mt-5 overflow-x-auto pb-3" tabIndex={0} aria-label={`Scrollable ${title} playoff bracket`}>
          <div className="grid min-w-[840px] grid-cols-4 gap-4">
            {rounds.map((round, roundIndex) => {
              const count = 8 / (2 ** roundIndex);
              return (
                <div key={round} className="flex flex-col">
                  <h4 className="mb-3 border-b border-white/15 pb-2 text-xs font-black uppercase tracking-widest text-white/65">{round}</h4>
                  <div className="flex flex-1 flex-col justify-around gap-3">
                    {Array.from({ length: count }, (_, i) => {
                      const names = roundTeams[roundIndex][i];
                      const game = roundGames[roundIndex][i];
                      return (
                        <div key={i} className="rounded-xl border border-white/15 bg-[#1c1c21] p-2.5">
                          {names.map((name, index) => (
                            <div key={index} className={`flex min-h-8 items-center justify-between gap-2 rounded-md px-2 py-1 text-xs ${name && featured.has(name) ? "bg-[#8B1020]/40 font-black text-white" : "text-white/75"}`}>
                              {name ? <span>{name}</span> : <span className="italic text-white/35">TBD</span>}
                              {game?.publicScoreVerified && (game.homeScore != null || game.score) &&
                                <span className="tabular-nums">{name === game.homeTeam ? (game.homeScore ?? game.score?.home) : (game.awayScore ?? game.score?.away)}</span>}
                            </div>
                          ))}
                          {game && <Link href={`/games/${game.id}`} className="mt-2 block border-t border-white/10 pt-2 text-center text-[10px] font-bold uppercase tracking-wide text-white/70 hover:text-white">Game Center →</Link>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
    </div>
  );
}
