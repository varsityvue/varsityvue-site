export function normalizePlayerName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getPlayerId(schoolSlug: string, player: string, season: number) {
  return `${schoolSlug}-${normalizePlayerName(player)}-${season}`;
}
