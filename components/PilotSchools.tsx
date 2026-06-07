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
                        className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/35 p-4 transition hover:bg-white/10"
                    >
                        <SchoolBadge school={school} size="xs" />

                        <div>
                            <p className="font-black text-white">
                                {school.name}
                            </p>

                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/45">
                                {school.mascot}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}