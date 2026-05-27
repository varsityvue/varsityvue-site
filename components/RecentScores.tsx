import Link from "next/link";

import type { Game } from "@/types/platform";
import type { SchoolTheme } from "../types/school-theme";

type RecentScoresProps = {
  scores: Game[];
  theme: SchoolTheme;
  schoolSlug: string;
};

function formatScoreDate(kickoff?: string) {
  if (!kickoff) return "TBD";

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

  if (schoolScore === opponentScore) return "T";

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
  const opponent = isHomeTeam
    ? game.awayTeam ?? "Away Team"
    : game.homeTeam ?? "Home Team";

  return `${isHomeTeam ? "vs" : "at"} ${opponent}`;
}

function getResultClass(result: "W" | "L" | "T" | null) {
  if (result === "W") return "border-green-400/30 bg-green-500/15 text-green-300";
  if (result === "L") return "border-red-400/30 bg-red-500/15 text-red-300";
  if (result === "T") return "border-yellow-400/30 bg-yellow-500/15 text-yellow-200";

  return "border-white/10 bg-white/10 text-white/60";
}

export default function RecentScores({
  scores,
  theme,
  schoolSlug,
}: RecentScoresProps) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl sm:p-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d65a6d]">
            Results Snapshot
          </p>
          <h2 className="mt-2 text-3xl font-black text-white">
            Recent Scores
          </h2>
        </div>

        <p className="hidden text-sm font-bold text-white/40 sm:block">
          Final results
        </p>
      </div>

      {scores.length === 0 ? (
        <div
          className="rounded-3xl border bg-black/35 p-6"
          style={{ borderColor: `${theme.secondary}33` }}
        >
          <p className="text-lg font-black text-white">
            No final scores available yet.
          </p>
          <p className="mt-2 text-sm leading-6 text-white/50">
            Results will appear here as games are completed.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {scores.map((game) => {
            const result = getResult(game, schoolSlug);

            return (
              <Link
                key={game.id}
                href={`/games/${game.id}`}
                className="group relative overflow-hidden rounded-[1.5rem] border bg-black/35 p-5 shadow-lg transition hover:-translate-y-1 hover:bg-white/[0.08]"
                style={{
                  borderColor: `${theme.secondary}33`,
                  boxShadow: `0 18px 50px ${theme.primary}18`,
                }}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-30 transition group-hover:opacity-45"
                  style={{
                    background: `radial-gradient(circle at top right, ${theme.primary}, transparent 58%)`,
                  }}
                />

                <div className="relative">
                  <div className="flex items-center justify-between gap-4">
                    <span
                      className={`rounded-full border px-4 py-2 text-sm font-black ${getResultClass(
                        result
                      )}`}
                    >
                      {result ?? "FINAL"}
                    </span>

                    <span className="text-sm font-bold text-white/45">
                      {formatScoreDate(game.kickoff)}
                    </span>
                  </div>

                  <h3 className="mt-5 text-2xl font-black leading-tight text-white">
                    {getOpponentLabel(game, schoolSlug)}
                  </h3>

                  <p className="mt-3 text-4xl font-black text-white">
                    {getScoreDisplay(game, schoolSlug)}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {game.districtGame && <ResultBadge label="District" />}

                    {game.articleIds?.length ? (
                      <ResultBadge label="Recap Available" />
                    ) : null}
                  </div>

                  <div
                    className="mt-6 h-1 w-20 rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`,
                    }}
                  />

                  <p className="mt-5 text-sm font-black uppercase tracking-[0.14em] text-[#d65a6d]">
                    View matchup →
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ResultBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-white/70">
      {label}
    </span>
  );
}