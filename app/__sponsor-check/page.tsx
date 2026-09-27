import PickemSponsorMark from "@/components/PickemSponsorMark";
import { logoForPickemWeek } from "@/data/pickem-sponsor-logos";

export default async function SponsorCheck({ searchParams }: { searchParams: Promise<{ frame?: string }> }) {
  const { frame } = await searchParams;
  if (!frame) return <main className="min-h-screen space-y-5 bg-[#101010] p-5 text-white">
    <h1>Disposable sponsor rendering check</h1>
    {[390, 400, 430, 1000].map(width => <section key={width}>
      <h2>{width}px frame</h2>
      <iframe title={`Sponsor at ${width}px`} src="/__sponsor-check?frame=1" style={{width, height:260, maxWidth:"100%", border:"1px solid white"}} />
    </section>)}
  </main>;
  return <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-7 text-white sm:px-6 sm:py-12 lg:px-8">
    <div className="mx-auto max-w-[1200px]">
      <section className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(139,16,32,0.42),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025))] p-5 shadow-2xl sm:rounded-[2rem] sm:p-8">
        <p className="pr-28 text-[10px] font-black uppercase tracking-[0.24em] text-[var(--vv-accent)] sm:pr-32 sm:text-xs">VarsityVue</p>
        <span className="absolute right-5 top-5 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/45 sm:right-8 sm:top-8">2026 · Week 6</span>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Pick ’Em</h1>
        <PickemSponsorMark name="Gilder Storage" logo={logoForPickemWeek(2026,6,"Gilder Storage")} />
        <p className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-white/80">Free to play · Texas 18+</p>
      </section>
    </div>
  </main>;
}
