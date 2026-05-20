import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getGameById } from "../../../data/games";

function formatGameDate(kickoff: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
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

function getGameStatusLabel(status: string) {
  if (status === "upcoming") return "Upcoming";
  if (status === "live") return "Live";
  if (status === "final") return "Final";
  return status;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ gameId: string }>;
}): Promise<Metadata> {
  const { gameId } = await params;
  const game = getGameById(gameId);

  if (!game) {
    return {
      title: "Page Not Found | VarsityVue",
    };
  }

  return {
    title: `${game.awayTeam} at ${game.homeTeam} | VarsityVue`,
    description: `${game.awayTeam} at ${game.homeTeam} matchup preview, kickoff details, coverage, and sponsor placement on VarsityVue.`,
  };
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  const game = getGameById(gameId);

  if (!game) {
    notFound();
  }

  const hasFinalScore =
    game.status === "final" &&
    game.homeScore !== undefined &&
    game.awayScore !== undefined;

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="bg-gradient-to-br from-[#7A1022]/40 to-black px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#d65a6d] sm:text-sm">
            VarsityVue Matchup
          </p>

          <h1 className="mt-4 text-4xl font-black leading-tight sm:text-6xl lg:text-7xl">
            {game.awayTeam} at {game.homeTeam}
          </h1>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <InfoCard label="Status" value={getGameStatusLabel(game.status)} />
            <InfoCard label="Date" value={formatGameDate(game.kickoff)} />
            <InfoCard label="Kickoff" value={formatGameTime(game.kickoff)} />
            <InfoCard label="Venue" value={game.venue} />
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          <TeamCard
            label="Away"
            team={game.awayTeam}
            score={hasFinalScore ? game.awayScore : undefined}
          />

          <div className="flex items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-8 text-4xl font-black text-white/40">
            {hasFinalScore ? "FINAL" : "VS"}
          </div>

          <TeamCard
            label="Home"
            team={game.homeTeam}
            score={hasFinalScore ? game.homeScore : undefined}
          />
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-3xl border border-[#7A1022]/30 bg-[#7A1022]/10 p-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#d65a6d]">
            Game Sponsor
          </p>

          <h2 className="mt-4 text-3xl font-black">
            Presented By Your Business
          </h2>
        </div>
      </section>

      <section className="px-4 py-10 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#d65a6d]">
            Game Preview
          </p>

          <h2 className="mt-4 text-3xl font-black">
            Matchup preview coming soon
          </h2>

          <p className="mt-4 max-w-3xl leading-7 text-white/70">
            Team records, key players, district implications, recent results,
            sponsor placements, broadcast links, and game-week coverage notes
            will live here.
          </p>

          {game.districtGame && (
            <p className="mt-6 inline-flex rounded-full border border-[#d65a6d]/30 bg-[#7A1022]/20 px-4 py-2 text-sm font-bold text-[#d65a6d]">
              District game
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d65a6d]">
        {label}
      </p>
      <p className="mt-4 text-xl font-bold">{value}</p>
    </div>
  );
}

function TeamCard({
  label,
  team,
  score,
}: {
  label: string;
  team: string;
  score?: number;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
      <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#d65a6d]">
        {label}
      </p>

      <h2 className="mt-4 text-3xl font-black">{team}</h2>

      {score !== undefined && (
        <p className="mt-6 text-5xl font-black text-white">{score}</p>
      )}
    </div>
  );
}