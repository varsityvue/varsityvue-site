import Link from "next/link";
import type { Game } from "@/types/platform";

const regionTwoD1 = [
  ["Cisco", "Nocona"],
  ["Bosqueville", "Johnson City"],
  ["Muenster", "Hawley"],
  ["San Saba", "Valley Mills"],
  ["Mason", "Itasca"],
  ["Tioga", "Anson"],
  ["Axtell", "Bangs"],
  ["De Leon", "Alvord"],
] as const;


const regionTwoD2 = [
  ["Wellington", "Munday"], ["Crawford", "Albany"],
  ["Windthorst", "Quanah"], ["Stamford", "Mart"],
  ["Goldthwaite", "Hubbard"], ["Haskell", "Clarendon"],
  ["Santo", "Miles"], ["Wheeler", "Seymour"],
] as const;
const regionThree4AD1 = [
  ["Little Cypress-Mauriceville", "Austin"], ["Jarrell", "El Campo"],
  ["Stafford", "Bridge City"], ["Sealy", "China Spring"],
  ["Bay City", "Lampasas"], ["Fort Bend Willowridge", "Hargrave"],
  ["Stephenville", "Navasota"], ["Vidor", "Sterling"],
] as const;
const brackets = [
  { title: "2A Division I · Region II", teams: regionTwoD1, featured: "Cisco · Hawley · Anson · De Leon" },
  { title: "2A Division II · Region II", teams: regionTwoD2, featured: "Goldthwaite · Santo · Albany" },
  { title: "4A Division I · Region III", teams: regionThree4AD1, featured: "Stephenville" },
] as const;
const featured = new Set(["Cisco", "Hawley", "Anson", "De Leon", "Goldthwaite", "Santo", "Albany", "Stephenville"]);
const slug = (name: string) => name.toLowerCase().replace(/\s+/g, "-");
const rounds = ["Bi-district", "Area", "Regional", "Quarterfinal"] as const;

function winner(game: Game | undefined): string | null {
  if (!game || !game.publicScoreVerified || game.status !== "final") return null;
  const home = game.homeScore ?? game.score?.home;
  const away = game.awayScore ?? game.score?.away;
  if (typeof home !== "number" || typeof away !== "number" || home === away) return null;
  return home > away ? game.homeTeam : game.awayTeam;
}

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
  const firstRound = teams.map(([a, b]) =>
    games.find((g) => g.season === 2026 && g.gameType === "playoff" &&
      ((g.homeTeam === a && g.awayTeam === b) || (g.homeTeam === b && g.awayTeam === a))),
  );
  const winners = firstRound.map(winner);
  const area = Array.from({ length: 4 }, (_, i) => [winners[2 * i], winners[2 * i + 1]]);

  return (
    <div className="mt-5 rounded-2xl border border-white/15 bg-[#111114] p-4 sm:p-6">
      <h3 className="text-xl font-black">{title}</h3>
      <p className="mt-1 text-xs text-white/55">Featuring {featuredLabel} · Swipe sideways to follow the bracket</p>
        <div className="mt-5 overflow-x-auto pb-3" tabIndex={0} aria-label="Scrollable 2A Division I Region II playoff bracket">
          <div className="grid min-w-[840px] grid-cols-4 gap-4">
            {rounds.map((round, roundIndex) => {
              const count = 8 / (2 ** roundIndex);
              return (
                <div key={round} className="flex flex-col">
                  <h4 className="mb-3 border-b border-white/15 pb-2 text-xs font-black uppercase tracking-widest text-white/65">{round}</h4>
                  <div className="flex flex-1 flex-col justify-around gap-3">
                    {Array.from({ length: count }, (_, i) => {
                      const names: (string | null)[] = roundIndex === 0 ? [...teams[i]] : roundIndex === 1 ? area[i] : [null, null];
                      const game = roundIndex === 0 ? firstRound[i] : undefined;
                      return (
                        <div key={i} className="rounded-xl border border-white/15 bg-[#1c1c21] p-2.5">
                          {names.map((name, index) => (
                            <div key={index} className={`flex min-h-8 items-center justify-between gap-2 rounded-md px-2 py-1 text-xs ${name && featured.has(name) ? "bg-[#8B1020]/40 font-black text-white" : "text-white/75"}`}>
                              {name ? <span>{name}</span> : <span className="italic text-white/35">TBD</span>}
                              {roundIndex === 0 && game?.publicScoreVerified && (game.homeScore != null || game.score) &&
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
        <p className="mt-3 text-xs text-white/55">First-round placement: 2026 UIL / MaxPreps. Later-round slots remain TBD until results and matchups are verified.</p>
    </div>
  );
}
