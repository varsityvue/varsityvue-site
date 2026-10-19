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
  const shareProps = {
    title: `Week ${week} Pick ’Em | VarsityVue`,
    text: `Make your Week ${week} Texas high school football picks on VarsityVue. Free to enter for Texas residents 18+.`,
    url: "https://varsityvue.com/pickem",
  };

  return (
    <section className="rounded-xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(139,16,32,0.42),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025))] p-3 sm:p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:gap-6">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/75">{season} Football</p>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-xl font-black tracking-tight sm:text-3xl">Week {week} Pick ’Em</h1>
            <div className="hidden shrink-0 sm:block"><ShareAction {...shareProps} label="Share" /></div>
          </div>
        </div>
        <div className="flex max-w-24 flex-col items-center sm:max-w-none">
          {sponsorName ? <PickemSponsorMark name={sponsorName} logo={sponsorLogo} compact /> : null}
          <div className="mt-2 sm:hidden"><ShareAction {...shareProps} /></div>
        </div>
      </div>
      <div className="mt-2">
        <p className="text-xs font-bold text-white/75">Free to enter · Texas residents 18+</p>
        <p className="mt-1 text-xs text-white/70">$1 per valid accepted entry · up to $100 this week</p>
      </div>
      <p className="mt-2 text-xs font-bold text-amber-50">New-entry deadline: <span className="whitespace-nowrap">{deadlineLabel}</span></p>
    </section>
  );
}
