import type { Article } from "@/types/platform";

export const articles: Article[] = [
  {
    id: "stamford-hawley-week-3-preview-2026",
    slug: "stamford-hawley-week-3-familiar-foes-forrest-field",
    title: "Familiar foes meet again at Forrest Field",
    subtitle: "Former district rivals Stamford and Hawley renew a familiar matchup in VarsityVue’s Week 3 Game of the Week.",
    excerpt:
      "Former district rivals Stamford and Hawley meet again in Week 3, now competing in different divisions but carrying plenty of familiarity into Friday night.",
    body:
      "Familiar foes meet again Friday night when Stamford travels to Forrest Field to face Hawley in a matchup between former district rivals.\n\nThe Bulldogs and Bearcats shared a district a year ago, but realignment has sent them down different paths in 2026. Stamford dropped to Division II while Hawley remained in Division I. The classification may have changed, but there won’t be much unfamiliarity when these two line up across from one another.\n\nStamford enters Week 3 looking for an offensive response. The Bulldogs erupted for 80 points against Haskell in Week 1 before De Leon held them to just 7 points in Week 2. Friday gives Stamford an opportunity to show that opening-week explosion was no fluke.\n\nHawley, meanwhile, has already played two games decided by a single possession. The Bearcats opened with a seven-point loss to Albany before bouncing back with a one-point victory over Merkel. Now they’ll try to build on that win and move to 2-1.\n\nKickoff is scheduled for 7:00 p.m. Friday, September 11, at Forrest Field.\n\nTwo programs that know each other well. Two teams with something to prove. And a former district rivalry renewed under different classifications.",
    type: "preview",
    author: "VarsityVue",
    publishedAt: "2026-09-07T14:00:00-05:00",
    schoolIds: ["stamford", "hawley"],
    gameId: "stamford-at-hawley-2026-week-3",
    tags: ["Week 3", "Game of the Week", "Stamford", "Hawley", "Game Preview"],
    seo: {
      title: "Stamford vs. Hawley Week 3 Game Preview",
      description:
        "Preview Stamford at Hawley in VarsityVue’s Week 3 Game of the Week, with matchup context, recent results and kickoff information for Friday at Forrest Field.",
    },
    aiAssisted: true,
    humanReviewed: true,
  },
];

export function getArticlesForSchool(slug: string) {
  return articles
    .filter((article) => article.schoolIds?.includes(slug))
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() -
        new Date(a.publishedAt).getTime()
    );
}

export function getArticleBySlug(slug: string) {
  return articles.find((article) => article.slug === slug);
}

export function getArticlesForDistrict(districtId: string) {
  return articles
    .filter((article) => article.districtIds?.includes(districtId))
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() -
        new Date(a.publishedAt).getTime()
    );
}
