import Link from "next/link";
import { Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[var(--vv-bg)] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="max-w-md">
            <Link href="/" aria-label="VarsityVue home" className="inline-flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[color:var(--vv-accent)] bg-[var(--vv-primary)] text-3xl font-black text-[var(--vv-accent-soft)]">V</div>
              <div>
                <h2 className="text-2xl font-black">VARSITYVUE</h2>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">Texas HS Football</p>
              </div>
            </Link>
            <p className="mt-4 text-sm leading-6 text-white/55">
              Texas high school football scores, schedules, district standings, school hubs, matchup pages, verified statistics, legacy archives, and community-focused local coverage.
            </p>
            <div className="mt-5 flex gap-3" aria-label="VarsityVue social links">
              <Social href="https://x.com/varsityvue" label="X" accessibleLabel="VarsityVue on X" />
              <Social href="https://instagram.com/varsityvueapp" label="IG" accessibleLabel="VarsityVue on Instagram" />
              <Social href="https://facebook.com/VarsityVue" label="f" accessibleLabel="VarsityVue on Facebook" />
            </div>
          </div>

          <FooterColumn title="Platform" links={[
            { href: "/scoreboard", label: "Scoreboard" },
            { href: "/schools", label: "Schools" },
            { href: "/districts", label: "Districts" },
            { href: "/coverage", label: "Coverage" },
            { href: "/stats", label: "Stats" },
            { href: "/legacy", label: "Legacy" },
          ]} />

          <FooterColumn title="VarsityVue" links={[
            { href: "/about", label: "About" },
            { href: "/contact", label: "Contact" },
            { href: "/school-request", label: "Request a School" },
            { href: "/sponsor-inquiry", label: "Partner With VarsityVue" },
          ]} />

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--vv-accent)]">Contact</h3>
            <Link href="mailto:info@varsityvue.com" className="mt-4 flex items-center gap-2 text-sm text-white/70 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
              <Mail size={16} aria-hidden="true" />
              info@varsityvue.com
            </Link>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 VarsityVue. All rights reserved.</p>
          <p>Built for Texas high school football communities.</p>
        </div>
      </div>
    </footer>
  );
}

function Social({ href, label, accessibleLabel }: { href: string; label: string; accessibleLabel: string }) {
  return (
    <Link href={href} target="_blank" rel="noreferrer" aria-label={accessibleLabel} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-xs font-bold text-white/60 transition hover:border-[color:var(--vv-accent)] hover:bg-[var(--vv-primary)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
      {label}
    </Link>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--vv-accent)]">{title}</h3>
      <div className="mt-4 flex flex-col gap-3 text-sm text-white/70">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">{link.label}</Link>
        ))}
      </div>
    </div>
  );
}
