export type GamePreview = {
  gameId: string;
  eyebrow: string;
  title: string;
  excerpt: string;
  paragraphs: string[];
};

export const gamePreviews: GamePreview[] = [
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
  return gamePreviews.find((preview) => preview.gameId === gameId);
}
