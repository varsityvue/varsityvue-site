import Link from "next/link";
import {
  getGameOfTheWeek,
  getUpcomingScoreboardGames,
} from "@/lib/scoreboard";
import { getSchoolBySlug } from "@/lib/schools";
import SchoolBadge from "./SchoolBadge";

function parseGameDate(kickoff?: string) {
  if (!kickoff) return null;

  if (!kickoff.includes("T")) {
    const [year, month, day] = kickoff.split("-").map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day, 12));
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  const parsedDate = new Date(kickoff);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function formatGameDate(kickoff?: string) {
  const parsedDate = parseGameDate(kickoff);

  if (!parsedDate) return "—";

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Chicago",
  }).format(parsedDate);
}

function formatGameTime(kickoff?: string) {
  if (!kickoff?.includes("T")) return null;

  const parsedDate = parseGameDate(kickoff);
  if (!parsedDate) return null;

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  }).format(parsedDate);
}

function getGameLabel(gameType: string, week?: number) {
  if (gameType === "scrimmage") return "Scrimmage";
  if (gameType === "playoff") return "Playoff";
  return week === undefined ? "—" : `Week ${week}`;
}

function getBroadcastActionLabel(type: string) {
  if (type === "radio") return "Listen Live";
  if (type === "stream" || type === "tv") return "Watch Live";
  return "Live Coverage";
}

function BroadcastIcon({ type }: { type: string }) {
  if (type === "radio") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
        <path d="M4 14a2 2 0 0 1 2-2h1v7H6a2 2 0 0 1-2-2v-3Z" />
        <path d="M20 14a2 2 0 0 0-2-2h-1v7h1a2 2 0 0 0 2-2v-3Z" />
      </svg>
    );
  }

  if (type === "stream" || type === "tv") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-current">
        <path d="M8 5.5v13l10-6.5-10-6.5Z" />
      </svg>
    );
  }

  return null;
}

export default function FeaturedMatchups() {
  const gameOfTheWeek = getGameOfTheWeek();
  const upcomingGames = getUpcomingScoreboardGames(8);
  const upcomingGameOfTheWeek =
    gameOfTheWeek?.status === "upcoming" ? gameOfTheWeek : undefined;

  const games = [
    ...(upcomingGameOfTheWeek ? [upcomingGameOfTheWeek] : []),
    ...upcomingGames.filter((game) => game.id !== upcomingGameOfTheWeek?.id),
  ].slice(0, 4);

  if (games.length === 0) return null;

  return (
    <section className="px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px] rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl sm:rounded-[2rem] sm:p-6 md:p-8">
        <div className="mb-5 flex flex-col gap-3 sm:mb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-white/45 sm:text-xs sm:tracking-[0.3em]">
              Upcoming Matchups
            </p>

            <h2 className="mt-2 text-[1.95rem] font-black leading-[1.05] text-white sm:text-3xl md:text-4xl">
              Next games on the VarsityVue schedule
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/50 sm:mt-3">
              Upcoming kickoffs currently on file across VarsityVue school hubs.
            </p>
          </div>

          <Link
            href="/scoreboard"
            className="inline-flex w-fit rounded-full border border-white/10 bg-black/35 px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-white/60 transition hover:bg-white/10 hover:text-white sm:text-xs sm:tracking-[0.16em]"
          >
            Full Scoreboard →
          </Link>
        </div>

        <div className="grid gap-3 sm:gap-4 lg:grid-cols-4">
          {games.map((game) => {
            const awaySchool = game.awaySchoolSlug
              ? getSchoolBySlug(game.awaySchoolSlug)
              : undefined;

            const homeSchool = game.homeSchoolSlug
              ? getSchoolBySlug(game.homeSchoolSlug)
              : undefined;
            const gameTime = formatGameTime(game.kickoff);
            const isGameOfTheWeek = game.id === upcomingGameOfTheWeek?.id;
            const broadcastLinks = (game.mediaLinks ?? []).filter((link) =>
              ["radio", "stream", "tv", "coverage"].includes(link.type),
            );

            return (
              <article
                key={game.id}
                className="group overflow-hidden rounded-[1.35rem] border border-white/10 border-t-4 border-t-[var(--vv-primary)] bg-black/35 transition hover:-translate-y-1 hover:bg-white/[0.07] sm:rounded-[1.5rem]"
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Badge label={getGameLabel(game.gameType, game.week)} />
                    {isGameOfTheWeek ? (
                      <Badge label="Game of the Week" />
                    ) : game.districtGame ? (
                      <Badge label="District" />
                    ) : null}
                  </div>

                  <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:mt-5">
                    <TeamBlock
                      name={game.awayTeam ?? "Away"}
                      school={awaySchool}
                      align="left"
                    />

                    <span className="text-xs font-black uppercase tracking-[0.18em] text-white/50">
                      VS
                    </span>

                    <TeamBlock
                      name={game.homeTeam ?? "Home"}
                      school={homeSchool}
                      align="right"
                    />
                  </div>

                  <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3.5 sm:mt-5 sm:rounded-2xl sm:p-4">
                    <p className="text-sm font-black text-white">
                      {formatGameDate(game.kickoff)}
                      {gameTime ? ` · ${gameTime}` : ""}
                    </p>

                    {game.venue && (
                      <p className="mt-1 line-clamp-1 text-xs text-white/45">
                        {game.venue}
                      </p>
                    )}
                  </div>

                  {broadcastLinks.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
                      {broadcastLinks.map((link) => (
                        <a
                          key={`${link.type}-${link.url}`}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.08] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/80 transition hover:border-white/30 hover:bg-white/[0.14] hover:text-white"
                          title={link.label}
                        >
                          <BroadcastIcon type={link.type} />
                          {getBroadcastActionLabel(link.type)}
                        </a>
                      ))}
                    </div>
                  )}

                  <Link
                    href={`/games/${game.id}`}
                    className="mt-4 inline-flex text-[11px] font-black uppercase tracking-[0.14em] text-white/50 transition group-hover:text-white sm:mt-5 sm:text-xs sm:tracking-[0.16em]"
                  >
                    View Matchup →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TeamBlock({
  name,
  school,
  align,
}: {
  name: string;
  school?: ReturnType<typeof getSchoolBySlug>;
  align: "left" | "right";
}) {
  return (
    <div
      className={`min-w-0 ${align === "right" ? "text-right" : "text-left"}`}
    >
      <div className={`flex ${align === "right" ? "justify-end" : "justify-start"}`}>
        {school ? (
          <SchoolBadge school={school} size="xs" />
        ) : (
          <MiniBadge label={name} />
        )}
      </div>

      <p className="mt-3 line-clamp-2 text-sm font-black leading-tight text-white">
        {name}
      </p>

      {school?.mascot && (
        <p className="mt-1 line-clamp-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/35">
          {school.mascot}
        </p>
      )}
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/55">
      {label}
    </span>
  );
}

function MiniBadge({ label }: { label: string }) {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 p-2 text-center text-[10px] font-black uppercase text-white">
      {label.slice(0, 3)}
    </div>
  );
}
