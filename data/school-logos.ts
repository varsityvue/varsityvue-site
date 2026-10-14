export type SchoolLogo = {
  path: string;
  pickemFilter?: string;
};

export const schoolLogoBySlug: Record<string, SchoolLogo> = {
  "abilene-texas-leadership": { path: "/logos/schools/abilene-texas-leadership.png" },
  "abilene-wylie": { path: "/logos/schools/abilene-wylie.png" },
  "bangs": { path: "/logos/schools/bangs.png" },
  "blooming-grove": { path: "/logos/schools/blooming-grove.png" },
  "brady": { path: "/logos/schools/brady.png" },
  "breckenridge": { path: "/logos/schools/breckenridge.png" },
  "brock": { path: "/logos/schools/brock.png" },
  "brownwood": { path: "/logos/schools/brownwood.png" },
  "burnet": { path: "/logos/schools/burnet.png" },
  "christoval": { path: "/logos/schools/christoval.png" },
  "clyde": { path: "/logos/schools/clyde.png" },
  "coleman": { path: "/logos/schools/coleman.png" },
  "colorado-city": { path: "/logos/schools/colorado-city.png" },
  "granger": { path: "/logos/schools/granger.png" },
  "haskell": { path: "/logos/schools/haskell.png" },
  "henrietta": { path: "/logos/schools/henrietta.png" },
  "holland": { path: "/logos/schools/holland.png" },
  "holliday": { path: "/logos/schools/holliday.png" },
  "itasca": { path: "/logos/schools/itasca.png" },
  "jarrell": { path: "/logos/schools/jarrell.png" },
  "junction": { path: "/logos/schools/junction.png" },
  "lubbock-cooper": { path: "/logos/schools/lubbock-cooper.png" },
  "marble-falls": { path: "/logos/schools/marble-falls.png" },
  "mason": { path: "/logos/schools/mason.png" },
  "meridian": { path: "/logos/schools/meridian.png" },
  "midlothian-heritage": { path: "/logos/schools/midlothian-heritage.png" },
  "moody": { path: "/logos/schools/moody.png" },
  "olney": { path: "/logos/schools/olney.png" },
  "peaster": { path: "/logos/schools/peaster.png" },
  "roscoe": { path: "/logos/schools/roscoe.png" },
  "san-saba": { path: "/logos/schools/san-saba.png" },
  "seymour": { path: "/logos/schools/seymour.png" },
  "valley-mills": { path: "/logos/schools/valley-mills.png" },
  "city-view": { path: "/logos/schools/city-view.png" },
  albany: { path: "/logos/schools/albany.png" },
  "anson": { path: "/logos/schools/anson.png" },
  "canyon-west-plains": { path: "/logos/schools/canyon-west-plains.png" },
  "china-spring": { path: "/logos/schools/china-spring.png" },
  cisco: { path: "/logos/schools/cisco.png" },
  "clifton": { path: "/logos/schools/clifton.png" },
  comanche: { path: "/logos/schools/comanche.png" },
  crawford: { path: "/logos/schools/crawford.png" },
  "cross-plains": { path: "/logos/schools/cross-plains.png" },
  "de-leon": { path: "/logos/schools/de-leon.png" },
  dublin: { path: "/logos/schools/dublin.png" },
  early: { path: "/logos/schools/early.png", pickemFilter: "brightness(1.35) contrast(1.05)" },
  "eastland": { path: "/logos/schools/eastland.png" },
  florence: { path: "/logos/schools/florence.png" },
  frost: { path: "/logos/schools/frost.png" },
  goldthwaite: { path: "/logos/schools/goldthwaite.png" },
  hamilton: { path: "/logos/schools/hamilton.png" },
  hamlin: { path: "/logos/schools/hamlin.png" },
  hawley: { path: "/logos/schools/hawley.png", pickemFilter: "brightness(1.9) contrast(1.08)" },
  hico: { path: "/logos/schools/hico.png" },
  hubbard: { path: "/logos/schools/hubbard.png" },
  jacksboro: { path: "/logos/schools/jacksboro.png" },
  "lampasas": { path: "/logos/schools/lampasas.png" },
  mart: { path: "/logos/schools/mart.png" },
  "merkel": { path: "/logos/schools/merkel.png" },
  miles: { path: "/logos/schools/miles.png" },
  "millsap": { path: "/logos/schools/millsap.png" },
  post: { path: "/logos/schools/post.png" },
  "rio-vista": { path: "/logos/schools/rio-vista.png" },
  santo: { path: "/logos/schools/santo-final.webp" },
  stamford: { path: "/logos/schools/stamford.png" },
  stephenville: { path: "/logos/schools/stephenville.png" },
  tolar: { path: "/logos/schools/tolar.png" },
  winters: { path: "/logos/schools/winters.png" },
  wortham: { path: "/logos/schools/wortham.png" },
};

export function getSchoolLogoPath(schoolSlug: string) {
  return schoolLogoBySlug[schoolSlug]?.path;
}

export function getPickemLogoPath(schoolSlug: string) {
  return schoolLogoBySlug[schoolSlug]
    ? `/logos/schools/pickem/${schoolSlug}.png`
    : undefined;
}

export function getPickemLogoFilter(schoolSlug: string) {
  return schoolLogoBySlug[schoolSlug]?.pickemFilter;
}
