import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getGameById } from "@/lib/games";
import { getSchoolBySlug } from "@/lib/schools";
import { getGameSponsors } from "@/lib/sponsors";
import { getDistrictById } from "@/lib/districts";
import { getMatchupPreviewCopy } from "@/lib/matchup-copy";
import type { UILClassification } from "@/types/platform";
import MatchupInsights from "@/components/MatchupInsights";
import MatchupKeys from "@/components/MatchupKeys";
import MatchupPlayers from "@/components/MatchupPlayers";
import MatchupStorylines from "@/components/MatchupStorylines";
import CommonOpponents from "@/components/CommonOpponents";

type GamePageProps = {
  params: Promise<{ gameId: string }>;
};

const VARSITYVUE_PRIMARY = "#8B1020";
const VARSITYVUE_ACCENT = "#F4EBDD";
const VARSITYVUE_BG = "#050505";

function formatClassification(classification: UILClassification) {
  if (!classification.division) return classification.conference;

  return `${classification.conference} Division ${classification.division === "D1" ? "I" : "II"
    }`;
}

function formatGameDate(kickoff?: string) {
  if (!kickoff) return "TBD";

  if (!kickoff.includes("T")) {
    const [year, month, day] = kickoff.split("-").map(Number);

    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: "America/Chicago",
    }).format(new Date(year, month - 1, day));
  }

  const parsedDate = new Date(kickoff);
  if (Number.isNaN(parsedDate.getTime())) return "TBD";

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/Chicago",
  }).format(parsedDate);
}

function formatGameTime(kickoff?: string) {
  if (!kickoff || !kickoff.includes("T")) return "TBD";

  const parsedDate = new Date(kickoff);
  if (Number.isNaN(parsedDate.getTime())) return "TBD";

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  }).format(parsedDate);
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
  if (gameType === "bye") return "BYE";
  return week === undefined ? "Week TBD" : `Week ${week}`;
}

function getGameNarrative(game: {
  districtGame?: boolean;
  specialEvent?: string;
  gameType: string;
}) {
  if (game.specialEvent) return game.specialEvent;
  if (game.districtGame) return "District stakes on the line";
  if (game.gameType === "scrimmage") return "First look before the lights get real";
  if (game.gameType === "playoff") return "Win or go home";

  return "Friday night matchup";
}

function getGameStorylineDescription(game: {
  awayTeam: string;
  homeTeam: string;
  districtGame?: boolean;
  gameType: string;
}) {
  if (game.gameType === "scrimmage") {
    return `${game.awayTeam} and ${game.homeTeam} get an early measuring-stick matchup before the regular season lights turn all the way on.`;
  }

  if (game.gameType === "playoff") {
    return `${game.awayTeam} and ${game.homeTeam} meet with the season on the line and no room left for a bad night.`;
  }

  if (game.districtGame) {
    return `${game.awayTeam} and ${game.homeTeam} meet in a district matchup with playoff positioning, momentum, and local bragging rights all in play.`;
  }

  return `${game.awayTeam} and ${game.homeTeam} meet in a Friday night matchup built around school pride, momentum, and community attention.`;
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

  if (!game) {
    return {
      title: "Game Not Found | VarsityVue",
    };
  }

  const homeTeamName = game.homeTeam ?? "Home Team";
  const awayTeamName = game.awayTeam ?? "Away Team";

  return {
    title: `${awayTeamName} at ${homeTeamName} | VarsityVue`,
    description: `${awayTeamName} at ${homeTeamName} matchup preview, kickoff details, venue, district implications, and VarsityVue coverage.`,
  };
}

export default async function GamePage({ params }: GamePageProps) {
  const { gameId } = await params;
  const game = getGameById(gameId);

  if (!game) {
    notFound();
  }

  const homeTeamName = game.homeTeam ?? "Home Team";
  const awayTeamName = game.awayTeam ?? "Away Team";
  const kickoffValue = game.kickoff ?? "";
  const venueName = game.venue ?? "Venue TBD";
  const weekNumber = game.week;

  const homeSchool = getSchoolBySlug(game.homeSchoolSlug ?? "");
  const awaySchool = getSchoolBySlug(game.awaySchoolSlug ?? "");

  const primaryColor =
    homeSchool?.colors.primary ??
    awaySchool?.colors.primary ??
    VARSITYVUE_PRIMARY;

  const secondaryColor =
    awaySchool?.colors.primary ??
    homeSchool?.colors.secondary ??
    VARSITYVUE_ACCENT;

  const districtSourceSchool = homeSchool ?? awaySchool;
  const district = districtSourceSchool
    ? getDistrictById(districtSourceSchool.districtId)
    : null;

  const sponsorSchoolId = homeSchool?.id ?? awaySchool?.id;
  const gameSponsors = sponsorSchoolId ? getGameSponsors(sponsorSchoolId) : [];
  const gameSponsor = gameSponsors[0];

  const hasFinalScore =
    game.status === "final" &&
    game.homeScore !== undefined &&
    game.awayScore !== undefined;

  const gameForMap = {
    venue: venueName,
    homeTeam: homeTeamName,
  };

  const sportsEventSchema = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${awayTeamName} at ${homeTeamName}`,
    description: `${awayTeamName} at ${homeTeamName} matchup details, kickoff information, venue, and VarsityVue coverage.`,
    startDate: kickoffValue,
    eventStatus: getSchemaEventStatus(game.status),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: `https://varsityvue.com/games/${game.id}`,
    location: {
      "@type": "Place",
      name: venueName,
    },
    competitor: [
      {
        "@type": "SportsTeam",
        name: awayTeamName,
        url: awaySchool
          ? `https://varsityvue.com/schools/${awaySchool.slug}`
          : undefined,
      },
      {
        "@type": "SportsTeam",
        name: homeTeamName,
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
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(sportsEventSchema),
        }}
      />

      <section
        className="border-b border-white/10 px-4 py-8 sm:px-6 lg:px-8"
        style={{
          background: `
            radial-gradient(circle at top left, ${primaryColor}88 0%, transparent 34%),
            radial-gradient(circle at top right, ${secondaryColor}55 0%, transparent 34%),
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
                <Badge label="VarsityVue Matchup" />
                <Badge label={getGameStatusLabel(game.status)} />
                <Badge label={getGameTypeLabel(game.gameType, weekNumber)} />
                {game.districtGame && <Badge label="District Game" />}
                {game.specialEvent && <Badge label={game.specialEvent} />}
                {game.isNeutralSite && <Badge label="Neutral Site" />}
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="grid gap-8 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
                <TeamBlock
                  align="left"
                  label="Away"
                  team={awayTeamName}
                  school={awaySchool}
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
                  score={hasFinalScore ? game.homeScore : undefined}
                />
              </div>

              <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-black/35 p-5">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--vv-accent)]">
                  Game Center
                </p>

                <h1 className="mt-3 text-3xl font-black leading-tight text-white md:text-5xl">
                  {awayTeamName} at {homeTeamName}
                </h1>

                {district && (
                  <p className="mt-3 text-sm font-black uppercase tracking-[0.18em] text-white/45">
                    {district.name} • {formatClassification(district.classification)}
                  </p>
                )}

                <p className="mt-4 max-w-4xl text-sm leading-6 text-white/70">
                  {getGameStorylineDescription({
                    awayTeam: awayTeamName,
                    homeTeam: homeTeamName,
                    districtGame: game.districtGame,
                    gameType: game.gameType,
                  })}
                </p>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-4">
                <InfoCard label="Date" value={formatGameDate(kickoffValue)} />
                <InfoCard label="Kickoff" value={formatGameTime(kickoffValue)} />

                <a
                  href={getMapUrl(gameForMap)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <InfoCard label="Venue" value={`${venueName} →`} />
                </a>

                <InfoCard
                  label="Coverage"
                  value={
                    game.coverageStatus === "planned"
                      ? "Planned"
                      : game.coverageStatus === "none"
                        ? "Tracking"
                        : "Coverage Active"
                  }
                />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {awaySchool && (
                  <Link
                    href={`/schools/${awaySchool.slug}`}
                    className="rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white/70 transition hover:bg-white/10 hover:text-white"
                  >
                    View {awaySchool.name} Hub →
                  </Link>
                )}

                {homeSchool && (
                  <Link
                    href={`/schools/${homeSchool.slug}`}
                    className="rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white/70 transition hover:bg-white/10 hover:text-white"
                  >
                    View {homeSchool.name} Hub →
                  </Link>
                )}

                {district && (
                  <Link
                    href={`/districts/${district.slug}`}
                    className="rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white/70 transition hover:bg-white/10 hover:text-white"
                  >
                    View District →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1440px] gap-6 lg:grid-cols-[1.35fr_0.75fr]">
          <div className="space-y-6">
            <MatchupInsights
              awaySchoolSlug={game.awaySchoolSlug}
              homeSchoolSlug={game.homeSchoolSlug}
            />

            <MatchupKeys
              awaySchoolSlug={game.awaySchoolSlug}
              homeSchoolSlug={game.homeSchoolSlug}
            />

            <MatchupPlayers
              awaySchoolSlug={game.awaySchoolSlug}
              homeSchoolSlug={game.homeSchoolSlug}
            />

            <MatchupStorylines
              awaySchoolSlug={game.awaySchoolSlug}
              homeSchoolSlug={game.homeSchoolSlug}
            />

            <CommonOpponents
              awaySchoolSlug={game.awaySchoolSlug}
              homeSchoolSlug={game.homeSchoolSlug}
            />

            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-7 shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--vv-accent)]">
                Preview
              </p>

              <h2 className="mt-3 text-3xl font-black text-white">
                Game Preview
              </h2>

              <p className="mt-4 max-w-3xl leading-7 text-white/72">
                {getMatchupPreviewCopy(game)}
              </p>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <MiniCard label="Storyline" value={getGameNarrative(game)} />
                <MiniCard
                  label="District"
                  value={game.districtGame ? "District game" : "Non-district"}
                />
                <MiniCard
                  label="Coverage"
                  value={
                    game.status === "final"
                      ? "Postgame Recap"
                      : game.status === "live"
                        ? "Live Coverage"
                        : "Game Week"
                  }
                />
              </div>
            </section>

<section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-7 shadow-2xl">
  <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--vv-accent)]">
    Coming Soon
  </p>

  <h2 className="mt-3 text-3xl font-black text-white">
    VarsityVue Live
  </h2>

  <p className="mt-4 max-w-3xl leading-7 text-white/72">
    Follow the game as it happens. Live scoring, quarter-by-quarter
    updates, scoring plays, team stats, and player leaders are coming
    to VarsityVue.
  </p>

  <div className="mt-6 flex flex-wrap gap-2">
    <Badge label="Live Scores" />
    <Badge label="Scoring Plays" />
    <Badge label="Team Stats" />
    <Badge label="Player Leaders" />
  </div>
</section>

           <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-7 shadow-2xl">
  <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--vv-accent)]">
    VarsityVue Archives
  </p>

  <h2 className="mt-3 text-3xl font-black text-white">
    Every Season Leaves a Story.
  </h2>

  <p className="mt-4 max-w-3xl leading-7 text-white/72">
    Rivalry history, past meetings, playoff runs, championships, program
    milestones, and the moments communities remember. The VarsityVue
    historical archive is coming soon.
  </p>

  <div className="mt-6 flex flex-wrap gap-2">
    <Badge label="Past Meetings" />
    <Badge label="Playoff History" />
    <Badge label="Championships" />
    <Badge label="Program Milestones" />
  </div>
</section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[1.75rem] border border-[color:var(--vv-primary)]/40 bg-gradient-to-br from-[var(--vv-primary)]/45 via-black to-black p-7 shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--vv-accent-soft)]">
                Game Sponsor
              </p>

              <h2 className="mt-3 text-3xl font-black text-white">
                {gameSponsor
                  ? `Presented by ${gameSponsor.name}`
                  : "Own this matchup."}
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/55">
                Sponsor premium VarsityVue game coverage seen by fans, families,
                schools, and local communities throughout the football season.
              </p>

              <Link
                href="/sponsor-inquiry"
                className="mt-6 block rounded-xl border border-white/15 bg-white/10 px-5 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/15"
              >
                Sponsor This Game →
              </Link>
            </section>

            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-7 shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--vv-accent)]">
                Game Night Utility
              </p>

              <h2 className="mt-3 text-3xl font-black text-white">
                Everything fans need before kickoff.
              </h2>

              <div className="mt-5 flex flex-col gap-3">
                <LinkButton href="/scoreboard" label="Game Night Scoreboard" />

                {district && (
                  <LinkButton
                    href={`/districts/${district.slug}`}
                    label="District Standings"
                  />
                )}

                <a
                  href={getMapUrl(gameForMap)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-black text-white/75 transition hover:bg-white/10 hover:text-white"
                >
                  Open Venue Map
                </a>

                <LinkButton href="/coverage" label="Game Week Coverage" />
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
      className={`h-full rounded-[1.75rem] border border-white/10 bg-black/35 p-7 transition hover:bg-white/[0.055] ${align === "right" ? "text-left lg:text-right" : "text-left"
        }`}
    >
      <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">
        {label}
      </p>

      <div
        className={`mt-4 flex items-center gap-6 ${align === "right" ? "lg:flex-row-reverse" : ""
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
          {school?.badgeLabel ??
            school?.abbreviation ??
            team.slice(0, 2).toUpperCase()}
        </div>

        <div>
          <h2 className="text-4xl font-black leading-tight text-white md:text-5xl">
            {team}
          </h2>

          {school && (
            <>
              <p className="mt-1 text-sm font-black uppercase tracking-[0.14em] text-white/45">
                {school.mascot}
              </p>

              <p className="mt-2 text-xs font-bold text-white/45">
                {formatClassification(school.classification)}
              </p>

              <div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/70 transition hover:bg-white/15 hover:text-white">
                View School Hub →
              </div>
            </>
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