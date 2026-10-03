import type { Game } from "@/types/platform";
import type { DiscoveryGame, GameLocation, Venue } from "@/types/game-location";
import { validPoint } from "./geo-distance";

export function resolveGameLocation(game: Game, venues: readonly Venue[],
  schools: Readonly<Record<string, string>>, overrides: Readonly<Record<string, string>>): GameLocation {
  const explicit = Object.hasOwn(overrides, game.id);
  if (!explicit && (game.isNeutralSite || game.gameType === "playoff")) {
    return { locationQuality: "unavailable", reason: "explicit_venue_required" };
  }
  const id = explicit ? overrides[game.id] : schools[game.homeSchoolSlug ?? ""];
  const venue = venues.find(v => v.id === id);
  if (!venue) return { locationQuality: "unavailable", reason: "missing_venue" };
  if (venue.verificationStatus !== "verified" || !validPoint(venue)) {
    return { locationQuality: "unavailable", reason: "unverified_venue" };
  }
  return { locationQuality: "verified", locationSource: explicit ? "game_override" : "home_venue",
    venueName: venue.name, city: venue.city, latitude: venue.latitude, longitude: venue.longitude };
}

// Construct, never spread, the public DTO. Repository verification sources stay server-side.
export function toDiscoveryGame(game: Game, location: GameLocation): DiscoveryGame {
  return { gameId: game.id, season: game.season, week: game.week,
    homeTeam: game.homeTeam ?? "Home Team", awayTeam: game.awayTeam ?? "Away Team",
    homeSchoolSlug: game.homeSchoolSlug, awaySchoolSlug: game.awaySchoolSlug,
    kickoff: game.kickoff, status: game.status, gameType: game.gameType, districtGame: game.districtGame,
    homeScore: game.homeScore, awayScore: game.awayScore, period: game.score?.period, clock: game.score?.clock,
    livePresentation: game.status === "live" ? (game.publicScoreVerified ? "score_available" : "kickoff_inferred") : null,
    location: location.locationQuality === "verified" ? {
      locationQuality: "verified", locationSource: location.locationSource, venueName: location.venueName,
      city: location.city, latitude: location.latitude, longitude: location.longitude,
    } : { locationQuality: "unavailable", reason: location.reason } };
}
