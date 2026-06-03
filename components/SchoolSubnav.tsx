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
    { href: `/schools/${schoolSlug}`, label: "Hub", active: pathname === `/schools/${schoolSlug}` },
    { href: `/schools/${schoolSlug}/schedule`, label: "Schedule", active: pathname === `/schools/${schoolSlug}/schedule` },
    { href: "/scoreboard", label: "Scores", active: pathname === "/scoreboard" },
    { href: `/districts/${districtSlug}`, label: "Standings", active: pathname === `/districts/${districtSlug}` },
    { href: "/coverage", label: "Coverage", active: pathname.startsWith("/coverage") },
    { href: "/legacy", label: "Legacy", active: pathname.startsWith("/legacy") },
  ];

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#050505]/92 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1440px] items-center gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
        {links.map((link) => (
          <NavLink key={link.href} {...link} theme={theme} />
        ))}

        <div
          className="ml-auto hidden items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] md:flex"
          style={{
            borderColor: `${theme.secondary}33`,
            backgroundColor: `${theme.primary}33`,
            color: "rgba(255,255,255,0.78)",
          }}
        >
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: theme.secondary }}
          />
          School Hub
        </div>
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
      className="shrink-0 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition hover:bg-white/10 hover:text-white"
      style={
        active
          ? {
              borderColor: `${theme.secondary}55`,
              backgroundColor: `${theme.primary}cc`,
              color: theme.secondary,
              boxShadow: `0 0 20px ${theme.primary}44`,
            }
          : {
              borderColor: "rgba(255,255,255,0.08)",
              backgroundColor: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.65)",
            }
      }
    >
      {label}
    </Link>
  );
}