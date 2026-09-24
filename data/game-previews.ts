import { getPublishedGamePreview } from "@/lib/articles";

export type GamePreview = {
  gameId: string;
  eyebrow: string;
  title: string;
  excerpt: string;
  paragraphs: string[];
  quickFacts?: { label: string; value: string }[];
  coverageHref?: string;
  coverageLabel?: string;
};

export const gamePreviews: GamePreview[] = [
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
