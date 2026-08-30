import { getPlayerId } from "@/lib/player-identity";

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
// reserved for verified non-statistical athlete information.

const DE_LEON_2026 = [
  ["Keegan Bostic", "Junior", ["TE", "DL"]],
  ["Lane Couch", "Junior", ["RB", "LB"]],
  ["Bentley Lingle", "Junior", ["WR", "DB"]],
  ["Trenton Zmeskal", "Senior", ["WR", "LB"]],
  ["Andrew Campbell", "Senior", ["WR", "DB"]],
  ["Bryce Burkeen", "Senior", ["WR", "DB"]],
  ["Kayden Tobar", "Senior", ["WR", "LB"]],
  ["Collin Mathews", "Junior", ["WR", "LB"]],
  ["Beau Morris", "Junior", ["QB", "CB"]],
  ["Jayden Lindley", "Senior", ["WR", "DB"]],
  ["Samuel Martinez", "Junior", ["TE", "OLB"]],
  ["Caden Morganstean", "Senior", ["WR", "DB"]],
  ["Hud Price", "Senior", ["QB", "DB"]],
  ["Alex Reyna", "Senior", ["TE", "DL"]],
  ["Andrew Otwell", "Junior", ["WR", "DB"]],
  ["Dominic Gonzales", "Junior", ["RB", "LB"]],
  ["Ed Garcia", "Senior", ["RB", "LB"]],
  ["Alex Silva", "Senior", ["WR", "CB"]],
  ["Harley Pinckard", "Senior", ["WR", "DB"]],
  ["AJ Stewart", "Junior", ["TE", "LB"]],
  ["Ethan Tepetate", "Junior", ["OL", "DL"]],
  ["Gage Heinz", "Senior", ["OL", "DL"]],
  ["Eli Garza", "Senior", ["OL", "DL"]],
  ["Hunter Hatch", "Sophomore", ["OL", "DL"]],
  ["Jack Thompson", "Senior", ["OL", "DL"]],
  ["Ben Leal", "Junior", ["OL", "DL"]],
  ["Blayne Sides", "Senior", ["OL", "DL"]],
  ["Silas Winegeart", "Senior", ["OL", "DL"]],
  ["Juan Garcia", "Senior", ["OL", "DL"]],
  ["Baylor Whiteley", "Senior", ["OL", "DL"]],
  ["Hagen Hare", "Senior", ["OL", "DL"]],
] as const;

export const playerProfiles: PlayerProfile[] = DE_LEON_2026.map(([name, grade, positions]) => ({
  playerId: getPlayerId("de-leon", name, 2026),
  season: 2026,
  schoolSlug: "de-leon",
  name,
  grade,
  positions: [...positions],
  verificationStatus: "verified",
}));
