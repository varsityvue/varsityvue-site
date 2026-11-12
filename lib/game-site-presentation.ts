import type { Game } from "@/types/platform";
type Site = Pick<Game, "isNeutralSite" | "designatedSidesConfirmed">;
/** Storage order is not evidence of a designated home team. */
export function gameSiteLabel(game: Site, isHome: boolean): string {
  if (game.isNeutralSite === true) return "Neutral site";
  if (game.designatedSidesConfirmed === false) return "Matchup";
  if (game.isNeutralSite === null) return isHome ? "Designated home" : "Designated away";
  return isHome ? "Home" : "Away";
}
export function gameOpponentPrefix(game: Site, isHome = false): string {
  return game.isNeutralSite === true || game.isNeutralSite === null || game.designatedSidesConfirmed === false || isHome ? "vs." : "at";
}
