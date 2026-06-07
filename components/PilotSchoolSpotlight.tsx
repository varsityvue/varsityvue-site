import Link from "next/link";
import { getPilotSchools } from "@/lib/schools";
import { getDistrictById } from "@/lib/districts";
import { getNextGameForSchool } from "@/lib/games";
import { getStandingForSchool } from "@/lib/standings";
import SchoolBadge from "./SchoolBadge";

function formatClassification(conference: string, division?: string | null) {
    return `${conference}${division ? ` ${division}` : ""}`;
}

export default function PilotSchoolSpotlight() {
    const schools = getPilotSchools();

    if (schools.length === 0) return null;

    return (
        <section className="px-4 py-5 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1440px] rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl md:p-8">
                <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-white/45">
                            Pilot School Spotlight
                        </p>

                        <h2 className="mt-2 text-3xl font-black text-white md:text-4xl">
                            Featured VarsityVue programs
                        </h2>
                    </div>

                    <Link
                        href="/schools"
                        className="inline-flex rounded-full border border-white/10 bg-black/35 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white/60 transition hover:bg-white/10 hover:text-white"
                    >
                        View All Schools →
                    </Link>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {schools.map((school) => {
                        const district = getDistrictById(school.districtId);
                        const nextGame = getNextGameForSchool(school.slug);
                        const standing = getStandingForSchool(school.slug);

                        return (
                            <Link
                                key={school.id}
                                href={`/schools/${school.slug}`}
                                className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/35 transition hover:-translate-y-1 hover:bg-white/[0.07]"
                            >
                                <div
                                    className="h-2"
                                    style={{ backgroundColor: school.colors.primary }}
                                />

                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">
                                                {formatClassification(
                                                    school.classification.conference,
                                                    school.classification.division
                                                )}
                                            </p>

                                            <h3 className="mt-2 text-3xl font-black text-white">
                                                {school.name}
                                            </h3>

                                            <p className="mt-1 text-sm font-black uppercase tracking-[0.14em] text-white/45">
                                                {school.mascot}
                                            </p>
                                        </div>

                                        <SchoolBadge school={school} size="sm" />
                                    </div>

                                    <div className="mt-5 grid grid-cols-2 gap-3">
                                        <MiniStat
                                            label="Overall"
                                            value={
                                                standing
                                                    ? `${standing.overallWins}-${standing.overallLosses}`
                                                    : "0-0"
                                            }
                                        />
                                        <MiniStat
                                            label="District"
                                            value={
                                                standing
                                                    ? `${standing.districtWins}-${standing.districtLosses}`
                                                    : "0-0"
                                            }
                                        />
                                    </div>

                                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
                                            District
                                        </p>

                                        <p className="mt-2 line-clamp-1 text-sm font-black text-white/75">
                                            {district?.name ?? "District TBD"}
                                        </p>
                                    </div>

                                    {nextGame && (
                                        <div className="mt-3 rounded-2xl border border-white/10 bg-black/35 p-4">
                                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
                                                Next Up
                                            </p>

                                            <p className="mt-2 line-clamp-1 text-sm font-black text-white">
                                                {nextGame.awayTeam} at {nextGame.homeTeam}
                                            </p>
                                        </div>
                                    )}

                                    <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-white/50 transition group-hover:text-white">
                                        View School Hub →
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

function MiniStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-white/10 bg-black/35 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
                {label}
            </p>

            <p className="mt-1 text-lg font-black text-white">{value}</p>
        </div>
    );
}