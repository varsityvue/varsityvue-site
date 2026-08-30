import { playerProfiles, type PlayerProfile } from "@/data/player-profiles";

export type SchoolRosterEntry = PlayerProfile;

export function getSchoolRoster(schoolSlug: string, season = 2026): SchoolRosterEntry[] {
  return playerProfiles
    .filter((player) => player.schoolSlug === schoolSlug && player.season === season)
    .sort((a, b) => {
      const aNumber = Number(a.jerseyNumber);
      const bNumber = Number(b.jerseyNumber);
      const aHasNumber = Number.isFinite(aNumber);
      const bHasNumber = Number.isFinite(bNumber);

      if (aHasNumber && bHasNumber && aNumber !== bNumber) return aNumber - bNumber;
      if (aHasNumber !== bHasNumber) return aHasNumber ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

export function getRosterPlayer(playerId: string, season = 2026) {
  return playerProfiles.find(
    (player) => player.playerId === playerId && player.season === season
  );
}

export function hasVerifiedRoster(schoolSlug: string, season = 2026) {
  return getSchoolRoster(schoolSlug, season).length > 0;
}
