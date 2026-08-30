export type PlayerProfile = {
  playerId: string;
  season: number;
  schoolSlug: string;
  name: string;
  jerseyNumber?: string;
  grade?: "Freshman" | "Sophomore" | "Junior" | "Senior";
  positions?: string[];
  height?: string;
  weight?: number;
  hometown?: string;
  photoUrl?: string;
  bio?: string;
  verificationStatus: "verified";
};

// Add roster/bio details here only after they have been verified through a
// school, coach, official roster, or another source VarsityVue trusts.
// Statistical player records do not require a profile entry; this registry is
// reserved for non-statistical athlete information such as jersey number,
// grade, position, height, weight, and profile media.
export const playerProfiles: PlayerProfile[] = [];
