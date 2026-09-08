import type { ReactNode } from "react";
import type { Metadata } from "next";

type Props = {
  children: ReactNode;
  params: Promise<{ playerId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { playerId } = await params;
  return {
    alternates: {
      canonical: `/players/${playerId}`,
    },
  };
}

export default function PlayerLayout({ children }: Props) {
  return children;
}
