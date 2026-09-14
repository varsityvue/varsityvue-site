export type VarsityVueUserRole =
  | "member"
  | "scorekeeper"
  | "moderator"
  | "admin";

export type ScoreSubmissionStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "superseded";

export type ScoreSubmissionEventType =
  | "submitted"
  | "approved"
  | "rejected"
  | "superseded"
  | "note_added";

export type DynamicGameStatus =
  | "scheduled"
  | "upcoming"
  | "live"
  | "final"
  | "postponed"
  | "cancelled";

export type MemberProfile = {
  id: string;
  displayName?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  favoriteSchoolSlug?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DynamicGameState = {
  gameId: string;
  status: DynamicGameStatus;
  homeScore?: number | null;
  awayScore?: number | null;
  period?: string | null;
  clock?: string | null;
  sourceSubmissionId?: string | null;
  verified: boolean;
  verifiedAt?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ScoreSubmission = {
  id: string;
  gameId: string;
  submittedBy: string;
  homeScore: number;
  awayScore: number;
  gameStatus: Exclude<DynamicGameStatus, "scheduled">;
  period?: string | null;
  clock?: string | null;
  sourceNote?: string | null;
  sourceUrl?: string | null;
  status: ScoreSubmissionStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ScoreSubmissionEvent = {
  id: number;
  submissionId: string;
  eventType: ScoreSubmissionEventType;
  actorId?: string | null;
  note?: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type PickemWeekStatus = "draft" | "open" | "locked" | "graded";

export type PickemWeek = {
  id: string;
  season: number;
  week: number;
  title: string;
  status: PickemWeekStatus;
  opensAt?: string | null;
  closesAt?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PickemGame = {
  id: string;
  weekId: string;
  gameId: string;
  sortOrder: number;
  lockAt: string;
  resultWinnerSchoolSlug?: string | null;
  gradedAt?: string | null;
  createdAt: string;
};

export type PickemPick = {
  id: string;
  pickemGameId: string;
  userId: string;
  pickedSchoolSlug: string;
  isCorrect?: boolean | null;
  submittedAt: string;
  updatedAt: string;
};

export type PickemStanding = {
  userId: string;
  displayName?: string | null;
  username?: string | null;
  gradedPicks: number;
  correctPicks: number;
  incorrectPicks: number;
  accuracyPct: number;
};
