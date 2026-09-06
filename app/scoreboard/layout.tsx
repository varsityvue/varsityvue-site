import type { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = {
  title: {
    default: "Texas High School Football Scores | VarsityVue",
    template: "%s",
  },
  alternates: {
    canonical: "/scoreboard",
  },
  openGraph: {
    url: "/scoreboard",
  },
};

export default function ScoreboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
