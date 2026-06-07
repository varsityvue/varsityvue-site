import Link from "next/link";

import SchoolBadge from "./SchoolBadge";
import { getPilotSchools } from "@/lib/schools";

export default function PilotSchools() {
    const schools = getPilotSchools();

    return (
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl">
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">
                        Coverage Starts Here
                    </p>

                    <h2 className="mt-2 text-4xl font-black text-white">
                        Pilot Schools
                    </h2>
                </div>

                <Link
                    href="/schools"
                    className="text-sm font-black uppercase tracking-[0.14em] text-white/60 hover:text-white"
                >
                    View All →
                </Link>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {schools.map((school) => (
                    <Link
                        key={school.slug}
                        href={`/schools/${school.slug}`}
                        className="rounded-2xl border border-white/10 bg-black/35 p-4 transition hover:bg-white/10"
                    >
                        <div className="flex items-center gap-4">
                            <SchoolBadge school={school} size="xs" />

                            <div>
                                <p className="font-black text-white">{school.name}</p>

                                <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/45">
                                    {school.mascot}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                            {school.stateTitles !== undefined && (
                                <MiniMeta label="Titles" value={school.stateTitles.toString()} />
                            )}

                            {school.lastPlayoffAppearance && (
                                <MiniMeta
                                    label="Last Playoff"
                                    value={school.lastPlayoffAppearance.toString()}
                                />
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}

function MiniMeta({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35">
                {label}
            </p>
            <p className="mt-1 text-sm font-black text-white">{value}</p>
        </div>
    );
}