import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export default async function BillingPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, stripe_customer_id")
    .eq("id", user.id)
    .single();
  const { data: subscription } = await supabase
    .from("billing_subscriptions")
    .select("status, current_period_end, cancel_at_period_end, stripe_price_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-lg font-semibold">Billing</h1>
          <span className="inline-flex rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white">
            Pro Ready
          </span>
        </div>
        <p className="text-sm text-zinc-600">
          This is where Pro access will live. The next step is Stripe Checkout
          plus a webhook that flips the user into a paid plan.
        </p>
      </section>
      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">Current Plan</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Upgrade when you’re ready to send more reminders and unlock future automation.
              </p>
            </div>
            <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
              {profile?.plan === "pro" ? "Pro" : "Free"}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-zinc-200 p-3">
              <p className="text-sm font-medium text-zinc-900">Stripe Customer</p>
              <p className="mt-1 break-all text-sm text-zinc-600">
                {profile?.stripe_customer_id ?? "Not connected yet"}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-3">
              <p className="text-sm font-medium text-zinc-900">Subscription Status</p>
              <p className="mt-1 text-sm text-zinc-600">{subscription?.status ?? "none"}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-3">
              <p className="text-sm font-medium text-zinc-900">Price ID</p>
              <p className="mt-1 break-all text-sm text-zinc-600">{subscription?.stripe_price_id ?? "Not set"}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-3">
              <p className="text-sm font-medium text-zinc-900">Cancel At Period End</p>
              <p className="mt-1 text-sm text-zinc-600">{subscription?.cancel_at_period_end ? "Yes" : "No"}</p>
            </div>
          </div>

          <div className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600">
            Stripe Checkout and the customer portal are the only missing pieces before Pro can go live.
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
            >
              Upgrade To Pro
            </button>
            <button
              type="button"
              className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-950"
            >
              Open Customer Portal
            </button>
          </div>
        </div>

        <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold">Launch Checklist</h2>
          <ul className="space-y-3 text-sm text-zinc-600">
            <li className="rounded-lg border border-zinc-200 p-3">
              Create one Stripe product for Pro.
            </li>
            <li className="rounded-lg border border-zinc-200 p-3">
              Add a recurring price and Checkout session route.
            </li>
            <li className="rounded-lg border border-zinc-200 p-3">
              Set up a webhook to store the Stripe customer and subscription in Supabase.
            </li>
            <li className="rounded-lg border border-zinc-200 p-3">
              Turn on the customer portal for plan changes and cancelation.
            </li>
          </ul>
        </section>
      </section>
    </div>
  );
}
