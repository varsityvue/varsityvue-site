import Link from "next/link";

export default function HomeSponsorSlot() {
    return (
        <section className="px-4 py-5 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1440px] overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-r from-[var(--vv-primary)]/45 via-black to-black p-6 shadow-2xl md:p-8">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-white/45">
                            Founding Sponsor Slot
                        </p>

                        <h2 className="mt-2 text-3xl font-black text-white md:text-4xl">
                            Put your business in front of Friday night fans.
                        </h2>

                        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
                            VarsityVue sponsor placements connect local businesses with school
                            hubs, game pages, district races, scoreboards, and coverage modules.
                        </p>
                    </div>

                    <Link
                        href="/sponsor-inquiry"
                        className="rounded-xl border border-white/20 bg-white/10 px-6 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/15"
                    >
                        Claim This Spot →
                    </Link>
                </div>
            </div>
        </section>
    );
}