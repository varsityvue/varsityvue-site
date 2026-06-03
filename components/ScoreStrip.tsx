import Link from "next/link";
import { getScoreboardGames } from "@/lib/scoreboard";
import { getSchoolBySlug } from "@/lib/schools";
import SchoolBadge from "./SchoolBadge";

function parseGameDate(kickoff?: string) {
  if (!kickoff) return null;

  if (!kickoff.includes("T")) {
    const [year, month, day] = kickoff.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const parsedDate = new Date(kickoff);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function formatKickoff(kickoff?: string) {
  const parsedDate = parseGameDate(kickoff);

  if (!parsedDate) return "TBD";

  const hasTime = kickoff?.includes("T");

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(hasTime
      ? {
        hour: "numeric" as const,
        minute: "2-digit" as const,
      }
      : {}),
    timeZone: "America/Chicago",
  }).format(parsedDate);
}

function getGameLabel(gameType: string, week?: number) {
  if (gameType === "scrimmage") return "Scrimmage";
  if (gameType === "playoff") return "Playoff";
  return week === undefined ? "Week TBD" : `Week ${week}`;
}

export default function ScoreStrip() {
  const games = getScoreboardGames().slice(0, 8);

  if (games.length === 0) return null;

  return (
    <section className="border-b border-white/10 bg-white/[0.03] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/45">
              Upcoming This Week
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
              Games to Watch
            </h2>
          </div>

          <Link
            href="/scoreboard"
            className="hidden rounded-full border border-white/10 bg-black/35 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white/60 transition hover:bg-white/10 hover:text-white sm:inline-flex"
          >
            Full Scoreboard →
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2">
          {games.map((game, index) => {
            const awaySchool = game.awaySchoolSlug
              ? getSchoolBySlug(game.awaySchoolSlug)
              : undefined;

            const homeSchool = game.homeSchoolSlug
              ? getSchoolBySlug(game.homeSchoolSlug)
              : undefined;

            const isFeatured = index === 0 || game.isFeatured;

            return (
              <Link
                key={game.id}
                href={`/games/${game.id}`}
                className={`group min-w-[330px] rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.08] ${isFeatured
                    ? "border-[color:var(--vv-primary)]/60 bg-black/60 shadow-2xl"
                    : "border-white/10 bg-black/45"
                  }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <p className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/55">
                      {game.displayStatus}
                    </p>

                    {isFeatured && (
                      <p className="rounded-full border border-[color:var(--vv-primary)]/40 bg-[var(--vv-primary)]/25 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">
                        Featured
                      </p>
                    )}
                  </div>

                  <p className="text-xs font-bold text-white/40">
                    {getGameLabel(game.gameType, game.week)}
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-[auto_1fr_auto] items-center gap-3">
                  {awaySchool ? (
                    <SchoolBadge school={awaySchool} size="xs" />
                  ) : (
                    <MiniFallbackBadge label={game.awayTeam ?? "Away"} />
                  )}

                  <div>
                    <p className="text-lg font-black leading-tight text-white">
                      {game.awayTeam} at {game.homeTeam}
                    </p>

                    <p className="mt-2 text-sm font-bold text-white/55">
                      {formatKickoff(game.kickoff)}
                    </p>

                    {game.venue && (
                      <p className="mt-1 line-clamp-1 text-xs text-white/35">
                        {game.venue}
                      </p>
                    )}
                  </div>

                  {homeSchool ? (
                    <SchoolBadge school={homeSchool} size="xs" />
                  ) : (
                    <MiniFallbackBadge label={game.homeTeam ?? "Home"} />
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-white/45">
                    Matchup Preview
                  </p>

                  <p className="text-xs font-black uppercase tracking-[0.16em] text-white/55 transition group-hover:text-white">
                    View →
                  </p>
                </div>

                {game.status === "final" &&
                  game.homeScore !== undefined &&
                  game.awayScore !== undefined && (
                    <p className="mt-3 text-sm font-bold text-white">
                      Final: {game.awayScore}-{game.homeScore}
                    </p>
                  )}
              </Link>
            );
          })}
        </div>

        <Link
          href="/scoreboard"
          className="mt-4 block rounded-xl border border-white/10 bg-black/35 px-5 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-white/65 transition hover:bg-white/10 hover:text-white sm:hidden"
        >
          Full Scoreboard →
        </Link>
      </div>
    </section>
  );
}

function MiniFallbackBadge({ label }: { label: string }) {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 p-2 text-center text-[10px] font-black uppercase text-white">
      {label.slice(0, 3)}
    </div>
  );
}