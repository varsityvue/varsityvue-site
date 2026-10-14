import type { CSSProperties } from "react";

export type SchoolLogo = {
  path: string;
  pickemFilter?: string;
  optical?: { scale?: number; directoryScale?: number; directoryWidth?: number };
  glow?: "subtle" | "legacy" | "reduced";
};

export const schoolLogoBySlug: Record<string, SchoolLogo> = {
  "abilene-texas-leadership": { path: "/logos/schools/abilene-texas-leadership.png", optical: { directoryWidth: 76 } },
  "abilene-wylie": { path: "/logos/schools/abilene-wylie.png" },
  "bangs": { path: "/logos/schools/bangs.png" },
  "blooming-grove": { path: "/logos/schools/blooming-grove.png" },
  "brady": { path: "/logos/schools/brady.png" },
  "breckenridge": { path: "/logos/schools/breckenridge.png" },
  "brock": { path: "/logos/schools/brock.png" },
  "brownwood": { path: "/logos/schools/brownwood.png", glow: "legacy" },
  "burnet": { path: "/logos/schools/burnet.png", optical: { scale: 1.06 } },
  "christoval": { path: "/logos/schools/christoval.png" },
  "clyde": { path: "/logos/schools/clyde.png" },
  "coleman": { path: "/logos/schools/coleman.png" },
  "colorado-city": { path: "/logos/schools/colorado-city.png", glow: "legacy" },
  "granger": { path: "/logos/schools/granger.png" },
  "haskell": { path: "/logos/schools/haskell.png" },
  "henrietta": { path: "/logos/schools/henrietta.png" },
  "holland": { path: "/logos/schools/holland.png", optical: { scale: 1.06, directoryScale: 1.08 } },
  "holliday": { path: "/logos/schools/holliday.png" },
  "itasca": { path: "/logos/schools/itasca.png" },
  "jarrell": { path: "/logos/schools/jarrell.png", glow: "legacy" },
  "junction": { path: "/logos/schools/junction.png" },
  "lubbock-cooper": { path: "/logos/schools/lubbock-cooper.png" },
  "marble-falls": { path: "/logos/schools/marble-falls.png", glow: "legacy" },
  "mason": { path: "/logos/schools/mason.png", glow: "legacy" },
  "meridian": { path: "/logos/schools/meridian.png", glow: "subtle" },
  "midlothian-heritage": { path: "/logos/schools/midlothian-heritage.png" },
  "moody": { path: "/logos/schools/moody.png", glow: "reduced" },
  "olney": { path: "/logos/schools/olney.png" },
  "peaster": { path: "/logos/schools/peaster.png" },
  "roscoe": { path: "/logos/schools/roscoe.png", optical: { scale: 1.06, directoryScale: 1.1 } },
  "san-saba": { path: "/logos/schools/san-saba.png" },
  "seymour": { path: "/logos/schools/seymour.png" },
  "valley-mills": { path: "/logos/schools/valley-mills.png" },
  "city-view": { path: "/logos/schools/city-view.png" },
  albany: { path: "/logos/schools/albany.png" },
  "anson": { path: "/logos/schools/anson.png", optical: { scale: 1.05, directoryWidth: 76 } },
  "canyon-west-plains": { path: "/logos/schools/canyon-west-plains.png", optical: { scale: 1.2 } },
  "china-spring": { path: "/logos/schools/china-spring.png", optical: { scale: 1.52 } },
  cisco: { path: "/logos/schools/cisco.png" },
  "clifton": { path: "/logos/schools/clifton.png", glow: "subtle" },
  comanche: { path: "/logos/schools/comanche.png" },
  crawford: { path: "/logos/schools/crawford.png", optical: { scale: 1.2 } },
  "cross-plains": { path: "/logos/schools/cross-plains.png", optical: { scale: 1.4 }, glow: "subtle" },
  "de-leon": { path: "/logos/schools/de-leon.png" },
  dublin: { path: "/logos/schools/dublin.png", optical: { scale: 1.14 } },
  early: { path: "/logos/schools/early.png", glow: "subtle" },
  "eastland": { path: "/logos/schools/eastland.png", optical: { scale: 1.22 } },
  florence: { path: "/logos/schools/florence.png", optical: { scale: 1.45 } },
  frost: { path: "/logos/schools/frost.png", optical: { scale: 1.35 } },
  goldthwaite: { path: "/logos/schools/goldthwaite.png" },
  hamilton: { path: "/logos/schools/hamilton.png" },
  hamlin: { path: "/logos/schools/hamlin.png", optical: { scale: 1.12 } },
  hawley: { path: "/logos/schools/hawley.png", optical: { scale: 1.18 }, glow: "subtle" },
  hico: { path: "/logos/schools/hico.png" },
  hubbard: { path: "/logos/schools/hubbard.png", optical: { scale: 1.5 } },
  jacksboro: { path: "/logos/schools/jacksboro.png" },
  "lampasas": { path: "/logos/schools/lampasas.png", glow: "subtle" },
  mart: { path: "/logos/schools/mart.png", optical: { scale: 1.4 } },
  "merkel": { path: "/logos/schools/merkel.png", optical: { scale: 1.1 } },
  miles: { path: "/logos/schools/miles.png", optical: { scale: 1.1 } },
  "millsap": { path: "/logos/schools/millsap.png", optical: { scale: 1.28 } },
  post: { path: "/logos/schools/post.png" },
  "rio-vista": { path: "/logos/schools/rio-vista.png", optical: { scale: 1.28 } },
  santo: { path: "/logos/schools/santo-final.webp" },
  stamford: { path: "/logos/schools/stamford.png" },
  stephenville: { path: "/logos/schools/stephenville.png" },
  tolar: { path: "/logos/schools/tolar.png", optical: { scale: 1.08, directoryWidth: 76 }, glow: "subtle" },
  winters: { path: "/logos/schools/winters.png", optical: { scale: 1.35 } },
  wortham: { path: "/logos/schools/wortham.png", optical: { scale: 1.22 } },
};

export function getSchoolLogoPath(schoolSlug: string) {
  return schoolLogoBySlug[schoolSlug]?.path;
}

export function getPickemLogoPath(schoolSlug: string) {
  return schoolLogoBySlug[schoolSlug]
    ? `/logos/schools/pickem/${schoolSlug}.png`
    : undefined;
}

// Alpha-based shadows preserve transparent pixels and official RGB artwork.
const logoGlow = {
  subtle: "drop-shadow(0 0 1px rgba(255, 255, 255, 0.65)) drop-shadow(0 0 2px rgba(255, 255, 255, 0.3))",
  legacy: "drop-shadow(0 0 2px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.5))",
  reduced: "drop-shadow(0 0 1px rgba(255, 255, 255, 0.55)) drop-shadow(0 0 2px rgba(255, 255, 255, 0.18))",
} as const;

export function getSchoolLogoImageStyle(schoolSlug: string, surface: "general" | "directory" = "general"): CSSProperties {
  const logo = schoolLogoBySlug[schoolSlug];
  const scale = surface === "directory" ? logo?.optical?.directoryScale ?? logo?.optical?.scale : logo?.optical?.scale;
  return {
    ...(scale ? { transform: `scale(${scale})` } : {}),
    ...(logo?.glow ? { filter: logoGlow[logo.glow] } : {}),
  };
}

export function getDirectoryLogoFrameStyle(schoolSlug: string): CSSProperties {
  const width = schoolLogoBySlug[schoolSlug]?.optical?.directoryWidth;
  return width ? { width } : {};
}

export function getPickemLogoFilter(schoolSlug: string) {
  const logo = schoolLogoBySlug[schoolSlug];
  // Pick 'Em artwork is already optically normalized: apply glow, never the
  // general-image scale. Compose filters here so inline Image styles cannot
  // accidentally suppress the glow (including optimized /_next/image URLs).
  return [logo?.pickemFilter, logo?.glow ? logoGlow[logo.glow] : undefined]
    .filter(Boolean).join(" ") || undefined;
}
