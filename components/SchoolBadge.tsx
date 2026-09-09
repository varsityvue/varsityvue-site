import type { School } from "@/types/platform";

type SchoolBadgeProps = {
  school: School;
  size?: "xs" | "sm" | "md" | "lg";
};

const programLogoBySlug: Record<string, string> = {
  "de-leon": "/logos/schools/de-leon.png",
  cisco: "/logos/schools/cisco.png",
  hico: "/logos/schools/hico.png",
  comanche: "/logos/schools/comanche.png",
  goldthwaite: "/logos/schools/goldthwaite.png",
  albany: "/logos/schools/albany.png",
  stamford: "/logos/schools/stamford.png",
  stephenville: "/logos/schools/stephenville.png",
  santo: "/logos/schools/santo.png",
};

export function getProgramLogoPath(schoolSlug: string) {
  return programLogoBySlug[schoolSlug];
}

const largeLogoClasses = {
  md: "h-28 w-28 sm:h-36 sm:w-36",
  lg: "h-40 w-40 sm:h-52 sm:w-52",
} as const;

const sizeClasses = {
  xs: {
    wrap: "w-20",
    initials: "text-xl",
    initialsLong: "text-base",
    mascot: "text-[7px]",
    mascotLong: "text-[6px]",
    pad: "px-2 py-2",
    stroke: "1px",
    footer: "min-h-7 px-1.5 py-1",
  },
  sm: {
    wrap: "w-16 sm:w-20",
    initials: "text-xl sm:text-2xl",
    initialsLong: "text-base sm:text-xl",
    mascot: "text-[6px] sm:text-[7px]",
    mascotLong: "text-[5px] sm:text-[6px]",
    pad: "px-2 py-2",
    stroke: "1px",
    footer: "min-h-7 px-1.5 py-1",
  },
  md: {
    wrap: "w-36",
    initials: "text-5xl",
    initialsLong: "text-4xl",
    mascot: "text-xs",
    mascotLong: "text-[10px]",
    pad: "px-4 py-4",
    stroke: "2px",
    footer: "min-h-9 px-2 py-1.5",
  },
  lg: {
    wrap: "w-52",
    initials: "text-7xl",
    initialsLong: "text-6xl",
    mascot: "text-sm",
    mascotLong: "text-xs",
    pad: "px-5 py-5",
    stroke: "2px",
    footer: "min-h-10 px-2 py-2",
  },
} as const;

function getInitials(school: School) {
  return (
    school.badgeLabel ??
    school.abbreviation ??
    school.name.slice(0, 2).toUpperCase()
  );
}

function isDarkColor(hex: string) {
  const cleanHex = hex.replace("#", "");

  if (cleanHex.length !== 6) return true;

  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance < 0.45;
}

export default function SchoolBadge({
  school,
  size = "md",
}: SchoolBadgeProps) {
  const programLogo = getProgramLogoPath(school.slug);

  // Large identity treatments should use the official program mark when one
  // is available. Compact xs/sm contexts retain the uniform VarsityVue badge.
  if (programLogo && (size === "md" || size === "lg")) {
    return (
      <div
        className={`${largeLogoClasses[size]} flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/35 p-2 shadow-xl`}
      >
        <img
          src={programLogo}
          alt={`${school.fullName} logo`}
          className="h-full w-full object-contain drop-shadow-xl"
          loading="lazy"
          decoding="async"
        />
      </div>
    );
  }

  const classes = sizeClasses[size];
  const initials = getInitials(school);
  const badgeSubtext = school.badgeSubtext ?? school.mascot;
  const initialsClass =
    initials.length >= 4 ? classes.initialsLong : classes.initials;
  const mascotClass =
    badgeSubtext.length >= 10 ? classes.mascotLong : classes.mascot;

  const subtextColor = isDarkColor(school.colors.secondary)
    ? "#FFFFFF"
    : school.colors.secondary;

  const strokeColor = isDarkColor(school.colors.secondary)
    ? "#FFFFFF"
    : school.colors.secondary;

  return (
    <div className={`${classes.wrap} shrink-0 drop-shadow-2xl`}>
      <div
        className={`relative overflow-hidden rounded-t-3xl border-[3px] ${classes.pad}`}
        style={{
          background:
            "radial-gradient(circle at 30% 18%, rgba(255,255,255,0.2), transparent 34%), linear-gradient(180deg, #151515 0%, #050505 100%)",
          borderColor: "#000000",
          boxShadow:
            "inset 0 2px 8px rgba(255,255,255,0.08), inset 0 -10px 20px rgba(0,0,0,0.35)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(255,255,255,0.6), rgba(255,255,255,0.6) 1px, transparent 1px, transparent 4px)",
          }}
        />

        <div
          className={`relative text-center font-black uppercase leading-none tracking-[-0.04em] ${initialsClass}`}
          style={{
            color: school.colors.primary,
            WebkitTextStroke: `${classes.stroke} ${strokeColor}`,
            textShadow:
              "2px 2px 0 #000, -1px -1px 0 #000, 0 8px 14px rgba(0,0,0,0.75)",
          }}
        >
          {initials}
        </div>
      </div>

      <div
        className={`relative -mt-1 flex items-center justify-center overflow-hidden rounded-b-3xl border-[3px] text-center shadow-xl ${classes.footer}`}
        style={{
          background: "linear-gradient(180deg, #111111 0%, #050505 100%)",
          borderColor: "#000000",
          boxShadow:
            "inset 0 1px 5px rgba(255,255,255,0.05), 0 8px 18px rgba(0,0,0,0.4)",
        }}
      >
        <div
          className={`max-w-full text-balance font-black uppercase leading-[1.05] ${mascotClass}`}
          style={{
            color: subtextColor,
            textShadow: "0 2px 4px rgba(0,0,0,0.75)",
          }}
        >
          {badgeSubtext}
        </div>
      </div>
    </div>
  );
}
