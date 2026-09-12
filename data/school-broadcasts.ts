import type { Game, MediaLink } from "@/types/platform";

type BroadcastScope = "all" | "home";

type SchoolBroadcastRule = MediaLink & {
  schoolSlug: string;
  scope: BroadcastScope;
};

const schoolBroadcastRules: SchoolBroadcastRule[] = [
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

function ruleAppliesToGame(rule: SchoolBroadcastRule, game: Game) {
  const schoolIsHome = game.homeSchoolSlug === rule.schoolSlug;
  const schoolIsAway = game.awaySchoolSlug === rule.schoolSlug;

  if (rule.scope === "home") return schoolIsHome;
  return schoolIsHome || schoolIsAway;
}

export function applySchoolBroadcasts(game: Game): Game {
  const inheritedLinks = schoolBroadcastRules
    .filter((rule) => ruleAppliesToGame(rule, game))
    .map(({ label, url, type }) => ({ label, url, type }));

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
