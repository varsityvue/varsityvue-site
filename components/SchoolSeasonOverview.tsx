import { formatOverallRecord } from "@/lib/school-record-presentation";
import type { Standing } from "@/lib/standings";
import type { SchoolTheme } from "@/types/school-theme";

type Props = {
  theme: SchoolTheme;
  standing: Pick<Standing, "overallRecordKnown" | "overallWins" | "overallLosses"> | undefined;
  recentResults: ("W" | "L" | "T")[];
  pointsFor: number;
  pointsAgainst: number;
  hasScoringData: boolean;
};

export default function SchoolSeasonOverview({ theme, standing, recentResults, pointsFor, pointsAgainst, hasScoringData }: Props) {
  return (
      <div className="overflow-hidden rounded-[1.5rem] border p-4 shadow-2xl sm:rounded-[1.75rem] sm:p-6 lg:max-w-lg" style={{ borderColor: `${theme.primary}55`, background: `linear-gradient(145deg, ${theme.primary}24, rgba(255,255,255,0.035) 42%, rgba(0,0,0,0.98) 78%)`, boxShadow: `inset 4px 0 0 ${theme.primary}, 0 18px 50px rgba(0,0,0,0.4)` }}>
        <div className="flex items-end justify-between gap-4"><div><p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/45 sm:text-[10px] sm:tracking-[0.24em]">Season Overview</p><p className="mt-1.5 text-4xl font-black tracking-tight text-white sm:mt-3 sm:text-5xl">{formatOverallRecord(standing)}</p></div>{recentResults.length > 0 && <div className="text-right"><p className="text-[8px] font-black uppercase tracking-[0.14em] text-white/30 sm:text-[10px] sm:tracking-[0.18em]">Last 5</p><div className="mt-1.5 flex justify-end gap-1.5 sm:mt-3 sm:gap-2">{recentResults.slice(-5).map((result, index) => <span key={`${result}-${index}`} className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-black sm:h-8 sm:w-8 sm:text-xs ${result === "W" ? "border-green-400/30 bg-green-500/15 text-green-300" : result === "L" ? "border-red-400/30 bg-red-500/15 text-red-300" : "border-yellow-400/30 bg-yellow-500/15 text-yellow-200"}`}>{result}</span>)}</div></div>}</div>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-5"><PulseStat label="PF" value={hasScoringData ? pointsFor.toString() : "—"} /><PulseStat label="PA" value={hasScoringData ? pointsAgainst.toString() : "—"} /><PulseStat label="Diff" value={hasScoringData ? `${pointsFor - pointsAgainst > 0 ? "+" : ""}${pointsFor - pointsAgainst}` : "—"} /></div>
      </div>
  );
}

function PulseStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/10 bg-black/30 p-2.5 sm:rounded-2xl sm:p-3"><p className="text-base font-black text-white sm:text-lg">{value}</p><p className="mt-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-white/30 sm:mt-1 sm:text-[9px] sm:tracking-[0.16em]">{label}</p></div>;
}
