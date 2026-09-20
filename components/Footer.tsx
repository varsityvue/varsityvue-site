import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[var(--vv-bg)] px-4 py-7 text-white sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-7 sm:gap-10 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="max-w-md">
            <Link
              href="/"
              aria-label="VarsityVue home"
              className="inline-flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:gap-3"
            >
              <Image
                src="/logos/varsityvue-logo.png"
                alt=""
                width={56}
                height={56}
                className="h-11 w-11 shrink-0 object-contain drop-shadow-[0_0_18px_rgba(139,16,32,0.35)] sm:h-12 sm:w-12"
              />
              <div>
                <h2 className="text-xl font-black sm:text-2xl">VARSITY<span className="text-[var(--vv-accent)]">VUE</span></h2>
                <p className="text-[9px] font-black uppercase tracking-[0.24em] text-white/40 sm:text-xs sm:tracking-[0.3em]">
                  Texas HS Football
                </p>
              </div>
            </Link>

            <p className="mt-3 max-w-sm text-xs leading-5 text-white/55 sm:mt-4 sm:text-sm sm:leading-6">
              Texas high school football scores, schedules, district standings, school hubs, matchup pages, verified statistics, legacy archives, and local coverage.
            </p>

            <div className="mt-4 flex gap-2.5 sm:mt-5 sm:gap-3" aria-label="VarsityVue social links">
              <Social href="https://x.com/varsityvue" label="X" accessibleLabel="VarsityVue on X" />
              <Social href="https://instagram.com/varsityvueapp" label="IG" accessibleLabel="VarsityVue on Instagram" />
              <Social href="https://facebook.com/VarsityVue" label="f" accessibleLabel="VarsityVue on Facebook" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-7 md:contents">
            <FooterColumn
              title="Platform"
              links={[
                { href: "/scoreboard", label: "Scoreboard" },
                { href: "/pickem", label: "Pick ’Em" },
                { href: "/schools", label: "Schools" },
                { href: "/districts", label: "Districts" },
                { href: "/coverage", label: "Coverage" },
                { href: "/stats", label: "Stats" },
                { href: "/legacy", label: "Legacy" },
              ]}
            />

            <FooterColumn
              title="VarsityVue"
              links={[
                { href: "/about", label: "About" },
                { href: "/contact", label: "Contact" },
                { href: "/submit", label: "Submit to VarsityVue" },
                { href: "/contributors", label: "Become a Contributor" },
                { href: "/school-request", label: "Request a School" },
                { href: "/sponsor-inquiry", label: "Partner With VarsityVue" },
              ]}
            />
          </div>

          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--vv-accent)] sm:text-xs sm:tracking-[0.3em]">
              Contact
            </h3>
            <Link
              href="mailto:info@varsityvue.com"
              className="mt-3 flex w-fit items-center gap-2 text-xs text-white/70 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:mt-4 sm:text-sm"
            >
              <Mail size={15} aria-hidden="true" />
              info@varsityvue.com
            </Link>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-1.5 border-t border-white/10 pt-4 text-[10px] leading-4 text-white/40 sm:mt-10 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pt-6 sm:text-xs">
          <p>© 2026 VarsityVue. All rights reserved.</p>
          <p>Built for Texas high school football communities.</p>
        </div>
      </div>
    </footer>
  );
}

function Social({ href, label, accessibleLabel }: { href: string; label: string; accessibleLabel: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={accessibleLabel}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-[10px] font-bold text-white/60 transition hover:border-[color:var(--vv-accent)] hover:bg-[var(--vv-primary)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:text-xs"
    >
      {label}
    </Link>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--vv-accent)] sm:text-xs sm:tracking-[0.3em]">
        {title}
      </h3>
      <div className="mt-3 flex flex-col gap-2 text-xs text-white/70 sm:mt-4 sm:gap-3 sm:text-sm">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="w-fit transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
