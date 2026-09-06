import Link from "next/link";

import { getGamesForSchool, getNextGameForSchool } from "@/lib/games";
import { getSchoolBySlug } from "@/lib/schools";
import { getStandingForSchool } from "@/lib/standings";
import type { SchoolTheme } from "@/types/school-theme";
import SchoolBadge from "./SchoolBadge";

const CENTRAL_TIME_ZONE = "America/Chicago";

function parseGameDate(kickoff?: string) {
  if (!kickoff) return null;
  if (!kickoff.includes("T")) {
    const [year, month, day] = kickoff.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 12));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(kickoff);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(kickoff?: string) {
  const date = parseGameDate(kickoff);
  if (!date) return "Date TBD";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: kickoff?.includes("T") ? CENTRAL_TIME_ZONE : "UTC",
  }).format(date);
}

function formatTime(kickoff?: string) {
  if (!kickoff?.includes("T")) return "Time TBD";
  const date = parseGameDate(kickoff);
  if (!date) return "Time TBD";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: CENTRAL_TIME_ZONE,
  }).format(date);
}

function getTeamScore(game: ReturnType<typeof getGamesForSchool>[number], schoolSlug: string) {
  const isHome = game.homeSchoolSlug === schoolSlug;
  return {
    team: isHome ? game.homeScore : game.awayScore,
    opponent: isHome ? game.awayScore : game.homeScore,
  };
}

function getOpponent(game: ReturnType<typeof getGamesForSchool>[number], schoolSlug: string) {
  const isHome = game.homeSchoolSlug === schoolSlug;
  return {
    slug: isHome ? game.awaySchoolSlug : game.homeSchoolSlug,
    name: isHome ? game.awayTeam ?? "Opponent" : game.homeTeam ?? "Opponent",
    location: game.isNeutralSite ? "Neutral" : isHome ? "Home" : "Away",
  };
}

export default function SchoolSeasonPulse({
  schoolSlug,
  theme,
}: {
  schoolSlug: string;
  theme: SchoolTheme;
}) {
  const games = getGamesForSchool(schoolSlug);
  const finals = games.filter(
    (game) =>
      game.status === "final" &&
      game.gameType !== "bye" &&
      game.gameType !== "scrimmage" &&
      game.homeScore !== undefined &&
      game.awayScore !== undefined
  );
  const nextGame = getNextGameForSchool(schoolSlug);
  const verifiedStanding = getStandingForSchool(schoolSlug);

  let calculatedWins = 0;
  let calculatedLosses = 0;
  let pointsFor = 0;
  let pointsAgainst = 0;

  const recentResults = finals
    .map((game) => {
      const score = getTeamScore(game, schoolSlug);
      if (score.team === undefined || score.opponent === undefined) return null;
      pointsFor += score.team;
      pointsAgainst += score.opponent;
      if (score.team > score.opponent) calculatedWins += 1;
      if (score.team < score.opponent) calculatedLosses += 1;
      return score.team > score.opponent ? "W" : score.team < score.opponent ? "L" : "T";
    })
    .filter((result): result is "W" | "L" | "T" => Boolean(result));

  const wins = verifiedStanding?.overallWins ?? calculatedWins;
  const losses = verifiedStanding?.overallLosses ?? calculatedLosses;
  const hasScoringData = finals.length > 0;

  const nextOpponent = nextGame ? getOpponent(nextGame, schoolSlug) : null;
  const nextOpponentSchool = nextOpponent?.slug ? getSchoolBySlug(nextOpponent.slug) : undefined;

  return (
    <section className="grid gap-3 sm:gap-4 lg:grid-cols-[0.95fr_1.35fr]">
      <div
        className="overflow-hidden rounded-[1.5rem] border p-4 shadow-2xl sm:rounded-[1.75rem] sm:p-6"
        style={{
          borderColor: `${theme.primary}55`,
          background: `linear-gradient(145deg, ${theme.primary}24, rgba(255,255,255,0.035) 42%, rgba(0,0,0,0.98) 78%)`,
          boxShadow: `inset 4px 0 0 ${theme.primary}, 0 18px 50px rgba(0,0,0,0.4)`,
        }}
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/45 sm:text-[10px] sm:tracking-[0.24em]">Season Overview</p>
            <p className="mt-1.5 text-4xl font-black tracking-tight text-white sm:mt-3 sm:text-5xl">{wins}-{losses}</p>
          </div>
          {recentResults.length > 0 && (
            <div className="text-right">
              <p className="text-[8px] font-black uppercase tracking-[0.14em] text-white/30 sm:text-[10px] sm:tracking-[0.18em]">Last 5</p>
              <div className="mt-1.5 flex justify-end gap-1.5 sm:mt-3 sm:gap-2">
                {recentResults.slice(-5).map((result, index) => (
                  <span
                    key={`${result}-${index}`}
                    className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-black sm:h-8 sm:w-8 sm:text-xs ${
                      result === "W"
                        ? "border-green-400/30 bg-green-500/15 text-green-300"
                        : result === "L"
                          ? "border-red-400/30 bg-red-500/15 text-red-300"
                          : "border-yellow-400/30 bg-yellow-500/15 text-yellow-200"
                    }`}
                  >
                    {result}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-5">
          <PulseStat label="PF" value={hasScoringData ? pointsFor.toString() : "—"} />
          <PulseStat label="PA" value={hasScoringData ? pointsAgainst.toString() : "—"} />
          <PulseStat
            label="Diff"
            value={
              hasScoringData
                ? `${pointsFor - pointsAgainst > 0 ? "+" : ""}${pointsFor - pointsAgainst}`
                : "—"
            }
          />
        </div>
      </div>

      <div
        className="relative overflow-hidden rounded-[1.5rem] border p-4 shadow-2xl sm:rounded-[1.75rem] sm:p-6"
        style={{
          borderColor: `${theme.secondary}33`,
          background: "linear-gradient(135deg, rgba(255,255,255,0.055), rgba(0,0,0,0.96) 62%)",
          boxShadow: `0 18px 50px ${theme.primary}18`,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{ background: `radial-gradient(circle at top right, ${theme.primary}, transparent 55%)` }}
        />
        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/45 sm:text-[10px] sm:tracking-[0.24em]">Next Game</p>
            {nextGame?.districtGame && (
              <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/60 sm:px-3 sm:py-1.5 sm:text-[10px] sm:tracking-[0.14em]">District</span>
            )}
          </div>

          {nextGame && nextOpponent ? (
            <>
              <div className="mt-3 flex items-center gap-3 sm:mt-5 sm:gap-4">
                {nextOpponentSchool ? <SchoolBadge school={nextOpponentSchool} size="xs" /> : null}
                <div className="min-w-0 flex-1">
                  <h2 className="break-words text-xl font-black leading-tight text-white sm:text-2xl">{nextOpponent.name}</h2>
                  <p className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-white/35 sm:text-[10px] sm:tracking-[0.16em]">{nextOpponent.location} · Week {nextGame.week ?? "TBD"}</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-5">
                <InfoStat label="Date" value={formatDate(nextGame.kickoff)} />
                <InfoStat label="Kickoff" value={formatTime(nextGame.kickoff)} />
              </div>

              <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 sm:mt-3 sm:rounded-2xl sm:px-4 sm:py-3">
                <span className="text-[8px] font-black uppercase tracking-[0.14em] text-white/25 sm:text-[9px]">Venue</span>
                <span className="min-w-0 break-words text-[11px] font-black text-white/60 sm:text-xs">{nextGame.venue ?? "TBD"}</span>
              </div>

              <div className="mt-3 flex gap-2 sm:mt-5">
                <Link
                  href={`/games/${nextGame.id}`}
                  className="rounded-full px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] transition hover:opacity-90 sm:text-xs sm:tracking-[0.12em]"
                  style={{ backgroundColor: theme.secondary, color: theme.primary }}
                >
                  Game Center →
                </Link>
                <Link
                  href={`/schools/${schoolSlug}/schedule`}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] text-white/60 transition hover:bg-white/10 hover:text-white sm:text-xs sm:tracking-[0.12em]"
                >
                  Schedule
                </Link>
              </div>
            </>
          ) : (
            <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-white/45 sm:mt-5 sm:rounded-2xl sm:p-5 sm:text-sm">
              No upcoming game is currently listed.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function PulseStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-2.5 sm:rounded-2xl sm:p-3">
      <p className="text-base font-black text-white sm:text-lg">{value}</p>
      <p className="mt-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-white/30 sm:mt-1 sm:text-[9px] sm:tracking-[0.16em]">{label}</p>
    </div>
  );
}

function InfoStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-2.5 sm:rounded-2xl sm:p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-white/30 sm:text-[9px] sm:tracking-[0.16em]">{label}</p>
      <p className="mt-1 break-words text-xs font-black leading-4 text-white/75 sm:text-sm">{value}</p>
    </div>
  );
}
