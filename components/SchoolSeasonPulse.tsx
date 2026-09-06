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
    <section className="grid gap-4 lg:grid-cols-[0.95fr_1.35fr]">
      <div
        className="overflow-hidden rounded-[1.75rem] border p-5 shadow-2xl sm:p-6"
        style={{
          borderColor: `${theme.primary}55`,
          background: `linear-gradient(145deg, ${theme.primary}24, rgba(255,255,255,0.035) 42%, rgba(0,0,0,0.98) 78%)`,
          boxShadow: `inset 4px 0 0 ${theme.primary}, 0 18px 50px rgba(0,0,0,0.4)`,
        }}
      >
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45">Season Overview</p>
        <div className="mt-3">
          <p className="text-5xl font-black tracking-tight text-white">{wins}-{losses}</p>
          <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-white/35">2026 Record</p>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
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

        {recentResults.length > 0 && (
          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Last 5</p>
            <div className="mt-3 flex gap-2">
              {recentResults.slice(-5).map((result, index) => (
                <span
                  key={`${result}-${index}`}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-black ${
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

      <div
        className="relative overflow-hidden rounded-[1.75rem] border p-5 shadow-2xl sm:p-6"
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
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45">This Week</p>
              <h2 className="mt-2 text-2xl font-black text-white">Next matchup</h2>
            </div>
            {nextGame?.districtGame && (
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/65">District</span>
            )}
          </div>

          {nextGame && nextOpponent ? (
            <>
              <div className="mt-5 flex items-center gap-4">
                {nextOpponentSchool ? <SchoolBadge school={nextOpponentSchool} size="xs" /> : null}
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">{nextOpponent.location} · Week {nextGame.week ?? "TBD"}</p>
                  <h3 className="mt-1 truncate text-2xl font-black text-white">{nextOpponent.name}</h3>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <InfoStat label="Date" value={formatDate(nextGame.kickoff)} />
                <InfoStat label="Kickoff" value={formatTime(nextGame.kickoff)} />
                <InfoStat label="Venue" value={nextGame.venue ?? "TBD"} className="col-span-2 sm:col-span-1" />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={`/games/${nextGame.id}`}
                  className="rounded-full px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] transition hover:opacity-90"
                  style={{ backgroundColor: theme.secondary, color: theme.primary }}
                >
                  Open Game Center →
                </Link>
                <Link
                  href={`/schools/${schoolSlug}/schedule`}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-white/65 transition hover:bg-white/10 hover:text-white"
                >
                  Full Schedule
                </Link>
              </div>
            </>
          ) : (
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-5 text-sm text-white/50">
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
    <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
      <p className="text-lg font-black text-white">{value}</p>
      <p className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/30">{label}</p>
    </div>
  );
}

function InfoStat({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-black/30 p-3 ${className}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/30">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-white/80">{value}</p>
    </div>
  );
}
