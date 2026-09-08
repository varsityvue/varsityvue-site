import type { ReactNode } from "react";
import type { Metadata } from "next";

type Props = {
  children: ReactNode;
  params: Promise<{ districtSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { districtSlug } = await params;
  return {
    alternates: {
      canonical: `/stats/districts/${districtSlug}`,
    },
  };
}

export default function DistrictStatsLayout({ children }: Props) {
  return children;
}
