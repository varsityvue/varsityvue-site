import Link from "next/link";
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
  return (
    <div className="border-b border-white/10 bg-black/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl justify-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <NavLink href={`/schools/${schoolSlug}`} label="Hub" />
        <NavLink href={`/schools/${schoolSlug}/schedule`} label="Schedule" />
        <NavLink href={`/districts/${districtSlug}`} label="District" />
        <NavLink href="/coverage" label="Coverage" />
      </div>

      <div
        className="h-[2px]"
        style={{
          background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`,
        }}
      />
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white/75 transition hover:bg-white/10 hover:text-white"
    >
      {label}
    </Link>
  );
}