import Link from "next/link";
import { getHomepageScoreboardGames } from "@/lib/scoreboard";
import { getSchoolBySlug } from "@/lib/schools";
import { getStandingForSchool } from "@/lib/standings";
import SchoolBadge from "./SchoolBadge";

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

function getGameLabel(gameType: string, week?: number) {
  if (gameType === "scrimmage") return "Scrimmage";
  if (gameType === "playoff") return "Playoff";
  return week === undefined ? "Week TBD" : `Week ${week}`;
}

function formatRecord(slug?: string) {
  if (!slug || slug === "bye" || slug === "special-event") return "Record unavailable";

  const standing = getStandingForSchool(slug);

  if (!standing) return "Record unavailable";

  return `${standing.overallWins}-${standing.overallLosses}`;
}

export default function ScoreStrip() {
  const { mode, games } = getHomepageScoreboardGames(8);

  if (games.length === 0) return null;

  const showingFinals = mode === "finals";
  const week = games[0]?.week;

  return (
    <section className="border-b border-white/10 bg-white/[0.03] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/45">
              {showingFinals
                ? week
                  ? `Week ${week} Results`
                  : "Latest Results"
                : "Upcoming This Week"}
            </p>

            <h2 className="mt-2 text-3xl font-black text-white">
              {showingFinals ? "Friday Night Finals" : "Games to Watch"}
            </h2>
          </div>

          <Link
            href="/scoreboard"
            className="hidden rounded-full border border-white/10 bg-black/35 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white/60 transition hover:bg-white/10 hover:text-white sm:inline-flex"
          >
            Full Scoreboard →
          </Link>
        </div>

        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
          {games.map((game, index) => {
            const awaySchool = game.awaySchoolSlug
              ? getSchoolBySlug(game.awaySchoolSlug)
              : undefined;

            const homeSchool = game.homeSchoolSlug
              ? getSchoolBySlug(game.homeSchoolSlug)
              : undefined;

            const isFeatured = index === 0 || game.isFeatured;
            const awayScore = game.awayScore ?? game.score?.away;
            const homeScore = game.homeScore ?? game.score?.home;

            return (
              <Link
                key={game.id}
                href={`/games/${game.id}`}
                className="group min-w-[390px] snap-start overflow-hidden rounded-[1.5rem] border border-white/10 border-t-4 border-t-[var(--vv-primary)] bg-black/50 transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:border-t-[var(--vv-primary)] hover:bg-white/[0.08]"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <GameChip label={game.displayStatus} strong={showingFinals} />
                      {isFeatured && <GameChip label="Featured" strong />}
                      {game.districtGame && <GameChip label="District Game" />}
                      {game.specialEvent && <GameChip label={game.specialEvent} />}
                    </div>

                    <p className="shrink-0 text-xs font-bold text-white/40">
                      {getGameLabel(game.gameType, game.week)}
                    </p>
                  </div>

                  <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                    <TeamBlock
                      name={game.awayTeam ?? "Away"}
                      school={awaySchool}
                      record={formatRecord(game.awaySchoolSlug)}
                      score={showingFinals ? awayScore : undefined}
                      align="left"
                    />

                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-white/70">
                      {showingFinals ? "Final" : "VS"}
                    </div>

                    <TeamBlock
                      name={game.homeTeam ?? "Home"}
                      school={homeSchool}
                      record={formatRecord(game.homeSchoolSlug)}
                      score={showingFinals ? homeScore : undefined}
                      align="right"
                    />
                  </div>

                  <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-sm font-black text-white">
                      {formatKickoff(game.kickoff)}
                    </p>

                    {game.venue && (
                      <p className="mt-1 line-clamp-1 text-xs font-semibold text-white/45">
                        {game.venue}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-white/45">
                      {showingFinals ? "Final Result" : "Matchup Preview"}
                    </p>

                    <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60 transition group-hover:text-white">
                      View Matchup →
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <Link
          href="/scoreboard"
          className="mt-4 block rounded-xl border border-white/10 bg-black/35 px-5 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-white/65 transition hover:bg-white/10 hover:text-white sm:hidden"
        >
          Full Scoreboard →
        </Link>
      </div>
    </section>
  );
}

function GameChip({ label, strong = false }: { label: string; strong?: boolean }) {
  return (
    <p
      className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
        strong
          ? "border-[color:var(--vv-primary)]/40 bg-[var(--vv-primary)]/25 text-white"
          : "border-white/10 bg-white/5 text-white/55"
      }`}
    >
      {label}
    </p>
  );
}

function TeamBlock({
  name,
  school,
  record,
  score,
  align,
}: {
  name: string;
  school?: ReturnType<typeof getSchoolBySlug>;
  record: string;
  score?: number;
  align: "left" | "right";
}) {
  return (
    <div
      className={`flex min-w-0 flex-col gap-3 ${
        align === "right" ? "items-end text-right" : "items-start text-left"
      }`}
    >
      {school ? (
        <SchoolBadge school={school} size="xs" />
      ) : (
        <MiniFallbackBadge label={name} />
      )}

      <div>
        <div
          className={`flex items-end gap-2 ${
            align === "right" ? "justify-end" : "justify-start"
          }`}
        >
          <p className="line-clamp-2 text-lg font-black leading-tight text-white">
            {name}
          </p>
          {score !== undefined && (
            <p className="text-3xl font-black leading-none text-white">{score}</p>
          )}
        </div>

        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/35">
          {school?.mascot ?? "Opponent"} · {record}
        </p>
      </div>
    </div>
  );
}

function MiniFallbackBadge({ label }: { label: string }) {
  return (
    <div className="flex h-16 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-2 text-center text-[9px] font-black uppercase leading-tight text-white">
      {label}
    </div>
  );
}
