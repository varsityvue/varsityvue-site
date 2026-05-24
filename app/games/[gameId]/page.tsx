import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getGameById } from "../../../data/games";
import { getSchoolBySlug } from "../../../data/schools";
import { getGameSponsors } from "../../../data/sponsors";
import { getDistrictById } from "@/lib/districts";

type GamePageProps = {
  params: Promise<{ gameId: string }>;
};

function formatGameDate(kickoff: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
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

function getGameStatusLabel(status: string) {
  if (status === "upcoming") return "Upcoming";
  if (status === "live") return "Live";
  if (status === "final") return "Final";
  return status;
}

function getGameTypeLabel(gameType: string, week: number) {
  if (gameType === "scrimmage") return "Scrimmage";
  if (gameType === "playoff") return "Playoff";
  if (gameType === "bye") return "BYE";
  return `Week ${week}`;
}

function getSchemaEventStatus(status: string) {
  if (status === "final") return "https://schema.org/EventCompleted";
  return "https://schema.org/EventScheduled";
}

function getMapUrl(venue: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    venue
  )}`;
}

export async function generateMetadata({
  params,
}: GamePageProps): Promise<Metadata> {
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

export default async function GamePage({ params }: GamePageProps) {
  const { gameId } = await params;
  const game = getGameById(gameId);

  if (!game) {
    notFound();
  }

const homeSchool = getSchoolBySlug(game.homeSchoolSlug);
const awaySchool = getSchoolBySlug(game.awaySchoolSlug);

const district = homeSchool
  ? getDistrictById(homeSchool.districtId)
  : null;

const primaryColor = homeSchool?.colors.primary ?? "#7A1022";
const secondaryColor = homeSchool?.colors.secondary ?? "#8B1020";

  const sponsorSchoolId = homeSchool?.id ?? awaySchool?.id;
  const gameSponsors = sponsorSchoolId ? getGameSponsors(sponsorSchoolId) : [];
  const gameSponsor = gameSponsors[0];

  const hasFinalScore =
    game.status === "final" &&
    game.homeScore !== undefined &&
    game.awayScore !== undefined;

  const sportsEventSchema = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${game.awayTeam} at ${game.homeTeam}`,
    description: `${game.awayTeam} at ${game.homeTeam} matchup details, kickoff information, venue, and VarsityVue coverage.`,
    startDate: game.kickoff,
    eventStatus: getSchemaEventStatus(game.status),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: `https://varsityvue.com/games/${game.id}`,
    location: {
      "@type": "Place",
      name: game.venue,
    },
    competitor: [
      {
        "@type": "SportsTeam",
        name: game.awayTeam,
        url: awaySchool
          ? `https://varsityvue.com/schools/${awaySchool.slug}`
          : undefined,
      },
      {
        "@type": "SportsTeam",
        name: game.homeTeam,
        url: homeSchool
          ? `https://varsityvue.com/schools/${homeSchool.slug}`
          : undefined,
      },
    ],
    organizer: {
      "@type": "Organization",
      name: "VarsityVue",
      url: "https://varsityvue.com",
    },
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(sportsEventSchema),
        }}
      />

      <section
        className="border-b border-white/10 px-4 py-8 sm:px-6 lg:px-8"
        style={{
          background: `
            radial-gradient(circle at top left, ${primaryColor}88 0%, transparent 34%),
            radial-gradient(circle at top right, ${secondaryColor}33 0%, transparent 32%),
            linear-gradient(120deg, ${primaryColor}55 0%, #080808 45%, #000 100%)
          `,
        }}
      >
        <div className="mx-auto max-w-7xl">
          <Link
            href="/scoreboard"
            className="text-sm font-black uppercase tracking-[0.14em] text-white/55 transition hover:text-white"
          >
            ← Back to Games
          </Link>

          <div className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl md:p-8">
            <div className="flex flex-wrap gap-2">
              <Badge label="VarsityVue Matchup" />
              <Badge label={getGameStatusLabel(game.status)} />
              <Badge label={getGameTypeLabel(game.gameType, game.week)} />
              {game.districtGame && <Badge label="District Game" />}
              {game.specialEvent && <Badge label={game.specialEvent} />}
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
              <TeamBlock
                align="left"
                label="Away"
                team={game.awayTeam}
                school={awaySchool}
                score={hasFinalScore ? game.awayScore : undefined}
              />

              <div className="flex items-center justify-center">
                <div className="rounded-full border border-white/10 bg-black/40 px-7 py-5 text-2xl font-black text-white/45 shadow-xl">
                  {hasFinalScore ? "FINAL" : "VS"}
                </div>
              </div>

              <TeamBlock
                align="right"
                label="Home"
                team={game.homeTeam}
                school={homeSchool}
                score={hasFinalScore ? game.homeScore : undefined}
              />
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-4">
              <InfoCard label="Date" value={formatGameDate(game.kickoff)} />
              <InfoCard label="Kickoff" value={formatGameTime(game.kickoff)} />
              <InfoCard label="Venue" value={game.venue} />
              <InfoCard label="Season" value={game.season.toString()} />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={getMapUrl(game.venue)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white/70 transition hover:bg-white/15 hover:text-white"
              >
                Map Venue →
              </a>

              {awaySchool && (
                <Link
                  href={`/schools/${awaySchool.slug}`}
                  className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white/70 transition hover:bg-white/15 hover:text-white"
                >
                  {awaySchool.name} Hub →
                </Link>
              )}

              {homeSchool && (
                <Link
                  href={`/schools/${homeSchool.slug}`}
                  className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white/70 transition hover:bg-white/15 hover:text-white"
                >
                  {homeSchool.name} Hub →
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.35fr_0.75fr]">
          <div className="space-y-6">
            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d65a6d]">
                Game Preview
              </p>

              <h2 className="mt-3 text-3xl font-black text-white">
                Matchup preview coming soon
              </h2>

              <p className="mt-4 max-w-3xl leading-7 text-white/60">
                Team records, key players, district implications, recent
                results, broadcast links, and game-week coverage notes will live
                here.
              </p>
            </section>

            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d65a6d]">
                Matchup Notes
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <MiniCard
                  label="Game Type"
                  value={getGameTypeLabel(game.gameType, game.week)}
                />
                <MiniCard
                  label="District"
                  value={game.districtGame ? "Yes" : "No"}
                />
                <MiniCard
                  label="Status"
                  value={getGameStatusLabel(game.status)}
                />
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[1.75rem] border border-[#7A1022]/40 bg-gradient-to-br from-[#7A1022]/45 via-black to-black p-6 shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#f3a3af]">
                Game Sponsor
              </p>

              <h2 className="mt-3 text-3xl font-black text-white">
                {gameSponsor
                  ? `Presented by ${gameSponsor.name}`
                  : "This game placement is available"}
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/55">
                Premium matchup sponsorship inventory tied directly to game-week
                traffic, school hubs, schedule pages, and coverage modules.
              </p>

              <Link
                href="/sponsor-inquiry"
                className="mt-6 block rounded-xl border border-white/15 bg-white/10 px-5 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/15"
              >
                Sponsor This Game
              </Link>
            </section>

            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d65a6d]">
                Quick Links
              </p>

              <div className="mt-5 flex flex-col gap-3">
                {awaySchool && (
                  <LinkButton
                    href={`/schools/${awaySchool.slug}`}
                    label={`${awaySchool.name} Hub`}
                  />
                )}

                {homeSchool && (
                  <LinkButton
                    href={`/schools/${homeSchool.slug}`}
                    label={`${homeSchool.name} Hub`}
                  />
                )}

                {district && (
  <LinkButton
    href={`/districts/${district.slug}`}
    label="District Hub"
  />
)}

               <LinkButton href="/scoreboard" label="Scoreboard" />
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

function TeamBlock({
  align,
  label,
  team,
  school,
  score,
}: {
  align: "left" | "right";
  label: string;
  team: string;
  school?: NonNullable<ReturnType<typeof getSchoolBySlug>>;
  score?: number;
}) {
  const content = (
    <div
      className={`rounded-[1.75rem] border border-white/10 bg-black/35 p-6 ${
        align === "right" ? "text-left lg:text-right" : "text-left"
      }`}
    >
      <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">
        {label}
      </p>

      <div
        className={`mt-4 flex items-center gap-5 ${
          align === "right" ? "lg:flex-row-reverse" : ""
        }`}
      >
    <div
  className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-xl font-black text-white shadow-xl"
  style={{
    backgroundColor: school
      ? `${school.colors.primary}cc`
      : "rgba(255,255,255,0.1)",
    color: school?.colors.secondary ?? "#ffffff",
  }}
>
  {school?.abbreviation ?? team.slice(0, 2).toUpperCase()}
</div>

        <div>
          <h2 className="text-3xl font-black leading-tight text-white">
            {team}
          </h2>

          {school && (
            <div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/75">
              School Hub →
            </div>
          )}
        </div>
      </div>

      {score !== undefined && (
        <p className="mt-6 text-6xl font-black text-white">{score}</p>
      )}
    </div>
  );

  if (!school) return content;

  return <Link href={`/schools/${school.slug}`}>{content}</Link>;
}
function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <p className="mt-2 font-black text-white">{value}</p>
    </div>
  );
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <p className="mt-2 font-black text-white">{value}</p>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/70">
      {label}
    </span>
  );
}

function LinkButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-black text-white/75 transition hover:bg-white/10 hover:text-white"
    >
      {label}
    </Link>
  );
}