import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "2026 Football Stat Leaders | VarsityVue",
    template: "%s",
  },
  alternates: {
    canonical: "/stats",
  },
  openGraph: {
    url: "/stats",
  },
};

export default function StatsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
