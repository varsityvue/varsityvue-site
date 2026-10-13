"use client";
import NavigationLink from "@/components/NavigationLink";
import { usePathname } from "next/navigation";
import { CalendarDays, UsersRound, Newspaper, Trophy } from "lucide-react";
const items = [
  { href: "/games", label: "Games", Icon: CalendarDays },
  { href: "/schools", label: "Teams", Icon: UsersRound },
  { href: "/coverage", label: "Coverage", Icon: Newspaper },
  { href: "/pickem", label: "Pick ’Em", Icon: Trophy },
];
export default function MobileNavigation() {
  const pathname = usePathname();
  return (
    <nav className="weekly-mobile-nav" aria-label="Mobile navigation">
      {items.map(({ href, label, Icon }) => (
        <NavigationLink
          key={href}
          href={href}
          pendingLabel={label}
          aria-current={
            pathname === href || (href === "/games" && pathname === "/scoreboard") || pathname.startsWith(href + "/")
              ? "page"
              : undefined
          }
        >
          <Icon size={20} aria-hidden="true" />
          <span>{label}</span>
        </NavigationLink>
      ))}
    </nav>
  );
}
