import type { Game } from "@/types/platform";
import { getSchoolBySlug } from "@/lib/schools";
import { getStandingForSchool } from "@/lib/standings";

function formatRecord(wins?: number, losses?: number) {
    return `${wins ?? 0}-${losses ?? 0}`;
}

export function getMatchupPreviewCopy(game: Game) {
    const awaySchool = game.awaySchoolSlug
        ? getSchoolBySlug(game.awaySchoolSlug)
        : undefined;

    const homeSchool = game.homeSchoolSlug
        ? getSchoolBySlug(game.homeSchoolSlug)
        : undefined;

    const awayStanding = game.awaySchoolSlug
        ? getStandingForSchool(game.awaySchoolSlug)
        : undefined;

    const homeStanding = game.homeSchoolSlug
        ? getStandingForSchool(game.homeSchoolSlug)
        : undefined;

    const awayName = awaySchool?.name ?? game.awayTeam ?? "The away team";
    const homeName = homeSchool?.name ?? game.homeTeam ?? "the home team";

    const awayRecord = formatRecord(
        awayStanding?.overallWins,
        awayStanding?.overallLosses
    );

    const homeRecord = formatRecord(
        homeStanding?.overallWins,
        homeStanding?.overallLosses
    );

    if (game.gameType === "scrimmage") {
        return `${awayName} and ${homeName} get an early measuring-stick opportunity before the regular season begins. Expect coaches to test rotations, evaluate depth, and clean up timing before the games start counting.`;
    }

    if (game.districtGame) {
        return `${awayName} enters this district matchup at ${awayRecord}, while ${homeName} comes in at ${homeRecord}. With playoff positioning and district momentum on the line, this game gives both programs a chance to strengthen their place in the race.`;
    }

    if (game.specialEvent) {
        return `${awayName} and ${homeName} meet in a matchup carrying extra attention around ${game.specialEvent}. Beyond the event atmosphere, this is a chance for both teams to build momentum and sharpen their identity.`;
    }

    return `${awayName} and ${homeName} meet in a non-district matchup built around early-season momentum, program pride, and preparation for the games that will define the district race later in the year.`;
}