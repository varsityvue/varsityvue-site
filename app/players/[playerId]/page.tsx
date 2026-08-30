import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getDistrictById } from "@/lib/districts";
import { getPlayerGameLog } from "@/lib/player-game-log";
import { getPlayerProfile } from "@/lib/player-profiles";
import {
  getPassingLeaders,
  getPlayerSeasonStat,
  getReceivingLeaders,
  getRushingLeaders,
} from "@/lib/player-stats";
import { getSchoolBySlug } from "@/lib/schools";

const SEASON = 2026;

type Props = {
  params: Promise<{ playerId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { playerId } = await params;
  const player = getPlayerSeasonStat(playerId, SEASON);
  if (!player) return { title: "Player Not Found | VarsityVue" };

  const school = getSchoolBySlug(player.schoolSlug);
  const profile = getPlayerProfile(playerId, SEASON);
  const position = profile?.positions?.length ? ` ${profile.positions.join("/")}` : "";
  return {
    title: `${player.player} 2026 Football Stats | VarsityVue`,
    description: `${player.player}${position} ${SEASON} football season statistics, weekly game log, and leaderboard rankings for ${school?.name ?? player.schoolSlug}.`,
  };
}

export default async function PlayerPage({ params }: Props) {
  const { playerId } = await params;
  const player = getPlayerSeasonStat(playerId, SEASON);
  if (!player) notFound();

  const school = getSchoolBySlug(player.schoolSlug);
  const district = school ? getDistrictById(school.districtId) : undefined;
  const profile = getPlayerProfile(playerId, SEASON);
  const gameLog = getPlayerGameLog(playerId, SEASON);

  const areaRushingRank = rankOf(getRushingLeaders({ season: SEASON, minAttempts: 1 }), playerId);
  const districtRushingRank = district
    ? rankOf(getRushingLeaders({ season: SEASON, districtId: district.id, minAttempts: 1 }), playerId)
    : undefined;
  const areaPassingRank = rankOf(getPassingLeaders({ season: SEASON, minAttempts: 1 }), playerId);
  const areaReceivingRank = rankOf(getReceivingLeaders({ season: SEASON, minReceptions: 1 }), playerId);

  const primary = school?.colors.primary ?? "#8B1020";
  const secondary = school?.colors.secondary ?? "#F4EBDD";

  const rosterDetails = profile
    ? [
        profile.jerseyNumber ? { label: "Number", value: `#${profile.jerseyNumber}` } : undefined,
        profile.grade ? { label: "Class", value: profile.grade } : undefined,
        profile.positions?.length ? { label: "Position", value: profile.positions.join(" / ") } : undefined,
        profile.height ? { label: "Height", value: profile.height } : undefined,
        profile.weight ? { label: "Weight", value: `${profile.weight} lbs` } : undefined,
        profile.hometown ? { label: "Hometown", value: profile.hometown } : undefined,
      ].filter((detail): detail is { label: string; value: string } => Boolean(detail))
    : [];

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section
        className="border-b border-white/10 px-4 py-10 sm:px-6 lg:px-8"
        style={{
          background: `radial-gradient(circle at top left, ${primary}66 0%, transparent 35%), radial-gradient(circle at top right, ${secondary}33 0%, transparent 30%), linear-gradient(120deg, #050505 0%, #090909 50%, #000 100%)`,
        }}
      >
        <div className="mx-auto max-w-7xl">
          <Link href="/stats" className="text-xs font-black uppercase tracking-[0.16em] text-white/45 transition hover:text-white">
            ← Stat Leaders
          </Link>

          <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em]" style={{ color: secondary }}>
                {SEASON} Player Profile
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <h1 className="text-5xl font-black sm:text-6xl">{player.player}</h1>
                {profile?.jerseyNumber && (
                  <span className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xl font-black text-white/70">
                    #{profile.jerseyNumber}
                  </span>
                )}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/55">
                {school && (
                  <Link href={`/schools/${school.slug}`} className="font-black text-white/80 transition hover:text-white">
                    {school.fullName}
                  </Link>
                )}
                {profile?.positions?.length && (
                  <>
                    <span className="text-white/20">•</span>
                    <span>{profile.positions.join(" / ")}</span>
                  </>
                )}
                {profile?.grade && (
                  <>
                    <span className="text-white/20">•</span>
                    <span>{profile.grade}</span>
                  </>
                )}
                {district && (
                  <>
                    <span className="text-white/20">•</span>
                    <Link href={`/stats/districts/${district.slug}`} className="transition hover:text-white">
                      {district.name}
                    </Link>
                  </>
                )}
                <span className="text-white/20">•</span>
                <span>{player.gamesRecorded} game{player.gamesRecorded === 1 ? "" : "s"} recorded</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/35 px-5 py-4 text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Season</p>
              <p className="mt-1 text-3xl font-black">{SEASON}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {rosterDetails.length > 0 && (
            <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045] shadow-2xl">
              <div className="h-1.5" style={{ backgroundColor: primary }} />
              <div className="p-6 md:p-7">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-white/40">Verified Roster Profile</p>
                    <h2 className="mt-2 text-3xl font-black">Player information</h2>
                  </div>
                  <span className="rounded-full border border-white/10 bg-black/30 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/45">
                    Verified
                  </span>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {rosterDetails.map((detail) => (
                    <div key={detail.label} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">{detail.label}</p>
                      <p className="mt-2 text-xl font-black text-white">{detail.value}</p>
                    </div>
                  ))}
                </div>
                {profile?.bio && <p className="mt-6 max-w-4xl text-sm leading-7 text-white/55">{profile.bio}</p>}
              </div>
            </section>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              label="Rushing"
              headline={`${player.rushing.yards.toLocaleString()} yards`}
              details={`${player.rushing.attempts} carries · ${player.rushing.touchdowns} TD · ${player.rushing.yardsPerCarry} YPC`}
              active={player.rushing.attempts > 0}
            />
            <StatCard
              label="Passing"
              headline={`${player.passing.yards.toLocaleString()} yards`}
              details={`${player.passing.completions}/${player.passing.attempts} · ${player.passing.touchdowns} TD · ${player.passing.interceptions} INT · ${player.passing.completionPercentage}%`}
              active={player.passing.attempts > 0}
            />
            <StatCard
              label="Receiving"
              headline={`${player.receiving.yards.toLocaleString()} yards`}
              details={`${player.receiving.receptions} receptions · ${player.receiving.touchdowns} TD · ${player.receiving.yardsPerReception} YPR`}
              active={player.receiving.receptions > 0}
            />
          </div>

          <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045] shadow-2xl">
            <div className="h-1.5" style={{ backgroundColor: primary }} />
            <div className="p-6 md:p-7">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/40">Current Rankings</p>
              <h2 className="mt-2 text-3xl font-black">Where {player.player.split(" ")[0]} stands</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <RankCard label="Area Rushing" rank={areaRushingRank} />
                <RankCard label="District Rushing" rank={districtRushingRank} />
                <RankCard label="Area Passing" rank={areaPassingRank} />
                <RankCard label="Area Receiving" rank={areaReceivingRank} />
              </div>
              <p className="mt-5 text-xs leading-5 text-white/35">
                Rankings reflect only verified statistics currently loaded into VarsityVue and will change as more programs and weeks are added.
              </p>
            </div>
          </section>

          <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045] shadow-2xl">
            <div className="p-6 md:p-7">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-white/40">Weekly Game Log</p>
                  <h2 className="mt-2 text-3xl font-black">{SEASON} performances</h2>
                </div>
                {school && (
                  <Link href={`/schools/${school.slug}`} className="text-xs font-black uppercase tracking-[0.14em] text-white/50 transition hover:text-white">
                    {school.name} Hub →
                  </Link>
                )}
              </div>

              {gameLog.length > 0 ? (
                <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-black/30">
                  <table className="w-full min-w-[980px] text-sm">
                    <thead className="border-b border-white/10 text-[10px] font-black uppercase tracking-[0.12em] text-white/35">
                      <tr>
                        <th className="px-4 py-3 text-left">Week</th>
                        <th className="px-4 py-3 text-left">Opponent</th>
                        <th className="px-4 py-3 text-left">Result</th>
                        <th className="px-4 py-3 text-left">Rush</th>
                        <th className="px-4 py-3 text-left">Pass</th>
                        <th className="px-4 py-3 text-left">Rec</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gameLog.map((entry) => (
                        <tr key={entry.gameId} className="border-t border-white/5 first:border-0">
                          <td className="px-4 py-4 font-black text-white/45">{entry.week ?? "—"}</td>
                          <td className="px-4 py-4">
                            <Link href={`/games/${entry.gameId}`} className="font-black text-white/80 transition hover:text-white">
                              {entry.opponent}
                            </Link>
                          </td>
                          <td className="px-4 py-4 font-black text-white/65">{entry.result ?? "—"}</td>
                          <td className="px-4 py-4 text-white/65">{formatRushing(entry.rushing)}</td>
                          <td className="px-4 py-4 text-white/65">{formatPassing(entry.passing)}</td>
                          <td className="px-4 py-4 text-white/65">{formatReceiving(entry.receiving)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-6 text-sm text-white/40">No weekly game log is available yet.</p>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function rankOf(entries: { playerId: string }[], playerId: string) {
  const index = entries.findIndex((entry) => entry.playerId === playerId);
  return index >= 0 ? index + 1 : undefined;
}

function StatCard({ label, headline, details, active }: { label: string; headline: string; details: string; active: boolean }) {
  return (
    <div className={`rounded-[1.5rem] border p-5 shadow-xl ${active ? "border-white/10 bg-white/[0.045]" : "border-white/5 bg-white/[0.02] opacity-55"}`}>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{headline}</p>
      <p className="mt-2 text-sm text-white/45">{details}</p>
    </div>
  );
}

function RankCard({ label, rank }: { label: string; rank?: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">{label}</p>
      <p className="mt-2 text-3xl font-black">{rank ? `#${rank}` : "—"}</p>
    </div>
  );
}

function formatRushing(line?: { attempts: number; yards: number; touchdowns: number; yardsPerCarry: number }) {
  if (!line) return "—";
  return `${line.attempts} car, ${line.yards} yds, ${line.touchdowns} TD`;
}

function formatPassing(line?: { completions: number; attempts: number; yards: number; touchdowns: number; interceptions: number }) {
  if (!line) return "—";
  return `${line.completions}/${line.attempts}, ${line.yards} yds, ${line.touchdowns} TD`;
}

function formatReceiving(line?: { receptions: number; yards: number; touchdowns: number }) {
  if (!line) return "—";
  return `${line.receptions} rec, ${line.yards} yds, ${line.touchdowns} TD`;
}
