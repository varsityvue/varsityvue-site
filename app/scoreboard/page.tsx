import type { Metadata } from "next";
import Link from "next/link";
import {
  getFeaturedScoreboardGame,
  getFinalScoreboardGames,
  getLiveGames,
  getUpcomingScoreboardGames,
} from "@/lib/scoreboard";

export const metadata: Metadata = {
  title: "Texas High School Football Scores | VarsityVue",
  description:
    "Follow Texas high school football scores, upcoming games, final results, featured matchups, and sponsor-ready scoreboard coverage on VarsityVue.",
};

function formatKickoff(kickoff: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  }).format(new Date(kickoff));
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
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--vv-accent)]">
            VarsityVue Scoreboard
          </p>

          <h1 className="mt-4 max-w-5xl text-4xl font-black leading-tight sm:text-6xl lg:text-7xl">
            Texas high school football scores built for Friday night.
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/65">
            Follow featured games, live updates, upcoming matchups, and final
            scores across the VarsityVue football ecosystem.
          </p>
        </section>

        {featuredGame && (
          <section className="mt-10 rounded-3xl border border-[color:var(--vv-primary)] bg-[var(--vv-primary)]/15 p-6 md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--vv-accent)]">
              Featured Matchup
            </p>

            <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <h2 className="text-3xl font-black md:text-5xl">
                  {featuredGame.awayTeam} at {featuredGame.homeTeam}
                </h2>

                <p className="mt-4 text-white/65">
                  Week {featuredGame.week} · {formatKickoff(featuredGame.kickoff)} ·{" "}
                  {featuredGame.venue}
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Badge>{featuredGame.displayStatus}</Badge>
                  {featuredGame.districtGame && <Badge>District Game</Badge>}
                  {featuredGame.specialEvent && (
                    <Badge>{featuredGame.specialEvent}</Badge>
                  )}
                </div>
              </div>

              <Link
                href={`/games/${featuredGame.id}`}
                className="rounded-full bg-white px-7 py-4 text-center font-black text-black transition hover:bg-white/85"
              >
                View Game
              </Link>
            </div>
          </section>
        )}

        <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--vv-accent)]">
                Sponsor Slot
              </p>

              <h2 className="mt-3 text-3xl font-black">
                Scoreboard sponsorship available
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-white/65">
                Scoreboards create repeat game-night traffic. That makes this
                one of the most valuable sponsor surfaces in the platform.
              </p>
            </div>

            <Link
              href="/sponsor-inquiry"
              className="rounded-full bg-[var(--vv-primary)] px-7 py-4 text-center font-bold transition hover:bg-[var(--vv-primary-hover)]"
            >
              Sponsor Scoreboard
            </Link>
          </div>
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-3">
          <ScoreboardColumn
            title="Live"
            description="Games currently in progress."
            games={liveGames}
            emptyText="No live games right now."
          />

          <ScoreboardColumn
            title="Upcoming"
            description="Next games on the schedule."
            games={upcomingGames}
            emptyText="No upcoming games listed."
          />

          <ScoreboardColumn
            title="Final"
            description="Recently completed games."
            games={finalGames}
            emptyText="No final scores posted yet."
          />
        </section>
      </div>
    </main>
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
  games: ReturnType<typeof getUpcomingScoreboardGames>;
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
          games.map((game) => (
            <Link
              key={game.id}
              href={`/games/${game.id}`}
              className="block rounded-2xl border border-white/10 bg-black/35 p-4 transition hover:border-[color:var(--vv-accent)] hover:bg-white/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-black">{game.awayTeam}</p>
                  <p className="mt-1 font-black">{game.homeTeam}</p>
                </div>

                {game.status === "final" ? (
                  <div className="text-right font-black">
                    <p>{game.awayScore ?? "-"}</p>
                    <p className="mt-1">{game.homeScore ?? "-"}</p>
                  </div>
                ) : (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white/60">
                    {game.displayStatus}
                  </span>
                )}
              </div>

              <p className="mt-4 text-xs text-white/45">
                Week {game.week} · {formatKickoff(game.kickoff)}
              </p>

              {game.districtGame && (
                <p className="mt-3 text-xs font-bold uppercase tracking-wide text-[var(--vv-accent)]">
                  District Game
                </p>
              )}
            </Link>
          ))
        )}
      </div>
    </section>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm font-bold text-white/75">
      {children}
    </span>
  );
}