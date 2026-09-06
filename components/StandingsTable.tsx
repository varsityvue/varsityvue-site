import Link from "next/link";
import type { SchoolTheme } from "../types/school-theme";
import { getSchoolBySlug } from "@/lib/schools";
import SchoolBadge from "./SchoolBadge";

type Standing = {
  schoolSlug: string;
  team: string;
  districtWins: number;
  districtLosses: number;
  overallWins: number;
  overallLosses: number;
  pointsFor: number;
  pointsAgainst: number;
};

type StandingsTableProps = {
  standings: Standing[];
  theme: SchoolTheme;
};

function hasDistrictResults(standings: Standing[]) {
  return standings.some((team) => team.districtWins > 0 || team.districtLosses > 0);
}

function hasOverallResults(standings: Standing[]) {
  return standings.some(
    (team) => team.overallWins > 0 || team.overallLosses > 0 || team.pointsFor > 0 || team.pointsAgainst > 0
  );
}

function overallWinPct(team: Standing) {
  const games = team.overallWins + team.overallLosses;
  return games > 0 ? team.overallWins / games : -1;
}

function displayStandings(standings: Standing[], districtStarted: boolean, seasonStarted: boolean) {
  if (districtStarted || !seasonStarted) return standings;

  return [...standings].sort((a, b) => {
    const pctDiff = overallWinPct(b) - overallWinPct(a);
    if (pctDiff !== 0) return pctDiff;
    if (b.overallWins !== a.overallWins) return b.overallWins - a.overallWins;
    if (a.overallLosses !== b.overallLosses) return a.overallLosses - b.overallLosses;
    return a.team.localeCompare(b.team);
  });
}

function getStandingPosition(standings: Standing[], index: number, districtStarted: boolean) {
  const team = standings[index];
  const isSameRecord = (candidate: Standing) =>
    districtStarted
      ? candidate.districtWins === team.districtWins && candidate.districtLosses === team.districtLosses
      : candidate.overallWins === team.overallWins && candidate.overallLosses === team.overallLosses;
  const firstIndex = standings.findIndex(isSameRecord);
  const tiedTeams = standings.filter(isSameRecord).length;
  return tiedTeams > 1 ? `T-${firstIndex + 1}` : `#${firstIndex + 1}`;
}

export default function StandingsTable({ standings, theme }: StandingsTableProps) {
  const districtStarted = hasDistrictResults(standings);
  const seasonStarted = hasOverallResults(standings);
  const displayed = displayStandings(standings, districtStarted, seasonStarted);

  return (
    <section
      className="min-w-0 rounded-[1.5rem] border bg-white/[0.045] p-4 shadow-2xl sm:rounded-[1.75rem] sm:p-6"
      style={{ borderColor: `${theme.secondary}22`, boxShadow: `0 18px 55px ${theme.primary}14` }}
    >
      <div className="mb-5 flex items-end justify-between gap-3 sm:mb-6 sm:gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/70 sm:text-xs sm:tracking-[0.28em]">District Race</p>
          <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Standings</h2>
        </div>
        <Link href="/districts" className="shrink-0 rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/70 transition hover:bg-white/10 hover:text-white sm:px-4 sm:text-xs sm:tracking-[0.14em]" style={{ borderColor: `${theme.secondary}33`, backgroundColor: "rgba(255,255,255,0.08)" }}>District →</Link>
      </div>

      {displayed.length === 0 ? (
        <div className="rounded-2xl border bg-black/35 p-5 sm:rounded-3xl sm:p-6" style={{ borderColor: `${theme.secondary}33` }}>
          <p className="text-base font-black text-white sm:text-lg">No standings available yet.</p>
          <p className="mt-2 text-sm leading-6 text-white/50">District standings will appear here once verified results are on file.</p>
        </div>
      ) : (
        <>
          {!districtStarted && (
            <div className="mb-4 rounded-2xl border bg-black/35 p-4" style={{ borderColor: `${theme.secondary}33` }}>
              <p className="text-sm font-black text-white">District play has not started yet.</p>
              <p className="mt-1 text-xs leading-5 text-white/45 sm:text-sm sm:leading-6">
                {seasonStarted ? "Overall records are shown for context and ordered by current overall record." : "Teams are listed alphabetically by district membership."}
                <span className="hidden sm:inline">{seasonStarted ? " District standings will take over once verified district results are available." : " Rankings will appear once verified district results are available."}</span>
              </p>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border bg-black/35 md:hidden" style={{ borderColor: `${theme.secondary}33` }}>
            <div className="grid grid-cols-[1fr_58px_58px] items-center gap-2 px-4 py-3 text-[9px] font-black uppercase tracking-[0.14em] text-white/40" style={{ borderBottom: `2px solid ${theme.primary}` }}>
              <span>Team</span><span className="text-center">Dist</span><span className="text-right">Ovr</span>
            </div>
            <div className="divide-y divide-white/10">
              {displayed.map((team, index) => {
                const school = getSchoolBySlug(team.schoolSlug);
                const teamRow = (
                  <div className="grid grid-cols-[1fr_58px_58px] items-center gap-2 px-4 py-3.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {seasonStarted && <span className="shrink-0 text-[10px] font-black text-white/35">{getStandingPosition(displayed, index, districtStarted)}</span>}
                        <p className="truncate text-sm font-black text-white">{team.team}</p>
                      </div>
                      {school?.mascot && <p className="mt-0.5 truncate text-[9px] font-bold uppercase tracking-[0.12em] text-white/30">{school.mascot}</p>}
                    </div>
                    <span className="text-center text-sm font-black text-white/80">{districtStarted ? `${team.districtWins}-${team.districtLosses}` : "—"}</span>
                    <span className="text-right text-sm font-black text-white/60">{seasonStarted ? `${team.overallWins}-${team.overallLosses}` : "—"}</span>
                  </div>
                );
                return school ? <Link key={team.schoolSlug} href={`/schools/${team.schoolSlug}`} className="block transition hover:bg-white/[0.05]">{teamRow}</Link> : <div key={team.schoolSlug}>{teamRow}</div>;
              })}
            </div>
          </div>

          <div className="hidden overflow-x-auto rounded-3xl border bg-black/35 md:block" style={{ borderColor: `${theme.secondary}33`, boxShadow: `0 18px 50px ${theme.primary}18` }}>
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))", borderBottom: `2px solid ${theme.primary}` }}>
                <tr>{[seasonStarted ? "Place" : "—", "Team", "District", "Overall", "PF", "PA", "Diff"].map((header, index) => <th key={`${header}-${index}`} className="px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-white">{header}</th>)}</tr>
              </thead>
              <tbody>
                {displayed.map((team, index) => {
                  const differential = team.pointsFor - team.pointsAgainst;
                  const school = getSchoolBySlug(team.schoolSlug);
                  const teamContent = (
                    <div className="flex items-center gap-4">
                      {school ? <SchoolBadge school={school} size="xs" /> : <FallbackBadge label={team.team} />}
                      <div><p className="font-black text-white">{team.team}</p>{school && <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-white/40">{school.mascot}</p>}</div>
                    </div>
                  );
                  return (
                    <tr key={team.schoolSlug} className="border-t border-white/10 transition hover:bg-white/[0.06]">
                      <td className="px-5 py-4 font-black text-white">{seasonStarted ? <span>{getStandingPosition(displayed, index, districtStarted)}</span> : <span className="text-white/25">—</span>}</td>
                      <td className="px-5 py-4">{school ? <Link href={`/schools/${team.schoolSlug}`} className="block text-white transition hover:text-white/70">{teamContent}</Link> : teamContent}</td>
                      <td className="px-5 py-4 font-black text-white">{districtStarted ? `${team.districtWins}-${team.districtLosses}` : "—"}</td>
                      <td className="px-5 py-4 font-black text-white/70">{seasonStarted ? `${team.overallWins}-${team.overallLosses}` : "—"}</td>
                      <td className="px-5 py-4 font-black text-white/70">{team.pointsFor || team.pointsAgainst ? team.pointsFor : "—"}</td>
                      <td className="px-5 py-4 font-black text-white/70">{team.pointsFor || team.pointsAgainst ? team.pointsAgainst : "—"}</td>
                      <td className="px-5 py-4 font-black text-white">{team.pointsFor || team.pointsAgainst ? `${differential > 0 ? "+" : ""}${differential}` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {districtStarted && <p className="mt-4 text-xs leading-5 text-white/35">Teams with the same verified district record are shown as tied. VarsityVue does not apply unofficial district tiebreakers or project playoff qualifiers.</p>}
        </>
      )}
    </section>
  );
}

function FallbackBadge({ label }: { label: string }) {
  return <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 p-2 text-center text-[10px] font-black uppercase text-white">{label.slice(0, 3)}</div>;
}
