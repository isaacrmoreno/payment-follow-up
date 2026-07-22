import { getUser } from "@/lib/auth";
import { SignInForm } from "@/components/sign-in-form";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-16">
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
            Payment Follow-Up
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
            Get paid faster with simple follow-up.
          </h1>
          <p className="text-sm leading-6 text-zinc-600">
            Sign in with a magic link to manage clients, invoices, and reminder
            links without the noise of a full invoicing suite.
          </p>
        </div>
        <SignInForm />
        <p className="text-xs text-zinc-500">
          By continuing you agree to keep your payment follow-up data in this
          workspace.
        </p>
      </div>
    </main>
  );
}
