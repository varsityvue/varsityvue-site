import type { Game } from "@/types/platform";

type GameBadgesProps = {
    game: Game;
    variant?: "default" | "hero";
};

export default function GameBadges({
    game,
    variant = "default",
}: GameBadgesProps) {
    const badges = getGameBadges(game);

    if (badges.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2">
            {badges.map((badge) => (
                <span
                    key={badge}
                    className={`rounded-full border border-white/15 bg-white/10 font-black uppercase text-white/80 ${variant === "hero"
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

    if (game.featured) badges.push("Featured");
    if (game.coverageStatus === "planned") badges.push("Planned Coverage");
    if (game.districtGame) badges.push("District Game");
    if (game.specialEvent) badges.push(game.specialEvent);
    if (game.gameType === "scrimmage") badges.push("Scrimmage");
    if (game.gameType === "playoff") badges.push("Playoff");

    return badges;
}