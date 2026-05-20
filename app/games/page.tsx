import Link from "next/link";
import { games } from "../../data/games";

function formatGameDate(kickoff: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Chicago",
  }).format(new Date(kickoff));
}

function formatGameTime(kickoff: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  }).format(new Date(kickoff));
}

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function GamesPage() {
  const sortedGames = [...games].sort(
    (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
  );

  const featuredGame =
    sortedGames.find((game) => game.status === "upcoming" && game.gameType !== "bye") ??
    sortedGames[0];

  const regularGames = sortedGames.filter((game) => game.gameType !== "bye");
  const districtGames = regularGames.filter((game) => game.districtGame);

  return (
    <main className="min-h-screen bg-black px-4 py-14 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#d65a6d]">
            VarsityVue Games
          </p>

          <h1 className="mt-4 text-4xl font-black leading-tight sm:text-6xl lg:text-7xl">
            Games & Matchups
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/60">
            Browse upcoming matchups, district games, featured previews,
            scoreboards, and Friday night coverage across VarsityVue.
          </p>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <StatCard label="Games" value={regularGames.length.toString()} />
          <StatCard label="District Games" value={districtGames.length.toString()} />
          <StatCard
            label="Featured Season"
            value={featuredGame?.season.toString() ?? "2026"}
          />
        </section>

        {featuredGame && (
          <section className="mt-10 rounded-[2rem] border border-[#7A1022]/30 bg-[#7A1022]/10 p-6 md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#d65a6d]">
              Featured Matchup
            </p>

            <div className="mt-5 grid gap-8 lg:grid-cols-[1.4fr_0.6fr] lg:items-center">
              <div>
                <h2 className="text-4xl font-black leading-tight">
                  {featuredGame.awayTeam} at {featuredGame.homeTeam}
                </h2>

                <p className="mt-4 text-white/60">
                  {formatGameDate(featuredGame.kickoff)} ·{" "}
                  {formatGameTime(featuredGame.kickoff)} · {featuredGame.venue}
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Badge label={`Week ${featuredGame.week}`} />
                  <Badge label={formatStatus(featuredGame.status)} />
                  {featuredGame.districtGame && <Badge label="District Game" />}
                  {featuredGame.specialEvent && (
                    <Badge label={featuredGame.specialEvent} />
                  )}
                </div>
              </div>

              <Link
                href={`/games/${featuredGame.id}`}
                className="rounded-full bg-[#7A1022] px-6 py-4 text-center font-bold transition hover:bg-[#93142a]"
              >
                View Matchup →
              </Link>
            </div>
          </section>
        )}

        <section className="mt-12">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[#d65a6d]">
                Schedule
              </p>

              <h2 className="mt-3 text-3xl font-black">Upcoming Games</h2>
            </div>

            <Link
              href="/sponsors"
              className="w-fit rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              Sponsor a Game
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {regularGames.map((game) => (
              <Link
                key={game.id}
                href={`/games/${game.id}`}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg transition hover:-translate-y-1 hover:bg-white/[0.08]"
              >
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d65a6d]">
                  Week {game.week} · {formatStatus(game.status)}
                </p>

                <h3 className="mt-4 text-2xl font-black leading-tight">
                  {game.awayTeam} at {game.homeTeam}
                </h3>

                <div className="mt-5 space-y-2 text-sm text-white/70">
                  <p>{formatGameDate(game.kickoff)}</p>
                  <p>{formatGameTime(game.kickoff)}</p>
                  <p>{game.venue}</p>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {game.districtGame && <Badge label="District" />}
                  {game.specialEvent && <Badge label={game.specialEvent} />}
                </div>

                {game.status === "final" &&
                  game.homeScore !== undefined &&
                  game.awayScore !== undefined && (
                    <p className="mt-4 text-lg font-bold text-white">
                      Final: {game.awayScore}-{game.homeScore}
                    </p>
                  )}

                <p className="mt-6 text-sm font-bold text-[#d65a6d]">
                  View matchup →
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d65a6d]">
        {label}
      </p>
      <p className="mt-3 text-4xl font-black">{value}</p>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-white/70">
      {label}
    </span>
  );
}