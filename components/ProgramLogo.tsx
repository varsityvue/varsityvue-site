import type { School } from "@/types/platform";
import SchoolBadge from "./SchoolBadge";

type ProgramLogoProps = {
  school: School;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
};

const logoBySlug: Record<string, string> = {
  "de-leon": "/logos/schools/de-leon.png",
  cisco: "/logos/schools/cisco.png",
  hico: "/logos/schools/hico.png",
  comanche: "/logos/schools/comanche.png",
  goldthwaite: "/logos/schools/goldthwaite.png",
  albany: "/logos/schools/albany.png",
  stamford: "/logos/schools/stamford.png",
  stephenville: "/logos/schools/stephenville.png",
  santo: "/logos/schools/santo-v2.png",
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
