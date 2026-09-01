import type { Metadata } from "next";
import Link from "next/link";
import {
  getFinalScoreboardGames,
  getGameOfTheWeek,
  getLiveGames,
  getUpcomingScoreboardGames,
} from "@/lib/scoreboard";
import { getSchoolBySlug } from "@/lib/schools";
import { getStandingForSchool } from "@/lib/standings";
import SchoolBadge from "@/components/SchoolBadge";

export const metadata: Metadata = {
  title: "Texas High School Football Scores | VarsityVue",
  description:
    "Follow verified Texas high school football final scores, featured matchups, and upcoming games across the VarsityVue coverage area.",
};

type ScoreboardGame = ReturnType<typeof getUpcomingScoreboardGames>[number];

function parseGameDate(kickoff?: string) {
  if (!kickoff) return null;
  if (!kickoff.includes("T")) {
    const [year, month, day] = kickoff.split("-").map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day, 12));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const parsedDate = new Date(kickoff);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function formatKickoff(kickoff?: string) {
  const parsedDate = parseGameDate(kickoff);
  if (!parsedDate) return "TBD";
  const hasTime = kickoff?.includes("T");
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(hasTime ? { hour: "numeric" as const, minute: "2-digit" as const } : {}),
    timeZone: "America/Chicago",
  }).format(parsedDate);
}

function getTeamName(team?: string, fallback = "Team TBD") {
  return team ?? fallback;
}

function getWeekLabel(week?: number) {
  return week === undefined ? "Week TBD" : `Week ${week}`;
}

function getMapUrl(game: { venue?: string; homeTeam?: string }) {
  if (!game.venue) return null;
  const homeTeam = getTeamName(game.homeTeam, "");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${game.venue} ${homeTeam} Texas`
  )}`;
}

export default function ScoreboardPage() {
  const featuredGame = getGameOfTheWeek();
  const liveGames = getLiveGames();
  const upcomingGames = getUpcomingScoreboardGames(8);
  const finalGames = getFinalScoreboardGames(12);

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(139,16,32,0.24),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 md:p-7">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-white/65">
            VarsityVue Scoreboard · 2026 Football
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="max-w-4xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                Texas High School Football Scores
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-white/60">
                Verified final scores, featured matchups, and upcoming kickoffs from programs currently tracked by VarsityVue.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 px-5 py-4 lg:max-w-sm">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Latest Results</p>
              <p className="mt-1 text-lg font-black text-white">Verified finals stay easy to find.</p>
              <p className="mt-1 text-sm leading-5 text-white/50">The scoreboard updates as new results and schedule information are added.</p>
            </div>
          </div>
        </section>

        {featuredGame && <FeaturedScoreboardGame game={featuredGame} />}

        <section className="mt-8 grid items-start gap-6 lg:grid-cols-3">
          <ScoreboardColumn
            title="Live Now"
            description="Games currently marked in progress."
            games={liveGames}
            emptyText="No games are currently marked live."
            collapsibleWhenEmpty
          />
          <ScoreboardColumn
            title="Upcoming"
            description="The next scheduled kickoffs currently on file."
            games={upcomingGames}
            emptyText="No upcoming games listed."
          />
          <ScoreboardColumn
            title="Final Scores"
            description="Latest verified results from across the coverage area."
            games={finalGames}
            emptyText="No final scores posted yet."
          />
        </section>
      </div>
    </main>
  );
}

function FeaturedScoreboardGame({ game }: { game: ScoreboardGame }) {
  const awayStanding = game.awaySchoolSlug ? getStandingForSchool(game.awaySchoolSlug) : undefined;
  const homeStanding = game.homeSchoolSlug ? getStandingForSchool(game.homeSchoolSlug) : undefined;
  const awayScore = game.awayScore ?? game.score?.away;
  const homeScore = game.homeScore ?? game.score?.home;
  const isFinal = game.status === "final";
  const mapUrl = getMapUrl(game);
  const featuredLabel = game.featured === true ? "Game of the Week" : "Featured Matchup";

  return (
    <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.045] p-6 shadow-2xl md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-white/55">{featuredLabel}</p>
          <p className="mt-2 text-sm font-bold text-white/45">
            {getWeekLabel(game.week)} · {formatKickoff(game.kickoff)}{game.venue ? ` · ${game.venue}` : ""}
          </p>
        </div>
        <span className="rounded-full border border-white/15 bg-black/40 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/75">
          {game.displayStatus}
        </span>
      </div>

      <div className="mt-8 grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
        <TeamResult
          team={getTeamName(game.awayTeam, "Away Team")}
          standing={awayStanding}
        />

        <div className="text-center">
          {isFinal && awayScore !== undefined && homeScore !== undefined ? (
            <>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/40">Final</p>
              <p className="mt-2 text-5xl font-black tracking-tight text-white md:text-6xl">
                {awayScore}<span className="mx-3 text-white/25">—</span>{homeScore}
              </p>
            </>
          ) : (
            <p className="text-2xl font-black uppercase tracking-[0.3em] text-white/45">VS</p>
          )}
        </div>

        <TeamResult
          team={getTeamName(game.homeTeam, "Home Team")}
          standing={homeStanding}
        />
      </div>

      <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-center">
        <Link href={`/games/${game.id}`} className="rounded-full bg-white px-7 py-4 text-center font-black text-black transition hover:bg-white/85">
          {isFinal ? "View Final Result →" : "Matchup Center →"}
        </Link>
        {mapUrl && (
          <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/15 bg-white/5 px-7 py-4 text-center font-black text-white/75 transition hover:bg-white/10 hover:text-white">
            Venue Map →
          </a>
        )}
      </div>
    </section>
  );
}

function TeamResult({ team, standing }: {
  team: string;
  standing?: ReturnType<typeof getStandingForSchool>;
}) {
  const hasOverallResult =
    !!standing && (standing.overallWins > 0 || standing.overallLosses > 0);
  const districtRecord =
    standing && standing.districtWins + standing.districtLosses > 0
      ? ` · ${standing.districtWins}-${standing.districtLosses} District`
      : "";

  return (
    <div className="min-w-0 text-center">
      <h2 className="text-3xl font-black leading-none text-white md:text-4xl">{team}</h2>
      <p className="mt-2 text-sm font-black uppercase tracking-[0.16em] text-white/40">
        {hasOverallResult
          ? `${standing!.overallWins}-${standing!.overallLosses} Overall${districtRecord}`
          : "Overall —"}
      </p>
    </div>
  );
}

function ScoreboardColumn({ title, description, games, emptyText, collapsibleWhenEmpty = false }: {
  title: string;
  description: string;
  games: ScoreboardGame[];
  emptyText: string;
  collapsibleWhenEmpty?: boolean;
}) {
  if (collapsibleWhenEmpty && games.length === 0) {
    return (
      <details className="group rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black">{title}</h2>
              <p className="mt-2 text-sm text-white/50">{description}</p>
            </div>
            <span className="mt-1 text-sm font-black text-white/45 transition group-open:rotate-180">⌄</span>
          </div>
        </summary>
        <p className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/50">{emptyText}</p>
      </details>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <h2 className="text-3xl font-black">{title}</h2>
      <p className="mt-2 text-sm text-white/50">{description}</p>
      <div className="mt-6 space-y-4">
        {games.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/50">{emptyText}</p>
        ) : (
          games.map((game) => <ScoreboardGameCard key={game.id} game={game} />)
        )}
      </div>
    </section>
  );
}

function ScoreboardGameCard({ game }: { game: ScoreboardGame }) {
  const awaySchool = game.awaySchoolSlug ? getSchoolBySlug(game.awaySchoolSlug) : undefined;
  const homeSchool = game.homeSchoolSlug ? getSchoolBySlug(game.homeSchoolSlug) : undefined;
  const awayScore = game.awayScore ?? game.score?.away;
  const homeScore = game.homeScore ?? game.score?.home;
  const isFinal = game.status === "final";

  return (
    <Link href={`/games/${game.id}`} className={`block rounded-2xl p-4 transition hover:bg-white/10 ${game.status === "live" ? "border border-white/30 bg-black/45 shadow-[0_0_28px_rgba(255,255,255,0.10)]" : "border border-white/10 bg-black/35"}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/55">{game.displayStatus}</span>
        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">{getWeekLabel(game.week)}</span>
      </div>
      <div className="mt-5 space-y-4">
        <CompactTeamRow school={awaySchool} team={getTeamName(game.awayTeam, "Away")} score={isFinal ? awayScore : undefined} />
        <CompactTeamRow school={homeSchool} team={getTeamName(game.homeTeam, "Home")} score={isFinal ? homeScore : undefined} />
      </div>
      <div className="mt-5 border-t border-white/10 pt-4">
        <p className="text-xs font-semibold text-white/45">{formatKickoff(game.kickoff)}</p>
        <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/60">{isFinal ? "View Final →" : "View Matchup →"}</p>
      </div>
    </Link>
  );
}

function CompactTeamRow({ school, team, score }: {
  school?: ReturnType<typeof getSchoolBySlug>;
  team: string;
  score?: number;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
      {school ? <SchoolBadge school={school} size="xs" /> : <FallbackBadge label={team} />}
      <p className="min-w-0 truncate font-black text-white">{team}</p>
      {score !== undefined && <p className="text-2xl font-black leading-none text-white">{score}</p>}
    </div>
  );
}

function FallbackBadge({ label }: { label: string }) {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 p-2 text-center text-[10px] font-black uppercase text-white">
      {label.slice(0, 3)}
    </div>
  );
}
