import type { Metadata } from "next";
import Link from "next/link";
import {
  getFeaturedScoreboardGame,
  getFinalScoreboardGames,
  getLiveGames,
  getUpcomingScoreboardGames,
} from "@/lib/scoreboard";
import { getSchoolBySlug } from "@/lib/schools";
import SchoolBadge from "@/components/SchoolBadge";

export const metadata: Metadata = {
  title: "Texas High School Football Scores | VarsityVue",
  description:
  "Follow Texas high school football schedules, featured matchups, game-night updates, and final results on VarsityVue.",
};

type ScoreboardGame = ReturnType<typeof getUpcomingScoreboardGames>[number];

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
    weekday: "short",
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

function getTeamName(team?: string, fallback = "Team TBD") {
  return team ?? fallback;
}

function getVenueName(venue?: string) {
  return venue ?? "Venue TBD";
}

function getWeekLabel(week?: number) {
  return week === undefined ? "Week TBD" : `Week ${week}`;
}

function getMapUrl(game: { venue?: string; homeTeam?: string }) {
  const venue = getVenueName(game.venue);
  const homeTeam = getTeamName(game.homeTeam, "");

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${venue} ${homeTeam} Texas`
  )}`;
}

export default function ScoreboardPage() {
  const featuredGame = getFeaturedScoreboardGame();
  const liveGames = getLiveGames();
  const upcomingGames = getUpcomingScoreboardGames(8);
  const finalGames = getFinalScoreboardGames(8);

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-14 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(139,16,32,0.45),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-white/70">
            VarsityVue Scoreboard
          </p>

          <h1 className="mt-4 max-w-5xl text-4xl font-black leading-tight sm:text-6xl lg:text-7xl">
            Texas High School Football Scores
          </h1>

<p className="mt-6 max-w-3xl text-lg leading-8 text-white/65">
  Featured matchups, kickoff information, game-night updates, and
  final results across VarsityVue.
</p>

          <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-black/30 p-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-white/70">
              Friday Night
            </p>

<h2 className="mt-3 text-3xl font-black text-white md:text-4xl">
  Lights on. Week 1 is here.
</h2>

<p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
  Follow featured games, kickoff information, matchup centers, and
  final results throughout the football season.
</p>
          </div>
        </section>

        {featuredGame && <FeaturedScoreboardGame game={featuredGame} />}

        <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-white/70">
                Sponsor Slot
              </p>

              <h2 className="mt-3 text-3xl font-black">
                Own Friday night traffic.
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-white/65">
                Scoreboards create repeat game-night traffic and habitual fan
                engagement, making this one of VarsityVue’s highest-visibility
                sponsor placements.
              </p>
            </div>

            <Link
              href="/sponsor-inquiry"
              className="rounded-full bg-[var(--vv-primary)] px-7 py-4 text-center font-black transition hover:bg-[var(--vv-primary-hover)]"
            >
              Sponsor Scoreboard
            </Link>
          </div>
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-3">
          <ScoreboardColumn
            title="Live Now"
            description="Game night updates as they move."
            games={liveGames}
            emptyText="No live games right now."
          />

          <ScoreboardColumn
            title="Upcoming"
            description="The next kickoffs across VarsityVue."
            games={upcomingGames}
            emptyText="No upcoming games listed."
          />

          <ScoreboardColumn
            title="Final"
            description="Latest final scores from across the region."
            games={finalGames}
            emptyText="No final scores posted yet."
          />
        </section>
      </div>
    </main>
  );
}

function FeaturedScoreboardGame({ game }: { game: ScoreboardGame }) {
  const awaySchool = game.awaySchoolSlug
    ? getSchoolBySlug(game.awaySchoolSlug)
    : undefined;

  const homeSchool = game.homeSchoolSlug
    ? getSchoolBySlug(game.homeSchoolSlug)
    : undefined;

  return (
    <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.055] p-6 shadow-2xl md:p-8">
      <p className="text-xs font-black uppercase tracking-[0.3em] text-white/70">
        Featured Matchup
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-5">
            {awaySchool ? (
              <SchoolBadge school={awaySchool} size="sm" />
            ) : (
              <FallbackBadge label={getTeamName(game.awayTeam, "Away")} />
            )}

            <div>
              <h2 className="text-3xl font-black leading-tight md:text-5xl">
                {getTeamName(game.awayTeam, "Away Team")} at{" "}
                {getTeamName(game.homeTeam, "Home Team")}
              </h2>

              <p className="mt-4 text-white/65">
                {getWeekLabel(game.week)} · {formatKickoff(game.kickoff)} ·{" "}
                {getVenueName(game.venue)}
              </p>
            </div>

            {homeSchool ? (
              <SchoolBadge school={homeSchool} size="sm" />
            ) : (
              <FallbackBadge label={getTeamName(game.homeTeam, "Home")} />
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Badge>{game.displayStatus}</Badge>
            {game.districtGame && <Badge>District Game</Badge>}
            {game.specialEvent && <Badge>{game.specialEvent}</Badge>}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href={`/games/${game.id}`}
            className="rounded-full bg-white px-7 py-4 text-center font-black text-black transition hover:bg-white/85"
          >
            Matchup Center →
          </Link>

          <a
            href={getMapUrl(game)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/15 bg-white/10 px-7 py-4 text-center font-black text-white transition hover:bg-white/15"
          >
            Open Venue Map →
          </a>
        </div>
      </div>
    </section>
  );
}

function ScoreboardColumn({
  title,
  description,
  games,
  emptyText,
}: {
  title: string;
  description: string;
  games: ScoreboardGame[];
  emptyText: string;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-3xl font-black">{title}</h2>
      <p className="mt-2 text-sm text-white/50">{description}</p>

      <div className="mt-6 space-y-4">
        {games.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/50">
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

  return (
    <div
      className={`rounded-2xl bg-black/35 p-4 transition hover:bg-white/10 ${
        game.status === "live"
          ? "border border-white/30 shadow-[0_0_28px_rgba(255,255,255,0.12)]"
          : "border border-white/10"
      }`}
    >
      <Link href={`/games/${game.id}`} className="block">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
          {awaySchool ? (
            <SchoolBadge school={awaySchool} size="xs" />
          ) : (
            <FallbackBadge label={getTeamName(game.awayTeam, "Away")} />
          )}

          <div>
            <p className="font-black">{getTeamName(game.awayTeam, "Away")}</p>
            <p className="mt-1 font-black">
              {getTeamName(game.homeTeam, "Home")}
            </p>
          </div>

          {game.status === "final" ? (
            <div className="text-right font-black">
              <p>{game.awayScore ?? "-"}</p>
              <p className="mt-1">{game.homeScore ?? "-"}</p>
            </div>
          ) : homeSchool ? (
            <SchoolBadge school={homeSchool} size="xs" />
          ) : (
            <FallbackBadge label={getTeamName(game.homeTeam, "Home")} />
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white/60">
            {game.displayStatus}
          </span>

          {game.districtGame && (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white/60">
              District
            </span>
          )}
        </div>

        <p className="mt-4 text-xs text-white/45">
          {getWeekLabel(game.week)} · {formatKickoff(game.kickoff)}
        </p>

        <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-white/65 transition hover:text-white">
          Matchup Center →
        </p>
      </Link>

      <a
        href={getMapUrl(game)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-xs font-black uppercase tracking-[0.14em] text-white/60 transition hover:bg-white/10 hover:text-white"
      >
        Venue Map →
      </a>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm font-bold text-white/75">
      {children}
    </span>
  );
}

function FallbackBadge({ label }: { label: string }) {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 p-2 text-center text-[10px] font-black uppercase text-white">
      {label.slice(0, 3)}
    </div>
  );
}