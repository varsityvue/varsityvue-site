import { getSchoolBySlug } from "@/lib/schools";
import {
    getStandingForSchool,
    getStandingsForDistrictId,
} from "@/lib/standings";

type MatchupInsightsProps = {
    homeSchoolSlug?: string;
    awaySchoolSlug?: string;
};

function formatRecord(wins?: number, losses?: number) {
    if (wins === undefined || losses === undefined) return "—";
    return `${wins}-${losses}`;
}

function formatPoints(value?: number) {
    return value === undefined ? "—" : value.toString();
}

function getDistrictRank(slug?: string) {
    if (!slug) return "—";

    const school = getSchoolBySlug(slug);
    if (!school) return "—";

    const standings = getStandingsForDistrictId(school.districtId);
    const districtStarted = standings.some(
        (team) => team.districtWins > 0 || team.districtLosses > 0
    );

    if (!districtStarted) return "—";

    const index = standings.findIndex((team) => team.schoolSlug === slug);
    if (index === -1) return "—";

    const team = standings[index];
    const firstTieIndex = standings.findIndex(
        (item) =>
            item.districtWins === team.districtWins &&
            item.districtLosses === team.districtLosses
    );
    const tied = standings.some(
        (item, itemIndex) =>
            itemIndex !== index &&
            item.districtWins === team.districtWins &&
            item.districtLosses === team.districtLosses
    );

    return tied ? `T-${firstTieIndex + 1}` : `#${index + 1}`;
}

export default function MatchupInsights({
    homeSchoolSlug,
    awaySchoolSlug,
}: MatchupInsightsProps) {
    const awaySchool = awaySchoolSlug ? getSchoolBySlug(awaySchoolSlug) : undefined;
    const homeSchool = homeSchoolSlug ? getSchoolBySlug(homeSchoolSlug) : undefined;

    const awayStanding = awaySchoolSlug
        ? getStandingForSchool(awaySchoolSlug)
        : undefined;

    const homeStanding = homeSchoolSlug
        ? getStandingForSchool(homeSchoolSlug)
        : undefined;

    if (!awaySchool && !homeSchool) return null;

    return (
        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-7 shadow-2xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--vv-accent)]">
                Matchup Snapshot
            </p>

            <h2 className="mt-3 text-3xl font-black text-white">
                Team Comparison
            </h2>

            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/35">
                <ComparisonRow
                    label="Team"
                    awayValue={awaySchool?.name ?? "Away"}
                    homeValue={homeSchool?.name ?? "Home"}
                    header
                />

                <ComparisonRow
                    label="Overall"
                    awayValue={formatRecord(
                        awayStanding?.overallWins,
                        awayStanding?.overallLosses
                    )}
                    homeValue={formatRecord(
                        homeStanding?.overallWins,
                        homeStanding?.overallLosses
                    )}
                />

                <ComparisonRow
                    label="District"
                    awayValue={formatRecord(
                        awayStanding?.districtWins,
                        awayStanding?.districtLosses
                    )}
                    homeValue={formatRecord(
                        homeStanding?.districtWins,
                        homeStanding?.districtLosses
                    )}
                />

                <ComparisonRow
                    label="District Rank"
                    awayValue={getDistrictRank(awaySchoolSlug)}
                    homeValue={getDistrictRank(homeSchoolSlug)}
                />

                <ComparisonRow
                    label="Points For"
                    awayValue={formatPoints(awayStanding?.pointsFor)}
                    homeValue={formatPoints(homeStanding?.pointsFor)}
                />

                <ComparisonRow
                    label="Points Against"
                    awayValue={formatPoints(awayStanding?.pointsAgainst)}
                    homeValue={formatPoints(homeStanding?.pointsAgainst)}
                />
            </div>

            <div className="mt-6">
                <InsightCard
                    title="Matchup Context"
                    body="Compare each team's verified record, scoring totals, and district standing as the season develops."
                />
            </div>
        </section>
    );
}

function ComparisonRow({
    label,
    awayValue,
    homeValue,
    header = false,
}: {
    label: string;
    awayValue: string;
    homeValue: string;
    header?: boolean;
}) {
    return (
        <div
            className={`grid grid-cols-[1fr_1fr_1fr] border-b border-white/10 last:border-b-0 ${header ? "bg-white/[0.06]" : ""
                }`}
        >
            <div className="px-4 py-4 text-xs font-black uppercase tracking-[0.16em] text-white/40">
                {label}
            </div>

            <div className="px-4 py-4 text-sm font-black text-white">
                {awayValue}
            </div>

            <div className="px-4 py-4 text-sm font-black text-white">
                {homeValue}
            </div>
        </div>
    );
}

function InsightCard({ title, body }: { title: string; body: string }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">
                {title}
            </p>

            <p className="mt-3 text-sm leading-6 text-white/65">{body}</p>
        </div>
    );
}
