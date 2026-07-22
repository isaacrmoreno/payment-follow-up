"use client";

import { useState } from "react";
import Link from "next/link";
import { signOutAction } from "@/app/actions";
import { usePathname } from "next/navigation";

const links = [
  { href: "/clients", label: "Clients" },
  { href: "/invoices", label: "Invoices" },
  { href: "/templates", label: "Templates" },
];

export function AppHeader({
  email,
}: {
  email: string;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  function isActive(href: string) {
    return href === pathname;
  }

  return (
    <header className="border-b border-zinc-200 bg-white px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Payment Follow-Up</p>
            <p className="text-xs text-zinc-500">{email}</p>
          </div>
          <form action={signOutAction}>
            <button className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm">
              Sign out
            </button>
          </form>
        </div>

        <nav className="hidden flex-wrap gap-2 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={[
                "rounded-md border px-3 py-1.5 text-sm transition",
                isActive(link.href)
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 text-zinc-700 hover:border-zinc-900 hover:text-zinc-900",
              ].join(" ")}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
          >
            Menu
          </button>
          {menuOpen ? (
            <div className="mt-3 grid gap-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={[
                    "rounded-md border px-3 py-2 text-sm transition",
                    isActive(link.href)
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 text-zinc-700 hover:border-zinc-900 hover:text-zinc-900",
                  ].join(" ")}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
