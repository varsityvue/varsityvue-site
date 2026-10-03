import "server-only";
import type { Game, School } from "@/types/platform";
import type { WeeklyGame } from "./unified-games";
import { getSchoolBySlug } from "./schools";
import { resolveGameLocation } from "./game-location";
import { venues } from "@/data/venues";
import { schoolFootballVenues } from "@/data/school-football-venues";
import { gameVenueOverrides } from "@/data/game-venue-overrides";
import { getGamePreview } from "@/data/game-previews";
import {
  getGameStatAvailability,
  getStatAvailabilityLabel,
} from "@/data/stat-availability";
import { getStandingForSchoolFromGames } from "./standings";
import { validPoint } from "./geo-distance";
import { safeScoreUsername } from "./public-score-state";
import type { SchoolCenter } from "@/types/game-location";
const classify = (s: School | undefined) =>
  s
    ? `${s.classification.conference}${s.classification.division ? ` Division ${s.classification.division === "D1" ? "I" : "II"}` : ""}`
    : null;
// Public allowlist shared by SSR and refresh. Never serialize verification sources, user IDs or submissions.
export function weeklyGameDto(g: Game, games: Game[]): WeeklyGame {
  const home = getSchoolBySlug(g.homeSchoolSlug ?? ""),
    away = getSchoolBySlug(g.awaySchoolSlug ?? "");
  const hc = classify(home),
    ac = classify(away);
  const locationInfo = resolveGameLocation(
    g,
    venues,
    schoolFootballVenues,
    gameVenueOverrides,
  );
  const h = home ? getStandingForSchoolFromGames(home.slug, games) : undefined,
    a = away ? getStandingForSchoolFromGames(away.slug, games) : undefined;
  const availability = getGameStatAvailability(g.id);
  const preview = getGamePreview(g.id);
  return {
    id: g.id,
    season: g.season,
    week: g.week,
    gameType: g.gameType,
    status: g.status,
    homeSchoolSlug: g.homeSchoolSlug,
    awaySchoolSlug: g.awaySchoolSlug,
    homeTeam: g.homeTeam,
    awayTeam: g.awayTeam,
    kickoff: g.kickoff,
    venue: g.venue,
    venueAddress: g.venueAddress,
    isNeutralSite: g.isNeutralSite,
    districtGame: g.districtGame,
    specialEvent: g.specialEvent,
    featured: g.featured,
    homeScore: g.homeScore,
    awayScore: g.awayScore,
    score: g.score
      ? {
          home: g.score.home,
          away: g.score.away,
          period: g.score.period,
          clock: g.score.clock,
        }
      : undefined,
    publicScoreVerified: g.publicScoreVerified,
    scoreAttribution: g.scoreAttribution
      ? {
          type: g.scoreAttribution.type,
          username: safeScoreUsername(g.scoreAttribution.username),
        }
      : undefined,
    resultType: g.resultType,
    officialWinnerSchoolSlug: g.officialWinnerSchoolSlug,
    winnerName: g.officialWinnerSchoolSlug
      ? getSchoolBySlug(g.officialWinnerSchoolSlug)?.name
      : undefined,
    mediaLinks: g.mediaLinks?.map((l) => ({
      label: l.label,
      url: l.url,
      type: l.type,
    })),
    classification:
      hc && ac && hc !== ac
        ? "Cross-classification"
        : (hc ?? ac ?? "Classification unavailable"),
    searchText:
      `${g.homeTeam} ${g.awayTeam} ${(home?.aliases ?? []).join(" ")} ${(away?.aliases ?? []).join(" ")} ${g.venue} ${locationInfo.locationQuality === "verified" ? locationInfo.city : ""} ${g.specialEvent ?? ""} week ${g.week}`.toLowerCase(),
    locationInfo,
    previewHref: preview ? `/games/${g.id}` : undefined,
    recordLabel:
      [
        a?.overallRecordKnown
          ? `${g.awayTeam} ${a.overallWins}-${a.overallLosses}`
          : "",
        h?.overallRecordKnown
          ? `${g.homeTeam} ${h.overallWins}-${h.overallLosses}`
          : "",
      ]
        .filter(Boolean)
        .join(" · ") || undefined,
    statsLabel: availability
      ? getStatAvailabilityLabel(availability.status)
      : undefined,
  };
}
export function weeklyCenters(): SchoolCenter[] {
  return Object.entries(schoolFootballVenues)
    .flatMap(([schoolSlug, id]) => {
      const v = venues.find(
        (v) =>
          v.id === id && v.verificationStatus === "verified" && validPoint(v),
      );
      return v
        ? [
            {
              schoolSlug,
              schoolName: getSchoolBySlug(schoolSlug)?.name ?? schoolSlug,
              venueName: v.name,
              latitude: v.latitude,
              longitude: v.longitude,
            },
          ]
        : [];
    })
    .sort((a, b) => a.schoolName.localeCompare(b.schoolName));
}
