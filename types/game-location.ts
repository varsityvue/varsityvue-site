import type { GameStatus, GameType } from "./platform";

export type Venue = {
  id: string; name: string; address: string; city: string; state: "TX"; zip: string;
  latitude: number; longitude: number;
  verificationStatus: "verified" | "needs_review";
  sourceReferences: string[]; verifiedAt: string; aliases: string[];
};

export type GameLocation = {
  locationQuality: "verified"; locationSource: "game_override" | "home_venue";
  venueName: string; city: string; latitude: number; longitude: number;
} | {
  locationQuality: "unavailable";
  reason: "missing_venue" | "unverified_venue" | "explicit_venue_required";
};

export type DiscoveryGame = {
  gameId: string; season: number; week?: number; homeTeam: string; awayTeam: string;
  homeSchoolSlug?: string; awaySchoolSlug?: string; kickoff?: string;
  status: GameStatus; gameType: GameType; districtGame: boolean;
  homeScore?: number; awayScore?: number; period?: string; clock?: string;
  livePresentation: "score_available" | "kickoff_inferred" | null;
  location: GameLocation;
};

export type SchoolCenter = {
  schoolSlug: string; schoolName: string; venueName: string;
  latitude: number; longitude: number;
};
