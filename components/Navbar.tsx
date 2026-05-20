import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/95 text-white backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-6 py-5">
        <Link href="/" className="shrink-0">
          <h1 className="text-2xl font-black tracking-tight">VarsityVue</h1>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            Texas HS Football
          </p>
        </Link>

        <div className="ml-auto flex items-center gap-8">
          <NavLink href="/schools" label="Schools" />
          <NavLink href="/districts" label="Districts" />
          <NavLink href="/games" label="Games" />
          <NavLink href="/coverage" label="Coverage" />
          <NavLink href="/sponsors" label="Sponsors" />
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-sm font-semibold text-white/70 transition hover:text-white"
    >
      {label}
    </Link>
  );
}