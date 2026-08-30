import Link from "next/link";

import type { Game } from "@/types/platform";
import type { SchoolTheme } from "../types/school-theme";
import { getSchoolBySlug } from "@/lib/schools";
import SchoolBadge from "./SchoolBadge";

type RecentScoresProps = {
  scores: Game[];
  theme: SchoolTheme;
  schoolSlug: string;
};

const MAX_RESULTS = 4;

function parseGameDate(kickoff?: string) {
  if (!kickoff) return null;

  if (!kickoff.includes("T")) {
    const [year, month, day] = kickoff.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const parsedDate = new Date(kickoff);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function formatScoreDate(kickoff?: string) {
  const parsedDate = parseGameDate(kickoff);
  if (!parsedDate) return "Date TBD";

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Chicago",
  }).format(parsedDate);
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
  if (game.homeScore === undefined || game.awayScore === undefined) return "—";

  const isHomeTeam = game.homeSchoolSlug === schoolSlug;
  const schoolScore = isHomeTeam ? game.homeScore : game.awayScore;
  const opponentScore = isHomeTeam ? game.awayScore : game.homeScore;

  return `${schoolScore}-${opponentScore}`;
}

function getOpponentSlug(game: Game, schoolSlug: string) {
  const isHomeTeam = game.homeSchoolSlug === schoolSlug;
  return isHomeTeam ? game.awaySchoolSlug : game.homeSchoolSlug;
}

function getOpponent(game: Game, schoolSlug: string) {
  const isHomeTeam = game.homeSchoolSlug === schoolSlug;

  return {
    name: isHomeTeam ? game.awayTeam ?? "Opponent" : game.homeTeam ?? "Opponent",
    location: game.isNeutralSite ? "Neutral" : isHomeTeam ? "Home" : "Away",
    prefix: game.isNeutralSite ? "vs" : isHomeTeam ? "vs" : "at",
  };
}

function getResultClass(result: "W" | "L" | "T" | null) {
  if (result === "W") return "border-green-400/30 bg-green-500/15 text-green-300";
  if (result === "L") return "border-red-400/30 bg-red-500/15 text-red-300";
  if (result === "T") return "border-yellow-400/30 bg-yellow-500/15 text-yellow-200";
  return "border-white/10 bg-white/10 text-white/60";
}

export default function RecentScores({ scores, theme, schoolSlug }: RecentScoresProps) {
  const visibleScores = scores.slice(0, MAX_RESULTS);

  return (
    <section
      className="rounded-[1.75rem] border bg-white/[0.045] p-5 shadow-2xl sm:p-6"
      style={{
        borderColor: `${theme.secondary}22`,
        boxShadow: `0 18px 55px ${theme.primary}14`,
      }}
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-white/45">Recent Results</p>
          <h2 className="mt-2 text-3xl font-black text-white">What just happened</h2>
          <p className="mt-2 text-sm text-white/45">Latest final scores currently on file for this program.</p>
        </div>

        <Link
          href={`/schools/${schoolSlug}/schedule`}
          className="text-xs font-black uppercase tracking-[0.16em] text-white/55 transition hover:text-white"
        >
          Full Schedule →
        </Link>
      </div>

      {visibleScores.length === 0 ? (
        <div className="rounded-3xl border bg-black/35 p-6" style={{ borderColor: `${theme.secondary}33` }}>
          <p className="text-lg font-black text-white">No final scores available yet.</p>
          <p className="mt-2 text-sm leading-6 text-white/50">Results will appear here after verified finals are added.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visibleScores.map((game, index) => {
            const result = getResult(game, schoolSlug);
            const opponentSlug = getOpponentSlug(game, schoolSlug);
            const opponentSchool = opponentSlug ? getSchoolBySlug(opponentSlug) : undefined;
            const opponent = getOpponent(game, schoolSlug);

            return (
              <Link
                key={game.id}
                href={`/games/${game.id}`}
                className="group relative overflow-hidden rounded-[1.5rem] border bg-black/35 p-5 transition hover:bg-white/[0.075]"
                style={{ borderColor: `${theme.secondary}2e` }}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-20 transition group-hover:opacity-35"
                  style={{ background: `radial-gradient(circle at top right, ${theme.primary}, transparent 58%)` }}
                />

                <div className="relative">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-3 py-1.5 text-xs font-black ${getResultClass(result)}`}>
                        {result ?? "FINAL"}
                      </span>
                      {index === 0 && (
                        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Latest</span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-white/40">{formatScoreDate(game.kickoff)}</span>
                  </div>

                  <div className="mt-5 grid grid-cols-[auto_1fr] items-center gap-4">
                    {opponentSchool ? (
                      <SchoolBadge school={opponentSchool} size="xs" />
                    ) : (
                      <FallbackBadge label={opponent.name} />
                    )}

                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
                        {opponent.location}{game.districtGame ? " · District" : ""}
                      </p>
                      <h3 className="mt-1 truncate text-lg font-black text-white">
                        {opponent.prefix} {opponent.name}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-5 flex items-end justify-between gap-4 border-t border-white/10 pt-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/30">Final</p>
                      <p className="mt-1 text-4xl font-black tracking-tight text-white">{getScoreDisplay(game, schoolSlug)}</p>
                    </div>

                    <div className="text-right">
                      {game.articleIds?.length ? <ResultBadge label="Recap" /> : null}
                      <p className="mt-3 text-xs font-black uppercase tracking-[0.12em] text-white/45 transition group-hover:text-white/75">
                        Matchup →
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {scores.length > MAX_RESULTS && (
        <p className="mt-4 text-xs text-white/35">Showing the {MAX_RESULTS} most recent finals.</p>
      )}
    </section>
  );
}

function ResultBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/65">
      {label}
    </span>
  );
}

function FallbackBadge({ label }: { label: string }) {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 p-2 text-center text-[10px] font-black uppercase text-white">
      {label.trim().slice(0, 3)}
    </div>
  );
}
