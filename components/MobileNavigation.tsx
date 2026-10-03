"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, School, Newspaper, Trophy } from "lucide-react";
const items = [
  { href: "/games", label: "Games", Icon: CalendarDays },
  { href: "/schools", label: "Schools", Icon: School },
  { href: "/coverage", label: "Coverage", Icon: Newspaper },
  { href: "/pickem", label: "Pick ’Em", Icon: Trophy },
];
export default function MobileNavigation() {
  const pathname = usePathname();
  return (
    <nav className="weekly-mobile-nav" aria-label="Mobile navigation">
      {items.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={
            pathname === href || (href === "/games" && pathname === "/scoreboard") || pathname.startsWith(href + "/")
              ? "page"
              : undefined
          }
        >
          <Icon size={20} aria-hidden="true" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
