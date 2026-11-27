import { getPublishedGamePreview } from "@/lib/articles";
import { getGamePresentation } from "@/lib/game-presentation";
import type { Game } from "@/types/platform";

export type GamePreview = {
  gameId: string;
  eyebrow: string;
  title: string;
  excerpt: string;
  paragraphs: string[];
  pregameOnly?: boolean;
  quickFacts?: { label: string; value: string }[];
  coverageHref?: string;
  coverageLabel?: string;
};

export const gamePreviews: GamePreview[] = [
  {
    gameId: "2026-regional-semifinal-2a-d1-ii-1",
    pregameOnly: true,
    eyebrow: "Pregame Matchup Center",
    title: "Can Cisco make Muenster work for its passing yards?",
    excerpt: "Muenster quarterback Asher Hillis needed just eight completions to throw for 218 yards and three touchdowns in a 55–3 win over San Saba. Watch Cisco’s safeties on early downs. If they can keep the receivers in front of them, the Hornets will have to put together longer drives.",
    paragraphs: [
      "Cisco knows how to finish a close game. The Loboes scored 15 fourth-quarter points to beat Johnson City 35–34 last week. Colby McIlroy threw for 132 yards and two touchdowns. A win over Muenster in Springtown would put Cisco in the Class 2A Division I regional final.",
      "Kickoff is 7 p.m. CST. Follow the score here on VarsityVue. For Caleb Galvan’s play-by-play, tap Listen Live · FTLG Radio. Coverage starts at 6:30 p.m. CST. For video, tap Watch Live · NFHS Network (Subscription).",
    ],
  },
  {
    gameId: "2026-regional-semifinal-4a-d1-iii-2",
    pregameOnly: true,
    eyebrow: "Pregame Matchup Center",
    title: "Can Bay City’s ground game keep Trot Jordan on the sideline?",
    excerpt: "Stephenville quarterback Trot Jordan threw for 214 yards and two touchdowns on just six completions in a 38–21 win over Vidor. Bay City’s best chance to limit those big plays may come when its own offense has the ball.",
    paragraphs: [
      "Aiden Williams ran for 212 yards and two touchdowns in Bay City’s 70–28 win over Huffman Hargrave. Watch what he gains on first down. Short-yardage situations give the Blackcats a chance to keep drives going and make the unbeaten Yellow Jackets wait for their next possession.",
      "Stephenville (12–0) and Bay City (11–1) kick off at 2 p.m. CST in Hutto for a spot in the Class 4A Division I regional final. Follow the score here on VarsityVue. Tap Listen Live · KSTV 93.1 FM for radio or Watch Live · NFHS Network (Subscription) for video.",
    ],
  },
  {
    gameId: "2026-regional-semifinal-2a-d2-ii-2",
    pregameOnly: true,
    eyebrow: "Pregame Matchup Center",
    title: "Can Santo take away Goldthwaite’s big plays?",
    excerpt: "Landry Sanderson ran for 338 yards and six touchdowns in Goldthwaite’s 70–38 win over Haskell. Three of his touchdown runs went at least 50 yards. If Santo brings a safety up to help tackle him, watch Aidyn Lee outside. He caught touchdown passes of 80 and 47 yards from Hayes Greenway last week.",
    paragraphs: [
      "Santo has allowed just 16 points in two playoff games. The Wildcats also showed how quickly they can score in their 54–7 win over Wheeler. Wyatt Reed caught two touchdown passes before halftime, and Connor Tibbetts returned a punt 85 yards for another score.",
      "Goldthwaite (12–0) and Santo (11–1) kick off at 7 p.m. in Dublin for a spot in the Class 2A Division II regional final. Follow the score here on VarsityVue. Tap Listen Live · KOXE for the radio call or Video · KOXE broadcast page for the station’s latest video information.",
    ],
  },
  {
    gameId: "2026-regional-semifinal-2a-d1-ii-2",
    pregameOnly: true,
    eyebrow: "Pregame Matchup Center",
    title: "Can De Leon’s ground game keep unbeaten Mason off the field?",
    excerpt: "De Leon ran for 310 yards in its 28–16 Area win over Axtell. Lane Couch carried 29 times for 146 yards, while Bryce Burkeen gained 88 yards and scored twice on just five carries. Watch how Mason’s defense handles those two threats when De Leon has the ball.",
    paragraphs: [
      "Mason enters 12–0 and averages 52.6 points per game. The Punchers showed they can win a low-scoring game, too, beating Tioga 17–12 last week. The winner in Brownwood advances to the Class 2A Division I regional final.",
      "Follow the score live here on VarsityVue. Tap Watch Live · Free on YouTube above to open Dave Campbell’s channel for the broadcast.",
    ],
  },
  {
    gameId: "de-leon-at-cisco-2026-week-11",
    eyebrow: "Week 11 Game of the Week",
    title: "De Leon at Cisco",
    excerpt: "De Leon visits Cisco for the regular-season finale in District 5-2A Division I. Kickoff is 7 p.m. Friday, November 6, at Chesley Field in Cisco.",
    paragraphs: [],
  },
  {
    gameId: "goldthwaite-at-stamford-2026-week-10",
    eyebrow: "Week 10 Game of the Week",
    title: "Goldthwaite at Stamford",
    excerpt: "Goldthwaite (9–0, 5–0 district) visits Stamford (6–2, 4–0 district) at 7 p.m. Friday at Bill Anderson Stadium. The unbeaten district contenders meet with the District 7-2A Division II championship at stake.",
    paragraphs: [],
  },
  {
    gameId: "stephenville-at-jarrell-2026-week-9",
    eyebrow: "Week 9 Game of the Week",
    title: "Stephenville at Jarrell: Two Perfect Seasons, One District Lead",
    excerpt: "Stephenville and Jarrell meet at 7 p.m. Friday with both teams 7-0 overall and 2-0 in District 12-4A Division I. The winner takes sole possession of the district lead with two regular-season games remaining.",
    paragraphs: [],
  },
  {
    gameId: "jacksboro-at-cisco-2026-week-5",
    eyebrow: "Week 5 Game of the Week",
    title: "Jacksboro at Cisco: Who Has More to Prove?",
    excerpt:
      "No. 4 Jacksboro brings a 4–0 record and a 49.5-point scoring average to Chesley Field. Cisco (2–2) is looking to answer last week’s loss at Stamford and make it a four-quarter fight.",
    paragraphs: [],
  },
  {
    gameId: "de-leon-at-goldthwaite-2026-week-4",
    eyebrow: "Week 4 Game of the Week",
    title: "De Leon at Goldthwaite",
    excerpt:
      "Two undefeated teams renew an old rivalry Friday night in Goldthwaite. No. 9 Goldthwaite enters averaging 47.3 points per game, while De Leon has allowed exactly seven points in each of its first three games.",
    quickFacts: [
      { label: "Records", value: "De Leon 3-0 · Goldthwaite 3-0" },
      { label: "Scoring", value: "De Leon 139 PF / 21 PA · Goldthwaite 142 PF / 44 PA" },
      { label: "Strength vs. Strength", value: "De Leon: 7.0 PPG allowed · Goldthwaite: 47.3 PPG scored" },
      { label: "Series History", value: "47th recorded meeting · De Leon leads 25-21" },
      { label: "Common Opponent", value: "De Leon 40-7 San Saba · Goldthwaite 35-17 San Saba" },
    ],
    paragraphs: [],
    coverageHref: "/coverage/de-leon-goldthwaite-week-4-seven-meets-47",
    coverageLabel: "Read Game of the Week Preview →",
  },
  {
    gameId: "stamford-at-hawley-2026-week-3",
    eyebrow: "Week 3 Game of the Week",
    title: "Familiar foes meet again at Forrest Field",
    excerpt:
      "Former district rivals Stamford and Hawley meet again in Week 3, now competing in different divisions but carrying plenty of familiarity into Friday night.",
    paragraphs: [
      "Familiar foes meet again Friday night when Stamford travels to Forrest Field to face Hawley in a matchup between former district rivals.",
      "The Bulldogs and Bearcats shared a district a year ago, but realignment has sent them down different paths in 2026. Stamford dropped to Division II while Hawley remained in Division I. The classification may have changed, but there won’t be much unfamiliarity when these two line up across from one another.",
      "Stamford enters Week 3 looking for an offensive response. The Bulldogs erupted for 80 points against Haskell in Week 1 before De Leon held them to just 7 points in Week 2. Friday gives Stamford an opportunity to show that opening-week explosion was no fluke.",
      "Hawley, meanwhile, has already played two games decided by a single possession. The Bearcats opened with a seven-point loss to Albany before bouncing back with a one-point victory over Merkel. Now they’ll try to build on that win and move to 2-1.",
      "Two programs that know each other well. Two teams with something to prove. And a former district rivalry renewed under different classifications.",
    ],
  },
];

export function getGamePreview(gameId: string) {
  const preview = gamePreviews.find((entry) => entry.gameId === gameId);
  if (!preview) return undefined;

  const article = getPublishedGamePreview(gameId);
  if (!article) return preview;

  return {
    ...preview,
    coverageHref: `/coverage/${article.slug}`,
    coverageLabel: "Read Game Preview →",
  };
}

export function getVisibleGamePreview(game: Game, now?: Date) {
  const preview = getGamePreview(game.id);
  if (preview?.pregameOnly && getGamePresentation(game, now).kind !== "scheduled") return undefined;
  return preview;
}
