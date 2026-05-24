export type SportKey =
  | "football"
  | "volleyball"
  | "basketball"
  | "baseball"
  | "softball"
  | "track"
  | "cross-country"
  | "powerlifting"
  | "golf"
  | "tennis"
  | "soccer";

export type CoverageStatus =
  | "pilot"
  | "watchlist"
  | "planned"
  | "active"
  | "archived";

export type UILDivision = "D1" | "D2" | null;

export type UILClassification = {
  conference: "1A" | "2A" | "3A" | "4A" | "5A" | "6A";
  division: UILDivision;
};

export type SchoolColors = {
  primary: string;
  secondary: string;
  accent: string;
};

export type School = {
  id: string;
  slug: string;

  name: string;
  fullName: string;
  mascot: string;
  abbreviation: string;

  classification: UILClassification;
  districtId: string;
  uilRegion: 1 | 2 | 3 | 4;

  coverageMarket?: string;
  stadium?: string;

  colors: SchoolColors;

  sports: SportKey[];

  status: CoverageStatus;
};

export type District = {
  id: string;
  slug: string;

  name: string;
  classification: UILClassification;
  uilRegion: 1 | 2 | 3 | 4;

  coverageMarket?: string;

  status: CoverageStatus;
};

export type GameStatus =
  | "scheduled"
  | "live"
  | "final"
  | "postponed"
  | "cancelled";

export type Game = {
  id: string;
  slug: string;

  sport: SportKey;
  season: number;
  week?: number;

  homeSchoolId: string;
  awaySchoolId: string;

  date: string;
  time?: string;
  location?: string;

  districtGame: boolean;
  status: GameStatus;

  score?: {
    home: number;
    away: number;
    period?: string;
  };

  sponsorIds?: string[];
  articleIds?: string[];
};

export type ArticleType =
  | "preview"
  | "recap"
  | "news"
  | "feature"
  | "legacy";

export type Article = {
  id: string;
  slug: string;

  title: string;
  subtitle?: string;
  excerpt: string;
  body: string;

  type: ArticleType;

  author: string;
  publishedAt: string;
  updatedAt?: string;

  schoolIds?: string[];
  districtIds?: string[];
  gameId?: string;

  tags: string[];

  seo: {
    title: string;
    description: string;
  };

  aiAssisted: boolean;
  humanReviewed: boolean;
};

export type SponsorTier =
  | "founding"
  | "premium"
  | "standard"
  | "supporter";

export type SponsorPlacement =
  | "homepage_strip"
  | "school_hub"
  | "district_hub"
  | "game_page"
  | "score_strip"
  | "article_inline";

export type Sponsor = {
  id: string;
  slug: string;
  name: string;

  logoUrl?: string;
  websiteUrl?: string;
  phone?: string;

  tier: SponsorTier;
  placements: SponsorPlacement[];

  associatedSchoolIds?: string[];
  associatedDistrictIds?: string[];

  active: boolean;
};

export type LegacyRecordType =
  | "season_record"
  | "rivalry_record"
  | "playoff_history"
  | "notable_team"
  | "state_appearance"
  | "state_title"
  | "community_note";

export type VerificationStatus =
  | "unverified"
  | "pending_review"
  | "verified";

export type LegacyRecord = {
  id: string;

  schoolId: string;
  sport: SportKey;

  type: LegacyRecordType;

  season?: number;
  title: string;
  description: string;

  opponentSchoolId?: string;

  source?: {
    label: string;
    url?: string;
    submittedBy?: string;
  };

  verificationStatus: VerificationStatus;

  createdAt: string;
  updatedAt?: string;
};

export type RankingScope = "state" | "regional" | "classification" | "district";

export type RankingEntry = {
  id: string;
  rank: number;

  sport: SportKey;
  season: number;
  week?: number;

  scope: RankingScope;
  classification?: UILClassification;

  schoolId: string;
  previousRank?: number | null;

  record: string;
  note: string;

  humanReviewed: boolean;
  updatedAt: string;
};