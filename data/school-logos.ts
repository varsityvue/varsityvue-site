export type SchoolLogo = {
  path: string;
  pickemFilter?: string;
};

export const schoolLogoBySlug: Record<string, SchoolLogo> = {
  albany: { path: "/logos/schools/albany.png" },
  "canyon-west-plains": { path: "/logos/schools/canyon-west-plains.png" },
  cisco: { path: "/logos/schools/cisco.png" },
  comanche: { path: "/logos/schools/comanche.png" },
  crawford: { path: "/logos/schools/crawford.png" },
  "de-leon": { path: "/logos/schools/de-leon.png" },
  early: { path: "/logos/schools/early.png", pickemFilter: "brightness(1.35) contrast(1.05)" },
  florence: { path: "/logos/schools/florence.png" },
  goldthwaite: { path: "/logos/schools/goldthwaite.png" },
  hawley: { path: "/logos/schools/hawley.png", pickemFilter: "brightness(1.9) contrast(1.08)" },
  hico: { path: "/logos/schools/hico.png" },
  jacksboro: { path: "/logos/schools/jacksboro.png" },
  miles: { path: "/logos/schools/miles.png" },
  post: { path: "/logos/schools/post.png" },
  santo: { path: "/logos/schools/santo-final.webp" },
  stamford: { path: "/logos/schools/stamford.png" },
  stephenville: { path: "/logos/schools/stephenville.png" },
  tolar: { path: "/logos/schools/tolar.png" },
  winters: { path: "/logos/schools/winters.png" },
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
