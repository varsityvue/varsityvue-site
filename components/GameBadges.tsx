import type { Game } from "@/types/platform";

type GameBadgesProps = {
  game: Game;
  variant?: "default" | "hero";
};

export default function GameBadges({
  game,
  variant = "default",
}: GameBadgesProps) {
  if (variant === "hero" && game.status === "final") {
    const awayScore = game.awayScore ?? game.score?.away;
    const homeScore = game.homeScore ?? game.score?.home;

    if (typeof awayScore === "number" && typeof homeScore === "number") {
      return (
        <div className="rounded-2xl border border-white/10 bg-black/45 px-5 py-4 text-center">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-white/45">
            Final
          </p>
          <div className="mt-2 flex flex-wrap items-baseline justify-center gap-x-4 gap-y-2">
            <span className="text-lg font-black uppercase text-white/70">
              {game.awayTeam}
            </span>
            <span className="text-5xl font-black leading-none text-white">
              {awayScore}
            </span>
            <span className="text-2xl font-black text-white/30">–</span>
            <span className="text-5xl font-black leading-none text-white">
              {homeScore}
            </span>
            <span className="text-lg font-black uppercase text-white/70">
              {game.homeTeam}
            </span>
          </div>
        </div>
      );
    }
  }

  const badges = getGameBadges(game);

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <span
          key={badge}
          className={`rounded-full border border-white/15 bg-white/10 font-black uppercase text-white/80 ${
            variant === "hero"
              ? "px-4 py-2 text-xs tracking-[0.18em]"
              : "px-3 py-1.5 text-[10px] tracking-[0.14em]"
          }`}
        >
          {badge}
        </span>
      ))}
    </div>
  );
}

function getGameBadges(game: Game) {
  const badges: string[] = [];

  if (game.status === "final") badges.push("Final");
  if (game.featured) badges.push("Featured");
  if (game.coverageStatus === "planned" && game.status !== "final") {
    badges.push("Planned Coverage");
  }
  if (game.districtGame) badges.push("District Game");
  if (game.specialEvent) badges.push(game.specialEvent);
  if (game.gameType === "scrimmage") badges.push("Scrimmage");
  if (game.gameType === "playoff") badges.push("Playoff");

  return badges;
}
