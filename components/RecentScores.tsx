import Link from "next/link";

import type { Game } from "../data/games";
import type { SchoolTheme } from "../types/school-theme";

type RecentScoresProps = {
  scores: Game[];
  theme: SchoolTheme;
  schoolSlug: string;
};

function formatScoreDate(kickoff: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Chicago",
  }).format(new Date(kickoff));
}

function getResult(game: Game, schoolSlug: string) {
  if (game.status !== "final") return null;
  if (game.homeScore === undefined || game.awayScore === undefined) return null;

  const isHomeTeam = game.homeSchoolSlug === schoolSlug;
  const schoolScore = isHomeTeam ? game.homeScore : game.awayScore;
  const opponentScore = isHomeTeam ? game.awayScore : game.homeScore;

  return schoolScore > opponentScore ? "W" : "L";
}

function getScoreDisplay(game: Game, schoolSlug: string) {
  if (game.homeScore === undefined || game.awayScore === undefined) {
    return "--";
  }

  const isHomeTeam = game.homeSchoolSlug === schoolSlug;
  const schoolScore = isHomeTeam ? game.homeScore : game.awayScore;
  const opponentScore = isHomeTeam ? game.awayScore : game.homeScore;

  return `${schoolScore}-${opponentScore}`;
}

function getOpponentLabel(game: Game, schoolSlug: string) {
  const isHomeTeam = game.homeSchoolSlug === schoolSlug;
  const opponent = isHomeTeam ? game.awayTeam : game.homeTeam;

  return `${isHomeTeam ? "vs" : "at"} ${opponent}`;
}

export default function RecentScores({
  scores,
  theme,
  schoolSlug,
}: RecentScoresProps) {
  return (
    <section>
      <div>
        <h2 className="mb-6 text-3xl font-black">Recent Scores</h2>

        {scores.length === 0 ? (
          <div
            className="rounded-3xl border bg-white/5 p-6 text-white/60"
            style={{ borderColor: `${theme.secondary}33` }}
          >
            No recent results available.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {scores.map((game) => {
              const result = getResult(game, schoolSlug);

              return (
                <Link
                  key={game.id}
                  href={`/games/${game.id}`}
                  className="rounded-3xl border bg-white/[0.04] p-6 shadow-lg transition hover:-translate-y-1 hover:bg-white/[0.08]"
                  style={{
                    borderColor: `${theme.secondary}33`,
                    boxShadow: `0 18px 50px ${theme.primary}22`,
                  }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span
                      className={`rounded-full px-4 py-2 text-sm font-black ${
                        result === "W"
                          ? "bg-green-500/20 text-green-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {result}
                    </span>

                    <span className="text-sm text-white/50">
                      {formatScoreDate(game.kickoff)}
                    </span>
                  </div>

                  <h3 className="mt-5 text-2xl font-black leading-tight">
                    {getOpponentLabel(game, schoolSlug)}
                  </h3>

                  <p className="mt-3 text-3xl font-black text-white">
                    {getScoreDisplay(game, schoolSlug)}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {game.districtGame && (
                      <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-white/70">
                        District
                      </span>
                    )}

                    {game.recapArticleSlug && (
                      <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-white/70">
                        Recap available
                      </span>
                    )}
                  </div>

                  <div
                    className="mt-6 h-1 w-20 rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`,
                    }}
                  />

                  <p className="mt-5 text-sm font-bold text-white/60">
                    View matchup →
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}