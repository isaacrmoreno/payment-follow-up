import Link from "next/link";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/clients", label: "Clients" },
  { href: "/invoices", label: "Invoices" },
  { href: "/billing", label: "Billing" },
  { href: "/settings", label: "Settings" },
];

export function Nav() {
  return (
    <nav className="flex flex-wrap gap-2 border-b border-zinc-200 px-6 py-4">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 hover:border-zinc-900 hover:text-zinc-900"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

