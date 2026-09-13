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
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Texas High School Football Scores",
  description:
    "Verified Texas high school football final scores, live games, featured matchups, and upcoming kickoffs from programs tracked by VarsityVue.",
  alternates: { canonical: "/scoreboard" },
  openGraph: {
    title: "Texas High School Football Scores | VarsityVue",
    description:
      "Verified Texas high school football final scores, live games, featured matchups, and upcoming kickoffs from programs tracked by VarsityVue.",
    url: "/scoreboard",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Texas High School Football Scores | VarsityVue",
    description:
      "Verified Texas high school football final scores, live games, featured matchups, and upcoming kickoffs from programs tracked by VarsityVue.",
  },
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

function getMapUrl(game: { venue?: string; venueAddress?: string; homeTeam?: string }) {
  if (game.venueAddress) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(game.venueAddress)}`;
  }
  if (!game.venue) return null;
  const homeTeam = getTeamName(game.homeTeam, "");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${game.venue} ${homeTeam} Texas`)}`;
}

export default function ScoreboardPage() {
  const featuredGame = getGameOfTheWeek();
  const liveGames = getLiveGames();
  const upcomingGames = getUpcomingScoreboardGames(8);
  const finalGames = getFinalScoreboardGames(12);

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] text-white">
      <PageHero
        eyebrow="VarsityVue Scoreboard · 2026 Football"
        title="Texas High School Football Scores"
        description="Verified final scores, featured matchups, and upcoming kickoffs from programs currently tracked by VarsityVue."
        aside={
          <div className="rounded-2xl border border-white/10 bg-black/25 px-5 py-4 lg:max-w-sm">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
              Latest Results
            </p>
            <p className="mt-1 text-lg font-black text-white">
              Verified finals stay easy to find.
            </p>
            <p className="mt-1 text-sm leading-5 text-white/50">
              The scoreboard updates as new results and schedule information are added.
            </p>
          </div>
        }
      />

      <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        {featuredGame && <FeaturedScoreboardGame game={featuredGame} />}

        <section className="mt-5 grid items-start gap-3 sm:mt-8 sm:gap-6 lg:grid-cols-3">
          <ScoreboardColumn
            id="live-now"
            title="Live Now"
            description="Games currently marked in progress."
            games={liveGames}
            emptyText="No games are currently marked live."
            collapsibleWhenEmpty
          />
          <ScoreboardColumn
            id="final-scores"
            title="Final Scores"
            description="Latest verified results from across the coverage area."
            games={finalGames}
            emptyText="No final scores posted yet."
          />
          <ScoreboardColumn
            id="upcoming"
            title="Upcoming"
            description="The next scheduled kickoffs currently on file."
            games={upcomingGames}
            emptyText="No upcoming games listed."
          />
        </section>
      </div>
    </main>
  );
}

function FeaturedScoreboardGame({ game }: { game: ScoreboardGame }) {
  const awayStanding = game.awaySchoolSlug
    ? getStandingForSchool(game.awaySchoolSlug)
    : undefined;
  const homeStanding = game.homeSchoolSlug
    ? getStandingForSchool(game.homeSchoolSlug)
    : undefined;
  const awayScore = game.awayScore ?? game.score?.away;
  const homeScore = game.homeScore ?? game.score?.home;
  const isFinal = game.status === "final";
  const mapUrl = getMapUrl(game);
  const isGameOfTheWeek = game.specialEvent?.toLowerCase() === "game of the week";

  return (
    <section className="rounded-[1.4rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl sm:rounded-3xl sm:p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-2 sm:items-center sm:gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/55 sm:text-xs sm:tracking-[0.3em]">
            {isGameOfTheWeek ? "Game of the Week" : "Featured Matchup"}
          </p>
          <p className="mt-1 text-[11px] font-bold leading-4 text-white/45 sm:mt-2 sm:text-sm">
            {getWeekLabel(game.week)} · {formatKickoff(game.kickoff)}
            {game.venue ? ` · ${game.venue}` : ""}
          </p>
        </div>
        <span className="rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white/75 sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.18em]">
          {game.displayStatus}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:mt-8 sm:gap-6">
        <TeamResult
          team={getTeamName(game.awayTeam, "Away Team")}
          standing={awayStanding}
        />

        <div className="text-center">
          {isFinal && awayScore !== undefined && homeScore !== undefined ? (
            <>
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40 sm:text-[10px] sm:tracking-[0.28em]">
                Final
              </p>
              <p className="mt-1 text-3xl font-black tracking-tight text-white sm:mt-2 sm:text-5xl md:text-6xl">
                {awayScore}
                <span className="mx-1.5 text-white/25 sm:mx-3">—</span>
                {homeScore}
              </p>
            </>
          ) : (
            <p className="text-sm font-black uppercase tracking-[0.2em] text-white/45 sm:text-2xl sm:tracking-[0.3em]">
              VS
            </p>
          )}
        </div>

        <TeamResult
          team={getTeamName(game.homeTeam, "Home Team")}
          standing={homeStanding}
        />
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2 border-t border-white/10 pt-4 sm:mt-8 sm:gap-3 sm:pt-6">
        <Link
          href={`/games/${game.id}`}
          className="rounded-full bg-white px-4 py-2 text-center text-[10px] font-black uppercase tracking-[0.1em] text-black transition hover:bg-white/85 sm:px-7 sm:py-4 sm:text-base sm:normal-case sm:tracking-normal"
        >
          {isFinal ? "View Final Result →" : "Matchup Center →"}
        </Link>
        {mapUrl && (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-center text-[10px] font-black uppercase tracking-[0.1em] text-white/75 transition hover:bg-white/10 hover:text-white sm:px-7 sm:py-4 sm:text-base sm:normal-case sm:tracking-normal"
          >
            Venue Map →
          </a>
        )}
      </div>
    </section>
  );
}

function TeamResult({
  team,
  standing,
}: {
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
      <h2 className="break-words text-base font-black leading-[1.05] text-white sm:text-3xl md:text-4xl">
        {team}
      </h2>
      <p className="mt-1 text-[8px] font-black uppercase tracking-[0.08em] text-white/40 sm:mt-2 sm:text-sm sm:tracking-[0.16em]">
        {hasOverallResult
          ? `${standing!.overallWins}-${standing!.overallLosses} Overall${districtRecord}`
          : "Overall —"}
      </p>
    </div>
  );
}

function ScoreboardColumn({
  id,
  title,
  description,
  games,
  emptyText,
  collapsibleWhenEmpty = false,
}: {
  id: string;
  title: string;
  description: string;
  games: ScoreboardGame[];
  emptyText: string;
  collapsibleWhenEmpty?: boolean;
}) {
  if (collapsibleWhenEmpty && games.length === 0) {
    return (
      <details
        id={id}
        className="group scroll-mt-24 rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-3.5 sm:rounded-3xl sm:p-5"
      >
        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div>
              <h2 className="text-2xl font-black sm:text-3xl">{title}</h2>
              <p className="mt-1 text-xs text-white/50 sm:mt-2 sm:text-sm">
                {description}
              </p>
            </div>
            <span className="mt-1 text-sm font-black text-white/45 transition group-open:rotate-180">
              ⌄
            </span>
          </div>
        </summary>
        <p className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/50 sm:mt-6 sm:rounded-2xl sm:p-4 sm:text-sm">
          {emptyText}
        </p>
      </details>
    );
  }

  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-3.5 sm:rounded-3xl sm:p-5"
    >
      <h2 className="text-2xl font-black sm:text-3xl">{title}</h2>
      <p className="mt-1 text-xs text-white/50 sm:mt-2 sm:text-sm">{description}</p>

      <div className="mt-4 space-y-2.5 sm:mt-6 sm:space-y-4">
        {games.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/50 sm:rounded-2xl sm:p-4 sm:text-sm">
            {emptyText}
          </p>
        ) : (
          games.map((game) => <ScoreboardGameCard key={game.id} game={game} />)
        )}
      </div>
    </section>
  );
}

function ScoreboardGameCard({ game }: { game: ScoreboardGame }) {
  const awaySchool = game.awaySchoolSlug
    ? getSchoolBySlug(game.awaySchoolSlug)
    : undefined;
  const homeSchool = game.homeSchoolSlug
    ? getSchoolBySlug(game.homeSchoolSlug)
    : undefined;
  const awayScore = game.awayScore ?? game.score?.away;
  const homeScore = game.homeScore ?? game.score?.home;
  const isFinal = game.status === "final";

  return (
    <Link
      href={`/games/${game.id}`}
      className={`block rounded-xl p-3 transition hover:bg-white/10 sm:rounded-2xl sm:p-4 ${
        game.status === "live"
          ? "border border-white/30 bg-black/45 shadow-[0_0_28px_rgba(255,255,255,0.10)]"
          : "border border-white/10 bg-black/35"
      }`}
    >
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-white/55 sm:px-3 sm:py-1 sm:text-[10px] sm:tracking-[0.16em]">
          {game.displayStatus}
        </span>
        <span className="text-[9px] font-black uppercase tracking-[0.12em] text-white/35 sm:text-[10px] sm:tracking-[0.16em]">
          {getWeekLabel(game.week)}
        </span>
      </div>

      <div className="mt-3 space-y-2.5 sm:mt-5 sm:space-y-4">
        <CompactTeamRow
          school={awaySchool}
          team={getTeamName(game.awayTeam, "Away")}
          score={isFinal ? awayScore : undefined}
        />
        <CompactTeamRow
          school={homeSchool}
          team={getTeamName(game.homeTeam, "Home")}
          score={isFinal ? homeScore : undefined}
        />
      </div>

      <div className="mt-3 border-t border-white/10 pt-3 sm:mt-5 sm:pt-4">
        <p className="text-[11px] font-semibold text-white/45 sm:text-xs">
          {formatKickoff(game.kickoff)}
        </p>
        <p className="mt-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white/60 sm:mt-2 sm:text-[10px] sm:tracking-[0.16em]">
          {isFinal ? "View Final →" : "View Matchup →"}
        </p>
      </div>
    </Link>
  );
}

function CompactTeamRow({
  school,
  team,
  score,
}: {
  school?: ReturnType<typeof getSchoolBySlug>;
  team: string;
  score?: number;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2.5 sm:gap-3">
      {school ? <SchoolBadge school={school} size="xs" /> : <FallbackBadge label={team} />}
      <p className="min-w-0 truncate text-sm font-black text-white sm:text-base">
        {team}
      </p>
      {score !== undefined && (
        <p className="text-xl font-black leading-none text-white sm:text-2xl">{score}</p>
      )}
    </div>
  );
}

function FallbackBadge({ label }: { label: string }) {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/10 p-1.5 text-center text-[9px] font-black uppercase text-white sm:h-14 sm:w-14 sm:rounded-2xl sm:p-2 sm:text-[10px]">
      {label.slice(0, 3)}
    </div>
  );
}
