import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getDistrictById } from "@/lib/districts";
import { getPlayerGameLog } from "@/lib/player-game-log";
import { getPlayerProfile } from "@/lib/player-profiles";
import { getPassingLeaders, getPlayerSeasonStat, getReceivingLeaders, getRushingLeaders } from "@/lib/player-stats";
import { getSchoolBySlug } from "@/lib/schools";

const SEASON = 2026;
type Props = { params: Promise<{ playerId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { playerId } = await params;
  const player = getPlayerSeasonStat(playerId, SEASON);
  if (!player) return { title: "Player Not Found | VarsityVue" };

  const school = getSchoolBySlug(player.schoolSlug);
  const profile = getPlayerProfile(playerId, SEASON);
  const position = profile?.positions?.length ? ` ${profile.positions.join("/")}` : "";
  const hasStats = player.gamesRecorded > 0;

  return {
    title: `${player.player} 2026 Football Profile | VarsityVue`,
    description: hasStats
      ? `${player.player}${position} ${SEASON} football profile, verified statistics, and game log currently on file for ${school?.name ?? player.schoolSlug}.`
      : `${player.player}${position} ${SEASON} football roster profile for ${school?.name ?? player.schoolSlug}, with verified player information currently on file.`,
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

  const rushingRank = rankOf(getRushingLeaders({ season: SEASON, minAttempts: 1 }), playerId);
  const districtRushingRank = district ? rankOf(getRushingLeaders({ season: SEASON, districtId: district.id, minAttempts: 1 }), playerId) : undefined;
  const passingRank = rankOf(getPassingLeaders({ season: SEASON, minAttempts: 1 }), playerId);
  const receivingRank = rankOf(getReceivingLeaders({ season: SEASON, minReceptions: 1 }), playerId);
  const hasStats = player.gamesRecorded > 0;

  const primary = school?.colors.primary ?? "#8B1020";
  const secondary = school?.colors.secondary ?? "#F4EBDD";
  const rosterDetails = profile ? [
    profile.jerseyNumber ? { label: "Number", value: `#${profile.jerseyNumber}` } : undefined,
    profile.grade ? { label: "Class", value: profile.grade } : undefined,
    profile.positions?.length ? { label: "Position", value: profile.positions.join(" / ") } : undefined,
  ].filter((detail): detail is { label: string; value: string } => Boolean(detail)) : [];

  const backHref = school ? `/schools/${school.slug}/roster` : "/stats";
  const backLabel = school ? `${school.name} Roster` : "Stat Leaders";

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="border-b border-white/10 px-4 py-10 sm:px-6 lg:px-8" style={{ background: `radial-gradient(circle at top left, ${primary}66 0%, transparent 35%), radial-gradient(circle at top right, ${secondary}33 0%, transparent 30%), linear-gradient(120deg, #050505 0%, #090909 50%, #000 100%)` }}>
        <div className="mx-auto max-w-7xl">
          <Link href={backHref} className="text-xs font-black uppercase tracking-[0.16em] text-white/45 transition hover:text-white">← {backLabel}</Link>
          <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em]" style={{ color: secondary }}>{SEASON} Player Profile</p>
              <div className="mt-3 flex flex-wrap items-center gap-4"><h1 className="text-5xl font-black sm:text-6xl">{player.player}</h1>{profile?.jerseyNumber && <span className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xl font-black text-white/70">#{profile.jerseyNumber}</span>}</div>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/55">
                {school && <Link href={`/schools/${school.slug}`} className="font-black text-white/80 transition hover:text-white">{school.fullName}</Link>}
                {profile?.positions?.length && <><span className="text-white/20">•</span><span>{profile.positions.join(" / ")}</span></>}
                {profile?.grade && <><span className="text-white/20">•</span><span>{profile.grade}</span></>}
                {district && <><span className="text-white/20">•</span><Link href={`/stats/districts/${district.slug}`} className="transition hover:text-white">{district.name}</Link></>}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/35 px-5 py-4 text-right"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Verified games on file</p><p className="mt-1 text-3xl font-black">{player.gamesRecorded}</p></div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"><p className="text-xs font-black uppercase tracking-[0.18em] text-white/40">2026 data status</p><p className="mt-2 max-w-4xl text-sm leading-6 text-white/55">{hasStats ? `Season totals below are calculated from ${player.gamesRecorded} verified game${player.gamesRecorded === 1 ? "" : "s"} currently on file. Additional games will be added as verified statistics become available.` : "This player has a verified roster profile, but no verified game statistics are on file yet. Statistical sections will populate as game reports become available."}</p></div>

        {rosterDetails.length > 0 && <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045] shadow-2xl"><div className="h-1.5" style={{ backgroundColor: primary }} /><div className="p-6 md:p-7"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.28em] text-white/40">Verified Roster Profile</p><h2 className="mt-2 text-3xl font-black">Player information</h2></div><span className="rounded-full border border-white/10 bg-black/30 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/45">Verified</span></div><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{rosterDetails.map((detail) => <div key={detail.label} className="rounded-2xl border border-white/10 bg-black/30 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">{detail.label}</p><p className="mt-2 text-xl font-black text-white">{detail.value}</p></div>)}</div>{profile?.bio && <p className="mt-6 max-w-4xl text-sm leading-7 text-white/55">{profile.bio}</p>}</div></section>}

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Rushing" headline={player.rushing.attempts > 0 ? `${player.rushing.yards.toLocaleString()} yards` : "No stats on file"} details={player.rushing.attempts > 0 ? `${player.rushing.attempts} carries · ${player.rushing.touchdowns} TD · ${player.rushing.yardsPerCarry} YPC` : "Rushing totals will appear when verified."} active={player.rushing.attempts > 0} />
          <StatCard label="Passing" headline={player.passing.attempts > 0 ? `${player.passing.yards.toLocaleString()} yards` : "No stats on file"} details={player.passing.attempts > 0 ? `${player.passing.completions}/${player.passing.attempts} · ${player.passing.touchdowns} TD · ${player.passing.interceptions} INT · ${player.passing.completionPercentage}%` : "Passing totals will appear when verified."} active={player.passing.attempts > 0} />
          <StatCard label="Receiving" headline={player.receiving.receptions > 0 ? `${player.receiving.yards.toLocaleString()} yards` : "No stats on file"} details={player.receiving.receptions > 0 ? `${player.receiving.receptions} receptions · ${player.receiving.touchdowns} TD · ${player.receiving.yardsPerReception} YPR` : "Receiving totals will appear when verified."} active={player.receiving.receptions > 0} />
        </div>

        {hasStats && <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045] shadow-2xl"><div className="h-1.5" style={{ backgroundColor: primary }} /><div className="p-6 md:p-7"><p className="text-xs font-black uppercase tracking-[0.28em] text-white/40">Rankings From Stats On File</p><h2 className="mt-2 text-3xl font-black">Current VarsityVue rankings</h2><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><RankCard label="Rushing" rank={rushingRank} /><RankCard label="District Rushing" rank={districtRushingRank} /><RankCard label="Passing" rank={passingRank} /><RankCard label="Receiving" rank={receivingRank} /></div><p className="mt-5 text-xs leading-5 text-white/35">These positions compare only players represented in verified statistics currently on file. They are not complete area- or district-wide rankings until all programs are represented.</p></div></section>}

        <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045] shadow-2xl"><div className="p-6 md:p-7"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.28em] text-white/40">Weekly Game Log</p><h2 className="mt-2 text-3xl font-black">{SEASON} performances</h2></div>{school && <Link href={`/schools/${school.slug}`} className="text-xs font-black uppercase tracking-[0.14em] text-white/50 transition hover:text-white">{school.name} Hub →</Link>}</div>
          {gameLog.length > 0 ? <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-black/30"><table className="w-full min-w-[980px] text-sm"><thead className="border-b border-white/10 text-[10px] font-black uppercase tracking-[0.12em] text-white/35"><tr><th className="px-4 py-3 text-left">Week</th><th className="px-4 py-3 text-left">Opponent</th><th className="px-4 py-3 text-left">Result</th><th className="px-4 py-3 text-left">Rush</th><th className="px-4 py-3 text-left">Pass</th><th className="px-4 py-3 text-left">Rec</th></tr></thead><tbody>{gameLog.map((entry) => <tr key={entry.gameId} className="border-t border-white/5 first:border-0 transition hover:bg-white/[0.035]"><td className="px-4 py-4 font-black text-white/45">{entry.week ?? "—"}</td><td className="px-4 py-4"><Link href={`/games/${entry.gameId}`} className="font-black text-white/80 transition hover:text-white">{entry.opponent}</Link></td><td className="px-4 py-4 font-black text-white/65">{entry.result ?? "—"}</td><td className="px-4 py-4 text-white/65">{formatRushing(entry.rushing)}</td><td className="px-4 py-4 text-white/65">{formatPassing(entry.passing)}</td><td className="px-4 py-4 text-white/65">{formatReceiving(entry.receiving)}</td></tr>)}</tbody></table></div> : <p className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-6 text-sm text-white/40">No verified weekly game statistics are on file yet.</p>}
        </div></section>
      </div></section>
    </main>
  );
}

function rankOf(entries: { playerId: string }[], playerId: string) { const index = entries.findIndex((entry) => entry.playerId === playerId); return index >= 0 ? index + 1 : undefined; }
function StatCard({ label, headline, details, active }: { label: string; headline: string; details: string; active: boolean }) { return <div className={`rounded-[1.5rem] border p-5 shadow-xl ${active ? "border-white/10 bg-white/[0.045]" : "border-white/5 bg-white/[0.02]"}`}><p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">{label}</p><p className={`mt-3 font-black text-white ${active ? "text-3xl" : "text-xl text-white/55"}`}>{headline}</p><p className="mt-2 text-sm text-white/45">{details}</p></div>; }
function RankCard({ label, rank }: { label: string; rank?: number }) { return <div className="rounded-2xl border border-white/10 bg-black/30 p-5"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">{label}</p><p className="mt-2 text-3xl font-black">{rank ? `#${rank}` : "—"}</p></div>; }
function formatRushing(line?: { attempts: number; yards: number; touchdowns: number; yardsPerCarry: number }) { if (!line || line.attempts === 0) return "—"; return `${line.attempts} car, ${line.yards} yds, ${line.touchdowns} TD`; }
function formatPassing(line?: { completions: number; attempts: number; yards: number; touchdowns: number; interceptions: number }) { if (!line || line.attempts === 0) return "—"; return `${line.completions}/${line.attempts}, ${line.yards} yds, ${line.touchdowns} TD`; }
function formatReceiving(line?: { receptions: number; yards: number; touchdowns: number }) { if (!line || line.receptions === 0) return "—"; return `${line.receptions} rec, ${line.yards} yds, ${line.touchdowns} TD`; }
