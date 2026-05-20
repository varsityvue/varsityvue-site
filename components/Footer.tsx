import Link from "next/link";
import { Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-start justify-between gap-12">
          <div className="max-w-md">
            <div className="flex items-center gap-3">
              <div className="text-4xl font-black text-[#d65a6d]">V</div>
              <h2 className="text-2xl font-black">VARSITYVUE</h2>
            </div>

            <p className="mt-4 text-sm leading-6 text-white/55">
              Texas high school football coverage, district ecosystems, school
              hubs, matchup pages, and sponsor-driven local sports media.
            </p>

            <div className="mt-5 flex gap-3">
              <Social href="https://x.com/varsityvue" label="X" />
              <Social href="https://instagram.com/varsityvueapp" label="IG" />
              <Social href="https://facebook.com" label="f" />
            </div>
          </div>

          <FooterColumn
            title="Platform"
            links={[
              { href: "/schools", label: "Schools" },
              { href: "/districts", label: "Districts" },
              { href: "/games", label: "Games" },
              { href: "/coverage", label: "Coverage" },
            ]}
          />

          <FooterColumn
            title="Business"
            links={[
              { href: "/sponsors", label: "Sponsors" },
              { href: "/sponsor-inquiry", label: "Become a Sponsor" },
            ]}
          />

          <div className="min-w-[220px]">
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-[#d65a6d]">
              Contact
            </h3>

            <Link
              href="mailto:info@varsityvue.com"
              className="mt-4 flex items-center gap-2 text-sm text-white/70 hover:text-white"
            >
              <Mail size={16} />
              info@varsityvue.com
            </Link>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-xs text-white/40">
          © 2026 VarsityVue. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

function Social({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-xs font-bold text-white/60 hover:text-white"
    >
      {label}
    </Link>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div className="min-w-[130px]">
      <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-[#d65a6d]">
        {title}
      </h3>

      <div className="mt-4 flex flex-col gap-3 text-sm text-white/70">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-white">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}