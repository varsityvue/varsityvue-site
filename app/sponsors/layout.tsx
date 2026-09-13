import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "/sponsor-inquiry",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function SponsorsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
