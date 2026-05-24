import Link from "next/link";
import Image from "next/image";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050505]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-24 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-4 transition hover:opacity-90"
        >
          <Image
            src="/logos/varsityvue-logo.png"
            alt="VarsityVue"
            width={82}
            height={82}
            priority
            className="h-16 w-16 object-contain drop-shadow-[0_0_22px_rgba(122,16,34,0.45)]"
          />

          <div className="leading-none">
            <div className="text-[31px] font-black tracking-tight text-white">
              Varsity<span className="text-[#d65a6d]">Vue</span>
            </div>

            <div className="mt-1 text-[10px] font-black uppercase tracking-[0.34em] text-white/45">
              Texas High School Sports
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          <NavLink href="/games" label="Scores" />
          <NavLink href="/schools" label="Schools" />
          <NavLink href="/districts" label="Districts" />
          <NavLink href="/coverage" label="Coverage" />
          <NavLink href="/sponsors" label="Sponsors" />
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/games"
            className="hidden rounded-full border border-[#d65a6d]/30 bg-[#7A1022]/15 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#f3a3af] transition hover:bg-[#7A1022]/25 hover:text-white md:inline-flex"
          >
            Live Scores
          </Link>

          <Link
            href="/schools"
            className="rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            All Schools
          </Link>
        </div>
      </div>

      <div className="h-[2px] bg-gradient-to-r from-transparent via-[#d65a6d] to-transparent" />
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
      className="rounded-full px-4 py-2 text-[12px] font-black uppercase tracking-[0.16em] text-white/60 transition hover:bg-white/[0.07] hover:text-white"
    >
      {label}
    </Link>
  );
}