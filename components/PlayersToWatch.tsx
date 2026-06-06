import Link from "next/link";
import { getFeaturedPlayers } from "@/lib/players";
import type { WatchPlayer } from "@/data/players";

const players = getFeaturedPlayers();

const groupedPlayers = players.reduce<Record<string, WatchPlayer[]>>(
    (groups, player) => {
        groups[player.school] = [...(groups[player.school] ?? []), player];
        return groups;
    },
    {}
);

export default function PlayersToWatch() {
    if (players.length === 0) return null;

    return (
        <section className="px-4 py-5 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1440px] rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl md:p-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-white/45">
                            Players To Watch
                        </p>

                        <h2 className="mt-2 max-w-4xl text-3xl font-black text-white md:text-4xl">
                            Impact players for this week's spotlight matchup
                        </h2>
                    </div>

                    <Link
                        href="/coverage"
                        className="inline-flex rounded-full border border-white/10 bg-black/35 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white/60 transition hover:bg-white/10 hover:text-white"
                    >
                        View Coverage →
                    </Link>
                </div>

                <div className="mt-7 grid gap-5 lg:grid-cols-2">
                    {Object.entries(groupedPlayers).map(([school, schoolPlayers]) => (
                        <div
                            key={school}
                            className="rounded-[1.5rem] border border-white/10 bg-black/30 p-5"
                        >
                            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-white/40">
                                        Program
                                    </p>

                                    <h3 className="mt-1 text-2xl font-black text-white">
                                        {school}
                                    </h3>
                                </div>

                                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
                                    {schoolPlayers.length} Watchlist Picks
                                </div>
                            </div>

                            <div className="mt-5 grid gap-3">
                                {schoolPlayers.map((player) => (
                                    <PlayerCard key={player.id} player={player} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function PlayerCard({ player }: { player: WatchPlayer }) {
    return (
        <div className="group rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07]">
            <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/35 text-xl">
                    {player.icon}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/50">
                            {player.role}
                        </p>

                        <p className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/50">
                            {player.label}
                        </p>
                    </div>

                    <h4 className="mt-3 text-xl font-black text-white">
                        {player.position} {player.name}
                    </h4>

                    <p className="mt-2 text-sm leading-6 text-white/55">
                        {player.note}
                    </p>
                </div>
            </div>
        </div>
    );
}