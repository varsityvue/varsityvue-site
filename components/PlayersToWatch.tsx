import Link from "next/link";

export default function PlayersToWatch() {
    const players = [
        {
            school: "Stephenville",
            offense: "QB Mason Smith",
            defense: "LB Carter Jones",
            darkHorse: "WR Tyler Davis",
        },
        {
            school: "Midlothian Heritage",
            offense: "RB Jace Wilson",
            defense: "DE Ethan Brown",
            darkHorse: "DB Cooper White",
        },
    ];

    return (
        <section className="px-4 py-5 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1440px] rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-white/45">
                    Players To Watch
                </p>

                <h2 className="mt-2 text-3xl font-black text-white">
                    Impact players for this week's spotlight matchup
                </h2>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {players.map((player) => (
                        <div
                            key={player.school}
                            className="rounded-2xl border border-white/10 bg-black/35 p-5"
                        >
                            <h3 className="text-xl font-black text-white">
                                {player.school}
                            </h3>

                            <div className="mt-4 space-y-3">
                                <p className="text-white/80">
                                    ⭐ Offensive Player:
                                    <span className="font-bold"> {player.offense}</span>
                                </p>

                                <p className="text-white/80">
                                    🛡 Defensive Player:
                                    <span className="font-bold"> {player.defense}</span>
                                </p>

                                <p className="text-white/80">
                                    🔥 Dark Horse:
                                    <span className="font-bold"> {player.darkHorse}</span>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}