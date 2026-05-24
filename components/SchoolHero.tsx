import Link from "next/link";
import type { School, UILClassification } from "@/types/platform";
import { getUpcomingGamesForSchool } from "@/data/games";

function formatClassification(classification: UILClassification) {
  if (!classification.division) return classification.conference;

  return `${classification.conference} Division ${
    classification.division === "D1" ? "I" : "II"
  }`;
}

function formatRegion(region: 1 | 2 | 3 | 4) {
  return {
    1: "Region I",
    2: "Region II",
    3: "Region III",
    4: "Region IV",
  }[region];
}

function formatDistrictName(districtId: string) {
  const match = districtId.match(/district-(\d+)/i);

  if (match?.[1]) {
    return `District ${match[1]}`;
  }

  return districtId
    .replaceAll("-", " ")
    .replace("d1", "Division I")
    .replace("d2", "Division II")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

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

export default function SchoolHero({ school }: { school: School }) {
  const upcomingGames = getUpcomingGamesForSchool(school.slug);
  const nextGame = upcomingGames[0];

  const classification = formatClassification(school.classification);
  const region = formatRegion(school.uilRegion);
  const districtName = formatDistrictName(school.districtId);

  return (
    <section
      className="relative overflow-hidden border-b border-white/10 text-white"
      style={{
        background: `
          radial-gradient(circle at top left, ${school.colors.primary}aa 0%, transparent 34%),
          radial-gradient(circle at top right, ${school.colors.secondary}33 0%, transparent 32%),
          linear-gradient(120deg, ${school.colors.primary}88 0%, #080808 48%, #000 100%)
        `,
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.7),rgba(0,0,0,0.1))]" />

      <div className="relative mx-auto grid min-h-[460px] max-w-[1440px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.18fr_0.82fr] lg:px-8">
        <div className="flex flex-col justify-between">
          <div>
            <Link
              href="/schools"
              className="inline-flex text-xs font-black uppercase tracking-[0.18em] text-white/50 transition hover:text-white"
            >
              ← School Directory
            </Link>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <p className="inline-flex rounded bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.24em] text-white/75">
                VarsityVue School Hub
              </p>

              <p className="text-xs font-black uppercase tracking-[0.22em] text-white/35">
                2026 Football Coverage
              </p>
            </div>

            <div className="mt-8 flex items-center gap-5">
           <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-white/10 bg-white/10 text-2xl font-black text-white">
  {school.abbreviation ?? school.name.slice(0, 2).toUpperCase()}
</div>

              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-white/45">
                  {school.mascot}
                </p>

                <h1 className="mt-2 text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
                  {school.name}
                </h1>
              </div>
            </div>

            <p className="mt-7 max-w-3xl text-base leading-7 text-white/65 sm:text-lg">
              Schedules, scores, standings, matchup coverage, sponsor support,
              and school-centered football coverage powered by VarsityVue.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <MetaBadge label={classification} />
              <MetaBadge label={region} />
              <MetaBadge label={districtName} />

              <Link
                href={`/districts/${school.districtId}`}
                className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-white/15"
              >
                District Hub →
              </Link>

              <Link
                href={`/schools/${school.slug}/schedule`}
                className="rounded-full border border-white/15 bg-white/[0.08] px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-white/15"
              >
                Full Schedule
              </Link>
            </div>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <Stat value={classification} label="Class" />
            <Stat value={districtName} label="District" />
            <Stat value="2026" label="Season" />
          </div>
        </div>

        <div className="flex items-end">
          <div className="w-full rounded-[1.75rem] border border-white/10 bg-black/45 p-6 shadow-2xl backdrop-blur-sm">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d65a6d]">
              Next Matchup
            </p>

            {nextGame ? (
              <>
                <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">
                  {nextGame.awayTeam} at {nextGame.homeTeam}
                </h2>

                <div className="mt-7 grid grid-cols-3 items-center gap-3 text-center">
                  <TeamBadge team={nextGame.awayTeam} />
                  <div className="text-2xl font-black text-white/30">VS</div>
                  <TeamBadge team={nextGame.homeTeam} />
                </div>

                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  <InfoCard label="Date" value={formatGameDate(nextGame.kickoff)} />
                  <InfoCard label="Kickoff" value={formatGameTime(nextGame.kickoff)} />
                  <InfoCard label="Venue" value={nextGame.venue} />
                  <InfoCard
                    label="Week"
                    value={
                      nextGame.gameType === "playoff"
                        ? "Playoff"
                        : `Week ${nextGame.week}`
                    }
                  />
                </div>

                <Link
                  href={`/games/${nextGame.id}`}
                  className="mt-6 block rounded-xl border border-white/10 bg-white/10 px-5 py-4 text-center text-sm font-black uppercase tracking-[0.14em] transition hover:bg-white/15"
                >
                  View Matchup →
                </Link>
              </>
            ) : (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-6 text-white/55">
                2026 schedule updates coming soon.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function MetaBadge({ label }: { label: string }) {
  return (
    <div className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white/85">
      {label}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
      <p className="text-xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/35">
        {label}
      </p>
    </div>
  );
}

function TeamBadge({ team }: { team: string }) {
  return (
    <div className="flex min-h-24 items-center justify-center rounded-2xl border border-white/10 bg-white/10 p-4 text-center text-sm font-black text-white">
      {team}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-white/35">
        {label}
      </p>
      <p className="mt-2 font-bold text-white">{value}</p>
    </div>
  );
}