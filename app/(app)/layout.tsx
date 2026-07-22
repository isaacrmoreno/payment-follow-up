import { requireUser } from "@/lib/auth";
import { ToastProvider } from "@/components/toast";
import { AppHeader } from "@/components/app-header";
import { OnboardingTour } from "@/components/onboarding-tour";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-white text-zinc-950">
      <ToastProvider>
        <AppHeader email={user.email ?? ""} />
        <OnboardingTour />
        <main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
      </ToastProvider>
    </div>
  );
}
