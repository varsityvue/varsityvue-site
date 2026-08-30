import { playerProfiles } from "@/data/player-profiles";

export function getPlayerProfile(playerId: string, season = 2026) {
  return playerProfiles.find(
    (profile) => profile.playerId === playerId && profile.season === season
  );
}

export function getSchoolPlayerProfiles(schoolSlug: string, season = 2026) {
  return playerProfiles.filter(
    (profile) => profile.schoolSlug === schoolSlug && profile.season === season
  );
}
