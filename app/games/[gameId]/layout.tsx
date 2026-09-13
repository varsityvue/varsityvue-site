import type { Metadata } from "next";
import { getGameById } from "@/lib/games";
import { getSchoolBySlug } from "@/lib/schools";

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

  const homeSchool = game.homeSchoolSlug
    ? getSchoolBySlug(game.homeSchoolSlug)
    : undefined;
  const awaySchool = game.awaySchoolSlug
    ? getSchoolBySlug(game.awaySchoolSlug)
    : undefined;
  const hasFeaturedProgram =
    homeSchool?.status === "pilot" || awaySchool?.status === "pilot";

  const shouldNoIndex =
    game.gameType === "scrimmage" ||
    game.gameType === "bye" ||
    game.status === "scheduled" ||
    game.status === "cancelled" ||
    game.status === "postponed" ||
    !hasFeaturedProgram;

  const awayTeam = game.awayTeam ?? "Away Team";
  const homeTeam = game.homeTeam ?? "Home Team";
  const title = `${awayTeam} at ${homeTeam} | VarsityVue`;
  const description = `Follow ${awayTeam} at ${homeTeam} with scores, matchup details, schedules, and verified football coverage on VarsityVue.`;
  const url = `/games/${game.id}`;

  return {
    title: {
      default: title,
      template: "%s",
    },
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: [
        {
          url: "/games/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${awayTeam} at ${homeTeam} on VarsityVue`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/games/twitter-image"],
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

export default async function GameLayout({ children, params }: GameLayoutProps) {
  const { gameId } = await params;
  const game = getGameById(gameId);
  const awayScore = game?.awayScore ?? game?.score?.away;
  const homeScore = game?.homeScore ?? game?.score?.home;
  const hasLiveScore =
    game?.status === "live" &&
    typeof awayScore === "number" &&
    typeof homeScore === "number";

  return (
    <>
      {hasLiveScore && game && (
        <div className="border-b border-red-500/20 bg-[#120507] px-4 py-3 text-white sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 rounded-2xl border border-red-500/25 bg-black/35 px-4 py-3 shadow-[0_0_30px_rgba(139,16,32,0.18)] sm:px-5">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-300">Live Score</p>
              <p className="mt-1 truncate text-sm font-black text-white sm:text-base">
                {game.awayTeam ?? "Away"} {awayScore} <span className="mx-1 text-white/30">—</span> {game.homeTeam ?? "Home"} {homeScore}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-white/75">
                {game.score?.period ?? "Live"}
              </p>
              <p className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-white/35">In Progress</p>
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
