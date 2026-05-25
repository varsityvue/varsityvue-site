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

  const hubHref = `/schools/${schoolSlug}`;
  const scheduleHref = `/schools/${schoolSlug}/schedule`;
  const districtHref = `/districts/${districtSlug}`;
  const legacyHref = `/legacy`;

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#050505]/92 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1440px] items-center gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
        <NavLink
          href={hubHref}
          label="Hub"
          active={pathname === hubHref}
          theme={theme}
        />

        <NavLink
          href={scheduleHref}
          label="Schedule"
          active={pathname === scheduleHref}
          theme={theme}
        />

        <NavLink
          href={districtHref}
          label="District"
          active={pathname === districtHref}
          theme={theme}
        />

        <NavLink
          href="/scoreboard"
          label="Scores"
          active={pathname === "/scoreboard"}
          theme={theme}
        />

        <NavLink
          href="/coverage"
          label="Coverage"
          active={pathname.startsWith("/coverage")}
          theme={theme}
        />

        <NavLink
          href={legacyHref}
          label="Legacy"
          active={pathname.startsWith("/legacy")}
          theme={theme}
        />

        <div
          className="ml-auto hidden items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] md:flex"
          style={{
            borderColor: `${theme.secondary}33`,
            backgroundColor: `${theme.primary}55`,
            color: theme.secondary,
          }}
        >
          <span
            className="h-2.5 w-2.5 rounded-full shadow-[0_0_14px_rgba(255,255,255,0.25)]"
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
      className="shrink-0 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition"
      style={
        active
          ? {
              borderColor: `${theme.secondary}55`,
              backgroundColor: theme.primary,
              color: theme.secondary,
              boxShadow: `0 0 20px ${theme.primary}55`,
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