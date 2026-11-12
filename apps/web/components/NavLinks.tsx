"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Hôm nay" },
  { href: "/growth", label: "Tăng trưởng" },
  { href: "/vaccines", label: "Tiêm chủng" },
];

/** Primary navigation; marks the current page for screen readers and styling. */
export function NavLinks() {
  const pathname = usePathname();
  return (
    <>
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={pathname === link.href ? "page" : undefined}
          className="text-sm text-[var(--muted)] hover:text-[var(--text)] aria-[current=page]:font-medium aria-[current=page]:text-[var(--text)]"
        >
          {link.label}
        </Link>
      ))}
    </>
  );
}
