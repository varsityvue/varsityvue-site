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

const featured = new Set(["Cisco", "Hawley", "Anson", "De Leon"]);
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
  const firstRound = regionTwoD1.map(([a, b]) =>
    games.find((g) => g.season === 2026 && g.gameType === "playoff" &&
      ((g.homeTeam === a && g.awayTeam === b) || (g.homeTeam === b && g.awayTeam === a))),
  );
  const winners = firstRound.map(winner);
  const area = Array.from({ length: 4 }, (_, i) => [winners[2 * i], winners[2 * i + 1]]);

  return (
    <section id="brackets" className="mt-11 scroll-mt-24" aria-labelledby="brackets-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/55">Road to the regional championship</p>
          <h2 id="brackets-heading" className="mt-1 text-3xl font-black uppercase italic">Live playoff brackets</h2>
        </div>
        <span className="rounded-full border border-[var(--vv-accent)] px-3 py-1.5 text-xs font-bold">2026 · UIL</span>
      </div>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
        The complete Region II path, with VarsityVue schools highlighted. Teams advance only after their results are verified.
      </p>
      <div className="mt-5 rounded-2xl border border-white/15 bg-[#111114] p-4 sm:p-6">
        <h3 className="text-xl font-black">2A Division I · Region II</h3>
        <p className="mt-1 text-xs text-white/55">Featuring Cisco, Hawley, Anson and De Leon · Swipe sideways to follow the bracket</p>
        <div className="mt-5 overflow-x-auto pb-3" tabIndex={0} aria-label="Scrollable 2A Division I Region II playoff bracket">
          <div className="grid min-w-[840px] grid-cols-4 gap-4">
            {rounds.map((round, roundIndex) => {
              const count = 8 / (2 ** roundIndex);
              return (
                <div key={round} className="flex flex-col">
                  <h4 className="mb-3 border-b border-white/15 pb-2 text-xs font-black uppercase tracking-widest text-white/65">{round}</h4>
                  <div className="flex flex-1 flex-col justify-around gap-3">
                    {Array.from({ length: count }, (_, i) => {
                      const names: (string | null)[] = roundIndex === 0 ? [...regionTwoD1[i]] : roundIndex === 1 ? area[i] : [null, null];
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
        <p className="mt-3 text-xs text-white/55">Bracket placement: 2026 UIL / MaxPreps. Later-round slots remain TBD until results and matchups are confirmed.</p>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
          <h3 className="font-black">2A Division II · Region II</h3>
          <p className="mt-1 text-sm text-white/65">Goldthwaite · Santo · Albany — complete bracket being verified.</p>
        </div>
        <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
          <h3 className="font-black">4A Division I · Stephenville</h3>
          <p className="mt-1 text-sm text-white/65">Regional field and bracket positions being verified.</p>
        </div>
      </div>
    </section>
  );
}
