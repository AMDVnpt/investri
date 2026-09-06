"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  ["/dashboard", "Dashboard"],
  ["/offerings", "Offerings"],
  ["/investors", "Investors"],
  ["/investments", "Investments"],
  ["/tax-credits", "Tax Credits"],
  ["/projects", "Projects"],
  ["/impact", "Impact"],
  ["/compliance", "Compliance"],
  ["/reports", "Reports"],
  ["/audit", "Audit Log"],
  ["/programs", "Programs"],
] as const;

export function Shell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <main className="min-h-screen">
      <header className="border-b border-hairline px-8 py-5 flex items-center justify-between">
        <div>
          <p className="label">Rhode Island Commerce</p>
          <h1 className="font-display text-3xl">{title}</h1>
        </div>
        <nav className="flex flex-wrap gap-4 text-sm">
          {LINKS.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={pathname.startsWith(href) ? "underline" : "text-navy/70"}
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <section className="px-8 py-10 max-w-6xl">{children}</section>
    </main>
  );
}
