import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/95 text-white backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0">
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tight sm:text-3xl">
              VarsityVue
            </span>

            <span className="text-[10px] uppercase tracking-[0.35em] text-white/45 sm:text-xs">
              Texas HS Sports
            </span>
          </div>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          <NavLink href="/schools" label="Schools" />
          <NavLink href="/districts" label="Districts" />
          <NavLink href="/games" label="Games" />
          <NavLink href="/coverage" label="Coverage" />
          <NavLink href="/sponsors" label="Sponsors" />

          <button
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white"
            type="button"
          >
            Search
          </button>
        </div>

        <button
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 md:hidden"
          type="button"
          aria-label="Open navigation"
        >
          <div className="space-y-1.5">
            <div className="h-0.5 w-5 rounded bg-white" />
            <div className="h-0.5 w-5 rounded bg-white" />
            <div className="h-0.5 w-5 rounded bg-white" />
          </div>
        </button>
      </div>
    </nav>
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
      className="text-sm font-semibold text-white/70 transition hover:text-white"
    >
      {label}
    </Link>
  );
}