import { Nav } from "@/components/nav";
import { requireUser } from "@/lib/auth";
import { signOutAction } from "@/app/actions";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-white text-zinc-950">
      <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
        <div>
          <p className="text-sm font-medium">Payment Follow-Up</p>
          <p className="text-xs text-zinc-500">{user.email}</p>
        </div>
        <form action={signOutAction}>
          <button className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm">
            Sign out
          </button>
        </form>
      </header>
      <Nav />
      <main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}

