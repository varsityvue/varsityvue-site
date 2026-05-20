import type { Article } from "@/types/platform";

export const articles: Article[] = [
  {
    id: "de-leon-preview-1",
    slug: "de-leon-vs-hamilton-preview",

    title: "Bearcats Set for Key District Matchup Against Hamilton",
    subtitle: "District race tightening as De Leon builds momentum",
    excerpt:
      "De Leon enters Friday night with momentum as the district race tightens.",

    body:
      "De Leon enters this district matchup with a chance to strengthen its position in the standings. The Bearcats have leaned on balanced offensive play and timely defensive stops throughout the season. Hamilton brings a physical style, making this one of the key games to watch in the district race.",

    type: "preview",

    author: "VarsityVue Staff",
    publishedAt: "2025-10-28T09:00:00-05:00",

    schoolIds: ["de-leon"],
    gameId: "de-leon-vs-hamilton-2025-week-11",

    tags: ["football", "district", "preview", "de-leon"],

    seo: {
      title: "De Leon vs Hamilton Preview | VarsityVue",
      description:
        "Preview of De Leon's key district football matchup against Hamilton.",
    },

    aiAssisted: false,
    humanReviewed: true,
  },

  {
    id: "de-leon-spotlight-1",
    slug: "de-leon-qb-player-spotlight",

    title: "Player Spotlight: Bearcats QB Leads Offensive Surge",
    subtitle: "Offensive rhythm continues to improve",
    excerpt:
      "The De Leon offense continues to find rhythm behind strong quarterback play.",

    body:
      "The Bearcats offense has found rhythm behind confident quarterback play and improved execution. As the season progresses, De Leon continues to build around its offensive identity and weekly improvement.",

    type: "feature",

    author: "VarsityVue Staff",
    publishedAt: "2025-10-24T09:00:00-05:00",

    schoolIds: ["de-leon"],

    tags: ["football", "player spotlight", "de-leon"],

    seo: {
      title: "De Leon Player Spotlight | VarsityVue",
      description:
        "Spotlight coverage on De Leon football leadership and offensive momentum.",
    },

    aiAssisted: false,
    humanReviewed: true,
  },

  {
    id: "stephenville-preview-1",
    slug: "stephenville-brownwood-preview",

    title: "Yellow Jackets Eye Statement Win Over Brownwood",
    subtitle: "Stephenville looks to stay in control",
    excerpt:
      "Stephenville looks to maintain control of district standings this week.",

    body:
      "Stephenville enters the week looking to stay sharp in a matchup with major district implications. The Yellow Jackets continue to set the tone with consistency, depth, and championship expectations.",

    type: "preview",

    author: "VarsityVue Staff",
    publishedAt: "2025-10-30T09:00:00-05:00",

    schoolIds: ["stephenville"],
    gameId: "stephenville-vs-brownwood-2026-week-2",

    tags: ["football", "preview", "stephenville"],

    seo: {
      title: "Stephenville vs Brownwood Preview | VarsityVue",
      description:
        "VarsityVue preview coverage of Stephenville's matchup with Brownwood.",
    },

    aiAssisted: false,
    humanReviewed: true,
  },

  {
    id: "comanche-recap-1",
    slug: "comanche-eastland-recap",

    title: "Comanche Escapes With Late Win Over Eastland",
    subtitle: "Fourth-quarter stand seals district win",
    excerpt:
      "A fourth-quarter defensive stand sealed a crucial district victory.",

    body:
      "Comanche held on late against Eastland in a game that came down to execution in the final minutes. The win gives Comanche valuable momentum heading deeper into district play.",

    type: "recap",

    author: "VarsityVue Staff",
    publishedAt: "2025-10-25T09:00:00-05:00",

    schoolIds: ["comanche", "eastland"],
    gameId: "comanche-vs-eastland-2025-week-9",

    tags: ["football", "recap", "district", "comanche"],

    seo: {
      title: "Comanche vs Eastland Recap | VarsityVue",
      description:
        "VarsityVue recap coverage of Comanche's district win over Eastland.",
    },

    aiAssisted: false,
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