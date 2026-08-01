"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Log Score" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/history", label: "History" },
  { href: "/hall-of-fame", label: "Hall of Fame" },
  { href: "/players", label: "Players" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-lg">
      <div className="mx-auto flex max-w-4xl items-center gap-6 px-4 py-3.5">
        <span className="flex items-center gap-2 text-lg font-bold tracking-tight text-zinc-50">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-base shadow-lg shadow-emerald-500/20">
            🏆
          </span>
          The Wordle Cup
        </span>
        <nav className="flex gap-1 text-sm">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                  active
                    ? "bg-zinc-800 text-zinc-50"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
