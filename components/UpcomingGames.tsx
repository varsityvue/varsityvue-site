import Link from "next/link";
import type { Game } from "@/types/platform";
import type { SchoolTheme } from "../types/school-theme";
import { getSchoolBySlug } from "@/lib/schools";
import SchoolBadge from "./SchoolBadge";

type UpcomingGamesProps = {
  games: Game[];
  theme: SchoolTheme;
  schoolSlug: string;
};

function parseGameDate(kickoff?: string) {
  if (!kickoff) return null;

  if (!kickoff.includes("T")) {
    const [year, month, day] = kickoff.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const parsedDate = new Date(kickoff);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function formatGameDate(kickoff?: string) {
  const parsedDate = parseGameDate(kickoff);
  if (!parsedDate) return "TBD";

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Chicago",
  }).format(parsedDate);
}

function formatGameTime(kickoff?: string) {
  if (!kickoff || !kickoff.includes("T")) return "Time TBD";

  const parsedDate = parseGameDate(kickoff);
  if (!parsedDate) return "Time TBD";

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  }).format(parsedDate);
}

function getGameLabel(game: Game) {
  if (game.gameType === "playoff") return "Playoff";
  if (game.gameType === "scrimmage") return "Scrimmage";
  if (game.gameType === "bye") return "BYE";
  return game.week === undefined ? "Week TBD" : `Week ${game.week}`;
}

function getTeamName(team?: string, fallback = "Team TBD") {
  return team ?? fallback;
}

function getVenueName(venue?: string) {
  return venue ?? "Venue TBD";
}

export default function UpcomingGames({
  games,
  theme,
  schoolSlug,
}: UpcomingGamesProps) {
  const visibleGames = games.filter((game) => game.gameType !== "bye").slice(1, 5);

  const featuredGame = visibleGames[0];
  const remainingGames = visibleGames.slice(1, 4);

  return (
    <section
      className="rounded-[1.75rem] border bg-white/[0.045] p-5 shadow-2xl sm:p-6"
      style={{
        borderColor: `${theme.secondary}22`,
        boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
      }}
    >
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">
            Schedule Snapshot
          </p>

          <h2 className="mt-2 text-3xl font-black text-white">Upcoming Games</h2>
        </div>

        <Link
          href={`/schools/${schoolSlug}/schedule`}
          className="hidden rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:brightness-110 sm:inline-flex"
          style={{
            borderColor: `${theme.secondary}33`,
            backgroundColor: "rgba(255,255,255,0.08)",
          }}
        >
          Full Schedule →
        </Link>
      </div>

      {visibleGames.length === 0 ? (
        <div
          className="rounded-3xl border bg-black/35 p-6"
          style={{ borderColor: `${theme.secondary}33` }}
        >
          <p className="text-lg font-black text-white">2026 schedule coming soon.</p>
          <p className="mt-2 text-sm leading-6 text-white/50">
            Upcoming matchups will appear here once this school’s schedule is
            added to VarsityVue.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          {featuredGame && <FeaturedGameCard game={featuredGame} theme={theme} />}

          <div className="grid gap-3">
            {remainingGames.map((game) => (
              <CompactGameCard key={game.id} game={game} theme={theme} />
            ))}

            <Link
              href={`/schools/${schoolSlug}/schedule`}
              className="rounded-2xl border p-4 text-center text-sm font-black uppercase tracking-[0.16em] text-white transition hover:brightness-110 sm:hidden"
              style={{
                borderColor: `${theme.secondary}33`,
                backgroundColor: "rgba(255,255,255,0.08)",
              }}
            >
              View full schedule →
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

function FeaturedGameCard({ game, theme }: { game: Game; theme: SchoolTheme }) {
  const awaySchool = game.awaySchoolSlug
    ? getSchoolBySlug(game.awaySchoolSlug)
    : undefined;

  const homeSchool = game.homeSchoolSlug
    ? getSchoolBySlug(game.homeSchoolSlug)
    : undefined;

  return (
    <Link
      href={`/games/${game.id}`}
      className="group relative overflow-hidden rounded-[1.5rem] border bg-black/45 p-6 transition hover:-translate-y-1 hover:bg-white/[0.06]"
      style={{
        borderColor: `${theme.secondary}33`,
        boxShadow: `0 18px 50px ${theme.primary}22`,
      }}
    >
      <div
        className="absolute inset-0 transition group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.055), transparent 58%)",
        }}
      />

      <div
        className="absolute inset-y-0 left-0 w-1.5"
        style={{
          backgroundColor: theme.primary,
        }}
      />

      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          <Badge label={getGameLabel(game)} theme={theme} />
          {game.districtGame && <Badge label="District" theme={theme} />}
          {game.specialEvent && <Badge label={game.specialEvent} theme={theme} />}
        </div>

        <div className="mt-6 grid grid-cols-[auto_1fr_auto] items-center gap-4">
          {awaySchool ? (
            <SchoolBadge school={awaySchool} size="xs" />
          ) : (
            <FallbackBadge label={getTeamName(game.awayTeam, "Away")} />
          )}

          <div>
            <h3 className="text-3xl font-black leading-tight text-white sm:text-4xl">
              {getTeamName(game.awayTeam, "Away Team")}
              <span className="block text-white/35">at</span>
              {getTeamName(game.homeTeam, "Home Team")}
            </h3>
          </div>

          {homeSchool ? (
            <SchoolBadge school={homeSchool} size="xs" />
          ) : (
            <FallbackBadge label={getTeamName(game.homeTeam, "Home")} />
          )}
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <InfoCard label="Date" value={formatGameDate(game.kickoff)} />
          <InfoCard label="Kickoff" value={formatGameTime(game.kickoff)} />
          <InfoCard label="Venue" value={getVenueName(game.venue)} />
        </div>

        <p
          className="mt-6 text-sm font-black uppercase tracking-[0.16em]"
          style={{ color: theme.secondary }}
        >
          View matchup →
        </p>
      </div>
    </Link>
  );
}

function CompactGameCard({ game, theme }: { game: Game; theme: SchoolTheme }) {
  const awaySchool = game.awaySchoolSlug
    ? getSchoolBySlug(game.awaySchoolSlug)
    : undefined;

  const homeSchool = game.homeSchoolSlug
    ? getSchoolBySlug(game.homeSchoolSlug)
    : undefined;

  return (
    <Link
      href={`/games/${game.id}`}
      className="rounded-2xl border bg-black/35 p-4 transition hover:bg-white/10"
      style={{ borderColor: `${theme.secondary}22` }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-white/45">
          {getGameLabel(game)}
          {game.districtGame ? " · District" : ""}
        </p>

        <p className="text-xs font-bold text-white/45">
          {formatGameDate(game.kickoff)}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-[auto_1fr_auto] items-center gap-3">
        {awaySchool ? (
          <SchoolBadge school={awaySchool} size="xs" />
        ) : (
          <FallbackBadge label={getTeamName(game.awayTeam, "Away")} />
        )}

        <div>
          <h3 className="text-lg font-black leading-tight text-white">
            {getTeamName(game.awayTeam, "Away Team")} at{" "}
            {getTeamName(game.homeTeam, "Home Team")}
          </h3>

          <p className="mt-2 text-sm text-white/50">{getVenueName(game.venue)}</p>
        </div>

        {homeSchool ? (
          <SchoolBadge school={homeSchool} size="xs" />
        ) : (
          <FallbackBadge label={getTeamName(game.homeTeam, "Home")} />
        )}
      </div>
    </Link>
  );
}

function Badge({ label, theme }: { label: string; theme: SchoolTheme }) {
  return (
    <span
      className="rounded-full border bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-white/75"
      style={{ borderColor: `${theme.secondary}22` }}
    >
      {label}
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

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/35 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <p className="mt-2 font-bold text-white">{value}</p>
    </div>
  );
}