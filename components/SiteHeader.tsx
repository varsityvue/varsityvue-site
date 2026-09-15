import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

const navItems = [
  { href: "/scoreboard", label: "Scores" },
  { href: "/schools", label: "Schools" },
  { href: "/districts", label: "Districts" },
  { href: "/coverage", label: "Coverage" },
  { href: "/legacy", label: "Legacy" },
];

const mobileNavItems = navItems.filter((item) => item.href !== "/legacy");

export default async function SiteHeader() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const signedIn = Boolean(claimsData?.claims?.sub);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[var(--vv-bg)]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-3.5 sm:h-24 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="VarsityVue home"
          className="group flex min-w-0 items-center gap-2 transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:gap-4"
        >
          <Image
            src="/logos/varsityvue-logo.png"
            alt=""
            width={82}
            height={82}
            priority
            className="h-10 w-10 shrink-0 object-contain drop-shadow-[0_0_18px_rgba(139,16,32,0.42)] sm:h-16 sm:w-16 sm:drop-shadow-[0_0_22px_rgba(139,16,32,0.45)]"
          />

          <div className="min-w-0 leading-none">
            <div className="truncate text-[21px] font-black tracking-tight text-white sm:text-[31px]">
              VARSITY<span className="text-[var(--vv-accent)]">VUE</span>
            </div>
            <div className="mt-1 hidden text-[10px] font-black uppercase tracking-[0.34em] text-white/45 sm:block">
              Texas HS Football
            </div>
          </div>
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <Link
            href="/scoreboard"
            className="hidden rounded-full border border-[color:var(--vv-accent)] bg-[var(--vv-primary)] px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-[var(--vv-accent-soft)] transition hover:bg-[var(--vv-primary-hover)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 md:inline-flex"
          >
            Scoreboard
          </Link>

          <Link
            href="/schools"
            className="hidden rounded-full border border-white/15 bg-white/[0.06] px-3 py-2 text-[8px] font-black uppercase tracking-[0.1em] text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:inline-flex sm:px-5 sm:py-3 sm:text-xs sm:tracking-[0.16em]"
          >
            All Schools
          </Link>

          {signedIn ? (
            <Link
              href="/account"
              className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-2 text-[8px] font-black uppercase tracking-[0.08em] text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:px-5 sm:py-3 sm:text-xs sm:tracking-[0.14em]"
            >
              Account
            </Link>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/login"
                className="rounded-full px-2 py-2 text-[8px] font-black uppercase tracking-[0.06em] text-white/65 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:border sm:border-white/15 sm:px-4 sm:py-3 sm:text-xs sm:tracking-[0.12em]"
              >
                Log In
              </Link>
              <Link
                href="/login?mode=signup"
                className="rounded-full border border-[color:var(--vv-accent)] bg-[var(--vv-primary)] px-2.5 py-2 text-[8px] font-black uppercase tracking-[0.06em] text-white transition hover:bg-[var(--vv-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:px-4 sm:py-3 sm:text-xs sm:tracking-[0.12em]"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      <nav aria-label="Mobile navigation" className="border-t border-white/10 lg:hidden">
        <div className="mx-auto grid max-w-[1440px] grid-cols-4 px-1.5 py-1 sm:px-5 sm:py-1.5">
          {mobileNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="min-w-0 rounded-full px-1 py-1.5 text-center text-[9px] font-black uppercase tracking-[0.05em] text-white/70 transition hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:px-3 sm:py-2 sm:text-xs sm:tracking-[0.12em]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <div className="h-px bg-gradient-to-r from-transparent via-[var(--vv-accent)] to-transparent sm:h-[2px]" />
    </header>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full px-4 py-2 text-[12px] font-black uppercase tracking-[0.16em] text-white/60 transition hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
    >
      {label}
    </Link>
  );
}
