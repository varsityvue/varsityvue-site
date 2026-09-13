import type { Metadata } from "next";

const title = "Texas High School Football Scores, Schedules & Matchups | VarsityVue";
const description =
  "Browse Texas high school football schedules, scores, district matchups, kickoff times, venues, previews, and VarsityVue game coverage.";

export const metadata: Metadata = {
  alternates: {
    canonical: "/games",
  },
  openGraph: {
    title,
    description,
    url: "/games",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function GamesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
