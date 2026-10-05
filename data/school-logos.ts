export type SchoolLogo = {
  path: string;
  pickemFilter?: string;
};

export const schoolLogoBySlug: Record<string, SchoolLogo> = {
  albany: { path: "/logos/schools/albany.png" },
  "anson": { path: "/logos/schools/anson.png" },
  "canyon-west-plains": { path: "/logos/schools/canyon-west-plains.png" },
  cisco: { path: "/logos/schools/cisco.png" },
  "clifton": { path: "/logos/schools/clifton.png" },
  comanche: { path: "/logos/schools/comanche.png" },
  crawford: { path: "/logos/schools/crawford.png" },
  "cross-plains": { path: "/logos/schools/cross-plains.png" },
  "de-leon": { path: "/logos/schools/de-leon.png" },
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
