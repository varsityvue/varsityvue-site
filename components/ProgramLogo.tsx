import type { School } from "@/types/platform";
import SchoolBadge from "./SchoolBadge";

type ProgramLogoProps = {
  school: School;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
};

const logoBySlug: Record<string, string> = {
  "de-leon": "/logos/de-leon-bearcats-logo.png",
  cisco: "https://cache.bsnsports.com/comp/sls/get/43/16466?f=jpg&sid=16466&ts=1709573019",
  hico: "https://static.hudl.com/users/prod/9098039_ace5b0fb54b54edc8ab89b736d90cd98.jpg",
  comanche: "https://s3-us-west-2.amazonaws.com/scorestream-team-profile-pictures/15955/20181010210738_647_mascot1280Near.png",
  goldthwaite: "https://assets-us-01.kc-usercontent.com/37044744-256f-009a-8039-e00bdaabaf39/0170227d-29cd-4e45-8748-ad14c20d4acd/Goldthwaite%20CISD.jpg",
  albany: "https://assets.scorebooklive.com/uploads/production/school/37677-v3/image/Albany_Lions_.png",
  stamford: "https://sportshub2-uploads.vnn-prod.zone/files/sites/1085/2018/01/10194433/logo_outline.png",
  stephenville: "https://assets.scorebooklive.com/uploads/production/school/28419/image/Stephenville_Yellowjackets_TX.jpg",
};

const dimensions = {
  xs: "h-20 w-20",
  sm: "h-20 w-20 sm:h-24 sm:w-24",
  md: "h-28 w-28 sm:h-36 sm:w-36",
  lg: "h-40 w-40 sm:h-52 sm:w-52",
} as const;

export function hasProgramLogo(school: School) {
  return Boolean(logoBySlug[school.slug]);
}

export default function ProgramLogo({ school, size = "md", className = "" }: ProgramLogoProps) {
  const src = logoBySlug[school.slug];

  if (!src) return <SchoolBadge school={school} size={size} />;

  return (
    <div
      className={`${dimensions[size]} ${className} flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/35 p-2 shadow-xl`}
    >
      <img
        src={src}
        alt={`${school.fullName} logo`}
        className="h-full w-full object-contain drop-shadow-xl"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
