import { getGames } from "./games";
import { resolveGameLocation,toDiscoveryGame } from "./game-location";
import { venues } from "../data/venues";
import { schoolFootballVenues } from "../data/school-football-venues";
import { gameVenueOverrides } from "../data/game-venue-overrides";
import { buildSearchSummary } from "./coverage-demand-summary";
export const fixtureGames=getGames().map(g=>toDiscoveryGame(g,resolveGameLocation(g,venues,schoolFootballVenues,gameVenueOverrides)));
export const fixtureSummary=buildSearchSummary(fixtureGames,{latitude:32.123456789,longitude:-98.543210987},'browser_location',7,50,'','all')!;

