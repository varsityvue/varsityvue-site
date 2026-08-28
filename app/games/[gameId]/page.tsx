import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getGameById } from "@/lib/games";
import { getSchoolBySlug } from "@/lib/schools";
import { getDistrictById } from "@/lib/districts";
import { getStandingForSchool } from "@/lib/standings";
import type { UILClassification } from "@/types/platform";

type GamePageProps = {
  params: Promise<{ gameId: string }>;
};

const VARSITYVUE_PRIMARY = "#8B1020";
const VARSITYVUE_ACCENT = "#F4EBDD";
const VARSITYVUE_BG = "#050505";

function formatClassification(classification: UILClassification) {
  if (!classification.division) return classification.conference;

  return `${classification.conference} Division ${
    classification.division === "D1" ? "I" : "II"
  }`;
}

function parseKickoff(kickoff?: string) {
  if (!kickoff) return null;

  if (!kickoff.includes("T")) {
    const [year, month, day] = kickoff.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(kickoff);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatGameDate(kickoff?: string) {
  const parsed = parseKickoff(kickoff);
  if (!parsed) return "Date TBD";

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Chicago",
  }).format(parsed);
}

function formatGameTime(kickoff?: string) {
  if (!kickoff || !kickoff.includes("T")) return "Time TBD";

  const parsed = parseKickoff(kickoff);
  if (!parsed) return "Time TBD";

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  }).format(parsed);
}

function getGameStatusLabel(status: string) {
  if (status === "upcoming") return "Upcoming";
  if (status === "live") return "Live";
  if (status === "final") return "Final";
  return status;
}

function getGameTypeLabel(gameType: string, week?: number) {
  if (gameType === "scrimmage") return "Scrimmage";
  if (gameType === "playoff") return "Playoff";
  return week === undefined ? "Week TBD" : `Week ${week}`;
}

function getSchemaEventStatus(status: string) {
  if (status === "final") return "https://schema.org/EventCompleted";
  return "https://schema.org/EventScheduled";
}

function getMapUrl(game: { venue: string; homeTeam: string }) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${game.venue} ${game.homeTeam} Texas`
  )}`;
}

export async function generateMetadata({
  params,
}: GamePageProps): Promise<Metadata> {
  const { gameId } = await params;
  const game = getGameById(gameId);

  if (!game) return { title: "Game Not Found | VarsityVue" };

  const homeTeamName = game.homeTeam ?? "Home Team";
  const awayTeamName = game.awayTeam ?? "Away Team";

  return {
    title: `${awayTeamName} at ${homeTeamName} | VarsityVue`,
    description: `${awayTeamName} at ${homeTeamName} game center with kickoff details, venue information, school hubs, and VarsityVue coverage status.`,
  };
}

export default async function GamePage({ params }: GamePageProps) {
  const { gameId } = await params;
  const game = getGameById(gameId);

  if (!game) notFound();

  const homeTeamName = game.homeTeam ?? "Home Team";
  const awayTeamName = game.awayTeam ?? "Away Team";
  const kickoffValue = game.kickoff ?? "";
  const venueName = game.venue ?? "Venue TBD";

  const homeSchool = getSchoolBySlug(game.homeSchoolSlug ?? "");
  const awaySchool = getSchoolBySlug(game.awaySchoolSlug ?? "");
  const homeDistrict = homeSchool ? getDistrictById(homeSchool.districtId) : undefined;
  const awayDistrict = awaySchool ? getDistrictById(awaySchool.districtId) : undefined;
  const homeStanding = homeSchool ? getStandingForSchool(homeSchool.slug) : undefined;
  const awayStanding = awaySchool ? getStandingForSchool(awaySchool.slug) : undefined;

  const primaryColor =
    homeSchool?.colors.primary ?? awaySchool?.colors.primary ?? VARSITYVUE_PRIMARY;
  const secondaryColor =
    awaySchool?.colors.primary ?? homeSchool?.colors.secondary ?? VARSITYVUE_ACCENT;

  const hasFinalScore =
    game.status === "final" &&
    game.homeScore !== undefined &&
    game.awayScore !== undefined;

  const sportsEventSchema = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${awayTeamName} at ${homeTeamName}`,
    startDate: kickoffValue,
    eventStatus: getSchemaEventStatus(game.status),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: `https://varsityvue.com/games/${game.id}`,
    location: { "@type": "Place", name: venueName },
    competitor: [
      { "@type": "SportsTeam", name: awayTeamName },
      { "@type": "SportsTeam", name: homeTeamName },
    ],
    organizer: {
      "@type": "Organization",
      name: "VarsityVue",
      url: "https://varsityvue.com",
    },
  };

  return (
    <main
      className="min-h-screen bg-[var(--vv-bg)] text-white"
      style={
        {
          "--vv-primary": primaryColor,
          "--vv-secondary": secondaryColor,
          "--vv-accent": VARSITYVUE_ACCENT,
          "--vv-accent-soft": VARSITYVUE_ACCENT,
          "--vv-bg": VARSITYVUE_BG,
        } as CSSProperties
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sportsEventSchema) }}
      />

      <section
        className="border-b border-white/10 px-4 py-8 sm:px-6 lg:px-8"
        style={{
          background: `
            radial-gradient(circle at top left, ${primaryColor}66 0%, transparent 34%),
            radial-gradient(circle at top right, ${secondaryColor}44 0%, transparent 34%),
            linear-gradient(120deg, #050505 0%, #080808 48%, #000 100%)
          `,
        }}
      >
        <div className="mx-auto max-w-[1440px]">
          <Link
            href="/scoreboard"
            className="text-sm font-black uppercase tracking-[0.14em] text-white/55 transition hover:text-white"
          >
            ← Back to Scoreboard
          </Link>

          <div className="mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] shadow-2xl">
            <div className="border-b border-white/10 bg-black/35 p-5">
              <div className="flex flex-wrap gap-2">
                <Badge label="VarsityVue Game Center" />
                <Badge label={getGameStatusLabel(game.status)} />
                <Badge label={getGameTypeLabel(game.gameType, game.week)} />
                {game.districtGame && <Badge label="District Game" />}
                {game.specialEvent && <Badge label={game.specialEvent} />}
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="grid gap-8 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
                <TeamBlock
                  align="left"
                  label="Away"
                  team={awayTeamName}
                  school={awaySchool}
                  districtName={awayDistrict?.name}
                  record={
                    awayStanding
                      ? `${awayStanding.overallWins}-${awayStanding.overallLosses}`
                      : undefined
                  }
                  score={hasFinalScore ? game.awayScore : undefined}
                />

                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="rounded-full border border-white/15 bg-white/[0.08] px-8 py-5 text-2xl font-black text-white/85 shadow-xl">
                    {hasFinalScore ? "FINAL" : "VS"}
                  </div>
                  <p className="text-center text-xs font-black uppercase tracking-[0.18em] text-white/40">
                    {formatGameDate(kickoffValue)}
                  </p>
                </div>

                <TeamBlock
                  align="right"
                  label="Home"
                  team={homeTeamName}
                  school={homeSchool}
                  districtName={homeDistrict?.name}
                  record={
                    homeStanding
                      ? `${homeStanding.overallWins}-${homeStanding.overallLosses}`
                      : undefined
                  }
                  score={hasFinalScore ? game.homeScore : undefined}
                />
              </div>

              <div className="mt-8 grid gap-3 md:grid-cols-4">
                <InfoCard label="Date" value={formatGameDate(kickoffValue)} />
                <InfoCard label="Kickoff" value={formatGameTime(kickoffValue)} />
                <a
                  href={getMapUrl({ venue: venueName, homeTeam: homeTeamName })}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <InfoCard label="Venue" value={`${venueName} →`} />
                </a>
                <InfoCard
                  label="Coverage"
                  value={game.status === "final" ? "Postgame" : "Game Center"}
                />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {awaySchool && (
                  <LinkButton
                    href={`/schools/${awaySchool.slug}`}
                    label={`View ${awaySchool.name} Hub →`}
                  />
                )}
                {homeSchool && (
                  <LinkButton
                    href={`/schools/${homeSchool.slug}`}
                    label={`View ${homeSchool.name} Hub →`}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1440px] gap-6 lg:grid-cols-[1.35fr_0.75fr]">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045] shadow-2xl">
              <div className="h-1.5 bg-[var(--vv-primary)]" />
              <div className="p-7">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-white/45">
                  Pregame Matchup Center
                </p>
                <h1 className="mt-3 text-3xl font-black text-white md:text-4xl">
                  {awayTeamName} at {homeTeamName}
                </h1>
                <p className="mt-4 max-w-3xl leading-7 text-white/60">
                  VarsityVue is tracking this Week {game.week ?? "1"} matchup.
                  This page currently shows confirmed game details and program
                  information only. Additional coverage will be added as verified
                  information becomes available.
                </p>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-7 shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/45">
                What We Know
              </p>
              <h2 className="mt-3 text-3xl font-black text-white">
                Game information
              </h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Fact label="Matchup" value={`${awayTeamName} at ${homeTeamName}`} />
                <Fact label="Kickoff" value={`${formatGameDate(kickoffValue)} · ${formatGameTime(kickoffValue)}`} />
                <Fact label="Venue" value={venueName} />
                <Fact label="Game Type" value={getGameTypeLabel(game.gameType, game.week)} />
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-7 shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/45">
                VarsityVue Coverage
              </p>
              <h2 className="mt-3 text-3xl font-black text-white">
                Coverage begins with verified information.
              </h2>
              <p className="mt-4 max-w-3xl leading-7 text-white/60">
                Pregame notes, results, player performances and postgame coverage
                will appear here when they are sourced and ready to publish. No
                projected statistics, invented player leaders or synthetic game
                analysis will be shown as fact.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Badge label="Game Details" />
                <Badge label="Results" />
                <Badge label="Player Performances" />
                <Badge label="Postgame Coverage" />
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-7 shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/45">
                Game Night Utility
              </p>
              <h2 className="mt-3 text-3xl font-black text-white">
                Before kickoff
              </h2>
              <div className="mt-5 flex flex-col gap-3">
                <LinkButton href="/scoreboard" label="Game Night Scoreboard" />
                <a
                  href={getMapUrl({ venue: venueName, homeTeam: homeTeamName })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-black text-white/75 transition hover:bg-white/10 hover:text-white"
                >
                  Open Venue Map
                </a>
                <LinkButton href="/coverage" label="VarsityVue Coverage" />
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-[var(--vv-primary)]/30 via-black to-black p-7 shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/45">
                2027 Sponsor Interest
              </p>
              <h2 className="mt-3 text-3xl font-black text-white">
                Your business here.
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/55">
                Interested in future VarsityVue game-page sponsorship inventory?
                Register interest for the 2027 season.
              </p>
              <Link
                href="/sponsor-inquiry"
                className="mt-6 block rounded-xl border border-white/15 bg-white/10 px-5 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/15"
              >
                Reserve Interest →
              </Link>
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
  districtName,
  record,
  score,
}: {
  align: "left" | "right";
  label: string;
  team: string;
  school?: NonNullable<ReturnType<typeof getSchoolBySlug>>;
  districtName?: string;
  record?: string;
  score?: number;
}) {
  const content = (
    <div
      className={`h-full rounded-[1.75rem] border border-white/10 bg-black/35 p-7 ${
        align === "right" ? "text-left lg:text-right" : "text-left"
      }`}
    >
      <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">
        {label}
      </p>
      <div
        className={`mt-4 flex items-center gap-6 ${
          align === "right" ? "lg:flex-row-reverse" : ""
        }`}
      >
        <div
          className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-white/10 text-2xl font-black shadow-xl"
          style={{
            backgroundColor: school
              ? `${school.colors.primary}dd`
              : "rgba(255,255,255,0.1)",
            color: school?.colors.secondary ?? "#ffffff",
          }}
        >
          {school?.badgeLabel ?? school?.abbreviation ?? team.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h2 className="text-4xl font-black leading-tight text-white md:text-5xl">
            {team}
          </h2>
          {school && (
            <p className="mt-1 text-sm font-black uppercase tracking-[0.14em] text-white/45">
              {school.mascot}
            </p>
          )}
          {school && (
            <p className="mt-2 text-xs font-bold text-white/45">
              {formatClassification(school.classification)}
              {districtName ? ` · ${districtName}` : ""}
              {record ? ` · ${record}` : ""}
            </p>
          )}
          {score !== undefined && (
            <p className="mt-3 text-5xl font-black text-white">{score}</p>
          )}
        </div>
      </div>
    </div>
  );

  if (!school) return content;

  return <Link href={`/schools/${school.slug}`}>{content}</Link>;
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/60">
      {label}
    </span>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="h-full rounded-xl border border-white/10 bg-black/30 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
        {label}
      </p>
      <p className="mt-2 text-sm font-black text-white/80">{value}</p>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
        {label}
      </p>
      <p className="mt-2 font-black text-white/80">{value}</p>
    </div>
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
