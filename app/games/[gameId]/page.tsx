import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getGameById } from "../../../data/games";
import { getSchoolBySlug } from "../../../data/schools";

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
      title: "Game Not Found | VarsityVue",
    };
  }

  return {
    title: `${game.awayTeam} at ${game.homeTeam} | VarsityVue`,
    description: `${game.awayTeam} at ${game.homeTeam} matchup preview, kickoff details, venue, district implications, and VarsityVue coverage.`,
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

  const homeSchool = getSchoolBySlug(game.homeSchoolSlug);
  const awaySchool = getSchoolBySlug(game.awaySchoolSlug);

  const primaryColor = homeSchool?.colors.primary ?? "#7A1022";
  const secondaryColor = homeSchool?.colors.secondary ?? "#d65a6d";

  const hasFinalScore =
    game.status === "final" &&
    game.homeScore !== undefined &&
    game.awayScore !== undefined;

  return (
    <main className="min-h-screen bg-black text-white">
      <section
        className="border-b border-white/10 px-4 py-14 sm:px-6 lg:px-8"
        style={{
          background: `linear-gradient(120deg, ${primaryColor}66 0%, #050505 55%, #000 100%)`,
        }}
      >
        <div className="mx-auto max-w-6xl">
          <Link
            href="/games"
            className="text-sm font-bold text-white/60 transition hover:text-white"
          >
            ← Back to Games
          </Link>

          <p className="mt-8 text-xs font-bold uppercase tracking-[0.3em] text-[#d65a6d] sm:text-sm">
            VarsityVue Matchup
          </p>

          <h1 className="mt-4 text-4xl font-black leading-tight sm:text-6xl lg:text-7xl">
            {game.awayTeam} at {game.homeTeam}
          </h1>

          <div className="mt-8 flex flex-wrap gap-3">
            <Badge label={getGameStatusLabel(game.status)} />
            <Badge label={game.gameType === "bye" ? "BYE" : `Week ${game.week}`} />
            {game.districtGame && <Badge label="District Game" />}
            {game.specialEvent && <Badge label={game.specialEvent} />}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <InfoCard label="Date" value={formatGameDate(game.kickoff)} />
            <InfoCard label="Kickoff" value={formatGameTime(game.kickoff)} />
            <InfoCard label="Venue" value={game.venue} />
            <InfoCard label="Season" value={game.season.toString()} />
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          <TeamCard
            label="Away"
            team={game.awayTeam}
            schoolSlug={awaySchool?.slug}
            score={hasFinalScore ? game.awayScore : undefined}
          />

          <div
            className="flex items-center justify-center rounded-3xl border bg-white/5 p-8 text-4xl font-black text-white/50"
            style={{ borderColor: `${secondaryColor}33` }}
          >
            {hasFinalScore ? "FINAL" : "VS"}
          </div>

          <TeamCard
            label="Home"
            team={game.homeTeam}
            schoolSlug={homeSchool?.slug}
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

          <p className="mt-3 text-white/60">
            Premium matchup sponsorship placement available.
          </p>
        </div>
      </section>

      <section className="px-4 py-10 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
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
          </div>

          <aside className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#d65a6d]">
              Quick Links
            </p>

            <div className="mt-5 flex flex-col gap-3">
              {awaySchool && (
                <LinkButton href={`/schools/${awaySchool.slug}`} label={`${awaySchool.name} Hub`} />
              )}

              {homeSchool && (
                <LinkButton href={`/schools/${homeSchool.slug}`} label={`${homeSchool.name} Hub`} />
              )}

              {homeSchool && (
                <LinkButton
                  href={`/districts/${homeSchool.districtId}`}
                  label="District Hub"
                />
              )}
            </div>
          </aside>
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
  schoolSlug,
  score,
}: {
  label: string;
  team: string;
  schoolSlug?: string;
  score?: number;
}) {
  const content = (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center transition hover:bg-white/[0.08]">
      <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#d65a6d]">
        {label}
      </p>

      <h2 className="mt-4 text-3xl font-black">{team}</h2>

      {score !== undefined && (
        <p className="mt-6 text-5xl font-black text-white">{score}</p>
      )}

      {schoolSlug && (
        <p className="mt-5 text-sm font-bold text-[#d65a6d]">
          View school hub →
        </p>
      )}
    </div>
  );

  if (!schoolSlug) return content;

  return <Link href={`/schools/${schoolSlug}`}>{content}</Link>;
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white/80">
      {label}
    </span>
  );
}

function LinkButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
    >
      {label}
    </Link>
  );
}