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
  ["0", "Keegan Bostic", "Junior", ["TE", "DL"]],
  ["1", "Lane Couch", "Junior", ["RB", "LB"]],
  ["2", "Bentley Lingle", "Junior", ["WR", "DB"]],
  ["3", "Trenton Zmeskal", "Senior", ["WR", "LB"]],
  ["4", "Andrew Campbell", "Senior", ["WR", "DB"]],
  ["5", "Bryce Burkeen", "Senior", ["WR", "DB"]],
  ["6", "Kayden Tobar", "Senior", ["WR", "LB"]],
  ["7", "Collin Mathews", "Junior", ["WR", "LB"]],
  ["8", "Beau Morris", "Junior", ["QB", "CB"]],
  ["9", "Jayden Lindley", "Senior", ["WR", "DB"]],
  ["10", "Samuel Martinez", "Junior", ["TE", "OLB"]],
  ["11", "Caden Morganstean", "Senior", ["WR", "DB"]],
  ["12", "Hud Price", "Senior", ["QB", "DB"]],
  ["14", "Alex Reyna", "Senior", ["TE", "DL"]],
  ["15", "Andrew Otwell", "Junior", ["WR", "DB"]],
  ["20", "Dominic Gonzales", "Junior", ["RB", "LB"]],
  ["21", "Ed Garcia", "Senior", ["RB", "LB"]],
  ["23", "Alex Silva", "Senior", ["WR", "CB"]],
  ["25", "Harley Pinckard", "Senior", ["WR", "DB"]],
  ["35", "AJ Stewart", "Junior", ["TE", "LB"]],
  ["50", "Ethan Tepetate", "Junior", ["OL", "DL"]],
  ["51", "Gage Heinz", "Senior", ["OL", "DL"]],
  ["52", "Eli Garza", "Senior", ["OL", "DL"]],
  ["53", "Hunter Hatch", "Sophomore", ["OL", "DL"]],
  ["54", "Jack Thompson", "Senior", ["OL", "DL"]],
  ["55", "Ben Leal", "Junior", ["OL", "DL"]],
  ["58", "Blayne Sides", "Senior", ["OL", "DL"]],
  ["62", "Silas Winegeart", "Senior", ["OL", "DL"]],
  ["65", "Juan Garcia", "Senior", ["OL", "DL"]],
  ["73", "Baylor Whiteley", "Senior", ["OL", "DL"]],
  ["78", "Hagen Hare", "Senior", ["OL", "DL"]],
] as const;

export const playerProfiles: PlayerProfile[] = DE_LEON_2026.map(([jerseyNumber, name, grade, positions]) => ({
  playerId: getPlayerId("de-leon", name, 2026),
  season: 2026,
  schoolSlug: "de-leon",
  name,
  jerseyNumber,
  grade,
  positions: [...positions],
  verificationStatus: "verified",
}));
