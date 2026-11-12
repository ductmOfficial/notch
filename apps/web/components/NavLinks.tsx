"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon, type IconName } from "./icons";

const LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Hôm nay", icon: "today" },
  { href: "/growth", label: "Tăng trưởng", icon: "growth" },
  { href: "/vaccines", label: "Tiêm chủng", icon: "vaccines" },
  { href: "/settings", label: "Cài đặt", icon: "settings" },
];

const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

/**
 * Primary destinations as an M3 navigation rail (wide screens) or navigation bar (phones):
 * icon in a pill indicator, label below, filled icon for the current page.
 */
export function NavLinks({ variant }: { variant: "rail" | "bar" }) {
  const pathname = usePathname();
  return (
    <ul className={variant === "rail" ? "flex flex-col gap-3" : "grid grid-cols-4"}>
      {LINKS.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              className="group flex flex-col items-center gap-1 py-1 label-medium text-on-surface-variant aria-[current=page]:text-on-surface"
            >
              <span
                className={`state-layer flex h-8 items-center justify-center rounded-full group-aria-[current=page]:bg-secondary-container group-aria-[current=page]:text-on-secondary-container ${
                  variant === "rail" ? "w-14" : "w-16"
                }`}
              >
                <Icon name={link.icon} filled={active} />
              </span>
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
