import Link from "next/link";

const links = [
  { href: "/", label: "Log Score" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/history", label: "History" },
  { href: "/hall-of-fame", label: "Hall of Fame" },
  { href: "/players", label: "Players" },
];

export default function Nav() {
  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <div className="mx-auto flex max-w-3xl items-center gap-6 px-4 py-4">
        <span className="font-bold tracking-tight text-lg">
          <span className="rounded bg-[#6aaa64] px-1.5 py-0.5 text-white mr-1">
            🏆
          </span>
          The Wordle Cup
        </span>
        <nav className="flex gap-4 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-black/70 hover:text-black dark:text-white/70 dark:hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
