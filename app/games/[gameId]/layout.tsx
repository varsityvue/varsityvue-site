import type { Metadata } from "next";
import { getGameById } from "@/lib/games";

type GameLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ gameId: string }>;
};

export async function generateMetadata({ params }: Omit<GameLayoutProps, "children">): Promise<Metadata> {
  const { gameId } = await params;
  const game = getGameById(gameId);

  if (!game) {
    return {
      title: {
        default: "Game Not Found",
        template: "%s",
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const shouldNoIndex =
    game.gameType === "scrimmage" ||
    game.gameType === "bye" ||
    game.status === "scheduled" ||
    game.status === "cancelled" ||
    game.status === "postponed";

  return {
    title: {
      default: `${game.awayTeam ?? "Away Team"} at ${game.homeTeam ?? "Home Team"} | VarsityVue`,
      template: "%s",
    },
    alternates: {
      canonical: `/games/${game.id}`,
    },
    openGraph: {
      url: `/games/${game.id}`,
    },
    robots: shouldNoIndex
      ? {
          index: false,
          follow: true,
        }
      : {
          index: true,
          follow: true,
        },
  };
}

export default function GameLayout({ children }: GameLayoutProps) {
  return children;
}
