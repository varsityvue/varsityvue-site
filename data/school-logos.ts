type SchoolLogo = {
  path: string;
  pickemScale?: number;
};

const schoolLogoBySlug: Record<string, SchoolLogo> = {
  albany: { path: "/logos/schools/albany.png" },
  "canyon-west-plains": { path: "/logos/schools/canyon-west-plains.png", pickemScale: 1.15 },
  cisco: { path: "/logos/schools/cisco.png" },
  comanche: { path: "/logos/schools/comanche.png" },
  crawford: { path: "/logos/schools/crawford.png", pickemScale: 1.18 },
  "de-leon": { path: "/logos/schools/de-leon.png" },
  early: { path: "/logos/schools/early.png", pickemScale: 1.22 },
  florence: { path: "/logos/schools/florence.png", pickemScale: 1.2 },
  goldthwaite: { path: "/logos/schools/goldthwaite.png" },
  hawley: { path: "/logos/schools/hawley.png" },
  hico: { path: "/logos/schools/hico.png", pickemScale: 1.25 },
  jacksboro: { path: "/logos/schools/jacksboro.png" },
  miles: { path: "/logos/schools/miles.png" },
  santo: { path: "/logos/schools/santo-final.webp" },
  stamford: { path: "/logos/schools/stamford.png" },
  stephenville: { path: "/logos/schools/stephenville.png" },
  tolar: { path: "/logos/schools/tolar.png" },
  winters: { path: "/logos/schools/winters.png" },
};

export function getSchoolLogoPath(schoolSlug: string) {
  return schoolLogoBySlug[schoolSlug]?.path;
}

export function getPickemLogoScale(schoolSlug: string) {
  return schoolLogoBySlug[schoolSlug]?.pickemScale ?? 1;
}
