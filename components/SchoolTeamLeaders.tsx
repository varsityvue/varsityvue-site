import Link from "next/link";

import {
  getPassingLeaders,
  getReceivingLeaders,
  getRushingLeaders,
} from "@/lib/player-stats";

type SchoolTeamLeadersProps = {
  schoolSlug: string;
  season?: number;
  primaryColor?: string;
  secondaryColor?: string;
};

export default function SchoolTeamLeaders({
  schoolSlug,
  season = 2026,
  primaryColor = "#8B1020",
  secondaryColor = "#F4EBDD",
}: SchoolTeamLeadersProps) {
  const rushing = getRushingLeaders({ season, schoolSlug, minAttempts: 1 }).slice(0, 3);
  const passing = getPassingLeaders({ season, schoolSlug, minAttempts: 1 }).slice(0, 3);
  const receiving = getReceivingLeaders({ season, schoolSlug, minReceptions: 1 }).slice(0, 3);

  if (!rushing.length && !passing.length && !receiving.length) return null;

  return (
    <section
      className="overflow-hidden rounded-[1.75rem] border shadow-2xl"
      style={{
        borderColor: `${primaryColor}55`,
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.055), rgba(0,0,0,0.94) 48%, rgba(0,0,0,1))",
        boxShadow: `inset 4px 0 0 ${primaryColor}, 0 18px 50px rgba(0,0,0,0.45)`,
      }}
    >
      <div className="p-6 md:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em]" style={{ color: secondaryColor }}>
              {season} Team Leaders
            </p>
            <h2 className="mt-3 text-3xl font-black text-white">Verified stat leaders</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
              Season totals from verified game statistics currently on file for this program.
            </p>
          </div>
          <Link
            href="/stats"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white/65 transition hover:bg-white/10 hover:text-white"
          >
            View Stat Leaders →
          </Link>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <LeaderCard
            title="Rushing"
            leaders={rushing.map((entry) => ({
              id: entry.playerId,
              name: entry.player,
              primary: `${entry.rushing.yards.toLocaleString()} yds`,
              secondary: `${entry.rushing.attempts} car · ${entry.rushing.touchdowns} TD · ${entry.rushing.yardsPerCarry} YPC · ${entry.gamesRecorded} G`,
            }))}
          />
          <LeaderCard
            title="Passing"
            leaders={passing.map((entry) => ({
              id: entry.playerId,
              name: entry.player,
              primary: `${entry.passing.yards.toLocaleString()} yds`,
              secondary: `${entry.passing.completions}/${entry.passing.attempts} · ${entry.passing.touchdowns} TD · ${entry.passing.interceptions} INT · ${entry.gamesRecorded} G`,
            }))}
          />
          <LeaderCard
            title="Receiving"
            leaders={receiving.map((entry) => ({
              id: entry.playerId,
              name: entry.player,
              primary: `${entry.receiving.yards.toLocaleString()} yds`,
              secondary: `${entry.receiving.receptions} rec · ${entry.receiving.touchdowns} TD · ${entry.receiving.yardsPerReception} YPR · ${entry.gamesRecorded} G`,
            }))}
          />
        </div>
      </div>
    </section>
  );
}

function LeaderCard({
  title,
  leaders,
}: {
  title: string;
  leaders: { id: string; name: string; primary: string; secondary: string }[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/35">
      <div className="border-b border-white/10 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-white/70">
        {title}
      </div>
      {leaders.length ? (
        <div className="divide-y divide-white/5">
          {leaders.map((leader, index) => (
            <div key={leader.id} className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 px-4 py-4 transition hover:bg-white/[0.03]">
              <span className="text-lg font-black text-white/25">{index + 1}</span>
              <div className="min-w-0">
                <Link href={`/players/${leader.id}`} className="truncate font-black text-white transition hover:text-white/70">
                  {leader.name}
                </Link>
                <p className="mt-1 text-xs text-white/40">{leader.secondary}</p>
              </div>
              <span className="text-right text-sm font-black text-white/80">{leader.primary}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="px-4 py-6 text-sm text-white/35">No verified statistics are on file for this category yet.</p>
      )}
    </div>
  );
}
