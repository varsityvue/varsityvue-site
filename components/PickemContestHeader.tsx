import ShareAction from "./ShareAction";
import PickemSponsorMark from "./PickemSponsorMark";

export default function PickemContestHeader({ season, week, deadline, sponsorName, sponsorLogo }: {
  season: number;
  week: number;
  deadline: string | null;
  sponsorName?: string | null;
  sponsorLogo: string | null;
}) {
  const deadlineDate = deadline ? new Date(deadline) : null;
  const deadlineLabel = deadlineDate && !Number.isNaN(deadlineDate.getTime())
    ? new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Chicago", timeZoneName: "short" }).format(deadlineDate)
    : "Pending configuration";

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(139,16,32,0.42),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025))] p-4 shadow-2xl sm:rounded-[2rem] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--vv-accent)]">{season} Football</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-4xl">Week {week} Pick ’Em</h1>
        </div>
        {sponsorName ? <PickemSponsorMark name={sponsorName} logo={sponsorLogo} compact /> : null}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-white/75">Free to enter · Texas residents 18+</p>
          <p className="mt-1 text-xs text-white/70">$1 per valid accepted entry · up to $100 this week</p>
        </div>
        <ShareAction title={`Week ${week} Pick ’Em | VarsityVue`} text={`Make your Week ${week} Texas high school football picks on VarsityVue. Free to enter for Texas residents 18+.`} url="https://varsityvue.com/pickem" label="Share" className="shrink-0 sm:mr-32" />
      </div>
      <p className="mt-3 rounded-lg border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs font-bold text-amber-50">New-entry deadline: <span className="whitespace-nowrap">{deadlineLabel}</span></p>
    </section>
  );
}
