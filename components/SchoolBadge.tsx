import type { School } from "@/types/platform";

type SchoolBadgeProps = {
  school: School;
  size?: "xs" | "sm" | "md" | "lg";
};

const sizeClasses = {
  xs: {
    wrap: "w-16",
    initials: "text-xl",
    mascot: "text-[7px]",
    pad: "px-2 py-2",
    stroke: "1px",
  },
  sm: {
    wrap: "w-24",
    initials: "text-3xl",
    mascot: "text-[9px]",
    pad: "px-3 py-3",
    stroke: "1px",
  },
  md: {
    wrap: "w-36",
    initials: "text-5xl",
    mascot: "text-xs",
    pad: "px-4 py-4",
    stroke: "2px",
  },
  lg: {
    wrap: "w-52",
    initials: "text-7xl",
    mascot: "text-sm",
    pad: "px-5 py-5",
    stroke: "2px",
  },
} as const;

function getInitials(school: School) {
  return (
    school.badgeLabel ??
    school.abbreviation ??
    school.name.slice(0, 2).toUpperCase()
  );
}

export default function SchoolBadge({
  school,
  size = "md",
}: SchoolBadgeProps) {
  const classes = sizeClasses[size];
  const initials = getInitials(school);

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
          className={`relative text-center font-black uppercase leading-none tracking-tight ${classes.initials}`}
          style={{
            color: school.colors.primary,
            WebkitTextStroke: `${classes.stroke} ${school.colors.secondary}`,
            textShadow:
              "2px 2px 0 #000, -1px -1px 0 #000, 0 8px 14px rgba(0,0,0,0.75)",
          }}
        >
          {initials}
        </div>
      </div>

      <div
        className="relative -mt-1 rounded-b-3xl border-[3px] px-2 py-1.5 text-center shadow-xl"
        style={{
          background: "linear-gradient(180deg, #111111 0%, #050505 100%)",
          borderColor: "#000000",
          boxShadow:
            "inset 0 1px 5px rgba(255,255,255,0.05), 0 8px 18px rgba(0,0,0,0.4)",
        }}
      >
        <div
          className={`font-black uppercase tracking-[0.12em] ${classes.mascot}`}
          style={{
            color: school.colors.secondary,
            textShadow: "0 2px 4px rgba(0,0,0,0.75)",
          }}
        >
          {school.badgeSubtext ?? school.mascot}
        </div>
      </div>
    </div>
  );
}