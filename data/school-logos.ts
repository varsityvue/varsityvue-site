const schoolLogoBySlug: Record<string, string> = {
  albany: "/logos/schools/albany.png",
  "canyon-west-plains": "/logos/schools/canyon-west-plains.png",
  cisco: "/logos/schools/cisco.png",
  comanche: "/logos/schools/comanche.png",
  crawford: "/logos/schools/crawford.png",
  "de-leon": "/logos/schools/de-leon.png",
  early: "/logos/schools/early.png",
  florence: "/logos/schools/florence.png",
  goldthwaite: "/logos/schools/goldthwaite.png",
  hawley: "/logos/schools/hawley.png",
  hico: "/logos/schools/hico.png",
  jacksboro: "/logos/schools/jacksboro.png",
  miles: "/logos/schools/miles.png",
  santo: "/logos/schools/santo-final.webp",
  stamford: "/logos/schools/stamford.png",
  stephenville: "/logos/schools/stephenville.png",
  tolar: "/logos/schools/tolar.png",
  winters: "/logos/schools/winters.png",
};

export function getSchoolLogoPath(schoolSlug: string) {
  return schoolLogoBySlug[schoolSlug];
}
