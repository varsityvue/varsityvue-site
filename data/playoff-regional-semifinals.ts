import type { Game } from "@/types/platform";
import { playoffSchoolIdentities } from "./playoff-school-slugs";
import schedule from "./playoff-regional-semifinals-2026.json";

export const regionalSemifinalGames: Game[] = schedule.map(row => {
  const [conference, flight] = row.division.split("-");
  const division = conference + (flight === "D1" ? " Division I" : " Division II");
  const field = playoffSchoolIdentities.filter(school =>
    school.division === division && school.region === "Region " + row.region);
  const name = (slug: string) => {
    const matches = field.filter(school => school.schoolSlug === slug);
    if (matches.length !== 1) throw new Error("Unknown or ambiguous bracket school: " + slug);
    return matches[0].bracketName;
  };
  // Public matchup displays list away first. Keep bracket order until UIL sides are known.
  const [first, second] = row.bracketOrderSchoolSlugs;
  const awaySchoolSlug = row.awaySchoolSlug ?? first;
  const homeSchoolSlug = row.homeSchoolSlug ?? second;
  return {
    id: row.gameId,
    season: row.season,
    week: 14,
    gameType: "playoff",
    playoff: { round: "Regional Semifinal", division, region: row.region },
    homeTeam: name(homeSchoolSlug),
    awayTeam: name(awaySchoolSlug),
    homeSchoolSlug,
    awaySchoolSlug,
    designatedSidesConfirmed: row.homeAwayConfirmed,
    isNeutralSite: row.neutralSite,
    // The catalog supports a civil date without an instant. Its formatters show Time TBD.
    kickoff: row.kickoff ?? row.date,
    venue: [row.venue, row.city, row.state].join(", "),
    mediaLinks: row.broadcastLinks.map(link => ({ type: "stream", label: link.provider, url: link.url })),
    districtGame: false,
    status: "upcoming",
    sourceStatus: "verified",
    sourceLabel: [row.primarySource, row.secondarySource].filter(Boolean).join(" · "),
  };
});
