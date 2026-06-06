import { watchPlayers } from "@/data/players";

export function getFeaturedPlayers() {
    return watchPlayers.filter((player) => player.featured);
}

export function getPlayersForSchool(schoolSlug: string) {
    return watchPlayers.filter((player) => player.schoolSlug === schoolSlug);
}