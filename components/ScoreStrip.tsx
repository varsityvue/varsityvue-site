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

export default function ScoreStrip() {
  const games = getScoreboardGames().slice(0, 8);

  if (games.length === 0) return null;

  return (
    <section className="border-b border-white/10 bg-white/[0.03]">
      <div className="mx-auto flex max-w-7xl gap-4 overflow-x-auto px-4 py-4 sm:px-6 lg:px-8">
        {games.map((game) => {
          const awaySchool = game.awaySchoolSlug
            ? getSchoolBySlug(game.awaySchoolSlug)
            : undefined;

          const homeSchool = game.homeSchoolSlug
            ? getSchoolBySlug(game.homeSchoolSlug)
            : undefined;

          return (
            <Link
              key={game.id}
              href={`/games/${game.id}`}
              className="min-w-[320px] rounded-2xl border border-white/10 bg-black/50 p-4 transition hover:border-white/25 hover:bg-white/10"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                  {game.displayStatus}
                </p>

                <p className="text-xs text-white/40">Week {game.week}</p>
              </div>

              <div className="mt-4 grid grid-cols-[auto_1fr_auto] items-center gap-3">
                {awaySchool ? (
                  <SchoolBadge school={awaySchool} size="xs" />
                ) : (
                  <MiniFallbackBadge label={game.awayTeam ?? "Away"} />
                )}

                <div>
                  <p className="font-black leading-tight text-white">
                    {game.awayTeam} at {game.homeTeam}
                  </p>

                  <p className="mt-2 text-sm text-white/55">
                    {formatKickoff(game.kickoff)}
                  </p>
                </div>

                {homeSchool ? (
                  <SchoolBadge school={homeSchool} size="xs" />
                ) : (
                  <MiniFallbackBadge label={game.homeTeam ?? "Home"} />
                )}
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