import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "VarsityVue",
    short_name: "VarsityVue",
    description:
      "Texas high school football scores, schedules, standings, school hubs, matchup pages, player statistics, and local coverage.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#05070A",
    theme_color: "#8B1020",
    orientation: "portrait-primary",
    lang: "en-US",
    dir: "ltr",
    categories: ["sports", "news"],
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcuts: [
      {
        name: "Scoreboard",
        short_name: "Scores",
        description: "Open the latest VarsityVue football scores and game status.",
        url: "/scoreboard",
      },
      {
        name: "School Hubs",
        short_name: "Schools",
        description: "Browse VarsityVue school hubs, schedules, rosters, and coverage.",
        url: "/schools",
      },
      {
        name: "Stat Leaders",
        short_name: "Stats",
        description: "View verified VarsityVue football stat leaders.",
        url: "/stats",
      },
    ],
  };
}
