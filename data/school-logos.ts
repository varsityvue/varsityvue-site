import type { CSSProperties } from "react";

export type SchoolLogo = {
  path: string;
  pickemFilter?: string;
  optical?: { scale?: number; directoryScale?: number; directoryWidth?: number };
  glow?: "subtle" | "legacy" | "reduced";
};

export const schoolLogoBySlug: Record<string, SchoolLogo> = {
  // Owner-supplied 2A DI collection; canonical catalog slugs retained.
  "abernathy": { path: "/logos/schools/abernathy.png" },
  "amarillo-highland-park": { path: "/logos/schools/amarillo-highland-park.png" },
  "axtell": { path: "/logos/schools/axtell.png" },
  "ballinger": { path: "/logos/schools/ballinger.png" },
  "bosqueville": { path: "/logos/schools/bosqueville.png" },
  "bruceville-eddy": { path: "/logos/schools/bruceville-eddy.png" },
  "como-pickton": { path: "/logos/schools/como-pickton.png" },
  "cooper": { path: "/logos/schools/cooper.png" },
  "corrigan-camden": { path: "/logos/schools/corrigan-camden.png" },
  "dilley": { path: "/logos/schools/dilley.png" },
  "farwell": { path: "/logos/schools/farwell.png", glow: "subtle" },
  "flatonia": { path: "/logos/schools/flatonia.png", glow: "subtle" },
  "floydada": { path: "/logos/schools/floydada.png" },
  "forsan": { path: "/logos/schools/forsan.png" },
  "frankston": { path: "/logos/schools/frankston.png" },
  "freer": { path: "/logos/schools/freer.png" },
  "ganado": { path: "/logos/schools/ganado.png", glow: "subtle" },
  "garrison": { path: "/logos/schools/garrison.png" },
  "gladewater-union-grove": { path: "/logos/schools/gladewater-union-grove.png" },
  "groveton": { path: "/logos/schools/groveton.png" },
  "hawkins": { path: "/logos/schools/hawkins.png" },
  "honey-grove": { path: "/logos/schools/honey-grove.png" },
  "jewett-leon": { path: "/logos/schools/jewett-leon.png", glow: "subtle" },
  "joaquin": { path: "/logos/schools/joaquin.png" },
  "johnson-city-lbj": { path: "/logos/schools/johnson-city-lbj.png" },
  "lovelady": { path: "/logos/schools/lovelady.png" },
  "new-deal": { path: "/logos/schools/new-deal.png" },
  "new-home": { path: "/logos/schools/new-home.png" },
  "olton": { path: "/logos/schools/olton.png" },
  "omaha-pewitt": { path: "/logos/schools/omaha-pewitt.png" },
  "ozona": { path: "/logos/schools/ozona.png" },
  "panhandle": { path: "/logos/schools/panhandle.png" },
  "price-carlisle": { path: "/logos/schools/price-carlisle.png" },
  "refugio": { path: "/logos/schools/refugio.png" },
  "rosebud-lott": { path: "/logos/schools/rosebud-lott.png" },
  "san-augustine": { path: "/logos/schools/san-augustine.png" },
  "sanford-fritch": { path: "/logos/schools/sanford-fritch.png" },
  "shelbyville": { path: "/logos/schools/shelbyville.png" },
  "shiner": { path: "/logos/schools/shiner.png" },
  "sonora": { path: "/logos/schools/sonora.png" },
  "spearman": { path: "/logos/schools/spearman.png", glow: "subtle" },
  "taft": { path: "/logos/schools/taft.png" },
  "thorndale": { path: "/logos/schools/thorndale.png" },
  "tom-bean": { path: "/logos/schools/tom-bean.png" },
  "tulia": { path: "/logos/schools/tulia.png" },
  "waskom": { path: "/logos/schools/waskom.png", glow: "subtle" },
  "weimar": { path: "/logos/schools/weimar.png" },
  "whitewright": { path: "/logos/schools/whitewright.png" },
  "abilene-texas-leadership": { path: "/logos/schools/abilene-texas-leadership.png", optical: { directoryScale: 1.08 } },
  "abilene-wylie": { path: "/logos/schools/abilene-wylie.png" },
  alvord: { path: "/logos/schools/alvord.png" },
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
  muenster: { path: "/logos/schools/muenster.png" },
  navasota: { path: "/logos/schools/nocona.png" },
  nocona: { path: "/logos/schools/navasota.png" },
  "olney": { path: "/logos/schools/olney.png" },
  "peaster": { path: "/logos/schools/peaster.png" },
  "roscoe": { path: "/logos/schools/roscoe.png", optical: { scale: 1.06, directoryScale: 1.1 } },
  "san-saba": { path: "/logos/schools/san-saba.png" },
  "seymour": { path: "/logos/schools/seymour.png" },
  "valley-mills": { path: "/logos/schools/valley-mills.png" },
  "city-view": { path: "/logos/schools/city-view.png" },
  albany: { path: "/logos/schools/albany.png" },
  "anson": { path: "/logos/schools/anson.png", optical: { scale: 1.05, directoryScale: 1.1025 } },
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
  tioga: { path: "/logos/schools/tioga.png" },
  tolar: { path: "/logos/schools/tolar.png", optical: { scale: 1.08 }, glow: "subtle" },
  winters: { path: "/logos/schools/winters.png", optical: { scale: 1.35 } },
  wortham: { path: "/logos/schools/wortham.png", optical: { scale: 1.22 } },
  // Owner-supplied 3A DI collection; approved overlaps retained.
  "anahuac": { path: "/logos/schools/anahuac.png" },
  "atlanta": { path: "/logos/schools/atlanta.png" },
  "bowie": { path: "/logos/schools/bowie.png" },
  "buna": { path: "/logos/schools/buna.png" },
  "bushland": { path: "/logos/schools/bushland.png" },
  "cameron-yoe": { path: "/logos/schools/cameron-yoe.png" },
  "columbus": { path: "/logos/schools/columbus.png" },
  "commerce": { path: "/logos/schools/commerce.png" },
  "dalhart": { path: "/logos/schools/dalhart.png", glow: "subtle" },
  "dallas-life-oak-cliff": { path: "/logos/schools/dallas-life-oak-cliff.png" },
  "denver-city": { path: "/logos/schools/denver-city.png" },
  "devine": { path: "/logos/schools/devine.png" },
  "diboll": { path: "/logos/schools/diboll.png" },
  "edna": { path: "/logos/schools/edna.png", glow: "subtle" },
  "fairfield": { path: "/logos/schools/fairfield.png" },
  "franklin": { path: "/logos/schools/franklin.png", glow: "subtle" },
  "gladewater": { path: "/logos/schools/gladewater.png" },
  "goliad": { path: "/logos/schools/goliad.png", glow: "subtle" },
  "grandview": { path: "/logos/schools/grandview.png", glow: "subtle" },
  "groesbeck": { path: "/logos/schools/groesbeck.png" },
  "gunter": { path: "/logos/schools/gunter.png" },
  "hallettsville": { path: "/logos/schools/hallettsville.png" },
  "hempstead": { path: "/logos/schools/hempstead.png" },
  "hondo": { path: "/logos/schools/hondo.png" },
  "ingram-moore": { path: "/logos/schools/ingram-moore.png" },
  "jourdanton": { path: "/logos/schools/jourdanton.png" },
  "little-river-academy": { path: "/logos/schools/little-river-academy.png" },
  "llano": { path: "/logos/schools/llano.png" },
  "lorena": { path: "/logos/schools/lorena.png" },
  "lyford": { path: "/logos/schools/lyford.png" },
  "malakoff": { path: "/logos/schools/malakoff.png" },
  "marion": { path: "/logos/schools/marion.png" },
  "mathis": { path: "/logos/schools/mathis.png" },
  "mount-vernon": { path: "/logos/schools/mount-vernon.png" },
  "odessa-compass-academy": { path: "/logos/schools/odessa-compass-academy.png", glow: "subtle" },
  "orange-grove": { path: "/logos/schools/orange-grove.png" },
  "orangefield": { path: "/logos/schools/orangefield.png" },
  "palestine-westwood": { path: "/logos/schools/palestine-westwood.png" },
  "paradise": { path: "/logos/schools/paradise.png" },
  "pilot-point": { path: "/logos/schools/pilot-point.png" },
  "raymondville": { path: "/logos/schools/raymondville.png" },
  "rio-hondo": { path: "/logos/schools/rio-hondo.png" },
  "san-diego": { path: "/logos/schools/san-diego.png" },
  "shallowater": { path: "/logos/schools/shallowater.png" },
  "sinton": { path: "/logos/schools/sinton.png" },
  "sweeny": { path: "/logos/schools/sweeny.png" },
  "sweetwater": { path: "/logos/schools/sweetwater.png" },
  "tatum": { path: "/logos/schools/tatum.png" },
  "texarkana-liberty-eylau": { path: "/logos/schools/texarkana-liberty-eylau.png" },
  "trinity": { path: "/logos/schools/trinity.png" },
  "tuscola-jim-ned": { path: "/logos/schools/tuscola-jim-ned.png", glow: "subtle" },
  "universal-city-randolph": { path: "/logos/schools/universal-city-randolph.png" },
  "vernon": { path: "/logos/schools/vernon.png" },
  "wall": { path: "/logos/schools/wall.png" },
  "whitesboro": { path: "/logos/schools/whitesboro.png" },
  "whitney": { path: "/logos/schools/whitney.png", glow: "subtle" },
  "east-chambers": { path: "/logos/schools/east-chambers.png" },
  "winnsboro": { path: "/logos/schools/winnsboro.png" },
  "yoakum": { path: "/logos/schools/yoakum.png" },
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
