import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VarsityVue",
    short_name: "VarsityVue",
    description:
      "Texas high school football scores, schedules, standings, school hubs, matchup pages, player statistics, and local coverage.",
    start_url: "/",
    display: "standalone",
    background_color: "#05070A",
    theme_color: "#8B1020",
    orientation: "portrait-primary",
    categories: ["sports", "news"],
    icons: [
      {
        src: "/varsityvue-v-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/varsityvue-v-icon-180.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
