import type { Game, MediaLink } from "@/types/platform";

type BroadcastScope = "all" | "home";

export type SchoolBroadcastLink = MediaLink & {
  schoolSlug: string;
  scope: BroadcastScope;
};

const schoolBroadcastRules: SchoolBroadcastLink[] = [
  {
    schoolSlug: "de-leon",
    scope: "all",
    label: "KWBY Bearcat Radio",
    url: "http://kwbyradio.com/de-leon-bearcats/",
    type: "radio",
  },
  {
    schoolSlug: "de-leon",
    scope: "home",
    label: "De Leon on Hudl Fan",
    url: "https://fan.hudl.com/usa/tx/de-leon/organization/7677/de-leon-high-school/schedule",
    type: "stream",
  },
];

export function getSchoolBroadcastLinks(schoolSlug: string) {
  return schoolBroadcastRules.filter((rule) => rule.schoolSlug === schoolSlug);
}

function ruleAppliesToGame(rule: SchoolBroadcastLink, game: Game) {
  const schoolIsHome = game.homeSchoolSlug === rule.schoolSlug;
  const schoolIsAway = game.awaySchoolSlug === rule.schoolSlug;

  if (rule.scope === "home") return schoolIsHome;
  return schoolIsHome || schoolIsAway;
}

export function clearInheritedSchoolBroadcasts(game: Game): Game {
  if (!game.mediaLinks?.length) return game;

  const inheritedRuleKeys = new Set(
    schoolBroadcastRules
      .filter((rule) => ruleAppliesToGame(rule, game))
      .map((rule) => `${rule.type}:${rule.url}`),
  );

  const mediaLinks = game.mediaLinks.filter(
    (link) => !inheritedRuleKeys.has(`${link.type}:${link.url}`),
  );

  return mediaLinks.length > 0
    ? { ...game, mediaLinks }
    : { ...game, mediaLinks: undefined };
}

export function applySchoolBroadcasts(game: Game): Game {
  const canInheritSchoolBroadcasts =
    game.status === "upcoming" || game.status === "live";

  const inheritedLinks = canInheritSchoolBroadcasts
    ? schoolBroadcastRules
        .filter((rule) => ruleAppliesToGame(rule, game))
        .map(({ label, url, type }) => ({ label, url, type }))
    : [];

  const legacyLivestreamLink: MediaLink[] = game.livestreamUrl
    ? [{ label: "Watch Live", url: game.livestreamUrl, type: "stream" }]
    : [];

  const mediaLinks = [
    ...(game.mediaLinks ?? []),
    ...legacyLivestreamLink,
    ...inheritedLinks,
  ].filter(
    (link, index, links) =>
      links.findIndex(
        (candidate) =>
          candidate.url === link.url && candidate.type === link.type,
      ) === index,
  );

  return mediaLinks.length > 0 ? { ...game, mediaLinks } : game;
}
