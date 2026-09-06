"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SchoolTheme } from "../types/school-theme";

type SchoolSubnavProps = {
  schoolSlug: string;
  districtSlug: string;
  theme: SchoolTheme;
};

export default function SchoolSubnav({
  schoolSlug,
  districtSlug,
  theme,
}: SchoolSubnavProps) {
  const pathname = usePathname();

  const links = [
    {
      href: `/schools/${schoolSlug}`,
      label: "Overview",
      active: pathname === `/schools/${schoolSlug}`,
    },
    {
      href: `/schools/${schoolSlug}/schedule`,
      label: "Schedule",
      active: pathname === `/schools/${schoolSlug}/schedule`,
    },
    {
      href: `/schools/${schoolSlug}/roster`,
      label: "Roster",
      active: pathname === `/schools/${schoolSlug}/roster`,
    },
    {
      href: "/scoreboard",
      label: "Scores",
      active: pathname === "/scoreboard",
    },
    {
      href: `/districts/${districtSlug}`,
      label: "Standings",
      active: pathname === `/districts/${districtSlug}`,
    },
    {
      href: "/coverage",
      label: "Coverage",
      active: pathname.startsWith("/coverage"),
    },
  ];

  return (
    <nav aria-label="Team navigation" className="sticky top-0 z-40 border-b border-white/10 bg-[#050505]/95 backdrop-blur-xl">
      <div className="relative mx-auto max-w-[1440px]">
        <div className="flex snap-x snap-mandatory items-center gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-6 lg:px-8">
          {links.map((link) => (
            <NavLink key={link.href} {...link} theme={theme} />
          ))}

          <div
            className="ml-auto hidden shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] md:flex"
            style={{
              borderColor: `${theme.primary}55`,
              backgroundColor: "rgba(0,0,0,0.35)",
              color: "rgba(255,255,255,0.78)",
              boxShadow: `inset 3px 0 0 ${theme.primary}`,
            }}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: theme.secondary }}
            />
            Team Hub
          </div>
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#050505] to-transparent sm:hidden" />
      </div>

      <div
        className="h-[3px]"
        style={{
          background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary}, ${theme.primary})`,
        }}
      />
    </nav>
  );
}

function NavLink({
  href,
  label,
  active,
  theme,
}: {
  href: string;
  label: string;
  active: boolean;
  theme: SchoolTheme;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className="shrink-0 snap-start rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.13em] transition hover:bg-white/10 hover:text-white sm:px-5 sm:py-2.5 sm:text-xs"
      style={
        active
          ? {
              borderColor: `${theme.primary}66`,
              backgroundColor: "rgba(255,255,255,0.09)",
              color: "#FFFFFF",
              boxShadow: `inset 3px 0 0 ${theme.primary}, 0 0 24px ${theme.primary}18`,
            }
          : {
              borderColor: "rgba(255,255,255,0.08)",
              backgroundColor: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.62)",
            }
      }
    >
      {label}
    </Link>
  );
}
