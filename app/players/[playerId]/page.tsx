import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getDistrictById } from "@/lib/districts";
import { getPlayerGameLog } from "@/lib/player-game-log";
import { getPlayerProfile } from "@/lib/player-profiles";
import { getPassingLeaders, getPlayerSeasonStat, getReceivingLeaders, getRushingLeaders } from "@/lib/player-stats";
import { getSchoolBySlug } from "@/lib/schools";
import { formatTouchdownDetail } from "@/lib/stat-values";
import StatCompletenessBadge from "@/components/StatCompletenessBadge";
import type { StatCompletenessDetail } from "@/data/game-stats";

const SEASON = 2026;
type Props = { params: Promise<{ playerId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { playerId } = await params;
  const player = getPlayerSeasonStat(playerId, SEASON);
  if (!player) return { title: "Player Not Found" };

  const school = getSchoolBySlug(player.schoolSlug);
  const profile = getPlayerProfile(playerId, SEASON);
  const position = profile?.positions?.length ? ` ${profile.positions.join("/")}` : "";
  const hasStats = player.gamesRecorded > 0;

  return {
    title: `${player.player} 2026 Football Profile`,
    description: hasStats
      ? `${player.player}${position} ${SEASON} football profile, verified statistics, and game log currently on file for ${school?.name ?? player.schoolSlug}.`
      : `${player.player}${position} ${SEASON} football roster profile for ${school?.name ?? player.schoolSlug}, with verified player information currently on file.`,
    alternates: {
      canonical: `/players/${playerId}`,
    },
  };
}

export default async function PlayerPage({ params }: Props) {
  const { playerId } = await params;
  const player = getPlayerSeasonStat(playerId, SEASON);
  if (!player) notFound();

  const school = getSchoolBySlug(player.schoolSlug);
  const district = school ? getDistrictById(school.districtId) : undefined;
  const profile = getPlayerProfile(playerId, SEASON);
  const gameLog = await getPlayerGameLog(playerId, SEASON);

  const rushingRank = rankOf(getRushingLeaders({ season: SEASON, minAttempts: 1 }), playerId);
  const districtRushingRank = district ? rankOf(getRushingLeaders({ season: SEASON, districtId: district.id, minAttempts: 1 }), playerId) : undefined;
  const passingRank = rankOf(getPassingLeaders({ season: SEASON, minAttempts: 1 }), playerId);
  const receivingRank = rankOf(getReceivingLeaders({ season: SEASON, minReceptions: 1 }), playerId);
  const hasStats = player.gamesRecorded > 0;

  const primary = school?.colors.primary ?? "#8B1020";
  const secondary = school?.colors.secondary ?? "#F4EBDD";
  const backHref = school ? `/schools/${school.slug}/roster` : "/stats";
  const backLabel = school ? `${school.name} Roster` : "Stat Leaders";

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="border-b border-white/10 px-4 py-6 sm:px-6 sm:py-10 lg:px-8" style={{ background: `radial-gradient(circle at top left, ${primary}66 0%, transparent 35%), radial-gradient(circle at top right, ${secondary}33 0%, transparent 30%), linear-gradient(120deg, #050505 0%, #090909 50%, #000 100%)` }}>
        <div className="mx-auto max-w-7xl">
          <Link href={backHref} className="text-[9px] font-black uppercase tracking-[0.13em] text-white/45 transition hover:text-white sm:text-xs sm:tracking-[0.16em]">← {backLabel}</Link>
          <div className="mt-4 grid gap-4 sm:mt-7 sm:gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] sm:text-xs sm:tracking-[0.28em]" style={{ color: secondary }}>{SEASON} Player Profile</p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2.5 sm:mt-3 sm:gap-4"><h1 className="break-words text-3xl font-black leading-tight sm:text-6xl">{player.player}</h1>{profile?.jerseyNumber && <span className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-base font-black text-white/70 sm:rounded-xl sm:px-3 sm:py-2 sm:text-xl">#{profile.jerseyNumber}</span>}</div>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-white/55 sm:mt-4 sm:gap-3 sm:text-sm">
                {school && <Link href={`/schools/${school.slug}`} className="font-black text-white/80 transition hover:text-white">{school.fullName}</Link>}
                {profile?.positions?.length && <><span className="text-white/20">•</span><span>{profile.positions.join(" / ")}</span></>}
                {profile?.grade && <><span className="text-white/20">•</span><span>{profile.grade}</span></>}
                {district && <><span className="text-white/20">•</span><Link href={`/stats/districts/${district.slug}`} className="transition hover:text-white">{district.name}</Link></>}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/35 px-3.5 py-2.5 sm:block sm:rounded-2xl sm:px-5 sm:py-4 sm:text-right"><p className="text-[8px] font-black uppercase tracking-[0.12em] text-white/35 sm:text-[10px] sm:tracking-[0.18em]">Verified games on file</p><p className="text-2xl font-black sm:mt-1 sm:text-3xl">{player.gamesRecorded}</p></div>
          </div>
        </div>
      </section>

      <section className="px-4 py-5 sm:px-6 sm:py-8 lg:px-8"><div className="mx-auto max-w-7xl space-y-5 sm:space-y-8">
        <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4 sm:rounded-2xl sm:p-5"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/40 sm:text-xs sm:tracking-[0.18em]">2026 data status</p><p className="mt-1.5 max-w-4xl text-xs leading-5 text-white/55 sm:mt-2 sm:text-sm sm:leading-6">{hasStats ? `Season totals below are calculated from ${player.gamesRecorded} verified game${player.gamesRecorded === 1 ? "" : "s"} currently on file. Additional games will be added as verified statistics become available.` : "This player has a verified roster profile, but no verified game statistics are on file yet. Statistical sections will populate as game reports become available."}</p></div>

        {profile?.bio ? <section className="rounded-xl border border-white/10 bg-white/[0.035] p-4 sm:rounded-2xl sm:p-5"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/40 sm:text-xs sm:tracking-[0.18em]">Player Note</p><p className="mt-2 max-w-4xl text-xs leading-5 text-white/55 sm:text-sm sm:leading-7">{profile.bio}</p></section> : null}

        <div className="grid gap-2.5 sm:gap-4 md:grid-cols-3">
          <StatCard label="Rushing" completeness={player.completeness.rushing} headline={player.rushing.attempts > 0 ? `${player.rushing.yards.toLocaleString()} yards` : "No stats on file"} details={player.rushing.attempts > 0 ? `${player.rushing.attempts} carries · ${formatTouchdownDetail(player.rushing.touchdowns)} · ${player.rushing.yardsPerCarry} YPC` : "Rushing totals will appear when verified."} active={player.rushing.attempts > 0} />
          <StatCard label="Passing" completeness={player.completeness.passing} headline={player.passing.attempts > 0 ? `${player.passing.yards.toLocaleString()} yards` : "No stats on file"} details={player.passing.attempts > 0 ? `${player.passing.completions}/${player.passing.attempts} · ${formatTouchdownDetail(player.passing.touchdowns)} · ${player.passing.interceptions} INT · ${player.passing.completionPercentage}%` : "Passing totals will appear when verified."} active={player.passing.attempts > 0} />
          <StatCard label="Receiving" completeness={player.completeness.receiving} headline={player.receiving.receptions > 0 ? `${player.receiving.yards.toLocaleString()} yards` : "No stats on file"} details={player.receiving.receptions > 0 ? `${player.receiving.receptions} receptions · ${formatTouchdownDetail(player.receiving.touchdowns)} · ${player.receiving.yardsPerReception} YPR` : "Receiving totals will appear when verified."} active={player.receiving.receptions > 0} />
        </div>

        {hasStats && <section className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.045] shadow-2xl sm:rounded-[1.75rem]"><div className="h-1" style={{ backgroundColor: primary }} /><div className="p-4 sm:p-6 md:p-7"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 sm:text-xs sm:tracking-[0.28em]">Stats On File</p><h2 className="mt-1.5 text-2xl font-black sm:mt-2 sm:text-3xl">Current VarsityVue rankings</h2><div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-4 lg:grid-cols-4"><RankCard label="Overall Rushing" rank={rushingRank} active={player.rushing.attempts > 0} /><RankCard label="District Rushing" rank={districtRushingRank} active={player.rushing.attempts > 0} /><RankCard label="Overall Passing" rank={passingRank} active={player.passing.attempts > 0} /><RankCard label="Overall Receiving" rank={receivingRank} active={player.receiving.receptions > 0} /></div><p className="mt-4 text-[10px] leading-4 text-white/35 sm:mt-5 sm:text-xs sm:leading-5">Rankings reflect only verified statistics currently on file with VarsityVue. Coverage is still expanding and may not include every player, school, or game in the coverage area.</p></div></section>}

        <section className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.045] shadow-2xl sm:rounded-[1.75rem]"><div className="p-4 sm:p-6 md:p-7"><div className="flex items-end justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 sm:text-xs sm:tracking-[0.28em]">Weekly Game Log</p><h2 className="mt-1.5 text-2xl font-black sm:mt-2 sm:text-3xl">{SEASON} performances</h2></div>{school && <Link href={`/schools/${school.slug}`} className="shrink-0 text-[9px] font-black uppercase tracking-[0.1em] text-white/50 transition hover:text-white sm:text-xs sm:tracking-[0.14em]">{school.name} Hub →</Link>}</div>
          {gameLog.length > 0 ? <>
            <div className="mt-4 space-y-2.5 md:hidden sm:mt-6 sm:space-y-3">
              {gameLog.map((entry) => (
                <Link key={entry.gameId} href={`/games/${entry.gameId}`} className="block rounded-xl border border-white/10 bg-black/30 p-3.5 transition hover:bg-white/[0.05] sm:rounded-2xl sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-white/35 sm:text-[10px] sm:tracking-[0.16em]">Week {entry.week ?? "—"}</p>
                      <p className="mt-1 text-sm font-black text-white sm:mt-2 sm:text-base">{entry.opponent}</p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black text-white/65 sm:px-3 sm:text-xs">{entry.result ?? "—"}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-1.5 sm:mt-4 sm:gap-2">
                    <GameLogStat label="Rush" value={formatRushing(entry.rushing)} completeness={entry.completeness.rushing} hasValues={Boolean(entry.rushing)} />
                    <GameLogStat label="Pass" value={formatPassing(entry.passing)} completeness={entry.completeness.passing} hasValues={Boolean(entry.passing)} />
                    <GameLogStat label="Rec" value={formatReceiving(entry.receiving)} completeness={entry.completeness.receiving} hasValues={Boolean(entry.receiving)} />
                  </div>
                  <p className="mt-3 text-[8px] font-black uppercase tracking-[0.1em] text-white/35 sm:mt-4 sm:text-[10px] sm:tracking-[0.14em]">Open Game Center →</p>
                </Link>
              ))}
            </div>
            <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-white/10 bg-black/30 md:block"><table className="w-full min-w-[980px] text-sm"><thead className="border-b border-white/10 text-[10px] font-black uppercase tracking-[0.12em] text-white/35"><tr><th className="px-4 py-3 text-left">Week</th><th className="px-4 py-3 text-left">Opponent</th><th className="px-4 py-3 text-left">Result</th><th className="px-4 py-3 text-left">Rush</th><th className="px-4 py-3 text-left">Pass</th><th className="px-4 py-3 text-left">Rec</th></tr></thead><tbody>{gameLog.map((entry) => <tr key={entry.gameId} className="border-t border-white/5 first:border-0 transition hover:bg-white/[0.035]"><td className="px-4 py-4 font-black text-white/45">{entry.week ?? "—"}</td><td className="px-4 py-4"><Link href={`/games/${entry.gameId}`} className="font-black text-white/80 transition hover:text-white">{entry.opponent}</Link></td><td className="px-4 py-4 font-black text-white/65">{entry.result ?? "—"}</td><td className="px-4 py-4 text-white/65"><LogTableValue value={formatRushing(entry.rushing)} completeness={entry.completeness.rushing} hasValues={Boolean(entry.rushing)} /></td><td className="px-4 py-4 text-white/65"><LogTableValue value={formatPassing(entry.passing)} completeness={entry.completeness.passing} hasValues={Boolean(entry.passing)} /></td><td className="px-4 py-4 text-white/65"><LogTableValue value={formatReceiving(entry.receiving)} completeness={entry.completeness.receiving} hasValues={Boolean(entry.receiving)} /></td></tr>)}</tbody></table></div>
          </> : <p className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-white/40 sm:mt-6 sm:rounded-2xl sm:p-6 sm:text-sm">No verified weekly game statistics are on file yet.</p>}
        </div></section>
      </div></section>
    </main>
  );
}

function rankOf<T extends { playerId: string }>(entries: T[], playerId: string) { const index = entries.findIndex((entry) => entry.playerId === playerId); return index >= 0 ? index + 1 : undefined; }
function showCompleteness(completeness: StatCompletenessDetail) { return completeness.status === "complete" || completeness.status === "partial"; }
function StatCard({ label, headline, details, active, completeness }: { label: string; headline: string; details: string; active: boolean; completeness: StatCompletenessDetail }) { return <div className={`rounded-[1.2rem] border p-4 shadow-xl sm:rounded-[1.5rem] sm:p-5 ${active ? "border-white/10 bg-white/[0.045]" : "border-white/5 bg-white/[0.02]"}`}><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/40 sm:text-xs sm:tracking-[0.22em]">{label}</p>{showCompleteness(completeness) ? <StatCompletenessBadge completeness={completeness} hasValues={active} compact /> : null}</div><p className={`mt-2 font-black text-white sm:mt-3 ${active ? "text-2xl sm:text-3xl" : "text-lg text-white/55 sm:text-xl"}`}>{headline}</p><p className="mt-1.5 text-xs leading-5 text-white/45 sm:mt-2 sm:text-sm">{details}</p></div>; }
function RankCard({ label, rank, active }: { label: string; rank?: number; active: boolean }) { return <div className="rounded-xl border border-white/10 bg-black/30 p-3 sm:rounded-2xl sm:p-5"><p className="text-[8px] font-black uppercase tracking-[0.12em] text-white/35 sm:text-[10px] sm:tracking-[0.16em]">{label}</p><p className="mt-1.5 text-xl font-black sm:mt-2 sm:text-3xl">{active && rank ? `#${rank}` : "—"}</p></div>; }
function GameLogStat({ label, value, completeness, hasValues }: { label: string; value: string; completeness: StatCompletenessDetail; hasValues: boolean }) { return <div className="min-w-0 rounded-lg border border-white/10 bg-white/[0.035] p-2 sm:rounded-xl sm:p-3"><div className="flex flex-wrap items-center justify-between gap-1"><p className="text-[7px] font-black uppercase tracking-[0.1em] text-white/30 sm:text-[9px] sm:tracking-[0.14em]">{label}</p>{showCompleteness(completeness) ? <StatCompletenessBadge completeness={completeness} hasValues={hasValues} compact /> : null}</div><p className="mt-1 break-words text-[9px] font-black leading-3.5 text-white/70 sm:text-xs sm:leading-5">{value}</p></div>; }
function LogTableValue({ value, completeness, hasValues }: { value: string; completeness: StatCompletenessDetail; hasValues: boolean }) { return <div><p>{value}</p>showCompleteness(completeness) ? <div className="mt-1"><StatCompletenessBadge completeness={completeness} hasValues={hasValues} compact /></div> : null</div>; }
function formatRushing(line?: { attempts: number; yards: number; touchdowns?: number; yardsPerCarry: number }) { if (!line || line.attempts === 0) return "—"; return `${line.attempts} car, ${line.yards} yds, ${formatTouchdownDetail(line.touchdowns)}`; }
function formatPassing(line?: { completions: number; attempts: number; yards: number; touchdowns?: number; interceptions: number }) { if (!line || line.attempts === 0) return "—"; return `${line.completions}/${line.attempts}, ${line.yards} yds, ${formatTouchdownDetail(line.touchdowns)}`; }
function formatReceiving(line?: { receptions: number; yards: number; touchdowns?: number }) { if (!line || line.receptions === 0) return "—"; return `${line.receptions} rec, ${line.yards} yds, ${formatTouchdownDetail(line.touchdowns)}`; }
