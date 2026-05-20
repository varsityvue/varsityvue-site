import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-xl font-black tracking-tight text-white transition hover:text-white/80"
        >
          VarsityVue
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <NavLink href="/schools" label="Schools" />
          <NavLink href="/districts" label="Districts" />
          <NavLink href="/games" label="Games" />
          <NavLink href="/coverage" label="Coverage" />
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-white/75 transition hover:bg-white/10 hover:text-white"
    >
      {label}
    </Link>
  );
}